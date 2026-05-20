/**
 * fal.ai service
 * Handles:
 *   - Lifestyle photo generation (image-to-image via FLUX Kontext — uses real product photo)
 *   - Metal colour variant images (image editing via FLUX Kontext)
 *   - 3D GLB model generation (image-to-3D via Trellis)
 */

import { fal } from '@fal-ai/client';
import { describeProductImage } from './gemini.service';

function configure() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY not set in environment');
  fal.config({ credentials: key });
}

/* ══════════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════════ */

/**
 * fal.ai cannot download arbitrary external URLs.
 * This uploads an image to fal storage and returns a fal CDN URL that the
 * model can always access.
 */
async function uploadToFalStorage(imageUrl: string): Promise<string> {
  const resp = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SterlingBot/1.0)' },
  });
  if (!resp.ok) throw new Error(`Could not fetch image (${resp.status}): ${imageUrl}`);

  const buffer = Buffer.from(await resp.arrayBuffer());
  const contentType = resp.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

  // fal.storage.upload accepts a File/Blob
  const file = new File([buffer], `product.${ext}`, { type: contentType });
  const falUrl = await fal.storage.upload(file);
  console.log('[fal] uploaded to fal storage:', falUrl);
  return falUrl;
}

/* ══════════════════════════════════════════════════════════════════════════════
   LIFESTYLE PHOTO  —  fal-ai/flux-pro/kontext  (image → image)
   Uses the REAL product photo as input so the exact item is preserved.
══════════════════════════════════════════════════════════════════════════════ */

/** Detect jewellery type from product name keywords — more reliable than category alone */
function detectTypeFromName(productName: string): string | null {
  const n = productName.toLowerCase();
  if (n.includes('bangle'))                          return 'bangle';
  if (n.includes('bracelet'))                        return 'bracelet';
  if (n.includes('earring') || n.includes('stud') || n.includes('hoop')) return 'earring';
  if (n.includes('necklace'))                        return 'necklace';
  if (n.includes('pendant'))                         return 'pendant';
  if (n.includes('chain'))                           return 'chain';
  if (n.includes('ring'))                            return 'ring';
  return null;
}

/**
 * Builds the final FLUX prompt.
 * Placement is determined by: product name keywords first, then category slug.
 * This means a "Diamond Bangle" in the "Diamond Jewellery" category still goes on a wrist.
 */
function buildWornScene(categorySlug: string, productDescription: string, metalType?: string, productName = ''): string {
  const quality = 'professional luxury jewellery editorial photography, soft natural bokeh background, warm studio lighting, 8K photorealistic, high-end fashion magazine';

  // Determine placement from product name first (most reliable), then fall back to category
  const nameType = detectTypeFromName(productName || productDescription);

  const wristScene   = `Close-up photo of an elegant woman's wrist wearing ${productDescription}. Skin visible, soft lifestyle background. ${quality}`;
  const fingerScene  = `Close-up photo of an elegant woman's hand with graceful fingers wearing ${productDescription}. Soft blurred background. ${quality}`;
  const earScene     = `Close-up portrait photo of an elegant woman with ${productDescription} earring on her ear. Ear and neck visible, soft hair framing. ${quality}`;
  const neckScene    = `Close-up photo of an elegant woman's neck and décolletage with ${productDescription}. Soft background. ${quality}`;

  // Name-based override — always wins
  if (nameType === 'bangle' || nameType === 'bracelet') return wristScene;
  if (nameType === 'earring')                           return earScene;
  if (nameType === 'necklace' || nameType === 'pendant' || nameType === 'chain') return neckScene;
  if (nameType === 'ring')                              return fingerScene;

  // Category-based fallback
  const slug = categorySlug.toLowerCase();
  if (slug.includes('bangle') || slug.includes('bracelet'))          return wristScene;
  if (slug.includes('earring'))                                       return earScene;
  if (slug.includes('necklace') || slug.includes('pendant') || slug.includes('chain')) return neckScene;
  if (slug.includes('ring'))                                          return fingerScene;

  // Generic fallback — at least correct type from name
  return `Close-up luxury editorial photo of an elegant woman wearing ${productDescription}. ${quality}`;
}

/**
 * img2img prompt — describes the lifestyle SCENE to transform INTO.
 * Keeps the instruction tight so the model focuses on placement, not reinvention.
 */
