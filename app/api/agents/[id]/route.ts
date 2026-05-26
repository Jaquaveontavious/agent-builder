import { NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const [{ data: agent }, { data: runs }] = await Promise.all([
    service
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    service
      .from('runs')
      .select('*')
      .eq('agent_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ agent, runs: runs ?? [] })
}
