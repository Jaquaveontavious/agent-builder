import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'
import Anthropic from '@anthropic-ai/sdk'

const CHAT_PROMPT = `You are the Iron Operative Deployment Agent. Your job is to design and deploy AI operative agents for any business use case.

BUILT-IN SUITES:
1. PropIQ — Real estate back office (deal finding, offers, lead nurture). For wholesalers and investors.
2. Content Suite — Upload photos, get AI captions for Instagram, Facebook, TikTok, Google Business.

CUSTOM OPERATIVES: For anything else, build a custom operative. Ask 1 focused clarifying question if needed, then deploy.

TONE: Direct, confident, fast. 2–3 exchanges max. When you have enough info, tell the user you're building their operative now.`

const DEPLOY_PROMPT = `You are a deployment system. Based on the conversation below, call deploy_operative with the best operative you can design. Use all details provided. Deploy immediately — do not ask for more information.`

const DEPLOY_TOOL: Anthropic.Tool = {
  name: 'deploy_operative',
  description: 'Deploy an AI operative for the user.',
  input_schema: {
    type: 'object' as const,
    properties: {
      suite_id: {
        type: 'string',
        enum: ['propiq', 'content', 'custom'],
        description: '"propiq" for real estate, "content" for social captions, "custom" for everything else.',
      },
      name: {
        type: 'string',
        description: 'Short specific name, e.g. "CleanPro Quote & Follow-Up Operative"',
      },
      description: {
        type: 'string',
        description: 'One sentence describing what this operative does.',
      },
      system_prompt: {
        type: 'string',
        description: 'Full system prompt (200-400 words). Role, behavior, pricing details, output formats, domain knowledge.',
      },
    },
    required: ['suite_id', 'name', 'description', 'system_prompt'],
  },
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

async function runDeploy(
  user: { id: string },
  messages: ChatMessage[],
): Promise<{ id: string; suite_id: string; name: string; config: Record<string, unknown> } | { error: string }> {
  try {
    const service = createServiceClient()

    const deployRes = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: DEPLOY_PROMPT,
      tools: [DEPLOY_TOOL],
      tool_choice: { type: 'tool', name: 'deploy_operative' },
      messages,
    })

    const toolBlock = deployRes.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'deploy_operative'
    )
    if (!toolBlock) return { error: 'No tool call in deploy response' }

    const input = toolBlock.input as {
      suite_id: string
      name: string
      description: string
      system_prompt: string
    }

    const { data, error } = await service
      .from('operatives')
      .insert({
        user_id: user.id,
        suite_id: 'custom',
        agent_id: `custom_${Date.now()}`,
        name: input.name,
        config: { system_prompt: input.system_prompt, description: input.description },
        status: 'active',
      })
      .select('id, suite_id, name, config')
      .single()

    if (error) return { error: error.message }
    if (!data) return { error: 'No data returned from insert' }
    return data
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown deploy error' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { messages: ChatMessage[] }
    const { messages } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'messages required' }, { status: 400 })
    }

    // Always get a chat response
    // If we have 2+ messages (at least one exchange), ALSO force a deploy in parallel
    const shouldDeploy = messages.length >= 1

    const [chatRes, deployResult] = await Promise.all([
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: CHAT_PROMPT,
        messages,
      }),
      shouldDeploy ? runDeploy(user, messages) : Promise.resolve(null),
    ])

    const displayText = chatRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const deployedOperative = deployResult && !('error' in deployResult) ? deployResult : null
    const deployError = deployResult && 'error' in deployResult ? deployResult.error : null

    console.log('[DEPLOY]', deployError ? `FAILED: ${deployError}` : `OK: ${deployedOperative?.name}`)

    return NextResponse.json({
      success: true,
      data: {
        message: displayText,
        deployed: deployedOperative ? [deployedOperative] : null,
        deployError,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
