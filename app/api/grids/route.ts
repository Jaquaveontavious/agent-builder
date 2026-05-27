import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import type { Grid, GridMember } from '@/lib/types'

export async function GET() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()
  const { data: grids } = await service
    .from('grids')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return Response.json({ grids: (grids ?? []) as Grid[] })
}

export async function POST(req: Request) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()

  const { data: sub } = await service
    .from('user_subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  if (sub?.plan !== 'pro') {
    return new Response('The Grid requires a Pro subscription.', { status: 403 })
  }

  const body = await req.json() as {
    name?: string
    description?: string
    member_agents?: GridMember[]
  }

  if (!body.name?.trim()) return new Response('Name is required.', { status: 400 })
  if (!body.member_agents || body.member_agents.length < 2) {
    return new Response('At least 2 agents are required.', { status: 400 })
  }

  const { data: grid, error } = await service
    .from('grids')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      member_agents: body.member_agents,
    })
    .select()
    .single()

  if (error || !grid) {
    console.error('Grid insert error:', JSON.stringify(error))
    return new Response(
      error ? `${error.code}: ${error.message} — ${error.details ?? ''}` : 'Insert returned no data.',
      { status: 500 }
    )
  }

  return Response.json({ grid: grid as Grid })
}
