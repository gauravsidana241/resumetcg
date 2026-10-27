export type Rarity = 'common' | 'rare' | 'ultra'

export type CardType = 'concept' | 'story' | 'tradeoff' | 'trap' | 'boss'

// Leitner box 1-5 shown as a foil finish
export type Foil = 0 | 1 | 2 | 3 | 4

export const FOIL_NAMES = ['Plain', 'Silver', 'Gold', 'Holo', 'Full Art'] as const

export interface Stack {
  id: string
  name: string
  kind: string
}

export interface Card {
  id: string
  number: string
  stack: string
  type: CardType
  rarity: Rarity
  title: string
  icons: string[]
  question: string
  points: string[]
  // the follow-up an interviewer is likely to throw at you
  weakness: string
}

// A card as it came out of a pack: box is null when you have never seen it
export interface PulledCard {
  card: Card
  box: number | null
}

export interface AnswerResult {
  card: Card
  gotIt: boolean
  boxBefore: number | null
  boxAfter: number
  xp: number
}

export interface HomeStats {
  streak: number
  best_streak: number
  opened_today: boolean
  total_cards: number
  seen: number
  due_today: number
  mastered: number
  xp_total: number
  xp_today: number
}

export interface CardProgress {
  box: number
  due_at: string
}

export function foilForBox(box: number | null): Foil {
  return (box ? box - 1 : 0) as Foil
}
