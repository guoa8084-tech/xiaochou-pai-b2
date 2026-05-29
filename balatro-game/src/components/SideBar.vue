<template>
  <!-- 左侧 HUD sidebar — PRD §4.2 · width: min(28vw, 480px); min-width: 280px -->
  <div class="sidebar">

    <!-- 顶部 Logo -->
    <div class="logo-area">
      <span class="logo-text">🃏 小丑牌</span>
    </div>

    <!-- 盲注面板 -->
    <div class="sb-panel blind-panel">
      <div class="panel-label">盲注 {{ blindIndex + 1 }}/3</div>
      <div class="blind-header">
        <span class="blind-icon">{{ currentBlind.icon }}</span>
        <div>
          <div class="blind-name">{{ currentBlind.name }}</div>
        </div>
      </div>
      <div class="inset-box">
        <div class="inset-label">目标至少</div>
        <div class="inset-big score-red">{{ currentBlind.target }}</div>
        <div class="inset-reward">通关奖励 +${{ calcRewardDisplay }}</div>
      </div>
    </div>

    <!-- Round Score -->
    <div class="sb-panel score-panel">
      <div class="panel-label">当前分</div>
      <div class="inset-box">
        <div class="score-display">{{ displayScore }}</div>
      </div>
      <!-- 进度条 -->
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- HAND 计分块 -->
    <div class="sb-panel hand-panel">
      <div class="hand-type-name" :class="{ empty: !handTypeName }">
        {{ handTypeName || '— 选牌出牌 —' }}
      </div>
      <div class="score-row">
        <div class="chips-block">
          <span class="score-val-big">{{ displayChips }}</span>
          <span class="score-unit">筹码</span>
        </div>
        <span class="score-x">×</span>
        <div class="mult-block">
          <span class="score-val-big">{{ displayMult }}</span>
          <span class="score-unit">倍率</span>
        </div>
      </div>
    </div>

    <!-- Hands / Discards -->
    <div class="sb-panel hands-row">
      <div class="hand-block">
        <div class="hb-label">手数</div>
        <div class="hb-val green" ref="handsRef">{{ handsLeft }}</div>
      </div>
      <div class="hand-block">
        <div class="hb-label">弃牌</div>
        <div class="hb-val red">{{ discardsLeft }}</div>
      </div>
    </div>

    <!-- 金币 -->
    <div class="sb-panel money-panel">
      <span class="money-sign">$</span>
      <span class="money-val">{{ gold }}</span>
    </div>

    <!-- Ante 进度 -->
    <div class="ante-row">
      <span class="ante-orange">底注 {{ blindIndex + 1 }}/3</span>
      <span class="ante-dot"> · </span>
      <span class="ante-blue">回合 {{ blindIndex + 1 }}</span>
    </div>

    <!-- 按钮 -->
    <div class="sb-btns">
      <button class="px-btn restart" @click="$emit('restart')">重新开始</button>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { calcReward } from '../composables/gameLogic.js'

const props = defineProps({
  currentBlind:  { type: Object, required: true },
  blindIndex:    { type: Number, required: true },
  blindScore:    { type: Number, required: true },
  displayScore:  { type: Number, required: true },
  handsLeft:     { type: Number, required: true },
  discardsLeft:  { type: Number, required: true },
  gold:          { type: Number, required: true },
  handTypeName:  { type: String, default: '' },
  displayChips:  { type: Number, default: 0 },
  displayMult:   { type: Number, default: 0 },
})

defineEmits(['restart'])

const progressPct = computed(() => {
  const pct = (props.blindScore / props.currentBlind.target) * 100
  return Math.min(pct, 100)
})

const calcRewardDisplay = computed(() => calcReward(props.handsLeft))
</script>

