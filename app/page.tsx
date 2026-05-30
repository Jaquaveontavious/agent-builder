'use client'

import Link from 'next/link'
import { Building2, Zap, Cpu, TrendingUp, ChevronRight, Check, Search } from 'lucide-react'

const FEATURES = [
  {
    icon: <Search className="w-6 h-6 text-amber-400" />,
    title: 'Tell it what you want',
    body: 'Type your criteria in plain English — location, price, property type, minimum upside. No dashboards to configure.',
  },
  {
    icon: <Cpu className="w-6 h-6 text-amber-400" />,
    title: 'Agents go to work',
    body: 'PropIQ deploys a Deal Finder and Comp Puller simultaneously, hitting real listing data and recent sold comps.',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
    title: 'Scored deals, ready to act on',
    body: 'Every result comes back with ARV estimate, upside %, and a deal score. Know which ones to call — instantly.',
  },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['5 deal searches / month', 'Up to 3 properties per search', 'ARV estimation'],
    cta: 'Get started free',
    href: '/auth/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$99',
    period: 'per month',
    features: [
      'Unlimited deal searches',
      'Up to 10 properties per search',
      'ARV + comp details',
      'Save deals to your list',
      'Priority execution',
    ],
    cta: 'Start finding deals',
    href: '/auth/login?plan=pro',
    highlight: true,
  },
]

const EXAMPLES = [
  '"Find off-market SFRs in Phoenix under $250k with 20%+ ARV upside"',
  '"Pull comps for 1234 Oak St Austin TX and estimate ARV"',
  '"Look for distressed properties in Dallas under $180k — flips only"',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">PropIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors text-sm">
            Sign in
          </Link>
          <Link
            href="/auth/login"
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-700/50 text-amber-300 text-sm px-4 py-1.5 rounded-full mb-8">
          <Zap className="w-3.5 h-3.5" />
          AI-powered real estate back office
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Find your next deal in{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            plain English
          </span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
          Wholesalers, flippers, and agents: just describe what you're looking for. PropIQ searches listings, pulls comps, estimates ARV, and scores properties — all in one shot.
        </p>

        <div className="space-y-3 max-w-xl mx-auto mb-10">
          {EXAMPLES.map((ex) => (
            <div
              key={ex}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-3 text-sm text-slate-400 text-left italic"
            >
              {ex}
            </div>
          ))}
        </div>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-xl text-base font-semibold transition-colors"
        >
          Start finding deals
          <ChevronRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How PropIQ works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-amber-800/60 transition-colors"
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
        <p className="text-slate-400 text-center mb-12">Start free. Upgrade when you're ready to scale.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-amber-950/30 border-amber-600 ring-1 ring-amber-600/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {plan.highlight && (
                <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-2">
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
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
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
        © {new Date().getFullYear()} PropIQ. Powered by Claude + Next.js.
      </footer>
    </div>
  )
}
