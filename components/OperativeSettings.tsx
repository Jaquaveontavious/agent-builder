'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Pencil, Trash2, Brain, Check, Loader2, AlertTriangle,
} from 'lucide-react'

interface OperativeSettingsProps {
  operativeId: string
  operativeName: string
  onClose: () => void
  onRenamed: (name: string) => void
}

interface MemoryData {
  memory: string
  run_count: number
  created_at: string
  name: string
}

export default function OperativeSettings({
  operativeId,
  operativeName,
  onClose,
  onRenamed,
}: OperativeSettingsProps) {
  const router = useRouter()
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState(operativeName)
  const [renaming, setRenaming] = useState(false)
  const [clearingMemory, setClearingMemory] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/operative/${operativeId}/memory`)
      .then((r) => r.json())
      .then((d: { success: boolean; data?: MemoryData }) => {
        if (d.success) setMemoryData(d.data ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [operativeId])

  async function rename() {
    if (!name.trim() || name === operativeName) return
    setRenaming(true)
    setError('')
    try {
      const res = await fetch(`/api/operative/${operativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const d = await res.json() as { success: boolean; error?: string }
      if (!d.success) throw new Error(d.error)
      onRenamed(name.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed')
    } finally {
      setRenaming(false)
    }
  }

  async function clearMemory() {
    setClearingMemory(true)
    setError('')
    try {
      await fetch(`/api/operative/${operativeId}/memory`, { method: 'DELETE' })
      setMemoryData((prev) => prev ? { ...prev, memory: '' } : prev)
    } catch {
      setError('Failed to clear memory')
    } finally {
      setClearingMemory(false)
    }
  }

  async function deleteOperative() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/operative/${operativeId}`, { method: 'DELETE' })
      const d = await res.json() as { success: boolean; error?: string }
      if (!d.success) throw new Error(d.error)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e0e16] border border-slate-800 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-bold text-base">Operative Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Stats */}
          {!loading && memoryData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                <div className="text-xs text-slate-500 mb-1">Total runs</div>
                <div className="text-xl font-bold">{memoryData.run_count ?? 0}</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                <div className="text-xs text-slate-500 mb-1">Deployed</div>
                <div className="text-sm font-semibold text-slate-300">
                  {new Date(memoryData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          {/* Rename */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void rename()}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-700/60 transition-colors"
              />
              <button
                onClick={() => void rename()}
                disabled={renaming || !name.trim() || name === operativeName}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {renaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Memory */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                <label className="text-xs text-slate-500 uppercase tracking-widest">Memory</label>
              </div>
              {memoryData?.memory && (
                <button
                  onClick={() => void clearMemory()}
                  disabled={clearingMemory}
                  className="text-xs text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  {clearingMemory ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Clear memory
                </button>
              )}
            </div>
            {loading ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-4 flex items-center gap-2 text-slate-600 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : memoryData?.memory ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                {memoryData.memory}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-4 text-xs text-slate-600 text-center">
                No memory yet. After your first conversation, this operative will remember key business details automatically.
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Delete */}
          <div className="border-t border-slate-800 pt-5">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete this operative
              </button>
            ) : (
              <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">This will permanently delete <strong>{operativeName}</strong> and all its memory. This cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void deleteOperative()}
                    disabled={deleting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
