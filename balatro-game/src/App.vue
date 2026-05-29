<template>
  <div class="game-root">

    <!-- 右上角设置按钮 — PRD §5.4 top:16px right:16px z-index:100 -->
    <button class="px-btn settings-btn gear-btn" @click="showSettings = true">⚙️</button>

    <!-- 设置 Modal -->
    <SettingsModal
      :show="showSettings"
      :settings="settings"
      @close="showSettings = false"
      @update="onSettingsUpdate"
    />

    <!-- 左 sidebar — PRD §10.1 必须挂上 -->
    <SideBar
      :currentBlind="currentBlind"
      :blindIndex="currentBlindIndex"
      :blindScore="blindScore"
      :displayScore="displayScore"
      :handsLeft="handsLeft"
      :discardsLeft="discardsLeft"
      :gold="gold"
      :handTypeName="currentHandTypeName"
      :displayChips="displayChips"
      :displayMult="displayMult"
      @restart="restartGame"
    />

    <!-- 右主区 — PRD §10.3 grid-template-rows: 230px 1fr 280px -->
    <main class="main-area">

      <!-- 第1段：Joker 区 230px -->
      <section class="joker-section">
        <div class="joker-title">
          <span class="pixel-title">JOKERS · {{ ownedJokers.length }}/5</span>
        </div>
        <div class="joker-row">
          <template v-for="(joker, idx) in jokerSlots" :key="idx">
            <JokerCard
              v-if="joker"
              :joker="joker"
              :triggered="triggeredJokerIds.has(joker.id)"
              :aiHighlight="aiHighlightedJokerId === joker.id"
            />
            <!-- 空槽 -->
            <div v-else class="joker-empty-slot">
              <span class="slot-plus">+</span>
              <span class="slot-label">空槽</span>
            </div>
          </template>
        </div>
      </section>

      <!-- 第2段：出牌区（relative for 牌堆 absolute）-->
      <section class="play-section" ref="playSectionRef">
        <div class="play-header">
          <span class="play-title">出牌区</span>
          <span v-if="currentHandTypeName" class="play-hand-name">{{ currentHandTypeName }}</span>
        </div>

        <!-- 出牌区牌面 -->
        <div class="played-area" ref="playedAreaRef">
          <!-- 空态提示 / 公式预览 -->
          <template v-if="playedCards.length === 0 && !isAnimating">
            <div v-if="settings.showFormula && selectedCards.length > 0" class="formula-preview">
              <span class="fml-chips">{{ previewChips }}</span>
              <span class="fml-x">×</span>
              <span class="fml-mult">{{ previewMult }}</span>
              <span class="fml-eq">=</span>
              <span class="fml-score">{{ previewScore }}</span>
            </div>
            <div v-else class="play-empty-hint">选择手牌组成牌型（1-5 张）</div>
          </template>

          <!-- 已打出的牌 -->
          <div v-if="playedCards.length > 0" class="played-cards-row">
            <PokerCard
              v-for="(card, idx) in playedCards"
              :key="card.id"
              :card="card"
              :highlighted="highlightedCardIdx === idx"
              :selected="false"
            />
          </div>

          <!-- 最终公式爆出 — PRD §5.1 步骤5 -->
          <Transition name="formula-pop">
            <div v-if="showFinalFormula" class="final-formula">
              <span class="ff-chips">{{ finalChips }}</span>
              <span class="ff-x">×</span>
              <span class="ff-mult">{{ finalMult }}</span>
              <span class="ff-eq">=</span>
              <span class="ff-score">{{ finalScore }}</span>
            </div>
          </Transition>
        </div>

        <!-- 牌堆 absolute 内嵌出牌区 — PRD §4.4 §10.1 -->
        <div class="deck-pile" ref="deckRef" v-if="gameState === 'playing'">
          <div class="deck-layer deck-layer-3" :style="{ backgroundImage: `url(${jokerBackUrl})` }"></div>
          <div class="deck-layer deck-layer-2" :style="{ backgroundImage: `url(${jokerBackUrl})` }"></div>
          <div class="deck-layer deck-layer-1" :style="{ backgroundImage: `url(${jokerBackUrl})` }"></div>
          <div class="deck-count">{{ deck.length }}/52</div>
        </div>
      </section>

      <!-- 第3段：手牌 + 操作 280px -->
      <section class="hand-section" v-if="gameState === 'playing'">
        <div class="hand-header">
          <span class="hand-title">手牌</span>
          <span class="hand-count">已选 {{ selectedCards.length }} / 5 张</span>
        </div>

        <div class="hand-cards-row" ref="handAreaRef">
          <PokerCard
            v-for="card in hand"
            :key="card.id"
            :card="card"
            :selected="selectedCardIds.has(card.id)"
            :class="{ 'card-invisible': invisibleCardIds.has(card.id) }"
            @click="toggleSelect(card)"
          />
        </div>

        <div class="action-btns">
          <button
            class="px-btn play"
            :disabled="selectedCards.length === 0 || isAnimating"
            @click="handlePlay"
          >出牌 ({{ selectedCards.length }})</button>

          <button
            class="px-btn discard"
            :disabled="selectedCards.length === 0 || discardsLeft === 0 || isAnimating"
            @click="handleDiscard"
          >弃牌 ({{ discardsLeft }})</button>

          <button class="px-btn sort" :disabled="isAnimating" @click="sortByRank">按点排序</button>
          <button class="px-btn sort" :disabled="isAnimating" @click="sortBySuit">按花排序</button>

          <button
            class="px-btn ai-play"
            :class="{ thinking: aiThinking }"
            :disabled="isAnimating || aiThinking"
            @click="handleAiPlay"
          >{{ aiThinking ? '🤔 AI 思考中…' : '🤖 AI 出牌' }}</button>
        </div>
      </section>

      <!-- 商店覆层 — PRD §4.7 -->
      <div class="shop-overlay" v-if="gameState === 'shop'">
        <div class="shop-inner">
          <h2 class="shop-title">商店</h2>
          <p class="shop-subtitle">通关奖励到账！金币 ${{ gold }} · Joker 槽 {{ ownedJokers.length }}/5</p>

          <div class="shop-jokers">
            <div v-for="sj in shopJokers" :key="sj.id" class="shop-joker-col">
              <JokerCard
                :joker="sj"
                :aiHighlight="aiHighlightedJokerId === sj.id"
              />
              <button
                class="px-btn buy"
                :class="shopBtnClass(sj)"
                :disabled="sj.purchased || gold < sj.price || ownedJokers.length >= 5"
                @click="buyJoker(sj)"
              >{{ shopBtnLabel(sj) }}</button>
            </div>
          </div>

          <div class="shop-footer">
            <button
              class="px-btn ai-play"
              :class="{ thinking: aiThinking }"
              :disabled="aiThinking"
              @click="handleAiShop"
            >{{ aiThinking ? '🤔 AI 思考中…' : '🤖 AI 建议' }}</button>
            <button class="px-btn skip" @click="skipShop">跳过 →</button>
          </div>
        </div>
      </div>

      <!-- Won 覆层 -->
      <div class="end-overlay" v-if="gameState === 'won'">
        <div class="end-card">
          <h2 class="end-title won-title">🎉 通关全部</h2>
          <p class="end-sub">最终金币 ${{ gold }}</p>
          <div v-if="ownedJokers.length > 0" class="end-jokers">
            <div class="end-jokers-label">持有的 Joker</div>
            <div class="end-jokers-row">
              <JokerCard v-for="j in ownedJokers" :key="j.id" :joker="j" />
            </div>
          </div>
          <button class="px-btn restart" @click="restartGame">重新开始</button>
        </div>
      </div>

      <!-- Lost 覆层 -->
      <div class="end-overlay" v-if="gameState === 'lost'">
        <div class="end-card">
          <h2 class="end-title lost-title">💀 失败</h2>
          <p class="end-sub">止步第 {{ currentBlindIndex + 1 }} 关 · {{ currentBlind.name }}</p>
          <p class="end-sub" style="margin-top:4px">最终金币 ${{ gold }}</p>
          <div v-if="ownedJokers.length > 0" class="end-jokers">
            <div class="end-jokers-label">持有的 Joker</div>
            <div class="end-jokers-row">
              <JokerCard v-for="j in ownedJokers" :key="j.id" :joker="j" />
            </div>
          </div>
          <button class="px-btn restart" @click="restartGame">重新开始</button>
        </div>
      </div>

    </main>

    <!-- 飞字容器（全局 fixed，z-index 9999）-->
    <div class="fly-texts-container">
      <div
        v-for="ft in flyTexts"
        :key="ft.id"
        class="fly-text"
        :class="ft.cls"
        :style="ft.style"
      >{{ ft.text }}</div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import SideBar from './components/SideBar.vue'
