import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) return NextResponse.json({ error: 'Google token exchange failed' }, { status: 400 });

  const tokenData = (await tokenRes.json()) as { access_token: string; refresh_token?: string };

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) return NextResponse.json({ error: 'Failed to read Google profile' }, { status: 400 });

  const profile = (await profileRes.json()) as { email: string };
  const existing = await prisma.mailAccount.findUnique({
    where: { provider_email: { provider: 'GMAIL', email: profile.email } },
  });

  await prisma.mailAccount.upsert({
    where: { provider_email: { provider: 'GMAIL', email: profile.email } },
    update: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? existing?.refreshToken,
    },
    create: {
      provider: 'GMAIL',
      email: profile.email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    },
  });

  return NextResponse.redirect(new URL('/accounts', request.url));
}
