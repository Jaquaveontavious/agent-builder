'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, ImageIcon, BarChart3, MessageSquare,
  Zap, Plus, Cpu, Sparkles,
} from 'lucide-react'
import DeployDrawer from '@/components/DeployDrawer'
import DiscoverSection from '@/components/DiscoverSection'

interface SuiteConfig {
  id: string
  name: string
  description: string
  icon: 'building2' | 'image' | 'chart' | 'message'
  href: string
}

interface ComingSoonConfig {
  name: string
  icon: 'chart' | 'message'
  description: string
}

interface CustomOperative {
  id: string
  name: string
  suite_id: string
  config: { description?: string }
}

interface DeployedOperative {
  id?: string
  suite_id: string
  name: string
  config?: Record<string, unknown>
}

const ICON_MAP = {
  building2: Building2,
  image: ImageIcon,
  chart: BarChart3,
  message: MessageSquare,
}

const SUITE_COLORS: Record<string, { iconColor: string; iconBg: string; border: string }> = {
  propiq: {
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-600/20 border-blue-600/30',
    border: 'border-blue-700/60 hover:border-blue-500/80',
  },
  content: {
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-600/20 border-violet-600/30',
    border: 'border-violet-700/60 hover:border-violet-500/80',
  },
}

export default function DashboardClient({
  upgraded,
  isPro,
  suiteCatalog,
  comingSoon,
  initialCustomOperatives,
}: {
  upgraded?: string
  isPro: boolean
  suiteCatalog: SuiteConfig[]
  comingSoon: ComingSoonConfig[]
  initialCustomOperatives: CustomOperative[]
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [customOperatives, setCustomOperatives] = useState<CustomOperative[]>(initialCustomOperatives)
  const [justDeployedIds, setJustDeployedIds] = useState<Set<string>>(new Set())

  function handleTemplateDeployed(id: string, name: string) {
    const newOp: CustomOperative = { id, name, suite_id: 'custom', config: {} }
    setCustomOperatives((prev) => {
      const exists = prev.some((o) => o.id === id)
      return exists ? prev : [newOp, ...prev]
    })
    setJustDeployedIds((prev) => { const s = new Set(Array.from(prev)); s.add(id); return s })
  }

  function handleDeployed(operative: DeployedOperative) {
    if (operative.suite_id === 'custom' && operative.id) {
      const newOp: CustomOperative = {
        id: operative.id,
        name: operative.name,
        suite_id: 'custom',
        config: { description: operative.config?.description as string | undefined },
      }
      setCustomOperatives((prev) => {
        const exists = prev.some((o) => o.id === operative.id)
        return exists ? prev : [newOp, ...prev]
      })
      setJustDeployedIds((prev) => { const s = new Set(Array.from(prev)); s.add(operative.id!); return s })
    } else if (operative.id) {
      setJustDeployedIds((prev) => { const s = new Set(Array.from(prev)); s.add(operative.id!); return s })
    }
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-6 py-10">
        {upgraded && (
          <div className="bg-blue-950/60 border border-blue-700 rounded-xl px-6 py-4 mb-8 flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <p className="text-blue-200 font-medium">You're now on Pro. All operatives are fully unlocked.</p>
          </div>
        )}

        {/* Page heading */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">Operative Command Center</h1>
            <p className="text-slate-400">Deploy and manage your AI operative suites.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" />
            Deploy Operative
          </button>
        </div>

        {/* Built-in suites */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-semibold">Active Operatives</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {suiteCatalog.map((suite) => {
              const Icon = ICON_MAP[suite.icon]
              const colors = SUITE_COLORS[suite.id] ?? {
                iconColor: 'text-blue-400',
                iconBg: 'bg-blue-600/20 border-blue-600/30',
                border: 'border-blue-700/60 hover:border-blue-500/80',
              }

              return (
                <div
                  key={suite.id}
                  className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col transition-all ${colors.border}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors.iconBg}`}>
                      <Icon className={`w-5 h-5 ${colors.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-slate-500">Active</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-1">{suite.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-1">{suite.description}</p>
                  <Link
                    href={suite.href}
                    className="text-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Open
                  </Link>
                </div>
              )
            })}

            {/* Custom operatives */}
            {customOperatives.map((op) => {
              const justDeployed = justDeployedIds.has(op.id)
              return (
                <div
                  key={op.id}
                  className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col transition-all border-slate-700/60 hover:border-slate-500/80 ${
                    justDeployed ? 'ring-1 ring-emerald-500/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl border bg-slate-700/40 border-slate-600/40 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {justDeployed ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs text-emerald-400 font-medium">Just deployed</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-slate-500">Active</span>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-1">{op.name}</h3>
                  {op.config?.description && (
                    <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-1">{op.config.description}</p>
                  )}
                  <Link
                    href={`/dashboard/operative/${op.id}`}
                    className="text-center bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-auto"
                  >
                    Open
                  </Link>
                </div>
              )
            })}

            {/* Coming soon */}
            {comingSoon.map((suite) => {
              const Icon = ICON_MAP[suite.icon]
              return (
                <div
                  key={suite.name}
                  className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-6 flex flex-col opacity-50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-700 bg-slate-800 px-2 py-1 rounded-full">
                      Soon
                    </span>
                  </div>
                  <h3 className="font-bold text-base mb-1 text-slate-500">{suite.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{suite.description}</p>
                </div>
              )
            })}

            {/* Deploy new card */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="border-2 border-dashed border-slate-800 hover:border-blue-700/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-blue-400 transition-all group min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-xl border border-slate-700 group-hover:border-blue-700/60 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Deploy new operative</span>
            </button>
          </div>
        </div>
        {/* Discover section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-semibold">Discover Operatives</h2>
            <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">One-click deploy</span>
          </div>
          <DiscoverSection onDeployed={handleTemplateDeployed} isPro={isPro} />
        </div>
      </main>

      <DeployDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onDeployed={handleDeployed}
      />
    </>
  )
}
