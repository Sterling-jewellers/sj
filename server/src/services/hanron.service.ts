/**
 * Hanron Jewellery — Web Scraper Integration
 *
 * Mirrors the Nivoda service pattern:
 *   • Credentials read from .env  (HANRON_EMAIL / HANRON_PASSWORD)
 *   • Session cookie cached in memory (re-login on expiry / 2 h)
 *   • fetchHanronProducts()  — scrapes full catalogue with ?page=all
 *   • checkHanronStatus()    — admin health-check endpoint
 *
 * Verified selectors (live-tested against hanronjewellery.com):
 *   Login:   POST /customer/login  fields[Email] / fields[Password] / doAction=login
 *   Listing: ?page=all → .col-md-2.col-sm-2.col-xs-12 cards
 *     • name:   .itemname
 *     • sku:    .itemcode
 *     • image:  .cell-img img[src]   → /img/product/main_NNNNN_SKU__c-max_w-180_h-180_q-90.jpg
 *     • url:    a[href]
 *   Detail:  /products/…/sku.html
 *     • name:    h2.uper-block (first h2 on page)
 *     • price:   body text  "Price: £NNN.NN"
 *     • metal:   body text  "Metal: …"
 *     • sizes:   body text  "Size Select Size …"
 *     • images:  img[src*="product/main_"]  (largest available)
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

const BASE_URL = (process.env.HANRON_BASE_URL || 'https://hanronjewellery.com').replace(/\/$/, '');

// ── Session cache ─────────────────────────────────────────────────────────────
let sessionClient:  AxiosInstance | null = null;
let sessionExpires: number               = 0;
const SESSION_TTL   = 2 * 60 * 60 * 1000; // 2 hours

// ── Category paths ─────────────────────────────────────────────────────────────
export const HANRON_CATEGORIES: Record<string, string> = {
  'Gold Ladies Rings':      '/products/gold/rings/ladies/',
  'Gold Gents Rings':       '/products/gold/rings/gents/',
  'Gold Baby Rings':        '/products/gold/rings/baby/',
  'Gold Signet Rings':      '/products/gold/rings/Signet/',
  'Gold Earrings':          '/products/gold/earrings/',
  'Gold Pendants':          '/products/gold/pendants/',
  'Gold Bracelets':         '/products/gold/bracelets/',
  'Gold Bangles':           '/products/gold/bangles/',
  'Gold Chains':            '/products/gold/chains/',
  'Silver Rings':           '/products/silver/rings/',
  'Silver Earrings':        '/products/silver/earrings/',
  'Silver Pendants':        '/products/silver/pendants/',
  'Silver Bracelets':       '/products/silver/bracelets/',
  'Diamonds':               '/products/diamond/',
  'Wedding Bands':          '/products/wedding-bands/',
  'Lab Grown Diamonds':     '/products/lab-grown-diamonds/',
};

// ── Axios client with persistent cookie jar ───────────────────────────────────
function makeClient(): AxiosInstance {
  const jar    = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    baseURL:         BASE_URL,
    timeout:         30_000,
    withCredentials: true,
    maxRedirects:    5,
    headers: {
      'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  }));
  return client;
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(): Promise<AxiosInstance> {
  if (sessionClient && Date.now() < sessionExpires) return sessionClient;

  const email    = process.env.HANRON_EMAIL;
  const password = process.env.HANRON_PASSWORD;
  if (!email || !password) {
    throw new Error('HANRON_EMAIL / HANRON_PASSWORD not set in .env');
  }

  const client = makeClient();

  const form = new URLSearchParams();
  form.append('fields[Email]',    email);
  form.append('fields[Password]', password);
  form.append('auto-login',       '1');
  form.append('doAction',         'login');
  form.append('success_url',      '/customer/account');

  await client.post('/customer/login', form.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer':      `${BASE_URL}/customer/login`,
      'Origin':       BASE_URL,
    },
  });

  // Verify login succeeded
  const check = await client.get('/customer/account');
  const hasLogout = (check.data as string).includes('logout') || (check.data as string).includes('Logout');
  if (!hasLogout) {
    throw new Error('Hanron login failed — check HANRON_EMAIL / HANRON_PASSWORD in .env');
  }

  console.log('[Hanron] ✅ Authenticated successfully');
  sessionClient  = client;
  sessionExpires = Date.now() + SESSION_TTL;
  return client;
}

// ── Image URL helpers ─────────────────────────────────────────────────────────
// Listing gives:  /img/product/main_66924_R0717__c-max_w-180_h-180_q-90.jpg
// We want full:   /img/product/main_66924_R0717__q-90.jpg  (no size cap)
function upgradeImageUrl(src: string): string {
  if (!src) return '';
  const full = src.startsWith('http') ? src : `${BASE_URL}${src}`;
  // Strip the crop/resize params to get full-resolution
  return full.replace(/__c-max_w-\d+_h-\d+_q-\d+/, '__q-90');
}

// ── Parse a single category listing page ─────────────────────────────────────
// All data (name, SKU, price, availability, sizes, image) is in .product-rowtype
// ?page=all returns every product in one request — no detail pages needed.
async function scrapeCategoryAll(client: AxiosInstance, path: string, categoryName: string): Promise<HanronProduct[]> {
  const res = await client.get(`${path}?page=all`);
  const $   = cheerio.load(res.data as string);
  const products: HanronProduct[] = [];

  $('.product-rowtype').each((_: number, el: cheerio.Element) => {
    const $el = $(el);

    const name = $el.find('.itemname a, .itemname').first().text().trim();
    const sku  = $el.find('.itemcode').text().trim();
    if (!name || !sku) return;

    // URL
    const href = $el.find('.itemname a').attr('href') || '';
    const url  = href.startsWith('http') ? href : `${BASE_URL}/${href.replace(/^\//, '')}`;

    // Image — upgrade to full resolution
    const imgSrc   = $el.find('.cell-img img').attr('src') || '';
    const imageUrl = upgradeImageUrl(imgSrc);

    // Price — use data-price attr (clean number) or parse £ from .prices div
    const priceAttr = $el.find('[data-price]').first().attr('data-price');
    const priceText = $el.find('.cell-prices .prices').first().text().trim();
    const price     = priceAttr
      ? parseFloat(priceAttr)
      : parseFloat((priceText.match(/£([\d,]+\.?\d*)/) || [])[1]?.replace(/,/g, '') || '0');

    // Availability
    const availText  = $el.find('.instock h3 span, .instock').first().text().trim();
    const availability = availText.toLowerCase().includes('out') ? 'Out of Stock' : 'In Stock';

    // Sizes — .ml-block contains "M 2g", "L 2g" etc.
    const sizes: string[] = [];
    $el.find('.ml-block').each((_: number, s: cheerio.Element) => {
      const t = $(s).text().trim();
      const sz = t.split(/\s+/)[0];
      if (sz && /^[A-Z0-9]+$/.test(sz) && sz.length <= 3) sizes.push(sz);
    });

    // Metal inferred from product name (Y/G, W/G, R/G patterns)
    const metal = inferMetal(name);

    products.push({
      sku, name, price, metal,
      description: `${name}. Metal: ${metal}.${sizes.length ? ` Available sizes: ${sizes.join(', ')}.` : ''}`,
      images:      imageUrl ? [imageUrl] : [],
      sizes, availability, category: categoryName,
      sourceUrl:   url,
    });
  });

  return products;
}

// ── Parse a single product detail page ───────────────────────────────────────
export interface HanronProduct {
  sku:         string;
  name:        string;
  price:       number;
  metal:       string;
  description: string;
  images:      string[];
  sizes:       string[];
  availability: string;
  category:    string;
  sourceUrl:   string;
}

// ── Metal inference from product name ─────────────────────────────────────────
function inferMetal(name: string): string {
  const t = name.toLowerCase();
  const karat = t.includes('18ct') || t.includes('18k') ? '18ct'
              : t.includes('9ct')  || t.includes('9k')  ? '9ct'
              : t.includes('14ct') || t.includes('14k') ? '14ct'
              : t.includes('plat')                       ? 'platinum'
              : t.includes('silver')                     ? 'sterling-silver'
              : '9ct'; // most Hanron stock is 9ct

  const colour = (t.includes('y/g') || t.includes('yellow')) ? 'yellow-gold'
               : (t.includes('w/g') || t.includes('white'))  ? 'white-gold'
               : (t.includes('r/g') || t.includes('rose'))   ? 'rose-gold'
               : (t.includes('silver'))                       ? 'silver'
               : 'yellow-gold';

  if (karat === 'platinum')       return 'platinum';
  if (karat === 'sterling-silver') return 'silver';
  return `${karat} ${colour}`;
}

// ── Public API ────────────────────────────────────────────────────────────────
export interface HanronFetchOptions {
  categories?: string[];  // keys from HANRON_CATEGORIES; defaults to all
}

export interface HanronFetchResult {
  products: HanronProduct[];
  total:    number;
  errors:   string[];
}

export async function fetchHanronProducts(opts: HanronFetchOptions = {}): Promise<HanronFetchResult> {
  const client = await login();
  const paths: Record<string, string> = opts.categories?.length
    ? Object.fromEntries(
        opts.categories
          .map(k => [k, HANRON_CATEGORIES[k]] as [string, string])
          .filter(([, v]) => Boolean(v))
      )
    : HANRON_CATEGORIES;

  const allProducts: HanronProduct[] = [];
  const errors:      string[]        = [];

  // One request per category (?page=all) — all data is in the listing HTML
  // No detail page scraping needed — price, availability, sizes, images all present
  for (const [name, path] of Object.entries(paths)) {
    try {
      const products = await scrapeCategoryAll(client, path, name);
      allProducts.push(...products);
      console.log(`[Hanron] ${name} → ${products.length} products`);
    } catch (err) {
      errors.push(`Category "${name}": ${(err as Error).message}`);
    }
  }

  // De-dupe by SKU (same ring can appear in multiple categories)
  const seen   = new Set<string>();
  const unique = allProducts.filter(p => { if (seen.has(p.sku)) return false; seen.add(p.sku); return true; });

  console.log(`[Hanron] ✅ Done — ${unique.length} unique products (${errors.length} errors)`);
  return { products: unique, total: unique.length, errors };
}

// ── Status check ──────────────────────────────────────────────────────────────
export async function checkHanronStatus(): Promise<{
  configured: boolean;
  status: 'ok' | 'auth_failed' | 'scrape_failed' | 'not_configured';
  error?: string;
  productCount?: number;
}> {
  if (!process.env.HANRON_EMAIL || !process.env.HANRON_PASSWORD) {
    return { configured: false, status: 'not_configured' };
  }

  let client: AxiosInstance;
  try {
    client = await login();
  } catch (err) {
    return { configured: true, status: 'auth_failed', error: (err as Error).message };
  }

  try {
    const stubs = await scrapeCategoryAll(client, '/products/gold/rings/ladies/', 'Gold Ladies Rings');
    return { configured: true, status: 'ok', productCount: stubs.length };
  } catch (err) {
    return { configured: true, status: 'scrape_failed', error: (err as Error).message };
  }
}

// ── Invalidate session (e.g. after credential change) ─────────────────────────
export function invalidateHanronSession(): void {
  sessionClient  = null;
  sessionExpires = 0;
}
