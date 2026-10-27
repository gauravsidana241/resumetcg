import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BoosterPack } from '../components/BoosterPack'
import { CardSleeve, Scaled } from '../components/Scaled'
import { TcgCard } from '../components/TcgCard'
import { vibrate } from '../lib/meta'
import { foilForBox, type PulledCard } from '../types'

const REVEAL_START_MS = 900
const REVEAL_STEP_MS = 380
const ULTRA_PAUSE_MS = 500

interface Props {
  pack: PulledCard[]
  label: string
  onDone: () => void
}

type Phase = 'sealed' | 'torn' | 'revealing' | 'ready'

export function PackOpening({ pack, label, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('sealed')
  const [revealed, setRevealed] = useState(0)
  const [flash, setFlash] = useState(false)
  const scale = typeof window !== 'undefined' && window.innerWidth < 420 ? 0.29 : 0.36
  const spread = scale * 200

  function tear() {
    if (phase !== 'sealed') return
    vibrate(30)
    setPhase('torn')
    setTimeout(() => setPhase('revealing'), 650)
  }

  // flip the cards one by one; an Ultra Rare in the last slot gets a pause and a flash
  useEffect(() => {
    if (phase !== 'revealing') return
    const timers: number[] = []
    let at = REVEAL_START_MS
    pack.forEach((pulled, i) => {
      const isUltra = pulled.card.rarity === 'ultra'
      if (isUltra && i === pack.length - 1) at += ULTRA_PAUSE_MS
      timers.push(
        window.setTimeout(() => {
          setRevealed(i + 1)
          if (isUltra) {
            setFlash(true)
            vibrate([20, 40, 20])
            window.setTimeout(() => setFlash(false), 450)
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
          <BoosterPack label={label} torn={phase === 'torn'} onTear={tear} />
          <motion.p
            className="text-sm text-white/60"
            animate={{ opacity: phase === 'torn' ? 0 : 1 }}
          >
            Swipe across the top to tear it open, or tap the pack
          </motion.p>
        </>
      ) : (
        <>
          <div className="relative flex h-[60dvh] w-full items-center justify-center">
            {pack.map((pulled, i) => {
              const offset = i - (pack.length - 1) / 2
              const isRevealed = i < revealed
              return (
                <motion.div
                  key={pulled.card.id}
                  className="absolute"
                  initial={{ y: 260, opacity: 0, x: 0, rotate: 0 }}
                  animate={{
                    y: Math.abs(offset) * 14,
                    opacity: 1,
                    x: offset * spread,
                    rotate: offset * 7,
                    scale: isRevealed && pulled.card.rarity === 'ultra' ? 1.12 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 110, damping: 15, delay: i * 0.07 }}
                  style={{ zIndex: i }}
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
                          <TcgCard card={pulled.card} foil={foilForBox(pulled.box)} still />
                        </Scaled>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </div>

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
            className="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
