import { prisma } from '@recruitmail/db';
import { extractStructuredJob } from '@recruitmail/extraction';
import { claimNextJob, markJobCompleted, markJobFailed } from '@recruitmail/queue';

const pollMs = Number(process.env.WORKER_POLL_MS || 3000);

async function processExtraction(emailId: string) {
  const email = await prisma.email.findUnique({ where: { id: emailId } });
  if (!email || email.extracted) return;

  const existingJobByEmail = await prisma.job.findUnique({ where: { emailId: email.id } });
  if (existingJobByEmail) {
    await prisma.email.update({ where: { id: email.id }, data: { extracted: true } });
    return;
  }

  const result = await extractStructuredJob(email.subject, email.bodyText);
  const existingJobByHash = await prisma.job.findUnique({ where: { emailHash: result.hash } });
  if (existingJobByHash) {
    await prisma.email.update({ where: { id: email.id }, data: { extracted: true } });
    return;
  }

  await prisma.job.create({
    data: {
      emailId: email.id,
      emailHash: result.hash,
      ...result.data,
      status: 'DRAFT',
    },
  });

  await prisma.email.update({ where: { id: email.id }, data: { extracted: true } });
}

async function loop() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await claimNextJob();
    if (!job) {
      await new Promise((resolve) => setTimeout(resolve, pollMs));
      continue;
    }

    try {
      if (job.type !== 'extract_email') {
        await markJobCompleted(job.id);
        continue;
      }

      const payload = job.payload as { emailId?: string };
      if (!payload.emailId) {
        await markJobFailed(job.id, job.attempts, 'Missing emailId payload');
        continue;
      }

      await processExtraction(payload.emailId);
      await markJobCompleted(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown worker error';
      await markJobFailed(job.id, job.attempts, message);
    }
  }
}

loop().catch((error) => {
  console.error('Worker fatal error', error);
  process.exit(1);
});
