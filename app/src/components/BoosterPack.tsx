import { motion } from 'motion/react'
import { getIcon } from '../lib/icons'
import type { CardSet } from '../types'
import { setVars } from './ui'

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
      style={setVars(set)}
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
        <p className="booster-note absolute inset-x-0 bottom-1 text-center ui-heading text-[10px] tracking-[0.2em]">
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
                <svg key={slug} viewBox="0 0 24 24" className={`${size} drop-shadow-[0_2px_0_rgb(0_0_0_/_0.2)]`}>
                  {/* the set's ink color, so the logos read on light packs too */}
                  <path d={icon.path} fill="currentColor" />
                </svg>
              )
            )
          })}
        </div>
        <div>
          <p
            className={`ui-heading booster-title leading-none ${line1.length > 7 ? 'text-3xl' : 'text-4xl'}`}
          >
            {line1}
          </p>
          <p className="ui-heading booster-title text-4xl leading-none">{line2}</p>
        </div>
        <div className="booster-plate">
          {label}
        </div>
        <p className="booster-note text-[11px] font-semibold">10 cards · 1 Rare or EX slot</p>
        <div className="crimp bottom-0" />
      </motion.div>
    </motion.div>
  )
}
