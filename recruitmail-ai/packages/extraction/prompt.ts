import type { RegexHints } from './regex-parser.js';

export function buildExtractionPrompt(emailSubject: string, cleanedBody: string, hints: RegexHints): string {
  return `You are an information extractor for recruiter job emails.
Return ONLY valid JSON, no markdown, no prose.
Never hallucinate. If a field is missing, use null.
Use this exact schema:
{
  "jobTitle": string | null,
  "clientName": string | null,
  "employmentType": string | null,
  "duration": string | null,
  "locationCity": string | null,
  "locationState": string | null,
  "remoteType": string | null,
  "experience": string | null,
  "skills": string[],
  "description": string | null,
  "responsibilities": string | null,
  "qualifications": string | null,
  "contactName": string | null,
  "contactEmail": string | null,
  "contactPhone": string | null,
  "linkedinUrl": string | null
}

Subject: ${emailSubject}
Regex hints: ${JSON.stringify(hints)}
Email content:
${cleanedBody}`;
}
