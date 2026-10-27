import type { ReactNode } from 'react'
import { CARD_HEIGHT, CARD_WIDTH } from './TcgCard'

// Renders a full-size (330px) card shrunk to `scale`, taking up only the scaled space
export function Scaled({ scale, children }: { scale: number; children: ReactNode }) {
  return (
    <div className="relative" style={{ width: CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}>
      <div
        className="absolute left-0 top-0"
        style={{ width: CARD_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  )
}

export function CardSleeve() {
  return (
    <div className="sleeve">
      <div className="sleeve-inner">
        <div className="sleeve-emblem">
          <span>RT</span>
        </div>
      </div>
    </div>
  )
}
