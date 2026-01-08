---
description: 查看当前 Coding Config 配置状态
---

# 查看配置状态

请帮我查看当前的 Coding Config 配置状态。

## 操作步骤

1. 确保已安装 `baidu-ccc-dev` CLI 工具
   - 如果未安装，运行：`npm install -g baidu-ccc-dev`

2. 运行状态查询命令：`baidu-ccc-dev status`

3. 查看以下信息：
   - 个人配置目录位置
   - 安装记录文件位置
   - 配置来源 URL
   - 最后同步时间（如果有）

## 相关命令

- 安装/更新配置：使用 `/ccc-install` 命令
- 查看具体配置文件：使用 `ls ~/.claude/` 或 `ls ./.claude/`
