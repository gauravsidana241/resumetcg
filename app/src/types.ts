// shown as Common / Uncommon / Rare; 'ex' is the follow-up version of a card
export type Rarity = 'common' | 'rare' | 'ultra' | 'ex'

export type CardType = 'concept' | 'story' | 'tradeoff' | 'trap' | 'boss' | 'syntax'

// Leitner box 1-5 shown as a foil finish
export type Foil = 0 | 1 | 2 | 3 | 4

export const FOIL_NAMES = ['Plain', 'Silver', 'Gold', 'Holo', 'Full Art'] as const

// A set is what you open packs from: the resume, or a syntax refresher
export interface CardSet {
  id: string
  name: string
  tagline: string
  // the two lines printed on the booster pack
  title: [string, string]
  icons: string[]
  from: string
  to: string
}

export interface Stack {
  id: string
  name: string
  kind: string
  set: string
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
  // optional code shown under the question, and as the answer on the back
  code?: string
  answer?: string
  points: string[]
  // the follow-up an interviewer is likely to throw at you
  weakness: string
  // the answer to the weakness, which makes this card's EX version
  ex?: { points: string[]; answer?: string }
  // on an EX card: the title of the card it follows up
  exOf?: string
}

// Which pack slot a card filled. Review slots hold cards you have seen before, shown as reverse holo.
export type SlotKind = 'common' | 'uncommon' | 'review' | 'hit' | 'ex'

// A card as it came out of a pack: box is null when you have never seen it
export interface PulledCard {
  card: Card
  box: number | null
  slot: SlotKind
}

export interface AnswerResult {
  card: Card
  gotIt: boolean
  boxBefore: number | null
  boxAfter: number
  xp: number
  // false when a correct answer came before the card was due: practice, no progress
  counted: boolean
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
  sets: Record<string, { total: number; seen: number; due: number }>
}

export interface CardProgress {
  box: number
  due_at: string
}

export function foilForBox(box: number | null): Foil {
  return (box ? box - 1 : 0) as Foil
}