function buildWornContext(categorySlug: string, metalType?: string): string {
  const metal = metalType ? metalType.replace(/-/g, ' ') : 'gold';
  const quality = `luxury editorial jewellery photography, ${metal}, soft studio lighting, bokeh background, 8K photorealistic`;

  const scene: Record<string, string> = {
    'engagement-rings':  `The jewellery is now a ring worn on an elegant woman's finger, close-up hand shot, blurred background. ${quality}`,
    'wedding-rings':     `The jewellery is now a ring worn on an elegant woman's finger, close-up, soft natural light. ${quality}`,
    'wedding-bands':     `The jewellery is now a band worn on an elegant woman's finger, close-up, soft light. ${quality}`,
    'eternity-rings':    `The jewellery is now an eternity ring worn on an elegant woman's finger, sparkling diamonds, close-up. ${quality}`,
    'rings':             `The jewellery is now a ring worn on an elegant woman's graceful finger, close-up hand. ${quality}`,
    'ladies-rings':      `The jewellery is now a ring worn on an elegant woman's graceful finger, close-up hand. ${quality}`,
    'silver-rings':      `The jewellery is now a silver ring worn on an elegant woman's finger, close-up hand. ${quality}`,
    'gents-rings':       `The jewellery is now a ring worn on a man's hand, close-up, dark minimal background. ${quality}`,
    'signet-rings':      `The jewellery is now a signet ring worn on a hand, close-up, dark background. ${quality}`,
    'gold-earrings':     `The jewellery is now an earring worn on an elegant woman's ear, close-up of ear and neck, soft hair framing. ${quality}`,
    'silver-earrings':   `The jewellery is now a silver earring worn on an elegant woman's ear, close-up, soft light. ${quality}`,
    'earrings':          `The jewellery is now an earring worn on an elegant woman's ear, close-up of ear and neck. ${quality}`,
    'gold-pendants':     `The jewellery is now a pendant necklace worn on an elegant woman's neck and décolletage, close-up. ${quality}`,
    'silver-pendants':   `The jewellery is now a silver pendant worn on an elegant woman's neck, close-up. ${quality}`,
    'pendants':          `The jewellery is now a pendant worn on an elegant woman's neck and décolletage, close-up. ${quality}`,
    'necklaces':         `The jewellery is now a necklace worn on an elegant woman's neck and décolletage, close-up. ${quality}`,
    'gold-chains':       `The jewellery is now a gold chain worn on an elegant woman's neck, close-up. ${quality}`,
    'chains':            `The jewellery is now a chain necklace worn on an elegant woman's neck, close-up. ${quality}`,
    'gold-bracelets':    `The jewellery is now a gold bracelet worn on an elegant woman's wrist, close-up wrist shot, marble surface. ${quality}`,
    'silver-bracelets':  `The jewellery is now a silver bracelet worn on an elegant woman's wrist, close-up wrist shot. ${quality}`,
    'bracelets':         `The jewellery is now a bracelet worn on an elegant woman's wrist, close-up wrist shot. ${quality}`,
    'gold-bangles':      `The jewellery is now a gold bangle worn on an elegant woman's wrist, close-up wrist shot, stacked look. ${quality}`,
    'bangles':           `The jewellery is now a bangle worn on an elegant woman's wrist, close-up wrist shot. ${quality}`,
    'diamond-jewellery': `The jewellery is now worn by an elegant woman, sparkling diamonds, close-up lifestyle shot. ${quality}`,
  };

  if (scene[categorySlug]) return scene[categorySlug];
  const partial = Object.keys(scene).find(k => categorySlug.includes(k) || k.includes(categorySlug));
  if (partial) return scene[partial];
  return `The jewellery piece is being worn elegantly, close-up lifestyle shot. ${quality}`;
}

