import { enqueueExtraction } from '@recruitmail/queue';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const email = await prisma.email.findUnique({ where: { id: params.id } });
  if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });

  if (!email.extracted) {
    const pending = await prisma.jobQueue.findFirst({
      where: {
        type: 'extract_email',
        status: { in: ['pending', 'processing'] },
        payload: { path: ['emailId'], equals: email.id },
      },
    });

    if (!pending) {
      await enqueueExtraction(email.id);
    }
  }

  return NextResponse.redirect(new URL(`/mail/${email.mailAccountId}`, request.url));
}
