import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';

type ParsedEmail = { subject: string; bodyText: string; receivedAt: Date };

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function refreshMicrosoftToken(refreshToken: string): Promise<string | null> {
  const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'offline_access Mail.Read User.Read',
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function fetchGmailEmails(accessToken: string): Promise<ParsedEmail[]> {
  const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) return [];

  const listData = (await listRes.json()) as { messages?: Array<{ id: string }> };
  const messages = listData.messages ?? [];

  const parsed = await Promise.all(
    messages.map(async (m) => {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!detailRes.ok) return null;

      const detail = (await detailRes.json()) as {
        internalDate?: string;
        payload?: {
          headers?: Array<{ name: string; value: string }>;
          body?: { data?: string };
          parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
        };
      };

      const headers = detail.payload?.headers ?? [];
      const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value ?? 'No Subject';
      const textPart = detail.payload?.parts?.find((part) => part.mimeType?.includes('text/plain'));
      const bodyData = textPart?.body?.data ?? detail.payload?.body?.data ?? '';

      return {
        subject,
        bodyText: bodyData ? decodeBase64Url(bodyData) : '',
        receivedAt: new Date(Number(detail.internalDate || Date.now())),
      };
    }),
  );

  return parsed.filter(Boolean) as ParsedEmail[];
}

async function fetchOutlookEmails(accessToken: string): Promise<ParsedEmail[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=20&$select=subject,receivedDateTime,bodyPreview', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return [];

  const data = (await response.json()) as { value: Array<{ subject: string; bodyPreview: string; receivedDateTime: string }> };
  return data.value.map((m) => ({
    subject: m.subject || 'No Subject',
    bodyText: m.bodyPreview || '',
    receivedAt: new Date(m.receivedDateTime),
  }));
}

async function fetchImapEmails(host: string, port: number, user: string, pass: string): Promise<ParsedEmail[]> {
  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const result: ParsedEmail[] = [];
      for await (const message of client.fetch({ all: true }, { envelope: true, source: true })) {
        if (result.length >= 20) break;
        const subject = message.envelope?.subject || 'No Subject';
        const date = message.envelope?.date ? new Date(message.envelope.date) : new Date();
        const bodyText = message.source ? Buffer.from(message.source).toString('utf8').slice(0, 20000) : '';
        result.push({ subject, bodyText, receivedAt: date });
      }
      return result;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const accountId = String(formData.get('accountId') || '');

  const account = await prisma.mailAccount.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  let accessToken = account.accessToken ?? null;

  if (!accessToken && account.provider !== 'SMTP') {
    return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
  }

  if (account.provider === 'GMAIL' && accessToken) {
    const probe = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!probe.ok && account.refreshToken) {
      const refreshed = await refreshGoogleToken(account.refreshToken);
      if (refreshed) {
        accessToken = refreshed;
        await prisma.mailAccount.update({ where: { id: account.id }, data: { accessToken: refreshed } });
      }
    }
  }

  if (account.provider === 'OUTLOOK' && accessToken) {
    const probe = await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!probe.ok && account.refreshToken) {
      const refreshed = await refreshMicrosoftToken(account.refreshToken);
      if (refreshed) {
        accessToken = refreshed;
        await prisma.mailAccount.update({ where: { id: account.id }, data: { accessToken: refreshed } });
      }
    }
  }

  let emails: ParsedEmail[] = [];

  if (account.provider === 'GMAIL' && accessToken) {
    emails = await fetchGmailEmails(accessToken);
  } else if (account.provider === 'OUTLOOK' && accessToken) {
    emails = await fetchOutlookEmails(accessToken);
  } else if (account.provider === 'SMTP') {
    if (!account.smtpHost || !account.smtpPort || !account.smtpUser || !account.smtpPass) {
      return NextResponse.json({ error: 'SMTP/IMAP account is incomplete' }, { status: 400 });
    }
    emails = await fetchImapEmails(account.smtpHost, account.smtpPort, account.smtpUser, account.smtpPass);
  }

  for (const email of emails) {
    const exists = await prisma.email.findFirst({
      where: {
        mailAccountId: account.id,
        subject: email.subject,
        receivedAt: email.receivedAt,
      },
    });

    if (!exists) {
      await prisma.email.create({
        data: {
          mailAccountId: account.id,
          subject: email.subject,
          bodyText: email.bodyText,
          receivedAt: email.receivedAt,
        },
      });
    }
  }

  return NextResponse.redirect(new URL(`/mail/${account.id}`, request.url));
}
