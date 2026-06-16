'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Send,
  Loader2,
  Building2,
  Cpu,
  CheckCircle,
  Wrench,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Search,
  Phone,
  ArrowLeft,
} from 'lucide-react'
import DealDossier from '@/components/DealDossier'
import UpgradeButton from '@/components/UpgradeButton'
import type { PropertyInput } from '@/app/api/propiq/dossier/route'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentActivity?: AgentActivity[]
}

interface AgentActivity {
  kind: 'start' | 'tool' | 'complete'
  agentName: string
  detail?: string
  tokens?: number
}

const EXAMPLES = [
  'Find me single family homes in Phoenix under $250k with 20%+ ARV upside',
  'Look for off-market deals in Dallas under $200k — distressed or price reduced preferred',
  'Pull comps for 1234 Oak St, Austin TX 78701 and estimate the ARV',
  'Find flips in Atlanta GA under $300k, 3 bed minimum',
]

function parsePropertyInput(address: string, fields: Record<string, string>): PropertyInput {
  const price =
    fields['Price'] ??
    fields['List Price'] ??
    fields['Asking Price'] ??
    fields['Price (ask)'] ??
    Object.entries(fields).find(([k]) => k.toLowerCase().includes('price'))?.[1] ??
    ''

  return {
    address,
    price,
    beds: fields['Beds/Baths/Sqft']?.split('/')[0]?.trim() ?? '',
    baths: fields['Beds/Baths/Sqft']?.split('/')[1]?.trim() ?? '',
    sqft: fields['Beds/Baths/Sqft']?.split('/')[2]?.trim() ?? '',
    daysOnMarket: fields['Days on Market'] ?? '',
    arv: fields['Est. ARV'] ?? '',
    arvRange: fields['ARV Range'] ?? '',
    upside: fields['Upside'] ?? '',
    owner: fields['Owner']?.split('|')[0]?.trim() ?? '',
    ownerType: fields['Owner']?.split('|')[1]?.trim() ?? '',
    lastSold: fields['Last Sold'] ?? '',
    mailTo: fields['Mail To'] ?? '',
    whyItStandsOut: fields['Why it stands out'] ?? '',
  }
}

interface SkipResult { phones: string[]; emails: string[]; name: string; city?: string; state?: string }

