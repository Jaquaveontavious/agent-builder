'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Building2,
  TrendingUp,
  Calculator,
  Mail,
  Users,
  Phone,
  Lock,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react'

interface AgentCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  live: boolean
  color: string
  borderColor: string
  bgColor: string
  comingSoonLabel?: string
}

const AGENTS: AgentCard[] = [
  {
    id: 'propiq',
    title: 'PropIQ — Deal Finder',
    description: 'Search MLS listings, pull AVM valuations, get owner contact info, and score deals — all in one prompt.',
    icon: <Building2 className="w-6 h-6" />,
    href: '/chat',
    live: true,
    color: 'text-amber-400',
    borderColor: 'border-amber-700/50',
    bgColor: 'bg-amber-950/20',
  },
  {
    id: 'underwriter',
    title: 'Underwriter',
    description: 'Paste an address and rehab budget. Get back max offer price, ROI, cash flow projection, and break-even analysis.',
    icon: <Calculator className="w-6 h-6" />,
    href: '/underwriter',
    live: true,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-700/50',
    bgColor: 'bg-emerald-950/20',
  },
  {
    id: 'market-pulse',
    title: 'Market Pulse',
    description: 'Enter any zip code. Get median price trends, days on market, price reduction rates, and rental yield data.',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/market-pulse',
    live: true,
    color: 'text-blue-400',
    borderColor: 'border-blue-700/50',
    bgColor: 'bg-blue-950/20',
  },
  {
    id: 'offer-writer',
    title: 'Offer Letter Writer',
    description: 'Turn a property and owner profile into a professional direct mail letter or email — ready to send in seconds.',
    icon: <Mail className="w-6 h-6" />,
    href: '/offer-writer',
    live: true,
    color: 'text-violet-400',
    borderColor: 'border-violet-700/50',
    bgColor: 'bg-violet-950/20',
  },
  {
    id: 'lead-nurture',
    title: 'Lead Nurture',
    description: 'Paste a lead\'s info and situation. Get a 3-touch follow-up sequence — call script, text message, and letter.',
    icon: <Users className="w-6 h-6" />,
    href: '/lead-nurture',
    live: true,
    color: 'text-rose-400',
    borderColor: 'border-rose-700/50',
    bgColor: 'bg-rose-950/20',
  },
  {
    id: 'skip-tracer',
    title: 'Skip Tracer',
    description: 'Owner name and mailing address in, phone numbers and emails out. Close the gap between deal and conversation.',
    icon: <Phone className="w-6 h-6" />,
    href: '/skip-tracer',
    live: false,
    color: 'text-slate-400',
    borderColor: 'border-slate-700/50',
    bgColor: 'bg-slate-900/20',
    comingSoonLabel: 'Coming Soon',
  },
]

export default function HubPage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.email) setEmail(d.email)
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 sticky top-0 z-10 bg-[#060608]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">PropIQ</span>
            <span className="text-slate-600 text-sm ml-1">Agent Suite</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs px-3 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Pro
            </span>
            {email && <span className="text-slate-500 text-sm hidden sm:block">{email}</span>}
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-slate-500 hover:text-slate-300 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Your Agent Suite</h1>
          <p className="text-slate-400">Six AI agents built for wholesalers, flippers, and investors. Pick one and go.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AGENTS.map((agent) => (
            agent.live ? (
              <Link
                key={agent.id}
                href={agent.href}
                className={`group relative rounded-2xl border ${agent.borderColor} ${agent.bgColor} p-6 hover:scale-[1.02] transition-all duration-200 hover:shadow-lg hover:shadow-black/40`}
              >
                <div className={`${agent.color} mb-4`}>{agent.icon}</div>
                <h2 className="font-bold text-base mb-2">{agent.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{agent.description}</p>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${agent.color}`}>
                  Open <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ) : (
              <div
                key={agent.id}
                className={`relative rounded-2xl border ${agent.borderColor} ${agent.bgColor} p-6 opacity-50`}
              >
                <Lock className="w-4 h-4 text-slate-600 absolute top-4 right-4" />
                <div className={`${agent.color} mb-4`}>{agent.icon}</div>
                <h2 className="font-bold text-base mb-2">{agent.title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{agent.description}</p>
                <span className="text-xs text-slate-600 font-medium">{agent.comingSoonLabel}</span>
              </div>
            )
          ))}
        </div>
      </main>
    </div>
  )
}
