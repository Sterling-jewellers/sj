/**
 * Stuller Ring Mounts API
 * ─────────────────────────────────────────────────────────────────────────────
 * Stuller (stuller.com) is the world's largest wholesale jewellery supplier
 * and the actual source used by Blue Nile, 77 Diamonds, James Allen, and
 * virtually every other online jeweller for their ring setting inventory
 * and product photography.
 *
 * Their REST API provides:
 *   • 50,000+ ring settings with professional multi-angle photography
 *   • Real CAD renders + finished product photos
 *   • Weight data, metal options, sizing ranges, pricing
 *   • Same images you see on Blue Nile / 77 Diamonds (they buy from Stuller)
 *
 * To activate:
 *   1. Apply for a Stuller trade account at https://www.stuller.com/account/register
 *      (requires proof you are a jewellery retailer / business)
 *   2. Once approved, get your API key from https://developer.stuller.com/
 *   3. Add to server/.env:
 *      STULLER_API_KEY=your_api_key_here
 *      STULLER_ACCOUNT_ID=your_account_id
 *
 * API docs: https://developer.stuller.com/
 * Base URL:  https://api.stuller.com/v2/
 *
 * NOTE: This is a legitimate B2B trade relationship — not scraping.
 * Blue Nile, James Allen, Abelini all have Stuller trade accounts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const STULLER_BASE = 'https://api.stuller.com/v2';

// Stuller category IDs for engagement ring settings
const ENGAGEMENT_SETTING_CATEGORIES = {
  solitaire:    '66380',
  halo:         '66381',
  pavé:         '66382',
  three_stone:  '66383',
  vintage:      '66384',
  all_settings: '4300',
};

export interface StullerRingSetting {
  ItemNumber:   string;
  Description:  string;
  CategoryName: string;
  Style:        string;
  MetalOptions: { MetalType: string; Karat: string; PriceModifier: number }[];
  Images: {
    Primary:    string;   // Full URL to primary product photo
    Alternate:  string[]; // Additional angle photos
  };
  Weight:       number;   // grams
  Width:        number;   // mm
  MinSize:      number;
  MaxSize:      number;
  BasePrice:    number;   // USD wholesale — multiply by your margin + convert to GBP
  StoneSizeMin: number;
  StoneSizeMax: number;
}

function stuller(path: string, options: RequestInit = {}) {
  const key = process.env.STULLER_API_KEY;
  const account = process.env.STULLER_ACCOUNT_ID;
  if (!key || !account) return null;

  return fetch(`${STULLER_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization':  `Bearer ${key}`,
      'X-Account-ID':   account,
      'Accept':         'application/json',
      'Content-Type':   'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
}

export async function getStullerSettings(params: {
  categoryId?: string;
  style?:      string;
  limit?:      number;
  page?:       number;
}) {
  const resp = stuller(
    `/Category/${params.categoryId || ENGAGEMENT_SETTING_CATEGORIES.all_settings}/Products` +
    `?pageSize=${params.limit || 48}&pageIndex=${(params.page || 1) - 1}`
  );
  if (!resp) return null; // credentials not set

  try {
    const res = await resp;
    if (!res.ok) return null;
    return await res.json() as { Products: StullerRingSetting[]; TotalCount: number };
  } catch {
    return null;
  }
}

export async function getStullerProductImages(itemNumber: string): Promise<string[]> {
  const resp = stuller(`/Product/${itemNumber}/Images`);
  if (!resp) return [];
  try {
    const res = await resp;
    if (!res.ok) return [];
    const data = await res.json() as { Images: { Url: string }[] };
    return data.Images.map(i => i.Url);
  } catch {
    return [];
  }
}

/**
 * Returns true when Stuller credentials are configured.
 * Use this on the frontend to show "Powered by Stuller" badge.
 */
export function stullerConfigured(): boolean {
  return !!(process.env.STULLER_API_KEY && process.env.STULLER_ACCOUNT_ID);
}
