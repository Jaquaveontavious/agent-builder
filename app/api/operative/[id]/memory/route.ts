import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'

const EXTRACT_PROMPT = `You are a memory extraction system for an AI business operative. Given a conversation, extract any business facts worth remembering for future sessions.

Extract ONLY things that are durable and reusable — not one-off requests. Focus on:
- Business details (name, location, services offered, pricing, target customers)
- Preferences (tone, format, recurring workflows)
- Key numbers (rates, square footage, typical job sizes, payment terms)
- Named contacts or clients mentioned
- Any specific rules the user has stated ("always include X", "never do Y")

RULES:
- If nothing new and durable was mentioned, return the existing memory unchanged
- Be concise — this is a reference card, not a summary
- Format as short bullet points grouped by topic
- Max 300 words
- Do not include one-time tasks, questions, or conversation-specific content

Return ONLY the updated memory text, no explanation.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: operative } = await service
      .from('operatives')
      .select('id, memory')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!operative) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json() as { messages: ChatMessage[] }
    const { messages } = body

    const existingMemory = (operative.memory as string) ?? ''

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: EXTRACT_PROMPT,
      messages: [
        {
          role: 'user',
          content: `EXISTING MEMORY:\n${existingMemory || '(none yet)'}\n\nNEW CONVERSATION:\n${
            messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
          }\n\nUpdate the memory with any new durable facts from this conversation.`,
        },
      ],
    })

    const updatedMemory = response.content[0].type === 'text' ? response.content[0].text.trim() : existingMemory

    // Update memory and increment run count
    const { data: current } = await service
      .from('operatives')
      .select('run_count')
      .eq('id', id)
      .single()

    await service
      .from('operatives')
      .update({
        memory: updatedMemory,
        run_count: ((current?.run_count as number) ?? 0) + 1,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true, data: { memory: updatedMemory } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data } = await service
      .from('operatives')
      .select('memory, run_count, created_at, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await service
      .from('operatives')
      .update({ memory: '' })
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
