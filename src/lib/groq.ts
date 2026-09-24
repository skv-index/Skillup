/**
 * Shared Groq client — minimal OpenAI-compatible chat wrapper.
 * Key via VITE_GROQ_API_KEY. Never put service/secret keys here.
 */

export const GROQ_MODEL =
  (import.meta.env.VITE_GROQ_MODEL as string | undefined) || 'openai/gpt-oss-120b';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export function groqEnabled(): boolean {
  return Boolean(import.meta.env.VITE_GROQ_API_KEY as string | undefined);
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function call(messages: ChatMessage[], json: boolean, temperature: number): Promise<Response> {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!key) throw new Error('Groq is not configured (VITE_GROQ_API_KEY missing).');

  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
}

async function errorFrom(res: Response): Promise<Error> {
  let message = `Groq request failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body?.error?.message) message = body.error.message;
  } catch {
    /* keep default */
  }
  return new Error(message);
}

export async function groqChat(
  messages: ChatMessage[],
  opts: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  const json = opts.json ?? false;
  const temperature = opts.temperature ?? 0.4;

  let res = await call(messages, json, temperature);

  // Some models reject response_format — retry once without it.
  if (!res.ok && json && res.status === 400) {
    res = await call(messages, false, temperature);
  }
  if (!res.ok) throw await errorFrom(res);

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data?.choices?.[0]?.message?.content ?? '';
}

export function parseJsonLoose<T>(raw: string): T {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    /* fall through to substring search */
  }
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(stripped.slice(start, end + 1)) as T;
  const aStart = stripped.indexOf('[');
  const aEnd = stripped.lastIndexOf(']');
  if (aStart >= 0 && aEnd > aStart) return JSON.parse(stripped.slice(aStart, aEnd + 1)) as T;
  throw new Error('AI returned invalid JSON.');
}

/** Ask for JSON and parse defensively (strips code fences, finds first {...}). */
export async function groqJson<T>(
  messages: ChatMessage[],
  temperature = 0.3,
): Promise<T> {
  const raw = await groqChat(messages, { json: true, temperature });
  return parseJsonLoose<T>(raw);
}