import JokerCard from './components/JokerCard.vue'
import PokerCard from './components/PokerCard.vue'
import SettingsModal from './components/SettingsModal.vue'
import jokerBackUrl from './assets/joker-back.png'
import {
  createDeck,
  cardValue,
  identifyHand, calcScore,
  JOKER_POOL, BLINDS, calcReward,
  aiBestPlay, aiBestShopJoker
} from './composables/gameLogic.js'

// ===== 设置系统 — PRD §5.4 localStorage =====
const DEFAULT_SETTINGS = {
  bgmVolume:   50,
  sfxVolume:   70,
  animSpeed:   'normal',
  showFormula: true,
}
function loadSettings() {
  try {
    const raw = localStorage.getItem('balatro.settings')
    const s = raw ? JSON.parse(raw) : null
    return s ? { ...DEFAULT_SETTINGS, ...s } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}
const settings = reactive(loadSettings())
const showSettings = ref(false)

function onSettingsUpdate({ key, val }) {
  settings[key] = val
  localStorage.setItem('balatro.settings', JSON.stringify({ ...settings }))
}

// 动画速度倍率 — PRD §5.4
const animMult = computed(() => {
  if (settings.animSpeed === 'slow')   return 1.5
  if (settings.animSpeed === 'fast')   return 0.6
  return 1.0
})
function ms(base) { return Math.floor(base * animMult.value) }

// ===== 核心游戏状态 =====
const gameState = ref('playing') // playing | shop | won | lost
const currentBlindIndex = ref(0)
const currentBlind = computed(() => BLINDS[currentBlindIndex.value])

const deck = ref([])
const hand = ref([])
const ownedJokers = ref([])
const blindScore = ref(0)
const handsLeft = ref(4)
const discardsLeft = ref(3)
const gold = ref(0)

// 选中牌
const selectedCardIds = ref(new Set())
const selectedCards = computed(() => hand.value.filter(c => selectedCardIds.value.has(c.id)))

// 出牌区
const playedCards = ref([])
const isAnimating = ref(false)

// 动效状态
const highlightedCardIdx = ref(-1)
const triggeredJokerIds = ref(new Set())
const showFinalFormula = ref(false)
const finalChips = ref(0)
const finalMult  = ref(0)
const finalScore = ref(0)

// 显示值（动效用，跟实际数据分离）
const displayScore  = ref(0)
const displayChips  = ref(0)
const displayMult   = ref(0)
const currentHandTypeName = ref('')

// 飞字系统
const flyTexts = ref([])
let flyTextIdCnt = 0

// DOM refs
const playSectionRef = ref(null)
const deckRef        = ref(null)
const handAreaRef    = ref(null)
const playedAreaRef  = ref(null)

// Joker 槽（最多 5 个）
const jokerSlots = computed(() => {
  const slots = [...ownedJokers.value]
  while (slots.length < 5) slots.push(null)
  return slots
})

// 卡片飞行中隐藏（用 class）
const invisibleCardIds = ref(new Set())

// 商店
const shopJokers = ref([])
const aiHighlightedJokerId = ref(null)
const aiThinking = ref(false)

// ===== 公式预览（未出牌时）=====
const previewHandType = computed(() => {
  if (selectedCards.value.length === 0) return null
  return identifyHand(selectedCards.value)
})
const previewChips = computed(() => {
  if (!previewHandType.value) return 0
  const ht = previewHandType.value
  return ht.chips + selectedCards.value.reduce((s, c) => s + cardValue(c.rank), 0)
})
const previewMult  = computed(() => previewHandType.value?.mult || 0)
const previewScore = computed(() => previewChips.value * previewMult.value)

// ===== 初始化 =====
onMounted(() => {
  restartGame()
})

function restartGame() {
  gameState.value = 'playing'
  currentBlindIndex.value = 0
  ownedJokers.value = []
  gold.value = 0
  blindScore.value = 0
  displayScore.value = 0
  handsLeft.value = 4
  discardsLeft.value = 3
  playedCards.value = []
  selectedCardIds.value = new Set()
  invisibleCardIds.value = new Set()
  currentHandTypeName.value = ''
  displayChips.value = 0
  displayMult.value = 0
  showFinalFormula.value = false
  isAnimating.value = false
  aiHighlightedJokerId.value = null
  aiThinking.value = false
  deck.value = createDeck()
  hand.value = []
  nextTick(() => dealCards(8))
}

// ===== 发牌动效 — PRD §5.2 从牌堆飞入 =====
async function dealCards(count) {
  const available = Math.min(count, deck.value.length)
  const newCards = deck.value.splice(0, available)
  for (const c of newCards) hand.value.push(c)
  await nextTick()
  for (let i = 0; i < newCards.length; i++) {
    setTimeout(() => spawnDealAnim(newCards[i]), ms(60) * i)
  }
  await sleep(ms(60) * newCards.length + ms(420))
}

function spawnDealAnim(card) {
  const deckEl = deckRef.value
  const handEl = handAreaRef.value
  if (!deckEl || !handEl) return

  const deckRect = deckEl.getBoundingClientRect()
  const deckCx = deckRect.left + deckRect.width / 2
  const deckCy = deckRect.top  + deckRect.height / 2

  const cardEls = handEl.querySelectorAll('.poker-card')
  const idx = hand.value.findIndex(c => c.id === card.id)
  const targetEl = cardEls[idx]
  if (!targetEl) return

  const targetRect = targetEl.getBoundingClientRect()
  const targetCx = targetRect.left + targetRect.width / 2
  const targetCy = targetRect.top  + targetRect.height / 2

  const clone = document.createElement('div')
  clone.style.cssText = `
    position: fixed;
    width: 100px; height: 145px;
    background: linear-gradient(135deg, #6b3ec9, #2d0d6e);
    border: 2px solid #1a0f24; border-radius: 8px;
    left: ${deckCx - 50}px;
    top:  ${deckCy - 72}px;
    z-index: 800;
    pointer-events: none;
  `
  document.body.appendChild(clone)

  const dx = targetCx - deckCx
  const dy = targetCy - deckCy

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      clone.style.transition = `transform ${ms(380)}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${ms(380)}ms ease`
      clone.style.transform = `translate(${dx}px, ${dy}px)`
      clone.style.opacity = '0.2'
    })
  })

  setTimeout(() => clone.remove(), ms(420))
}

