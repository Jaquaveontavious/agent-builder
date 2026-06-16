import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { getTemplateById } from '@/lib/operative-templates'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      template_id?: string
      name?: string
      description?: string
      system_prompt?: string
      category?: string
    }

    let name: string
    let description: string
    let system_prompt: string

    if (body.template_id) {
      const template = getTemplateById(body.template_id)
      if (!template) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
      }
      name = template.name
      description = template.description
      system_prompt = template.system_prompt
    } else if (body.name && body.system_prompt) {
      name = body.name
      description = body.description ?? ''
      system_prompt = body.system_prompt
    } else {
      return NextResponse.json({ success: false, error: 'template_id or name+system_prompt required' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: sub } = await service
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (sub?.plan !== 'pro') {
      return NextResponse.json(
        { success: false, error: 'upgrade_required', message: 'Template deploys require a Pro subscription.' },
        { status: 403 }
      )
    }

    const { data, error } = await service
      .from('operatives')
      .insert({
        user_id: user.id,
        suite_id: 'custom',
        agent_id: `custom_${Date.now()}`,
        name,
        config: { system_prompt, description },
        status: 'active',
      })
      .select('id, name, suite_id, config')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
