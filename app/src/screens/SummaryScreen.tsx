import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloseIcon, FlameIcon } from '../components/Icons'
import { Scaled } from '../components/Scaled'
import { TcgCard } from '../components/TcgCard'
import { getHome } from '../lib/api'
import { RARITY_META, SPECIAL_COLORS } from '../lib/meta'
import { FOIL_NAMES, foilForBox, type AnswerResult, type Card, type HomeStats, type PulledCard } from '../types'

interface Props {
  results: AnswerResult[]
  specials: PulledCard[]
  onHome: () => void
}

export function SummaryScreen({ results, specials, onHome }: Props) {
  const [stats, setStats] = useState<HomeStats | null>(null)
  const [reading, setReading] = useState<Card | null>(null)

  useEffect(() => {
    getHome().then(setStats).catch(() => setStats(null))
  }, [])

  const xp = results.reduce((sum, r) => sum + r.xp, 0)
  const correct = results.filter((r) => r.gotIt).length
  // foil upgrades only show here, never during study
  const promotions = results.filter((r) => r.counted && r.boxAfter > (r.boxBefore ?? 0) && r.boxAfter > 1)
  const missed = results.filter((r) => !r.gotIt)
  const practice = results.filter((r) => r.gotIt && !r.counted).length

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 safe-top safe-bottom">
      <motion.header className="pt-6 text-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Session complete</p>
        <h1 className="mt-2 font-display text-5xl font-bold text-shine">+{xp} XP</h1>
        <p className="mt-2 text-white/70">
          {results.length === 0 ? 'No cards graded this time.' : `${correct} of ${results.length} answers right`}
        </p>
        {practice > 0 && (
          <p className="mt-1 text-xs text-white/45">
            {practice} {practice === 1 ? 'card was' : 'cards were'} practice: right, but not due yet
          </p>
        )}
      </motion.header>

      {stats && (
        <motion.div
          className="flex items-center gap-4 rounded-2xl glass p-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <FlameIcon className="h-10 w-10 text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.7)]" />
          <div>
            <p className="font-display text-xl font-bold">{stats.streak}-day streak</p>
            <p className="text-sm text-white/60">Today's pack counts. Come back tomorrow to keep it going.</p>
          </div>
        </motion.div>
      )}

      {specials.length > 0 && (
        <section className="flex flex-col items-center gap-3">
          <h2 className="font-display text-2xl font-bold italic">Special pull!</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {specials.map(({ card, special }) => (
              <div key={card.id} className="flex flex-col items-center gap-1.5">
                <Scaled scale={0.55}>
                  <TcgCard card={card} foil={4} mono={special!.color} still />
                </Scaled>
                <p className="text-xs font-semibold" style={{ color: SPECIAL_COLORS[special!.color].hex }}>
                  {SPECIAL_COLORS[special!.color].name} {special!.kind === 'ex-fa' ? 'EX-FA' : 'FA'} · added to your
                  binder
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {promotions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Promotions</h2>
          <p className="-mt-1 text-xs text-white/50">New foils show the next time you pull these cards.</p>
          {promotions.map((r, i) => (
            <Row key={r.card.id} result={r} delay={0.2 + i * 0.05}>
              <span className="text-xs font-semibold text-emerald-300">
                {FOIL_NAMES[foilForBox(r.boxBefore)]} → {FOIL_NAMES[foilForBox(r.boxAfter)]}
              </span>
            </Row>
          ))}
        </section>
      )}

      {missed.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Missed</h2>
          <p className="-mt-1 text-xs text-white/50">They come back tomorrow. Tap one to read it again.</p>
          {missed.map((r, i) => (
            <button key={r.card.id} onClick={() => setReading(r.card)} className="text-left">
              <Row result={r} delay={0.25 + i * 0.05}>
                <span className="text-xs font-semibold text-rose-300">Read</span>
              </Row>
            </button>
          ))}
        </section>
      )}

      <button onClick={onHome} className="mt-auto rounded-full bg-white py-3.5 font-display font-bold text-black">
        Back to home
      </button>

      <AnimatePresence>
        {reading && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/75 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setReading(null)}
          >
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}>
              <TcgCard card={reading} foil={0} />
            </motion.div>
            <p className="text-sm text-white/70">Double tap to flip · reading only, nothing is graded</p>
            <button
              onClick={() => setReading(null)}
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

function Row({ result, delay, children }: { result: AnswerResult; delay: number; children: React.ReactNode }) {
  const rarity = RARITY_META[result.card.rarity]
  return (
    <motion.div
      className="flex items-center gap-3 rounded-xl glass px-3 py-2.5"
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
    >
      <span className={result.card.rarity === 'common' ? 'text-white/70' : 'text-yellow-300'}>{rarity.symbol}</span>
      <span className="flex-1 truncate text-sm">
        {result.card.title}
        {result.card.rarity === 'ex' && <span className="ml-1 font-bold italic text-orange-300">ex</span>}
      </span>
      {children}
    </motion.div>
  )
}
