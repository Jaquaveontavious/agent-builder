'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ImageIcon, Upload, Loader2, Copy, Check,
  Globe, Pencil, X, Clock, Hash, Users,
} from 'lucide-react'

interface PlatformCaptions {
  instagram: string
  facebook: string
  tiktok: string
  google_business: string
}

interface MediaItem {
  id: string
  file_url: string
  platform_captions: PlatformCaptions | null
  created_at: string
}

interface UploadedFile {
  file: File
  preview: string
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
}

const PLATFORMS: { key: keyof PlatformCaptions; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: <Hash className="w-4 h-4" />, color: 'text-pink-400' },
  { key: 'facebook', label: 'Facebook', icon: <Users className="w-4 h-4" />, color: 'text-blue-400' },
  { key: 'tiktok', label: 'TikTok', icon: <span className="text-sm font-bold leading-none">T</span>, color: 'text-slate-200' },
  { key: 'google_business', label: 'Google Business', icon: <Globe className="w-4 h-4" />, color: 'text-emerald-400' },
]

function CaptionCard({
  platform,
  caption,
  onEdit,
}: {
  platform: typeof PLATFORMS[number]
  caption: string
  onEdit: (val: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(caption)

  function handleCopy() {
    void navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function saveEdit() {
    onEdit(draft)
    setEditing(false)
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 font-semibold text-sm ${platform.color}`}>
          {platform.icon}
          {platform.label}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setDraft(caption); setEditing((v) => !v) }}
            className="text-slate-600 hover:text-slate-400 transition-colors"
          >
            {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleCopy} className="text-slate-600 hover:text-slate-400 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 resize-none focus:outline-none focus:border-blue-700/60"
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
            >
              Save
            </button>
            <button
              onClick={() => { setDraft(caption); setEditing(false) }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap flex-1">{draft}</p>
      )}
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getMediaType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (file.type === 'image/png') return 'image/png'
  if (file.type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

export default function ContentSuitePage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [context, setContext] = useState('')
  const [captions, setCaptions] = useState<PlatformCaptions | null>(null)
  const [editedCaptions, setEditedCaptions] = useState<PlatformCaptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<MediaItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/content/media-library')
      .then((r) => r.json())
      .then((d: { success: boolean; data?: MediaItem[] }) => {
        if (d.success) setMediaLibrary(d.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLibraryLoading(false))
  }, [])

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const preview = URL.createObjectURL(file)
    const base64 = await toBase64(file)
    const mediaType = getMediaType(file)
    setUploadedFile({ file, preview, base64, mediaType })
    setCaptions(null)
    setEditedCaptions(null)
    setSelectedLibraryItem(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
  }

  async function generate() {
    if (!uploadedFile) return
    setLoading(true)
    setError('')
    setCaptions(null)
    setEditedCaptions(null)

    try {
      const res = await fetch('/api/content/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: uploadedFile.base64,
          image_media_type: uploadedFile.mediaType,
          context: context.trim() || undefined,
        }),
      })
      const data = await res.json() as { success: boolean; data?: { captions: PlatformCaptions }; error?: string }
      if (!data.success) throw new Error(data.error ?? 'Generation failed')
      setCaptions(data.data!.captions)
      setEditedCaptions(data.data!.captions)

      setMediaLibrary((prev) => {
        const newItem: MediaItem = {
          id: crypto.randomUUID(),
          file_url: uploadedFile.preview,
          platform_captions: data.data!.captions,
          created_at: new Date().toISOString(),
        }
        return [newItem, ...prev]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function updateCaption(platform: keyof PlatformCaptions, value: string) {
    setEditedCaptions((prev) => prev ? { ...prev, [platform]: value } : prev)
  }

  const activeCaptions = editedCaptions ?? captions

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-4 sm:px-6 py-4 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Content Suite</span>
            <span className="text-slate-500 text-xs block leading-none hidden sm:block">AI caption generator</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Upload zone */}
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] gap-4 ${
              dragging
                ? 'border-violet-500 bg-violet-950/20'
                : uploadedFile
                ? 'border-slate-700 bg-slate-900/40'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
            }`}
          >
            {uploadedFile ? (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 w-full">
                <img
                  src={uploadedFile.preview}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded-xl border border-slate-700 flex-shrink-0"
                />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{uploadedFile.file.name}</p>
                  <p className="text-xs text-slate-500">{(uploadedFile.file.size / 1024).toFixed(0)} KB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setCaptions(null); setEditedCaptions(null) }}
                    className="mt-1 text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 w-fit"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-600" />
                <div className="text-center">
                  <p className="text-slate-300 font-medium">Drop a photo here or click to upload</p>
                  <p className="text-slate-600 text-sm mt-1">JPG, PNG, or WebP</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {/* Context input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 uppercase tracking-widest">Context (optional)</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="What is this photo? Who is your audience? e.g. 'Finished bathroom remodel for a client in Austin'"
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-700/60 transition-colors"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={() => void generate()}
          disabled={!uploadedFile || loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-semibold transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating captions…
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4" />
              Generate Captions
            </>
          )}
        </button>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Caption results */}
        {activeCaptions && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Generated Captions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLATFORMS.map((platform) => (
                <CaptionCard
                  key={platform.key}
                  platform={platform}
                  caption={activeCaptions[platform.key]}
                  onEdit={(val) => updateCaption(platform.key, val)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Media library */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Media Library</h2>

          {libraryLoading && (
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          {!libraryLoading && mediaLibrary.length === 0 && (
            <div className="border border-dashed border-slate-800 rounded-2xl py-12 text-center">
              <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No photos yet. Upload one above to get started.</p>
            </div>
          )}

          {mediaLibrary.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mediaLibrary.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedLibraryItem(selectedLibraryItem?.id === item.id ? null : item)}
                  className={`relative group rounded-xl overflow-hidden border transition-all ${
                    selectedLibraryItem?.id === item.id
                      ? 'border-violet-500 ring-1 ring-violet-500/50'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={item.file_url}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    {item.platform_captions && (
                      <div className="mt-0.5">
                        <span className="text-[10px] text-emerald-400 font-medium">Captioned</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Library item caption viewer */}
          {selectedLibraryItem?.platform_captions && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Captions for selected photo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLATFORMS.map((platform) => (
                  <CaptionCard
                    key={platform.key}
                    platform={platform}
                    caption={selectedLibraryItem.platform_captions![platform.key]}
                    onEdit={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
