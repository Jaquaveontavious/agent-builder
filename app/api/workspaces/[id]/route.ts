import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import type { Panel, Workspace } from '@/lib/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()

  const [{ data: workspace }, { data: panels }] = await Promise.all([
    service.from('workspaces').select('*').eq('id', id).eq('user_id', user.id).single(),
    service
      .from('panels')
      .select('*')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .order('position', { ascending: true }),
  ])

  if (!workspace) return new Response('Workspace not found.', { status: 404 })

  return Response.json({ workspace: workspace as Workspace, panels: (panels ?? []) as Panel[] })
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
    .from('workspaces')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return new Response('Failed to delete workspace.', { status: 500 })
  return new Response(null, { status: 204 })
}
