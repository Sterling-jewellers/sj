/**
 * Replicate FLUX lifestyle photo generation
 * Generates a luxury "worn" photo for a jewellery product using FLUX-schnell.
 */

const REPLICATE_API = 'https://api.replicate.com/v1';
const MAX_POLLS     = 24;   // 24 × 5s = 2 min max wait
const POLL_INTERVAL = 5_000;

/* ── Prompt builder ─────────────────────────────────────────────────────────── */
function buildPrompt(productName: string, categorySlug: string, metalType?: string): string {
  const metal = metalType ? metalType.replace(/-/g, ' ') : 'gold';

  const base = `professional jewellery editorial photography, ${metal}, luxury brand, soft studio lighting, 8k photorealistic, high-end fashion`;

  const categoryMap: Record<string, string> = {
    'engagement-rings':  `close-up of an elegant woman's hand wearing a diamond ${productName}, slender fingers, blurred bokeh background, ${base}`,
    'wedding-rings':     `close-up of elegant hands wearing ${productName} wedding bands, soft natural light, ${base}`,
    'wedding-bands':     `close-up of elegant hands wearing ${productName} wedding bands, soft natural light, ${base}`,
    'eternity-rings':    `close-up of an elegant woman's finger wearing a sparkling ${productName} eternity ring, ${base}`,
    'rings':             `close-up of an elegant woman's hand wearing ${productName}, graceful fingers, ${base}`,
    'ladies-rings':      `close-up of an elegant woman's hand wearing ${productName}, graceful fingers, ${base}`,
    'gents-rings':       `close-up of a man's hand wearing a ${productName} ring, masculine, minimal background, ${base}`,
    'signet-rings':      `close-up of a hand wearing a ${productName} signet ring, minimal dark background, ${base}`,
    'gold-earrings':     `close-up of an elegant woman's ear and neck wearing ${productName} earrings, soft hair, ${base}`,
    'silver-earrings':   `close-up of an elegant woman's ear wearing ${productName} silver earrings, soft light, ${base}`,
    'gold-pendants':     `close-up of an elegant woman's neck and décolletage wearing a ${productName} pendant necklace, ${base}`,
    'silver-pendants':   `close-up of an elegant woman's neck wearing a ${productName} silver pendant, ${base}`,
    'gold-chains':       `close-up of an elegant woman's neck wearing a ${productName} gold chain necklace, ${base}`,
    'gold-bracelets':    `close-up of an elegant woman's wrist wearing a ${productName} gold bracelet, marble background, ${base}`,
    'silver-bracelets':  `close-up of an elegant woman's wrist wearing a ${productName} silver bracelet, ${base}`,
    'gold-bangles':      `close-up of an elegant woman's wrist wearing ${productName} gold bangles stacked, ${base}`,
    'necklaces':         `close-up of an elegant woman's neck and décolletage wearing ${productName}, ${base}`,
    'earrings':          `close-up of an elegant woman's ear wearing ${productName} earrings, ${base}`,
    'bracelets':         `close-up of an elegant woman's wrist wearing ${productName}, ${base}`,
  };

  // Try exact slug match, then a partial match, then fallback
  if (categoryMap[categorySlug]) return categoryMap[categorySlug];
  const partial = Object.keys(categoryMap).find(k => categorySlug.includes(k) || k.includes(categorySlug));
  if (partial) return categoryMap[partial];

  return `luxury fine jewellery piece "${productName}" on white velvet, professional macro photography, studio lighting, ${base}`;
}

/* ── Main export ────────────────────────────────────────────────────────────── */
export async function generateLifestylePhoto(
  productName: string,
  categorySlug: string,
  metalType?: string,
): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.warn('[replicate] REPLICATE_API_TOKEN not set');
    return null;
  }

  const prompt = buildPrompt(productName, categorySlug, metalType);

  console.log('[replicate] generating lifestyle photo for:', productName, '| category:', categorySlug);

  /* 1 — Submit prediction */
  let predictionId: string;
  try {
    const res = await fetch(`${REPLICATE_API}/models/black-forest-labs/flux-schnell/predictions`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer:         'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio:   '3:4',
          output_format:  'webp',
          output_quality: 90,
          num_outputs:    1,
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('[replicate] submit error:', res.status, txt);
      return null;
    }

    const data = await res.json() as { id: string; status?: string; output?: string[]; error?: string };
    console.log('[replicate] submit response status:', data.status, '| id:', data.id);

    // Replicate may return output immediately when using `Prefer: wait`
    if (data.status === 'failed') {
      console.error('[replicate] prediction failed immediately:', data.error);
      return null;
    }
    if (data.output?.[0]) {
      console.log('[replicate] got immediate output:', data.output[0]);
      return data.output[0];
    }
    predictionId = data.id;
  } catch (err) {
    console.error('[replicate] submit exception:', err);
    return null;
  }

  /* 2 — Poll for completion */
  console.log('[replicate] polling prediction:', predictionId);
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    try {
      const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;

      const data = await res.json() as { status: string; output?: string[]; error?: string };
      console.log('[replicate] poll', i + 1, '| status:', data.status);
      if (data.status === 'succeeded' && data.output?.[0]) {
        console.log('[replicate] succeeded:', data.output[0]);
        return data.output[0];
      }
      if (data.status === 'failed') {
        console.error('[replicate] prediction failed:', data.error);
        return null;
      }
    } catch { /* keep polling */ }
  }

  console.warn('[replicate] timed out waiting for prediction', predictionId);
  return null;
}
