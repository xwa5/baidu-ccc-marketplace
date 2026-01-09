# Baidu CCC Plugin

让 Claude 智能管理团队的统一配置（Commands、Skills、Scripts、Hooks）。

## 核心价值

- **团队配置统一**：一键同步团队共享的 Claude 配置
- **智能识别**：自然语言即可触发配置同步
- **冲突处理**：自动检测并引导解决配置冲突
- **双重使用**：斜杠命令或自然语言交互

## 前置要求

安装 `baidu-ccc-dev` CLI 工具：

```bash
npm install -g baidu-ccc-dev
```

验证安装：

```bash
baidu-ccc-dev --version
```

## 快速开始

### 推荐：从 Marketplace 安装

```bash
# 添加 Marketplace
/plugin marketplace add xwa5/ccc-plugin

# 安装插件
/plugin install baidu-ccc@xwa5-ccc-plugin
```

### 其他方式

<details>
<summary>从 Git URL 安装</summary>

```bash
/plugin marketplace add https://github.com/xwa5/ccc-plugin.git
/plugin install baidu-ccc@xwa5-ccc-plugin
```
</details>

<details>
<summary>本地开发安装</summary>

```bash
git clone https://github.com/xwa5/ccc-plugin.git
/plugin marketplace add ./path/to/ccc-plugin
/plugin install baidu-ccc@ccc-plugin
```
</details>

### 验证安装

检查插件是否启用：

```bash
/plugin
```

应该看到 `baidu-ccc@... (Enabled)`。

## 使用方式

### 方式 1：斜杠命令

```bash
/baidu-ccc:install   # 安装/更新团队配置
/baidu-ccc:status    # 查看配置状态
```

### 方式 2：自然语言

直接告诉 Claude 你的需求：

```
"帮我安装团队的 Claude 配置"
"我的配置是最新的吗？"
"同步一下团队的 coding config"
```

Claude 会自动识别并执行相应操作。

## 主要功能

### `/baidu-ccc:install` - 安装配置

**功能**：
- 自动检查并安装 CLI 工具（如需要）
- 交互式安装流程
- 智能冲突检测和处理
- 支持个人级/项目级配置

**交互流程**：
1. 选择配置级别（个人级/项目级）
2. 下载团队配置
3. 检测冲突并引导处理
4. 完成安装并展示结果

### `/baidu-ccc:status` - 查看状态

**显示信息**：
- 配置目录位置
- 配置来源 URL
- 最后同步时间
- 所有安装位置的状态
- 已安装的配置内容（Skills、Scripts、Commands、Hooks）

### 智能助手

自动识别用户意图，无需记忆命令：
- 检测关键词（"安装"、"同步"、"配置"、"状态"等）
- 自动调用相应的斜杠命令
- 提供引导和建议

## 配置说明

### 配置级别

| 级别 | 位置 | 作用范围 | 推荐场景 |
|-----|------|---------|---------|
| **个人级** | `~/.claude/` | 所有项目 | 个人使用，一次安装 |
| **项目级** | `./.claude/` | 当前项目 | 团队协作，提交到 Git |

**推荐做法**：
- 个人使用：安装到个人级
- 团队协作：安装到项目级并提交配置文件

### 冲突处理

当本地和远程都有修改时的处理策略：

| 策略 | 说明 | 适用场景 |
|-----|------|---------|
| **查看差异** | 显示具体变更 | 有自定义修改，需确认 |
| **保留本地** | 保持自定义修改 | 本地改动重要 |
| **使用远程** | 与团队配置一致 | 接受团队更新 |

**建议**：
- 有自定义 → 先查看差异
- 无修改 → 直接使用远程
- 不确定 → 保留本地，稍后手动处理

## 技术架构

### 与 baidu-ccc-dev 的关系

```
┌─────────────────────────────────┐
│  baidu-ccc (Claude Plugin)      │
│  - Commands (Markdown)          │
│  - Skills (Markdown)            │
│  - 指导 Claude 如何调用 CLI     │
└───────────┬─────────────────────┘
            │ 通过 Bash 工具调用
            ↓
┌─────────────────────────────────┐
│  baidu-ccc-dev (npm CLI)        │
│  - 下载配置                      │
│  - 检测冲突                      │
│  - 合并配置                      │
│  - 更新记录                      │
└─────────────────────────────────┘
```

**关键点**：
- Plugin 只包含 Markdown 配置，无逻辑代码
- 实际工作由 `baidu-ccc-dev` CLI 完成
- Claude 通过 Bash 工具调用 CLI
- 不使用 MCP，纯 Commands + Skills 机制

### 插件结构

```
baidu-ccc/
├── .claude-plugin/
│   ├── plugin.json              # 插件元数据
│   └── marketplace.json         # Marketplace 配置
├── commands/
│   ├── install.md              # /baidu-ccc:install 命令
│   └── status.md               # /baidu-ccc:status 命令
├── skills/
│   └── baidu-ccc-helper/
│       └── SKILL.md            # 智能识别 Skill
├── scripts/
│   ├── claude-install-wrapper.js   # Claude 侧包装器
│   └── transparent-proxy.js        # 透明代理
└── README.md
```

## 常见问题

### 为什么需要两个项目？

- **baidu-ccc-dev**：独立 CLI 工具，可单独使用
- **baidu-ccc**：Claude 集成层，让 Claude 知道如何使用 CLI

分离设计保证了工具的独立性和可组合性。

### Plugin 会自动安装 baidu-ccc-dev 吗？

不会。需要手动安装 `npm install -g baidu-ccc-dev`。

Plugin 在运行时会检查 CLI 是否已安装，如未安装会自动提示并执行安装。

### 如何卸载插件？

```bash
# 卸载插件
/plugin uninstall baidu-ccc@<marketplace-name>

# 移除 Marketplace
/plugin marketplace remove <marketplace-name>
```

### 命令不显示怎么办？

```bash
# 清除缓存
rm -rf ~/.claude/plugins/cache

# 重启 Claude Code
exit && claude

# 重新安装插件
/plugin install baidu-ccc@<marketplace-name>
```

## 相关链接

- [baidu-ccc-dev CLI 工具](https://github.com/xwa5/baidu-ccc-dev)
- [Claude Code Plugins 文档](https://code.claude.com/docs/en/plugins.md)
- [Plugin Marketplaces 文档](https://code.claude.com/docs/en/plugin-marketplaces.md)

## 许可证

MIT
