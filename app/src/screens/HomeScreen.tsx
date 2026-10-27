import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { FlameIcon, LogoutIcon } from '../components/Icons'
import { cards as allCards, sets, stacks } from '../data/catalog'
import { getHome } from '../lib/api'
import { AUTH_ENABLED } from '../lib/config'
import { CARDS_PER_PACK, PRODUCTS } from '../lib/meta'
import { supabase } from '../lib/supabase'
import type { CardSet, HomeStats } from '../types'

interface Props {
  onOpen: (packs: number, set: CardSet) => Promise<void>
}

export function HomeScreen({ onOpen }: Props) {
  const [stats, setStats] = useState<HomeStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState<number | null>(null)
  const [set, setSet] = useState<CardSet>(sets[0])

  useEffect(() => {
    getHome()
      .then(setStats)
      .catch(() => setError('Could not load your progress.'))
  }, [])

  async function open(packs: number) {
    setOpening(packs)
    setError(null)
    try {
      await onOpen(packs, set)
    } catch {
      setError('Could not open that pack. Try again.')
      setOpening(null)
    }
  }

  const readiness = stats && stats.total_cards ? Math.round((stats.mastered / stats.total_cards) * 100) : 0

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-28 safe-top">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <span className="text-shine">Resume</span> TCG
        </h1>
        {/* signing out of an anonymous session would lose its progress */}
        {AUTH_ENABLED && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="grid h-10 w-10 place-items-center rounded-full glass text-white/60 hover:text-white"
            aria-label="Sign out"
          >
            <LogoutIcon className="h-4.5 w-4.5" />
          </button>
        )}
      </header>

      <StreakCard stats={stats} />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Due today" value={stats?.due_today} accent="text-sky-300" />
        <Stat label="New cards" value={stats ? stats.total_cards - stats.seen : undefined} accent="text-emerald-300" />
        <Stat label="Mastered" value={stats?.mastered} hint="Gold or better" accent="text-yellow-300" />
        <Stat label="Total XP" value={stats?.xp_total} hint={stats ? `+${stats.xp_today} today` : undefined} accent="text-fuchsia-300" />
      </div>

      <div className="rounded-2xl glass p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-white/80">Interview ready</p>
          <p className="font-display text-xl font-bold">{readiness}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-300"
            initial={{ width: 0 }}
            animate={{ width: `${readiness}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Store</h2>
        <SetPicker selected={set} stats={stats} onSelect={setSet} />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {PRODUCTS.map((product, i) => {
          const cards = product.packs * CARDS_PER_PACK
          // a card never repeats within one opening, so small sets cannot fill big products
          const tooSmall = cards > setSize(set)
          return (
            <motion.button
              key={product.id}
              onClick={() => open(product.packs)}
              disabled={opening !== null || tooSmall}
              className="flex items-center gap-4 rounded-2xl glass p-4 text-left transition hover:bg-white/[0.07] active:scale-[0.98] disabled:opacity-60"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
            >
              <PackStack count={Math.min(product.packs, 3)} set={set} />
              <div className="flex-1">
                <p className="font-display text-base font-bold">{product.name}</p>
                <p className="text-xs text-white/60">
                  {product.packs} {product.packs === 1 ? 'pack' : 'packs'} · {cards} cards · ~{cards} min
                </p>
                <p className="mt-0.5 text-xs text-white/40">
                  {tooSmall ? `Needs ${cards} cards; this set has ${setSize(set)}` : product.blurb}
                </p>
              </div>
              {!tooSmall && (
                <span className="rounded-full bg-white px-3.5 py-1.5 font-display text-sm font-bold text-black">
                  {opening === product.packs ? '...' : 'Open'}
                </span>
              )}
            </motion.button>
          )
        })}
      </section>
    </div>
  )
}

function StreakCard({ stats }: { stats: HomeStats | null }) {
  const lit = stats?.opened_today
  const message = !stats
    ? 'Loading your streak...'
    : stats.opened_today
      ? "Today's pack is opened. See you tomorrow."
      : stats.streak > 0
        ? 'Open a pack today to keep it alive.'
        : 'Open your first pack to start a streak.'

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 glass">
      <div
        className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${lit ? 'bg-orange-500/40' : 'bg-white/5'}`}
      />
      <div className="relative flex items-center gap-4">
        <motion.div
          animate={lit ? { scale: [1, 1.08, 1], rotate: [-2, 2, -2] } : {}}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <FlameIcon
            className={`h-14 w-14 ${lit ? 'text-orange-400 drop-shadow-[0_0_16px_rgba(251,146,60,0.8)]' : 'text-white/25'}`}
          />
        </motion.div>
        <div>
          <p className="font-display text-4xl font-bold leading-none">
            {stats?.streak ?? 0}
            <span className="ml-1.5 text-base font-semibold text-white/60">day streak</span>
          </p>
          <p className="mt-1.5 text-sm text-white/60">{message}</p>
          {stats && stats.best_streak > 0 && <p className="mt-1 text-xs text-white/40">Best: {stats.best_streak} {stats.best_streak === 1 ? 'day' : 'days'}</p>}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, hint, accent }: { label: string; value?: number; hint?: string; accent: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <p className="text-xs font-medium text-white/55">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent}`}>{value ?? '-'}</p>
      {hint && <p className="text-[11px] text-white/40">{hint}</p>}
    </div>
  )
}

function setSize(set: CardSet): number {
  const ids = new Set(stacks.filter((s) => s.set === set.id).map((s) => s.id))
  return allCards.filter((c) => ids.has(c.stack)).length
}

function SetPicker({
  selected,
  stats,
  onSelect,
}: {
  selected: CardSet
  stats: HomeStats | null
  onSelect: (set: CardSet) => void
}) {
  const counts = stats?.sets?.[selected.id]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {sets.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`flex-none rounded-full px-3.5 py-2 text-sm font-medium transition ${
              s.id === selected.id ? 'text-white shadow-lg' : 'glass text-white/70'
            }`}
            style={s.id === selected.id ? { background: `linear-gradient(120deg, ${s.from}, ${s.to})` } : undefined}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/55">
        {selected.tagline}
        {counts && ` · ${counts.due} due · ${counts.total - counts.seen} new`}
      </p>
    </div>
  )
}

// a small fanned stack of booster packs as the product art
function PackStack({ count, set }: { count: number; set: CardSet }) {
  return (
    <div className="relative h-16 w-14 flex-none">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute inset-y-0 w-10 rounded-md border border-white/20 shadow-lg"
          style={
            {
              left: i * 6,
              transform: `rotate(${(i - (count - 1) / 2) * 8}deg)`,
              background: `linear-gradient(140deg, ${set.from}, #1e1b4b 50%, ${set.to})`,
            } as CSSProperties
          }
        >
          <div className="h-2 rounded-t-md border-b border-dashed border-white/40 bg-white/10" />
          <p className="mt-3 text-center font-display text-[7px] font-bold leading-tight">
            {set.title[0].slice(0, 4)}
            <br />
            {set.title[1].slice(0, 4)}
          </p>
        </div>
      ))}
    </div>
  )
}
