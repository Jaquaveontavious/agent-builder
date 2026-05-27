'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X, LayoutDashboard, Loader2, AlertCircle } from 'lucide-react'
import type { Agent, PanelConfig, PanelSize, PanelType } from '@/lib/types'
import { PANEL_ICONS, PANEL_LABELS, SIZE_LABELS } from '@/lib/panels'

interface PanelDraft extends PanelConfig {
  _key: number
}

const PANEL_TYPES: PanelType[] = ['stat', 'list', 'table', 'text', 'query']
const PANEL_SIZES: PanelSize[] = ['small', 'medium', 'large']

let keyCounter = 0

function blankPanel(): PanelDraft {
  return {
    _key: ++keyCounter,
    title: '',
    agent_id: '',
    panel_type: 'text',
    size: 'medium',
    position: 0,
    auto_prompt: '',
  }
}

export default function NewWorkspacePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [panels, setPanels] = useState<PanelDraft[]>([blankPanel()])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { void loadAgents() }, [])

  async function loadAgents() {
    const res = await fetch('/api/agents')
    if (res.ok) {
      const data = await res.json() as { agents: Agent[] }
      setAgents(data.agents)
    }
    setLoadingAgents(false)
  }

  function addPanel() { setPanels((p) => [...p, blankPanel()]) }
  function removePanel(key: number) { setPanels((p) => p.filter((x) => x._key !== key)) }
  function updatePanel(key: number, patch: Partial<PanelDraft>) {
    setPanels((p) => p.map((x) => x._key === key ? { ...x, ...patch } : x))
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Workspace name is required.'); return }
    if (panels.some((p) => !p.title.trim())) { setError('All panels need a title.'); return }
    if (panels.some((p) => !p.agent_id)) { setError('All panels need an agent selected.'); return }

    setSubmitting(true)
    setError('')

    const panelConfigs: PanelConfig[] = panels.map((p, i) => ({
      title: p.title.trim(),
      agent_id: p.agent_id,
      panel_type: p.panel_type,
      size: p.size,
      position: i,
      auto_prompt: p.auto_prompt?.trim() || undefined,
    }))

    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, panels: panelConfigs }),
    })

    if (!res.ok) {
      setError(await res.text())
      setSubmitting(false)
      return
    }

    const data = await res.json() as { workspace: { id: string } }
    router.push(`/workspace/${data.workspace.id}`)
  }

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 metal-grid">
      <header className="border-b border-slate-800/60 px-6 py-4 bg-[#060608]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Workspaces
          </Link>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-red-400" />
            <span className="font-bold">New Workspace</span>
          </div>
          <div className="w-28" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Workspace meta */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-slate-500">Workspace Details</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Business Intelligence Hub"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Description <span className="text-slate-600">(optional)</span></label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workspace track?"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>

        {/* Panels */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest text-slate-500">Panels</h2>
            <button onClick={addPanel} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Panel
            </button>
          </div>

          {loadingAgents && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading agents…
            </div>
          )}

          {!loadingAgents && agents.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
              No agents found. <Link href="/agents/new" className="text-red-400 hover:text-red-300">Create an agent first</Link>.
            </div>
          )}

          <div className="space-y-4">
            {panels.map((panel, idx) => (
              <div key={panel._key} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Panel {idx + 1}</span>
                  {panels.length > 1 && (
                    <button onClick={() => removePanel(panel._key)} className="text-slate-700 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Title *</label>
                    <input
                      value={panel.title}
                      onChange={(e) => updatePanel(panel._key, { title: e.target.value })}
                      placeholder="e.g. Revenue Overview"
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Agent *</label>
                    <select
                      value={panel.agent_id}
                      onChange={(e) => updatePanel(panel._key, { agent_id: e.target.value })}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600 transition-colors"
                    >
                      <option value="">Select agent…</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Display Type</label>
                    <select
                      value={panel.panel_type}
                      onChange={(e) => updatePanel(panel._key, { panel_type: e.target.value as PanelType })}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600 transition-colors"
                    >
                      {PANEL_TYPES.map((t) => (
                        <option key={t} value={t}>{PANEL_ICONS[t]} {PANEL_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Size</label>
                    <select
                      value={panel.size}
                      onChange={(e) => updatePanel(panel._key, { size: e.target.value as PanelSize })}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600 transition-colors"
                    >
                      {PANEL_SIZES.map((s) => (
                        <option key={s} value={s}>{SIZE_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">
                    {panel.panel_type === 'query' ? 'Initial context (optional)' : 'What should this panel show? *'}
                  </label>
                  <textarea
                    value={panel.auto_prompt}
                    onChange={(e) => updatePanel(panel._key, { auto_prompt: e.target.value })}
                    placeholder={
                      panel.panel_type === 'stat'  ? 'e.g. What is the current market size for AI SaaS tools?' :
                      panel.panel_type === 'list'  ? 'e.g. List the top 5 growth opportunities in our market right now' :
                      panel.panel_type === 'table' ? 'e.g. Compare the top 4 competitors: name, price, key feature, rating' :
                      panel.panel_type === 'query' ? 'e.g. You are a business analyst. Answer questions concisely.' :
                      'e.g. Write a 3-paragraph strategic brief on our competitive position'
                    }
                    rows={2}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors resize-none"
                  />
                  {panel.panel_type !== 'query' && (
                    <p className="text-xs text-slate-600 mt-1">This runs automatically when the workspace loads.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addPanel}
            className="mt-4 w-full py-3 border border-dashed border-slate-700 hover:border-red-700 text-slate-600 hover:text-red-400 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add another panel
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/workspace" className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors">
            Cancel
          </Link>
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Building…</> : <><LayoutDashboard className="w-4 h-4" /> Build Workspace</>}
          </button>
        </div>
      </main>
    </div>
  )
}