// ===== 选牌 =====
function toggleSelect(card) {
  if (isAnimating.value) return
  const ids = new Set(selectedCardIds.value)
  if (ids.has(card.id)) {
    ids.delete(card.id)
  } else {
    if (ids.size >= 5) return
    ids.add(card.id)
  }
  selectedCardIds.value = ids
}

// ===== 排序 =====
const RANK_ORDER_SORT = { A:14, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, J:11, Q:12, K:13 }
const SUIT_ORDER = { '♠':1, '♥':2, '♦':3, '♣':4 }
function sortByRank() {
  hand.value = [...hand.value].sort((a, b) => RANK_ORDER_SORT[b.rank] - RANK_ORDER_SORT[a.rank])
}
function sortBySuit() {
  hand.value = [...hand.value].sort((a, b) => {
    if (SUIT_ORDER[a.suit] !== SUIT_ORDER[b.suit]) return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
    return RANK_ORDER_SORT[b.rank] - RANK_ORDER_SORT[a.rank]
  })
}

// ===== AI 出牌 — PRD §5.5 =====
async function handleAiPlay() {
  if (isAnimating.value || aiThinking.value) return
  aiThinking.value = true
  await sleep(ms(800))
  const bestIds = aiBestPlay(hand.value, ownedJokers.value)
  selectedCardIds.value = new Set(bestIds)
  await sleep(200)
  aiThinking.value = false
  await handlePlay()
}

