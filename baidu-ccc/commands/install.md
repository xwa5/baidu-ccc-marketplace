---
description: 安装百度团队的 Coding Config 配置
---

# 安装 Coding Config

请帮我安装百度团队的 Coding Config 配置。

## 操作步骤

1. 确保已安装 `baidu-ccc-dev` CLI 工具
   - 如果未安装，运行：`npm install -g baidu-ccc-dev`
   - 如果已安装，确认版本：`baidu-ccc-dev --version`

2. 运行安装命令：`baidu-ccc-dev install`

3. 按照交互式提示完成配置：
   - 选择配置级别（个人级 `~/.claude/` 或项目级 `./.claude/`）
   - 如果检测到冲突，选择保留本地或使用远程版本
   - 查看安装后的文件变更摘要

4. 安装完成后，新的配置（commands、skills、hooks、agents）将立即生效

## 注意事项

- 安装过程中会检测本地与远程的冲突，请仔细选择
- 如需查看差异，可以选择 "查看差异" 选项
- 脚本文件会自动安装到 `~/.local/bin/`（需确保在 PATH 中）
