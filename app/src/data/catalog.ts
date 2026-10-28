import deck from './cards.json'
import type { Card, CardSet, Stack } from '../types'

type DeckCard = Omit<Card, 'number'>

const total = deck.cards.length

export const sets: CardSet[] = deck.sets as CardSet[]

export const stacks: Stack[] = deck.stacks

export const cards: Card[] = (deck.cards as DeckCard[]).map((card, i) => ({
  ...card,
  number: `${String(i + 1).padStart(3, '0')}/${String(total).padStart(3, '0')}`,
}))

const byId = new Map(cards.map((card) => [card.id, card]))

// EX ids are the base card's id plus -ex
export function getCard(id: string): Card | undefined {
  if (id.endsWith('-ex')) {
    const base = byId.get(id.slice(0, -3))
    return base && exVersion(base)
  }
  return byId.get(id)
}

// The EX version asks the card's weakness and answers it
export function exVersion(card: Card): Card | undefined {
  if (!card.ex) return undefined
  return {
    ...card,
    id: `${card.id}-ex`,
    rarity: 'ex',
    question: card.weakness,
    code: undefined,
    answer: card.ex.answer,
    points: card.ex.points,
    weakness: '',
    ex: undefined,
    exOf: card.title,
  }
}

export function getSet(id: string): CardSet {
  return sets.find((s) => s.id === id) ?? sets[0]
}

export function stackName(id: string): string {
  return stacks.find((s) => s.id === id)?.name ?? id
}