// ===== AI 商店建议 =====
async function handleAiShop() {
  if (aiThinking.value) return
  aiThinking.value = true
  await sleep(ms(600))
  const bestId = aiBestShopJoker(shopJokers.value, ownedJokers.value, gold.value)
  aiHighlightedJokerId.value = bestId
  aiThinking.value = false
}

// ===== 出牌 — 完整 §5.1 动效时间线 =====
async function handlePlay() {
  if (selectedCards.value.length === 0 || isAnimating.value) return
  isAnimating.value = true

  const cards = [...selectedCards.value]
  selectedCardIds.value = new Set()

  // 步骤 1：飞牌到出牌区（350ms）
  await flyCardsToPlayArea(cards)

  // 从 hand 移除，放入 playedCards
  for (const c of cards) {
    const idx = hand.value.findIndex(h => h.id === c.id)
    if (idx !== -1) hand.value.splice(idx, 1)
  }
  playedCards.value = [...cards]
  invisibleCardIds.value = new Set()

  await sleep(ms(50))

  // 步骤 2：设牌型
  const ht = identifyHand(cards)
  currentHandTypeName.value = ht.name
  displayChips.value = ht.chips
  displayMult.value  = ht.mult
  await sleep(ms(200))

  // 步骤 3：逐张高亮 + chips 飞字
  let runningChips = ht.chips
  for (let i = 0; i < cards.length; i++) {
    highlightedCardIdx.value = i
    const val = cardValue(cards[i].rank)
    runningChips += val
    displayChips.value = runningChips
    spawnFlyText(`+${val}`, getCardPos(i, cards.length), 'chips-fly')
    await sleep(ms(150))
    highlightedCardIdx.value = -1
  }

  // 步骤 4：Joker 触发
  const { chips, mult, score, jokerTriggers } = calcScore(cards, ht, ownedJokers.value)

  for (const trigger of jokerTriggers) {
    const deltaChips = trigger.delta.chips
    const deltaMult  = trigger.delta.mult
    if (deltaChips === 0 && deltaMult === 0) continue

    triggeredJokerIds.value = new Set([trigger.joker.id])
    const jokerPos = getJokerPos(trigger.joker.id)

    if (deltaChips > 0) {
      displayChips.value += deltaChips
      spawnFlyText(`+${deltaChips} Chips`, jokerPos, 'chips-fly')
    }
    if (deltaMult !== 0) {
      displayMult.value = trigger.multAfter
      if (trigger.multType === 'mul') {
        spawnFlyText(`×${trigger.multFactor} Mult`, jokerPos, 'mult-fly')
      } else {
        const sign = deltaMult > 0 ? '+' : ''
        spawnFlyText(`${sign}${deltaMult} Mult`, jokerPos, 'mult-fly')
      }
    }

    await sleep(ms(300))
    triggeredJokerIds.value = new Set()
    await sleep(ms(500))
  }

  // 步骤 5：公式爆出（800ms）
  finalChips.value = chips
  finalMult.value  = mult
  finalScore.value = score
  displayChips.value = chips
  displayMult.value  = mult
  showFinalFormula.value = true
  await sleep(ms(800))

  // 步骤 6：blindScore 累加（RAF 插值 600ms）
  const scoreFrom = blindScore.value
  const scoreTo   = blindScore.value + score
  await animateScore(scoreFrom, scoreTo, ms(600))
  blindScore.value = scoreTo
  displayScore.value = scoreTo
  handsLeft.value -= 1

  await sleep(ms(200))
  showFinalFormula.value = false
  playedCards.value = []
  currentHandTypeName.value = ''
  displayChips.value = 0
  displayMult.value  = 0

  // 步骤 7：补牌发牌
  const needed = 8 - hand.value.length
  if (needed > 0 && deck.value.length > 0) {
    const toDeal = Math.min(needed, deck.value.length)
    const newCards = deck.value.splice(0, toDeal)
    for (const c of newCards) hand.value.push(c)
    await nextTick()
    for (let i = 0; i < newCards.length; i++) {
      setTimeout(() => spawnDealAnim(newCards[i]), ms(60) * i)
    }
    await sleep(ms(60) * newCards.length + ms(420))
  }

  isAnimating.value = false

  // 步骤 8：判定
  if (blindScore.value >= currentBlind.value.target) {
    const reward = calcReward(handsLeft.value)
    gold.value += reward
    await sleep(ms(300))
    enterShop()
  } else if (handsLeft.value === 0) {
    gameState.value = 'lost'
  }
}

