import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createOAuth2Client, COOKIE_NAME, getRefreshCookieOptions } from '@/lib/auth-server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(COOKIE_NAME)?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()
    const rotatedRefreshToken = credentials.refresh_token ?? refreshToken

    cookieStore.set(COOKIE_NAME, rotatedRefreshToken, getRefreshCookieOptions())

    return NextResponse.json({
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date,
    })
  } catch (error: any) {
    console.error('Refresh error:', error)
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
}
