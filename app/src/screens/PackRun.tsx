import { useState } from 'react'
import { motion } from 'motion/react'
import type { AnswerResult, PulledCard } from '../types'
import { PackOpening } from './PackOpening'
import { StudySession } from './StudySession'

interface Props {
  packs: PulledCard[][]
  onFinish: (results: AnswerResult[]) => void
}

type Phase = 'opening' | 'study' | 'between'

// Opens and studies each pack in a single, bundle or box in turn
export function PackRun({ packs, onFinish }: Props) {
  const [packIndex, setPackIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('opening')
  const [results, setResults] = useState<AnswerResult[]>([])

  const label = packs.length > 1 ? `Pack ${packIndex + 1} of ${packs.length}` : 'Booster pack'
  const isLast = packIndex + 1 >= packs.length

  function finishPack(packResults: AnswerResult[]) {
    const all = [...results, ...packResults]
    setResults(all)
    if (isLast) onFinish(all)
    else setPhase('between')
  }

  if (phase === 'opening') {
    return <PackOpening key={packIndex} pack={packs[packIndex]} label={label} onDone={() => setPhase('study')} />
  }

  if (phase === 'study') {
    return (
      <StudySession
        key={packIndex}
        pack={packs[packIndex]}
        label={label}
        onDone={finishPack}
        onQuit={(packResults) => onFinish([...results, ...packResults])}
      />
    )
  }

  const correct = results.filter((r) => r.gotIt).length
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Pack {packIndex + 1} of {packs.length} done
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold">
          {correct} of {results.length} answers right so far
        </h2>
        <p className="mt-2 text-white/60">{packs.length - packIndex - 1} packs left in this session</p>
      </motion.div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => {
            setPackIndex((i) => i + 1)
            setPhase('opening')
          }}
          className="rounded-full bg-white py-3.5 font-display font-bold text-black"
        >
          Open pack {packIndex + 2}
        </button>
        <button onClick={() => onFinish(results)} className="rounded-full glass py-3.5 font-medium text-white/80">
          Finish for now
        </button>
      </div>
    </div>
  )
}
