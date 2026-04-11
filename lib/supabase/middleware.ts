import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isPublicPath(pathname: string): boolean {
  const publicPrefixes = ['/login', '/signup', '/forgot-password', '/reset-password']
  return publicPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAuthMarketingPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/') ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/forgot-password/')
  )
}

/**
 * Refreshes the Supabase session from cookies and returns a response that may carry updated auth cookies.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  function redirectWithSessionCookies(url: URL): NextResponse {
    const redirectResponse = NextResponse.redirect(url)
    const fromSetCookie = supabaseResponse.headers.getSetCookie()
    fromSetCookie.forEach((cookie) => redirectResponse.headers.append('Set-Cookie', cookie))
    return redirectResponse
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return redirectWithSessionCookies(url)
  }

  if (user && isAuthMarketingPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return redirectWithSessionCookies(url)
  }

  return supabaseResponse
}
