import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import type { Agent } from '@/lib/types'

export async function GET() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()
  const { data: agents } = await service
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return Response.json({ agents: (agents ?? []) as Agent[] })
}
