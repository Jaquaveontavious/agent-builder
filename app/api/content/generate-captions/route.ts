import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'

const PLATFORM_PROMPTS: Record<string, string> = {
  instagram:
    'Write an Instagram caption. Make it visual, emotional, and conversational. Include 3–5 relevant hashtags at the end. Max 2200 characters but aim for punchy and concise.',
  facebook:
    'Write a Facebook post caption. Keep it conversational and community-focused. Slightly longer and more descriptive than Instagram. No hashtags needed. Max 500 characters.',
  tiktok:
    'Write a TikTok caption. Make it punchy, trend-aware, and energetic. End with a clear call to action (like, follow, comment). Max 150 characters.',
  google_business:
    'Write a Google Business post caption. Keep it professional, use local SEO keywords naturally, describe the work or product clearly. Max 1500 characters.',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      image_base64: string
      image_media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
      context?: string
      file_path?: string
      file_url?: string
    }

    const { image_base64, image_media_type, context, file_path, file_url } = body

    if (!image_base64 || !image_media_type) {
      return NextResponse.json({ success: false, error: 'image_base64 and image_media_type are required' }, { status: 400 })
    }

    const contextNote = context?.trim()
      ? `\n\nContext from the user about this image: "${context.trim()}"`
      : ''

    const platforms = Object.keys(PLATFORM_PROMPTS)
    const captions: Record<string, string> = {}

    await Promise.all(
      platforms.map(async (platform) => {
        const message = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: image_media_type,
                    data: image_base64,
                  },
                },
                {
                  type: 'text',
                  text: `${PLATFORM_PROMPTS[platform]}${contextNote}\n\nRespond with only the caption text — no labels, no explanation, no quotes around it.`,
                },
              ],
            },
          ],
        })

        const content = message.content[0]
        captions[platform] = content.type === 'text' ? content.text.trim() : ''
      })
    )

    const service = createServiceClient()

    let mediaId: string | null = null
    if (file_path && file_url) {
      const { data: media } = await service
        .from('job_media')
        .insert({
          user_id: user.id,
          file_path,
          file_url,
          platform_captions: captions,
          caption_generated: captions['instagram'] ?? '',
        })
        .select('id')
        .single()
      mediaId = media?.id ?? null
    }

    return NextResponse.json({ success: true, data: { captions, media_id: mediaId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
