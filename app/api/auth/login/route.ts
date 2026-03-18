import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { oauth2Client, COOKIE_NAME } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: 'postmessage'
    });

    if (!tokens.refresh_token) {
      console.warn('No refresh token received. Ensure "access_type: offline" and "prompt: consent" were used if this is the first time.');
    }

    const cookieStore = await cookies();
    
    // Store refresh token in HttpOnly cookie if it exists
    if (tokens.refresh_token) {
      cookieStore.set(COOKIE_NAME, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    return NextResponse.json({
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}
