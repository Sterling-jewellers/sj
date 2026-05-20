/**
 * Google Gemini AI service
 * Handles product description generation and competitor price estimation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  return new GoogleGenerativeAI(key);
}

/* ── Models to try in order (confirmed available on this API key) ───────────── */
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
const VISION_MODEL = 'gemini-2.0-flash-lite';

/* ── Strip markdown fences ──────────────────────────────────────────────────── */
function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
}

/* ── Call with 10s timeout + model fallback on quota errors ─────────────────── */
async function generate(prompt: string, maxTokens = 1024): Promise<string> {
  const genAI = getClient();
  let lastError: unknown;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      });

      // Race the API call against a 10-second timeout
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout after 10s')), 10_000),
        ),
      ]);

      console.log(`[gemini] success with ${modelName}`);
      return result.response.text().trim();

    } catch (err: unknown) {
      lastError = err;
      const msg = String((err as { message?: string })?.message || '');
      const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      const isNotFound = msg.includes('404') || msg.includes('not found');

      if ((isQuota || isNotFound) && modelName !== MODELS[MODELS.length - 1]) {
        console.warn(`[gemini] ${isQuota ? 'quota' : 'not found'} on ${modelName} — trying next…`);
        continue;
      }
      // Any other error (auth, bad request, etc.) — fail immediately
      break;
    }
  }

  const errMsg = String((lastError as { message?: string })?.message || lastError);
  throw new Error(`Gemini failed: ${errMsg}`);
}

/* ─────────────────────────────────────────────────────────────────────────────
   generateProductContent
──────────────────────────────────────────────────────────────────────────────── */
export async function generateProductContent(params: {
  name: string;
  category?: string;
  metalOptions?: { karat?: string; type: string }[];
  style?: string;
  settingType?: string;
  gemstone?: string;
}): Promise<{
  shortDescription: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}> {
  const metalStr = (params.metalOptions || [])
    .map(m => `${m.karat ?? ''} ${m.type}`.trim())
    .join(', ');

  const prompt = `You are a luxury jewellery copywriter for Sterling Jewellers, a UK-based fine jewellery brand.

Write the following for this product:
- Product name: ${params.name}
- Category: ${params.category || 'Fine Jewellery'}
- Metal options: ${metalStr || 'Not specified'}
- Style: ${params.style || 'Not specified'}
- Setting: ${params.settingType || 'Not specified'}
- Gemstone: ${params.gemstone || 'Not specified'}

Output ONLY a valid JSON object with these exact fields (no markdown, no extra text):
{
  "shortDescription": "One sentence under 120 chars for product listings",
  "description": "<p>3-4 sentence HTML description mentioning craftsmanship and occasion.</p>",
  "metaTitle": "SEO title under 60 chars including Sterling Jewellers",
  "metaDescription": "SEO meta description 140-160 chars with primary keyword",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  const raw = await generate(prompt, 1024);
  return JSON.parse(stripFences(raw));
}

/* ─────────────────────────────────────────────────────────────────────────────
   estimateCompetitorPrice
──────────────────────────────────────────────────────────────────────────────── */
export async function estimateCompetitorPrice(params: {
  name: string;
  metalType?: string;
  karat?: string;
  settingType?: string;
  bandStyle?: string;
  shankWidth?: string;
  gemstone?: string;
  caratWeight?: number;
}): Promise<{
  estimatedHighStreetPrice: number;
  rationale: string;
  comparables: string[];
}> {
  const prompt = `You are a luxury jewellery pricing expert with knowledge of UK high-street retailers (Mappin & Webb, Goldsmiths, Ernest Jones, Beaverbrooks).

Estimate the typical high-street retail price in GBP:
- Name: ${params.name}
- Metal: ${params.karat ? `${params.karat} ` : ''}${params.metalType || 'Not specified'}
- Setting: ${params.settingType || 'Not specified'}
- Band: ${params.bandStyle || 'Plain'}
- Gemstone: ${params.gemstone || 'None'}${params.caratWeight ? ` ${params.caratWeight}ct` : ''}

Return ONLY valid JSON, no markdown:
{"estimatedHighStreetPrice": 1200, "rationale": "one sentence", "comparables": ["Goldsmiths: approx £1300", "Ernest Jones: approx £1100"]}`;

  const raw = await generate(prompt, 256);
  return JSON.parse(stripFences(raw));
}

/* ─────────────────────────────────────────────────────────────────────────────
   describeProductImage  (Vision)
   Looks at the actual product photo and returns a precise description
   suitable for use in a FLUX lifestyle photo generation prompt.
──────────────────────────────────────────────────────────────────────────────── */
export async function describeProductImage(imageUrl: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  // Fetch image and convert to base64 for Gemini inline data
  const resp = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SterlingBot/1.0)' },
  });
  if (!resp.ok) throw new Error(`Could not fetch image for vision: ${resp.status}`);

  const buffer = Buffer.from(await resp.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = (resp.headers.get('content-type') || 'image/jpeg') as string;

  const result = await model.generateContent([
    {
      inlineData: { mimeType, data: base64 },
    },
    `You are describing a jewellery product for use in an AI image generation prompt.
Look at this jewellery photo carefully and describe ONLY the jewellery piece itself in 1-2 sentences.
Include: exact type (ring/bangle/earring/necklace/etc), metal colour, stone details, and distinctive design features.
Be very specific and precise. Do NOT mention the background, photography style, or anything other than the jewellery.
Example: "A white gold scatter bangle bracelet with 11 round brilliant diamonds in bezel settings arranged asymmetrically across a double-bar band."
Reply with ONLY the description, no extra text.`,
  ]);

  return result.response.text().trim();
}
