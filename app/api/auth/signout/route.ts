import { createAuthClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createAuthClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url))
}
