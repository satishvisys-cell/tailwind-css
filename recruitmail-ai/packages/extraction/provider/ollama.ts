export async function extractWithOllama(prompt: string): Promise<string> {
  const response = await fetch('http://ollama:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
      prompt,
      stream: false,
      options: {
        temperature: 0,
        num_predict: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}
