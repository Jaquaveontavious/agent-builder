/**
 * Shared single-agent SSE runner for PropIQ tools.
 * Each tool (Underwriter, Market Pulse, etc.) has one agent that streams directly to the user.
 */
import { anthropic, MODEL } from './anthropic'
import { getToolDefinitions, executeTool } from './tools'
import type { ToolName } from './types'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { createAuthClient, createServiceClient } from './supabase/server'

export const maxDuration = 300

export type SimpleSSEEvent =
  | { type: 'text'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export async function runPropIQAgent({
  req,
  systemPrompt,
  tools,
  requirePro = true,
}: {
  req: Request
  systemPrompt: string
  tools: ToolName[]
  requirePro?: boolean
}): Promise<Response> {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  if (requirePro) {
    const service = createServiceClient()
    const { data: sub } = await service
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()
    if (sub?.plan !== 'pro') {
      const ev: SimpleSSEEvent = { type: 'error', message: 'PropIQ requires a Pro subscription ($97/mo).' }
      return new Response(`data: ${JSON.stringify(ev)}\n\n`, {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }
  }

  const body = await req.json() as { message: string }
  const userMessage = body.message?.trim()
  if (!userMessage) return new Response('Message required.', { status: 400 })

  const toolDefs = getToolDefinitions(tools)
  const messages: MessageParam[] = [{ role: 'user', content: userMessage }]

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (ev: SimpleSSEEvent) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`))
      }

      try {
        for (let loop = 0; loop < 10; loop++) {
          const stream = anthropic.messages.stream({
            model: MODEL,
            system: systemPrompt,
            messages,
            tools: toolDefs.length > 0 ? toolDefs : undefined,
            max_tokens: 4096,
          })

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send({ type: 'text', content: event.delta.text })
            }
          }

          const final = await stream.finalMessage()
          messages.push({ role: 'assistant', content: final.content })

          if (final.stop_reason === 'end_turn' || final.stop_reason === 'stop_sequence') break

          if (final.stop_reason === 'tool_use') {
            const toolResults: MessageParam['content'] = []
            for (const block of final.content) {
              if (block.type !== 'tool_use') continue
              const result = await executeTool(block.name, block.input as Record<string, unknown>)
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
            }
            messages.push({ role: 'user', content: toolResults })
          } else {
            break
          }
        }
        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
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
