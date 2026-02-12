import { z } from 'zod';

const nullableString = z.string().trim().min(1).nullable();

export const extractedJobSchema = z.object({
  jobTitle: nullableString,
  clientName: nullableString,
  employmentType: nullableString,
  duration: nullableString,
  locationCity: nullableString,
  locationState: nullableString,
  remoteType: nullableString,
  experience: nullableString,
  skills: z.array(z.string().trim().min(1)).default([]),
  description: nullableString,
  responsibilities: nullableString,
  qualifications: nullableString,
  contactName: nullableString,
  contactEmail: nullableString,
  contactPhone: nullableString,
  linkedinUrl: nullableString,
});

export type ExtractedJob = z.infer<typeof extractedJobSchema>;
