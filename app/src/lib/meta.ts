import type { CardType, Rarity } from '../types'

export const TYPE_META: Record<CardType, { label: string; color: string; glyph: string }> = {
  concept: { label: 'Concept', color: '#3b82f6', glyph: 'C' },
  story: { label: 'Story', color: '#f59e0b', glyph: 'S' },
  tradeoff: { label: 'Trade-off', color: '#a855f7', glyph: 'T' },
  trap: { label: 'Trap', color: '#ef4444', glyph: '!' },
  boss: { label: 'Boss', color: '#e11d48', glyph: 'B' },
}

export const RARITY_META: Record<Rarity, { label: string; symbol: string; xp: number }> = {
  common: { label: 'Common', symbol: '●', xp: 10 },
  rare: { label: 'Rare', symbol: '◆', xp: 20 },
  ultra: { label: 'Ultra Rare', symbol: '★', xp: 30 },
}

export const CARDS_PER_PACK = 5

export const PRODUCTS = [
  { id: 'single', name: 'Single Pack', packs: 1, blurb: 'A quick daily pull' },
  { id: 'bundle', name: 'Bundle', packs: 3, blurb: 'A proper session' },
  { id: 'box', name: 'Booster Box', packs: 6, blurb: 'Deep prep day' },
] as const

export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}
