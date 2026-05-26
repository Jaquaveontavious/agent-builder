import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { Plus, Play, Shield, LogOut, LayoutGrid, Star, Crosshair } from 'lucide-react'
import type { Agent, UserSubscription } from '@/lib/types'
import { FREE_AGENT_LIMIT, FREE_RUN_LIMIT, stripe } from '@/lib/stripe'
import { CATEGORIES, getPopularTemplates } from '@/lib/templates'
import UpgradeButton from '@/components/UpgradeButton'
import AgentCard from '@/components/AgentCard'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const { upgraded } = await searchParams

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const [{ data: agents }, { data: sub }] = await Promise.all([
    service.from('agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    service.from('user_subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  const typedAgents = (agents ?? []) as Agent[]
  let subscription = sub as UserSubscription | null

  // When the user lands here after a successful checkout, the webhook may not
  // have fired yet. Verify directly with Stripe and sync the DB if needed.
  if (upgraded && subscription?.plan !== 'pro') {
    const customerId = subscription?.stripe_customer_id
    if (customerId) {
      const stripeSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      })
      if (stripeSubs.data.length > 0) {
        const activeSub = stripeSubs.data[0]
        await service
          .from('user_subscriptions')
          .update({
            plan: 'pro',
            stripe_subscription_id: activeSub.id,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
        if (subscription) {
          subscription = { ...subscription, plan: 'pro', stripe_subscription_id: activeSub.id }
        }
      }
    }
  }

  const isPro = subscription?.plan === 'pro'
  const agentCount = typedAgents.length
  const atAgentLimit = !isPro && agentCount >= FREE_AGENT_LIMIT
  const runsUsed = subscription?.runs_this_month ?? 0

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 metal-grid">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 bg-[#060608]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-red-500" />
            <span className="font-bold text-lg">Iron Operative</span>
          </Link>

          <div className="flex items-center gap-4">
            {isPro ? (
              <span className="flex items-center gap-1.5 bg-red-950 border border-red-700 text-red-300 text-xs px-3 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Commander
              </span>
            ) : (
              <UpgradeButton />
            )}
            <span className="text-slate-400 text-sm hidden sm:block">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-slate-500 hover:text-slate-300 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Upgrade success banner */}
        {upgraded && (
          <div className="bg-red-950/60 border border-red-700 rounded-xl px-6 py-4 mb-8 flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-400" />
            <p className="text-red-200 font-medium">
              Commander status achieved. Unlimited operatives and missions are now at your disposal.
            </p>
          </div>
        )}

        {/* Usage bar (free only) */}
        {!isPro && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-6 py-4 mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex gap-8">
              <div>
                <div className="text-xs text-slate-500 mb-1">Operatives</div>
                <div className="text-sm font-semibold">{agentCount} / {FREE_AGENT_LIMIT}</div>
                <div className="w-24 h-1 bg-slate-700 rounded-full mt-1.5">
                  <div
                    className="h-1 bg-red-500 rounded-full transition-all"
                    style={{ width: `${Math.min((agentCount / FREE_AGENT_LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Missions this month</div>
                <div className="text-sm font-semibold">{runsUsed} / {FREE_RUN_LIMIT}</div>
                <div className="w-24 h-1 bg-slate-700 rounded-full mt-1.5">
                  <div
                    className="h-1 bg-red-500 rounded-full transition-all"
                    style={{ width: `${Math.min((runsUsed / FREE_RUN_LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <UpgradeButton label="Go Commander — unlimited everything" className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1" />
          </div>
        )}

        {/* Operatives header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Your Operatives</h1>
            <Link href="/agents/templates" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors">
              <LayoutGrid className="w-3.5 h-3.5" /> Arsenal
            </Link>
          </div>
          {atAgentLimit ? (
            <UpgradeButton label="Go Commander for more operatives" className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" />
          ) : (
            <Link
              href="/agents/new"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Recruit operative
            </Link>
          )}
        </div>

        {/* Empty state */}
        {typedAgents.length === 0 && (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
            <Crosshair className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No operatives recruited</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Your squad is empty. Brief us on the mission and we'll build your first operative.
            </p>
            <Link
              href="/agents/new"
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Recruit your first operative
            </Link>
          </div>
        )}

        {/* Arsenal strip — shown when user has no operatives */}
        {typedAgents.length === 0 && (
          <div className="mb-10 mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h2 className="font-bold">Start from the Arsenal</h2>
              </div>
              <Link href="/agents/templates" className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                <LayoutGrid className="w-3.5 h-3.5" /> Full Arsenal {'>'}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {getPopularTemplates().map((template) => {
                const cat = CATEGORIES.find((c) => c.id === template.category)
                return (
                  <Link
                    key={template.id}
                    href={`/agents/new?template=${template.id}`}
                    className={`flex items-center gap-3 bg-slate-900/60 border ${cat?.border ?? 'border-slate-800'} ${cat?.glow ?? ''} rounded-xl p-3.5 transition-all hover:bg-slate-900/90 hover:-translate-y-0.5`}
                  >
                    <span className="text-xl flex-shrink-0">{template.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white leading-snug truncate">{template.name}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${cat?.accent ?? 'text-slate-400'}`}>{cat?.name}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Operative grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {typedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </main>
    </div>
  )
}
