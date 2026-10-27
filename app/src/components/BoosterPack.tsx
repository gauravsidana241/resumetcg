import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { getIcon } from '../lib/icons'
import type { CardSet } from '../types'

interface Props {
  set: CardSet
  label: string
  torn: boolean
  onTear: () => void
}

export function BoosterPack({ set, label, torn, onTear }: Props) {
  const [line1, line2] = set.title
  return (
    <motion.div
      className="booster"
      style={{ '--pack-from': set.from, '--pack-to': set.to } as CSSProperties}
      animate={torn ? {} : { y: [0, -8, 0], rotate: [-1, 1, -1] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* the strip you tear off */}
      <motion.div
        className="booster-top"
        drag={torn ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={(_, info) => Math.abs(info.offset.x) > 50 && onTear()}
        animate={torn ? { x: 180, y: -160, rotate: 28, opacity: 0 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="crimp top-0" />
        <p className="absolute inset-x-0 bottom-1 text-center font-display text-[10px] font-bold tracking-[0.3em] text-white/80">
          TEAR ›››
        </p>
      </motion.div>

      <motion.div
        className="booster-body flex flex-col items-center justify-center gap-4 px-5 text-center"
        onClick={onTear}
        animate={torn ? { y: 420, opacity: 0, rotate: -4 } : {}}
        transition={{ duration: 0.55, ease: 'easeIn', delay: 0.2 }}
      >
        <div className={`grid gap-3 opacity-80 ${set.icons.length > 1 ? 'grid-cols-3' : ''}`}>
          {set.icons.map((slug) => {
            const icon = getIcon(slug)
            const size = set.icons.length > 1 ? 'h-7 w-7' : 'h-16 w-16'
            return (
              icon && (
                <svg key={slug} viewBox="0 0 24 24" className={`${size} drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]`}>
                  <path d={icon.path} fill="white" />
                </svg>
              )
            )
          })}
        </div>
        <div>
          <p
            className={`font-display font-bold leading-none tracking-tight text-shine ${
              line1.length > 7 ? 'text-2xl' : 'text-3xl'
            }`}
          >
            {line1}
          </p>
          <p className="font-display text-3xl font-bold leading-none tracking-tight">{line2}</p>
        </div>
        <div className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80">
          {label}
        </div>
        <p className="text-[11px] text-white/70">5 cards · 1 Ultra Rare slot</p>
        <div className="crimp bottom-0" />
      </motion.div>
    </motion.div>
  )
}
