# 百度 CCC 源代码

TypeScript 源代码目录，编译后的 JavaScript 文件输出到 `../baidu-ccc/scripts/`。

## 目录结构

```
baidu-ccc-source/
├── src/
│   ├── claude-install-wrapper.ts    # Claude 侧包装器
│   └── transparent-proxy.ts         # 透明代理
├── package.json
├── tsconfig.json
└── README.md
```

## 开发流程

### 安装依赖

```bash
npm install
```

### 编译代码

```bash
npm run build
```

编译后的文件会输出到 `../baidu-ccc/scripts/` 目录。

### 文件说明

#### claude-install-wrapper.ts

Claude 侧的客户端包装器，负责：
- 启动和管理 transparent-proxy 后台进程
- 轮询读取输出日志（增量读取）
- 接收用户输入并传递给代理
- 返回 JSON 格式的状态信息

**提供的命令：**
- `start` - 启动代理并开始安装
- `check` - 检查状态并返回新输出
- `answer <value>` - 传递用户答案
- `stop` - 停止安装

#### transparent-proxy.ts

透明代理层，负责：
- 启动 `baidu-ccc-dev install` 子进程
- 实时捕获并记录所有输出（stdout/stderr）
- 智能检测等待输入的提示（多种模式）
- 从文件读取用户输入并传递给子进程
- 维护进程状态

**工作目录：** `/tmp/baidu-ccc-proxy/`
- `output.log` - 输出日志
- `input.txt` - 用户输入
- `state.json` - 状态信息
- `control.json` - 控制命令

## TypeScript 特性

- ✅ 严格类型检查
- ✅ 完整的接口定义
- ✅ ES2022 模块
- ✅ 详细的类型注解
- ✅ 编译到 ES2022

## 架构说明

```
Claude (commands/install.md)
    ↓ 调用
claude-install-wrapper.js (客户端)
    ↓ 管理
transparent-proxy.js (代理层)
    ↓ 控制
baidu-ccc-dev install (实际工具)
```

### 通信机制

- **命令通信**：通过命令行参数（start/check/answer/stop）
- **状态传递**：通过 JSON 文件（state.json）
- **输出传递**：通过日志文件（output.log）
- **输入传递**：通过文本文件（input.txt）

### 关键特性

1. **增量读取输出**：使用 `last_read.txt` 记录读取位置，避免重复传输
2. **智能问题检测**：多种模式匹配 + 超时兜底检测
3. **后台持续运行**：使用 `detached: true` 和 `unref()` 让代理独立运行
4. **文件通信机制**：简单可靠，便于调试

## 维护说明

1. **修改代码**：只需修改 `src/*.ts` 文件
2. **重新编译**：运行 `npm run build`
3. **测试验证**：编译后的 JS 文件会自动覆盖到 `../baidu-ccc/scripts/`
4. **版本控制**：
   - TypeScript 源码在 `baidu-ccc-source/src/`
   - 编译产物在 `baidu-ccc/scripts/`
   - 两个目录都需要提交到 Git

## 注意事项

- 编译产物会覆盖 `../baidu-ccc/scripts/` 下的同名文件
- 确保生成的 JS 文件有可执行权限
- Shebang (`#!/usr/bin/env node`) 会被保留在编译后的文件中
- 使用 ES Module (import/export)，不是 CommonJS