<style scoped>
.sidebar {
  width: min(28vw, 480px);
  min-width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a2a5a, #111e44);
  border-right: 2px solid rgba(74,107,255,.4);
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

/* Logo */
.logo-area {
  padding: 6px 4px 2px;
  text-align: center;
}
.logo-text {
  font-family: var(--pixel);
  font-size: 14px;
  color: var(--gold);
  text-shadow: 2px 2px 0 #000, -1px -1px 0 #000;
  letter-spacing: 1px;
}

/* 面板通用 */
.sb-panel {
  background: linear-gradient(180deg, #1e3068, #152050);
  border: 2px solid rgba(74,107,255,.5);
  border-radius: 10px;
  padding: 6px 10px;
  flex-shrink: 0;
}
.panel-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 盲注 */
.blind-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}
.blind-icon { font-size: 20px; }
.blind-name {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
}

/* 嵌入黑底框 */
.inset-box {
  background: var(--inset);
  border-radius: 8px;
  border: 1px solid rgba(74,107,255,.3);
  padding: 5px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.inset-label { font-size: 10px; color: var(--muted); letter-spacing: 0.5px; }
.inset-big {
  font-family: var(--display);
  font-size: 28px;
  line-height: 1;
  font-weight: 400;
}
.score-red { color: #ff5566; }
.inset-reward { font-size: 11px; color: var(--gold); font-weight: 600; }

/* Round Score */
.score-display {
  font-family: var(--display);
  font-size: 40px;
  line-height: 1;
  color: #4dd6ff;
  font-weight: 400;
  min-width: 80px;
  text-align: center;
}
.progress-bar-bg {
  margin-top: 5px;
  height: 8px;
  border-radius: 4px;
  background: rgba(0,0,0,.4);
  border: 1px solid rgba(74,107,255,.3);
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4dd6ff, #2196f3);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* HAND 计分块 */
.hand-type-name {
  font-size: 14px;
  font-weight: 800;
  color: #4dd6ff;
  text-align: center;
  margin-bottom: 5px;
  letter-spacing: 1px;
}
.hand-type-name.empty {
  color: var(--muted);
  font-weight: 400;
}
.score-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.chips-block {
  flex: 1;
  background: linear-gradient(135deg, var(--chips-from), var(--chips-to));
  border-radius: 10px;
  padding: 10px 6px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 3px 0 #0d4a80;
  border: 2px solid #1a7bd4;
}
.mult-block {
  flex: 1;
  background: linear-gradient(135deg, var(--mult-from), var(--mult-to));
  border-radius: 10px;
  padding: 10px 6px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 3px 0 #8b1a1a;
  border: 2px solid #cc2233;
}
.score-val-big {
  font-family: var(--pixel);
  font-size: 24px;
  font-weight: 900;
  color: rgba(0,5,20,.9);
  line-height: 1;
}
.score-unit {
  font-size: 9px;
  color: rgba(0,0,0,.55);
  margin-top: 3px;
  font-weight: 600;
}
.score-x {
  font-family: var(--pixel);
  font-size: 12px;
  color: var(--text-dim);
  flex-shrink: 0;
}

/* Hands / Discards */
.hands-row {
  display: flex;
  gap: 6px;
  padding: 6px 8px;
}
.hand-block {
  flex: 1;
  text-align: center;
}
.hb-label {
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
}
.hb-val {
  font-family: var(--display);
  font-size: 34px;
  line-height: 1;
  font-weight: 400;
}
.hb-val.green { color: #62d18b; }
.hb-val.red   { color: #ff5544; }

/* 金币 */
.money-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
}
.money-sign {
  font-family: var(--pixel);
  font-size: 14px;
  color: var(--gold);
}
.money-val {
  font-family: var(--display);
  font-size: 44px;
  color: var(--money);
  line-height: 1;
  font-weight: 400;
}

/* Ante */
.ante-row {
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  padding: 2px 0;
  flex-shrink: 0;
}
.ante-orange { color: var(--gold); font-weight: 600; }
.ante-blue   { color: #4dd6ff; font-weight: 600; }
.ante-dot    { color: var(--muted); }

/* 按钮区 */
.sb-btns {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.sb-btns .px-btn {
  width: 100%;
  font-size: 14px;
  min-height: 44px;
  padding: 10px 16px;
}
</style>
