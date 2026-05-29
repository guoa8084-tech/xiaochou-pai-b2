<template>
  <!-- 扑克牌 100×145px — PRD §4.3 -->
  <div
    class="poker-card"
    :class="{
      selected: selected,
      'suit-red': card.suit === '♥' || card.suit === '♦',
      highlighted: highlighted,
    }"
    @click="$emit('click', card)"
  >
    <div class="card-inner">
      <div class="card-corner top-left">
        <span class="rank">{{ card.rank }}</span>
        <span class="suit">{{ card.suit }}</span>
      </div>
      <div class="card-center-suit">{{ card.suit }}</div>
      <div class="card-corner bot-right">
        <span class="rank">{{ card.rank }}</span>
        <span class="suit">{{ card.suit }}</span>
      </div>
    </div>
    <!-- 选中高亮光晕 -->
    <div v-if="selected" class="selected-glow"></div>
  </div>
</template>

<script setup>
defineProps({
  card:        { type: Object, required: true },
  selected:    { type: Boolean, default: false },
  highlighted: { type: Boolean, default: false },
})
defineEmits(['click'])
</script>

<style scoped>
.poker-card {
  width: 100px;
  height: 145px;
  flex-shrink: 0;
  position: relative;
  border-radius: 8px;
  background: linear-gradient(180deg, var(--paper-1), var(--paper-2));
  border: 2px solid var(--card-edge);
  box-shadow: 0 3px 6px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.15) inset;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.poker-card:hover:not(.selected) {
  transform: translateY(-6px);
  box-shadow: 0 8px 16px rgba(0,0,0,.6);
}

.poker-card.selected {
  transform: translateY(-24px);
  box-shadow: 0 10px 20px rgba(74,107,255,.5), 0 4px 0 rgba(74,107,255,.4);
  border-color: #4a6bff;
}

.poker-card.highlighted {
  transform: translateY(-24px) scale(1.06);
  box-shadow: 0 12px 24px rgba(77,214,255,.6), 0 4px 0 #4dd6ff;
  border-color: #4dd6ff;
}

.card-inner {
  width: 100%;
  height: 100%;
  padding: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}
.card-corner.bot-right {
  align-self: flex-end;
  transform: rotate(180deg);
}

.rank {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 16px;
  font-weight: 900;
  color: #1a1a1a;
  line-height: 1;
}
.suit {
  font-size: 14px;
  line-height: 1;
  color: #1a1a1a;
}

.suit-red .rank,
.suit-red .suit {
  color: #c0232a;
}

.card-center-suit {
  font-size: 36px;
  text-align: center;
  line-height: 1;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.selected-glow {
  position: absolute;
  inset: -3px;
  border-radius: 10px;
  border: 2px solid rgba(74,107,255,.8);
  box-shadow: 0 0 12px rgba(74,107,255,.6), inset 0 0 8px rgba(74,107,255,.2);
  pointer-events: none;
}
</style>
