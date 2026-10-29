import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { motion, useSpring } from 'motion/react'
import { stackName } from '../data/catalog'
import { CodeBlock } from './CodeBlock'
import { TypeSymbol } from './TypeSymbol'
import { getColorLogo, isDarkLogo } from '../lib/colorLogos'
import { brandColor, getIcon } from '../lib/icons'
import { EX_COLOR, RARITY_META, TYPE_META } from '../lib/meta'
import { FOIL_NAMES, type Card, type CardType, type Foil, type SpecialColor } from '../types'

const MAX_TILT = 14
const DOUBLE_TAP_MS = 300
export const CARD_WIDTH = 330
export const CARD_HEIGHT = (CARD_WIDTH * 88) / 63

interface Props {
  card: Card
  foil: Foil
  // controlled flip; leave both unset to let the card manage it
  flipped?: boolean
  onFlip?: () => void
  // fixed 330px width with no gestures, for scaled-down copies
  still?: boolean
  // review slot: a shine on everything except the art, like a reverse holo
  reverse?: boolean
  // Special Art: the whole card in one color, like gold and red etched cards
  mono?: SpecialColor
  // show the Learn more link even on a still (fixed-size) card, for the preview
  learnLink?: boolean
}

export function TcgCard({
  card,
  foil,
  flipped: flippedProp,
  onFlip,
  still = false,
  reverse = false,
  mono,
  learnLink,
}: Props) {
  const [flippedState, setFlippedState] = useState(false)
  const flipped = flippedProp ?? flippedState
  const sceneRef = useRef<HTMLDivElement>(null)
  const lastTap = useRef(0)
  const rotateX = useSpring(0, { stiffness: 180, damping: 18 })
  const rotateY = useSpring(0, { stiffness: 180, damping: 18 })

  const type = TYPE_META[card.type]
  const rarity = RARITY_META[card.rarity]
  const isEx = card.rarity === 'ex'
  // Full Art: the logo fills the whole front, with the text laid over it
  const fullArt = foil === 4
  // Full Art and EX cards take their colors from the logo's brand
  const accent = (fullArt || isEx ? brandColor(card.icons) : undefined) ?? (isEx ? EX_COLOR : type.color)

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = sceneRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * MAX_TILT * 2)
    rotateX.set(-(py - 0.5) * MAX_TILT * 2)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }

  function handleLeave() {
    rotateX.set(0)
    rotateY.set(0)
    sceneRef.current?.style.setProperty('--mx', '50%')
    sceneRef.current?.style.setProperty('--my', '50%')
  }

  function handleTap() {
    const now = Date.now()
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      if (onFlip) onFlip()
      else setFlippedState((f) => !f)
      lastTap.current = 0
    } else {
      lastTap.current = now
    }
  }

  const handlers = still
    ? {}
    : { onPointerMove: handleMove, onPointerLeave: handleLeave, onPointerUp: handleTap }

  return (
    <div
      ref={sceneRef}
      className="tcg-scene"
      data-rarity={card.rarity}
      data-foil={foil}
      data-mono={mono}
      data-silver
      style={
        // a mono card takes its whole palette from CSS, so it does not set --type
        { ...(!mono && { '--type': accent }), ...(still && { '--card-w': `${CARD_WIDTH}px` }) } as CSSProperties
      }
      {...handlers}
    >
      <motion.div className="tcg" style={{ rotateX, rotateY }}>
        <motion.div
          className="tcg-inner"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        >
          {/* Front: the question */}
          <div className={fullArt ? 'face front full-art' : 'face front'}>
            <div className="panel">
              {reverse && !fullArt && <div className="reverse-holo" />}
              <header className="flex items-center gap-2">
                <span className="type-pill">{type.label}</span>
                <h2 className="card-title font-display font-bold tracking-tight line-clamp-2 flex-1">
                  {card.title}
                  {isEx && <span className="ex-badge">ex</span>}
                </h2>
                <span className="font-display text-xs font-semibold text-white/70">
                  XP <span className="text-base text-white">{rarity.xp}</span>
                </span>
                <Orb type={card.type} />
              </header>

              <div className={card.code ? 'art art-compact' : 'art'}>
                <CardArt card={card} color={fullArt || isEx || !!mono} />
                {(card.rarity === 'ultra' || isEx) && <Sparkles />}
                <div className="holo-art" />
              </div>

              {fullArt && <div className="flex-1" />}

              <p className="set-strip">
                {stackName(card.stack)} · {rarity.label}
              </p>

              <div className={`attack flex-col ${fullArt ? '' : 'flex-1'}`}>
                <div className="flex gap-2">
                  <Orb type={card.type} size="orb-sm mt-0.5" />
                  {/* code, or a long question next to the ex rule, needs the smaller size to fit */}
                  <p
                    className={`font-medium leading-snug ${
                      card.code || (isEx && card.question.length > 70) ? 'text-[14.5px]' : 'text-[16.5px]'
                    }`}
                  >
                    {card.question}
                  </p>
                </div>
                {card.code && <CodeBlock code={card.code} />}
              </div>

              {isEx ? (
                <div className="stat-bar stat-bar-rule">
                  <ExRule of={card.exOf} />
                </div>
              ) : (
                <StatBar card={card} />
              )}

              <CardFooter card={card} foil={foil} />
            </div>
            <div className="sheen" />
            <div className="holo-full" />
            <div className="glare" />
          </div>

          {/* Back: the answer */}
          <div className="face back">
            <div className="panel">
              <header className="flex items-center gap-2">
                <span className="type-pill">Answer</span>
                <h2 className="card-title font-display font-bold tracking-tight line-clamp-2 flex-1">
                  {card.title}
                </h2>
                <Orb type={card.type} />
              </header>

              {card.answer && <CodeBlock code={card.answer} />}

              <ul className="flex flex-col gap-2 flex-1 overflow-hidden">
                {card.points.map((point) => (
                  <li key={point} className="flex gap-2 text-[12.5px] leading-snug text-white/90">
                    <Orb type={card.type} size="orb-xs mt-[3px]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {isEx ? (
                <ExRule of={card.exOf} />
              ) : (
                <div className="weakness">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-300/90">
                    Weakness · likely follow-up
                  </p>
                  <p className="text-[12.5px] leading-snug">{card.weakness}</p>
                </div>
              )}

              <CardFooter card={card} foil={foil} link={learnLink ?? !still} />
            </div>
            <div className="sheen" />
            <div className="holo-full" />
            <div className="glare" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function ExRule({ of }: { of?: string }) {
  return (
    <div className="ex-rule">
      <span className="font-display font-bold" style={{ color: 'color-mix(in oklab, var(--type) 45%, white)' }}>
        ex rule
      </span> The follow-up an interviewer asks after{' '}
      <span className="font-semibold text-white">{of}</span>.
    </div>
  )
}

// color: real brand logos instead of the white glowing marks, the reward for Full Art and EX
function CardArt({ card, color }: { card: Card; color: boolean }) {
  // a logo can come from Simple Icons, Devicon, or both (AWS is only in Devicon)
  const icons = card.icons.flatMap((slug) => {
    const icon = getIcon(slug)
    const logo = getColorLogo(slug)
    return icon || logo ? [{ slug, icon, logo }] : []
  })

  if (icons.length === 0) {
    return <TypeSymbol type={card.type} className="art-icon" />
  }

  return (
    <div className={`art-logos flex items-center gap-5 ${icons.length > 1 ? 'art-multi' : ''}`}>
      {icons.map(({ slug, icon, logo }) => {
        const width = icons.length > 1 ? 52 : 92
        if (logo && (color || !icon)) {
          // no white mark available: tint the color logo white for the plain foils
          const look = color ? `logo-color ${isDarkLogo(slug) ? 'logo-dark' : ''}` : 'logo-mono'
          return (
            <img
              key={slug}
              src={logo}
              alt={icon?.title ?? slug}
              draggable={false}
              className={`art-icon ${look}`}
              style={{ width }}
            />
          )
        }
        if (!icon) return null
        return (
          <svg
            key={slug}
            viewBox="0 0 24 24"
            className={`art-icon ${color ? 'logo-color' : ''} ${color && isDarkLogo(slug) ? 'logo-dark' : ''}`}
            style={{ width }}
            role="img"
            aria-label={icon.title}
          >
            {/* no Devicon version: fall back to the mark in its brand color */}
            <path d={icon.path} fill={color ? `#${icon.hex}` : 'currentColor'} />
          </svg>
        )
      })}
    </div>
  )
}

// the energy ball: the type's symbol on a ball of its color
function Orb({ type, size = '' }: { type: CardType; size?: string }) {
  return (
    <span className={`orb ${size}`} style={{ color: TYPE_META[type].ink }}>
      <TypeSymbol type={type} className="orb-symbol" />
    </span>
  )
}

// EXPLORATION: the printed-card stat strip, with the question's follow-ups and its difficulty
const DIFFICULTY: Record<Card['rarity'], number> = { common: 1, rare: 2, ultra: 3, ex: 3 }

function StatBar({ card }: { card: Card }) {
  const followUps = card.weakness ? 1 : 0
  const level = DIFFICULTY[card.rarity]
  return (
    <div className="stat-bar">
      <span>
        Follow-ups <b>×{followUps}</b>
      </span>
      <span className="stat-slash" aria-hidden />
      <span className="flex items-center gap-1.5">
        Difficulty
        <span className="flex gap-0.5">
          {[1, 2, 3].map((n) => (
            <i key={n} className={n <= level ? 'pip pip-on' : 'pip'} />
          ))}
        </span>
      </span>
    </div>
  )
}

function CardFooter({ card, foil, link = false }: { card: Card; foil: Foil; link?: boolean }) {
  const rarity = RARITY_META[card.rarity]
  return (
    <footer className="flex items-center justify-between gap-2 text-[10px] text-white/55 font-medium">
      <span>{FOIL_NAMES[foil]}</span>
      {link && card.learn && <LearnLink url={card.learn} />}
      <span className="flex items-center gap-1.5">
        <span className="rarity-symbol">{rarity.symbol}</span>
        {card.number}
      </span>
    </footer>
  )
}

const SITE_NAMES: Record<string, string> = {
  'developer.mozilla.org': 'MDN',
  'react.dev': 'React docs',
  'www.typescriptlang.org': 'TS Handbook',
  'nodejs.org': 'Node.js docs',
  'docs.python.org': 'Python docs',
  'd2l.ai': 'Dive into DL',
  'scikit-learn.org': 'scikit-learn',
  'www.postgresql.org': 'PostgreSQL docs',
  'use-the-index-luke.com': 'Use The Index, Luke',
  'www.mongodb.com': 'MongoDB docs',
  'microservices.io': 'microservices.io',
  'docs.confluent.io': 'Confluent',
  'kubernetes.io': 'Kubernetes docs',
  'docs.docker.com': 'Docker docs',
  'developer.hashicorp.com': 'Terraform docs',
  'git-scm.com': 'Pro Git',
  'sre.google': 'Google SRE',
  'martinfowler.com': 'Martin Fowler',
  'opentelemetry.io': 'OpenTelemetry',
  'jestjs.io': 'Jest docs',
  'en.wikipedia.org': 'Wikipedia',
}

function siteName(url: string): string {
  const host = new URL(url).hostname
  return SITE_NAMES[host] ?? host.replace(/^(www|docs)\./, '')
}

// Opens a page explaining the concept in full. Stops the tap from counting toward a double-tap flip.
function LearnLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="learn-link"
    >
      Learn more ↗ <span className="text-white/50">{siteName(url)}</span>
    </a>
  )
}

const SPARKLES = [
  { top: '18%', left: '14%', delay: '0s' },
  { top: '70%', left: '22%', delay: '0.8s' },
  { top: '28%', left: '80%', delay: '0.4s' },
  { top: '76%', left: '74%', delay: '1.3s' },
  { top: '48%', left: '52%', delay: '1.9s' },
]

function Sparkles() {
  return (
    <>
      {SPARKLES.map((s) => (
        <span
          key={s.top + s.left}
          className="sparkle"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}
    </>
  )
}
