export type RegexHints = {
  contactEmail: string | null;
  contactPhone: string | null;
  linkedinUrl: string | null;
  employmentType: string | null;
  remoteType: string | null;
};

export function regexPreParse(text: string): RegexHints {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/\S+/i);
  const employmentTypeMatch = text.match(/\b(contract|full[-\s]?time|part[-\s]?time|c2c|w2)\b/i);
  const remoteTypeMatch = text.match(/\b(remote|hybrid|onsite|on[-\s]?site)\b/i);

  return {
    contactEmail: emailMatch?.[0] ?? null,
    contactPhone: phoneMatch?.[0] ?? null,
    linkedinUrl: linkedinMatch?.[0] ?? null,
    employmentType: employmentTypeMatch?.[0] ?? null,
    remoteType: remoteTypeMatch?.[0] ?? null,
  };
}
