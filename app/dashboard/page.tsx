import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import {
  Cpu, Building2, ImageIcon, BarChart3, MessageSquare, Shield,
} from 'lucide-react'
import UpgradeButton from '@/components/UpgradeButton'
import LogoutButton from '@/components/LogoutButton'
import { stripe } from '@/lib/stripe'
import type { UserSubscription } from '@/lib/types'
import DashboardClient from './DashboardClient'

const SUITE_CATALOG = [
  {
    id: 'propiq',
    name: 'PropIQ',
    description: 'Deal finding, comp pulling, underwriting, and lead nurture for real estate wholesalers.',
    icon: 'building2' as const,
    href: '/dashboard/suite/propiq',
  },
  {
    id: 'content',
    name: 'Content Suite',
    description: 'Upload photos and get AI-generated captions for Instagram, Facebook, TikTok, and Google Business.',
    icon: 'image' as const,
    href: '/dashboard/suite/content',
  },
]

const COMING_SOON = [
  { name: 'Analytics Suite', icon: 'chart' as const, description: 'Automated reporting and business intelligence.' },
  { name: 'Communications Suite', icon: 'message' as const, description: 'Outreach, follow-ups, and email sequences.' },
]

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

  const { data: sub } = await service
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let subscription = sub as UserSubscription | null

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
          .update({ plan: 'pro', stripe_subscription_id: activeSub.id, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
        if (subscription) {
          subscription = { ...subscription, plan: 'pro', stripe_subscription_id: activeSub.id }
        }
      }
    }
  }

  const isPro = subscription?.plan === 'pro'

  // Load custom operatives
  let customOperatives: { id: string; name: string; suite_id: string; config: { description?: string } }[] = []
  try {
    const { data: ops } = await service
      .from('operatives')
      .select('id, name, suite_id, config')
      .eq('user_id', user.id)
      .eq('suite_id', 'custom')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    customOperatives = (ops ?? []) as typeof customOperatives
  } catch {
    // table may not exist yet
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Iron Operative</span>
          </Link>

          <div className="flex items-center gap-4">
            {isPro ? (
              <span className="flex items-center gap-1.5 bg-blue-950 border border-blue-700 text-blue-300 text-xs px-3 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Pro
              </span>
            ) : (
              <UpgradeButton />
            )}
            <span className="text-slate-500 text-sm hidden sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <DashboardClient
        upgraded={upgraded}
        isPro={isPro}
        suiteCatalog={SUITE_CATALOG}
        comingSoon={COMING_SOON}
        initialCustomOperatives={customOperatives}
      />
    </div>
  )
}
