import { prisma } from '@/lib/prisma';

export default async function PostedPage() {
  const jobs = await prisma.job.findMany({ where: { status: 'POSTED' }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Posted Jobs</h2>
      {jobs.map((job) => (
        <div key={job.id} className="bg-white border rounded-xl p-4">
          <p className="font-medium">{job.jobTitle ?? 'Untitled role'}</p>
          <p className="text-sm text-slate-500">{job.clientName ?? 'Unknown client'}</p>
          <p className="text-sm mt-2 whitespace-pre-wrap">{job.description}</p>
        </div>
      ))}
    </div>
  );
}
