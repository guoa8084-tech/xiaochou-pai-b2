// ============================================================
// 游戏核心逻辑 — 数值全部来自 PRD §3 锁定值，不允许修改
// ============================================================

// ===== 牌组生成 =====
export const SUITS = ['♠', '♥', '♦', '♣']
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}${suit}` })
    }
  }
  return shuffleDeck(deck)
}

export function shuffleDeck(deck) {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

// ===== 点数计算 — PRD §1.2 锁定 =====
export function cardValue(rank) {
  if (rank === 'A') return 11
  if (['J', 'Q', 'K'].includes(rank)) return 10
  return parseInt(rank)
}

// ===== 牌型识别 — PRD §1.1 数值锁定 =====
export const HAND_TYPES = {
  STRAIGHT_FLUSH: { name: '同花顺', chips: 100, mult: 8, rank: 9 },
  FOUR_OF_A_KIND: { name: '四条',   chips: 60,  mult: 7, rank: 8 },
  FULL_HOUSE:     { name: '葫芦',   chips: 40,  mult: 4, rank: 7 },
  FLUSH:          { name: '同花',   chips: 35,  mult: 4, rank: 6 },
  STRAIGHT:       { name: '顺子',   chips: 30,  mult: 4, rank: 5 },
  THREE_OF_A_KIND:{ name: '三条',   chips: 30,  mult: 3, rank: 4 },
  TWO_PAIR:       { name: '两对',   chips: 20,  mult: 2, rank: 3 },
  PAIR:           { name: '对子',   chips: 10,  mult: 2, rank: 2 },
  HIGH_CARD:      { name: '高牌',   chips: 5,   mult: 1, rank: 1 },
}

const RANK_ORDER = { 'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 }

function isStraight(cards) {
  if (cards.length !== 5) return false
  const vals = cards.map(c => RANK_ORDER[c.rank]).sort((a, b) => a - b)
  // 普通顺子
  const isNormal = vals.every((v, i) => i === 0 || v === vals[i - 1] + 1)
  if (isNormal) return true
  // A-2-3-4-5
  const wheel = [2, 3, 4, 5, 14]
  return vals.every((v, i) => v === wheel[i])
}

function isFlush(cards) {
  if (cards.length !== 5) return false
  return cards.every(c => c.suit === cards[0].suit)
}

export function identifyHand(cards) {
  if (cards.length === 0) return null

  const rankCounts = {}
  for (const c of cards) rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1
  const counts = Object.values(rankCounts).sort((a, b) => b - a)

  const flush   = isFlush(cards)
  const straight = isStraight(cards)

  if (cards.length === 5 && flush && straight) return HAND_TYPES.STRAIGHT_FLUSH
  if (counts[0] === 4)   return HAND_TYPES.FOUR_OF_A_KIND
  if (counts[0] === 3 && counts[1] === 2) return HAND_TYPES.FULL_HOUSE
  if (cards.length === 5 && flush)    return HAND_TYPES.FLUSH
  if (cards.length === 5 && straight) return HAND_TYPES.STRAIGHT
  if (counts[0] === 3)   return HAND_TYPES.THREE_OF_A_KIND
  if (counts[0] === 2 && counts[1] === 2) return HAND_TYPES.TWO_PAIR
  if (counts[0] === 2)   return HAND_TYPES.PAIR
  return HAND_TYPES.HIGH_CARD
}

// ===== Joker 候选库 — PRD §2.1 字段+数值锁定 =====
export const JOKER_POOL = [
  {
    id: 'jester',
    name: '小丑',
    rarity: 'common',
    price: 3,
    art: '🃏',
    desc: '每手 +4 倍率（无条件加成）',
    effect: (ctx) => { ctx.mult += 4 },
  },
  {
    id: 'scholar',
    name: '学者',
    rarity: 'common',
    price: 3,
    art: '📖',
    desc: '打出的牌每张 A：+4 倍率',
    effect: (ctx) => {
      const aces = ctx.playedCards.filter(c => c.rank === 'A').length
      ctx.mult += aces * 4
    },
  },
  {
    id: 'heart_collector',
    name: '红心收藏家',
    rarity: 'rare',
    price: 5,
    art: '❤️',
    desc: '打出的牌里含 ♥ 时，倍率 ×4',
    effect: (ctx) => {
      if (ctx.playedCards.some(c => c.suit === '♥')) ctx.mult *= 4
    },
  },
  {
    id: 'club_lover',
    name: '梅花爱好者',
    rarity: 'rare',
    price: 5,
    art: '♣',
    desc: '打出的牌里含 ♣ 时，倍率 ×4',
    effect: (ctx) => {
      if (ctx.playedCards.some(c => c.suit === '♣')) ctx.mult *= 4
    },
  },
  {
    id: 'royal_face',
    name: '皇家头牌',
    rarity: 'rare',
    price: 5,
    art: '👑',
    desc: '打出的牌里含 J / Q / K 时，倍率 ×10',
    effect: (ctx) => {
      if (ctx.playedCards.some(c => ['J', 'Q', 'K'].includes(c.rank))) ctx.mult *= 10
    },
  },
  {
    id: 'sf_master',
    name: '同花顺大师',
    rarity: 'legendary',
    price: 8,
    art: '🔥',
    desc: '打出同花顺时 +50 倍率',
    effect: (ctx) => {
      if (ctx.handType === HAND_TYPES.STRAIGHT_FLUSH) ctx.mult += 50
    },
  },
]

// 稀有度颜色 — PRD §2.2 锁定
export const RARITY_COLOR = {
  common:    '#6cb4d3',
  uncommon:  '#5bc97a',
  rare:      '#e34b6f',
  legendary: '#b577ff',
}

// ===== 盲注配置 — PRD §3.1 锁定 =====
export const BLINDS = [
  { name: '小盲注', target: 300, icon: '🔵', reward: 5 },
  { name: '中盲注', target: 500, icon: '🟡', reward: 6 },
  { name: '大盲注', target: 800, icon: '🔴', reward: 7 },
]

// 通关奖励公式 — PRD §3.2 锁定
// 奖金 = $5 + 剩余手数 × $1（注意这里 reward 是基础 5，手数另加）
export function calcReward(handsLeft) {
  return 5 + handsLeft
}

// ===== 计分 — PRD §1.2 公式 =====
export function calcScore(playedCards, handType, ownedJokers) {
  const baseChips = handType.chips + playedCards.reduce((sum, c) => sum + cardValue(c.rank), 0)
  const baseMult  = handType.mult

  const ctx = {
    chips: baseChips,
    mult: baseMult,
    playedCards,
    handType,
  }

  const jokerTriggers = [] // 记录每张 Joker 的触发前后变化，用于动效
  for (const joker of ownedJokers) {
    const before = { chips: ctx.chips, mult: ctx.mult }
    joker.effect(ctx)
    const deltaChips = ctx.chips - before.chips
    const deltaMult  = ctx.mult  - before.mult
    // 判断乘法：若 before.mult > 0 且 after / before 是整数倍
    let multType = 'add'
    let multFactor = deltaMult
    if (before.mult > 0 && deltaMult !== 0) {
      const ratio = ctx.mult / before.mult
      if (Number.isInteger(ratio) && ratio > 1) {
        multType = 'mul'
        multFactor = ratio
      }
    }
    jokerTriggers.push({
      joker,
      delta: { chips: deltaChips, mult: deltaMult },
      multBefore: before.mult,
      multAfter:  ctx.mult,
      multType,
      multFactor,
    })
  }

  return {
    chips: ctx.chips,
    mult:  ctx.mult,
    score: Math.floor(ctx.chips * ctx.mult),
    jokerTriggers,
  }
}

// ===== AI 启发式最优出牌 — PRD §5.5 =====
// 枚举 C(n,k) k∈[1,5] 所有子集，模拟得分取最高
export function aiBestPlay(hand, ownedJokers) {
  if (hand.length <= 5) {
    // 降级：全选
    return hand.map(c => c.id)
  }

  let bestScore = -1
  let bestIds = []

  function combine(start, current) {
    if (current.length >= 1) {
      const ht = identifyHand(current)
      if (ht) {
        const { score } = calcScore(current, ht, ownedJokers)
        if (score > bestScore) {
          bestScore = score
          bestIds = current.map(c => c.id)
        }
      }
    }
    if (current.length === 5) return
    for (let i = start; i < hand.length; i++) {
      combine(i + 1, [...current, hand[i]])
    }
  }

  combine(0, [])
  return bestIds
}

// ===== AI 商店建议 — 性价比最高 Joker =====
export function aiBestShopJoker(shopJokers, ownedJokers, gold) {
  // 按 price/期望增益 估算，选能买的 price 最低的稀有度最高的
  const rarityScore = { legendary: 4, rare: 3, uncommon: 2, common: 1 }
  let best = null
  let bestVal = -1
  for (const j of shopJokers) {
    if (j.purchased) continue
    // 简单估算：rarityScore / price
    const val = rarityScore[j.rarity] / j.price
    if (val > bestVal) { bestVal = val; best = j }
  }
  return best ? best.id : null
}