// ===== 弃牌 =====
async function handleDiscard() {
  if (selectedCards.value.length === 0 || discardsLeft.value === 0 || isAnimating.value) return
  const cards = [...selectedCards.value]
  selectedCardIds.value = new Set()
  discardsLeft.value -= 1

  for (const c of cards) {
    const idx = hand.value.findIndex(h => h.id === c.id)
    if (idx !== -1) hand.value.splice(idx, 1)
  }

  const needed = 8 - hand.value.length
  if (needed > 0 && deck.value.length > 0) {
    const toDeal = Math.min(needed, deck.value.length)
    const newCards = deck.value.splice(0, toDeal)
    for (const c of newCards) hand.value.push(c)
    await nextTick()
    for (let i = 0; i < newCards.length; i++) {
      setTimeout(() => spawnDealAnim(newCards[i]), ms(60) * i)
    }
    await sleep(ms(60) * newCards.length + ms(420))
  }
}

// ===== 进商店 =====
function enterShop() {
  const pool = [...JOKER_POOL]
  shopJokers.value = []
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    shopJokers.value.push({ ...pool[idx], purchased: false })
    pool.splice(idx, 1)
  }
  aiHighlightedJokerId.value = null
  gameState.value = 'shop'
}

// ===== 商店购买 =====
function buyJoker(sj) {
  if (sj.purchased || gold.value < sj.price || ownedJokers.value.length >= 5) return
  gold.value -= sj.price
  // 深拷贝保留 effect 函数（JOKER_POOL 里的原 effect）
  const original = JOKER_POOL.find(j => j.id === sj.id)
  ownedJokers.value.push({ ...original })
  sj.purchased = true
}

