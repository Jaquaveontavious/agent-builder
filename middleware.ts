import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/agents', '/grid', '/workspace', '/chat', '/hub', '/underwriter', '/market-pulse', '/offer-writer', '/lead-nurture', '/skip-tracer', '/dashboard/suite']
const AUTH_ONLY = ['/auth/login']

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = req.nextUrl.pathname
  const isProtected = PROTECTED.some((p) => path.startsWith(p))
  const isAuthOnly = AUTH_ONLY.some((p) => path.startsWith(p))

  if (!user && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Don't redirect logged-in users away from /auth/login — let the page sign them out first
  // if (user && isAuthOnly) {
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/agents/:path*', '/grid/:path*', '/grid', '/workspace/:path*', '/workspace', '/chat/:path*', '/chat', '/hub/:path*', '/hub', '/underwriter/:path*', '/underwriter', '/market-pulse/:path*', '/market-pulse', '/offer-writer/:path*', '/offer-writer', '/lead-nurture/:path*', '/lead-nurture', '/skip-tracer/:path*', '/skip-tracer', '/auth/login'],
}
