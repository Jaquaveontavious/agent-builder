'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Zap, Cpu, Target, ChevronRight, Check, Crosshair } from 'lucide-react'

const FEATURES = [
  {
    icon: <Target className="w-6 h-6 text-red-400" />,
    title: 'Brief It',
    body: 'Describe your mission in plain English. No prompting skills. No setup. Just intent.',
  },
  {
    icon: <Cpu className="w-6 h-6 text-red-400" />,
    title: 'We Build It',
    body: 'Iron Operative forges a precision-tuned AI operative with the exact tools for the job.',
  },
  {
    icon: <Zap className="w-6 h-6 text-red-400" />,
    title: 'Deploy It',
    body: 'Send your operative any mission. Watch it think, search, and execute in real time.',
  },
  {
    icon: <Shield className="w-6 h-6 text-red-400" />,
    title: 'Command It',
    body: 'All operatives and mission logs are locked to your account. Your squad. Your control.',
  },
]

const PRICING = [
  {
    name: 'Recruit',
    price: '$0',
    period: 'forever',
    features: ['1 operative', '10 missions / month', 'Web search, HTTP, code tools', 'Mission history'],
    cta: 'Enlist free',
    href: '/auth/login',
    highlight: false,
  },
  {
    name: 'Commander',
    price: '$29',
    period: 'per month',
    features: [
      'Unlimited operatives',
      'Unlimited missions',
      'All 5 intel tools',
      'Priority execution',
      'Full mission history',
    ],
    cta: 'Go Commander',
    href: '/auth/login?plan=pro',
    highlight: true,
  },
]

export default function LandingPage() {
  const [description, setDescription] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    const params = new URLSearchParams({ desc: description.trim() })
    router.push(`/auth/login?next=/agents/new&${params}`)
  }

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 metal-grid">
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Crosshair className="w-7 h-7 text-red-500" />
          <span className="text-xl font-bold tracking-tight">Iron Operative</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors text-sm">
            Sign in
          </Link>
          <Link
            href="/auth/login"
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Enlist
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-red-950/60 border border-red-800/50 text-red-300 text-sm px-4 py-1.5 rounded-full mb-8">
          <Zap className="w-3.5 h-3.5" />
          Powered by Claude Sonnet 4.6
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Deploy your private{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
            AI militia
          </span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
          Describe the mission. Iron Operative recruits, configures, and arms a purpose-built AI operative
          — ready to execute in under 60 seconds.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`e.g. "An operative that scouts competitor pricing across the web and delivers a tactical summary"`}
            rows={4}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-500 text-base resize-none focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!description.trim()}
            className="mt-4 w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-base font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            Recruit my operative
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-red-800/60 transition-colors"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-slate-400 text-center mb-12">Enlist free. Go Commander when you need the full arsenal.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-red-950/40 border-red-600 ring-1 ring-red-600/50'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {plan.highlight && (
                <span className="text-red-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  Full Arsenal
                </span>
              )}
              <div className="text-3xl font-bold mb-1">
                {plan.price}
                <span className="text-slate-500 text-base font-normal ml-1">/{plan.period}</span>
              </div>
              <div className="text-lg font-semibold mb-6">{plan.name}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-red-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 text-center py-8 text-slate-500 text-sm">
        © {new Date().getFullYear()} Iron Operative. Built with Claude + Next.js.
      </footer>
    </div>
  )
}
