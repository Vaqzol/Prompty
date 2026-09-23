import { GoogleGenerativeAI, type EnhancedGenerateContentResponse } from '@google/generative-ai';

// ─────────────────────────────────────────────
// Gemini AI Client
// ─────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Allow deployments to select their available Gemini model.
const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const model = genAI.getGenerativeModel({ model: modelName });
// Gemini 3 supports low thinking; keep other configured model families unchanged.
const thinkingOptions = modelName.startsWith('gemini-3') ? { thinkingConfig: { thinkingLevel: 'low' } } : {};

// ─────────────────────────────────────────────
// 1. AI ปรับปรุง Prompt
// ─────────────────────────────────────────────
export async function enhancePrompt(
  originalContent: string,
  type: 'CODE' | 'PROMPT'
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt =
    type === 'PROMPT'
      ? `You are an AI prompt engineer. Enhance the user's simple prompt for AI image generators (Midjourney, DALL·E, Stable Diffusion).
Rules: Keep original intent. Add style, lighting, quality details. Output ONLY the enhanced prompt in English. Max 80 words. No quotes. No explanation.`
      : `You are a code reviewer. Improve the given code: add concise English comments, fix obvious issues, keep same functionality.
Output ONLY the improved code. No markdown blocks. No explanation.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nOriginal:\n${originalContent}` }] }],
    generationConfig: {
      ...thinkingOptions,
      maxOutputTokens: 4096, // Leave room for reasoning as well as the final answer.
      temperature: 0.7,
    },
  }, { timeout: 45000 });

  validateResponse(result.response);
  const text = result.response.text()?.trim();
  if (!text) throw new Error('AI_EMPTY_OUTPUT');
  return text;
}

// ─────────────────────────────────────────────
// 2. AI แนะนำ Tags
// ─────────────────────────────────────────────
export async function suggestTags(
  title: string,
  content: string,
  type: 'CODE' | 'PROMPT'
): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt =
    type === 'CODE'
      ? `Suggest 3-5 tags for this code. Focus on: language, framework, concept. Return ONLY a JSON array. Example: ["Python","FastAPI","Backend"]. No # symbol.`
      : `Suggest 3-5 tags for this AI prompt. Focus on: AI model, style, subject. Return ONLY a JSON array. Example: ["Midjourney","Cyberpunk","Neon"]. No # symbol.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nTitle: ${title}\nContent: ${content}` }] }],
    generationConfig: {
      ...thinkingOptions,
      maxOutputTokens: 4096, // 100 tokens can be exhausted before any tags are returned.
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  }, { timeout: 45000 });

  validateResponse(result.response);
  const text = result.response.text()?.trim() ?? '';
  if (!text) throw new Error('AI_EMPTY_OUTPUT');

  // Parse JSON array from response
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tags = JSON.parse(cleaned);
    if (Array.isArray(tags)) {
      return tags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.replace(/^#/, '').trim())
        .filter((t) => t.length > 0)
        .slice(0, 5);
    }
  } catch {
    return text
      .replace(/[\[\]"']/g, '')
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0)
      .slice(0, 5);
  }

  return [];
}

function validateResponse(response: EnhancedGenerateContentResponse) {
  const reason = response.candidates?.[0]?.finishReason;
  if (reason === 'MAX_TOKENS') throw new Error('AI_OUTPUT_TRUNCATED');
  if (response.promptFeedback?.blockReason || (reason && reason !== 'STOP')) throw new Error('AI_BLOCKED_OUTPUT');
}
