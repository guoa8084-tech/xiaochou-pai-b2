---
description: 项目首次初始化：生成 .gitignore / README.md / LICENSE / CLAUDE.md 四件套
allowed-tools: Bash, Read, Edit, Write, Glob
---

为当前目录生成首次提交所需的最小四件套。按顺序走：

## 1. Git 基础就绪

- 不是仓库 → 跑 `git init -b main`（主分支用 `main`，对齐 GitHub 默认）
- `git config --global user.name` 或 `user.email` 为空 → 让我贴一下名字和邮箱，跑 `git config --global` 设置；两个都有就静默通过

## 2. 自动判断项目类型，生成对应的 `.gitignore`

按以下信号识别（命中第一个就用对应模板，可叠加多语言）：

- `package.json` / `node_modules/` → Node / Web 前端
- `*.xcodeproj` / `Package.swift` → iOS / macOS（Swift）
- `requirements.txt` / `pyproject.toml` → Python
- `Cargo.toml` → Rust
- `go.mod` → Go
- 都没匹配 → 仅通用模板

所有模板都必须包含通用项：`.DS_Store`、`*.log`、`.env*`、`build/`、`dist/`、IDE 临时文件（`.vscode/`、`.idea/`）。

## 3. 生成其余三件

- **`README.md`**：写项目简介、安装步骤、使用方式三段。先扫一遍仓库内容再写，别凭空编。
- **`LICENSE`**：先问我"对外开源还是内部使用"。内部使用就跳过这一步。
- **`CLAUDE.md`**：写本仓库的定位、目录约定、常用命令。先扫一遍仓库内容再生成。

## 4. 已存在的文件

**不要直接覆盖**，先把现有内容贴给我看，由我决定是否更新。

## 5. 完成后

列出建议的 `git add` 命令和首个 commit message（一句话中文、不带 emoji），等我回复 OK 再执行。
