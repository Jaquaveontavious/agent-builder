import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { Crosshair, LayoutDashboard, Plus, ArrowLeft, LogOut, Clock } from 'lucide-react'
import type { Workspace } from '@/lib/types'

export default async function WorkspaceListPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()
  const { data: workspaces } = await service
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const typed = (workspaces ?? []) as Workspace[]

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 metal-grid">
      <header className="border-b border-slate-800/60 px-6 py-4 bg-[#060608]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Crosshair className="w-5 h-5 text-red-500" />
              <span className="font-bold">Iron Operative</span>
            </Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4 text-red-400" />
              <span className="font-semibold">Workspaces</span>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-slate-500 hover:text-slate-300 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-red-400" />
              Your Workspaces
            </h1>
            <p className="text-slate-500 text-sm mt-1">Custom dashboards powered by your agents</p>
          </div>
          <Link
            href="/workspace/new"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Workspace
          </Link>
        </div>

        {typed.length === 0 && (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
            <LayoutDashboard className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No workspaces yet</h3>
            <p className="text-slate-600 mb-6 text-sm max-w-sm mx-auto">
              Build a custom dashboard from your agents — stat cards, tables, lists, and live queries.
            </p>
            <Link
              href="/workspace/new"
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Build your first workspace
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {typed.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspace/${ws.id}`}
              className="group bg-slate-900/60 border border-slate-800 hover:border-red-800/60 rounded-xl p-5 transition-all hover:bg-slate-900/90"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <h3 className="font-semibold group-hover:text-red-300 transition-colors">{ws.name}</h3>
                </div>
              </div>
              {ws.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{ws.description}</p>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                <Clock className="w-3 h-3" />
                {new Date(ws.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
