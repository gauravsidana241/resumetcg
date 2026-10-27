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

export function getCard(id: string): Card | undefined {
  return byId.get(id)
}

export function getSet(id: string): CardSet {
  return sets.find((s) => s.id === id) ?? sets[0]
}

export function stackName(id: string): string {
  return stacks.find((s) => s.id === id)?.name ?? id
}
