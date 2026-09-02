import { GoogleGenerativeAI } from '@google/generative-ai';

// ─────────────────────────────────────────────
// Gemini AI Client
// ─────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ใช้ gemini-2.0-flash — เร็ว ฟรี เหมาะกับงาน text
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
      ? `You are an expert AI prompt engineer. Your job is to take a user's simple prompt and enhance it to produce better results with AI image generators like Midjourney, DALL·E, and Stable Diffusion.

Rules:
- Keep the original intent and subject
- Add details about style, lighting, composition, quality
- Add relevant parameters (--ar, --style, etc.) if appropriate
- Output ONLY the enhanced prompt, no explanations
- Keep it concise but detailed (max 200 words)
- Write in English even if input is in other languages
- Do NOT wrap in quotes`
      : `You are an expert code reviewer and optimizer. Your job is to improve the given code.

Rules:
- Add helpful comments in English
- Improve code quality and readability
- Fix any obvious bugs or anti-patterns
- Keep the same functionality
- Output ONLY the improved code, no explanations
- Do NOT wrap in markdown code blocks`;

  const prompt = `${systemPrompt}\n\nOriginal:\n${originalContent}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('AI ไม่สามารถสร้างผลลัพธ์ได้');
  }

  return text.trim();
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
      ? `Analyze the following code snippet and suggest 3-5 relevant tags.
Focus on: programming language, framework, library, concept, use case.
Return ONLY a JSON array of tag strings, nothing else.
Example: ["Python", "FastAPI", "REST API", "Backend"]
Do NOT include # symbol in tags.`
      : `Analyze the following AI prompt and suggest 3-5 relevant tags.
Focus on: AI model, art style, subject, technique, mood.
Return ONLY a JSON array of tag strings, nothing else.
Example: ["Midjourney", "Cyberpunk", "Character Design", "Neon"]
Do NOT include # symbol in tags.`;

  const prompt = `${systemPrompt}\n\nTitle: ${title}\nContent: ${content}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text().trim();

  // Parse JSON array from response
  try {
    // ลอง clean markdown code block ถ้ามี
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
    // ถ้า parse JSON ไม่ได้ ลอง split ด้วย comma
    return text
      .replace(/[\[\]"']/g, '')
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0)
      .slice(0, 5);
  }

  return [];
}
