import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { oauth2Client, COOKIE_NAME } from '@/lib/auth-server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { tokens } = await oauth2Client.refreshAccessToken();

    return NextResponse.json({
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    // If refresh token is invalid/revoked, clear the cookie
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
}