/** Full descriptive prompt — used as text-only fallback when no product image */
function buildWornPrompt(categorySlug: string, metalType?: string): string {
  const metal = metalType ? metalType.replace(/-/g, ' ') : 'gold';
  const base = `Keep this exact jewellery piece completely unchanged. Place it being worn in a luxury editorial photo. Professional studio lighting, soft bokeh background, 8K photorealistic, high-end fashion magazine quality, ${metal}.`;

  const placement: Record<string, string> = {
    'engagement-rings':  `Place this exact ring on an elegant woman's slender finger. Close-up hand shot, soft blurred background. ${base}`,
    'wedding-rings':     `Place this exact ring on an elegant woman's finger. Close-up, soft natural light. ${base}`,
    'wedding-bands':     `Place this exact band on an elegant woman's finger. Close-up, soft natural light. ${base}`,
    'eternity-rings':    `Place this exact eternity ring on an elegant woman's finger, close-up showing the sparkle. ${base}`,
    'rings':             `Place this exact ring on an elegant woman's graceful finger. Close-up hand shot. ${base}`,
    'ladies-rings':      `Place this exact ring on an elegant woman's graceful finger. Close-up hand shot. ${base}`,
    'silver-rings':      `Place this exact silver ring on an elegant woman's finger. Close-up hand shot. ${base}`,
    'gents-rings':       `Place this exact ring on a man's hand. Close-up, minimal dark background. ${base}`,
    'signet-rings':      `Place this exact signet ring on a hand, close-up, dark minimal background. ${base}`,
    'gold-earrings':     `Place these exact earrings on an elegant woman's ear. Close-up of ear and neck, soft hair framing. ${base}`,
    'silver-earrings':   `Place these exact silver earrings on an elegant woman's ear. Close-up, soft light. ${base}`,
    'earrings':          `Place these exact earrings on an elegant woman's ear. Close-up of ear and neck. ${base}`,
    'gold-pendants':     `Place this exact pendant necklace on an elegant woman's neck and décolletage. Close-up. ${base}`,
    'silver-pendants':   `Place this exact silver pendant on an elegant woman's neck. Close-up. ${base}`,
    'pendants':          `Place this exact pendant on an elegant woman's neck and décolletage. Close-up. ${base}`,
    'necklaces':         `Place this exact necklace on an elegant woman's neck and décolletage. Close-up. ${base}`,
    'gold-chains':       `Place this exact gold chain necklace on an elegant woman's neck. Close-up. ${base}`,
    'chains':            `Place this exact chain necklace on an elegant woman's neck. Close-up. ${base}`,
    'gold-bracelets':    `Place this exact gold bracelet on an elegant woman's wrist. Close-up, marble surface background. ${base}`,
    'silver-bracelets':  `Place this exact silver bracelet on an elegant woman's wrist. Close-up. ${base}`,
    'bracelets':         `Place this exact bracelet on an elegant woman's wrist. Close-up. ${base}`,
    'gold-bangles':      `Place this exact gold bangle on an elegant woman's wrist, stacked look. Close-up wrist shot. ${base}`,
    'bangles':           `Place this exact bangle on an elegant woman's wrist. Close-up wrist shot. ${base}`,
    'diamond-jewellery': `Place this exact diamond jewellery piece being worn by an elegant woman. Close-up showing sparkle. ${base}`,
  };

  if (placement[categorySlug]) return placement[categorySlug];
  const partial = Object.keys(placement).find(k => categorySlug.includes(k) || k.includes(categorySlug));
  if (partial) return placement[partial];
  return `Show this exact jewellery piece being worn elegantly. Close-up, luxury editorial photography. ${base}`;
}

/**
 * Builds the background scene prompt for bria/background/replace.
 * This describes ONLY the lifestyle scene (skin, surface, lighting) —
 * NOT the jewellery itself, because bria keeps the product pixel-perfect.
 */
