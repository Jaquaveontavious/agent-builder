import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import type { Grid, GridRun } from '@/lib/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()

  const [{ data: grid }, { data: runs }] = await Promise.all([
    service.from('grids').select('*').eq('id', id).eq('user_id', user.id).single(),
    service
      .from('grid_runs')
      .select('*')
      .eq('grid_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!grid) return new Response('Grid not found.', { status: 404 })

  return Response.json({ grid: grid as Grid, runs: (runs ?? []) as GridRun[] })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()
  const { error } = await service
    .from('grids')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return new Response('Failed to delete grid.', { status: 500 })
  return new Response(null, { status: 204 })
}
