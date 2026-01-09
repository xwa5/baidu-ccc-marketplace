# Baidu CCC Marketplace

百度 Coding Config 插件的 Claude Code Marketplace。采用 Monorepo 架构，包含插件和 TypeScript 源码。

## 项目简介

这是一个 Claude Code Plugin Marketplace，用于发布和管理百度团队的 Claude 插件：

- **架构模式**：Monorepo - 插件和源码在同一仓库
- **当前插件**：baidu-ccc（团队配置同步工具）
- **开发语言**：TypeScript → JavaScript

## 项目结构

```
baidu-ccc-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace 配置
├── baidu-ccc/                    # 插件（发布版本）
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── commands/                 # 斜杠命令
│   ├── skills/                   # 智能助手
│   ├── scripts/                  # JS 脚本（从源码编译）
│   └── README.md
├── baidu-ccc-source/             # TypeScript 源码
│   ├── src/
│   │   ├── claude-install-wrapper.ts
│   │   └── transparent-proxy.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md                     # 本文件
```

### 构建流程

```
baidu-ccc-source/src/*.ts
       ↓ npm run build
baidu-ccc/scripts/*.js
       ↓ 提交到 Git
用户通过 Marketplace 安装
```

**关键点**：
- `baidu-ccc-source/` 包含 TypeScript 源码（仅开发时需要）
- `baidu-ccc/scripts/` 包含编译后的 JS 文件（用户安装的版本）
- 两个目录都需要提交到 Git

## 快速开始（用户）

### 安装插件

```bash
# 步骤 1：添加 Marketplace
/plugin marketplace add https://github.com/xwa5/baidu-ccc-marketplace.git

# 步骤 2：安装 baidu-ccc 插件
/plugin install baidu-ccc@baidu-ccc-marketplace
```

### 验证安装

```bash
# 查看已安装的插件
/plugin

# 测试命令
/baidu-ccc:status
```

### 使用插件

插件提供两种使用方式：

**斜杠命令**：
```bash
/baidu-ccc:install   # 安装/更新团队配置
/baidu-ccc:status    # 查看配置状态
```

**自然语言**：
```
"帮我安装团队的 Claude 配置"
"查看我的配置状态"
```

**详细文档**：查看 [baidu-ccc/README.md](baidu-ccc/README.md)

### 前置要求

使用前需安装 CLI 工具：

```bash
npm install -g baidu-ccc-dev
```

## 开发指南（开发者）

### 本地开发环境

```bash
# 克隆仓库
git clone https://github.com/xwa5/baidu-ccc-marketplace.git
cd baidu-ccc-marketplace

# 安装源码依赖
cd baidu-ccc-source
npm install
```

### 修改和编译源码

```bash
# 1. 修改 TypeScript 源码
cd baidu-ccc-source
# 编辑 src/*.ts 文件

# 2. 编译到插件目录
npm run build
# 输出：../baidu-ccc/scripts/*.js

# 3. 提交更改
git add baidu-ccc-source/ baidu-ccc/scripts/
git commit -m "update: 描述你的修改"
```

### 本地测试

```bash
# 添加本地 Marketplace
/plugin marketplace add /path/to/baidu-ccc-marketplace

# 安装插件
/plugin install baidu-ccc@baidu-ccc-marketplace

# 测试功能
/baidu-ccc:install
```

### 发布更新

```bash
# 1. 更新版本号
# 编辑 baidu-ccc/.claude-plugin/plugin.json

# 2. 提交并推送
git add .
git commit -m "release: v1.x.x"
git push origin main

# 3. 用户更新
/plugin marketplace update baidu-ccc-marketplace
/plugin install baidu-ccc@baidu-ccc-marketplace
```

## 包含的插件

### baidu-ccc

**功能**：百度团队 Coding Config 管理工具

**版本**：1.0.0

**命令**：
- `/baidu-ccc:install` - 安装/更新团队配置
- `/baidu-ccc:status` - 查看配置状态

**智能助手**：
- `baidu-ccc-helper` - 自然语言识别配置同步需求

**详细文档**：[baidu-ccc/README.md](baidu-ccc/README.md)

## TypeScript 源码说明

### 架构

```
Claude (commands/install.md)
    ↓ 调用
claude-install-wrapper.js (客户端)
    ↓ 管理
transparent-proxy.js (代理层)
    ↓ 控制
baidu-ccc-dev install (CLI 工具)
```

### 文件说明

**claude-install-wrapper.ts**：
- 启动和管理后台代理进程
- 轮询读取输出（增量读取）
- 接收并传递用户输入
- 返回 JSON 状态信息

**transparent-proxy.ts**：
- 启动 `baidu-ccc-dev install` 子进程
- 实时捕获并记录输出
- 智能检测等待输入的提示
- 从文件读取用户输入并传递
- 维护进程状态

**详细说明**：[baidu-ccc-source/README.md](baidu-ccc-source/README.md)

## 贡献指南

1. **Fork 仓库**
2. **创建分支**：`git checkout -b feature/your-feature`
3. **修改源码**：在 `baidu-ccc-source/src/` 中修改
4. **编译测试**：`npm run build` 并本地测试
5. **提交代码**：提交源码和编译产物
6. **创建 PR**

## 常见问题

### 为什么有两个目录？

- **baidu-ccc-source/**：TypeScript 源码，便于开发和维护
- **baidu-ccc/**：编译后的插件，用户安装的版本

分离源码和产物，保持插件目录干净，用户无需关心 TypeScript。

### 修改代码后需要做什么？

1. 在 `baidu-ccc-source/src/` 修改 TS 源码
2. 运行 `npm run build` 编译
3. 提交源码和编译产物（两个目录都要提交）

### 如何添加新插件？

1. 在根目录创建插件目录（如 `my-plugin/`）
2. 添加 `.claude-plugin/plugin.json` 和插件内容
3. 在 `.claude-plugin/marketplace.json` 中注册
4. 提交到 Git

## 相关链接

- [baidu-ccc 插件文档](baidu-ccc/README.md)
- [TypeScript 源码说明](baidu-ccc-source/README.md)
- [baidu-ccc-dev CLI 工具](https://github.com/xwa5/baidu-ccc-dev)
- [Claude Code Plugins 文档](https://code.claude.com/docs/en/plugins.md)
- [Plugin Marketplaces 文档](https://code.claude.com/docs/en/plugin-marketplaces.md)

## 许可证

MIT
