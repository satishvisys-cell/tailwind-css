import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.update({
    where: { id: params.id },
    data: { status: 'POSTED' },
  });

  return NextResponse.json(job);
}
