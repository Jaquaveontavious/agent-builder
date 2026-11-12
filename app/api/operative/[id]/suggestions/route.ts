import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'

export async function GET(
  _req: NextRequest,
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
      .select('name, config, suite_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!operative) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const name = operative.name as string
    const config = operative.config as { description?: string; system_prompt?: string } | null
    const description = config?.description ?? config?.system_prompt ?? ''

    const prompt = `You are helping a user understand what they can do with their AI operative.

Operative name: "${name}"
Operative description: "${description}"

Generate exactly 4 short, specific, actionable prompt suggestions the user could send to this operative right now.
Each suggestion should be tailored to what this specific operative does — not generic business writing prompts.

Rules:
- Each suggestion must be a complete, ready-to-use prompt (not a category label)
- Keep each under 12 words
- Make them specific to this operative's purpose
- Do not number them
- Return ONLY a JSON array of 4 strings, nothing else

Example format: ["Quiz me on VFR weather minimums", "Explain the 4 forces of flight", "What is a METAR and how do I read one?", "Create a study plan for my written exam"]`

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'

    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/)
    const suggestions: string[] = match ? JSON.parse(match[0]) as string[] : []

    return NextResponse.json({ success: true, data: suggestions.slice(0, 4) })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
