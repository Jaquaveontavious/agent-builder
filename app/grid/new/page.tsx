'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Crosshair,
  Network,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Cpu,
} from 'lucide-react'
import type { Agent, GridMember } from '@/lib/types'

interface SelectedAgent {
  agent: Agent
  role: string
}

export default function NewGridPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [selected, setSelected] = useState<SelectedAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadAgents()
  }, [])

  async function loadAgents() {
    const res = await fetch('/api/agents')
    if (res.ok) {
      const data = await res.json() as { agents: Agent[] }
      setAgents(data.agents)
    }
    setLoading(false)
  }

  function toggleAgent(agent: Agent) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.agent.id === agent.id)
      if (exists) return prev.filter((s) => s.agent.id !== agent.id)
      return [...prev, { agent, role: agent.name }]
    })
  }

  function updateRole(agentId: string, role: string) {
    setSelected((prev) =>
      prev.map((s) => (s.agent.id === agentId ? { ...s, role } : s))
    )
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Grid name is required.'); return }
    if (selected.length < 2) { setError('Select at least 2 agents.'); return }

    setSubmitting(true)
    setError('')

    const members: GridMember[] = selected.map((s) => ({
      id: s.agent.id,
      name: s.agent.name,
      role: s.role.trim() || s.agent.name,
    }))

    const res = await fetch('/api/grids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, member_agents: members }),
    })

    if (!res.ok) {
      const text = await res.text()
      setError(text || 'Failed to create grid.')
      setSubmitting(false)
      return
    }

    const data = await res.json() as { grid: { id: string } }
    router.push(`/grid/${data.grid.id}`)
  }

  const isSelected = (id: string) => selected.some((s) => s.agent.id === id)

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 metal-grid">
      <header className="border-b border-slate-800/60 px-6 py-4 bg-[#060608]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/grid" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            The Grid
          </Link>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-red-400" />
            <span className="font-bold">New Grid</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Name & Description */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4">Grid Configuration</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Grid Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research & Report Pipeline"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Description <span className="text-slate-600">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this Grid accomplish?"
              rows={2}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Agent Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest text-slate-500">Select Agents</h2>
            <span className="text-xs text-slate-600">
              {selected.length} selected
              {selected.length < 2 && (
                <span className="text-amber-600 ml-1">(need {2 - selected.length} more)</span>
              )}
            </span>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading agents…
            </div>
          )}

          {!loading && agents.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              <Cpu className="w-8 h-8 mx-auto mb-3 text-slate-700" />
              No agents found.{' '}
              <Link href="/agents/new" className="text-red-400 hover:text-red-300">
                Create an agent first
              </Link>
              .
            </div>
          )}

          <div className="space-y-2">
            {agents.map((agent) => {
              const sel = selected.find((s) => s.agent.id === agent.id)
              return (
                <div
                  key={agent.id}
                  className={`rounded-lg border transition-all ${
                    sel
                      ? 'border-red-700/60 bg-red-950/20'
                      : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <button
                      onClick={() => toggleAgent(agent)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                        sel
                          ? 'bg-red-600 border-red-600'
                          : 'border-slate-600 hover:border-red-500'
                      }`}
                    >
                      {sel && <span className="text-white text-[10px] font-bold">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{agent.name}</div>
                      <div className="text-xs text-slate-500 truncate">{agent.description}</div>
                    </div>
                    {sel && (
                      <button
                        onClick={() => toggleAgent(agent)}
                        className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {sel && (
                    <div className="px-3 pb-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500 flex-shrink-0">Role:</span>
                      <input
                        type="text"
                        value={sel.role}
                        onChange={(e) => updateRole(agent.id, e.target.value)}
                        placeholder="e.g. Research Specialist"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Summary */}
        {selected.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Grid Roster Preview</h3>
            <div className="flex flex-wrap gap-2">
              {selected.map((s, i) => (
                <div
                  key={s.agent.id}
                  className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-xs font-medium">{s.agent.name}</span>
                  <span className="text-xs text-slate-500">— {s.role || 'No role'}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-3">
              A Grid Coordinator will orchestrate these agents, delegating tasks based on each agent's role and specialty.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/grid"
            className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting || selected.length < 2 || !name.trim()}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Create Grid
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
