import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BinderIcon, HomeIcon } from './components/Icons'
import { openPacks } from './lib/api'
import { AUTH_ENABLED } from './lib/config'
import { supabase } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { BinderScreen } from './screens/BinderScreen'
import { DeckPreview } from './screens/DeckPreview'
import { HomeScreen } from './screens/HomeScreen'
import { PackRun } from './screens/PackRun'
import { SummaryScreen } from './screens/SummaryScreen'
import type { AnswerResult, CardSet, PulledCard } from './types'

type Screen =
  | { name: 'home' | 'binder' }
  | { name: 'packs'; set: CardSet; packs: PulledCard[][] }
  | { name: 'summary'; results: AnswerResult[] }

// shared so React StrictMode's double effect does not create two anonymous users
let anonymousSignIn: Promise<string | null> | null = null

function signInAnonymously(): Promise<string | null> {
  anonymousSignIn ??= supabase.auth.signInAnonymously().then(({ error }) => error?.message ?? null)
  return anonymousSignIn
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [authError, setAuthError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  useEffect(() => {
    if (window.location.hash === '#deck') return
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session || AUTH_ENABLED) {
        setSession(data.session)
        return
      }
      // onAuthStateChange picks up the new session
      const error = await signInAnonymously()
      if (error) setAuthError(error)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  if (window.location.hash === '#deck') return <DeckPreview />
  if (authError) return <AnonymousAuthError message={authError} />
  if (session === undefined || (!session && !AUTH_ENABLED)) return null
  if (!session) return <AuthScreen />

  async function open(count: number, set: CardSet) {
    const packs = await openPacks(count, set.id)
    setScreen({ name: 'packs', set, packs })
  }

  switch (screen.name) {
    case 'packs':
      return (
        <PackRun
          set={screen.set}
          packs={screen.packs}
          onFinish={(results) => setScreen({ name: 'summary', results })}
        />
      )
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

function AnonymousAuthError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-6">
      <h1 className="font-display text-2xl font-bold">Could not start a session</h1>
      <p className="text-white/70">
        Sign-in is switched off, so the app signs in anonymously. Turn on anonymous sign-ins in the Supabase
        dashboard (Authentication, Sign In / Providers, Anonymous), or set VITE_AUTH_ENABLED=true.
      </p>
      <p className="text-sm text-rose-300">{message}</p>
    </div>
  )
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
