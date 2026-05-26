'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bot, Zap, Shield, Cpu, ChevronRight, Check } from 'lucide-react'

const FEATURES = [
  {
    icon: <Bot className="w-6 h-6 text-violet-400" />,
    title: 'Describe It',
    body: 'Tell AgentForge what you need in plain English. No prompting skills required.',
  },
  {
    icon: <Cpu className="w-6 h-6 text-violet-400" />,
    title: 'We Build It',
    body: 'Claude instantly generates a fine-tuned system prompt and selects the right tools.',
  },
  {
    icon: <Zap className="w-6 h-6 text-violet-400" />,
    title: 'You Run It',
    body: 'Send your agent any task. Watch it think, search, and execute in real time.',
  },
  {
    icon: <Shield className="w-6 h-6 text-violet-400" />,
    title: 'Always Yours',
    body: 'All agents and run history are saved to your account. Pick up where you left off.',
  },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 agent', '10 runs / month', 'Web search, HTTP, code tools', 'Run history'],
    cta: 'Get started free',
    href: '/auth/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: [
      'Unlimited agents',
      'Unlimited runs',
      'All 5 tools',
      'Priority execution',
      'Full run history',
    ],
    cta: 'Upgrade to Pro',
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
    <div className="min-h-screen bg-[#080810] text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Bot className="w-7 h-7 text-violet-400" />
          <span className="text-xl font-bold tracking-tight">AgentForge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors text-sm">
            Sign in
          </Link>
          <Link
            href="/auth/login"
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-950/60 border border-violet-800/50 text-violet-300 text-sm px-4 py-1.5 rounded-full mb-8">
          <Zap className="w-3.5 h-3.5" />
          Powered by Claude Sonnet 4.6
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Build custom AI agents{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            in 60 seconds
          </span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
          Describe what you need. AgentForge generates, configures, and deploys a purpose-built AI
          agent — no prompting experience required.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. &quot;An agent that searches the web for competitor prices and summarizes them in a table&quot;"
            rows={4}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-500 text-base resize-none focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!description.trim()}
            className="mt-4 w-full sm:w-auto bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-base font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            Build my agent
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
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-violet-800/60 transition-colors"
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
        <p className="text-slate-400 text-center mb-12">Start free. Upgrade when you need more.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-violet-950/40 border-violet-600 ring-1 ring-violet-600/50'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {plan.highlight && (
                <span className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  Most Popular
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
                    <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
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
        © {new Date().getFullYear()} AgentForge. Built with Claude + Next.js.
      </footer>
    </div>
  )
}
