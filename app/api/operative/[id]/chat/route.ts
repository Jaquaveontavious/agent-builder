import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface OperativeConfig {
  system_prompt?: string
  description?: string
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

    // Check subscription for custom operatives
    const service = createServiceClient()

    const [{ data: operative, error: opError }, { data: sub }] = await Promise.all([
      service
        .from('operatives')
        .select('id, name, suite_id, config, status, memory')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      service
        .from('user_subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .single(),
    ])

    if (opError || !operative) {
      return NextResponse.json({ success: false, error: 'Operative not found' }, { status: 404 })
    }

    const isPro = sub?.plan === 'pro'

    // Gate custom operatives behind Pro
    if (operative.suite_id === 'custom' && !isPro) {
      return NextResponse.json(
        { success: false, error: 'upgrade_required', message: 'Custom operatives require a Pro subscription.' },
        { status: 403 }
      )
    }

    const config = operative.config as OperativeConfig
    const basePrompt = config?.system_prompt ??
      `You are ${operative.name}, an AI operative deployed on the Iron Operative platform. Help the user accomplish their goals efficiently and directly.`

    // Inject memory if it exists
    const memory = (operative.memory as string | null) ?? ''
    const systemPrompt = memory.trim()
      ? `${basePrompt}\n\n---\nBUSINESS CONTEXT (remembered from previous sessions):\n${memory.trim()}\n---\nUse this context to personalize your responses. Do not mention that you have a memory system unless asked.`
      : basePrompt

    const body = await req.json() as { messages: ChatMessage[] }
    const { messages } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'messages required' }, { status: 400 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        function send(obj: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
        }

        try {
          const anthropicStream = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system: systemPrompt,
            messages,
            stream: true,
          })

          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send({ type: 'text', content: event.delta.text })
            }
            if (event.type === 'message_stop') {
              send({ type: 'done' })
            }
          }
        } catch (err) {
          send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
