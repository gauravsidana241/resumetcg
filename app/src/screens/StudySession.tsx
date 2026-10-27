import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpIcon, CheckIcon, CloseIcon, RotateIcon } from '../components/Icons'
import { TcgCard } from '../components/TcgCard'
import { recordAnswer } from '../lib/api'
import { vibrate } from '../lib/meta'
import { FOIL_NAMES, foilForBox, type AnswerResult, type PulledCard } from '../types'

interface QueueItem extends PulledCard {
  retry: boolean
}

interface Props {
  pack: PulledCard[]
  label: string
  onDone: (results: AnswerResult[]) => void
  onQuit: (results: AnswerResult[]) => void
}

const SWIPE_DISTANCE = 90
const SWIPE_VELOCITY = 600

export function StudySession({ pack, label, onDone, onQuit }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>(() => pack.map((p) => ({ ...p, retry: false })))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [graded, setGraded] = useState<AnswerResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])

  const item = queue[index]

  // swiping up without grading skips the card: no progress change
  const next = useCallback(() => {
    if (saving) return
    if (index + 1 >= queue.length) {
      onDone(results)
      return
    }
    setIndex((i) => i + 1)
    setFlipped(false)
    setGraded(null)
    setError(null)
  }, [index, queue.length, results, saving, onDone])

  const grade = useCallback(
    async (gotIt: boolean) => {
      if (!flipped || graded || saving) return
      setSaving(true)
      setError(null)
      try {
        const result = await recordAnswer(item.card, gotIt)
        vibrate(gotIt ? 15 : [10, 30, 10])
        setGraded(result)
        setResults((r) => [...r, result])
        // a missed card comes back once at the end of the pack
        if (!gotIt && !item.retry) setQueue((q) => [...q, { card: item.card, box: 1, retry: true }])
      } catch {
        setError('Could not save that answer. Check your connection and try again.')
      } finally {
        setSaving(false)
      }
    },
    [flipped, graded, saving, item],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowLeft' || e.key === '1') grade(false)
      else if (e.key === 'ArrowRight' || e.key === '2') grade(true)
      else if (e.key === 'ArrowUp') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grade, next])

  if (!item) return null

  const foil = foilForBox(graded ? graded.boxAfter : item.box)

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 safe-top safe-bottom">
      <header className="flex w-full max-w-md items-center gap-3">
        <button
          onClick={() => onQuit(results)}
          className="grid h-10 w-10 place-items-center rounded-full glass text-white/70 hover:text-white"
          aria-label="End session"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</p>
          <div className="mt-1.5 flex gap-1">
            {queue.map((q, i) => (
              <span
                key={q.card.id + q.retry}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < index || (i === index && graded) ? 'bg-white' : i === index ? 'bg-white/50' : 'bg-white/15'
                } ${q.retry ? 'opacity-60' : ''}`}
              />
            ))}
          </div>
        </div>
        <span className="text-sm tabular-nums text-white/60">
          {index + 1}/{queue.length}
        </span>
      </header>

      <div className="relative flex flex-1 items-center justify-center py-4">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={index}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.8, bottom: 0.1 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -SWIPE_DISTANCE || info.velocity.y < -SWIPE_VELOCITY) next()
            }}
            initial={{ y: 140, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -720, opacity: 0, rotate: -6, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className="relative"
          >
            {item.retry && (
              <span className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                Second chance
              </span>
            )}
            <TcgCard card={item.card} foil={foil} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex min-h-[118px] w-full max-w-md flex-col items-center justify-end gap-3">
        {error && <p className="text-center text-sm text-rose-300">{error}</p>}

        {!flipped && (
          <button
            onClick={() => setFlipped(true)}
            className="flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-medium text-white/80"
          >
            <RotateIcon className="h-4 w-4" />
            Recall the answer, then double tap to flip
          </button>
        )}

        {flipped && !graded && (
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              onClick={() => grade(false)}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/15 py-4 font-display text-base font-bold text-rose-200 transition active:scale-95 disabled:opacity-50"
            >
              <CloseIcon className="h-5 w-5" />
              Not yet
            </button>
            <button
              onClick={() => grade(true)}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 py-4 font-display text-base font-bold text-emerald-200 transition active:scale-95 disabled:opacity-50"
            >
              <CheckIcon className="h-5 w-5" />
              Got it
            </button>
          </div>
        )}

        {graded && (
          <>
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-full px-4 py-2 font-display text-sm font-bold ${
                graded.gotIt ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/15 text-rose-200'
              }`}
            >
              {graded.gotIt
                ? `+${graded.xp} XP · ${FOIL_NAMES[foilForBox(graded.boxBefore)]} → ${FOIL_NAMES[foilForBox(graded.boxAfter)]}`
                : item.retry
                  ? 'Back to Plain · it will come back next pack'
                  : 'Back to Plain · you get a second chance at the end'}
            </motion.p>
            <button onClick={next} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowUpIcon className="h-4 w-4 animate-bounce" />
              Swipe up for the next card
            </button>
          </>
        )}
      </div>
    </div>
  )
}
