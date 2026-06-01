import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'
import { getToolDefinitions, executeTool } from '@/lib/tools'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

export const maxDuration = 300

export type DossierSection = 'underwriter' | 'offer' | 'nurture'

export type DossierEvent =
  | { type: 'section_start'; section: DossierSection }
  | { type: 'section_text'; section: DossierSection; content: string }
  | { type: 'section_done'; section: DossierSection }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface PropertyInput {
  address: string
  price: string
  beds: string
  baths: string
  sqft: string
  daysOnMarket: string
  arv: string
  arvRange: string
  upside: string
  owner: string
  ownerType: string
  lastSold: string
  mailTo: string
  whyItStandsOut: string
}

function buildUnderwriterPrompt(p: PropertyInput): string {
  return `You are a real estate underwriting agent for PropIQ.

Property to underwrite:
- Address: ${p.address}
- Asking Price: ${p.price}
- Beds/Baths/Sqft: ${p.beds} / ${p.baths} / ${p.sqft} sqft
- Days on Market: ${p.daysOnMarket}
- Rentcast AVM (ARV): ${p.arv}
- ARV Range: ${p.arvRange}
- Upside: ${p.upside}

Use http_request to get additional data from Rentcast (auth is automatic, never add headers):

Rent estimate:
  GET https://api.rentcast.io/v1/avm/rent/long-term?address=<street URL encoded>&city=<city>&state=<state>&zipCode=<zip>

Parse the address "${p.address}" to extract street, city, state, zip for the URL.

Then produce this report — no extra commentary, just the report:

## Underwriting Report

### Deal Inputs
- Address: ${p.address}
- Purchase Price: ${p.price}
- Est. ARV: ${p.arv} (Range: ${p.arvRange})
- Upside to ARV: ${p.upside}

### Flip Analysis (assume $30k rehab unless user specifies)
- Rehab Estimate: $30,000
- Total All-In: $[price + rehab]
- Gross Profit at ARV: $[arv - total]
- ROI: [gross / total × 100]%
- Max Offer (70% Rule): $[arv × 0.70 - 30000]

### Rental Analysis
- Est. Monthly Rent: $[from Rentcast, or estimate if unavailable]
- Annual Gross Rent: $[rent × 12]
- Annual Expenses (40%): $[gross × 0.4]
- Net Operating Income: $[gross × 0.6]
- Cap Rate: [NOI / price × 100]%
- Cash-on-Cash (20% down): [NOI / (price × 0.2) × 100]%

### Verdict
[2 sentences: flip or hold, and the single strongest reason based on the numbers]`
}

function buildOfferPrompt(p: PropertyInput): string {
  return `You are a direct mail letter writer for real estate investors.

Write a professional, persuasive letter from an investor to the property owner. Be human and specific — reference details that show you know the property.

Property details:
- Address: ${p.address}
- Asking Price: ${p.price}
- Days on Market: ${p.daysOnMarket}
- Owner: ${p.owner}
- Owner Type: ${p.ownerType}
- Last Sold: ${p.lastSold}
- Mail To: ${p.mailTo}
- Deal Note: ${p.whyItStandsOut}

Rules:
- 3-4 short paragraphs, professional but warm
- Reference the days on market and owner situation naturally
- Suggest a cash offer in the range of [ARV × 0.65 to ARV × 0.72] based on ARV of ${p.arv}
- Include [YOUR NAME], [YOUR PHONE], [YOUR EMAIL] as placeholders
- Output the letter only — no commentary before or after

---
[Today's Date]

${p.owner}
${p.mailTo}

Re: ${p.address}

Dear ${p.ownerType === 'Absentee' || p.ownerType?.includes('LLC') ? p.owner : 'Property Owner'},

[Body]

Sincerely,
[YOUR NAME]
[YOUR PHONE]
[YOUR EMAIL]
---`
}

function buildNurturePrompt(p: PropertyInput): string {
  return `You are a lead nurture specialist for real estate investors.

Create a 3-touch follow-up sequence for this lead. Be specific to their situation.

Lead details:
- Property: ${p.address}
- Owner: ${p.owner}
- Owner Type: ${p.ownerType}
- Days on Market: ${p.daysOnMarket}
- Last Sold: ${p.lastSold}
- Situation: ${p.whyItStandsOut}

Output only the sequence — no commentary:

---
## Follow-Up Sequence
**Property:** ${p.address}
**Owner:** ${p.owner} (${p.ownerType})

---

### Touch 1 — Day 1 (Phone Call)

**Opening (first 10 seconds):**
[What to say]

**If they answer:**
[2-3 sentences, then key questions]

**Key questions:**
- [question 1]
- [question 2]

**Voicemail script:**
[Under 20 seconds — be specific to this property]

---

### Touch 2 — Day 4 (Text Message)
[SMS under 160 chars — conversational, not salesy, references the property specifically]

---

### Touch 3 — Day 10 (Letter)
[3 short paragraphs — mention prior attempts, keep it brief and human]

---

### Tactical Notes
- [Note 1: specific leverage or insight for this lead]
- [Note 2: likely objection and how to handle it]`
}

async function runAgentSection(
  systemPrompt: string,
  userMessage: string,
  section: DossierSection,
  tools: string[],
  send: (ev: DossierEvent) => void
): Promise<void> {
  send({ type: 'section_start', section })

  const toolDefs = getToolDefinitions(tools as Parameters<typeof getToolDefinitions>[0])
  const messages: MessageParam[] = [{ role: 'user', content: userMessage }]

  for (let loop = 0; loop < 8; loop++) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      system: systemPrompt,
      messages,
      tools: toolDefs.length > 0 ? toolDefs : undefined,
      max_tokens: 2048,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        send({ type: 'section_text', section, content: event.delta.text })
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

  send({ type: 'section_done', section })
}

export async function POST(req: Request) {
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
    const ev: DossierEvent = { type: 'error', message: 'Pro subscription required.' }
    return new Response(`data: ${JSON.stringify(ev)}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const property = await req.json() as PropertyInput

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()

      // Thread-safe send — buffer events and flush in order
      const queue: DossierEvent[] = []
      let closed = false

      const send = (ev: DossierEvent) => {
        if (closed) return
        queue.push(ev)
        flush()
      }

      const flush = () => {
        while (queue.length > 0) {
          const ev = queue.shift()!
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`))
        }
      }

      try {
        // Run all three agents in parallel
        await Promise.all([
          runAgentSection(
            buildUnderwriterPrompt(property),
            `Underwrite this property: ${property.address}`,
            'underwriter',
            ['http_request'],
            send
          ),
          runAgentSection(
            buildOfferPrompt(property),
            `Write an offer letter for: ${property.address}`,
            'offer',
            [],
            send
          ),
          runAgentSection(
            buildNurturePrompt(property),
            `Create a follow-up sequence for: ${property.address}`,
            'nurture',
            [],
            send
          ),
        ])

        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        closed = true
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
