import { NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: sub } = await service
    .from('user_subscriptions')
    .select('plan, runs_this_month, month_reset_at, trial_searches_used')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ subscription: sub ?? { plan: 'free', runs_this_month: 0, trial_searches_used: 0 } })
}
