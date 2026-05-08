/**
 * Sterling Jewellers — Client-Side Personalisation Engine
 *
 * Tracks customer behaviour in localStorage and provides:
 *  • preference-based product scoring for smart sorting
 *  • recently-viewed history
 *  • social proof signals (deterministic "X people viewing")
 *  • low-stock urgency signals
 *  • top style / metal preferences
 *
 * Zero external dependencies — everything runs in the browser.
 */

export type EventType =
  | 'view_product'
  | 'view_diamond'
  | 'add_cart'
  | 'add_wishlist'
  | 'search'
  | 'purchase';

export interface TrackingEvent {
  type: EventType;
  productId?: string;
  productSlug?: string;
  diamondId?: string;
  category?: string;
  style?: string;
  metal?: string;
  price?: number;
  query?: string;
  timestamp: number;
}

export interface UserProfile {
  events: TrackingEvent[];
  preferredStyles: Record<string, number>;
  preferredMetals: Record<string, number>;
  priceRangeMin: number;
  priceRangeMax: number;
  sessionId: string;
  visitCount: number;
  lastVisit: number;
}

const STORAGE_KEY = 'sj_user_profile';
const MAX_EVENTS  = 200;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function createEmpty(): UserProfile {
  return {
    events: [],
    preferredStyles: {},
    preferredMetals: {},
    priceRangeMin: 0,
    priceRangeMax: 50000,
    sessionId: Math.random().toString(36).slice(2, 10),
    visitCount: 0,
    lastVisit: Date.now(),
  };
}

function saveProfile(p: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch { /* storage full – skip */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getProfile(): UserProfile {
  if (typeof window === 'undefined') return createEmpty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch { /* corrupted data */ }
  return createEmpty();
}

export function clearProfile() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}

export function incrementVisitCount() {
  if (typeof window === 'undefined') return;
  const p = getProfile();
  p.visitCount += 1;
  p.lastVisit   = Date.now();
  saveProfile(p);
}

export function trackEvent(event: Omit<TrackingEvent, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const p = getProfile();

  // Prepend and cap
  p.events.unshift({ ...event, timestamp: Date.now() });
  if (p.events.length > MAX_EVENTS) p.events = p.events.slice(0, MAX_EVENTS);

  // Update preference counters
  if (event.style) {
    p.preferredStyles[event.style] = (p.preferredStyles[event.style] || 0) + 1;
  }
  if (event.metal) {
    p.preferredMetals[event.metal] = (p.preferredMetals[event.metal] || 0) + 1;
  }

  // Update price range (rolling average)
  if (event.price && event.price > 0) {
    const priceEvents = p.events.filter(e => e.price && e.price > 0).slice(0, 20);
    const prices = priceEvents.map(e => e.price!);
    p.priceRangeMin = Math.min(...prices);
    p.priceRangeMax = Math.max(...prices);
  }

  saveProfile(p);
}

/** Returns last N unique product slugs the user has viewed (most recent first). */
export function getRecentlyViewedSlugs(limit = 8): string[] {
  const p = getProfile();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const e of p.events) {
    if (e.type === 'view_product' && e.productSlug && !seen.has(e.productSlug)) {
      seen.add(e.productSlug);
      result.push(e.productSlug);
      if (result.length >= limit) break;
    }
  }
  return result;
}

/** Returns top N preferred styles sorted by interaction count. */
export function getTopStyles(n = 3): string[] {
  return Object.entries(getProfile().preferredStyles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([style]) => style);
}

/** Returns top N preferred metals sorted by interaction count. */
export function getTopMetals(n = 3): string[] {
  return Object.entries(getProfile().preferredMetals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([metal]) => metal);
}

/**
 * Personalisation score for a product.
 * Higher = more relevant to this user's browsing history.
 * Use to re-sort product feeds.
 */
export function getPersonalizationScore(product: {
  style?: string;
  metalOptions?: { type: string }[];
  basePrice?: number;
}): number {
  const p = getProfile();
  let score = 0;

  if (product.style) {
    score += (p.preferredStyles[product.style] || 0) * 10;
  }
  product.metalOptions?.forEach(m => {
    score += (p.preferredMetals[m.type] || 0) * 5;
  });

  // Slight boost for products in the user's usual price range
  if (product.basePrice && p.priceRangeMax > 0) {
    const mid = (p.priceRangeMin + p.priceRangeMax) / 2;
    const dist = Math.abs(product.basePrice - mid);
    const range = p.priceRangeMax - p.priceRangeMin || 1000;
    if (dist < range * 0.5) score += 8;
  }

  return score;
}

/**
 * Deterministic "people viewing" count — same product always shows
 * the same number within a given hour, eliminating flicker.
 */
export function getSocialProofCount(productId: string): number {
  const hour   = new Date().getHours();
  const seed   = [...productId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hourly = ((seed * (hour + 1) * 7919) % 17) + 2; // 2-18
  return hourly;
}

/**
 * Returns "Only X left" if total stock is low (< 5 across all sizes).
 * Returns null if stock is healthy.
 */
export function getUrgencyStock(variants?: { stock: number }[]): string | null {
  if (!variants?.length) return null;
  const total = variants.reduce((s, v) => s + v.stock, 0);
  if (total > 0 && total < 5) return `Only ${total} left`;
  return null;
}

/** True if this is not the user's first visit. */
export function isReturningVisitor(): boolean {
  return getProfile().visitCount > 1;
}
