import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'

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
      .select('id, name, suite_id, config, memory')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!operative) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json() as { prompt: string }
    const { prompt } = body
    if (!prompt?.trim()) return NextResponse.json({ success: false, error: 'prompt required' }, { status: 400 })

    const config = operative.config as { system_prompt?: string; description?: string }
    const memory = operative.memory as string | null

    let systemPrompt = config.system_prompt ?? `You are ${operative.name}, an AI business operative. Help the user accomplish their task with a professional, complete deliverable.`

    if (memory) {
      systemPrompt += `\n\nBUSINESS CONTEXT (remembered from previous sessions):\n${memory}`
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt + '\n\nDeliver a complete, formatted, ready-to-use output. No preamble, no "here is your..." — just the deliverable itself.',
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    // Auto-generate a short title from the prompt
    const titleWords = prompt.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 6).join(' ')
    const title = titleWords.length > 3 ? titleWords : operative.name + ' Output'

    // Save to operative_outputs
    const { data: output } = await service
      .from('operative_outputs')
      .insert({
        operative_id: id,
        user_id: user.id,
        title,
        content,
        prompt,
      })
      .select('id, title, content, created_at')
      .single()

    // Background memory update
    service
      .from('operatives')
      .select('run_count')
      .eq('id', id)
      .single()
      .then(({ data: cur }) => {
        service
          .from('operatives')
          .update({ run_count: ((cur?.run_count as number) ?? 0) + 1 })
          .eq('id', id)
          .then(() => {})
      })

    return NextResponse.json({ success: true, data: output })
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
      .from('operative_outputs')
      .select('id, title, content, prompt, created_at')
      .eq('operative_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ success: true, data: data ?? [] })
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

    const url = new URL(req.url)
    const outputId = url.searchParams.get('output_id')
    if (!outputId) return NextResponse.json({ success: false, error: 'output_id required' }, { status: 400 })

    const service = createServiceClient()
    await service
      .from('operative_outputs')
      .delete()
      .eq('id', outputId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
