import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BinderIcon, HomeIcon } from './components/Icons'
import { openPacks } from './lib/api'
import { supabase } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { BinderScreen } from './screens/BinderScreen'
import { HomeScreen } from './screens/HomeScreen'
import { PackRun } from './screens/PackRun'
import { SummaryScreen } from './screens/SummaryScreen'
import type { AnswerResult, PulledCard } from './types'

type Screen =
  | { name: 'home' | 'binder' }
  | { name: 'packs'; packs: PulledCard[][] }
  | { name: 'summary'; results: AnswerResult[] }

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <AuthScreen />

  async function open(count: number) {
    const packs = await openPacks(count)
    setScreen({ name: 'packs', packs })
  }

  switch (screen.name) {
    case 'packs':
      return <PackRun packs={screen.packs} onFinish={(results) => setScreen({ name: 'summary', results })} />
    case 'summary':
      return <SummaryScreen results={screen.results} onHome={() => setScreen({ name: 'home' })} />
    default:
      return (
        <>
          {screen.name === 'home' ? <HomeScreen onOpen={open} /> : <BinderScreen />}
          <BottomNav current={screen.name} onChange={(name) => setScreen({ name })} />
        </>
      )
  }
}

function BottomNav({ current, onChange }: { current: 'home' | 'binder'; onChange: (name: 'home' | 'binder') => void }) {
  const items = [
    { name: 'home' as const, label: 'Home', Icon: HomeIcon },
    { name: 'binder' as const, label: 'Binder', Icon: BinderIcon },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 safe-bottom">
      <div className="flex gap-1 rounded-full glass p-1.5 shadow-2xl">
        {items.map(({ name, label, Icon }) => (
          <button
            key={name}
            onClick={() => onChange(name)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
              current === name ? 'bg-white text-black' : 'text-white/70'
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