function buildBackgroundScene(categorySlug: string, nameType: string | null, metalType?: string): string {
  const warmLight  = 'warm natural window light, soft bokeh, luxury lifestyle photography, photorealistic, 8K';
  const studioLight = 'soft studio lighting, neutral background, luxury jewellery photography, photorealistic';

  // Wrist — bangles, bracelets
  if (nameType === 'bangle' || nameType === 'bracelet') {
    return `Elegant fashion model wearing the bangle on her slender wrist, forearm visible with soft rolled-up sleeve or blouse cuff, hand relaxed with fingers gently extended, warm bokeh background with soft light. ${warmLight}`;
  }

  // Ear — earrings, studs, hoops
  if (nameType === 'earring') {
    return `Elegant fashion model with earring on her ear, side profile, smooth skin, soft flowing hair gently framing her neck and shoulder, luxury soft bokeh background. ${warmLight}`;
  }

  // Neck — necklaces, pendants, chains
  if (nameType === 'necklace' || nameType === 'pendant' || nameType === 'chain') {
    return `Elegant fashion model wearing a necklace, neck and décolletage visible, top of shoulder and hint of neckline fabric, smooth glowing skin, soft warm bokeh background. ${warmLight}`;
  }

  // Finger — rings
  if (nameType === 'ring') {
    return `Elegant fashion model's hand with slender fingers gracefully posed, soft natural light on smooth skin, hint of sleeve or cuff, blurred luxury background. ${warmLight}`;
  }

  // Category-based fallback
  const slug = categorySlug.toLowerCase();
  if (slug.includes('bangle') || slug.includes('bracelet')) {
    return `Elegant fashion model wearing the bangle on her slender wrist, forearm visible with soft rolled-up sleeve or blouse cuff, hand relaxed with fingers gently extended, warm bokeh background with soft light. ${warmLight}`;
  }
  if (slug.includes('earring')) {
    return `Elegant fashion model with earring on her ear, side profile, smooth skin, soft flowing hair gently framing her neck and shoulder, luxury soft bokeh background. ${warmLight}`;
  }
  if (slug.includes('necklace') || slug.includes('pendant') || slug.includes('chain')) {
    return `Elegant fashion model wearing a necklace, neck and décolletage visible, top of shoulder and hint of neckline fabric, smooth glowing skin, soft warm bokeh background. ${warmLight}`;
  }
  if (slug.includes('ring')) {
    return `Elegant fashion model's hand with slender fingers gracefully posed, soft natural light on smooth skin, hint of sleeve or cuff, blurred luxury background. ${warmLight}`;
  }

  // Generic luxury fallback
  return `Luxury lifestyle setting, warm natural light, soft blurred background, premium jewellery photography. ${studioLight}`;
}

/**
 * Negative prompt — prevents hallucinated jewellery and keeps the scene clean.
 */
function buildNegativePrompt(nameType: string | null): string {
  const base = 'ugly, blurry, distorted, low quality, cartoonish, illustration, watermark, text, logo';

  if (nameType === 'bangle' || nameType === 'bracelet') {
    return `${base}, ring, necklace, earring, pendant, clasped hands, folded hands, fist, crossed arms, awkward pose, no additional jewellery`;
  }
  if (nameType === 'earring') {
    return `${base}, ring, necklace, bangle, bracelet, no additional jewellery`;
  }
  if (nameType === 'necklace' || nameType === 'pendant' || nameType === 'chain') {
    return `${base}, ring, earring, bangle, bracelet, no additional jewellery`;
  }
  if (nameType === 'ring') {
    return `${base}, necklace, earring, bangle, bracelet, no additional jewellery`;
  }

  return `${base}, multiple jewellery pieces`;
}

