import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, getRefreshCookieOptions } from '@/lib/auth-server'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    ...getRefreshCookieOptions(),
    maxAge: 0,
  })

  return NextResponse.json({ success: true })
}
