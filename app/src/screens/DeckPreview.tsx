import { useState } from 'react'
import { TcgCard } from '../components/TcgCard'
import { cards, stacks } from '../data/catalog'

// Open /#deck to review every card front and back. Needs no sign-in.
export function DeckPreview() {
  const [stackId, setStackId] = useState(stacks[0].id)
  const shown = cards.filter((c) => c.stack === stackId)

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Deck preview</h1>
        <p className="text-sm text-white/60">{cards.length} cards · front and back side by side</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {stacks.map((s) => (
          <button
            key={s.id}
            onClick={() => setStackId(s.id)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium ${
              s.id === stackId ? 'bg-white text-black' : 'glass text-white/70'
            }`}
          >
            {s.name} ({cards.filter((c) => c.stack === s.id).length})
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-12">
        {shown.map((card) => (
          <div key={card.id} className="flex gap-4" data-card={card.id}>
            <TcgCard card={card} foil={0} still />
            <TcgCard card={card} foil={0} flipped still />
          </div>
        ))}
      </div>
    </div>
  )
}
