import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { motion, useSpring } from 'motion/react'
import { stackName } from '../data/catalog'
import { CodeBlock } from './CodeBlock'
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
}

export function TcgCard({ card, foil, flipped: flippedProp, onFlip, still = false, reverse = false, mono }: Props) {
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
                <h2
                  className={`font-display font-bold leading-tight tracking-tight line-clamp-2 flex-1 ${
                    card.title.length > 14 ? 'text-[14px]' : 'text-lg'
                  }`}
                >
                  {card.title}
                  {isEx && <span className="ex-badge">ex</span>}
                </h2>
                <span className="font-display text-xs font-semibold text-white/70">
                  XP <span className="text-base text-white">{rarity.xp}</span>
                </span>
                <span className="orb">{type.glyph}</span>
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
                  <span className="orb orb-sm mt-0.5">{type.glyph}</span>
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

              {isEx && <ExRule of={card.exOf} />}

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
                <h2 className="font-display text-base font-bold leading-tight truncate flex-1">
                  {card.title}
                </h2>
                <span className="orb">{type.glyph}</span>
              </header>

              {card.answer && <CodeBlock code={card.answer} />}

              <ul className="flex flex-col gap-2 flex-1 overflow-hidden">
                {card.points.map((point) => (
                  <li key={point} className="flex gap-2 text-[12.5px] leading-snug text-white/90">
                    <span className="orb orb-xs mt-[3px]">{type.glyph}</span>
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

              <CardFooter card={card} foil={foil} link={!still} />
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
    return (
      <svg
        viewBox="0 0 24 24"
        className="art-icon"
        style={{ width: 84 }}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={TYPE_ART[card.type]} />
      </svg>
    )
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

// stroke glyphs for cards that have no technology logo
const TYPE_ART: Record<CardType, string> = {
  concept:
    'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z',
  story: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  tradeoff: 'M12 3v18M7 21h10M4 7h16M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z',
  trap: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  boss: 'M2 20h20M3 7l5 5 4-7 4 7 5-5-2 11H5z',
  syntax: 'M8 6 2 12l6 6M16 6l6 6-6 6M14 4l-4 16',
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
