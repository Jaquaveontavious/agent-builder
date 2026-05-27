import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import type { PanelConfig, Workspace } from '@/lib/types'

export async function GET() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()
  const { data: workspaces } = await service
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return Response.json({ workspaces: (workspaces ?? []) as Workspace[] })
}

export async function POST(req: Request) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    name?: string
    description?: string
    panels?: PanelConfig[]
  }

  if (!body.name?.trim()) return new Response('Name is required.', { status: 400 })

  const service = createServiceClient()

  const { data: workspace, error: wsErr } = await service
    .from('workspaces')
    .insert({ user_id: user.id, name: body.name.trim(), description: body.description?.trim() || null })
    .select()
    .single()

  if (wsErr || !workspace) {
    return new Response(wsErr?.message ?? 'Failed to create workspace.', { status: 500 })
  }

  if (body.panels && body.panels.length > 0) {
    const panelRows = body.panels.map((p, i) => ({
      workspace_id: workspace.id,
      user_id: user.id,
      agent_id: p.agent_id || null,
      title: p.title,
      panel_type: p.panel_type,
      size: p.size,
      position: p.position ?? i,
      auto_prompt: p.auto_prompt?.trim() || null,
    }))

    const { error: panelErr } = await service.from('panels').insert(panelRows)
    if (panelErr) {
      // Workspace created — don't fail hard, just log
      console.error('Panel insert error:', panelErr.message)
    }
  }

  return Response.json({ workspace: workspace as Workspace })
}
