'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Bot, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { createBrowserClientHelper } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'magic'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'
  const desc = params.get('desc') ?? ''

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const supabase = createBrowserClientHelper()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'magic') {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        })
        if (err) throw err
        setMagicSent(true)
        return
      }

      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        })
        if (err) throw err
        setError('Check your email to confirm your account.')
        return
      }

      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err

      const destination = desc
        ? `/agents/new?desc=${encodeURIComponent(desc)}`
        : next
      router.push(destination)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (magicSent) {
    return (
      <div className="text-center max-w-sm">
        <Mail className="w-12 h-12 text-violet-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
        <p className="text-slate-400">
          We sent a magic link to <strong className="text-white">{email}</strong>. Click it to sign in.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="flex items-center gap-2 justify-center mb-8">
        <Bot className="w-8 h-8 text-violet-400" />
        <span className="text-2xl font-bold">AgentForge</span>
      </Link>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-xl font-bold mb-6 text-center">
          {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Magic link'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {mode !== 'magic' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          )}

          {error && (
            <p className={`text-sm ${error.startsWith('Check') ? 'text-green-400' : 'text-red-400'}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send magic link'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          {mode !== 'magic' && (
            <button
              onClick={() => setMode('magic')}
              className="text-slate-400 hover:text-violet-400 transition-colors block w-full"
            >
              Sign in with magic link instead
            </button>
          )}
          {mode === 'magic' && (
            <button
              onClick={() => setMode('login')}
              className="text-slate-400 hover:text-violet-400 transition-colors block w-full"
            >
              Use password instead
            </button>
          )}
          <div className="text-slate-500">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-violet-400 hover:text-violet-300">
                  Sign in
                </button>
              </>
            ) : (
              <>
                No account?{' '}
                <button onClick={() => setMode('signup')} className="text-violet-400 hover:text-violet-300">
                  Sign up free
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-slate-500 text-sm">Loading…</div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
