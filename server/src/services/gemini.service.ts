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

IMPORTANT RULES:
- Do NOT mention any prices, costs, values, or price comparisons anywhere in any field
- Do NOT use words like "affordable", "luxury price", "investment", "worth", "value for money", "competitively priced"
- Focus purely on craftsmanship, design, materials, occasions, and emotions

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
   suitable for use in AI image generation prompts.
──────────────────────────────────────────────────────────────────────────────── */
export async function describeProductImage(imageUrl: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  const resp = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SterlingBot/1.0)' },
  });
  if (!resp.ok) throw new Error(`Could not fetch image for vision: ${resp.status}`);

  const buffer = Buffer.from(await resp.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = (resp.headers.get('content-type') || 'image/jpeg') as string;

  const result = await model.generateContent([
    { inlineData: { mimeType, data: base64 } },
    `You are describing a jewellery product for use in an AI image generation prompt.
Look at this jewellery photo carefully and describe ONLY the jewellery piece itself in 1-2 sentences.
Include: exact type (ring/bangle/earring/necklace/etc), metal colour, stone details, and distinctive design features.
Be very specific and precise. Do NOT mention the background, photography style, or anything other than the jewellery.
Example: "A white gold scatter bangle bracelet with 11 round brilliant diamonds in bezel settings arranged asymmetrically across a double-bar band."
Reply with ONLY the description, no extra text.`,
  ]);

  return result.response.text().trim();
}

/* ─────────────────────────────────────────────────────────────────────────────
   Gemini Image Generation  (gemini-2.0-flash-preview-image-generation)

   The @google/generative-ai SDK v0.24 does not expose responseModalities in
   its TypeScript types, so we call the REST endpoint directly.
   Returns raw base64 + mimeType for the caller to upload/store.
──────────────────────────────────────────────────────────────────────────────── */

