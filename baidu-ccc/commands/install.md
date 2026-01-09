---
description: 安装百度团队的 Coding Config 配置
allowed-tools: ["Bash(npm:*)", "Bash(baidu-ccc-dev:*)", "Bash(node:*)", "Bash(${CLAUDE_PLUGIN_ROOT}/scripts/claude-install-wrapper.js)", "AskUserQuestion"]
---

# 安装 Coding Config

帮助用户安装百度团队的 Coding Config 配置。

---

## ⚠️ 核心原则

**1. 静默执行所有命令：**
- 所有 Bash 命令直接后台执行，不展示命令文本、不展示 JSON 输出、不询问用户
- 所有问题展示与baidu-ccc-dev工具输出内容的展示格式相同，不要猜测用户意图，为用户做决定，所有需要用户输入的内容只能由用户决定

**2. 持续循环直到完成：**
- 不要在第一次或第二次回答后就停止，通常需要 3-5 次或更多交互
- 不要相信 answer 命令返回的 status，每次 answer 后忽略返回值，继续循环检查
- 只有 check 命令确认 completed 且日志显示安装完成才结束

**3. 用户体验：**
- 不展示技术细节（代理、包装器、JSON、PID 等）
- 保持简洁自然的交互流程

## 实现流程

### 步骤 1：检查依赖工具

静默检查 baidu-ccc-dev 是否已安装：

```bash
baidu-ccc-dev --version 2>&1
```

- 已安装：继续下一步
- 未安装：说"正在安装必要工具..."，然后执行：
  ```bash
  npm install -g baidu-ccc-dev
  ```

### 步骤 2：启动安装进程

静默启动后台进程：

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/claude-install-wrapper.js" start
```

处理返回：
- `success: true`：说"开始安装..."
- `success: false`：提取 error 并展示

### 步骤 3：交互循环

持续循环直到安装完成（通常需要多次用户交互）。

#### 3.1 检查状态

每次循环执行：

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/claude-install-wrapper.js" check
```

返回 JSON 包含：`status`、`output`、`waiting_input`、`question`、`exit_code`。

**处理优先级：**
1. 如果有 `output` → 清理并展示（去除 ANSI 控制字符，保留关键内容）
2. 如果 `waiting_input: true` → 处理用户输入（步骤 3.2）
3. 如果 `status: "running"` → 等待 1-2 秒后继续循环
4. 如果 `status: "completed"` 且日志确认完成 → 跳到步骤 3.3
5. 默认：等待 1 秒后继续循环

#### 3.2 处理用户输入

当 `waiting_input` 为 true：

1. 分析输出内容，识别问题类型（选项、Yes/No、文本输入）
2. 使用 AskUserQuestion 询问用户
3. 获取答案后，静默传递：
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/claude-install-wrapper.js" answer "<用户答案>"
   ```
4. **关键：忽略 answer 返回的 status，等待 2 秒后必须继续循环到 3.1**

答案映射：选项传递数字（"1"/"2"），Yes/No 传递（"Y"/"n"），路径原样传递。

#### 3.3 处理完成

当 `status: "completed"`：

1. 静默读取完整日志（仅用于提取结果）：
   ```bash
   tail -100 /var/folders/*/T/baidu-ccc-proxy/output.log
   ```

2. 根据 `exit_code` 展示结果：
   - **成功（0）**：提取安装位置、已安装脚本、PATH 配置，展示成功消息
   - **失败（≠0）**：提取错误信息，给出解决建议

当 `status: "error"`：提取错误信息并展示。

## 输出示例

理想的用户交互流程：

```
开始安装...

? 请选择配置级别:
  1) 个人级 (/Users/xxx/.claude)
  2) 项目级 (当前目录或指定路径)

[用户选择：个人级]

正在下载配置...

检测到 2 个冲突文件:
  - skills/code-review/README.md
  - skills/code-review/SKILL.md

? 是否查看文件差异？ (Y/n)

[用户选择：是]

[展示差异内容...]

? 文件 "skills/code-review/README.md" 如何处理？
  1) 保留本地版本
  2) 保留远程版本

[用户选择：保留远程版本]

? 文件 "skills/code-review/SKILL.md" 如何处理？
  1) 保留本地版本
  2) 保留远程版本

[用户选择：保留远程版本]

正在同步配置...

✅ 安装完成！

配置已安装到 /Users/xxx/.claude
已安装全局脚本: continuous_claude

PATH 配置：
请确保 ~/.local/bin 在你的 PATH 中。

你可以使用 /baidu-ccc:status 查看配置详情。
```

## 实现要点

**静默执行：**
- 所有 Bash 命令直接后台执行，不展示命令文本和 JSON 输出
- 只提取并展示用户关心的内容

**循环控制：**
- 通常需要 3-5 次或更多交互，不要过早停止
- answer 后忽略返回值，继续循环到 check
- 只有 check 确认 completed 且日志显示完成才退出

**输出处理：**
- 清理 ANSI 控制字符，保留关键内容（问题、选项、差异）
- 转换为用户友好的格式

**答案映射：**
- 选项 → 数字（"1"/"2"）
- Yes/No → 字母（"Y"/"n"）
- 路径 → 原样传递
