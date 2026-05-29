# 项目说明 · 小丑牌教学课程

## 仓库定位

B2 课程的产物仓库。每一轮按「PRD（产品经理）→ DESIGN（UI 设计师）→ 实施（全栈工程师）」三段产出，分别落在：

- 根目录 `0N-第N轮-PRD-*.html`（产品经理产出，单文件 HTML）
- 根目录 `0N-第N轮-DESIGN-*.html`（UI 设计师产出，单文件 HTML）
- `balatro-game/`（全栈工程师产出，Vue 3 + Vite 项目）

## 目录约定

- **根目录**：只放各轮 PRD/DESIGN HTML + 课程总览（README / CLAUDE）
- **`balatro-game/`**：实施代码本体，独立的 Vue + Vite 工程，自带 `.gitignore` / `README.md`
- **`.claude/`**：项目级 Claude Code 配置（`agents/`、`skills/`）。`settings.local.json` 不入仓
- 不要把生成产物（`node_modules/`、`dist/`）入仓

## 实施约束（来自第 1 轮 PRD §10 + §11）

- **一轮 = 一个 commit**。commit message 格式：`feat: 第 N 轮 - 主题（vX.Y.Z）`
- **实施走 fullstack-engineer 子代理**，不让主 agent 直接写代码
- **build 必过**：`cd balatro-game && npm run build` 必须 0 error 0 warning
- 凡 PRD 标 `锁定` / `硬锁定` 的数值 / 文案 / 比例，照搬，不要"优化"

## 常用命令

```bash
# 启动开发
cd balatro-game && npm run dev

# 构建
cd balatro-game && npm run build

# 提交（走 cc-commit skill）
/cc-commit

# 推送 / 建 PR（走 cc-ship skill）
/cc-ship
```

## 课程进度

| 轮次 | 主题 | 状态 |
|----|----|----|
| 1 | 核心循环 + 设置 + 动效 + AI | ✅ 已完成（v1.0.0） |
| 2 | 学员动手扩展 | ⏳ 待开始 |
| 3 | 配乐 + 粒子升级 | ⏳ 待开始 |
| 4 | agent-browser 自动化验收 | ⏳ 待开始 |
| 5 | Tauri 跨端打包 | ⏳ 待开始 |
| 6 | DeepSeek 真 LLM 接入 | ⏳ 待开始 |
