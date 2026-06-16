'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Cpu, CheckCircle, Zap } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface DeployedOperative {
  id?: string
  suite_id: string
  name: string
  config?: Record<string, unknown>
}

interface DeployDrawerProps {
  open: boolean
  onClose: () => void
  onDeployed: (operative: DeployedOperative) => void
}

const OPENER = "What does your business do, and what's taking up the most time on your backend right now?"

export default function DeployDrawer({ open, onClose, onDeployed }: DeployDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'assistant', content: OPENER },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [deployed, setDeployed] = useState<DeployedOperative | null>(null)
  const [deployedAll, setDeployedAll] = useState<DeployedOperative[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      resetDrawer()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  function resetDrawer() {
    setMessages([{ id: 'init', role: 'assistant', content: OPENER }])
    setInput('')
    setDeployed(null)
    setDeployedAll([])
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.id !== 'init')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json() as {
        success: boolean
        data?: { message: string; deployed?: DeployedOperative[] | null }
        error?: string
      }

      if (!data.success) throw new Error(data.error)

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.data!.message,
      }
      setMessages((prev) => [...prev, assistantMsg])

      if (data.data?.deployed && data.data.deployed.length > 0) {
        setDeployed(data.data.deployed[0])
        setDeployedAll(data.data.deployed)
        for (const op of data.data.deployed) {
          onDeployed(op)
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong. Try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void send()
  }

  const SUITE_LABELS: Record<string, string> = {
    propiq: 'PropIQ',
    content: 'Content Suite',
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0e0e16] border-l border-slate-800 z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Deployment Agent</span>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 1 && (
              <button
                onClick={resetDrawer}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Start over
              </button>
            )}
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="bg-slate-800 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm text-slate-100">
                  {msg.content}
                </div>
              ) : (
                <div className="flex items-start gap-2.5 max-w-[90%]">
                  <div className="w-6 h-6 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cpu className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-200 leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Deploy success state */}
          {deployedAll.length > 0 && (
            <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl px-4 py-4 space-y-2">
              {deployedAll.map((op, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-300">
                    {op.name ?? SUITE_LABELS[op.suite_id] ?? op.suite_id} deployed
                  </p>
                </div>
              ))}
              <p className="text-xs text-slate-500 pt-1">Live on your dashboard.</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-slate-800">
          {deployed ? (
            <button
              onClick={() => { resetDrawer(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              <Zap className="w-4 h-4" />
              View Dashboard
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Tell me about your business…"
                disabled={loading}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-700/60 transition-colors"
              />
              <button
                onClick={() => void send()}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
