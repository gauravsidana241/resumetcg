import type { CardType, Rarity, SpecialColor } from '../types'

// Each card type maps to a TCG energy type, which sets its color and symbol (see TypeSymbol).
// ink is the symbol color on the energy ball: dark on the light yellow and silver, white elsewhere.
export const TYPE_META: Record<CardType, { label: string; energy: string; color: string; ink: string }> = {
  concept: { label: 'Concept', energy: 'Psychic', color: '#a855f7', ink: '#ffffff' },
  syntax: { label: 'Syntax', energy: 'Lightning', color: '#facc15', ink: '#3b2a03' },
  boss: { label: 'Boss', energy: 'Dragon', color: '#b7791f', ink: '#ffffff' },
  tradeoff: { label: 'Trade-off', energy: 'Metal', color: '#94a3b8', ink: '#1e293b' },
  trap: { label: 'Trap', energy: 'Darkness', color: '#2f8f8a', ink: '#ffffff' },
  story: { label: 'Story', energy: 'Fighting', color: '#c2691e', ink: '#ffffff' },
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
