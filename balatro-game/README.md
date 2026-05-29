# 小丑牌 · 第 1 轮（v1.0.0）

Balatro 风格的扑克 + 小丑牌组合游戏，B2 课程第 1 轮实施产物。

## 玩法

- 3 关递增盲注（300 / 500 / 800）
- 每关 4 手出牌 + 3 次弃牌
- 出 1–5 张组扑克牌型，靠 chips × mult 累分达标过关
- 通关进商店买小丑牌（6 张候选库），3 关全过为胜，任一关 4 手未达标为负

## 本轮功能

- 完整核心循环：选牌 → 出牌 → 触发 Joker → 计分 → 通关 → 商店 → 下一关
- 4 类核心动效：飞牌 / 逐张高亮 + 蓝色 chips 飞字 / Joker 金光 + 红色 mult 飞字 / 公式爆出
- 右上角设置面板（BGM / SFX / 动画速度 / 公式预览，写 localStorage）
- AI 出牌助手（本地启发式枚举 218 种子集，取得分最高那组自动出牌）

## 运行

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 生产构建到 dist/
npm run preview  # 预览生产构建
```

## 技术栈

Vue 3 + Vite + 原生 CSS，无 UI 库、无状态管理、无后端、无 API key。
