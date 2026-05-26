'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Network,
  ArrowLeft,
  Play,
  Square,
  Loader2,
  Cpu,
  CheckCircle,
  AlertCircle,
  Zap,
  Wrench,
  Trash2,
  Clock,
} from 'lucide-react'
import type { Grid, GridRun, GridSSEEvent, GridMember } from '@/lib/types'

const PALETTE = [
  { text: 'text-blue-300', border: 'border-blue-700/50', bg: 'bg-blue-950/30', dot: 'bg-blue-400' },
  { text: 'text-purple-300', border: 'border-purple-700/50', bg: 'bg-purple-950/30', dot: 'bg-purple-400' },
  { text: 'text-emerald-300', border: 'border-emerald-700/50', bg: 'bg-emerald-950/30', dot: 'bg-emerald-400' },
  { text: 'text-amber-300', border: 'border-amber-700/50', bg: 'bg-amber-950/30', dot: 'bg-amber-400' },
  { text: 'text-cyan-300', border: 'border-cyan-700/50', bg: 'bg-cyan-950/30', dot: 'bg-cyan-400' },
  { text: 'text-rose-300', border: 'border-rose-700/50', bg: 'bg-rose-950/30', dot: 'bg-rose-400' },
]

type AgentStatus = 'idle' | 'running' | 'complete'

interface FeedItem {
  id: number
  kind: 'coordinator' | 'agent_text' | 'agent_tool' | 'agent_complete' | 'error'
  content: string
  agent_id?: string
  agent_name?: string
  tool?: string
  tokens?: number
}

