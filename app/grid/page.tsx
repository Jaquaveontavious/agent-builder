import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { Crosshair, Network, Plus, Shield, Users, LogOut, ArrowLeft, Clock } from 'lucide-react'
import type { Grid, UserSubscription } from '@/lib/types'
import UpgradeButton from '@/components/UpgradeButton'

export default async function GridListPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const [{ data: grids }, { data: sub }] = await Promise.all([
    service
      .from('grids')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    service.from('user_subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  const typedGrids = (grids ?? []) as Grid[]
  const subscription = sub as UserSubscription | null
  const isPro = subscription?.plan === 'pro'

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
              <Network className="w-4 h-4 text-red-400" />
              <span className="font-semibold">The Grid</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isPro ? (
              <span className="flex items-center gap-1.5 bg-red-950 border border-red-700 text-red-300 text-xs px-3 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Pro
              </span>
            ) : (
              <UpgradeButton />
            )}
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-slate-500 hover:text-slate-300 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {!isPro && (
          <div className="bg-slate-900/60 border border-red-900/60 rounded-2xl px-8 py-10 mb-10 text-center">
            <Network className="w-12 h-12 text-red-500/60 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">The Grid — Pro Feature</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Orchestrate multiple agents working in parallel or sequentially to produce higher-quality output than any single agent.
            </p>
            <UpgradeButton label="Upgrade to Pro to unlock The Grid" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors" />
          </div>
        )}

        {isPro && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Network className="w-6 h-6 text-red-400" />
                Your Grids
              </h1>
              <Link
                href="/grid/new"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> New Grid
              </Link>
            </div>

            {typedGrids.length === 0 && (
              <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
                <Network className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No grids yet</h3>
                <p className="text-slate-600 mb-6 text-sm max-w-sm mx-auto">
                  A Grid connects multiple agents to tackle tasks too complex for a single agent.
                </p>
                <Link
                  href="/grid/new"
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Build your first Grid
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {typedGrids.map((grid) => (
                <Link
                  key={grid.id}
                  href={`/grid/${grid.id}`}
                  className="group bg-slate-900/60 border border-slate-800 hover:border-red-800/60 rounded-xl p-5 transition-all hover:bg-slate-900/90"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <h3 className="font-semibold group-hover:text-red-300 transition-colors">
                        {grid.name}
                      </h3>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3 h-3" />
                      {grid.member_agents.length}
                    </span>
                  </div>
                  {grid.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{grid.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {grid.member_agents.slice(0, 4).map((m) => (
                      <span
                        key={m.id}
                        className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md"
                      >
                        {m.name}
                      </span>
                    ))}
                    {grid.member_agents.length > 4 && (
                      <span className="text-xs text-slate-600">
                        +{grid.member_agents.length - 4} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-xs text-slate-600">
                    <Clock className="w-3 h-3" />
                    {new Date(grid.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
