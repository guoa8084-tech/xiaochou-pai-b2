<template>
  <!-- Joker 卡 140×200px — PRD §4.3 + §2.2 -->
  <div
    class="joker-card"
    :class="{ triggered: triggered, 'ai-highlight': aiHighlight }"
    :style="{ '--rarity-color': rarityColor }"
  >
    <!-- 稀有度四角内描边 -->
    <div class="rarity-corners">
      <span class="corner tl"></span>
      <span class="corner tr"></span>
      <span class="corner bl"></span>
      <span class="corner br"></span>
    </div>

    <!-- 稀有度标签 -->
    <div class="rarity-badge">{{ rarityLabel }}</div>

    <!-- 艺术 emoji -->
    <div class="joker-art">{{ joker.art }}</div>

    <!-- 名称 -->
    <div class="joker-name">{{ joker.name }}</div>

    <!-- 描述 -->
    <div class="joker-desc">{{ joker.desc }}</div>

    <!-- 触发金光覆层 -->
    <div v-if="triggered" class="trigger-glow"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RARITY_COLOR } from '../composables/gameLogic.js'

const props = defineProps({
  joker:       { type: Object, required: true },
  triggered:   { type: Boolean, default: false },
  aiHighlight: { type: Boolean, default: false },
})

const rarityColor = computed(() => RARITY_COLOR[props.joker.rarity] || '#6cb4d3')

const rarityLabel = computed(() => {
  const map = { common: '普通', uncommon: '罕见', rare: '稀有', legendary: '传说' }
  return map[props.joker.rarity] || '普通'
})
</script>

<style scoped>
.joker-card {
  width: 140px;
  height: 200px;
  flex-shrink: 0;
  position: relative;
  border-radius: 10px;
  background: linear-gradient(180deg, var(--paper-1), var(--paper-2));
  border: 2px solid var(--card-edge);
  box-shadow: 0 4px 8px rgba(0,0,0,.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px 8px;
  gap: 4px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

/* 稀有度四角内描边 */
.rarity-corners .corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--rarity-color);
  border-style: solid;
  opacity: 0.85;
}
.corner.tl { top: 4px;  left:  4px;  border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
.corner.tr { top: 4px;  right: 4px;  border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
.corner.bl { bottom: 4px; left:  4px;  border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
.corner.br { bottom: 4px; right: 4px;  border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }

.rarity-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--rarity-color);
  background: rgba(0,0,0,.15);
  border-radius: 4px;
  padding: 1px 6px;
  margin-top: 4px;
}

.joker-art {
  font-size: 52px;
  line-height: 1;
  margin: 4px 0;
}

.joker-name {
  font-size: 13px;
  font-weight: 800;
  color: #1a1a1a;
  text-align: center;
  line-height: 1.2;
}

.joker-desc {
  font-size: 10px;
  color: #444;
  text-align: center;
  line-height: 1.4;
  padding: 0 4px;
  flex: 1;
  overflow: hidden;
}

/* 触发动效 */
.joker-card.triggered {
  transform: translateY(-18px) scale(1.15);
  box-shadow: 0 16px 32px rgba(255,200,87,.6), 0 0 0 2px var(--gold);
  z-index: 10;
}

.trigger-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(255,200,87,.4), transparent 70%);
  pointer-events: none;
  border-radius: 10px;
  animation: glow-pulse 0.4s ease-out;
}
@keyframes glow-pulse {
  from { opacity: 1; }
  to   { opacity: 0.3; }
}

/* AI 建议高亮 */
.joker-card.ai-highlight {
  box-shadow: 0 0 0 3px #a855f7, 0 8px 24px rgba(168,85,247,.5);
  animation: ai-glow 1s ease-in-out infinite alternate;
}
@keyframes ai-glow {
  from { box-shadow: 0 0 0 3px #a855f7, 0 8px 24px rgba(168,85,247,.5); }
  to   { box-shadow: 0 0 0 3px #c084fc, 0 12px 32px rgba(168,85,247,.8); }
}
</style>
