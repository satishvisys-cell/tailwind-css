import { NextResponse } from 'next/server';

export async function GET() {
  const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI || '',
    response_mode: 'query',
    scope: 'offline_access Mail.Read User.Read',
  });

  return NextResponse.redirect(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`);
}
