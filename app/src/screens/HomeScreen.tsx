import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { FlameIcon, LogoutIcon } from '../components/Icons'
import { getHome } from '../lib/api'
import { CARDS_PER_PACK, PRODUCTS } from '../lib/meta'
import { supabase } from '../lib/supabase'
import type { HomeStats } from '../types'

interface Props {
  onOpen: (packs: number) => Promise<void>
}

export function HomeScreen({ onOpen }: Props) {
  const [stats, setStats] = useState<HomeStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState<number | null>(null)

  useEffect(() => {
    getHome()
      .then(setStats)
      .catch(() => setError('Could not load your progress.'))
  }, [])

  async function open(packs: number) {
    setOpening(packs)
    setError(null)
    try {
      await onOpen(packs)
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
        <button
          onClick={() => supabase.auth.signOut()}
          className="grid h-10 w-10 place-items-center rounded-full glass text-white/60 hover:text-white"
          aria-label="Sign out"
        >
          <LogoutIcon className="h-4.5 w-4.5" />
        </button>
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
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {PRODUCTS.map((product, i) => {
          const cards = product.packs * CARDS_PER_PACK
          return (
            <motion.button
              key={product.id}
              onClick={() => open(product.packs)}
              disabled={opening !== null}
              className="flex items-center gap-4 rounded-2xl glass p-4 text-left transition hover:bg-white/[0.07] active:scale-[0.98] disabled:opacity-60"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
            >
              <PackStack count={Math.min(product.packs, 3)} />
              <div className="flex-1">
                <p className="font-display text-base font-bold">{product.name}</p>
                <p className="text-xs text-white/60">
                  {product.packs} {product.packs === 1 ? 'pack' : 'packs'} · {cards} cards · ~{cards} min
                </p>
                <p className="mt-0.5 text-xs text-white/40">{product.blurb}</p>
              </div>
              <span className="rounded-full bg-white px-3.5 py-1.5 font-display text-sm font-bold text-black">
                {opening === product.packs ? '...' : 'Open'}
              </span>
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

// a small fanned stack of booster packs as the product art
function PackStack({ count }: { count: number }) {
  return (
    <div className="relative h-16 w-14 flex-none">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute inset-y-0 w-10 rounded-md border border-white/20 bg-gradient-to-br from-violet-600 via-indigo-950 to-pink-700 shadow-lg"
          style={{ left: i * 6, transform: `rotate(${(i - (count - 1) / 2) * 8}deg)` }}
        >
          <div className="h-2 rounded-t-md border-b border-dashed border-white/40 bg-white/10" />
          <p className="mt-3 text-center font-display text-[8px] font-bold leading-tight">
            R<br />TCG
          </p>
        </div>
      ))}
    </div>
  )
}
