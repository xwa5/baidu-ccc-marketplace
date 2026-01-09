#!/usr/bin/env node
/**
 * Claude 侧的安装包装器
 *
 * 负责：
 * 1. 启动透明代理（后台）
 * 2. 轮询读取输出并返回 JSON
 * 3. 接收用户输入并传递给代理
 * 4. 管理整个交互流程
 *
 * 命令：
 *   start   - 启动代理并开始安装
 *   check   - 检查状态并返回新输出
 *   answer  - 传递用户答案
 *   stop    - 停止安装
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 工作目录（与代理保持一致）
const WORK_DIR = path.join(os.tmpdir(), 'baidu-ccc-proxy');
const OUTPUT_FILE = path.join(WORK_DIR, 'output.log');
const INPUT_FILE = path.join(WORK_DIR, 'input.txt');
const STATE_FILE = path.join(WORK_DIR, 'state.json');
const CONTROL_FILE = path.join(WORK_DIR, 'control.json');
const LAST_READ_FILE = path.join(WORK_DIR, 'last_read.txt');
class ClaudeWrapper {
    /**
     * 启动代理
     */
    async start() {
        // 检查是否已有代理在运行
        if (this.isProxyRunning()) {
            this.outputJSON({
                success: false,
                error: '代理已在运行中',
                work_dir: WORK_DIR
            });
            return;
        }
        // 确保工作目录存在
        if (!fs.existsSync(WORK_DIR)) {
            fs.mkdirSync(WORK_DIR, { recursive: true });
        }
        // 清空旧文件
        if (fs.existsSync(LAST_READ_FILE)) {
            fs.unlinkSync(LAST_READ_FILE);
        }
        // 启动透明代理（后台）
        const proxyScript = path.join(__dirname, 'transparent-proxy.js');
        const logFile = path.join(WORK_DIR, 'proxy.log');
        const logFd = fs.openSync(logFile, 'w');
        const proxy = spawn('node', [proxyScript], {
            detached: true,
            stdio: ['ignore', logFd, logFd]
        });
        proxy.unref();
        fs.closeSync(logFd);
        // 等待代理启动
        await this.sleep(1000);
        // 检查状态
        const state = this.readState();
        if (state.status === 'starting' || state.status === 'running' || state.status === 'waiting_input') {
            this.outputJSON({
                success: true,
                status: state.status,
                message: '代理已启动',
                work_dir: WORK_DIR,
                proxy_pid: state.pid,
                target_pid: state.target_pid
            });
            // 初始化读取位置
            fs.writeFileSync(LAST_READ_FILE, '0');
        }
        else {
            this.outputJSON({
                success: false,
                error: '代理启动失败',
                state: state
            });
        }
    }
    /**
     * 检查状态并返回新输出
     */
    async check() {
        if (!this.isProxyRunning()) {
            this.outputJSON({
                success: false,
                error: '代理未运行'
            });
            return;
        }
        const state = this.readState();
        const output = this.readNewOutput();
        this.outputJSON({
            success: true,
            status: state.status,
            output: output,
            question: state.question || null,
            exit_code: state.exit_code,
            waiting_input: state.status === 'waiting_input'
        });
    }
    /**
     * 传递用户答案
     */
    async answer(value) {
        if (!this.isProxyRunning()) {
            this.outputJSON({
                success: false,
                error: '代理未运行'
            });
            return;
        }
        const state = this.readState();
        if (state.status !== 'waiting_input') {
            this.outputJSON({
                success: false,
                error: '当前不在等待输入状态',
                current_status: state.status
            });
            return;
        }
        // 写入输入文件
        fs.writeFileSync(INPUT_FILE, value + '\n');
        // 等待状态更新
        await this.sleep(500);
        const newState = this.readState();
        this.outputJSON({
            success: true,
            status: newState.status,
            message: '答案已传递'
        });
    }
    /**
     * 停止代理
     */
    async stop() {
        if (!this.isProxyRunning()) {
            this.outputJSON({
                success: false,
                error: '代理未运行'
            });
            return;
        }
        // 写入停止命令
        fs.writeFileSync(CONTROL_FILE, JSON.stringify({ command: 'stop' }));
        // 等待停止
        await this.sleep(1000);
        this.outputJSON({
            success: true,
            message: '代理已停止'
        });
    }
    /**
     * 读取状态文件
     */
    readState() {
        try {
            if (fs.existsSync(STATE_FILE)) {
                return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            }
        }
        catch (err) {
            // 忽略
        }
        return { status: 'unknown' };
    }
    /**
     * 读取新输出（从上次读取位置开始）
     */
    readNewOutput() {
        try {
            if (!fs.existsSync(OUTPUT_FILE)) {
                return '';
            }
            // 读取上次位置
            let lastPos = 0;
            if (fs.existsSync(LAST_READ_FILE)) {
                lastPos = parseInt(fs.readFileSync(LAST_READ_FILE, 'utf8') || '0');
            }
            // 读取文件
            const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
            const newContent = content.substring(lastPos);
            // 更新位置
            fs.writeFileSync(LAST_READ_FILE, content.length.toString());
            return newContent;
        }
        catch (err) {
            console.error('Error reading output:', err);
            return '';
        }
    }
    /**
     * 检查代理是否在运行
     */
    isProxyRunning() {
        const state = this.readState();
        if (!state.pid)
            return false;
        try {
            // 检查进程是否存在
            process.kill(state.pid, 0);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * 输出 JSON
     */
    outputJSON(data) {
        console.log(JSON.stringify(data, null, 2));
    }
    /**
     * 睡眠
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const wrapper = new ClaudeWrapper();
    switch (command) {
        case 'start':
            await wrapper.start();
            break;
        case 'check':
            await wrapper.check();
            break;
        case 'answer':
            if (!args[1]) {
                console.error('错误: answer 命令需要提供答案值');
                process.exit(1);
            }
            await wrapper.answer(args[1]);
            break;
        case 'stop':
            await wrapper.stop();
            break;
        default:
            console.error(`未知命令: ${command}`);
            console.error('可用命令: start, check, answer <value>, stop');
            process.exit(1);
    }
}
// 运行
main().catch(err => {
    console.error('发生错误:', err.message);
    process.exit(1);
});
