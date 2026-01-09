#!/usr/bin/env node
/**
 * 透明代理 - 在 Claude 和 baidu-ccc-dev install 之间建立透明通信
 *
 * 功能：
 * 1. 启动 baidu-ccc-dev install 进程
 * 2. 实时捕获并记录所有输出
 * 3. 检测等待输入的提示
 * 4. 从文件读取用户输入并传递给进程
 * 5. 管理进程状态
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// 工作目录
const WORK_DIR = path.join(os.tmpdir(), 'baidu-ccc-proxy');
const OUTPUT_FILE = path.join(WORK_DIR, 'output.log');
const INPUT_FILE = path.join(WORK_DIR, 'input.txt');
const STATE_FILE = path.join(WORK_DIR, 'state.json');
const CONTROL_FILE = path.join(WORK_DIR, 'control.json');
class TransparentProxy {
    proc = null;
    buffer = '';
    outputLines = [];
    waitingForInput = false;
    lastOutputTime = Date.now();
    inputWatchInterval = null;
    timeoutCheckInterval = null;
    async start() {
        console.error('[Proxy] Starting transparent proxy...');
        // 确保工作目录存在
        if (!fs.existsSync(WORK_DIR)) {
            fs.mkdirSync(WORK_DIR, { recursive: true });
            console.error('[Proxy] Created work directory:', WORK_DIR);
        }
        // 清空旧文件
        fs.writeFileSync(OUTPUT_FILE, '');
        fs.writeFileSync(INPUT_FILE, '');
        this.updateState({
            status: 'starting',
            pid: process.pid,
            start_time: new Date().toISOString()
        });
        console.error('[Proxy] Spawning baidu-ccc-dev install...');
        // 启动目标进程
        this.proc = spawn('baidu-ccc-dev', ['install'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });
        console.error('[Proxy] Process spawned with PID:', this.proc.pid);
        // 监听标准输出
        this.proc.stdout?.on('data', (data) => {
            this.handleOutput(data, 'stdout');
        });
        // 监听标准错误
        this.proc.stderr?.on('data', (data) => {
            this.handleOutput(data, 'stderr');
        });
        // 监听进程退出
        this.proc.on('exit', (code, signal) => {
            console.error('[Proxy] Process exited with code:', code, 'signal:', signal);
            this.cleanup();
            this.updateState({
                status: 'completed',
                exit_code: code,
                signal: signal,
                end_time: new Date().toISOString()
            });
            // 停止监听
            if (this.inputWatchInterval)
                clearInterval(this.inputWatchInterval);
            if (this.timeoutCheckInterval)
                clearInterval(this.timeoutCheckInterval);
            process.exit(code || 0);
        });
        this.proc.on('error', (err) => {
            console.error('[Proxy] Process error:', err);
            this.updateState({
                status: 'error',
                error: err.message
            });
        });
        // 更新状态为运行中
        this.updateState({
            status: 'running',
            target_pid: this.proc.pid
        });
        // 开始监听输入文件
        this.watchInputFile();
        // 开始超时检测
        this.startTimeoutDetection();
        // 监听控制命令
        this.watchControlFile();
        console.error('[Proxy] Proxy started successfully');
    }
    handleOutput(data, source) {
        const text = data.toString();
        const now = Date.now();
        // 立即写入日志文件（保持原始格式）
        fs.appendFileSync(OUTPUT_FILE, text);
        // 添加到缓冲区
        this.buffer += text;
        this.lastOutputTime = now;
        // 按行分割（用于状态追踪）
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.trim()) {
                this.outputLines.push({
                    content: line,
                    source: source,
                    time: now
                });
            }
        }
        // 日志输出（调试用）
        console.error(`[Proxy] [${source}]`, text.substring(0, 100));
        // 检测是否在等待输入
        if (!this.waitingForInput) {
            const detected = this.detectQuestion(text);
            if (detected) {
                console.error('[Proxy] Question detected:', detected);
                this.waitingForInput = true;
                this.updateState({
                    status: 'waiting_input',
                    question: detected,
                    output_lines: this.outputLines.length,
                    buffer_tail: this.buffer.slice(-500)
                });
            }
        }
    }
    detectQuestion(text) {
        // 多种问题模式检测
        const patterns = [
            // 模式1: ? 问题文本
            { regex: /\?\s*([^\n]+?)[:：]\s*$/m, type: 'question' },
            // 模式2: 包含选项的问题 (1) xxx (2) xxx
            { regex: /\?\s*(.+?)[:：]?\s*\n.*?\d+\)/, type: 'choice' },
            // 模式3: Yes/No 问题
            { regex: /\?\s*(.+?)\s*\(([YyNn])\/([YyNn])\)/, type: 'yesno' },
            // 模式4: 如何处理
            { regex: /(如何处理|请选择|请输入)/, type: 'prompt' }
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                return {
                    type: pattern.type,
                    text: match[1] || match[0],
                    raw: text
                };
            }
        }
        return null;
    }
    startTimeoutDetection() {
        // 超时检测：如果一段时间没有新输出，且缓冲区包含问号，可能在等待输入
        this.timeoutCheckInterval = setInterval(() => {
            if (this.waitingForInput)
                return;
            const elapsed = Date.now() - this.lastOutputTime;
            // 2秒没有新输出，且缓冲区包含问题特征
            if (elapsed > 2000 && this.buffer.length > 0) {
                if (this.buffer.includes('?') || this.buffer.includes('请')) {
                    console.error('[Proxy] Timeout detection: possible input waiting');
                    const detected = this.detectQuestion(this.buffer);
                    if (detected) {
                        this.waitingForInput = true;
                        this.updateState({
                            status: 'waiting_input',
                            question: detected,
                            detected_by: 'timeout',
                            output_lines: this.outputLines.length
                        });
                    }
                }
            }
        }, 1000);
    }
    watchInputFile() {
        let lastMtime = 0;
        this.inputWatchInterval = setInterval(() => {
            if (!this.waitingForInput)
                return;
            try {
                const stats = fs.statSync(INPUT_FILE);
                if (stats.mtimeMs > lastMtime && stats.size > 0) {
                    lastMtime = stats.mtimeMs;
                    // 读取输入
                    const input = fs.readFileSync(INPUT_FILE, 'utf8').trim();
                    if (input) {
                        console.error('[Proxy] Received input:', input);
                        // 传递给进程
                        this.proc?.stdin?.write(input + '\n');
                        // 清空输入文件
                        fs.writeFileSync(INPUT_FILE, '');
                        // 重置状态
                        this.waitingForInput = false;
                        this.buffer = ''; // 清空缓冲区
                        this.updateState({
                            status: 'running',
                            last_input: input,
                            last_input_time: new Date().toISOString()
                        });
                    }
                }
            }
            catch (err) {
                // 文件不存在或读取失败，忽略
                if (err.code !== 'ENOENT') {
                    console.error('[Proxy] Error watching input file:', err);
                }
            }
        }, 200);
    }
    watchControlFile() {
        let lastMtime = 0;
        setInterval(() => {
            try {
                if (!fs.existsSync(CONTROL_FILE))
                    return;
                const stats = fs.statSync(CONTROL_FILE);
                if (stats.mtimeMs <= lastMtime)
                    return;
                lastMtime = stats.mtimeMs;
                const control = JSON.parse(fs.readFileSync(CONTROL_FILE, 'utf8'));
                if (control.command === 'stop') {
                    console.error('[Proxy] Received stop command');
                    this.proc?.kill('SIGTERM');
                    fs.unlinkSync(CONTROL_FILE);
                }
            }
            catch (err) {
                console.error('[Proxy] Error watching control file:', err);
            }
        }, 500);
    }
    updateState(state) {
        const currentState = this.readState();
        const newState = { ...currentState, ...state };
        fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
    }
    readState() {
        try {
            if (fs.existsSync(STATE_FILE)) {
                return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            }
        }
        catch (err) {
            console.error('[Proxy] Error reading state:', err);
        }
        return { status: 'unknown' };
    }
    cleanup() {
        console.error('[Proxy] Cleaning up...');
        // 保留日志和状态文件供调试
        // 只删除输入和控制文件
        try {
            if (fs.existsSync(INPUT_FILE))
                fs.unlinkSync(INPUT_FILE);
            if (fs.existsSync(CONTROL_FILE))
                fs.unlinkSync(CONTROL_FILE);
        }
        catch (err) {
            console.error('[Proxy] Cleanup error:', err);
        }
    }
}
// 主函数
async function main() {
    const proxy = new TransparentProxy();
    await proxy.start();
}
// 错误处理
process.on('uncaughtException', (err) => {
    console.error('[Proxy] Uncaught exception:', err);
    fs.writeFileSync(STATE_FILE, JSON.stringify({
        status: 'error',
        error: err.message,
        stack: err.stack
    }, null, 2));
    process.exit(1);
});
process.on('SIGTERM', () => {
    console.error('[Proxy] Received SIGTERM');
    process.exit(0);
});
// 运行
main().catch(err => {
    console.error('[Proxy] Fatal error:', err);
    process.exit(1);
});
