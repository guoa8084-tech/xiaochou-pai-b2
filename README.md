# 小丑牌教学课程 · B2

按「PRD → DESIGN → 全栈实施」三段式，用 AI 同事（产品经理 / UI 设计师 / 全栈工程师 / 测试工程师）把一个 Balatro 风格的小游戏从零造出来。共 6 轮，每轮 1 个 commit。

## 目录结构

```
.
├── 01-第1轮-PRD-小丑牌核心循环.html      # 第 1 轮产品需求文档（产品经理产出）
├── 01-第1轮-DESIGN-小丑牌核心循环.html   # 第 1 轮设计规范（UI 设计师产出）
├── balatro-game/                         # 实施代码（Vue 3 + Vite，全栈工程师产出)
└── .claude/                              # 项目级 Claude Code 配置（agents / skills）
```

PRD 和 DESIGN 是 HTML 单文档，直接用浏览器打开即可阅读。

## 运行 balatro-game

```bash
cd balatro-game
npm install
npm run dev      # http://localhost:5173
npm run build    # 生产构建
```

## 课程进度

- [x] 第 1 轮 · 核心循环 + 设置 + 动效 + AI（v1.0.0）
- [ ] 第 2 轮 · 学员动手扩展
- [ ] 第 3 轮 · 配乐 + 粒子升级
- [ ] 第 4 轮 · agent-browser 自动化验收
- [ ] 第 5 轮 · Tauri 跨端打包
- [ ] 第 6 轮 · DeepSeek 真 LLM 接入
