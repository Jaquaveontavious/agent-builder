'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, Crosshair, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import type { Agent } from '@/lib/types'

const TOOL_COLORS: Record<string, string> = {
  web_search:     'bg-blue-950 text-blue-300 border-blue-800',
  code_execution: 'bg-amber-950 text-amber-300 border-amber-800',
  file_read:      'bg-emerald-950 text-emerald-300 border-emerald-800',
  file_write:     'bg-teal-950 text-teal-300 border-teal-800',
  http_request:   'bg-pink-950 text-pink-300 border-pink-800',
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(agent.name)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleRename() {
    if (!name.trim() || name === agent.name) { setEditing(false); return }
    setSaving(true)
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      router.refresh()
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-red-800/40 transition-all group flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-red-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <Crosshair className="w-4 h-4 text-red-400" />
          </div>
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleRename(); if (e.key === 'Escape') setEditing(false) }}
                className="flex-1 bg-slate-800 text-white text-sm px-2 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-red-500 min-w-0"
              />
              <button onClick={() => void handleRename()} disabled={saving} className="text-emerald-400 hover:text-emerald-300 p-0.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setEditing(false); setName(agent.name) }} className="text-slate-500 hover:text-slate-300 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-sm leading-tight truncate">{name}</h3>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={() => void handleDelete()} disabled={deleting} className="text-red-400 hover:text-red-300 p-1 rounded text-xs font-medium">
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-slate-500 hover:text-slate-300 p-1 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
        {agent.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.tools.map((tool) => (
          <span
            key={tool}
            className={`text-xs px-2 py-0.5 rounded border ${TOOL_COLORS[tool] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}
          >
            {tool.replace('_', ' ')}
          </span>
        ))}
      </div>

      <Link
        href={`/agents/${agent.id}`}
        className="flex items-center justify-center gap-2 bg-slate-800 group-hover:bg-red-600 text-slate-300 group-hover:text-white py-2 rounded-lg text-sm font-medium transition-all"
      >
        <Play className="w-3.5 h-3.5" /> Deploy
      </Link>
    </div>
  )
}
