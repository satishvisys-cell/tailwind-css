import { createHash } from 'node:crypto';

export function buildEmailHash(subject: string, body: string): string {
  return createHash('sha256').update(`${subject}::${body}`).digest('hex');
}