function shopBtnLabel(sj) {
  if (sj.purchased) return '已售出'
  if (ownedJokers.value.length >= 5) return '槽满了'
  if (gold.value < sj.price) return '钱不够'
  return `购买 $${sj.price}`
}
function shopBtnClass(sj) {
  if (sj.purchased) return 'sold'
  if (ownedJokers.value.length >= 5 || gold.value < sj.price) return 'cant'
  return ''
}

// ===== 跳过商店 — PRD §10.2 大盲注通关→won不进shop =====
function skipShop() {
  aiHighlightedJokerId.value = null
  if (currentBlindIndex.value >= BLINDS.length - 1) {
    gameState.value = 'won'
    return
  }
  currentBlindIndex.value += 1
  startNextBlind()
}

function startNextBlind() {
  blindScore.value = 0
  displayScore.value = 0
  handsLeft.value = 4
  discardsLeft.value = 3
  playedCards.value = []
  selectedCardIds.value = new Set()
  currentHandTypeName.value = ''
  displayChips.value = 0
  displayMult.value = 0
  isAnimating.value = false
  gameState.value = 'playing'
  if (deck.value.length < 8) {
    deck.value = createDeck()
  }
  hand.value = []
  nextTick(() => dealCards(8))
}

// ===== 工具函数 =====
function sleep(duration) {
  return new Promise(res => setTimeout(res, duration))
}

async function animateScore(from, to, duration) {
  return new Promise(res => {
    const start = performance.now()
    function step(now) {
      const t = Math.min((now - start) / duration, 1)
      displayScore.value = Math.round(from + (to - from) * easeOut(t))
      if (t < 1) requestAnimationFrame(step)
      else res()
    }
    requestAnimationFrame(step)
  })
}
function easeOut(t) { return 1 - (1 - t) * (1 - t) }

