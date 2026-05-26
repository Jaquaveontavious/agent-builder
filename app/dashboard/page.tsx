import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { Bot, Plus, Play, Zap, Crown, LogOut, LayoutGrid, Star } from 'lucide-react'
import type { Agent, UserSubscription } from '@/lib/types'
import { FREE_AGENT_LIMIT, FREE_RUN_LIMIT, stripe } from '@/lib/stripe'
import { CATEGORIES, getPopularTemplates } from '@/lib/templates'
import UpgradeButton from '@/components/UpgradeButton'

const TOOL_COLORS: Record<string, string> = {
  web_search:     'bg-blue-950 text-blue-300 border-blue-800',
  code_execution: 'bg-amber-950 text-amber-300 border-amber-800',
  file_read:      'bg-emerald-950 text-emerald-300 border-emerald-800',
  file_write:     'bg-teal-950 text-teal-300 border-teal-800',
  http_request:   'bg-pink-950 text-pink-300 border-pink-800',
}

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
        // Reflect the change locally so the page renders correctly
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
    <div className="min-h-screen bg-[#080810] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-400" />
            <span className="font-bold text-lg">AgentForge</span>
          </Link>

          <div className="flex items-center gap-4">
            {isPro ? (
              <span className="flex items-center gap-1.5 bg-violet-950 border border-violet-700 text-violet-300 text-xs px-3 py-1 rounded-full">
                <Crown className="w-3 h-3" /> Pro
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
          <div className="bg-violet-950/60 border border-violet-700 rounded-xl px-6 py-4 mb-8 flex items-center gap-3">
            <Crown className="w-5 h-5 text-violet-400" />
            <p className="text-violet-200 font-medium">
              Welcome to Pro! Unlimited agents and runs are now unlocked.
            </p>
          </div>
        )}

        {/* Usage bar (free only) */}
        {!isPro && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-6 py-4 mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex gap-8">
              <div>
                <div className="text-xs text-slate-500 mb-1">Agents</div>
                <div className="text-sm font-semibold">{agentCount} / {FREE_AGENT_LIMIT}</div>
                <div className="w-24 h-1 bg-slate-700 rounded-full mt-1.5">
                  <div
                    className="h-1 bg-violet-500 rounded-full transition-all"
                    style={{ width: `${Math.min((agentCount / FREE_AGENT_LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Runs this month</div>
                <div className="text-sm font-semibold">{runsUsed} / {FREE_RUN_LIMIT}</div>
                <div className="w-24 h-1 bg-slate-700 rounded-full mt-1.5">
                  <div
                    className="h-1 bg-violet-500 rounded-full transition-all"
                    style={{ width: `${Math.min((runsUsed / FREE_RUN_LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <UpgradeButton label="Upgrade for unlimited" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1" />
          </div>
        )}

        {/* Agents header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Your Agents</h1>
            <Link href="/agents/templates" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
              <LayoutGrid className="w-3.5 h-3.5" /> Templates
            </Link>
          </div>
          {atAgentLimit ? (
            <UpgradeButton label="Upgrade for more agents" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" />
          ) : (
            <Link
              href="/agents/new"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New agent
            </Link>
          )}
        </div>

        {/* Empty state */}
        {typedAgents.length === 0 && (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
            <Bot className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No agents yet</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Describe what you need and we'll build your first agent.
            </p>
            <Link
              href="/agents/new"
              className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Build your first agent
            </Link>
          </div>
        )}

        {/* Template gallery strip — shown when user has no agents OR always below */}
        {typedAgents.length === 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h2 className="font-bold">Start with a template</h2>
              </div>
              <Link href="/agents/templates" className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <LayoutGrid className="w-3.5 h-3.5" /> Browse all {'>'}
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

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {typedAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-violet-800/60 transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-950 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{agent.name}</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    agent.status === 'active'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {agent.status}
                </span>
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
                className="flex items-center justify-center gap-2 bg-slate-800 group-hover:bg-violet-600 text-slate-300 group-hover:text-white py-2 rounded-lg text-sm font-medium transition-all"
              >
                <Play className="w-3.5 h-3.5" /> Run agent
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
