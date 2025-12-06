import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // In development, redirect to localhost
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // In production, redirect to the forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Fallback to the configured site URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://summitsecure.netlify.app'
        return NextResponse.redirect(`${siteUrl}${next}`)
      }
    }
  }

  // Return the user to the login page if something went wrong
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://summitsecure.netlify.app'
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_error`)
}
