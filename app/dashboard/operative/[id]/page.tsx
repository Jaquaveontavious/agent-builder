import { redirect } from 'next/navigation'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import OperativeChat from './OperativeChat'

interface OperativeConfig {
  system_prompt?: string
  description?: string
}

interface Operative {
  id: string
  name: string
  suite_id: string
  status: string
  config: OperativeConfig
  created_at: string
  memory?: string
}

export default async function OperativePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()
  const [{ data, error }, { data: sub }] = await Promise.all([
    service
      .from('operatives')
      .select('id, name, suite_id, status, config, created_at, memory')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    service
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single(),
  ])

  if (error || !data) redirect('/dashboard')

  const operative = data as Operative
  const isPro = sub?.plan === 'pro'

  return <OperativeChat operative={operative} isPro={isPro} />
}
