import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import type { Panel, PanelConfig } from '@/lib/types'

export async function POST(req: Request) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as PanelConfig & { workspace_id: string }
  if (!body.workspace_id) return new Response('workspace_id required.', { status: 400 })
  if (!body.title?.trim()) return new Response('Title required.', { status: 400 })

  const service = createServiceClient()

  const { data: panel, error } = await service
    .from('panels')
    .insert({
      workspace_id: body.workspace_id,
      user_id: user.id,
      agent_id: body.agent_id || null,
      title: body.title.trim(),
      panel_type: body.panel_type ?? 'text',
      size: body.size ?? 'medium',
      position: body.position ?? 0,
      auto_prompt: body.auto_prompt?.trim() || null,
    })
    .select()
    .single()

  if (error || !panel) return new Response(error?.message ?? 'Failed to create panel.', { status: 500 })

  return Response.json({ panel: panel as Panel })
}
