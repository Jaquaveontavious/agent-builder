import Link from 'next/link'
import { Cpu, Zap, ChevronRight, Building2, ImageIcon, BarChart3, MessageSquare, ArrowRight, Check } from 'lucide-react'

const SUITES = [
  {
    id: 'propiq',
    name: 'PropIQ',
    tagline: 'Real estate back office — automated.',
    description:
      'AI agents that find deals, pull comps, underwrite properties, skip trace owners, and draft offer letters. Built for wholesalers and investors.',
    audience: 'Real estate wholesalers & investors',
    icon: <Building2 className="w-6 h-6" />,
    color: 'blue',
    href: '/auth/login?suite=propiq',
    agents: ['Deal Finder', 'Comp Puller', 'Skip Tracer', 'Offer Writer', 'Lead Nurture'],
  },
  {
    id: 'content',
    name: 'Content Suite',
    tagline: 'Upload photos. Get captions. Done.',
    description:
      'Upload job or product photos and get AI-written captions for Instagram, Facebook, TikTok, and Google Business — instantly.',
    audience: 'Contractors, service businesses & brands',
    icon: <ImageIcon className="w-6 h-6" />,
    color: 'violet',
    href: '/auth/login?suite=content',
    agents: ['Caption Generator', 'Platform Optimizer', 'Media Library'],
  },
  {
    id: 'analytics',
    name: 'Analytics Suite',
    tagline: 'Coming soon.',
    description: 'AI-powered reporting and business intelligence for any data source. Automatically surface insights, anomalies, and opportunities.',
    audience: 'Operations & growth teams',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'slate',
    href: '#',
    agents: [],
    comingSoon: true,
  },
  {
    id: 'comms',
    name: 'Communications Suite',
    tagline: 'Coming soon.',
    description: 'Automate follow-ups, draft emails, and manage outreach sequences across every channel.',
    audience: 'Sales teams & agencies',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'slate',
    href: '#',
    agents: [],
    comingSoon: true,
  },
]

