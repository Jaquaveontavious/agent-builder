'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Zap, Sparkles, Lock } from 'lucide-react'
import UpgradeButton from '@/components/UpgradeButton'
import { OPERATIVE_TEMPLATES, CATEGORIES, type OperativeTemplate } from '@/lib/operative-templates'

interface GeneratedIdea {
  name: string
  description: string
  category: string
  system_prompt: string
}

type DisplayTemplate = OperativeTemplate | GeneratedIdea & { id?: string }

const CATEGORY_COLORS: Record<string, string> = {
  trades: 'text-orange-400 bg-orange-950/40 border-orange-800/50',
  real_estate: 'text-blue-400 bg-blue-950/40 border-blue-800/50',
  agency: 'text-violet-400 bg-violet-950/40 border-violet-800/50',
  ecommerce: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
  marketing: 'text-pink-400 bg-pink-950/40 border-pink-800/50',
  business: 'text-slate-300 bg-slate-800/60 border-slate-700/50',
}

const CATEGORY_LABELS: Record<string, string> = {
  trades: 'Trades',
  real_estate: 'Real Estate',
  agency: 'Agency',
  ecommerce: 'E-commerce',
  marketing: 'Marketing',
  business: 'Business',
}

function TemplateCard({
  template,
  onDeploy,
  deploying,
}: {
  template: DisplayTemplate
  onDeploy: (t: DisplayTemplate) => void
  deploying: boolean
}) {
  const colorClass = CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.business

  return (
    <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col gap-3 transition-all group">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-slate-100 leading-snug">{template.name}</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${colorClass}`}>
          {CATEGORY_LABELS[template.category] ?? template.category}
        </span>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed flex-1">{template.description}</p>
      <button
        onClick={() => onDeploy(template)}
        disabled={deploying}
        className="flex items-center justify-center gap-1.5 w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-700/50 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-semibold py-2 rounded-xl transition-all disabled:opacity-50"
      >
        {deploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3" />Deploy</>}
      </button>
    </div>
  )
}

export default function DiscoverSection({ onDeployed, isPro }: { onDeployed: (id: string, name: string) => void; isPro: boolean }) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([])
  const [deployingId, setDeployingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const filtered = activeCategory === 'all'
    ? OPERATIVE_TEMPLATES
    : OPERATIVE_TEMPLATES.filter((t) => t.category === activeCategory)

  async function generateIdeas() {
    if (!keyword.trim() || generating) return
    setGenerating(true)
    setError('')
    setGeneratedIdeas([])

    try {
      const res = await fetch('/api/operatives/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })
      const data = await res.json() as { success: boolean; data?: { ideas: GeneratedIdea[] }; error?: string }
      if (!data.success) throw new Error(data.error)
      setGeneratedIdeas(data.data?.ideas ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas')
    } finally {
      setGenerating(false)
    }
  }

  async function deployTemplate(template: DisplayTemplate) {
    const key = 'id' in template && template.id ? template.id : template.name
    setDeployingId(key)

    try {
      const body = 'id' in template && template.id
        ? { template_id: template.id }
        : { name: template.name, description: template.description, system_prompt: template.system_prompt }

      const res = await fetch('/api/operatives/deploy-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { success: boolean; data?: { id: string; name: string }; error?: string }
      if (!data.success) throw new Error(data.error)

      onDeployed(data.data!.id, data.data!.name)
      router.push(`/dashboard/operative/${data.data!.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed')
    } finally {
      setDeployingId(null)
    }
  }

  if (!isPro) {
    return (
      <div className="relative">
        {/* Blurred preview */}
        <div className="pointer-events-none select-none opacity-30 blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPERATIVE_TEMPLATES.slice(0, 6).map((t) => (
              <div key={t.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 h-32" />
            ))}
          </div>
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="bg-[#0a0a0f]/90 border border-slate-800 rounded-2xl px-8 py-6 text-center max-w-sm">
            <Lock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-bold text-base mb-1">Pro feature</h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Upgrade to deploy from the template library and generate custom operative ideas.
            </p>
            <UpgradeButton
              label="Upgrade to Pro — $97/mo"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Idea generator */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-sm">Generate operative ideas</h3>
          <span className="text-xs text-slate-600">Describe your business, industry, or problem</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void generateIdeas()}
            placeholder="e.g. pressure washing, law firm, dropshipping, restaurant, recruiting agency…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-700/60 transition-colors"
          />
          <button
            onClick={() => void generateIdeas()}
            disabled={!keyword.trim() || generating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Generate</>}
          </button>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        {generatedIdeas.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
                Generated for "{keyword}"
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {generatedIdeas.map((idea, i) => (
                <TemplateCard
                  key={i}
                  template={idea}
                  onDeploy={(t) => void deployTemplate(t)}
                  deploying={deployingId === idea.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onDeploy={(t) => void deployTemplate(t)}
            deploying={deployingId === template.id}
          />
        ))}
      </div>

      <p className="text-xs text-slate-700 mt-5 text-center">
        {filtered.length} operatives available · More added regularly
      </p>
    </div>
  )
}
