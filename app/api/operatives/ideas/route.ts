import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'

export interface GeneratedIdea {
  name: string
  description: string
  category: string
  system_prompt: string
}

const SYSTEM_PROMPT = `You are an AI operative designer for Iron Operative, a business automation platform. Given a keyword, industry, or problem description, you generate specific, immediately useful AI operative ideas that businesses can deploy.

Each operative is a specialized AI agent that helps a business automate or accelerate a specific workflow through chat.

RULES:
- Generate exactly 4 operative ideas
- Each must be specific and immediately actionable — not generic
- System prompts must be detailed enough that the operative is useful on day one (150-250 words each)
- Focus on real business pain points: things that take too much time, require writing, involve repetitive decisions, or need consistent output
- Vary the ideas — don't give 4 versions of the same thing

OUTPUT FORMAT — respond with ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "name": "Short operative name (3-6 words)",
    "description": "One sentence: what goes in, what comes out",
    "category": "one of: trades, real_estate, agency, ecommerce, marketing, business",
    "system_prompt": "Full detailed system prompt for this operative"
  }
]`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { keyword: string }
    const { keyword } = body

    if (!keyword?.trim()) {
      return NextResponse.json({ success: false, error: 'keyword required' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate 4 AI operative ideas for: "${keyword.trim()}"`,
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'

    let ideas: GeneratedIdea[] = []
    try {
      ideas = JSON.parse(raw) as GeneratedIdea[]
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to parse ideas' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { ideas } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
