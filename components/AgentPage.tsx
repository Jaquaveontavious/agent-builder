'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, AlertCircle, Copy, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface AgentPageProps {
  title: string
  subtitle: string
  placeholder: string
  apiRoute: string
  icon: LucideIcon
  iconColor: string
  examples: string[]
}

export default function AgentPage({
  title,
  subtitle,
  placeholder,
  apiRoute,
  icon: Icon,
  iconColor,
  examples,
}: AgentPageProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (output) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  async function run(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')
    setOutput('')
    setLoading(true)

    try {
      const res = await fetch(apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })

      if (!res.ok) {
        setError(`Error ${res.status}`)
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6)) as { type: string; content?: string; message?: string }
            if (ev.type === 'text') {
              full += ev.content ?? ''
              setOutput(full)
            } else if (ev.type === 'error') {
              setError(ev.message ?? 'Unknown error')
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 sticky top-0 z-10 bg-[#060608]/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/hub" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Agent Suite
          </Link>
          <div className="flex items-center gap-2.5">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            <div>
              <span className="font-bold">{title}</span>
              <span className="text-slate-500 text-xs block leading-none">{subtitle}</span>
            </div>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Examples */}
        {!output && !loading && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-3">Try an example</p>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => void run(ex)}
                className="w-full text-left bg-slate-900/60 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-300 hover:text-white transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Output */}
        {(output || loading) && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
              <span className="text-xs text-slate-600">Output</span>
              {output && (
                <button
                  onClick={() => void copyOutput()}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="p-5">
              {loading && !output && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Working…
                </div>
              )}
              {output && (
                <pre className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {output}
                  {loading && <span className="cursor" />}
                </pre>
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
      <div className="sticky bottom-0 bg-[#060608]/95 backdrop-blur border-t border-slate-800/60 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 focus-within:border-slate-500 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void run() }}
              placeholder={placeholder}
              rows={2}
              disabled={loading}
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 text-sm resize-none focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-700">⌘+Enter to run</span>
              <button
                onClick={() => void run()}
                disabled={!input.trim() || loading}
                className={`flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-black px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${iconColor.replace('text-', 'bg-').replace('-400', '-500')} hover:opacity-90`}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5" />}
                {loading ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
