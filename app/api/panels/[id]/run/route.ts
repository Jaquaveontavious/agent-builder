import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { getToolDefinitions, executeTool } from '@/lib/tools'
import { FORMAT_INSTRUCTIONS, parseOutput } from '@/lib/panels'
import type { Agent, Panel, PanelType } from '@/lib/types'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

export const maxDuration = 60

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as { input?: string }

  const service = createServiceClient()

  const { data: panelRow } = await service
    .from('panels')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!panelRow) return new Response('Panel not found.', { status: 404 })

  const panel = panelRow as Panel
  const userInput = (body.input ?? panel.auto_prompt ?? '').trim()
  if (!userInput) {
    return Response.json({ output: { type: 'error', message: 'No prompt configured for this panel.' } })
  }

  if (!panel.agent_id) {
    return Response.json({ output: { type: 'error', message: 'No agent assigned to this panel.' } })
  }

  const { data: agentRow } = await service
    .from('agents')
    .select('*')
    .eq('id', panel.agent_id)
    .eq('user_id', user.id)
    .single()

  if (!agentRow) {
    return Response.json({ output: { type: 'error', message: 'Assigned agent not found.' } })
  }

  const agent = agentRow as Agent
  const panelType = panel.panel_type as PanelType
  const formatInstruction = FORMAT_INSTRUCTIONS[panelType]
  const fullPrompt = userInput + formatInstruction

  const tools = getToolDefinitions(agent.tools)
  const messages: MessageParam[] = [{ role: 'user', content: fullPrompt }]
  let fullOutput = ''
  let totalTokens = 0

  try {
    for (let loop = 0; loop < 5; loop++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        system: agent.system_prompt,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        max_tokens: 2048,
      })

      totalTokens += response.usage.input_tokens + response.usage.output_tokens

      for (const block of response.content) {
        if (block.type === 'text') fullOutput += block.text
      }

      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn' || response.stop_reason === 'stop_sequence') break

      if (response.stop_reason === 'tool_use') {
        const toolResults: MessageParam['content'] = []
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue
          const result = await executeTool(block.name, block.input as Record<string, unknown>)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        }
        messages.push({ role: 'user', content: toolResults })
      } else {
        break
      }
    }

    const output = parseOutput(fullOutput, panelType)

    await service
      .from('panels')
      .update({ last_output: output, last_run_at: new Date().toISOString() })
      .eq('id', id)

    return Response.json({ output, tokens_used: totalTokens })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ output: { type: 'error', message } })
  }
}
