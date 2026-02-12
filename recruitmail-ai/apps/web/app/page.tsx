import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const [emails, extractedJobs, postedJobs] = await Promise.all([
    prisma.email.count(),
    prisma.job.count({ where: { status: 'DRAFT' } }),
    prisma.job.count({ where: { status: 'POSTED' } }),
  ]);

  const stats = [
    { label: 'Total Emails', value: emails },
    { label: 'Extracted Jobs', value: extractedJobs },
    { label: 'Posted Jobs', value: postedJobs },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((item) => (
          <div key={item.label} className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-slate-500 text-sm">{item.label}</p>
            <p className="text-3xl font-bold mt-2">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
