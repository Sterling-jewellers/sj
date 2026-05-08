import { Router, Response } from 'express';
import asyncHandler from 'express-async-handler';

const router = Router();

let cachedPrice: number | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

router.get('/', asyncHandler(async (_req, res: Response) => {
  if (cachedPrice && Date.now() - cacheTime < CACHE_TTL_MS) {
    const p24 = +(cachedPrice / 31.1035).toFixed(2);
    res.json({
      pricePerOz: cachedPrice,
      pricePerGram: p24,
      purityPrices: {
        '9ct':    +(p24 * (9  / 24)).toFixed(2),
        '14ct':   +(p24 * (14 / 24)).toFixed(2),
        '18ct':   +(p24 * (18 / 24)).toFixed(2),
        '22ct':   +(p24 * (22 / 24)).toFixed(2),
        '24ct':   p24,
        platinum: +(p24 * 1.05).toFixed(2),
        silver:   +(p24 * 0.018).toFixed(2),
      },
      currency: 'GBP', source: 'cache', cachedAt: new Date(cacheTime).toISOString(),
    });
    return;
  }

  let pricePerOz: number | null = null;
  let source = 'fallback';

  // ── 1. Coinbase (free, no key, very reliable) ────────────────────────────
  try {
    const r = await fetch('https://api.coinbase.com/v2/prices/XAU-GBP/spot', {
      headers: { 'CB-VERSION': '2016-02-18', Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const d = await r.json() as { data?: { amount?: string } };
      const v = parseFloat(d?.data?.amount || '');
      if (v > 0) { pricePerOz = +v.toFixed(2); source = 'coinbase'; }
    }
  } catch (_) { /* silent */ }

  // ── 2. Metals.live (free, no key) ────────────────────────────────────────
  if (!pricePerOz) {
    try {
      const r = await fetch('https://api.metals.live/v1/spot/gold', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const d = await r.json() as Array<{ gold?: number }> | { gold?: number };
        const usd = Array.isArray(d) ? d[0]?.gold : (d as { gold?: number })?.gold;
        if (usd) {
          const rate = parseFloat(process.env.GBPUSD_RATE || '0.79');
          pricePerOz = +(usd * rate).toFixed(2);
          source = 'metals.live';
        }
      }
    } catch (_) { /* silent */ }
  }

  // ── 3. GoldAPI.io (optional, set GOLDAPI_KEY env) ────────────────────────
  if (!pricePerOz && process.env.GOLDAPI_KEY) {
    try {
      const r = await fetch('https://www.goldapi.io/api/XAU/GBP', {
        headers: { 'x-access-token': process.env.GOLDAPI_KEY, Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const d = await r.json() as { price?: number };
        if (d.price) { pricePerOz = +d.price.toFixed(2); source = 'goldapi'; }
      }
    } catch (_) { /* silent */ }
  }

  // ── 4. Fallback default (update GOLD_FALLBACK_GBP in .env) ───────────────
  if (!pricePerOz) {
    pricePerOz = parseFloat(process.env.GOLD_FALLBACK_GBP || '2650');
    source = 'fallback';
  }

  cachedPrice = pricePerOz;
  cacheTime = Date.now();

  const pricePerGram24K = +(pricePerOz / 31.1035).toFixed(2);
  // Purity-adjusted price per gram for each karat/metal
  // Formula: pure-gold-price × (karat/24) × grams
  const purityPrices: Record<string, number> = {
    '9ct':      +(pricePerGram24K * (9  / 24)).toFixed(2),  // 37.5% pure
    '14ct':     +(pricePerGram24K * (14 / 24)).toFixed(2),  // 58.3% pure
    '18ct':     +(pricePerGram24K * (18 / 24)).toFixed(2),  // 75.0% pure
    '22ct':     +(pricePerGram24K * (22 / 24)).toFixed(2),  // 91.7% pure
    '24ct':     pricePerGram24K,                             // 100% pure
    platinum:   +(pricePerGram24K * 1.05).toFixed(2),       // ~5% premium vs gold
    silver:     +(pricePerGram24K * 0.018).toFixed(2),      // ~1/55 of gold price
  };

  res.json({
    pricePerOz,
    pricePerGram: pricePerGram24K,
    purityPrices,
    currency: 'GBP',
    source,
    cachedAt: new Date(cacheTime).toISOString(),
  });
}));

export default router;
