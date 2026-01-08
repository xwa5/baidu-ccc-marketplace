# Baidu CCC Marketplace

百度 Coding Config 插件市场。

## 仓库结构

此仓库采用 Monorepo 模式，所有插件代码直接托管在此仓库中：

```
baidu-ccc-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace 配置
├── baidu-ccc/                    # baidu-ccc 插件
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── commands/
│   ├── skills/
│   └── README.md
└── README.md
```

## 包含的插件

### baidu-ccc

百度 Coding Config 管理工具 - 同步和管理团队的 Claude 配置（commands、hooks、skills、agents）。

- **所在目录**: `baidu-ccc/`
- **版本**: 1.0.0
- **命令**:
  - `/ccc-install` - 安装团队配置
  - `/ccc-status` - 查看配置状态

详细文档请查看：[baidu-ccc/README.md](baidu-ccc/README.md)

## 安装方式

### 步骤 1：添加 Marketplace

```bash
/plugin marketplace add https://github.com/xwa5/baidu-ccc-marketplace.git
```

### 步骤 2：安装插件

```bash
/plugin install baidu-ccc@baidu-ccc-marketplace
```

### 步骤 3：验证安装

```bash
# 查看已安装的插件
/plugin

# 测试命令
/ccc-status
```

## 使用方式

### 方式 1: 斜杠命令

```bash
/ccc-install   # 安装团队配置
/ccc-status    # 查看配置状态
```

### 方式 2: 自然语言

直接告诉 Claude：
```
"帮我安装团队的 Claude 配置"
"查看我的配置状态"
```

## 前置要求

使用 baidu-ccc 插件前需要先安装 CLI 工具：

```bash
npm install -g baidu-ccc-dev
```

## 插件开发

此 Marketplace 采用 Monorepo 模式，所有插件代码直接托管在此仓库中。

### 添加新插件

1. 在根目录创建插件目录：`mkdir my-plugin`
2. 添加插件配置和代码
3. 在 `.claude-plugin/marketplace.json` 中注册插件
4. 提交到 GitHub

### 本地测试

```bash
# 克隆仓库
git clone https://github.com/xwa5/baidu-ccc-marketplace.git

# 添加本地 Marketplace
/plugin marketplace add /path/to/baidu-ccc-marketplace

# 安装插件
/plugin install baidu-ccc@baidu-ccc-marketplace
```

## 许可证

MIT
