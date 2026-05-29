/**
 * useAudio — Howler.js 封装
 * 管理 5 个 SFX 事件 + 1 轨 BGM 循环
 * 按 PRD §四 M1/M2/M4 + §十 翻车点实施
 */
import { Howl, Howler } from 'howler'

// 音频资源路径（Vite 会把 assets 下的文件打包到 dist）
import sfxSelectUrl from '../assets/audio/sfx-select.mp3'
import sfxPlayUrl   from '../assets/audio/sfx-play.mp3'
import sfxScoreUrl  from '../assets/audio/sfx-score.mp3'
import sfxWinUrl    from '../assets/audio/sfx-win.mp3'
import sfxLoseUrl   from '../assets/audio/sfx-lose.mp3'
import bgmMainUrl   from '../assets/audio/bgm-main.mp3'

// ===== 模块级单例状态（页面生命周期内唯一实例）=====
let initialized = false
let audioUnlocked = false   // AudioContext 是否已被用户手势解锁
let bgmPlaying = false      // BGM 是否正在播放（防止重复启动）

// Howl 实例
let sfxSounds = {}  // { select, play, score, win, lose }
let bgmSound  = null

// SFX 叠播计数器 — PRD §10.4：最多 4 个并发
let activeSfxCount = 0
const MAX_SFX_CONCURRENT = 4

// 当前 SFX 音量基准（0-100）
let currentSfxVolume = 70

// ===== 初始化 =====
function init(bgmVolume = 50, sfxVolume = 70) {
  if (initialized) return
  initialized = true
  currentSfxVolume = sfxVolume

  // 创建 BGM Howl
  bgmSound = new Howl({
    src: [bgmMainUrl],
    loop: true,
    volume: bgmVolume / 100,
    autoplay: false,
    onloaderror: (_id, err) => {
      // PRD §10.2：加载失败静默降级
      console.warn('[Audio] failed to load BGM:', err)
    },
  })

  // SFX 音效配置表
  const sfxConfig = [
    { key: 'select', src: sfxSelectUrl },
    { key: 'play',   src: sfxPlayUrl   },
    { key: 'score',  src: sfxScoreUrl  },
    { key: 'win',    src: sfxWinUrl    },
    { key: 'lose',   src: sfxLoseUrl   },
  ]

  for (const { key, src } of sfxConfig) {
    sfxSounds[key] = new Howl({
      src: [src],
      loop: false,
      volume: sfxVolume / 100,
      autoplay: false,
      onloaderror: (_id, err) => {
        console.warn(`[Audio] failed to load sfx-${key}:`, err)
      },
      // 维护 activeSfxCount 计数器
      onplay: () => { activeSfxCount++ },
      onend:  () => { activeSfxCount = Math.max(0, activeSfxCount - 1) },
      onstop: () => { activeSfxCount = Math.max(0, activeSfxCount - 1) },
    })
  }
}

// ===== 播放 SFX =====
// name ∈ 'select' | 'play' | 'score' | 'win' | 'lose'
function playSFX(name) {
  const sound = sfxSounds[name]
  if (!sound) return

  // PRD §10.4：sfx-select 叠播上限守卫
  if (name === 'select' && activeSfxCount >= MAX_SFX_CONCURRENT) {
    return // 静默跳过
  }

  try {
    // 每次 play 时带入当前 sfxVolume（PRD §11.3 接线方式）
    sound.volume(currentSfxVolume / 100)
    sound.play()
  } catch (e) {
    console.warn(`[Audio] playSFX(${name}) error:`, e)
  }
}

// ===== BGM 控制 =====

function playBGM() {
  if (!bgmSound) return
  // 如果已经在播放（Howl 内部状态），不重复启动
  if (bgmSound.playing()) return

  bgmPlaying = true
  try {
    // 先把音量设为 0，再 fade 进来（避免突然爆音）
    const targetVol = bgmSound.volume() > 0 ? bgmSound.volume() : 0.5
    bgmSound.volume(0)
    bgmSound.play()
    bgmSound.fade(0, targetVol, 800)
  } catch (e) {
    console.warn('[Audio] playBGM error:', e)
    bgmPlaying = false
  }
}

function stopBGM() {
  if (!bgmSound) return
  bgmPlaying = false
  try {
    bgmSound.stop()
  } catch (e) {
    console.warn('[Audio] stopBGM error:', e)
  }
}

// 淡出 BGM（won/lost 时调用）
// duration 单位 ms，默认 1200ms — PRD §四 M2
function fadeOutBGM(duration = 1200) {
  if (!bgmSound || !bgmSound.playing()) return
  bgmPlaying = false
  try {
    const currentVol = bgmSound.volume()
    bgmSound.fade(currentVol, 0, duration)
    setTimeout(() => {
      try {
        bgmSound.stop()
        // 淡出后把音量恢复到原来值，方便下次重播时正确淡入
        bgmSound.volume(currentVol)
      } catch (_) {}
    }, duration + 100)
  } catch (e) {
    console.warn('[Audio] fadeOutBGM error:', e)
  }
}

// ===== 音量控制 =====

function setBGMVolume(v) {
  // v: 0-100 → Howler 0.0-1.0
  if (!bgmSound) return
  try {
    bgmSound.volume(v / 100)
  } catch (e) {
    console.warn('[Audio] setBGMVolume error:', e)
  }
}

function setSFXVolume(v) {
  currentSfxVolume = v
  // 更新所有 SFX Howl 实例的基准音量
  for (const sound of Object.values(sfxSounds)) {
    try { sound.volume(v / 100) } catch (_) {}
  }
}

// ===== 首次 pointerdown 解锁 AudioContext — PRD §四 M4 =====
function unlockAudio() {
  if (audioUnlocked) return

  const unlock = async () => {
    if (audioUnlocked) return
    audioUnlocked = true
    document.removeEventListener('pointerdown', unlock)
    document.removeEventListener('click', unlock)

    // 解锁 AudioContext — PRD §10.1 兜底
    try {
      if (Howler.ctx && Howler.ctx.state !== 'running') {
        await Howler.ctx.resume()
      }
    } catch (e) {
      // PRD §10.1：解锁失败静默降级，不阻塞游戏
      console.warn('[Audio] autoplay unlock failed, running muted', e)
      return
    }

    // 解锁成功后启动 BGM
    playBGM()
  }

  document.addEventListener('pointerdown', unlock, { once: true })
  document.addEventListener('click',       unlock, { once: true })

  // PRD §10.5：监听 visibilitychange，切回前台时重激活 AudioContext
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      try {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume()
        }
      } catch (e) {
        console.warn('[Audio] visibilitychange resume error:', e)
      }
    }
  })
}

// ===== 对外暴露的 composable =====
export function useAudio() {
  return {
    init,
    playSFX,
    playBGM,
    stopBGM,
    fadeOutBGM,
    setBGMVolume,
    setSFXVolume,
    unlockAudio,
  }
}
