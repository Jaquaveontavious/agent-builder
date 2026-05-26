'use client'

import { useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'

export default function UpgradeButton({ label = 'Go Commander', className }: { label?: string; className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      alert('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? 'flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium'}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
      {loading ? 'Redirecting…' : label}
    </button>
  )
}
