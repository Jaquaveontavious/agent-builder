import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { getToolDefinitions, executeTool } from '@/lib/tools'
import { FREE_RUN_LIMIT } from '@/lib/stripe'
import type { Agent, SSEEvent } from '@/lib/types'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

export const maxDuration = 120

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as { input?: string }
  const input = body.input?.trim()
  if (!input) return new Response('Input required', { status: 400 })

  const service = createServiceClient()

  // ── Load agent ─────────────────────────────────────────────────────────────
  const { data: agent, error: agentErr } = await service
    .from('agents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (agentErr || !agent) return new Response('Agent not found', { status: 404 })

  // ── Check run limit ───────────────────────────────────────────────────────
  const { data: sub } = await service
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!sub) return new Response('Subscription not found', { status: 500 })

  if (sub.plan === 'free' && (sub.runs_this_month ?? 0) >= FREE_RUN_LIMIT) {
    return ssError('Free plan limit reached (10 runs/month). Upgrade to Pro for unlimited runs.')
  }

  // ── Create run record ──────────────────────────────────────────────────────
  const { data: run, error: runErr } = await service
    .from('runs')
    .insert({ agent_id: agent.id, user_id: user.id, input, status: 'running' })
    .select()
    .single()

  if (runErr || !run) return new Response('Failed to create run record', { status: 500 })

  // Increment monthly counter (DB trigger resets it when month rolls over)
  await service
    .from('user_subscriptions')
    .update({
      runs_this_month: (sub.runs_this_month ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  // ── SSE stream ─────────────────────────────────────────────────────────────
  const typedAgent = agent as Agent
  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (event: SSEEvent) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`))

      const messages: MessageParam[] = [{ role: 'user', content: input }]
      const tools = getToolDefinitions(typedAgent.tools)
      let totalTokens = 0
      let fullOutput = ''

      try {
        for (let loop = 0; loop < 10; loop++) {
          const stream = anthropic.messages.stream({
            model: MODEL,
            system: typedAgent.system_prompt,
            messages,
            tools: tools.length > 0 ? tools : undefined,
            max_tokens: 4096,
          })

          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              send({ type: 'text', content: event.delta.text })
              fullOutput += event.delta.text
            }
          }

          const final = await stream.finalMessage()
          totalTokens += final.usage.input_tokens + final.usage.output_tokens
          messages.push({ role: 'assistant', content: final.content })

          if (final.stop_reason === 'end_turn' || final.stop_reason === 'stop_sequence') break

          if (final.stop_reason === 'tool_use') {
            const toolResults: MessageParam['content'] = []
            for (const block of final.content) {
              if (block.type !== 'tool_use') continue
              const toolInput = block.input as Record<string, unknown>
              send({ type: 'tool_call', name: block.name, input: toolInput })
              const result = await executeTool(block.name, toolInput)
              send({ type: 'tool_result', name: block.name, content: result })
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
            }
            messages.push({ role: 'user', content: toolResults })
          } else {
            break
          }
        }

        await service
          .from('runs')
          .update({ output: fullOutput, status: 'complete', tokens_used: totalTokens })
          .eq('id', run.id)

        send({ type: 'done', tokens_used: totalTokens, run_id: run.id })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Agent runtime error:', err)
        await service
          .from('runs')
          .update({ output: fullOutput || null, status: 'failed', tokens_used: totalTokens })
          .eq('id', run.id)
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

function ssError(message: string) {
  const ev: SSEEvent = { type: 'error', message }
  return new Response(`data: ${JSON.stringify(ev)}\n\n`, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
