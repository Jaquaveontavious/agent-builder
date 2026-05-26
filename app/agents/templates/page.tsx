import Link from 'next/link'
import { Crosshair, ArrowLeft, Star, Zap } from 'lucide-react'
import { CATEGORIES, TEMPLATES, type AgentTemplate, type TemplateCategory } from '@/lib/templates'

const TOOL_LABELS: Record<string, string> = {
  web_search:     '🔍 Search',
  code_execution: '⚡ Code',
  http_request:   '🌐 HTTP',
  file_read:      '📂 Read',
  file_write:     '💾 Write',
}

function TemplateCard({ template, category }: { template: AgentTemplate; category: TemplateCategory }) {
  const href = `/agents/new?template=${template.id}`

  return (
    <Link
      href={href}
      className={`group relative flex flex-col bg-slate-900/60 border ${category.border} ${category.glow} rounded-xl p-5 transition-all duration-200 hover:bg-slate-900/90 hover:shadow-lg hover:-translate-y-0.5`}
    >
      {template.popular && (
        <div className={`absolute -top-2.5 left-4 flex items-center gap-1 ${category.bg} ${category.accent} ${category.border} border text-xs px-2.5 py-0.5 rounded-full font-medium`}>
          <Star className="w-3 h-3 fill-current" /> Popular
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl leading-none mt-0.5">{template.emoji}</span>
        <div>
          <h3 className="font-semibold text-sm text-white leading-snug">{template.name}</h3>
          <p className={`text-xs mt-0.5 ${category.accent}`}>{template.tagline}</p>
        </div>
      </div>

      {template.tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-slate-800">
          {template.tools.map((tool) => (
            <span key={tool} className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              {TOOL_LABELS[tool] ?? tool}
            </span>
          ))}
        </div>
      )}

      <div className={`absolute inset-x-0 bottom-0 h-0.5 rounded-b-xl ${category.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Link>
  )
}

function CategorySection({ category }: { category: TemplateCategory }) {
  const templates = TEMPLATES.filter((t) => t.category === category.id)
  if (templates.length === 0) return null

  return (
    <section id={category.id} className="scroll-mt-20">
      <div className={`flex items-center gap-3 mb-5 pb-3 border-b ${category.border}`}>
        <span className="text-2xl">{category.emoji}</span>
        <div>
          <h2 className={`text-lg font-bold ${category.accent}`}>{category.name}</h2>
          <p className="text-slate-500 text-xs">{category.tagline}</p>
        </div>
        <span className="ml-auto text-xs text-slate-600">{templates.length} agents</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} category={category} />
        ))}
      </div>
    </section>
  )
}

export default function TemplatesPage() {
  const popularTemplates = TEMPLATES.filter((t) => t.popular)

  return (
    <div className="min-h-screen bg-[#080810] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 sticky top-0 bg-[#080810]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Command Center
          </Link>
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-red-400" />
            <span className="font-bold">Operative Arsenal</span>
          </div>
          <Link
            href="/agents/new"
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-violet-300 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" /> Build from scratch
          </Link>
        </div>
      </header>

      {/* Category nav */}
      <div className="border-b border-slate-800/40 bg-slate-900/30 sticky top-[57px] z-10 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-6 flex gap-1 py-2">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-16">

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">
            Start with a proven agent
          </h1>
          <p className="text-slate-400 text-lg">
            {TEMPLATES.length} pre-built agents across {CATEGORIES.length} categories. One click to configure — no API keys, no setup.
          </p>
        </div>

        {/* Popular strip */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-lg font-bold">Most Popular</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {popularTemplates.map((template) => {
              const category = CATEGORIES.find((c) => c.id === template.category)!
              return (
                <Link
                  key={template.id}
                  href={`/agents/new?template=${template.id}`}
                  className={`flex items-center gap-3 bg-slate-900/60 border ${category.border} ${category.glow} rounded-xl p-4 transition-all hover:bg-slate-900/90 hover:-translate-y-0.5`}
                >
                  <span className="text-xl">{template.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-white leading-snug">{template.name}</div>
                    <div className={`text-[10px] ${category.accent} mt-0.5`}>{category.name}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Category sections */}
        {CATEGORIES.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}

        {/* Bottom CTA */}
        <div className="text-center border border-dashed border-slate-700 rounded-2xl py-14 px-6">
          <Crosshair className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Don't see what you need?</h3>
          <p className="text-slate-500 text-sm mb-6">
            Describe any task in plain English and Iron Operative will build a custom agent for it in seconds.
          </p>
          <Link
            href="/agents/new"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <Zap className="w-4 h-4" /> Build a custom agent
          </Link>
        </div>
      </main>
    </div>
  )
}
