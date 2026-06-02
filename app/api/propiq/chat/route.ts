import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { runSubAgent, buildCoordinatorTools, buildGridMemberMap } from '@/lib/grid'
import type { Agent, AgentLog, GridMember, GridSSEEvent } from '@/lib/types'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

export const maxDuration = 300

// ─── PropIQ agent definitions ────────────────────────────────────────────────

const DEAL_FINDER_PROMPT = `You are the Deal Finder agent for PropIQ, a real estate investment tool.
Your job is to search for active property listings using the Rentcast API.

You have access to the http_request tool. Authentication is handled automatically — never add auth headers.

Search endpoint:
  URL: https://api.rentcast.io/v1/listings/sale
  Method: GET
  Query params (append to URL):
    city=<city name, URL encoded>
    state=<2-letter state code>
    propertyType=Single+Family
    maxPrice=<max price as integer>
    status=Active
    limit=10

Example for Phoenix AZ under $250k:
  https://api.rentcast.io/v1/listings/sale?city=Phoenix&state=AZ&propertyType=Single+Family&maxPrice=250000&status=Active&limit=10

The response is a JSON array. Each property has:
- formattedAddress
- price
- bedrooms, bathrooms, squareFootage
- daysOnMarket
- yearBuilt

Return the top 5-8 properties that best match the criteria. Format each as:
ADDRESS: [formattedAddress]
PRICE: $[price]
BEDS: [bedrooms] BATHS: [bathrooms] SQFT: [squareFootage]
YEAR BUILT: [yearBuilt]
DAYS ON MARKET: [daysOnMarket]

Flag any property with daysOnMarket > 60 as a motivated seller opportunity.
If no results, try a nearby city or expand the price range slightly and try again.
If the API returns RENTCAST_UNAVAILABLE, return that exact string and nothing else.`

const COMP_PULLER_PROMPT = `You are the Comp Puller agent for PropIQ, a real estate investment tool.
For each property you receive, make TWO API calls: one for valuation, one for owner data.

You have access to the http_request tool. Authentication is handled automatically — never add auth headers.

CALL 1 — AVM valuation:
  URL: https://api.rentcast.io/v1/avm/value
  Method: GET
  Params: address=<street URL-encoded>&city=<city>&state=<state>&zipCode=<zip if known>
  Example: https://api.rentcast.io/v1/avm/value?address=5635+N+35th+Dr&city=Phoenix&state=AZ&zipCode=85019
  Returns: price (ARV), priceRangeLow, priceRangeHigh

CALL 2 — Property + owner data:
  URL: https://api.rentcast.io/v1/properties
  Method: GET
  Params: address=<street URL-encoded>&city=<city>&state=<state>&zipCode=<zip if known>
  Example: https://api.rentcast.io/v1/properties?address=5635+N+35th+Dr&city=Phoenix&state=AZ&zipCode=85019
  Returns: owner.names, owner.mailingAddress, ownerOccupied, lastSalePrice, lastSaleDate, features

For each property calculate:
- Upside % = (AVM price - listPrice) / AVM price × 100
- Equity = lastSalePrice vs current listPrice (shows how long they've held it)
- Deal Score 1-10:
  - 9-10: upside > 25%, or days on market > 90, or ownerOccupied = false + upside > 15%
  - 7-8: upside 15-25%
  - 5-6: upside 5-15%
  - below 5: less than 5% upside

Return results in this EXACT format — no deviations, no extra text:

---
**[formattedAddress]**
- Price: $[listPrice]
- Beds/Baths/Sqft: [beds] / [baths] / [sqft] sqft
- Days on Market: [daysOnMarket]
- Est. ARV: $[AVM price]
- ARV Range: $[priceRangeLow] – $[priceRangeHigh]
- Upside: [upside]%
- Deal Score: [score]/10
- Why it stands out: [one data-driven sentence]
- Owner: [owner.names joined with " & "] | [Absentee if ownerOccupied=false, else Owner-Occupied]
- Last Sold: $[lastSalePrice] in [lastSaleDate year]
- Mail To: [owner.mailingAddress.formattedAddress]
---

If AVM returns no data, skip that property. If owner data is unavailable, omit those fields.
If any API call returns RENTCAST_UNAVAILABLE, return that exact string and nothing else.`

