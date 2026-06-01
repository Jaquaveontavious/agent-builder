import { createAuthClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  return Response.json({ email: user.email, id: user.id })
}
