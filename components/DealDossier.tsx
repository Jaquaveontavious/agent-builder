'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Calculator,
  Mail,
  Users,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react'
import type { DossierSection, DossierEvent, PropertyInput } from '@/app/api/propiq/dossier/route'

interface SectionState {
  content: string
  status: 'idle' | 'running' | 'done' | 'error'
  open: boolean
}

const SECTION_META: Record<DossierSection, { label: string; icon: React.ReactNode; color: string; border: string; bg: string }> = {
  underwriter: {
    label: 'Underwriting Report',
    icon: <Calculator className="w-4 h-4" />,
    color: 'text-emerald-400',
    border: 'border-emerald-800/50',
    bg: 'bg-emerald-950/20',
  },
  offer: {
    label: 'Offer Letter',
    icon: <Mail className="w-4 h-4" />,
    color: 'text-violet-400',
    border: 'border-violet-800/50',
    bg: 'bg-violet-950/20',
  },
  nurture: {
    label: 'Lead Nurture Sequence',
    icon: <Users className="w-4 h-4" />,
    color: 'text-rose-400',
    border: 'border-rose-800/50',
    bg: 'bg-rose-950/20',
  },
}

const SECTIONS: DossierSection[] = ['underwriter', 'offer', 'nurture']

interface Props {
  property: PropertyInput | null
  onClose: () => void
}

export default function DealDossier({ property, onClose }: Props) {
  const [sections, setSections] = useState<Record<DossierSection, SectionState>>({
    underwriter: { content: '', status: 'idle', open: true },
    offer: { content: '', status: 'idle', open: true },
    nurture: { content: '', status: 'idle', open: true },
  })
  const [overallDone, setOverallDone] = useState(false)
  const [copied, setCopied] = useState<DossierSection | 'all' | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const hasRun = useRef(false)

  // Reset and run when property changes
  useEffect(() => {
    if (!property) return
    hasRun.current = false
    setSections({
      underwriter: { content: '', status: 'idle', open: true },
      offer: { content: '', status: 'idle', open: true },
      nurture: { content: '', status: 'idle', open: true },
    })
    setOverallDone(false)
    void runDossier(property)
  }, [property])

  async function runDossier(prop: PropertyInput) {
    if (hasRun.current) return
    hasRun.current = true

    try {
      const res = await fetch('/api/propiq/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prop),
      })

      if (!res.ok) return

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
          try {
            const ev = JSON.parse(line.slice(6)) as DossierEvent

            if (ev.type === 'section_start') {
              setSections(prev => ({
                ...prev,
                [ev.section]: { ...prev[ev.section], status: 'running' },
              }))
            } else if (ev.type === 'section_text') {
              setSections(prev => ({
                ...prev,
                [ev.section]: {
                  ...prev[ev.section],
                  content: prev[ev.section].content + ev.content,
                },
              }))
            } else if (ev.type === 'section_done') {
              setSections(prev => ({
                ...prev,
                [ev.section]: { ...prev[ev.section], status: 'done' },
              }))
            } else if (ev.type === 'done') {
              setOverallDone(true)
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      // Connection error — mark all running as error
      setSections(prev => {
        const updated = { ...prev }
        for (const s of SECTIONS) {
          if (updated[s].status === 'running') {
            updated[s] = { ...updated[s], status: 'error' }
          }
        }
        return updated
      })
    }
  }

  async function copySection(section: DossierSection) {
    await navigator.clipboard.writeText(sections[section].content)
    setCopied(section)
    setTimeout(() => setCopied(null), 2000)
  }

  async function copyAll() {
    if (!property) return
    const full = SECTIONS
      .map(s => `# ${SECTION_META[s].label}\n\n${sections[s].content}`)
      .join('\n\n---\n\n')
    const header = `DEAL DOSSIER — ${property.address}\n\n`
    await navigator.clipboard.writeText(header + full)
    setCopied('all')
    setTimeout(() => setCopied(null), 2000)
  }

  function toggleSection(section: DossierSection) {
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], open: !prev[section].open },
    }))
  }

  if (!property) return null

  const allDone = SECTIONS.every(s => sections[s].status === 'done')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — bottom sheet on mobile, right panel on desktop */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 h-[88vh] rounded-t-2xl
                   lg:bottom-auto lg:top-0 lg:left-auto lg:right-0 lg:h-full lg:w-full lg:max-w-xl lg:rounded-none
                   bg-[#0a0a0f] border-t border-slate-800 lg:border-t-0 lg:border-l
                   z-50 flex flex-col shadow-2xl"
      >
        {/* Mobile drag handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Drawer header */}
        <div className="flex-shrink-0 border-b border-slate-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm">Deal Dossier</div>
                <div className="text-slate-500 text-xs truncate">{property.address}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {allDone && (
                <button
                  onClick={() => void copyAll()}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  {copied === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'all' ? 'Copied!' : 'Copy All'}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors p-2 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Property summary strip */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Price', value: property.price },
              { label: 'ARV', value: property.arv },
              { label: 'Upside', value: property.upside },
              { label: 'DOM', value: property.daysOnMarket + ' days' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900 rounded-lg px-2 py-1.5 text-center">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {SECTIONS.map((section) => {
            const meta = SECTION_META[section]
            const state = sections[section]

            return (
              <div key={section} className={`border-b border-slate-800/60`}>
                {/* Section header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSection(section)}
                  onKeyDown={(e) => e.key === 'Enter' && toggleSection(section)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-900/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={meta.color}>{meta.icon}</span>
                    <span className="text-sm font-semibold">{meta.label}</span>
                    {state.status === 'running' && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    )}
                    {state.status === 'done' && (
                      <span className="text-[10px] text-emerald-500 font-medium">Done</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {state.status === 'done' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); void copySection(section) }}
                        className="text-slate-600 hover:text-slate-400 transition-colors p-2"
                      >
                        {copied === section
                          ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                    {state.open
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                    }
                  </div>
                </div>

                {/* Section content */}
                {state.open && (
                  <div className={`mx-4 mb-4 rounded-xl border ${meta.border} ${meta.bg} p-4`}>
                    {state.status === 'idle' && (
                      <div className="flex items-center gap-2 text-slate-600 text-xs py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Waiting to start…
                      </div>
                    )}
                    {(state.status === 'running' || state.status === 'done') && (
                      <>
                        {state.content ? (
                          <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                            {state.content}
                            {state.status === 'running' && (
                              <span className="inline-block w-1.5 h-3.5 bg-slate-400 animate-pulse ml-0.5 align-middle" />
                            )}
                          </pre>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Agent working…
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {allDone && (
          <div className="flex-shrink-0 border-t border-slate-800 px-5 py-3 bg-slate-900/40">
            <p className="text-xs text-slate-500 text-center">
              All three agents complete — dossier ready to use
            </p>
          </div>
        )}
      </div>
    </>
  )
}
