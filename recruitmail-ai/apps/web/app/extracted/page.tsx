import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function postJob(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await prisma.job.update({ where: { id }, data: { status: 'POSTED' } });
  revalidatePath('/extracted');
  revalidatePath('/posted');
}

async function deleteJob(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await prisma.job.delete({ where: { id } });
  revalidatePath('/extracted');
}

async function editJob(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const jobTitle = String(formData.get('jobTitle') || '');
  const description = String(formData.get('description') || '');
  await prisma.job.update({ where: { id }, data: { jobTitle: jobTitle || null, description: description || null } });
  revalidatePath('/extracted');
}

export default async function ExtractedPage() {
  const jobs = await prisma.job.findMany({ where: { status: 'DRAFT' }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Extracted Jobs (Draft)</h2>
      {jobs.map((job) => (
        <div key={job.id} className="bg-white border rounded-xl p-4 space-y-3">
          <form action={editJob} className="space-y-2">
            <input type="hidden" name="id" value={job.id} />
            <input name="jobTitle" defaultValue={job.jobTitle ?? ''} className="w-full border rounded p-2" />
            <textarea name="description" defaultValue={job.description ?? ''} className="w-full border rounded p-2 min-h-24" />
            <button className="bg-slate-700 text-white px-3 py-1 rounded">Save Edit</button>
          </form>
          <div className="flex gap-2">
            <form action={postJob}><input type="hidden" name="id" value={job.id} /><button className="bg-emerald-600 text-white px-3 py-1 rounded">Post</button></form>
            <form action={deleteJob}><input type="hidden" name="id" value={job.id} /><button className="bg-red-600 text-white px-3 py-1 rounded">Delete</button></form>
          </div>
        </div>
      ))}
    </div>
  );
}
