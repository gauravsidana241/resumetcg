import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { FlameIcon } from '../components/Icons'
import { getHome } from '../lib/api'
import { RARITY_META } from '../lib/meta'
import { FOIL_NAMES, foilForBox, type AnswerResult, type HomeStats } from '../types'

interface Props {
  results: AnswerResult[]
  onHome: () => void
}

export function SummaryScreen({ results, onHome }: Props) {
  const [stats, setStats] = useState<HomeStats | null>(null)

  useEffect(() => {
    getHome().then(setStats).catch(() => setStats(null))
  }, [])

  const xp = results.reduce((sum, r) => sum + r.xp, 0)
  const correct = results.filter((r) => r.gotIt).length

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 safe-top safe-bottom">
      <motion.header
        className="pt-6 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Session complete</p>
        <h1 className="mt-2 font-display text-5xl font-bold text-shine">+{xp} XP</h1>
        <p className="mt-2 text-white/70">
          {results.length === 0
            ? 'No cards graded this time.'
            : `${correct} of ${results.length} answers right`}
        </p>
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

      <ul className="flex flex-col gap-2">
        {results.map((r, i) => {
          const from = FOIL_NAMES[foilForBox(r.boxBefore)]
          const to = FOIL_NAMES[foilForBox(r.boxAfter)]
          return (
            <motion.li
              key={i}
              className="flex items-center gap-3 rounded-xl glass px-3 py-2.5"
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.04 }}
            >
              <span className={r.card.rarity === 'ultra' ? 'text-yellow-300' : 'text-white/70'}>
                {RARITY_META[r.card.rarity].symbol}
              </span>
              <span className="flex-1 truncate text-sm">{r.card.title}</span>
              <span className={`text-xs font-semibold ${r.gotIt ? 'text-emerald-300' : 'text-rose-300'}`}>
                {from === to ? to : `${from} → ${to}`}
              </span>
            </motion.li>
          )
        })}
      </ul>

      <button onClick={onHome} className="mt-auto rounded-full bg-white py-3.5 font-display font-bold text-black">
        Back to home
      </button>
    </div>
  )
}
