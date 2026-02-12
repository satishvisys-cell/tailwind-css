import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  const tenant = process.env.MICROSOFT_TENANT_ID || 'common';

  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
      scope: 'offline_access Mail.Read User.Read',
      code,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI || '',
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) return NextResponse.json({ error: 'Microsoft token exchange failed' }, { status: 400 });

  const tokenData = (await tokenRes.json()) as { access_token: string; refresh_token?: string };
  const profileRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) return NextResponse.json({ error: 'Failed to read Microsoft profile' }, { status: 400 });

  const profile = (await profileRes.json()) as { mail?: string; userPrincipalName: string };
  const email = profile.mail || profile.userPrincipalName;

  const existing = await prisma.mailAccount.findUnique({
    where: { provider_email: { provider: 'OUTLOOK', email } },
  });

  await prisma.mailAccount.upsert({
    where: { provider_email: { provider: 'OUTLOOK', email } },
    update: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? existing?.refreshToken,
    },
    create: {
      provider: 'OUTLOOK',
      email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    },
  });

  return NextResponse.redirect(new URL('/accounts', request.url));
}
