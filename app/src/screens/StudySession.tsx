import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpIcon, CheckIcon, CloseIcon, RotateIcon } from '../components/Icons'
import { TcgCard } from '../components/TcgCard'
import { recordAnswer } from '../lib/api'
import { SPECIAL_COLORS, vibrate } from '../lib/meta'
import { foilForBox, type AnswerResult, type PulledCard } from '../types'

interface Props {
  pack: PulledCard[]
  label: string
  onDone: (results: AnswerResult[]) => void
  onQuit: (results: AnswerResult[]) => void
}

const SWIPE_DISTANCE = 90
const SWIPE_VELOCITY = 600

// forward: the old card leaves upward and the next rises from below; back is the mirror image
const SLIDE = {
  enter: (dir: number) => ({ y: dir > 0 ? 140 : -140, opacity: 0, scale: 0.9 }),
  center: { y: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    y: dir > 0 ? -720 : 720,
    opacity: 0,
    rotate: dir > 0 ? -6 : 6,
    transition: { duration: 0.35 },
  }),
}

export function StudySession({ pack, label, onDone, onQuit }: Props) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [flipped, setFlipped] = useState(false)
  // one answer per card: going back shows the grade, it does not allow grading again
  const [gradedAt, setGradedAt] = useState<Record<number, AnswerResult>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const item = pack[index]
  const graded = gradedAt[index] ?? null
  const results = pack.flatMap((_, i) => (gradedAt[i] ? [gradedAt[i]] : []))

  const goTo = useCallback(
    (to: number) => {
      setDirection(to > index ? 1 : -1)
      setIndex(to)
      setFlipped(false)
      setError(null)
    },
    [index],
  )

  // swiping up without grading skips the card: no progress change
  const next = useCallback(() => {
    if (saving) return
    if (index + 1 >= pack.length) {
      onDone(results)
      return
    }
    goTo(index + 1)
  }, [index, pack.length, results, saving, onDone, goTo])

  const previous = useCallback(() => {
    if (saving || index === 0) return
    goTo(index - 1)
  }, [index, saving, goTo])

  const grade = useCallback(
    async (gotIt: boolean) => {
      if (!flipped || graded || saving) return
      setSaving(true)
      setError(null)
      try {
        const result = await recordAnswer(item.card, gotIt)
        vibrate(gotIt ? 15 : [10, 30, 10])
        setGradedAt((g) => ({ ...g, [index]: result }))
      } catch {
        setError('Could not save that answer. Check your connection and try again.')
      } finally {
        setSaving(false)
      }
    },
    [flipped, graded, saving, item, index],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowLeft' || e.key === '1') grade(false)
      else if (e.key === 'ArrowRight' || e.key === '2') grade(true)
      else if (e.key === 'ArrowUp') next()
      else if (e.key === 'ArrowDown') previous()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grade, next, previous])

  if (!item) return null

  // the card keeps the foil it was pulled with; promotions are revealed on the summary
  const foil = item.special ? 4 : foilForBox(item.box)

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
            {pack.map((p, i) => (
              <span
                key={p.card.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i === index ? 'bg-white/60 ring-1 ring-white' : gradedAt[i] ? 'bg-white' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-sm tabular-nums text-white/60">
          {index + 1}/{pack.length}
        </span>
      </header>

      <div className="relative flex flex-1 items-center justify-center py-4">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.8, bottom: index > 0 ? 0.8 : 0.1 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -SWIPE_DISTANCE || info.velocity.y < -SWIPE_VELOCITY) next()
              else if (info.offset.y > SWIPE_DISTANCE || info.velocity.y > SWIPE_VELOCITY) previous()
            }}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className="relative"
          >
            <SlotTag pulled={item} />
            <TcgCard
              card={item.card}
              foil={foil}
              mono={item.special?.color}
              reverse={item.slot === 'review' && !item.special}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
            />
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
                !graded.gotIt
                  ? 'bg-rose-400/15 text-rose-200'
                  : graded.counted
                    ? 'bg-emerald-400/20 text-emerald-200'
                    : 'bg-white/10 text-white/70'
              }`}
            >
              {!graded.gotIt
                ? 'Missed · it comes back tomorrow'
                : graded.counted
                  ? `+${graded.xp} XP`
                  : 'Practice · not due yet, so no XP'}
            </motion.p>
            <button onClick={next} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowUpIcon className="h-4 w-4 animate-bounce" />
              Swipe up for the next card{index > 0 && ', down to go back'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const SLOT_TAGS: Partial<Record<PulledCard['slot'], { text: string; className: string }>> = {
  review: { text: 'Review', className: 'bg-sky-300 text-black' },
  ex: { text: 'EX', className: 'bg-gradient-to-r from-orange-400 to-rose-500 text-white' },
}

function SlotTag({ pulled }: { pulled: PulledCard }) {
  if (pulled.special) {
    const color = SPECIAL_COLORS[pulled.special.color]
    return (
      <span
        className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
        style={{ background: color.hex, boxShadow: `0 0 14px ${color.hex}` }}
      >
        {color.name} Special Art
      </span>
    )
  }
  const tag = SLOT_TAGS[pulled.slot]
  if (!tag) return null
  return (
    <span
      className={`absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tag.className}`}
    >
      {tag.text}
    </span>
  )
}
