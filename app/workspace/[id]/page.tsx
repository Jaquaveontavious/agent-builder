'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, ArrowLeft, RefreshCw, Loader2, AlertCircle,
  Plus, Trash2, Send, TrendingUp, TrendingDown
} from 'lucide-react'
import type { Panel, PanelOutput, Workspace } from '@/lib/types'
import { SIZE_SPAN } from '@/lib/panels'

interface PanelState {
  output: PanelOutput | null
  loading: boolean
  query: string
}

// ─── Panel Renderers ─────────────────────────────────────────────────────────

function StatPanel({ output }: { output: PanelOutput }) {
  if (output.type !== 'stat') return null
  const up = output.trend?.startsWith('↑')
  const down = output.trend?.startsWith('↓')
  return (
    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
      <div className="text-4xl font-bold text-white mb-1">{output.value}</div>
      <div className="text-sm text-slate-400 mb-3">{output.label}</div>
      {output.trend && (
        <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${
          up ? 'bg-emerald-950/60 text-emerald-400' :
          down ? 'bg-red-950/60 text-red-400' :
          'bg-slate-800 text-slate-400'
        }`}>
          {up && <TrendingUp className="w-3.5 h-3.5" />}
          {down && <TrendingDown className="w-3.5 h-3.5" />}
          {output.trend}
        </div>
      )}
      {output.context && (
        <p className="text-xs text-slate-500 mt-3 max-w-[180px]">{output.context}</p>
      )}
    </div>
  )
}

function ListPanel({ output }: { output: PanelOutput }) {
  if (output.type !== 'list') return null
  return (
    <div>
      {output.title && <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">{output.title}</p>}
      <ul className="space-y-2">
        {output.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TablePanel({ output }: { output: PanelOutput }) {
  if (output.type !== 'table') return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {output.headers.map((h, i) => (
              <th key={i} className="text-left text-xs text-slate-500 uppercase tracking-widest pb-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {output.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-800/50">
              {row.map((cell, ci) => (
                <td key={ci} className="py-2 pr-4 text-slate-300 text-xs">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TextPanel({ output }: { output: PanelOutput }) {
  if (output.type !== 'text' && output.type !== 'query') return null
  return (
    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
      {output.content}
    </div>
  )
}

function ErrorPanel({ output }: { output: PanelOutput }) {
  if (output.type !== 'error') return null
  return (
    <div className="flex items-start gap-2 text-red-400 text-xs">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      {output.message}
    </div>
  )
}

function PanelContent({ output }: { output: PanelOutput }) {
  if (output.type === 'stat')  return <StatPanel output={output} />
  if (output.type === 'list')  return <ListPanel output={output} />
  if (output.type === 'table') return <TablePanel output={output} />
  if (output.type === 'text' || output.type === 'query') return <TextPanel output={output} />
  if (output.type === 'error') return <ErrorPanel output={output} />
  return null
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WorkspaceViewerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [panels, setPanels] = useState<Panel[]>([])
  const [panelState, setPanelState] = useState<Record<string, PanelState>>({})
  const [loadError, setLoadError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const hasAutoRun = useRef(false)

  useEffect(() => { void load() }, [id])

  async function load() {
    const res = await fetch(`/api/workspaces/${id}`)
    if (!res.ok) { setLoadError('Workspace not found.'); return }
    const data = await res.json() as { workspace: Workspace; panels: Panel[] }
    setWorkspace(data.workspace)
    setPanels(data.panels)

    // Init state from cached last_output or empty
    const initial: Record<string, PanelState> = {}
    for (const p of data.panels) {
      initial[p.id] = {
        output: p.last_output ?? null,
        loading: false,
        query: '',
      }
    }
    setPanelState(initial)

    // Auto-run panels that have a prompt and no cached output
    if (!hasAutoRun.current) {
      hasAutoRun.current = true
      for (const p of data.panels) {
        if (p.auto_prompt && !p.last_output) {
          void runPanel(p.id)
        }
      }
    }
  }

  async function runPanel(panelId: string, input?: string) {
    setPanelState((prev) => ({
      ...prev,
      [panelId]: { ...prev[panelId], loading: true },
    }))

    const res = await fetch(`/api/panels/${panelId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })

    const data = await res.json() as { output: PanelOutput }
    setPanelState((prev) => ({
      ...prev,
      [panelId]: { ...prev[panelId], loading: false, output: data.output, query: '' },
    }))
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
    router.push('/workspace')
  }

  async function deletePanel(panelId: string) {
    await fetch(`/api/panels/${panelId}`, { method: 'DELETE' })
    setPanels((prev) => prev.filter((p) => p.id !== panelId))
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center text-slate-400">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p>{loadError}</p>
          <button onClick={() => router.push('/workspace')} className="mt-4 text-red-400 hover:text-red-300">
            Back to Workspaces
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 bg-[#080810]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Workspaces
          </Link>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-red-400" />
            <span className="font-semibold">{workspace?.name ?? 'Loading…'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/workspace/${id}/add-panel`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Panel
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-slate-700 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete this workspace?</h3>
            <p className="text-slate-400 text-sm mb-6">All panels will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={() => void handleDelete()} disabled={deleting} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {panels.length === 0 && (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
            <LayoutDashboard className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No panels yet.</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-5 auto-rows-auto">
          {panels.map((panel) => {
            const state = panelState[panel.id] ?? { output: null, loading: false, query: '' }
            const sizeClass = SIZE_SPAN[panel.size] ?? 'col-span-2'

            return (
              <div
                key={panel.id}
                className={`${sizeClass} bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden`}
                style={{ minHeight: panel.size === 'small' ? '180px' : panel.panel_type === 'table' ? '240px' : '200px' }}
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{panel.title}</span>
                  <div className="flex items-center gap-2">
                    {state.loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
                    {!state.loading && panel.auto_prompt && (
                      <button
                        onClick={() => void runPanel(panel.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => void deletePanel(panel.id)}
                      className="text-slate-800 hover:text-red-600 transition-colors"
                      title="Remove panel"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Panel body */}
                <div className="flex-1 p-4 overflow-auto">
                  {state.loading && !state.output && (
                    <div className="flex flex-col gap-2 animate-pulse">
                      <div className="h-3 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                      <div className="h-3 bg-slate-800 rounded w-2/3" />
                    </div>
                  )}

                  {!state.loading && !state.output && panel.panel_type !== 'query' && (
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3" />
                      Click refresh to load
                    </div>
                  )}

                  {state.output && !state.loading && <PanelContent output={state.output} />}
                </div>

                {/* Query input */}
                {panel.panel_type === 'query' && (
                  <div className="border-t border-slate-800 px-3 py-2 flex items-center gap-2 flex-shrink-0">
                    <input
                      value={state.query}
                      onChange={(e) => setPanelState((prev) => ({ ...prev, [panel.id]: { ...prev[panel.id], query: e.target.value } }))}
                      onKeyDown={(e) => { if (e.key === 'Enter' && state.query.trim()) void runPanel(panel.id, state.query) }}
                      placeholder="Ask a question…"
                      disabled={state.loading}
                      className="flex-1 bg-transparent text-xs placeholder-slate-700 focus:outline-none text-slate-200"
                    />
                    <button
                      onClick={() => { if (state.query.trim()) void runPanel(panel.id, state.query) }}
                      disabled={state.loading || !state.query.trim()}
                      className="text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Last updated */}
                {panel.last_run_at && !state.loading && (
                  <div className="px-4 pb-2 text-[10px] text-slate-700">
                    Updated {new Date(panel.last_run_at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
