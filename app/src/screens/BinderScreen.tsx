import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloseIcon } from '../components/Icons'
import { CardSleeve, Scaled } from '../components/Scaled'
import { CARD_WIDTH, TcgCard } from '../components/TcgCard'
import { cards, exVersion, sets, stacks } from '../data/catalog'
import { getProgress, getSpecialPulls } from '../lib/api'
import { RARITY_META, SPECIAL_COLORS } from '../lib/meta'
import { FOIL_NAMES, foilForBox, type Card, type CardProgress, type SpecialColor, type SpecialPull } from '../types'

const COLUMNS = 3
const GAP = 10

export function BinderScreen() {
  const [progress, setProgress] = useState<Map<string, CardProgress> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stackId, setStackId] = useState(stacks[0].id)
  const stack = stacks.find((s) => s.id === stackId)!
  const setStacks = stacks.filter((s) => s.set === stack.set)
  // mono is set when the open card is a Special Art
  const [open, setOpen] = useState<{ card: Card; mono?: SpecialColor } | null>(null)
  const [specials, setSpecials] = useState<SpecialPull[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(0)

  useEffect(() => {
    getProgress()
      .then((p) => {
        setProgress(p)
        // open on the first stack you have actually pulled from
        const first = stacks.find((s) => cards.some((c) => c.stack === s.id && p.has(c.id)))
        if (first) setStackId(first.id)
      })
      .catch(() => setError('Could not load your collection.'))
    getSpecialPulls()
      .then(setSpecials)
      .catch(() => setSpecials([]))
  }, [])

  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scale = gridWidth ? (gridWidth - GAP * (COLUMNS - 1)) / COLUMNS / CARD_WIDTH : 0
  const stackCards = cards.filter((c) => c.stack === stackId)
  const mastery = (ids: Card[]) =>
    ids.length ? Math.round((ids.filter((c) => (progress?.get(c.id)?.box ?? 0) >= 3).length / ids.length) * 100) : 0
  const collected = progress ? cards.filter((c) => progress.has(c.id)).length : 0
  const openProgress = open && !open.mono ? progress?.get(open.card.id) : undefined
  const specialsHere = specials.filter((sp) => stacks.find((st) => st.id === sp.card.stack)?.set === stack.set)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 pb-28 safe-top">
      <header className="px-4">
        <h1 className="font-display text-2xl font-bold">Binder</h1>
        <p className="text-sm text-white/60">
          {collected} of {cards.length} cards pulled · {mastery(cards)}% mastered
        </p>
        {error && <p className="mt-1 text-sm text-rose-300">{error}</p>}
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {sets.map((s) => {
          const active = s.id === stack.set
          const inSet = cards.filter((c) => stacks.find((st) => st.id === c.stack)?.set === s.id)
          return (
            <button
              key={s.id}
              ref={(el) => {
                if (active) el?.scrollIntoView({ inline: 'center', block: 'nearest' })
              }}
              onClick={() => setStackId(stacks.find((st) => st.set === s.id)!.id)}
              className={`flex-none rounded-full px-3.5 py-2 text-sm font-medium transition ${
                active ? 'text-white shadow-lg' : 'glass text-white/70'
              }`}
              style={active ? { background: `linear-gradient(120deg, ${s.from}, ${s.to})` } : undefined}
            >
              {s.name}
              <span className={`ml-1.5 text-xs ${active ? 'text-white/70' : 'text-white/40'}`}>{mastery(inSet)}%</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {setStacks.map((s) => {
          const active = s.id === stackId
          return (
            <button
              key={s.id}
              onClick={() => setStackId(s.id)}
              className={`flex-none rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? 'bg-white text-black' : 'glass text-white/70'
              }`}
            >
              {s.name}
              <span className={`ml-1.5 text-xs ${active ? 'text-black/50' : 'text-white/40'}`}>
                {mastery(cards.filter((c) => c.stack === s.id))}%
              </span>
            </button>
          )
        })}
      </div>

      {specialsHere.length > 0 && (
        <section className="flex flex-col gap-2 px-4">
          <p className="font-display text-lg font-bold">Specials</p>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
            {specialsHere.map((sp) => (
              <button
                key={`${sp.card.id}-${sp.pulledAt}`}
                onClick={() => setOpen({ card: sp.card, mono: sp.color })}
                className="flex flex-none flex-col items-center gap-1 text-left"
              >
                <Scaled scale={0.32}>
                  <TcgCard card={sp.card} foil={4} mono={sp.color} still />
                </Scaled>
                <span className="text-[10px] font-semibold" style={{ color: SPECIAL_COLORS[sp.color].hex }}>
                  {SPECIAL_COLORS[sp.color].name} {sp.kind === 'ex-fa' ? 'EX-FA' : 'FA'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="px-4">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-lg font-bold">{stack.name}</p>
          <p className="text-xs uppercase tracking-widest text-white/40">{stack.kind}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-300 transition-all"
            style={{ width: `${mastery(stackCards)}%` }}
          />
        </div>
      </div>

      <div ref={gridRef} className="grid px-4" style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`, gap: GAP }}>
        {scale > 0 &&
          // an EX card joins the binder, after its base card, once you have pulled it
          stackCards
            .flatMap((card) => {
              const ex = exVersion(card)
              return ex && progress?.has(ex.id) ? [card, ex] : [card]
            })
            .map((card) => {
              const p = progress?.get(card.id)
              return p ? (
                <button key={card.id} onClick={() => setOpen({ card })} className="text-left">
                  <Scaled scale={scale}>
                    <TcgCard card={card} foil={foilForBox(p.box)} still />
                  </Scaled>
                </button>
              ) : (
                <div key={card.id} className="relative opacity-35 grayscale">
                  <Scaled scale={scale}>
                    <CardSleeve />
                  </Scaled>
                  <p className="absolute inset-x-0 bottom-2 text-center text-[10px] font-semibold text-white">
                    {RARITY_META[card.rarity].symbol} {card.number}
                  </p>
                </div>
              )
            })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/70 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setOpen(null)}
          >
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}>
              <TcgCard
                card={open.card}
                foil={open.mono ? 4 : foilForBox(openProgress?.box ?? null)}
                mono={open.mono}
              />
            </motion.div>
            {openProgress && (
              <p className="text-sm text-white/70">
                {FOIL_NAMES[foilForBox(openProgress.box)]} · {nextReview(openProgress.due_at)} · double tap to flip
              </p>
            )}
            <button
              onClick={() => setOpen(null)}
              className="grid h-11 w-11 place-items-center rounded-full glass text-white/80"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function nextReview(dueAt: string): string {
  const days = Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86_400_000)
  if (days <= 0) return 'due now'
  if (days === 1) return 'next review tomorrow'
  return `next review in ${days} days`
}
