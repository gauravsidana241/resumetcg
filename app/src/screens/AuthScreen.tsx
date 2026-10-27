import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Scaled } from '../components/Scaled'
import { TcgCard } from '../components/TcgCard'
import { getCard } from '../data/catalog'
import { supabase } from '../lib/supabase'
import type { Foil } from '../types'

const SHOWCASE: { id: string; foil: Foil }[] = [
  { id: 'msg-redis', foil: 1 },
  { id: 'formhook-delivery', foil: 4 },
  { id: 'fynd-temporal-why', foil: 3 },
]

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ tone: 'error', text: error.message })
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setMessage({ tone: 'error', text: error.message })
      else if (!data.session)
        setMessage({ tone: 'info', text: 'Check your email and click the confirmation link, then sign in here.' })
    }
    setBusy(false)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="relative flex h-48 w-full items-center justify-center">
        {SHOWCASE.map(({ id, foil }, i) => {
          const card = getCard(id)
          if (!card) return null
          const offset = i - 1
          return (
            <motion.div
              key={id}
              className="absolute"
              style={{ zIndex: i === 1 ? 2 : 1 }}
              initial={{ y: 40, opacity: 0, rotate: 0 }}
              animate={{ y: offset === 0 ? -6 : 8, opacity: 1, rotate: offset * 12, x: offset * 82 }}
              transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.1 * i }}
            >
              <Scaled scale={0.38}>
                <TcgCard card={card} foil={foil} still />
              </Scaled>
            </motion.div>
          )
        })}
      </div>

      <div className="text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          <span className="text-shine">Resume</span> TCG
        </h1>
        <p className="mt-2 text-white/60">Your resume, as a trading card game.</p>
      </div>

      <form onSubmit={submit} className="flex w-full flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl glass px-4 py-3.5 text-base outline-none placeholder:text-white/40 focus:border-white/30"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl glass px-4 py-3.5 text-base outline-none placeholder:text-white/40 focus:border-white/30"
        />
        {message && (
          <p className={`text-sm ${message.tone === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{message.text}</p>
        )}
        <button
          disabled={busy}
          className="mt-1 rounded-full bg-white py-3.5 font-display font-bold text-black disabled:opacity-60"
        >
          {busy ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setMessage(null)
          }}
          className="text-sm text-white/60 hover:text-white"
        >
          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
