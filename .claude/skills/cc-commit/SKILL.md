---
description: 看暂存区 + 生成一句话中文 commit message + 提交
allowed-tools: Bash
---

帮我提交当前暂存的改动。流程：

1. 先确认这是 Git 仓库（跑 `git rev-parse --is-inside-work-tree`）。不是的话，提示我先跑 `/cc-init`，停下。
2. 跑 `git status` 和 `git diff --cached` 看一眼暂存了什么。
3. 暂存区为空 → 提示我先用 `git add` 把要提交的文件加进来，停下。
4. 生成 commit message，规则：
   - 一句话中文
   - 不带 emoji
   - 不带 `Co-Authored-By`
   - 写"做了什么"，不写"为什么"
   - 50 字以内
5. 执行 `git commit -m "..."`，完成后跑 `git log --oneline -1` 把结果给我看。
