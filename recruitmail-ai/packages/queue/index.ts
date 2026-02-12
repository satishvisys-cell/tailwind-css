import { prisma } from '@recruitmail/db';

export async function enqueueExtraction(emailId: string): Promise<void> {
  await prisma.jobQueue.create({
    data: {
      type: 'extract_email',
      payload: { emailId },
      status: 'pending',
    },
  });
}

export async function claimNextJob() {
  const rows = await prisma.$transaction(async (tx) => {
    const selected = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "JobQueue"
      WHERE status = 'pending' AND "runAt" <= NOW()
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `;

    if (!selected.length) {
      return [] as Array<{ id: string; type: string; payload: unknown; attempts: number }>;
    }

    const id = selected[0].id;
    return tx.$queryRaw<Array<{ id: string; type: string; payload: unknown; attempts: number }>>`
      UPDATE "JobQueue"
      SET status = 'processing', "lockedAt" = NOW(), attempts = attempts + 1
      WHERE id = ${id}
      RETURNING id, type, payload, attempts
    `;
  });

  return rows[0] ?? null;
}

export async function markJobCompleted(id: string): Promise<void> {
  await prisma.jobQueue.update({
    where: { id },
    data: {
      status: 'completed',
      lockedAt: null,
    },
  });
}

export async function markJobFailed(id: string, attempts: number, errorMessage: string): Promise<void> {
  const shouldRetry = attempts < 3;
  const current = await prisma.jobQueue.findUnique({ where: { id } });
  if (!current) return;

  await prisma.jobQueue.update({
    where: { id },
    data: {
      status: shouldRetry ? 'pending' : 'failed',
      runAt: shouldRetry ? new Date(Date.now() + 60_000) : current.runAt,
      payload: {
        ...(current.payload as Record<string, unknown>),
        error: errorMessage.slice(0, 500),
      },
      lockedAt: null,
    },
  });
}
