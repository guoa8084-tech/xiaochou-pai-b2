---
description: 把本地代码推到远端（push + 可选建 PR）
allowed-tools: Bash
---

把当前分支的代码推到远端（GitHub）。流程：

## 1. 工作区检查

- 跑 `git status`
- 有未提交改动 → 提示我先跑 `/cc-commit`，停下
- 还没有任何 commit（`git rev-parse HEAD` 报错）→ 提示我先做一次提交，停下

## 2. 远端配置检查

跑 `git remote -v`。

- **没有 remote**：引导我配置
  1. 让我去 GitHub 网页 `https://github.com/new` 建一个**空仓库**（**不要**勾选 README / LICENSE / .gitignore，避免冲突）
  2. 让我把新仓库的 URL 贴回来
  3. 跑 `git remote add origin <URL>`
  4. 等我回复 OK 再继续
- **有 remote**：直接进下一步

## 3. push

- 当前分支还没设 upstream → 用 `git push -u origin <current-branch>`
- 已设 upstream → `git push`
- push 失败（认证、权限、冲突等）→ **把英文报错翻译成人话告诉我**（按零基础也能懂的方式），列最可能的 2-3 个原因和最简修复办法

## 4. 可选：建 PR

- 当前分支是 `main` / `master` → 跳过这步
- 当前分支不是主分支：
  - 跑 `which gh` 检查本地是否装了 GitHub CLI
    - 没装 → 提示我去 GitHub 网页建 PR，给出本仓库的 PR 创建链接（`https://github.com/<owner>/<repo>/compare/<branch>`）
    - 装了 → 问我是否帮我建 PR
      - 同意 → 用 `gh pr create`，从本分支相对主分支的 commits 自动拼 description（中文、说清楚"这个分支做了什么"）
      - 不同意 → 跳过
- 完成后把 PR URL 给我