const PROPIQ_COORDINATOR_PROMPT = (dealFinderId: string, compPullerId: string) => `You are PropIQ, a real estate investment analysis tool. You are direct, data-driven, and never add filler.

You have two agents:
- Deal Finder (ID: ${dealFinderId}): Searches MLS listings via Rentcast API
- Comp Puller (ID: ${compPullerId}): Gets AVM valuations via Rentcast API

Rules:
1. If location or budget is missing from the request, ask for it — do not proceed without both
2. For deal searches: invoke Deal Finder first, then pass ALL returned addresses to Comp Puller as context
3. For comp/ARV requests on specific addresses: invoke Comp Puller only
4. Your final response must be ONLY the property cards and a one-sentence summary — no advice, no next steps, no emojis, no padding
5. If any agent returns a message containing RENTCAST_UNAVAILABLE, respond with exactly: "Live listing data isn't available right now — please try again in a little while." Nothing else.

Output format rules — follow these exactly, no exceptions:
- Start your response directly with the first property card. No intro sentences, no preamble.
- Copy the Comp Puller's output EXACTLY as-is. Do not reformat, reorder, rename fields, or add commentary.
- Each property card must be separated by a line containing only: ---
- After all cards, append exactly:

## Top Pick
[One sentence: best address and the single strongest reason why.]

If no properties meet the criteria, state that plainly in one sentence.`

// ─── Seed PropIQ agents + grid for user ─────────────────────────────────────

async function ensurePropIQSetup(userId: string): Promise<{
  dealFinderId: string
  compPullerId: string
  gridId: string
}> {
  const service = createServiceClient()

  const { data: existing } = await service
    .from('propiq_setup')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing?.deal_finder_id && existing?.comp_puller_id && existing?.grid_id) {
    return {
      dealFinderId: existing.deal_finder_id as string,
      compPullerId: existing.comp_puller_id as string,
      gridId: existing.grid_id as string,
    }
  }

  // Create Deal Finder agent
  const { data: dealFinder } = await service
    .from('agents')
    .insert({
      user_id: userId,
      name: 'Deal Finder',
      description: 'Searches listing APIs for investment properties matching your criteria',
      system_prompt: DEAL_FINDER_PROMPT,
      tools: ['http_request'],
      status: 'active',
      suggested_use_cases: ['Find off-market deals', 'Search by price and location'],
    })
    .select()
    .single()

  // Create Comp Puller agent
  const { data: compPuller } = await service
    .from('agents')
    .insert({
      user_id: userId,
      name: 'Comp Puller',
      description: 'Pulls recent sold comps and estimates ARV for subject properties',
      system_prompt: COMP_PULLER_PROMPT,
      tools: ['http_request'],
      status: 'active',
      suggested_use_cases: ['Pull comps', 'Estimate ARV', 'Calculate upside'],
    })
    .select()
    .single()

  if (!dealFinder || !compPuller) throw new Error('Failed to create PropIQ agents')

  const members: GridMember[] = [
    { id: dealFinder.id as string, name: 'Deal Finder', role: 'Property Search' },
    { id: compPuller.id as string, name: 'Comp Puller', role: 'ARV Estimation' },
  ]

  // Create PropIQ Grid
  const { data: grid } = await service
    .from('grids')
    .insert({
      user_id: userId,
      name: 'PropIQ',
      description: 'Real estate deal finding and analysis',
      member_agents: members,
    })
    .select()
    .single()

  if (!grid) throw new Error('Failed to create PropIQ grid')

  await service.from('propiq_setup').upsert({
    user_id: userId,
    deal_finder_id: dealFinder.id,
    comp_puller_id: compPuller.id,
    grid_id: grid.id,
  })

  return {
    dealFinderId: dealFinder.id as string,
    compPullerId: compPuller.id as string,
    gridId: grid.id as string,
  }
}

// ─── POST /api/propiq/chat ────────────────────────────────────────────────────