/** Models tried in order; all support generateContent + image output on v1beta */
const IMAGE_GEN_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
] as const;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Fetch a URL, return base64 string + content-type */
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const resp = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SterlingBot/1.0)' },
  });
  if (!resp.ok) throw new Error(`Could not fetch image (${resp.status}): ${imageUrl}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  return {
    base64: buffer.toString('base64'),
    mimeType: resp.headers.get('content-type') || 'image/jpeg',
  };
}

/**
 * Core image generation call via the REST API.
 * Tries each model in IMAGE_GEN_MODELS in order, retrying on 503 overload
 * (up to 3 attempts per model with exponential backoff before moving on).
 */
export async function generateImageFromProduct(
  productImageUrl: string,
  prompt: string,
): Promise<{ base64: string; mimeType: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const { base64: inputBase64, mimeType: inputMime } = await fetchImageAsBase64(productImageUrl);

  const body = JSON.stringify({
    contents: [{
      parts: [
        { inline_data: { mime_type: inputMime, data: inputBase64 } },
        { text: prompt },
      ],
    }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  });

  let lastError = '';

  for (const model of IMAGE_GEN_MODELS) {
    // Up to 3 attempts per model for 503 overload
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`[gemini-img] model: ${model} | attempt: ${attempt}`);

      // Hard 60-second timeout per request — Gemini image gen typically takes 10-30s
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60_000);

      let apiResp: Response;
      try {
        apiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: controller.signal },
        );
      } catch (fetchErr) {
        clearTimeout(timer);
        const isTimeout = (fetchErr as Error).name === 'AbortError';
        lastError = `${model} (${isTimeout ? 'timeout after 60s' : String(fetchErr)})`;
        console.warn(`[gemini-img] ${lastError}`);
        if (attempt < 3) { await sleep(2000); continue; }
        break;
      }
      clearTimeout(timer);

      const raw = await apiResp.text();

      if (apiResp.ok) {
        // REST API returns camelCase keys (inlineData) in responses
        type ImgPart = { inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
        let data: { candidates?: Array<{ content?: { parts?: ImgPart[] } }> };
        try { data = JSON.parse(raw); } catch { throw new Error('Gemini returned non-JSON response'); }

        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          // Handle both camelCase (REST response) and snake_case
          const img = part.inlineData ?? (part.inline_data ? { mimeType: part.inline_data.mime_type, data: part.inline_data.data } : undefined);
          if (img?.data) {
            console.log(`[gemini-img] success | model: ${model} | mime: ${img.mimeType}`);
            return { base64: img.data, mimeType: img.mimeType };
          }
        }
        console.warn(`[gemini-img] ${model} returned no image part:`, JSON.stringify(parts).slice(0, 200));
        return null; // Model responded but returned no image — don't retry
      }

      // Error response
      const is503 = apiResp.status === 503;
      const is429 = apiResp.status === 429;
      lastError = `${model} (${apiResp.status}): ${raw.slice(0, 150)}`;
      console.warn(`[gemini-img] ${lastError}`);

      if ((is503 || is429) && attempt < 3) {
        const wait = attempt * 3000; // 3s, 6s
        console.log(`[gemini-img] overloaded — waiting ${wait}ms before retry…`);
        await sleep(wait);
        continue; // retry same model
      }

      break; // non-retryable error or exhausted retries — try next model
    }
  }

  throw new Error(`All Gemini image models failed. Last error: ${lastError}`);
}

/* ─────────────────────────────────────────────────────────────────────────────
   generateProductSideView
   Generates a 45° side-angle studio photo of the exact same product.
──────────────────────────────────────────────────────────────────────────────── */
export async function generateProductSideView(
  imageUrl: string,
  productName: string,
  metalType?: string,
): Promise<{ base64: string; mimeType: string } | null> {
  const metalStr = metalType ? ` ${metalType}` : '';

  // Detect if it's a bangle/bracelet — needs top-down view to show the full circle
  const isBangle = /bangle|bracelet/i.test(productName);

  const prompt = isBangle
    ? `This is a studio product photograph of a "${productName}"${metalStr} jewellery bangle. ` +
      `Reproduce this EXACT bangle — do NOT change ANYTHING about the product itself: the metal colour must stay exactly as shown${metalStr ? ` (${metalStr})` : ''}, the diamond positions and sizes must stay identical, the bar design and all details must stay identical. ` +
      `The ONLY change is the camera angle: shoot from DIRECTLY ABOVE with the camera pointing straight down, bangle lying perfectly flat on a white surface. ` +
      `Show the COMPLETE full circular/oval shape with the hollow centre clearly visible, all diamonds and design going all the way around the full ring. ` +
      `Pure white studio background, pure flat overhead shot, no perspective distortion. No person, no hands, no body parts.`
    : `This is a studio product photograph of a "${productName}"${metalStr} jewellery piece. ` +
      `Reproduce this EXACT piece — do NOT change ANYTHING about the product: the metal colour${metalStr ? ` (${metalStr})` : ''}, stones, design, and finish must all stay identical to the input photo. ` +
      `The ONLY change is the camera angle: shoot from DIRECTLY ABOVE with the camera pointing straight down, piece lying flat. ` +
      `Pure white studio background. No person, no hands, no body parts.`;

  return generateImageFromProduct(imageUrl, prompt);
}

/* ─────────────────────────────────────────────────────────────────────────────
   generateLifestylePhoto
   Shows the product being worn in a luxury lifestyle setting.
──────────────────────────────────────────────────────────────────────────────── */

function detectJewelleryType(productName: string, categorySlug: string): string {
  const combined = (productName + ' ' + categorySlug).toLowerCase();
  if (combined.includes('bangle'))                                           return 'bangle';
  if (combined.includes('bracelet'))                                         return 'bracelet';
  if (combined.includes('earring') || combined.includes('stud') || combined.includes('hoop')) return 'earring';
  if (combined.includes('necklace'))                                         return 'necklace';
  if (combined.includes('pendant'))                                          return 'pendant';
  if (combined.includes('chain'))                                            return 'chain';
  if (combined.includes('ring'))                                             return 'ring';
  return 'jewellery';
}

function buildWornPrompt(type: string, productName: string, metalType?: string): string {
  const metalStr = metalType ? ` ${metalType}` : '';
  const base =
    `This is a product photograph of a "${productName}"${metalStr} jewellery piece. ` +
    `Generate a photorealistic luxury lifestyle photograph showing this EXACT ${type} being elegantly worn. ` +
    `CRITICAL: do NOT change ANYTHING about the jewellery — the metal colour${metalStr ? ` (${metalStr})` : ''}, diamond positions, design details, and finish must be IDENTICAL to the product photo. Only add a person wearing it. `;
  const quality = 'Soft warm natural window light. Shallow depth of field with beautifully blurred background. High-end fashion editorial quality, 8K photorealistic.';

  const scenes: Record<string, string> = {
    ring:     base + `Show it on the ring finger of a slender woman's hand, hand extended gracefully with fingers gently relaxed. ${quality}`,
    bangle:   base + `Show it worn on an elegant woman's wrist, arm extended to the side so the bangle encircles the wrist naturally — the oval bangle seen in its correct orientation. ${quality}`,
    bracelet: base + `Show it clasped around an elegant woman's wrist, hand relaxed, viewed from a slight angle. ${quality}`,
    earring:  base + `Show it worn on an elegant woman's ear. Hair gently tucked back to reveal the ear. Face turned slightly to showcase the earring clearly. ${quality}`,
    necklace: base + `Show it draped around a woman's neck and décolletage, viewed straight-on. Soft neckline top visible. ${quality}`,
    pendant:  base + `Show the pendant hanging at the neckline of an elegant woman, viewed straight-on. ${quality}`,
    chain:    base + `Show the chain around a woman's neck, viewed straight-on. ${quality}`,
  };

  return scenes[type] ?? (base + `Show it worn elegantly by a woman. ${quality}`);
}

export async function generateLifestylePhoto(
  imageUrl: string,
  productName: string,
  categorySlug: string,
  metalType?: string,
): Promise<{ base64: string; mimeType: string } | null> {
  const type = detectJewelleryType(productName, categorySlug);
  console.log('[gemini-img] lifestyle | type:', type, '| product:', productName);
  const prompt = buildWornPrompt(type, productName, metalType);
  return generateImageFromProduct(imageUrl, prompt);
}
