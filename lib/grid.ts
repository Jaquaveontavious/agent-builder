import { anthropic, MODEL } from './anthropic'
import { getToolDefinitions, executeTool } from './tools'
import type { Agent, GridMember, GridSSEEvent } from './types'
import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

export type GridSend = (event: GridSSEEvent) => void

export async function runSubAgent(
  agent: Agent,
  task: string,
  context: string | undefined,
  send: GridSend
): Promise<{ output: string; tokens: number }> {
  send({ type: 'agent_start', agent_id: agent.id, agent_name: agent.name, task })

  const fullInput = context
    ? `Context from prior work:\n${context}\n\n---\n\nYour task:\n${task}`
    : task

  const messages: MessageParam[] = [{ role: 'user', content: fullInput }]
  const tools = getToolDefinitions(agent.tools)
  let totalTokens = 0
  let fullOutput = ''

  for (let loop = 0; loop < 10; loop++) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      system: agent.system_prompt,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      max_tokens: 4096,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        send({ type: 'agent_text', agent_id: agent.id, content: event.delta.text })
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
        send({ type: 'agent_tool_call', agent_id: agent.id, tool: block.name })
        const result = await executeTool(block.name, block.input as Record<string, unknown>)
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
      }
      messages.push({ role: 'user', content: toolResults })
    } else {
      break
    }
  }

  send({ type: 'agent_complete', agent_id: agent.id, output: fullOutput, tokens: totalTokens })
  return { output: fullOutput, tokens: totalTokens }
}

export function buildCoordinatorTools(memberAgents: Agent[]): Tool[] {
  const agentIds = memberAgents.map((a) => a.id)

  return [
    {
      name: 'invoke_agent',
      description:
        'Delegate a task to a specific agent and receive their complete result. Use for sequential steps where each depends on the previous.',
      input_schema: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'ID of the agent to invoke',
            enum: agentIds,
          },
          task: {
            type: 'string',
            description: 'The specific task or question for this agent',
          },
          context: {
            type: 'string',
            description: 'Optional: relevant output from prior agents to include as context',
          },
        },
        required: ['agent_id', 'task'],
      },
    },
    {
      name: 'invoke_agents_parallel',
      description:
        'Run multiple agents simultaneously on independent tasks. Use when subtasks do not depend on each other to maximize efficiency.',
      input_schema: {
        type: 'object',
        properties: {
          invocations: {
            type: 'array',
            description: 'Agents to invoke simultaneously',
            items: {
              type: 'object',
              properties: {
                agent_id: {
                  type: 'string',
                  description: 'ID of the agent to invoke',
                  enum: agentIds,
                },
                task: { type: 'string', description: 'Task for this agent' },
                context: { type: 'string', description: 'Optional context' },
              },
              required: ['agent_id', 'task'],
            },
          },
        },
        required: ['invocations'],
      },
    },
  ]
}

export function buildCoordinatorPrompt(
  memberAgents: Agent[],
  roleMap: Record<string, string>
): string {
  const roster = memberAgents
    .map(
      (a) =>
        `• ID: ${a.id}\n  Name: ${a.name}\n  Role: ${roleMap[a.id] ?? 'General Agent'}\n  Specialty: ${a.description}`
    )
    .join('\n\n')

  return `You are the Grid Coordinator. You direct a team of specialized agents to accomplish complex tasks that benefit from parallelism and domain expertise.

Your agent roster:
${roster}

Coordination guidelines:
- Analyze the overall objective and determine which agents to involve
- Use invoke_agents_parallel when subtasks are independent (runs agents concurrently)
- Use invoke_agent sequentially when one result must inform the next
- Pass relevant prior context to downstream agents via the context parameter
- After all agents complete, synthesize their outputs into a comprehensive, well-structured final response

Your final response is what the user receives. Synthesize intelligently — do not merely concatenate agent outputs. Add structure, analysis, and actionable conclusions.`
}

export function buildGridMemberMap(members: GridMember[]): Record<string, string> {
  return Object.fromEntries(members.map((m) => [m.id, m.role]))
}
