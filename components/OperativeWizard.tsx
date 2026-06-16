'use client'

import { useState } from 'react'
import { Cpu, ArrowRight, Loader2 } from 'lucide-react'

const TONE_OPTIONS = [
  { value: 'Professional and polished', label: 'Professional', sub: 'Formal, precise, corporate-ready' },
  { value: 'Friendly and approachable', label: 'Friendly', sub: 'Warm, conversational, personable' },
  { value: 'Direct and no-nonsense', label: 'Direct', sub: 'Short, confident, gets to the point' },
  { value: 'Premium and authoritative', label: 'Premium', sub: 'High-end, confident, commands respect' },
]

interface Props {
  operativeId: string
  operativeName: string
  onComplete: () => void
}

export default function OperativeWizard({ operativeId, operativeName, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [services, setServices] = useState('')
  const [tone, setTone] = useState('')
  const [saving, setSaving] = useState(false)

  async function finish() {
    if (!tone) return
    setSaving(true)

    const memory = `Business Name: ${businessName || 'Not specified'}
Services & Pricing: ${services || 'Not specified'}
Brand Voice: ${tone}`

    // Seed memory directly via a synthetic extract
    await fetch(`/api/operative/${operativeId}/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `My business is called ${businessName}. Here are my services and pricing: ${services}. My brand voice is ${tone}.`,
          },
          {
            role: 'assistant',
            content: `Got it. I've noted your business details, services, pricing, and brand voice. I'm ready to generate professional outputs tailored to ${businessName}.`,
          },
        ],
      }),
    }).catch(() => {})

    setSaving(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]/95 backdrop-blur z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-blue-500' : 'bg-slate-800'}`}
            />
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Setting up</p>
              <p className="font-bold text-base">{operativeName}</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-1">What's your business name?</h2>
                <p className="text-slate-500 text-sm">Your operative will use this on every quote, proposal, and email it generates.</p>
              </div>
              <input
                type="text"
                autoFocus
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && businessName.trim() && setStep(2)}
                placeholder="e.g. CleanPro Services, Johnson HVAC, Elite Landscapes…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-700/60 transition-colors"
              />
              <button
                onClick={() => setStep(2)}
                disabled={!businessName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onComplete} className="w-full text-xs text-slate-700 hover:text-slate-500 transition-colors py-1">
                Skip setup
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-1">What do you offer and at what price?</h2>
                <p className="text-slate-500 text-sm">Your operative bakes this in so every output has real numbers — not placeholders.</p>
              </div>
              <textarea
                autoFocus
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g. Driveway wash $150, House wash $250, Roof treatment $350. Commercial quoted by sq ft."
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-700/60 transition-colors resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!services.trim()}
                  className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button onClick={onComplete} className="w-full text-xs text-slate-700 hover:text-slate-500 transition-colors py-1">
                Skip setup
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-1">What's your brand voice?</h2>
                <p className="text-slate-500 text-sm">Every quote, email, and proposal will match this tone automatically.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTone(opt.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      tone === opt.value
                        ? 'border-blue-500 bg-blue-950/40 text-white'
                        : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => void finish()}
                  disabled={!tone || saving}
                  className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <>Launch operative <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-700 mt-4">
          You can update these details anytime in operative settings.
        </p>
      </div>
    </div>
  )
}
