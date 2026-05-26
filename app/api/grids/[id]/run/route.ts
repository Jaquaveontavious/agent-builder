import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'
import {
  runSubAgent,
  buildCoordinatorTools,
  buildCoordinatorPrompt,
  buildGridMemberMap,
} from '@/lib/grid'
import type { Agent, AgentLog, Grid, GridMember, GridSSEEvent } from '@/lib/types'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

export const maxDuration = 300

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()

  const { data: sub } = await service
    .from('user_subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  if (sub?.plan !== 'pro') {
    return ssError('The Grid requires a Pro subscription.')
  }

  const body = await req.json() as { input?: string }
  const input = body.input?.trim()
  if (!input) return new Response('Input required.', { status: 400 })

  const { data: gridRow } = await service
    .from('grids')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!gridRow) return new Response('Grid not found.', { status: 404 })

  const grid = gridRow as Grid
  const members = grid.member_agents as GridMember[]
  const memberIds = members.map((m) => m.id)
  const roleMap = buildGridMemberMap(members)

  const { data: agentsData } = await service
    .from('agents')
    .select('*')
    .in('id', memberIds)
    .eq('user_id', user.id)

  const agents = (agentsData ?? []) as Agent[]

  if (agents.length < 2) {
    return ssError('This grid requires at least 2 active agents. Some may have been deleted.')
  }

  const { data: gridRun, error: runErr } = await service
    .from('grid_runs')
    .insert({ grid_id: id, user_id: user.id, input, status: 'running' })
    .select()
    .single()

  if (runErr || !gridRun) return new Response('Failed to create run record.', { status: 500 })

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()

      const agentLogs: AgentLog[] = []
      const agentStartTimes: Record<string, string> = {}
      const agentTasks: Record<string, string> = {}
      const agentNames: Record<string, string> = {}

      const send = (event: GridSSEEvent) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`))

        if (event.type === 'agent_start') {
          agentStartTimes[event.agent_id] = new Date().toISOString()
          agentTasks[event.agent_id] = event.task
          agentNames[event.agent_id] = event.agent_name
        }
        if (event.type === 'agent_complete') {
          agentLogs.push({
            agent_id: event.agent_id,
            agent_name: agentNames[event.agent_id] ?? '',
            task: agentTasks[event.agent_id] ?? '',
            output: event.output,
            tokens: event.tokens,
            started_at: agentStartTimes[event.agent_id] ?? new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
        }
      }

      const coordinatorTools = buildCoordinatorTools(agents)
      const coordinatorPrompt = buildCoordinatorPrompt(agents, roleMap)
      const messages: MessageParam[] = [{ role: 'user', content: input }]
      let totalTokens = 0
      let coordinatorOutput = ''

      try {
        for (let loop = 0; loop < 10; loop++) {
          const stream = anthropic.messages.stream({
            model: MODEL,
            system: coordinatorPrompt,
            messages,
            tools: coordinatorTools,
            max_tokens: 4096,
          })

          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              send({ type: 'coordinator_text', content: event.delta.text })
              coordinatorOutput += event.delta.text
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

              if (block.name === 'invoke_agent') {
                const { agent_id, task, context } = toolInput as {
                  agent_id: string
                  task: string
                  context?: string
                }
                const agent = agents.find((a) => a.id === agent_id)
                if (!agent) {
                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: block.id,
                    content: `Error: Agent ${agent_id} not found in this grid.`,
                  })
                  continue
                }
                const { output, tokens } = await runSubAgent(agent, task, context, send)
                totalTokens += tokens
                toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: output })
              } else if (block.name === 'invoke_agents_parallel') {
                const { invocations } = toolInput as {
                  invocations: Array<{ agent_id: string; task: string; context?: string }>
                }

                const results = await Promise.all(
                  invocations.map(async ({ agent_id, task, context }) => {
                    const agent = agents.find((a) => a.id === agent_id)
                    if (!agent) {
                      return {
                        agent_name: agent_id,
                        output: `Error: Agent ${agent_id} not found.`,
                      }
                    }
                    const { output, tokens } = await runSubAgent(agent, task, context, send)
                    totalTokens += tokens
                    return { agent_name: agent.name, output }
                  })
                )

                const combined = results
                  .map((r) => `[${r.agent_name}]\n${r.output}`)
                  .join('\n\n---\n\n')
                toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: combined })
              }
            }

            messages.push({ role: 'user', content: toolResults })
          } else {
            break
          }
        }

        await service
          .from('grid_runs')
          .update({
            output: coordinatorOutput,
            status: 'complete',
            tokens_used: totalTokens,
            agent_logs: agentLogs,
          })
          .eq('id', gridRun.id)

        send({ type: 'done', tokens_used: totalTokens, run_id: gridRun.id })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Grid runtime error:', err)
        await service
          .from('grid_runs')
          .update({
            output: coordinatorOutput || null,
            status: 'failed',
            tokens_used: totalTokens,
            agent_logs: agentLogs,
          })
          .eq('id', gridRun.id)
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
  const ev: GridSSEEvent = { type: 'error', message }
  return new Response(`data: ${JSON.stringify(ev)}\n\n`, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