async function flyCardsToPlayArea(cards) {
  if (!playedAreaRef.value || !handAreaRef.value) {
    await sleep(ms(350))
    return
  }

  const targetRect = playedAreaRef.value.getBoundingClientRect()
  const centerX = targetRect.left + targetRect.width / 2
  const cardEls = handAreaRef.value.querySelectorAll('.poker-card')

  for (let i = 0; i < cards.length; i++) {
    const cardIdx = hand.value.findIndex(c => c.id === cards[i].id)
    const el = cardEls[cardIdx]
    if (!el) continue

    const rect = el.getBoundingClientRect()

    const spread  = Math.min(108, (targetRect.width - 20) / Math.max(cards.length, 1))
    const offsetX = (i - (cards.length - 1) / 2) * spread
    const destX   = centerX + offsetX - 50
    const destY   = targetRect.top + 20

    const suitColor = (cards[i].suit === '♥' || cards[i].suit === '♦') ? '#c0232a' : '#1a1a1a'

    const clone = document.createElement('div')
    clone.style.cssText = `
      position: fixed;
      width: 100px; height: 145px;
      background: linear-gradient(180deg, #fff8e1, #f7e9c4);
      border: 2px solid #1a0f24; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; color: ${suitColor};
      left: ${rect.left}px; top: ${rect.top}px;
      z-index: 800;
      box-shadow: 0 4px 12px rgba(0,0,0,.5);
      pointer-events: none;
    `
    clone.textContent = cards[i].suit
    document.body.appendChild(clone)

    const newInvis = new Set(invisibleCardIds.value)
    newInvis.add(cards[i].id)
    invisibleCardIds.value = newInvis

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clone.style.transition = `left ${ms(350)}ms cubic-bezier(0.25,0.46,0.45,0.94), top ${ms(350)}ms cubic-bezier(0.25,0.46,0.45,0.94)`
        clone.style.left = `${destX}px`
        clone.style.top  = `${destY}px`
      })
    })

    setTimeout(() => clone.remove(), ms(400))
  }

  await sleep(ms(380))
}

function getCardPos(idx, total) {
  if (!playedAreaRef.value) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const rect = playedAreaRef.value.getBoundingClientRect()
  const spread = Math.min(108, (rect.width - 20) / Math.max(total, 1))
  const cx = rect.left + rect.width / 2 + (idx - (total - 1) / 2) * spread
  const cy = rect.top + 60
  return { x: cx, y: cy }
}

function getJokerPos(jokerId) {
  const jokerArea = document.querySelector('.joker-row')
  if (!jokerArea) return { x: window.innerWidth / 2, y: 80 }
  const idx = ownedJokers.value.findIndex(j => j.id === jokerId)
  const cards = jokerArea.querySelectorAll('.joker-card')
  const el = cards[idx]
  if (!el) return { x: window.innerWidth / 2, y: 80 }
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + 30 }
}

function spawnFlyText(text, fromPos, cls) {
  const id = ++flyTextIdCnt
  const endY = fromPos.y - 80

  flyTexts.value.push({
    id,
    text,
    cls,
    style: {
      left:       `${fromPos.x - 30}px`,
      top:        `${fromPos.y}px`,
      opacity:    '1',
      transition: 'none',
    },
  })

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const ft = flyTexts.value.find(f => f.id === id)
      if (ft) {
        ft.style = {
          left:       `${fromPos.x - 30}px`,
          top:        `${endY}px`,
          opacity:    '0',
          transition: `top ${ms(400)}ms ease-out, opacity ${ms(400)}ms ease-out`,
        }
      }
    })
  })

  setTimeout(() => {
    flyTexts.value = flyTexts.value.filter(f => f.id !== id)
  }, ms(450))
}
</script>

<style scoped>
.game-root {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 齿轮按钮浮在右上角 */
.gear-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
}

/* 右主区 — PRD §10.3 grid-template-rows: 230px 1fr 280px */
.main-area {
  flex: 1;
  display: grid;
  grid-template-rows: 230px 1fr 280px;
  overflow: hidden;
  position: relative;
  min-width: 0;
}

/* 第1段 Joker 区 */
.joker-section {
  background: rgba(15,23,42,.6);
  border-bottom: 1px solid rgba(74,107,255,.15);
  padding: 12px 16px 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.joker-title { margin-bottom: 8px; flex-shrink: 0; }
.pixel-title {
  font-family: var(--pixel);
  font-size: 12px;
  color: var(--gold);
  text-shadow: 2px 2px 0 #000, -1px -1px 0 #000;
  letter-spacing: 1px;
}
.joker-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
  overflow: hidden;
}

