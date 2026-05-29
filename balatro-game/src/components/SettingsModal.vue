<template>
  <!-- 设置 Modal — PRD §5.4 -->
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal-card">
        <div class="modal-title">设置</div>

        <div class="settings-list">
          <!-- BGM 音量 -->
          <div class="setting-row">
            <label class="setting-label">BGM 音量</label>
            <div class="slider-wrap">
              <input
                type="range" min="0" max="100"
                :value="settings.bgmVolume"
                @input="update('bgmVolume', +$event.target.value)"
                class="slider slider-blue"
              />
              <span class="slider-val">{{ settings.bgmVolume }}</span>
            </div>
          </div>

          <!-- SFX 音量 -->
          <div class="setting-row">
            <label class="setting-label">SFX 音量</label>
            <div class="slider-wrap">
              <input
                type="range" min="0" max="100"
                :value="settings.sfxVolume"
                @input="update('sfxVolume', +$event.target.value)"
                class="slider slider-orange"
              />
              <span class="slider-val">{{ settings.sfxVolume }}</span>
            </div>
          </div>

          <!-- 动画速度 -->
          <div class="setting-row">
            <label class="setting-label">动画速度</label>
            <div class="radio-group">
              <button
                v-for="opt in speedOptions" :key="opt.value"
                class="radio-btn"
                :class="{ active: settings.animSpeed === opt.value }"
                @click="update('animSpeed', opt.value)"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 显示出牌公式预览 -->
          <div class="setting-row">
            <label class="setting-label">显示出牌公式预览</label>
            <div
              class="toggle"
              :class="{ on: settings.showFormula }"
              @click="update('showFormula', !settings.showFormula)"
            >
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="px-btn skip" @click="$emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show:     { type: Boolean, required: true },
  settings: { type: Object, required: true },
})
const emit = defineEmits(['close', 'update'])

const speedOptions = [
  { label: '慢',   value: 'slow' },
  { label: '普通', value: 'normal' },
  { label: '快',   value: 'fast' },
]

function update(key, val) {
  emit('update', { key, val })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: grid;
  place-items: center;
  z-index: 500;
}

.modal-card {
  width: 420px;
  max-width: 90vw;
  background: linear-gradient(180deg, #1e3068 0%, #0a1438 100%);
  border: 2px solid #4a6bff;
  border-radius: 14px;
  padding: 24px 26px;
  box-shadow: 0 12px 32px rgba(0,0,0,.7);
}

.modal-title {
  font-family: var(--sans);
  font-size: 24px;
  font-weight: 800;
  color: var(--gold);
  text-align: center;
  margin-bottom: 20px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
  flex-shrink: 0;
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider {
  width: 130px;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,.2);
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 16px;
  border-radius: 50%;
  cursor: pointer;
}
.slider-blue::-webkit-slider-thumb { background: #4dd6ff; }
.slider-orange::-webkit-slider-thumb { background: #ff8844; }
.slider-val {
  font-family: var(--display);
  font-size: 18px;
  color: var(--text-dim);
  min-width: 28px;
}

/* 动画速度 radio */
.radio-group {
  display: flex;
  gap: 6px;
}
.radio-btn {
  padding: 5px 12px;
  border-radius: 6px;
  background: rgba(74,107,255,.15);
  border: 1px solid rgba(74,107,255,.3);
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--sans);
  transition: all 0.15s;
}
.radio-btn.active {
  background: #4a6bff;
  border-color: #6a8bff;
  color: #fff;
}
.radio-btn:hover:not(.active) {
  background: rgba(74,107,255,.3);
  color: var(--text-dim);
}

/* Toggle */
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.2);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggle.on {
  background: #4a6bff;
  border-color: #6a8bff;
}
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}
.toggle.on .toggle-thumb {
  transform: translateX(20px);
}

.modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
