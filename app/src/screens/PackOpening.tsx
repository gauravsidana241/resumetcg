import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BoosterPack } from '../components/BoosterPack'
import { CardSleeve, Scaled } from '../components/Scaled'
import { TcgCard } from '../components/TcgCard'
import { SPECIAL_COLORS, vibrate } from '../lib/meta'
import { foilForBox, type CardSet, type PulledCard } from '../types'

const REVEAL_START_MS = 900
const REVEAL_STEP_MS = 250
const HIT_PAUSE_MS = 500
const EX_PAUSE_MS = 1100
const SPECIAL_PAUSE_MS = 1800
// 10 cards are laid out as two fanned rows of 5
const PER_ROW = 5

interface Props {
  set: CardSet
  pack: PulledCard[]
  label: string
  onDone: () => void
}

type Phase = 'sealed' | 'torn' | 'revealing' | 'ready'

export function PackOpening({ set, pack, label, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('sealed')
  const [revealed, setRevealed] = useState(0)
  const [flash, setFlash] = useState<'hit' | 'ex' | 'special' | null>(null)
  const specialPull = pack.find((p) => p.special)?.special
  const specialHex = specialPull ? SPECIAL_COLORS[specialPull.color].hex : undefined
  const scale = typeof window !== 'undefined' && window.innerWidth < 420 ? 0.29 : 0.34
  const spread = scale * 215
  const rowGap = scale * 520

  function tear() {
    if (phase !== 'sealed') return
    vibrate(30)
    setPhase('torn')
    setTimeout(() => setPhase('revealing'), 650)
  }

  // flip the cards one by one; the hit slot comes last with a pause and a flash, an EX with more,
  // and a Special Art (always the very last card) with the biggest moment of all
  useEffect(() => {
    if (phase !== 'revealing') return
    const timers: number[] = []
    let at = REVEAL_START_MS
    pack.forEach((pulled, i) => {
      const moment = pulled.special ? 'special' : pulled.slot === 'ex' ? 'ex' : pulled.slot === 'hit' ? 'hit' : null
      if (moment) at += moment === 'special' ? SPECIAL_PAUSE_MS : moment === 'ex' ? EX_PAUSE_MS : HIT_PAUSE_MS
      timers.push(
        window.setTimeout(() => {
          setRevealed(i + 1)
          if (moment) {
            setFlash(moment)
            vibrate(moment === 'hit' ? [20, 40, 20] : [30, 50, 30, 50, 60, 50, 90])
            window.setTimeout(() => setFlash(null), moment === 'hit' ? 450 : moment === 'ex' ? 1400 : 2200)
          }
        }, at),
      )
      at += REVEAL_STEP_MS
    })
    timers.push(window.setTimeout(() => setPhase('ready'), at + 200))
    return () => timers.forEach(clearTimeout)
  }, [phase, pack])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4">
      {phase === 'sealed' || phase === 'torn' ? (
        <>
          <BoosterPack set={set} label={label} torn={phase === 'torn'} onTear={tear} />
          <motion.p
            className="text-sm text-white/60"
            animate={{ opacity: phase === 'torn' ? 0 : 1 }}
          >
            Swipe across the top to tear it open, or tap the pack
          </motion.p>
        </>
      ) : (
        <>
          <motion.div
            className="relative flex h-[64dvh] w-full items-center justify-center"
            animate={flash === 'ex' || flash === 'special' ? { x: [0, -8, 8, -6, 6, -3, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {pack.map((pulled, i) => {
              const row = Math.floor(i / PER_ROW)
              const inRow = Math.min(PER_ROW, pack.length - row * PER_ROW)
              const offset = (i % PER_ROW) - (inRow - 1) / 2
              const isRevealed = i < revealed
              const special = pulled.slot === 'hit' || pulled.slot === 'ex' || !!pulled.special
              return (
                <motion.div
                  key={pulled.card.id}
                  className="absolute"
                  initial={{ y: 300, opacity: 0, x: 0, rotate: 0 }}
                  animate={{
                    y: (row - 0.5) * rowGap + Math.abs(offset) * 10,
                    opacity: 1,
                    x: offset * spread,
                    rotate: offset * 6,
                    scale: isRevealed && special ? (pulled.special ? 1.4 : pulled.slot === 'ex' ? 1.3 : 1.12) : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 110, damping: 15, delay: i * 0.05 }}
                  style={{ zIndex: isRevealed && special ? 50 + i : i }}
                >
                  {pulled.box === null && isRevealed && (
                    <span className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                      New
                    </span>
                  )}
                  <div style={{ perspective: 900 }}>
                    <motion.div
                      className="relative"
                      style={{ transformStyle: 'preserve-3d' }}
                      initial={false}
                      animate={{ rotateY: isRevealed ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 140, damping: 14 }}
                    >
                      <div style={{ backfaceVisibility: 'hidden' }}>
                        <Scaled scale={scale}>
                          <CardSleeve />
                        </Scaled>
                      </div>
                      <div
                        className="absolute inset-0"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <Scaled scale={scale}>
                          <TcgCard
                            card={pulled.card}
                            foil={pulled.special ? 4 : foilForBox(pulled.box)}
                            mono={pulled.special?.color}
                            reverse={pulled.slot === 'review' && !pulled.special}
                            still
                          />
                        </Scaled>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          <motion.button
            onClick={onDone}
            disabled={phase !== 'ready'}
            className="rounded-full bg-white px-8 py-3.5 font-display text-base font-bold text-black shadow-[0_0_40px_rgba(168,85,247,0.5)] disabled:opacity-0"
            animate={{ opacity: phase === 'ready' ? 1 : 0, y: phase === 'ready' ? 0 : 12 }}
          >
            Start studying
          </motion.button>
        </>
      )}

      <AnimatePresence>
        {flash && (
          <motion.div
            className={flash === 'ex' ? 'flash flash-ex' : flash === 'special' ? 'flash flash-special' : 'flash'}
            style={{ '--special': specialHex } as CSSProperties}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
        {flash === 'ex' && (
          <motion.p
            className="pointer-events-none fixed inset-x-0 top-[18%] z-[60] text-center font-display text-6xl font-bold italic tracking-tight text-shine drop-shadow-[0_0_24px_rgba(249,115,22,0.9)]"
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: -4 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 12 }}
          >
            EX PULL!
          </motion.p>
        )}
        {flash === 'special' && (
          <motion.p
            className="pointer-events-none fixed inset-x-0 top-[16%] z-[60] text-center font-display text-6xl font-bold italic tracking-tight"
            style={{ color: specialHex, textShadow: `0 0 28px ${specialHex}, 0 2px 0 rgba(0,0,0,0.6)` }}
            initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: -4 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 11 }}
          >
            SPECIAL ART!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
