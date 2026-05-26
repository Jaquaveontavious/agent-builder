import { NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL, AGENT_FACTORY_META_PROMPT } from '@/lib/anthropic'
import { FREE_AGENT_LIMIT } from '@/lib/stripe'
import type { AgentConfig } from '@/lib/types'

export async function POST(req: Request) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { description?: string }
  const description = body.description?.trim()

  if (!description || description.length < 10) {
    return NextResponse.json({ error: 'Description must be at least 10 characters.' }, { status: 400 })
  }

  // ── Check plan limits ─────────────────────────────────────────────────────
  const service = createServiceClient()

  const { data: sub } = await service
    .from('user_subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.plan === 'free') {
    const { count } = await service
      .from('agents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= FREE_AGENT_LIMIT) {
      return NextResponse.json(
        {
          error: 'Free plan limit reached. Upgrade to Pro to create more agents.',
          code: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      )
    }
  }

  // ── Generate agent config via Claude ──────────────────────────────────────
  let config: AgentConfig
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${AGENT_FACTORY_META_PROMPT}\n\nUser description: ${description}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim()
    config = JSON.parse(cleaned) as AgentConfig
  } catch (err) {
    console.error('Agent config generation failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate agent config. Please try again.' },
      { status: 500 }
    )
  }

  // ── Validate tools ────────────────────────────────────────────────────────
  const VALID_TOOLS = ['web_search', 'code_execution', 'file_read', 'file_write', 'http_request']
  const tools = (config.tools ?? []).filter((t) => VALID_TOOLS.includes(t))

  // ── Persist to Supabase ───────────────────────────────────────────────────
  const { data: agent, error: dbError } = await service
    .from('agents')
    .insert({
      user_id: user.id,
      name: config.name ?? 'Unnamed Agent',
      description,
      system_prompt: config.system_prompt ?? '',
      tools,
      status: 'active',
      suggested_use_cases: config.suggested_use_cases ?? [],
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB insert failed:', dbError)
    return NextResponse.json({ error: 'Failed to save agent.' }, { status: 500 })
  }

  return NextResponse.json({ agent })
}
