import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json()) as Partial<{
    jobTitle: string | null;
    clientName: string | null;
    employmentType: string | null;
    duration: string | null;
    locationCity: string | null;
    locationState: string | null;
    remoteType: string | null;
    experience: string | null;
    description: string | null;
    responsibilities: string | null;
    qualifications: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    linkedinUrl: string | null;
    skills: string[];
  }>;

  const job = await prisma.job.update({
    where: { id: params.id },
    data: {
      jobTitle: body.jobTitle ?? undefined,
      clientName: body.clientName ?? undefined,
      employmentType: body.employmentType ?? undefined,
      duration: body.duration ?? undefined,
      locationCity: body.locationCity ?? undefined,
      locationState: body.locationState ?? undefined,
      remoteType: body.remoteType ?? undefined,
      experience: body.experience ?? undefined,
      description: body.description ?? undefined,
      responsibilities: body.responsibilities ?? undefined,
      qualifications: body.qualifications ?? undefined,
      contactName: body.contactName ?? undefined,
      contactEmail: body.contactEmail ?? undefined,
      contactPhone: body.contactPhone ?? undefined,
      linkedinUrl: body.linkedinUrl ?? undefined,
      skills: body.skills ?? undefined,
    },
  });

  return NextResponse.json(job);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.job.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