/* 空槽 — PRD §4.3 同尺寸 140×200 */
.joker-empty-slot {
  width: 140px;
  height: 200px;
  flex-shrink: 0;
  border: 2px dashed rgba(79,70,229,.4);
  border-radius: 10px;
  background: rgba(74,107,255,.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.slot-plus  { font-size: 24px; color: var(--muted); line-height: 1; }
.slot-label { font-size: 12px; color: var(--muted); }

/* 第2段 出牌区 */
.play-section {
  background: rgba(5,8,24,.5);
  border-bottom: 1px solid rgba(74,107,255,.15);
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.play-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  flex-shrink: 0;
}
.play-title    { font-size: 13px; font-weight: 700; color: var(--muted); }
.play-hand-name { font-size: 16px; font-weight: 700; color: #4dd6ff; }

.played-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  min-height: 0;
  padding-top: 4px;
}
.played-cards-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.play-empty-hint {
  font-size: 14px;
  color: var(--muted);
  opacity: 0.55;
  align-self: center;
}

/* 公式预览 */
.formula-preview {
  align-self: center;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--pixel);
  font-weight: 900;
}
.fml-chips { color: #4dd6ff; font-size: 18px; }
.fml-x     { color: var(--text-dim); font-size: 14px; }
.fml-mult  { color: #ff8844; font-size: 18px; }
.fml-eq    { color: var(--text-dim); font-size: 14px; }
.fml-score { color: var(--gold); font-size: 22px; }

/* 最终公式爆出 */
.final-formula {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--pixel);
  font-weight: 900;
  z-index: 20;
  pointer-events: none;
  background: rgba(5,8,24,.7);
  border-radius: 8px;
}
.ff-chips { color: #4dd6ff; font-size: 36px; text-shadow: 0 0 20px #4dd6ff; }
.ff-x     { color: var(--text-dim); font-size: 24px; }
.ff-mult  { color: #ff8844; font-size: 36px; text-shadow: 0 0 20px #ff8844; }
.ff-eq    { color: var(--text-dim); font-size: 24px; }
.ff-score { color: var(--gold); font-size: 48px; text-shadow: 0 0 28px var(--gold); }

.formula-pop-enter-active { animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.formula-pop-leave-active { animation: pop-out 0.2s ease-in; }
@keyframes pop-in  { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pop-out { from { transform: scale(1);   opacity: 1; } to { transform: scale(0.8); opacity: 0; } }

/* 牌堆 — PRD §4.4 absolute bottom:16px right:16px */
.deck-pile {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 90px;
  height: 130px;
  z-index: 2;
  pointer-events: none;
}
.deck-layer {
  position: absolute;
  inset: 0;
  background-color: #fff;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid #1a0f24;
  border-radius: 8px;
}
.deck-layer-3 { transform: translate(-6px, 6px); opacity: .45; }
.deck-layer-2 { transform: translate(-3px, 3px); opacity: .75; }
.deck-count {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--display);
  font-size: 16px;
  color: var(--gold);
  white-space: nowrap;
  font-weight: 400;
}

/* 第3段 手牌 */
.hand-section {
  padding: 36px 130px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-top: -26px;
}
.hand-title { font-size: 14px; font-weight: 800; color: var(--gold); }
.hand-count { font-size: 13px; font-weight: 700; color: var(--muted); }

.hand-cards-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-shrink: 0;
}
.card-invisible { visibility: hidden; }

.action-btns {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

/* 商店覆层 */
.shop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5,8,24,.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  grid-row: 1 / -1;
}
.shop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 24px;
}
.shop-title    { font-size: 28px; font-weight: 900; color: var(--gold); }
.shop-subtitle { font-size: 14px; color: var(--text-dim); font-weight: 600; }
.shop-jokers {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
}
.shop-joker-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.shop-footer {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 8px;
}

/* 结束覆层 */
.end-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5,8,24,.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  grid-row: 1 / -1;
}
.end-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 32px 40px;
  background: linear-gradient(180deg, #1e3068, #0a1438);
  border: 2px solid rgba(74,107,255,.5);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0,0,0,.7);
}
.end-title     { font-size: 32px; font-weight: 900; }
.won-title     { color: var(--gold); }
.lost-title    { color: #ef4444; }
.end-sub       { font-size: 15px; color: var(--text-dim); font-weight: 600; }
.end-jokers    { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.end-jokers-label { font-size: 13px; color: var(--muted); }
.end-jokers-row   { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* 飞字容器 */
.fly-texts-container { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
</style>
