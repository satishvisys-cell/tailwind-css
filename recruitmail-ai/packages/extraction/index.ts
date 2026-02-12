import { cleanEmailBody } from './cleaner.js';
import { buildEmailHash } from './hash.js';
import { buildExtractionPrompt } from './prompt.js';
import { regexPreParse } from './regex-parser.js';
import { extractWithOllama } from './provider/ollama.js';
import { extractWithOpenAI } from './provider/openai.js';
import { extractedJobSchema, type ExtractedJob } from './schema.js';

export async function extractStructuredJob(subject: string, bodyText: string): Promise<{ hash: string; data: ExtractedJob }> {
  const cleaned = cleanEmailBody(bodyText);
  const hints = regexPreParse(cleaned);
  const prompt = buildExtractionPrompt(subject, cleaned, hints);
  const provider = process.env.LLM_PROVIDER || 'ollama';

  const raw = provider === 'openai' ? await extractWithOpenAI(prompt) : await extractWithOllama(prompt);
  const parsed = JSON.parse(raw) as unknown;
  const data = extractedJobSchema.parse(parsed);
  const hash = buildEmailHash(subject, cleaned);

  return { hash, data };
}

export { extractedJobSchema };
