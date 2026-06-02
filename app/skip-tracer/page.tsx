'use client'

import { useState } from 'react'
import { Search, Phone, Mail, MapPin, User, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { SkipTraceResult } from '@/app/api/propiq/skip-tracer/route'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export default function SkipTracerPage() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SkipTraceResult[] | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setResults(null)
    setError('')
    setNote('')

    try {
      const res = await fetch('/api/propiq/skip-tracer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), city: city.trim() || undefined, state: state || undefined }),
      })

      const data = await res.json() as { results?: SkipTraceResult[]; note?: string; error?: string }

      if (!res.ok || data.error) {
        setError(data.error ?? 'Lookup failed. Please try again.')
      } else {
        setResults(data.results ?? [])
        setNote(data.note ?? '')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-4 sm:px-6 py-4 bg-[#060608]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="text-slate-600 hover:text-slate-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight">Skip Tracer</span>
              <span className="text-slate-500 text-xs block leading-none hidden sm:block">Find owner contact info</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest mb-1.5 block">Owner Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest mb-1.5 block">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Memphis"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-widest mb-1.5 block">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="">Any</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Searching records…' : 'Find Contact Info'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-300 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* No results */}
        {results !== null && results.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <User className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            <p className="text-sm">{note || 'No records found. Try a different name or state.'}</p>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600 uppercase tracking-widest mb-2">
              {results.length} match{results.length !== 1 ? 'es' : ''} found
            </div>
            {results.map((r, i) => (
              <div key={i} className="bg-slate-900 border border-slate-700/60 rounded-xl p-5 space-y-4">
                {/* Name + age */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">{r.name}</div>
                    {r.age && <div className="text-xs text-slate-500">Age {r.age}</div>}
                  </div>
                </div>

                {/* Phone numbers */}
                {r.phones.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Phone Numbers</div>
                    <div className="space-y-1.5">
                      {r.phones.map((phone, j) => (
                        <a
                          key={j}
                          href={`tel:${phone}`}
                          className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2.5 transition-colors group"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-slate-200 group-hover:text-white font-medium">{phone}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emails */}
                {r.emails.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Email Addresses</div>
                    <div className="space-y-1.5">
                      {r.emails.map((email, j) => (
                        <a
                          key={j}
                          href={`mailto:${email}`}
                          className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2.5 transition-colors group"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-sm text-slate-200 group-hover:text-white truncate">{email}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current address */}
                {r.currentAddress && (
                  <div className="flex items-start gap-2.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-600" />
                    <span>{r.currentAddress}</span>
                  </div>
                )}
              </div>
            ))}

            <p className="text-xs text-slate-700 text-center pt-2">
              Data sourced from public records. Use responsibly and in compliance with applicable laws.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