function PropertyCard({ content, onAnalyze }: { content: string; onAnalyze: (p: PropertyInput) => void }) {
  const [skipResults, setSkipResults] = useState<Record<number, SkipResult[] | 'loading' | 'none'>>({})

  async function handleSkipTrace(i: number, ownerName: string, mailTo: string) {
    setSkipResults((prev) => ({ ...prev, [i]: 'loading' }))
    try {
      const parts = mailTo.split(',')
      const state = parts[parts.length - 1]?.trim().split(' ').find((p) => p.length === 2 && p === p.toUpperCase())
      const city = parts[parts.length - 2]?.trim()
      const res = await fetch('/api/propiq/skip-tracer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ownerName, city, state }),
      })
      const data = await res.json() as { results?: SkipResult[] }
      setSkipResults((prev) => ({
        ...prev,
        [i]: data.results && data.results.length > 0 ? data.results : 'none',
      }))
    } catch {
      setSkipResults((prev) => ({ ...prev, [i]: 'none' }))
    }
  }

  const blocks = content.split(/\n\s*---\s*\n/).map((b) => b.trim()).filter(Boolean)

  const propertyBlocks = blocks.filter((b) =>
    b.startsWith('**') || b.includes('Price:') || b.includes('- Price:') || /^\*\*[^*]+\*\*/.test(b)
  )
  const summaryMatch = content.match(/##\s*Top Pick\n([\s\S]+)$/) ?? content.match(/## Summary\n([\s\S]+)$/)

  if (propertyBlocks.length === 0) {
    return (
      <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {propertyBlocks.map((block, i) => {
        const addressMatch = block.match(/\*\*(.+?)\*\*/)
        const address = addressMatch?.[1] ?? `Property ${i + 1}`

        const fields: Record<string, string> = {}
        const fieldRegex = /^- (.+?): (.+)$/gm
        let m: RegExpExecArray | null
        while ((m = fieldRegex.exec(block)) !== null) {
          fields[m[1].trim()] = m[2].trim()
        }

        const score = fields['Deal Score']
        const scoreNum = score ? parseInt(score) : null
        const scoreColor =
          scoreNum !== null
            ? scoreNum >= 7 ? 'text-emerald-400' : scoreNum >= 5 ? 'text-amber-400' : 'text-red-400'
            : 'text-slate-400'

        return (
          <div key={i} className="bg-slate-900 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-100 text-sm">{address}</span>
              </div>
              {score && (
                <span className={`text-xs font-bold ${scoreColor} bg-slate-800 px-2 py-1 rounded-lg flex-shrink-0`}>
                  {score}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {Object.entries(fields).map(([key, val]) => {
                if (['Deal Score', 'Why it stands out', 'Owner', 'Mail To', 'Last Sold'].includes(key)) return null
                const isHighlight = key === 'Upside' || key === 'Est. ARV'
                return (
                  <div key={key} className="flex gap-1.5">
                    <span className="text-slate-500 flex-shrink-0">{key}:</span>
                    <span className={isHighlight ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>{val}</span>
                  </div>
                )
              })}
            </div>

            {fields['Why it stands out'] && (
              <p className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 italic">
                {fields['Why it stands out']}
              </p>
            )}

            {(fields['Owner'] || fields['Mail To'] || fields['Last Sold']) && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Owner Info</div>
                {fields['Owner'] && (
                  <div className="flex gap-1.5 text-xs">
                    <span className="text-slate-500 flex-shrink-0">Owner:</span>
                    <span className="text-slate-300">{fields['Owner']}</span>
                  </div>
                )}
                {fields['Last Sold'] && (
                  <div className="flex gap-1.5 text-xs">
                    <span className="text-slate-500 flex-shrink-0">Last Sold:</span>
                    <span className="text-slate-300">{fields['Last Sold']}</span>
                  </div>
                )}
                {fields['Mail To'] && (
                  <div className="flex gap-1.5 text-xs">
                    <span className="text-slate-500 flex-shrink-0">Mail To:</span>
                    <span className="text-amber-300 font-medium">{fields['Mail To']}</span>
                  </div>
                )}
              </div>
            )}

            {skipResults[i] === 'loading' && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Searching public records…
              </div>
            )}
            {skipResults[i] === 'none' && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                <p className="text-xs text-slate-500">No records in public database.</p>
                <a
                  href="https://batchskiptracing.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Search className="w-3 h-3" />
                  Try BatchSkipTracing — $0.12/record
                </a>
              </div>
            )}
            {Array.isArray(skipResults[i]) && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-violet-500">Skip Trace Results</div>
                {(skipResults[i] as SkipResult[]).slice(0, 3).map((r, ri) => (
                  <div key={ri} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200">{r.name}</span>
                      {(r.city || r.state) && (
                        <span className="text-[10px] text-slate-500">{[r.city, r.state].filter(Boolean).join(', ')}</span>
                      )}
                    </div>
                    {r.phones.length === 0 && (
                      <p className="text-[10px] text-slate-600 italic">No phone on record</p>
                    )}
                    {r.phones.slice(0, 3).map((phone, pi) => (
                      <a key={pi} href={`tel:${phone}`} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors group">
                        <Phone className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-slate-200 group-hover:text-white font-medium">{phone}</span>
                      </a>
                    ))}
                    {r.emails.slice(0, 2).map((email, ei) => (
                      <div key={ei} className="text-xs text-slate-500 pl-1">{email}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => onAnalyze(parsePropertyInput(address, fields))}
                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Full Analysis
              </button>
              {fields['Owner'] && (
                <button
                  onClick={() => {
                    const rawOwner = fields['Owner'].split('|')[0].trim()
                    const primaryOwner = rawOwner.split(/\s*&\s*/)[0].trim()
                    void handleSkipTrace(i, primaryOwner, fields['Mail To'] ?? '')
                  }}
                  disabled={skipResults[i] === 'loading'}
                  className="flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Skip Trace
                </button>
              )}
            </div>
          </div>
        )
      })}

      {summaryMatch && (
        <div className="bg-blue-950/30 border border-blue-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Top Pick</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{summaryMatch[1].trim()}</p>
        </div>
      )}
    </div>
  )
}

function AgentActivityLog({ activities }: { activities: AgentActivity[] }) {
  const [open, setOpen] = useState(false)
  if (activities.length === 0) return null
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
      >
        <Cpu className="w-3 h-3" />
        {activities.filter((a) => a.kind === 'complete').length} agents ran
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 space-y-1 pl-2 border-l border-slate-800">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {a.kind === 'start' && <Cpu className="w-3 h-3 text-blue-400 flex-shrink-0" />}
              {a.kind === 'tool' && <Wrench className="w-3 h-3 text-amber-500 flex-shrink-0" />}
              {a.kind === 'complete' && <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
              <span className={a.kind === 'start' ? 'text-blue-400' : a.kind === 'tool' ? 'text-amber-500' : 'text-emerald-400'}>
                {a.kind === 'start' && `${a.agentName} started`}
                {a.kind === 'tool' && `${a.agentName}: ${a.detail}`}
                {a.kind === 'complete' && `${a.agentName} done${a.tokens ? ` — ${a.tokens.toLocaleString()} tokens` : ''}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const TRIAL_LIMIT = 3

export default function PropIQSuitePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [agentActivity, setAgentActivity] = useState<AgentActivity[]>([])
  const [error, setError] = useState('')
  const [dossierProperty, setDossierProperty] = useState<PropertyInput | null>(null)
  const [trialUsed, setTrialUsed] = useState<number | null>(null)
  const [isPro, setIsPro] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    fetch('/api/subscription')
      .then((r) => r.json())
      .then((d: { subscription?: { plan?: string; trial_searches_used?: number } }) => {
        setIsPro(d.subscription?.plan === 'pro')
        setTrialUsed(d.subscription?.trial_searches_used ?? 0)
      })
      .catch(() => {})
  }, [])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    setInput('')
    setError('')
    setLoading(true)
    setStreamingContent('')
    setAgentActivity([])

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/propiq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversation_id: conversationId }),
      })

      if (!res.ok) {
        const t = await res.text()
        setError(t || `Error ${res.status}`)
        setLoading(false)
        return
      }

      const convId = res.headers.get('X-Conversation-Id')
      if (convId && !conversationId) setConversationId(convId)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      const activities: AgentActivity[] = []

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
            const event = JSON.parse(raw) as {
              type: string
              content?: string
              agent_id?: string
              agent_name?: string
              tool?: string
              tokens?: number
              message?: string
            }

            if (event.type === 'upgrade_required') {
              setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: '__upgrade_required__' }])
              setStreamingContent('')
              setAgentActivity([])
              setLoading(false)
              return
            } else if (event.type === 'coordinator_text') {
              fullContent += event.content ?? ''
              setStreamingContent(fullContent)
            } else if (event.type === 'agent_start') {
              activities.push({ kind: 'start', agentName: event.agent_name ?? '' })
              setAgentActivity([...activities])
            } else if (event.type === 'agent_tool_call') {
              activities.push({ kind: 'tool', agentName: event.agent_id ?? '', detail: `Using ${event.tool}` })
              setAgentActivity([...activities])
            } else if (event.type === 'agent_complete') {
              const startIdx = activities.findIndex((x) => x.kind === 'start' && x.agentName === (event.agent_name ?? event.agent_id))
              if (startIdx >= 0) activities[startIdx].agentName = event.agent_name ?? event.agent_id ?? ''
              activities.push({ kind: 'complete', agentName: event.agent_name ?? event.agent_id ?? '', tokens: event.tokens })
              setAgentActivity([...activities])
            } else if (event.type === 'done') {
              setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: fullContent, agentActivity: [...activities] }])
              setStreamingContent('')
              setAgentActivity([])
              if (!isPro) setTrialUsed((n) => (n ?? 0) + 1)
            } else if (event.type === 'error') {
              setError(event.message ?? 'Unknown error')
            }
          } catch {
            // malformed event
          }
        }
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const isEmpty = messages.length === 0 && !streamingContent

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg tracking-tight">PropIQ</span>
              <span className="text-slate-500 text-xs block leading-none hidden sm:block">Real Estate AI Back Office</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/skip-tracer" className="hidden sm:flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              <Search className="w-3.5 h-3.5" />
              Skip Tracer
            </Link>
            {!isPro && trialUsed !== null && (
              trialUsed >= TRIAL_LIMIT ? (
                <UpgradeButton label="Upgrade — $97/mo" />
              ) : (
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {TRIAL_LIMIT - trialUsed} search{TRIAL_LIMIT - trialUsed !== 1 ? 'es' : ''} left
                </span>
              )
            )}
            {conversationId && (
              <button
                onClick={() => { setMessages([]); setConversationId(null); setStreamingContent('') }}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors whitespace-nowrap"
              >
                New chat
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {isEmpty && (
          <div className="pt-12 text-center space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight">Find your next deal.</h1>
              <p className="text-slate-400 text-lg">
                Tell me what you're looking for — location, budget, property type — and I'll find properties, pull comps, and score the upside.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 text-left max-w-xl mx-auto">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => void sendMessage(ex)}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-300 hover:text-white text-left transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-slate-800 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm text-slate-100">
                {msg.content}
              </div>
            ) : msg.content === '__upgrade_required__' ? (
              <div className="max-w-[95%] bg-blue-950/40 border border-blue-700/50 rounded-2xl px-6 py-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-300">You've used your 3 free searches</span>
                </div>
                <p className="text-sm text-slate-400">Unlock unlimited deal finding, comp pulling, and analysis for $97/mo.</p>
                <UpgradeButton label="Upgrade to PropIQ Pro — $97/mo" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors" />
              </div>
            ) : (
              <div className="max-w-[95%] space-y-1">
                <PropertyCard content={msg.content} onAnalyze={setDossierProperty} />
                {msg.agentActivity && msg.agentActivity.length > 0 && (
                  <AgentActivityLog activities={msg.agentActivity} />
                )}
              </div>
            )}
          </div>
        ))}

        {(streamingContent || (loading && agentActivity.length > 0)) && (
          <div className="flex justify-start">
            <div className="max-w-[95%] space-y-2">
              {agentActivity.length > 0 && (
                <div className="space-y-1 pl-2 border-l border-slate-800 mb-3">
                  {agentActivity.slice(-3).map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {a.kind === 'start' && <Loader2 className="w-3 h-3 text-blue-400 animate-spin flex-shrink-0" />}
                      {a.kind === 'tool' && <Wrench className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                      {a.kind === 'complete' && <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                      <span className="text-slate-500">
                        {a.kind === 'start' && `${a.agentName} searching…`}
                        {a.kind === 'tool' && `${a.detail}`}
                        {a.kind === 'complete' && `${a.agentName} done`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {streamingContent ? (
                <PropertyCard content={streamingContent} onAnalyze={setDossierProperty} />
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Agents working…
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#0a0a0f]/95 backdrop-blur border-t border-slate-800/60 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 focus-within:border-blue-700/60 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find deals in [city] under $[price]…"
              rows={2}
              disabled={loading}
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 text-sm resize-none focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-700">⌘+Enter to send</span>
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {loading ? 'Searching…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DealDossier property={dossierProperty} onClose={() => setDossierProperty(null)} />
    </div>
  )
}