export async function generateLifestylePhoto(
  productName: string,
  categorySlug: string,
  metalType?: string,
  productImageUrl?: string,
): Promise<string | null> {
  configure();

  console.log('[fal] ── generateLifestylePhoto ──');
  console.log('[fal]  product   :', productName);
  console.log('[fal]  category  :', categorySlug);
  console.log('[fal]  image url :', productImageUrl?.slice(0, 80) || 'NONE');

  if (!productImageUrl) {
    console.warn('[fal]  No product image — cannot generate lifestyle photo');
    return null;
  }

  // Detect placement from product name (most reliable)
  const nameType = detectTypeFromName(productName);
  console.log('[fal]  detected type:', nameType || 'unknown (using category)');

  // Build background prompt — describes the SCENE around the product, NOT the product itself.
  // bria/background/replace removes the white background and fills it with this scene.
  const bgPrompt = buildBackgroundScene(categorySlug, nameType, metalType);
  const bgNegative = buildNegativePrompt(nameType);
  console.log('[fal]  bg prompt  :', bgPrompt);

  try {
    // Step 1 — Upload product image to fal storage
    const falImageUrl = await uploadToFalStorage(productImageUrl);
    console.log('[fal]  uploaded   :', falImageUrl.slice(0, 80));

    // Step 2 — bria background replace: keeps product EXACTLY, replaces white background
    const result = await fal.subscribe('fal-ai/bria/background/replace', {
      input: {
        image_url: falImageUrl,
        prompt: bgPrompt,
        negative_prompt: bgNegative,
        fast: false,
      },
      logs: false,
    }) as { data: { images: { url: string }[] } };

    const url = result.data?.images?.[0]?.url ?? null;
    console.log('[fal]  result url :', url);
    return url;
  } catch (err) {
    console.error('[fal]  bria error :', (err as Error).message || err);
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   METAL COLOUR VARIANT  —  fal-ai/flux-pro/kontext  (image editing)
══════════════════════════════════════════════════════════════════════════════ */

export async function generateMetalVariantImage(
  imageUrl: string,
  metalType: string,
  karat?: string,
): Promise<{ predictionId: string }> {
  configure();

  // Upload to fal storage so the model can access it
  const falImageUrl = await uploadToFalStorage(imageUrl);

  const metalDescriptions: Record<string, string> = {
    'yellow-gold': `Change the metal to ${karat || '18ct'} yellow gold — rich warm golden colour, polished finish. Keep the exact ring design, shape, gemstones, and setting unchanged. Pure white studio background.`,
    'white-gold':  `Change the metal to ${karat || '18ct'} white gold — bright cool silver-white polished metal. Keep the exact ring design, shape, gemstones, and setting unchanged. Pure white studio background.`,
    'rose-gold':   `Change the metal to ${karat || '18ct'} rose gold — warm blush-pink polished metal. Keep the exact ring design, shape, gemstones, and setting unchanged. Pure white studio background.`,
    'platinum':    `Change the metal to platinum — cool grey polished premium metal. Keep the exact ring design, shape, gemstones, and setting unchanged. Pure white studio background.`,
    'silver':      `Change the metal to sterling silver — bright neutral polished metal. Keep the exact ring design, shape, gemstones, and setting unchanged. Pure white studio background.`,
  };

  const prompt = metalDescriptions[metalType] ?? metalDescriptions['yellow-gold'];
  console.log('[fal] metal variant start | metal:', metalType);

  // Submit async — return request_id for polling
  const { request_id } = await fal.queue.submit('fal-ai/flux-pro/kontext', {
    input: {
      prompt,
      image_url: falImageUrl,
      num_images: 1,
    },
  });

  return { predictionId: request_id };
}

export async function checkMetalVariantStatus(requestId: string): Promise<{
  status: string;
  output?: string[];
  error?: string;
}> {
  configure();
  try {
    const status = await fal.queue.status('fal-ai/flux-pro/kontext', {
      requestId,
      logs: false,
    });

    if (status.status === 'COMPLETED') {
      const result = await fal.queue.result('fal-ai/flux-pro/kontext', { requestId }) as {
        data: { images: { url: string }[] };
      };
      const url = result.data?.images?.[0]?.url;
      return { status: 'succeeded', output: url ? [url] : [] };
    }

    // IN_QUEUE or IN_PROGRESS
    return { status: 'processing' };
  } catch (err) {
    console.error('[fal] status check error:', err);
    return { status: 'failed', error: String(err) };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3D GLB MODEL  —  fal-ai/trellis  (image → 3D)
══════════════════════════════════════════════════════════════════════════════ */

export async function start3DGeneration(imageUrl: string): Promise<{ taskId: string }> {
  configure();
  console.log('[fal] starting 3D generation for:', imageUrl.slice(0, 80));

  const { request_id } = await fal.queue.submit('fal-ai/trellis', {
    input: {
      image_url: imageUrl,
      // Trellis options — keep defaults for best quality
      ss_guidance_strength: 7.5,
      ss_sampling_steps: 12,
      slat_guidance_strength: 3,
      slat_sampling_steps: 12,
      mesh_simplify: 0.95,
      texture_size: '1024',
    },
  });

  return { taskId: request_id };
}

export async function check3DStatus(taskId: string): Promise<{
  status: string;
  progress?: number;
  modelUrl?: string;
  previewUrl?: string;
  error?: string;
}> {
  configure();
  try {
    const status = await fal.queue.status('fal-ai/trellis', {
      requestId: taskId,
      logs: false,
    });

    if (status.status === 'COMPLETED') {
      const result = await fal.queue.result('fal-ai/trellis', { requestId: taskId }) as {
        data: {
          model_file?: { url: string };
          video?: { url: string };
          model_mesh?: { url: string };
          '3d_gaussians'?: { url: string };
        };
      };

      // Trellis returns model_mesh (GLB) and optionally a preview video
      const modelUrl   = result.data?.model_mesh?.url || result.data?.model_file?.url;
      const previewUrl = result.data?.video?.url;

      console.log('[fal] 3D completed | glb:', modelUrl, '| preview:', previewUrl);
      return { status: 'completed', progress: 100, modelUrl, previewUrl };
    }

    // IN_QUEUE or IN_PROGRESS — estimate progress
    const progress = status.status === 'IN_PROGRESS' ? 50 : 10;
    return { status: 'processing', progress };
  } catch (err) {
    console.error('[fal] 3D status error:', err);
    return { status: 'failed', error: String(err) };
  }
}