export default function GridRunnerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [grid, setGrid] = useState<Grid | null>(null)
  const [runs, setRuns] = useState<GridRun[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [agentStatus, setAgentStatus] = useState<Record<string, AgentStatus>>({})
  const [agentTokens, setAgentTokens] = useState<Record<string, number>>({})
  const [totalTokens, setTotalTokens] = useState(0)
  const [activeTab, setActiveTab] = useState<'run' | 'history'>('run')
  const [loadError, setLoadError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const feedRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const itemCounter = useRef(0)

  const colorMap = useRef<Record<string, (typeof PALETTE)[0]>>({})

  function getColor(agentId: string, members?: GridMember[]) {
    if (!colorMap.current[agentId] && members) {
      const idx = members.findIndex((m) => m.id === agentId)
      colorMap.current[agentId] = PALETTE[idx % PALETTE.length] ?? PALETTE[0]
    }
    return colorMap.current[agentId] ?? PALETTE[0]
  }

  useEffect(() => {
    void loadGrid()
  }, [id])

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [feed])

  async function loadGrid() {
    const res = await fetch(`/api/grids/${id}`)
    if (!res.ok) { setLoadError('Grid not found.'); return }
    const data = await res.json() as { grid: Grid; runs: GridRun[] }
    setGrid(data.grid)
    setRuns(data.runs)
    // Pre-seed color map
    data.grid.member_agents.forEach((m, i) => {
      colorMap.current[m.id] = PALETTE[i % PALETTE.length] ?? PALETTE[0]
    })
  }

  function pushFeed(item: Omit<FeedItem, 'id'>) {
    setFeed((prev) => {
      const newId = ++itemCounter.current
      // Merge consecutive coordinator or agent_text items from the same agent
      if (
        (item.kind === 'coordinator' || item.kind === 'agent_text') &&
        prev.length > 0
      ) {
        const last = prev[prev.length - 1]
        if (
          last.kind === item.kind &&
          last.agent_id === item.agent_id
        ) {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...last,
            content: last.content + item.content,
          }
          return updated
        }
      }
      return [...prev, { ...item, id: newId }]
    })
  }

  async function handleLaunch() {
    if (!input.trim() || running || !grid) return

    setRunning(true)
    setFeed([])
    setTotalTokens(0)
    const initial: Record<string, AgentStatus> = {}
    grid.member_agents.forEach((m) => { initial[m.id] = 'idle' })
    setAgentStatus(initial)
    setAgentTokens({})

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch(`/api/grids/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        pushFeed({ kind: 'error', content: text || `HTTP ${res.status}` })
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw) as GridSSEEvent

            if (event.type === 'coordinator_text') {
              pushFeed({ kind: 'coordinator', content: event.content })
            } else if (event.type === 'agent_start') {
              setAgentStatus((p) => ({ ...p, [event.agent_id]: 'running' }))
              pushFeed({
                kind: 'agent_text',
                content: '',
                agent_id: event.agent_id,
                agent_name: event.agent_name,
              })
            } else if (event.type === 'agent_text') {
              pushFeed({
                kind: 'agent_text',
                content: event.content,
                agent_id: event.agent_id,
              })
            } else if (event.type === 'agent_tool_call') {
              pushFeed({
                kind: 'agent_tool',
                content: `Using ${event.tool}…`,
                agent_id: event.agent_id,
                tool: event.tool,
              })
            } else if (event.type === 'agent_complete') {
              setAgentStatus((p) => ({ ...p, [event.agent_id]: 'complete' }))
              setAgentTokens((p) => ({ ...p, [event.agent_id]: event.tokens }))
              pushFeed({
                kind: 'agent_complete',
                content: '',
                agent_id: event.agent_id,
                tokens: event.tokens,
              })
            } else if (event.type === 'done') {
              setTotalTokens(event.tokens_used)
              void loadGrid()
            } else if (event.type === 'error') {
              pushFeed({ kind: 'error', content: event.message })
            }
          } catch {
            // Malformed event
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        pushFeed({ kind: 'error', content: 'Connection error. Please try again.' })
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setRunning(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/grids/${id}`, { method: 'DELETE' })
    router.push('/grid')
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center text-slate-400">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p>{loadError}</p>
          <button onClick={() => router.push('/grid')} className="mt-4 text-red-400 hover:text-red-300">
            Back to Grids
          </button>
        </div>
      </div>
    )
  }

  const members = grid?.member_agents ?? []

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col metal-grid">
      <header className="border-b border-slate-800/60 px-6 py-4 flex-shrink-0 bg-[#060608]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/grid" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            The Grid
          </Link>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-red-400" />
            <span className="font-bold truncate max-w-[200px]">{grid?.name ?? 'Loading…'}</span>
            {members.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {members.length} agents
              </span>
            )}
          </div>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="text-slate-700 hover:text-red-500 transition-colors"
            title="Delete Grid"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete this Grid?</h3>
            <p className="text-slate-400 text-sm mb-6">All run history will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1 w-fit">
          {(['run', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'run' ? 'Run' : `History (${runs.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'run' && (
          <>
            {/* Input */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-3 block">
                Grid Objective
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleLaunch()
                }}
                placeholder={`What should ${grid?.name ?? 'the Grid'} accomplish?`}
                rows={3}
                disabled={running}
                className="w-full bg-transparent text-slate-100 placeholder-slate-600 text-sm resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-600">⌘+Enter to launch</span>
                {running ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={() => void handleLaunch()}
                    disabled={!input.trim()}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Launch Grid
                  </button>
                )}
              </div>
            </div>

            {/* Main area: roster + feed */}
            <div className="flex gap-5 flex-1">
              {/* Agent Roster */}
              <div className="w-56 flex-shrink-0 space-y-2">
                <div className="text-xs uppercase tracking-widest text-slate-600 mb-3 px-1">
                  Agents
                </div>
                {members.map((member) => {
                  const color = getColor(member.id, members)
                  const status = agentStatus[member.id] ?? 'idle'
                  const tokens = agentTokens[member.id]

                  return (
                    <div
                      key={member.id}
                      className={`rounded-lg border p-3 transition-all ${
                        status === 'running'
                          ? `${color.border} ${color.bg}`
                          : status === 'complete'
                          ? 'border-slate-700/50 bg-slate-900/40'
                          : 'border-slate-800 bg-slate-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {status === 'idle' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                        )}
                        {status === 'running' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot} flex-shrink-0 animate-pulse`} />
                        )}
                        {status === 'complete' && (
                          <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-semibold leading-tight line-clamp-1">
                          {member.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{member.role}</div>
                      {status === 'running' && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-500" />
                          <span className="text-[10px] text-slate-500">Working…</span>
                        </div>
                      )}
                      {status === 'complete' && tokens !== undefined && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-600">
                          <Zap className="w-2.5 h-2.5" />
                          {tokens.toLocaleString()} tokens
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Activity Feed */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col min-h-[400px]">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-red-900" />
                  <span className="text-slate-600 text-xs ml-2">grid activity</span>
                  {totalTokens > 0 && (
                    <span className="text-slate-600 text-xs flex items-center gap-1 ml-2">
                      <Zap className="w-3 h-3" /> {totalTokens.toLocaleString()} tokens
                    </span>
                  )}
                </div>

                <div
                  ref={feedRef}
                  className="flex-1 overflow-y-auto p-4 space-y-2 terminal max-h-[560px]"
                >
                  {feed.length === 0 && !running && (
                    <p className="text-slate-700 text-xs">Activity will appear here when the Grid runs…</p>
                  )}

                  {running && feed.length === 0 && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Grid Coordinator initializing…
                    </div>
                  )}

                  {feed.map((item) => {
                    if (item.kind === 'coordinator') {
                      return (
                        <div key={item.id} className="text-slate-200 text-sm leading-relaxed">
                          {item.content}
                        </div>
                      )
                    }

                    const color = item.agent_id ? getColor(item.agent_id, members) : PALETTE[0]

                    if (item.kind === 'agent_text') {
                      if (!item.content) return null
                      return (
                        <div key={item.id} className={`border-l-2 pl-3 ${color.border}`}>
                          {item.agent_name && (
                            <div className={`text-[10px] uppercase tracking-widest mb-0.5 ${color.text} opacity-70`}>
                              {item.agent_name}
                            </div>
                          )}
                          <span className={`text-sm ${color.text}`}>{item.content}</span>
                        </div>
                      )
                    }

                    if (item.kind === 'agent_tool') {
                      return (
                        <div key={item.id} className={`flex items-center gap-2 text-xs ${color.text} opacity-60`}>
                          <Wrench className="w-3 h-3 flex-shrink-0" />
                          {item.content}
                        </div>
                      )
                    }

                    if (item.kind === 'agent_complete') {
                      return (
                        <div key={item.id} className={`flex items-center gap-1.5 text-xs text-emerald-500/70`}>
                          <CheckCircle className="w-3 h-3" />
                          Agent complete
                          {item.tokens !== undefined && (
                            <span className="text-slate-600">— {item.tokens.toLocaleString()} tokens</span>
                          )}
                        </div>
                      )
                    }

                    if (item.kind === 'error') {
                      return (
                        <div key={item.id} className="flex items-start gap-2 text-red-400 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          {item.content}
                        </div>
                      )
                    }

                    return null
                  })}

                  {running && feed.length > 0 && (
                    <span className="cursor text-red-400 text-sm" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {runs.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-12">No runs yet.</p>
            )}
            {runs.map((run) => (
              <div key={run.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm text-slate-300 font-medium line-clamp-1">{run.input}</p>
                  <span
                    className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                      run.status === 'complete' ? 'text-emerald-400' :
                      run.status === 'failed'   ? 'text-red-400'     : 'text-blue-400'
                    }`}
                  >
                    {run.status === 'complete' && <CheckCircle className="w-3 h-3" />}
                    {run.status === 'failed'   && <AlertCircle className="w-3 h-3" />}
                    {run.status === 'running'  && <Loader2 className="w-3 h-3 animate-spin" />}
                    {run.status}
                  </span>
                </div>
                {run.output && (
                  <p className="text-xs text-slate-500 line-clamp-2">{run.output}</p>
                )}
                {run.agent_logs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {run.agent_logs.map((log, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                        {log.agent_name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(run.created_at).toLocaleString()}
                  </span>
                  {run.tokens_used > 0 && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> {run.tokens_used.toLocaleString()} tokens
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