const HOW = [
  { step: '01', title: 'Pick a suite', body: 'Choose an operative suite built for your industry and use case.' },
  { step: '02', title: 'Deploy in seconds', body: 'Your operatives are live immediately — no configuration required to get started.' },
  { step: '03', title: 'Run your back office on autopilot', body: 'Agents handle the repetitive work so you can focus on what moves the needle.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 overflow-x-hidden">

      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Iron Operative</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors text-sm">
              Sign in
            </Link>
            <Link
              href="/auth/login"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-700/50 text-blue-300 text-sm px-4 py-1.5 rounded-full mb-8">
          <Zap className="w-3.5 h-3.5" />
          AI agent platform for business operations
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6">
          Deploy AI operatives that<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            run your business.
          </span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Iron Operative is an AI agent platform where you deploy pre-built operative suites
          to automate your backend operations — not tomorrow, right now.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-blue-900/40"
          >
            Deploy your first operative
            <ChevronRight className="w-5 h-5" />
          </Link>
          <span className="text-slate-500 text-sm">Free to start · No setup required</span>
        </div>
      </section>

      {/* Suite grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Choose your operative suite</h2>
          <p className="text-slate-400 text-lg">
            Each suite is a bundle of AI agents built to run a specific part of your business.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SUITES.map((suite) => (
            <div
              key={suite.id}
              className={`relative rounded-2xl border p-7 flex flex-col transition-all ${
                suite.comingSoon
                  ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                  : suite.color === 'blue'
                  ? 'bg-blue-950/20 border-blue-800/50 hover:border-blue-600/70 hover:bg-blue-950/30'
                  : 'bg-violet-950/20 border-violet-800/50 hover:border-violet-600/70 hover:bg-violet-950/30'
              }`}
            >
              {suite.comingSoon && (
                <span className="absolute top-5 right-5 text-[10px] uppercase tracking-widest text-slate-600 bg-slate-800 px-2 py-1 rounded-full">
                  Coming soon
                </span>
              )}

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                suite.comingSoon
                  ? 'bg-slate-800 text-slate-600'
                  : suite.color === 'blue'
                  ? 'bg-blue-600/20 border border-blue-600/30 text-blue-400'
                  : 'bg-violet-600/20 border border-violet-600/30 text-violet-400'
              }`}>
                {suite.icon}
              </div>

              <div className="mb-1 flex items-baseline gap-3">
                <h3 className="text-xl font-bold">{suite.name}</h3>
                <span className={`text-xs ${suite.comingSoon ? 'text-slate-600' : suite.color === 'blue' ? 'text-blue-400' : 'text-violet-400'}`}>
                  {suite.tagline}
                </span>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{suite.description}</p>

              {suite.agents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {suite.agents.map((a) => (
                    <span key={a} className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                      {a}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-xs text-slate-600">For: {suite.audience}</span>
                {!suite.comingSoon && (
                  <Link
                    href={suite.href}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                      suite.color === 'blue'
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-violet-400 hover:text-violet-300'
                    }`}
                  >
                    Deploy <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-800/60 bg-slate-900/20 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-14">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW.map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold text-blue-900/80 mb-4 font-mono">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo video */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">See it in action</h2>
          <p className="text-slate-400 text-lg">Watch a real operative generate a full wholesale deal strategy in 30 seconds.</p>
        </div>
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-blue-950/20" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src="https://www.youtube.com/embed/sYiJPNZEv1c"
            title="Iron Operative Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
          <p className="text-slate-400 text-lg">Start free. Upgrade when you're ready to scale.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Free */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Starter</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-slate-500 text-sm mb-1">/mo</span>
              </div>
              <p className="text-slate-500 text-sm">No credit card required</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {['PropIQ real estate suite', 'Content Suite (photo captions)', 'Unlimited generations', 'Deliverables saved to dashboard'].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link href="/auth/login" className="text-center bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-blue-950/30 border border-blue-700/60 rounded-2xl p-7 flex flex-col shadow-lg shadow-blue-900/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most popular</span>
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-2">Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold">$97</span>
                <span className="text-slate-500 text-sm mb-1">/mo</span>
              </div>
              <p className="text-slate-500 text-sm">For growing service businesses</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {[
                'Everything in Starter',
                'Deploy custom AI operatives',
                'Operative memory across sessions',
                '20+ one-click templates',
                'AI operative idea generator',
                'Print & PDF export',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link href="/auth/login" className="text-center bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30">
              Start Pro free trial
            </Link>
          </div>

          {/* Business */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Business</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold">$297</span>
                <span className="text-slate-500 text-sm mb-1">/mo</span>
              </div>
              <p className="text-slate-500 text-sm">For teams and agencies</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {[
                'Everything in Pro',
                'Unlimited custom operatives',
                'Industry-specific operative packs',
                'Multi-user team access',
                'White-label outputs',
                'API access',
                'Dedicated onboarding',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link href="/auth/login" className="text-center bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof / use cases */}
      <section className="border-t border-slate-800/60 bg-slate-900/20 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Built for any service business</h2>
          <p className="text-slate-400 text-center mb-12">Deploy an operative for your industry in under 60 seconds.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'Pressure Washing', 'Landscaping', 'HVAC', 'Plumbing',
              'Roofing', 'Cleaning', 'Real Estate', 'Auto Detailing',
              'Electrical', 'Pest Control', 'Moving Companies', 'Staffing Agencies',
              'Marketing Agencies', 'Consulting', 'E-commerce', 'Fitness & Training',
            ].map((industry) => (
              <div key={industry} className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3 text-sm text-slate-400 text-center">
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-b from-blue-950/30 to-slate-900/60 border border-blue-800/30 rounded-3xl px-8 py-14">
          <h2 className="text-4xl font-bold mb-4">Your back office, on autopilot.</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Stop stitching together tools. Deploy an operative suite and let AI agents handle the work.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-blue-900/40"
          >
            Get started free
            <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="text-slate-600 text-sm mt-4">No credit card required to start</p>
        </div>
      </section>


    </div>
  )
}
