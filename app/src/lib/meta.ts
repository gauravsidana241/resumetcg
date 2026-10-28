import type { CardType, Rarity, SpecialColor } from '../types'

export const TYPE_META: Record<CardType, { label: string; color: string; glyph: string }> = {
  concept: { label: 'Concept', color: '#3b82f6', glyph: 'C' },
  story: { label: 'Story', color: '#f59e0b', glyph: 'S' },
  tradeoff: { label: 'Trade-off', color: '#a855f7', glyph: 'T' },
  trap: { label: 'Trap', color: '#ef4444', glyph: '!' },
  boss: { label: 'Boss', color: '#e11d48', glyph: 'B' },
  syntax: { label: 'Syntax', color: '#14b8a6', glyph: '{' },
}

export const EX_COLOR = '#f97316'

export const RARITY_META: Record<Rarity, { label: string; symbol: string; xp: number }> = {
  common: { label: 'Common', symbol: '●', xp: 10 },
  rare: { label: 'Uncommon', symbol: '◆', xp: 20 },
  ultra: { label: 'Rare', symbol: '★', xp: 30 },
  ex: { label: 'EX', symbol: '★', xp: 50 },
}

export const CARDS_PER_PACK = 10

// the main color of each Special Art, for its reveal flash and tags
export const SPECIAL_COLORS: Record<SpecialColor, { name: string; hex: string }> = {
  red: { name: 'Red', hex: '#dc2626' },
  gold: { name: 'Gold', hex: '#eab308' },
  black: { name: 'Black', hex: '#3f3f46' },
  white: { name: 'White', hex: '#f4f4f5' },
  silver: { name: 'Silver', hex: '#9ca3af' },
  blue: { name: 'Sapphire', hex: '#2563eb' },
  green: { name: 'Emerald', hex: '#16a34a' },
  purple: { name: 'Amethyst', hex: '#9333ea' },
  rose: { name: 'Rose', hex: '#e11d48' },
}

export const PRODUCTS = [
  { id: 'single', name: 'Single Pack', packs: 1, blurb: 'A quick daily pull' },
  { id: 'bundle', name: 'Bundle', packs: 3, blurb: 'A proper session' },
  { id: 'box', name: 'Booster Box', packs: 6, blurb: 'Deep prep day' },
] as const

export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}