export async function POST(req: Request) {
  console.log('[PropIQ] POST start — SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30), '— SERVICE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 'MISSING', '— RENTCAST_KEY length:', process.env.RENTCAST_API_KEY?.length ?? 'MISSING', '— ANTHROPIC_KEY length:', process.env.ANTHROPIC_API_KEY?.length ?? 'MISSING')

  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  console.log('[PropIQ] user authenticated:', user.id.slice(0, 8))
  const service = createServiceClient()

  // Subscription / trial gate
  let isPro = false
  let trialUsed = 0
  try {
    const { data: sub, error: subError } = await service
      .from('user_subscriptions')
      .select('plan, trial_searches_used')
      .eq('user_id', user.id)
      .single()

    if (subError) {
      console.error('[PropIQ] Subscription fetch error:', subError)
    }

    isPro = sub?.plan === 'pro'
    trialUsed = sub?.trial_searches_used ?? 0
  } catch (err) {
    console.error('[PropIQ] Subscription check threw:', err)
    // Fail open — let them proceed rather than blocking on a DB error
  }

  const TRIAL_LIMIT = 3

  if (!isPro && trialUsed >= TRIAL_LIMIT) {
    return ssUpgradeRequired()
  }

  // Increment trial counter before running (prevents gaming by cancelling mid-stream)
  if (!isPro) {
    try {
      await service
        .from('user_subscriptions')
        .update({ trial_searches_used: trialUsed + 1, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    } catch (err) {
      console.error('[PropIQ] Trial counter update threw:', err)
      // Non-fatal — continue with the search
    }
  }

  const body = await req.json() as { message: string; conversation_id?: string }
  const userMessage = body.message?.trim()
  if (!userMessage) return new Response('Message required.', { status: 400 })

  // Ensure PropIQ agents + grid exist for this user
  let setup: { dealFinderId: string; compPullerId: string; gridId: string }
  try {
    setup = await ensurePropIQSetup(user.id)
  } catch (err) {
    return new Response('Failed to initialize PropIQ.', { status: 500 })
  }

  // Persist conversation + user message
  let conversationId = body.conversation_id
  if (!conversationId) {
    const { data: conv } = await service
      .from('conversations')
      .insert({ user_id: user.id, title: userMessage.slice(0, 80) })
      .select()
      .single()
    conversationId = conv?.id as string
  }

  // Load prior messages for context (before inserting the new one)
  const { data: priorMessages } = await service
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  await service.from('messages').insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: 'user',
    content: userMessage,
  })

  // Load agents
  const { data: agentsData } = await service
    .from('agents')
    .select('*')
    .in('id', [setup.dealFinderId, setup.compPullerId])
    .eq('user_id', user.id)

  const agents = (agentsData ?? []) as Agent[]
  const members: GridMember[] = [
    { id: setup.dealFinderId, name: 'Deal Finder', role: 'Property Search' },
    { id: setup.compPullerId, name: 'Comp Puller', role: 'ARV Estimation' },
  ]
  const roleMap = buildGridMemberMap(members)
  const coordinatorTools = buildCoordinatorTools(agents)
  const coordinatorPrompt = PROPIQ_COORDINATOR_PROMPT(setup.dealFinderId, setup.compPullerId)

  const readable = new ReadableStream({
    async start(controller) {
      console.log('[PropIQ] stream started — agents:', agents.length, '— conversationId:', conversationId?.slice(0, 8))
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

      // Build message history — prior turns + current message
      const history: MessageParam[] = (priorMessages ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
      }))
      const messages: MessageParam[] = [...history, { role: 'user', content: userMessage }]
      let totalTokens = 0
      let fullOutput = ''

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
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send({ type: 'coordinator_text', content: event.delta.text })
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
              const input = block.input as Record<string, unknown>

              if (block.name === 'invoke_agent') {
                const { agent_id, task, context } = input as {
                  agent_id: string; task: string; context?: string
                }
                const agent = agents.find((a) => a.id === agent_id)
                if (!agent) {
                  toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Agent ${agent_id} not found.` })
                  continue
                }
                const { output, tokens } = await runSubAgent(agent, task, context, send)
                totalTokens += tokens
                toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: output })
              } else if (block.name === 'invoke_agents_parallel') {
                const { invocations } = input as {
                  invocations: Array<{ agent_id: string; task: string; context?: string }>
                }
                const results = await Promise.all(
                  invocations.map(async ({ agent_id, task, context }) => {
                    const agent = agents.find((a) => a.id === agent_id)
                    if (!agent) return { agent_name: agent_id, output: `Agent ${agent_id} not found.` }
                    const { output, tokens } = await runSubAgent(agent, task, context, send)
                    totalTokens += tokens
                    return { agent_name: agent.name, output }
                  })
                )
                const combined = results.map((r) => `[${r.agent_name}]\n${r.output}`).join('\n\n---\n\n')
                toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: combined })
              }
            }

            messages.push({ role: 'user', content: toolResults })
          } else {
            break
          }
        }

        // Save assistant message
        await service.from('messages').insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: 'assistant',
          content: fullOutput,
        })

        send({ type: 'done', tokens_used: totalTokens, run_id: conversationId! })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
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
      'X-Conversation-Id': conversationId ?? '',
    },
  })
}

function ssError(message: string) {
  const ev: GridSSEEvent = { type: 'error', message }
  return new Response(`data: ${JSON.stringify(ev)}\n\n`, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function ssUpgradeRequired() {
  return new Response(`data: ${JSON.stringify({ type: 'upgrade_required' })}\n\n`, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
