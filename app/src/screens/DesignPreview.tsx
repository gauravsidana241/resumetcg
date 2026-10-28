import type { ReactNode } from 'react'
import { TcgCard } from '../components/TcgCard'
import { exVersion, getCard } from '../data/catalog'
import type { Card, Foil } from '../types'

const SAMPLE_IDS = [
  'data-coalesce',
  'data-join-types',
  'data-select-star',
  'data-mongo-lookup',
  'data-postgres-mvcc',
  'data-mongo-when-not',
  'data-slow-query',
  'data-read-scaling',
]

const COLOR_IDS = [
  'msg-redis',
  'fe-rerenders',
  'cloud-docker',
  'data-mongo-lookup',
  'msg-kafka-basics',
  'be-express',
  'msg-temporal',
  'fynd-pipeline',
]

// Open /#preview to review new card designs before they go live. Needs no sign-in.
export function DesignPreview() {
  const base = getCard('data-indexes')!
  const ex = exVersion(base)!

  return (
    <div className="flex flex-col gap-14 px-4 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Design preview</h1>
        <p className="text-sm text-white/60">Front and back side by side. Nothing here is live yet.</p>
      </header>

      <Section title="EX card" note="The base card on the left, its EX version on the right. The EX asks the base card's Weakness.">
        <Pair card={base} label="Base card" />
        <Pair card={ex} label="EX version" />
      </Section>

      <Section title="Full Art" note="The top foil level. Holo on the left for comparison, the new Full Art on the right.">
        <Single card={getCard('data-postgres-mvcc')!} foil={3} label="Holo (today)" />
        <Single card={getCard('data-postgres-mvcc')!} foil={4} label="Full Art (new)" />
        <Single card={getCard('data-read-scaling')!} foil={4} label="Full Art, two logos" />
        <Single card={ex} foil={4} label="Full Art EX" />
      </Section>

      <Section
        title="Color logos"
        note="Full Art across different brands, including dark logos (Kafka, Express) and one with no Devicon version (Temporal)."
      >
        {COLOR_IDS.map((id) => (
          <Single key={id} card={getCard(id)!} foil={4} label={getCard(id)!.icons.join(' + ')} />
        ))}
      </Section>

      <Section title="New Data & Databases cards" note="One card per question angle, including quick-recall syntax cards.">
        {SAMPLE_IDS.map((id) => (
          <Pair key={id} card={getCard(id)!} />
        ))}
      </Section>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <p className="text-sm text-white/60">{note}</p>
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-10">{children}</div>
    </section>
  )
}

function Pair({ card, label }: { card: Card; label?: string }) {
  return (
    <div className="flex flex-col gap-2" data-card={card.id}>
      {label && <p className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</p>}
      <div className="flex gap-4">
        <TcgCard card={card} foil={0} still />
        <TcgCard card={card} foil={0} flipped still />
      </div>
    </div>
  )
}

function Single({ card, foil, label }: { card: Card; foil: Foil; label: string }) {
  return (
    <div className="flex flex-col gap-2" data-card={card.id}>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</p>
      <TcgCard card={card} foil={foil} still />
    </div>
  )
}
