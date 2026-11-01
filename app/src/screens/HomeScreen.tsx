import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { FlameIcon, LogoutIcon } from '../components/Icons'
import { Counter, HeaderBar, Panel, ProgressBar, setVars } from '../components/ui'
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
      <HeaderBar title="Resume TCG">
        <Counter icon={<FlameIcon className="h-4 w-4 text-orange-400" />} value={stats?.streak ?? 0} />
        <Counter value={`${stats?.xp_total ?? 0} XP`} />
        {/* signing out of an anonymous session would lose its progress */}
        {AUTH_ENABLED && (
          <button onClick={() => supabase.auth.signOut()} aria-label="Sign out" className="ui-icon-button">
            <LogoutIcon className="h-[18px] w-[18px]" strokeWidth={3} />
          </button>
        )}
      </HeaderBar>

      <StreakCard stats={stats} />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Due today" value={stats?.due_today} accent="text-sky-300" />
        <Stat label="New cards" value={stats ? stats.total_cards - stats.seen : undefined} accent="text-emerald-300" />
        <Stat label="Mastered" value={stats?.mastered} hint="Gold or better" accent="text-yellow-300" />
        <Stat label="Total XP" value={stats?.xp_total} hint={stats ? `+${stats.xp_today} today` : undefined} accent="text-fuchsia-300" />
      </div>

      <Panel className="p-4">
        <div className="flex items-baseline justify-between">
          <p className="ui-label text-sm text-[var(--ui-ink-soft)]">Interview ready</p>
          <p className="ui-heading text-2xl">{readiness}%</p>
        </div>
        <div className="mt-2">
          <ProgressBar value={readiness / 100} />
        </div>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="ui-heading text-2xl">Store</h2>
        <SetPicker selected={set} stats={stats} onSelect={setSet} />
        {error && <p className="text-sm font-semibold text-[#ff8a98]">{error}</p>}
        {PRODUCTS.map((product, i) => {
          const cards = product.packs * CARDS_PER_PACK
          // a card never repeats within one opening, so small sets cannot fill big products
          const tooSmall = cards > setSize(set)
          return (
            <motion.button
              key={product.id}
              onClick={() => open(product.packs)}
              disabled={opening !== null || tooSmall}
              className="ui-panel flex items-center gap-4 p-4 text-left transition active:translate-y-1 disabled:opacity-60"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
            >
              <PackStack count={Math.min(product.packs, 3)} set={set} />
              <div className="flex-1">
                <p className="ui-heading text-lg">{product.name}</p>
                <p className="text-xs font-semibold text-[var(--ui-ink-soft)]">
                  {product.packs} {product.packs === 1 ? 'pack' : 'packs'} · {cards} cards · ~{cards} min
                </p>
                <p className="mt-0.5 text-xs text-[var(--ui-ink-soft)] opacity-80">
                  {tooSmall ? `Needs ${cards} cards; this set has ${setSize(set)}` : product.blurb}
                </p>
              </div>
              {!tooSmall && (
                <span className="ui-button ui-button-sm">{opening === product.packs ? '...' : 'Open'}</span>
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
    <div className="ui-panel relative overflow-hidden p-5">
      <div
        className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${lit ? 'bg-orange-500/40' : 'bg-white/5'}`}
      />
      <div className="relative flex items-center gap-4">
        <motion.div
          animate={lit ? { scale: [1, 1.08, 1], rotate: [-2, 2, -2] } : {}}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <FlameIcon
            className={`h-14 w-14 ${lit ? 'text-orange-400 drop-shadow-[0_0_16px_rgba(251,146,60,0.8)]' : 'text-[var(--ui-ink-soft)] opacity-40'}`}
          />
        </motion.div>
        <div>
          <p className="ui-heading text-5xl leading-none">
            {stats?.streak ?? 0}
            <span className="ml-1.5 text-lg text-[var(--ui-ink-soft)]">day streak</span>
          </p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--ui-ink-soft)]">{message}</p>
          {stats && stats.best_streak > 0 && <p className="mt-1 text-xs text-[var(--ui-ink-soft)] opacity-80">Best: {stats.best_streak} {stats.best_streak === 1 ? 'day' : 'days'}</p>}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, hint, accent }: { label: string; value?: number; hint?: string; accent: string }) {
  return (
    <div className="ui-panel p-4">
      <p className="ui-label text-xs text-[var(--ui-ink-soft)]">{label}</p>
      <p className={`ui-heading mt-1 text-3xl ${accent}`}>{value ?? '-'}</p>
      {hint && <p className="text-[11px] font-semibold text-[var(--ui-ink-soft)] opacity-80">{hint}</p>}
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
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {sets.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`ui-heading flex-none rounded-[10px] px-3.5 py-2 text-[15px] transition ${
              s.id === selected.id ? 'ui-set-face' : 'bg-[var(--ui-panel)] text-[var(--ui-ink-soft)]'
            }`}
            style={s.id === selected.id ? setVars(s) : { boxShadow: '0 4px 0 var(--ui-panel-lip)' }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-[var(--ui-ink-soft)]">
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
          className="ui-set-pack absolute inset-y-0 w-10"
          style={
            {
              ...setVars(set),
              left: i * 6,
              transform: `rotate(${(i - (count - 1) / 2) * 8}deg)`,
            } as CSSProperties
          }
        >
          <div className="ui-set-pack-crimp" />
          <p className="mt-3 text-center font-display text-[8px] leading-tight">
            {set.title[0].slice(0, 4)}
            <br />
            {set.title[1].slice(0, 4)}
          </p>
        </div>
      ))}
    </div>
  )
}
