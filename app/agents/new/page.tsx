'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Crosshair, ArrowLeft, Wand2, Save, RotateCcw, Loader2, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react'
import type { Agent } from '@/lib/types'
import { getTemplateById } from '@/lib/templates'

const TOOL_LABELS: Record<string, string> = {
  web_search:     'Web Search',
  code_execution: 'Code',
  file_read:      'File Read',
  file_write:     'File Write',
  http_request:   'HTTP',
}

const TOOL_COLORS: Record<string, string> = {
  web_search:     'bg-blue-950 text-blue-300 border-blue-800',
  code_execution: 'bg-amber-950 text-amber-300 border-amber-800',
  file_read:      'bg-emerald-950 text-emerald-300 border-emerald-800',
  file_write:     'bg-teal-950 text-teal-300 border-teal-800',
  http_request:   'bg-pink-950 text-pink-300 border-pink-800',
}

function NewAgentForm() {
  const router = useRouter()
  const params = useSearchParams()

  // Support both ?desc= (from landing) and ?template= (from gallery)
  const templateId = params.get('template')
  const template = templateId ? getTemplateById(templateId) : null
  const initialDesc = template?.description ?? params.get('desc') ?? ''

  const [description, setDescription] = useState(initialDesc)
  const [preview, setPreview] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)

  // Auto-generate when a template or desc is passed in
  useEffect(() => {
    if (initialDesc && !preview) {
      void generate(initialDesc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate(desc?: string) {
    const toSend = (desc ?? description).trim()
    if (!toSend || toSend.length < 10) {
      setError('Please describe your agent in at least 10 characters.')
      return
    }

    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const res = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: toSend }),
      })

      const data = await res.json() as { agent?: Agent; error?: string; code?: string }

      if (!res.ok) {
        if (data.code === 'UPGRADE_REQUIRED') {
          setError("You've reached the free plan limit. Upgrade to Pro to create more agents.")
        } else {
          setError(data.error ?? 'Generation failed. Please try again.')
        }
        return
      }

      setPreview(data.agent!)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleSaveAndRun() {
    if (!preview) return
    setSaving(true)
    router.push(`/agents/${preview.id}`)
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Template badge */}
      {template && (
        <div className="flex items-center gap-2 bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 mb-6">
          <span className="text-xl">{template.emoji}</span>
          <div>
            <div className="text-sm font-semibold text-white">{template.name}</div>
            <div className="text-xs text-red-400">{template.tagline}</div>
          </div>
          <Link href="/agents/templates" className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Browse all templates
          </Link>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {template ? 'Customise & recruit' : 'Brief your operative'}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {template
            ? 'The mission profile is pre-filled. Edit it to tailor the operative for your needs, then recruit.'
            : 'Describe the mission in plain English. The more detail, the sharper the operative.'}
        </p>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={'e.g. "An agent that monitors Hacker News for AI posts, extracts insights, and formats them into a daily briefing"'}
          rows={template ? 6 : 5}
          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-red-500 transition-colors"
        />

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => void generate()}
            disabled={loading || !description.trim()}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            ) : preview ? (
              <><RotateCcw className="w-4 h-4" /> Regenerate</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Recruit Operative</>
            )}
          </button>
          {!template && (
            <Link
              href="/agents/templates"
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <LayoutGrid className="w-4 h-4" /> Browse templates
            </Link>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-1/3 shimmer rounded" />
          <div className="h-3 w-full shimmer rounded" />
          <div className="h-3 w-5/6 shimmer rounded" />
          <div className="h-3 w-2/3 shimmer rounded" />
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-20 shimmer rounded" />
            <div className="h-6 w-24 shimmer rounded" />
          </div>
        </div>
      )}

      {/* Generated config preview */}
      {preview && !loading && (
        <div className="bg-slate-900/60 border border-red-800/50 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-red-400 uppercase tracking-widest mb-1">Ready for deployment</div>
              <h2 className="text-xl font-bold">{preview.name}</h2>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {preview.tools.map((tool) => (
                <span
                  key={tool}
                  className={`text-xs px-2 py-0.5 rounded border ${TOOL_COLORS[tool] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  {TOOL_LABELS[tool] ?? tool}
                </span>
              ))}
              {preview.tools.length === 0 && (
                <span className="text-xs px-2 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">
                  No tools (text only)
                </span>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              System prompt
            </button>
            {showPrompt && (
              <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg p-4 terminal text-slate-300 text-xs max-h-48 overflow-y-auto">
                {preview.system_prompt}
              </div>
            )}
          </div>

          {preview.suggested_use_cases?.length > 0 && (
            <div>
              <div className="text-sm text-slate-400 mb-2">Example tasks to try</div>
              <ul className="space-y-1.5">
                {preview.suggested_use_cases.map((uc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">→</span>
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={handleSaveAndRun}
              disabled={saving}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save &amp; run
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Save for later
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}

export default function NewAgentPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-slate-100">
      <header className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Command Center
          </Link>
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-red-400" />
            <span className="font-bold">Recruit Operative</span>
          </div>
          <Link href="/agents/templates" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <LayoutGrid className="w-3.5 h-3.5" /> Templates
          </Link>
        </div>
      </header>
      <Suspense fallback={<div className="p-10 text-slate-500 text-sm">Loading…</div>}>
        <NewAgentForm />
      </Suspense>
    </div>
  )
}
