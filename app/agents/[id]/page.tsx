'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bot, ArrowLeft, Play, Square, Loader2, Wrench, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'
import type { Agent, Run, SSEEvent } from '@/lib/types'

const TOOL_COLORS: Record<string, string> = {
  web_search:     'text-blue-400',
  code_execution: 'text-amber-400',
  file_read:      'text-emerald-400',
  file_write:     'text-teal-400',
  http_request:   'text-pink-400',
}

interface OutputLine {
  type: 'text' | 'tool_call' | 'tool_result' | 'error'
  content: string
  meta?: string
}

export default function AgentRunPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [tokensUsed, setTokensUsed] = useState(0)
  const [activeTab, setActiveTab] = useState<'run' | 'history'>('run')
  const [loadError, setLoadError] = useState('')

  const outputRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    void loadAgentAndRuns()
  }, [id])

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' })
  }, [output])

  async function loadAgentAndRuns() {
    const res = await fetch(`/api/agents/${id}`)
    if (!res.ok) {
      setLoadError('Agent not found.')
      return
    }
    const data = await res.json() as { agent: Agent; runs: Run[] }
    setAgent(data.agent)
    setRuns(data.runs)
  }

  async function loadRuns() {
    const res = await fetch(`/api/agents/${id}`)
    if (!res.ok) return
    const data = await res.json() as { agent: Agent; runs: Run[] }
    setRuns(data.runs)
  }

  function appendOutput(line: OutputLine) {
    setOutput((prev) => {
      if (line.type === 'text' && prev.length > 0 && prev[prev.length - 1].type === 'text') {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: updated[updated.length - 1].content + line.content,
        }
        return updated
      }
      return [...prev, line]
    })
  }

  async function handleRun() {
    if (!input.trim() || running) return

    setRunning(true)
    setOutput([])
    setTokensUsed(0)

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch(`/api/agents/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        appendOutput({ type: 'error', content: text || `HTTP ${res.status}` })
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
            const event = JSON.parse(raw) as SSEEvent

            if (event.type === 'text') {
              appendOutput({ type: 'text', content: event.content })
            } else if (event.type === 'tool_call') {
              appendOutput({
                type: 'tool_call',
                content: `Calling ${event.name}…`,
                meta: event.name,
              })
            } else if (event.type === 'tool_result') {
              appendOutput({
                type: 'tool_result',
                content: event.content,
                meta: event.name,
              })
            } else if (event.type === 'done') {
              setTokensUsed(event.tokens_used)
              void loadAgentAndRuns()
            } else if (event.type === 'error') {
              appendOutput({ type: 'error', content: event.message })
            }
          } catch {
            // Malformed event — ignore
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        appendOutput({ type: 'error', content: 'Connection error. Please try again.' })
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center text-slate-400">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p>{loadError}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 text-violet-400 hover:text-violet-300">
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-400" />
            <span className="font-bold truncate max-w-[200px]">{agent?.name ?? 'Loading…'}</span>
          </div>
          <div className="flex gap-1.5">
            {(agent?.tools ?? []).map((tool) => (
              <span key={tool} className={`text-xs ${TOOL_COLORS[tool] ?? 'text-slate-400'}`} title={tool}>
                {tool.split('_')[0]}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1 w-fit">
          {(['run', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'run' && (
          <>
            {/* Input */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-3 block">Task input</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleRun()
                }}
                placeholder={`What do you want ${agent?.name ?? 'this agent'} to do?`}
                rows={3}
                disabled={running}
                className="w-full bg-transparent text-slate-100 placeholder-slate-600 text-sm resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-600">⌘+Enter to run</span>
                {running ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={() => void handleRun()}
                    disabled={!input.trim()}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Run
                  </button>
                )}
              </div>
            </div>

            {/* Output terminal */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col min-h-[300px]">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <span className="text-slate-600 text-xs ml-2">output</span>
                {tokensUsed > 0 && (
                  <span className="ml-auto text-slate-600 text-xs flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {tokensUsed.toLocaleString()} tokens
                  </span>
                )}
              </div>

              <div
                ref={outputRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 terminal max-h-[480px]"
              >
                {output.length === 0 && !running && (
                  <p className="text-slate-700 text-xs">Output will appear here…</p>
                )}

                {output.map((line, i) => {
                  if (line.type === 'text') {
                    return (
                      <span key={i} className="text-slate-200 text-sm">
                        {line.content}
                      </span>
                    )
                  }
                  if (line.type === 'tool_call') {
                    return (
                      <div key={i} className={`flex items-center gap-2 text-xs ${TOOL_COLORS[line.meta ?? ''] ?? 'text-violet-400'}`}>
                        <Wrench className="w-3 h-3 flex-shrink-0" />
                        {line.content}
                      </div>
                    )
                  }
                  if (line.type === 'tool_result') {
                    return (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 max-h-40 overflow-y-auto">
                        <div className="text-emerald-500 text-[10px] uppercase tracking-widest mb-1">{line.meta} result</div>
                        {line.content}
                      </div>
                    )
                  }
                  if (line.type === 'error') {
                    return (
                      <div key={i} className="flex items-start gap-2 text-red-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {line.content}
                      </div>
                    )
                  }
                  return null
                })}

                {running && output.length > 0 && (
                  <span className="cursor text-violet-400 text-sm" />
                )}
                {running && output.length === 0 && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Starting…
                  </div>
                )}
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
                      run.status === 'failed'   ? 'text-red-400'     :
                      run.status === 'running'  ? 'text-blue-400'    : 'text-slate-400'
                    }`}
                  >
                    {run.status === 'complete' && <CheckCircle className="w-3 h-3" />}
                    {run.status === 'failed'   && <AlertCircle className="w-3 h-3" />}
                    {run.status === 'running'  && <Loader2 className="w-3 h-3 animate-spin" />}
                    {run.status === 'pending'  && <Clock className="w-3 h-3" />}
                    {run.status}
                  </span>
                </div>
                {run.output && (
                  <p className="text-xs text-slate-500 line-clamp-2">{run.output}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                  <span>{new Date(run.created_at).toLocaleString()}</span>
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
