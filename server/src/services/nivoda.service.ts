/**
 * Nivoda Diamond API — GraphQL Integration
 *
 * Nivoda (https://nivoda.net) is a UK-based B2B diamond marketplace.
 * GraphQL endpoint: https://integrations.nivoda.net/graphql-loupe360
 *
 * To activate:
 *   1. Register at https://app.nivoda.net/register
 *   2. Add to server/.env:
 *      NIVODA_USERNAME=your@email.com
 *      NIVODA_PASSWORD=yourpassword
 *   3. The service auto-authenticates, caches the JWT (23h TTL), and
 *      falls back to local MongoDB when credentials are absent.
 */

const NIVODA_GQL = 'https://integrations.nivoda.net/graphql-loupe360';

// ── TypeScript interfaces ──────────────────────────────────────────────────────
interface NivodaAuthResponse {
  data?:   { authenticate?: { token: string } };
  errors?: { message: string }[];
}
interface NivodaCertificate {
  certNumber:   string;
  lab:          string;
  shape:        string;
  carats:       number;
  color:        string;
  clarity:      string;
  cut_grade:    string;
  polish:       string;
  symmetry:     string;
  fluorescence: string;
  table_size:   number;
  depth_percent:number;
  measurements: { length: number; width: number; depth: number };
}
interface NivodaDiamond {
  id:       string;
  available:boolean;
  price:    number;
  image:    string | null;
  video:    string | null;
  loupe360: { url: string } | null;
  certificate: NivodaCertificate;
}
interface NivodaQueryResponse {
  data?:   { diamonds?: { items: NivodaDiamond[]; total_count: number } };
  errors?: { message: string }[];
}

// ── Shape filter map ──────────────────────────────────────────────────────────
const SHAPE_MAP: Record<string, string> = {
  round:    'ROUND',   oval:     'OVAL',    princess: 'PRINCESS',
  cushion:  'CUSHION', emerald:  'EMERALD', pear:     'PEAR',
  radiant:  'RADIANT', asscher:  'ASSCHER', marquise: 'MARQUISE',
  heart:    'HEART',
};

// ── Diamond query ─────────────────────────────────────────────────────────────
const DIAMONDS_QUERY = `
  query GetDiamonds($offset: Int, $limit: Int, $filters: DiamondFilters) {
    diamonds(
      offset: $offset
      limit:  $limit
      filters: $filters
      sorting: [{ field: price, direction: Ascending }]
    ) {
      total_count
      items {
        id
        available
        price
        image
        video
        loupe360 { url }
        certificate {
          certNumber
          lab
          shape
          carats
          color
          clarity
          cut_grade
          polish
          symmetry
          fluorescence
          table_size
          depth_percent
          measurements { length width depth }
        }
      }
    }
  }
`;

// ── Currency ──────────────────────────────────────────────────────────────────
const USD_TO_GBP = parseFloat(process.env.USD_TO_GBP_RATE || '0.79');

// ── Token cache ───────────────────────────────────────────────────────────────
let cachedToken:    string | null = null;
let tokenExpiresAt: number        = 0;

async function gql(query: string, variables: Record<string, unknown> = {}, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(NIVODA_GQL, {
    method:  'POST',
    headers,
    body:    JSON.stringify({ query, variables }),
    signal:  AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Nivoda HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const username = process.env.NIVODA_USERNAME;
  const password = process.env.NIVODA_PASSWORD;
  if (!username || !password) throw new Error('NIVODA_USERNAME / NIVODA_PASSWORD not set in .env');

  // Use GraphQL variables — safer than inline string interpolation
  const json = await gql(
    `mutation Authenticate($username: String!, $password: String!) {
       authenticate(username: $username, password: $password) { token }
     }`,
    { username, password }
  ) as NivodaAuthResponse;

  if (json.errors?.length) {
    const msg = json.errors.map(e => e.message).join('; ');
    throw new Error(`Nivoda auth error: ${msg} — check NIVODA_USERNAME/NIVODA_PASSWORD`);
  }

  const token = json?.data?.authenticate?.token;
  if (!token) throw new Error('Nivoda auth: no token in response. Verify credentials at app.nivoda.net');

  cachedToken    = token;
  tokenExpiresAt = Date.now() + 23 * 3_600_000;
  console.log('[Nivoda] ✅ Authenticated successfully');
  return token;
}

// ── Public filter interface ───────────────────────────────────────────────────
export interface NivodaFilters {
  shapes?:    string[];
  minCarat?:  number;
  maxCarat?:  number;
  colors?:    string[];
  clarities?: string[];
  labs?:      string[];
  minPrice?:  number;
  maxPrice?:  number;
  limit?:     number;
  offset?:    number;
}

function mapDiamond(d: NivodaDiamond) {
  const c = d.certificate;
  const shape = c.shape
    ? c.shape.charAt(0).toUpperCase() + c.shape.slice(1).toLowerCase()
    : 'Round';
  return {
    _id:         d.id,
    sku:         c.certNumber || d.id,
    shape,
    caratWeight: c.carats,
    cut:         c.cut_grade  || 'Excellent',
    color:       c.color,
    clarity:     c.clarity,
    polish:      c.polish      || 'Excellent',
    symmetry:    c.symmetry    || 'Excellent',
    fluorescence:c.fluorescence|| 'None',
    price:       Math.round(d.price * USD_TO_GBP),
    certificate: {
      lab:    c.lab,
      number: c.certNumber,
      pdfUrl: c.lab === 'GIA'
        ? `https://www.gia.edu/report-check?reportno=${c.certNumber}`
        : c.lab === 'IGI'
        ? `https://www.igi.org/reports/verify-your-report/?r=${c.certNumber}`
        : undefined,
    },
    measurements: {
      length:       c.measurements?.length  ?? 0,
      width:        c.measurements?.width   ?? 0,
      depth:        c.measurements?.depth   ?? 0,
      depthPercent: c.depth_percent         ?? 0,
      tablePercent: c.table_size            ?? 0,
    },
    imageUrl:    d.image       || null,
    videoUrl:    d.video       || null,
    loupe360:    d.loupe360?.url || null,
    isAvailable: d.available,
    source:      'nivoda' as const,
  };
}

/**
 * Search Nivoda live inventory.
 * Returns null when credentials are absent → caller falls back to MongoDB.
 * Returns { diamonds, total } on success.
 */
export async function searchNivodaDiamonds(filters: NivodaFilters) {
  if (!process.env.NIVODA_USERNAME || !process.env.NIVODA_PASSWORD) return null;

  try {
    const token = await getToken();

    // ── Build GraphQL filters ─────────────────────────────────────────────
    // NOTE: Nivoda filter field names:
    //  - shapes:     string[]  e.g. ["ROUND","OVAL"]
    //  - sizes:      { from: number, to: number }   (carats)
    //  - colors:     string[]  e.g. ["D","E","F"]
    //  - clarities:  string[]  e.g. ["VVS1","VS1"]
    //  - lab_grown:  boolean   (false = natural/mined only)
    //  - price:      { from: number, to: number }   (USD wholesale)
    const gqlFilters: Record<string, unknown> = {
      lab_grown: false, // always natural diamonds
    };

    if (filters.shapes?.length) {
      gqlFilters.shapes = filters.shapes.map(s => SHAPE_MAP[s.toLowerCase()] ?? s.toUpperCase());
    }
    if (filters.minCarat || filters.maxCarat) {
      gqlFilters.sizes = {
        from: filters.minCarat ?? 0.3,
        to:   filters.maxCarat ?? 10,
      };
    }
    // Colors as an array — not a range
    if (filters.colors?.length) {
      gqlFilters.colors = filters.colors.map(c => c.toUpperCase());
    }
    // Clarities as an array — not a range
    if (filters.clarities?.length) {
      gqlFilters.clarities = filters.clarities.map(c => c.toUpperCase());
    }
    // Price filter — convert GBP to USD for Nivoda
    if (filters.minPrice || filters.maxPrice) {
      gqlFilters.price = {
        from: filters.minPrice ? Math.round(filters.minPrice / USD_TO_GBP) : 0,
        to:   filters.maxPrice ? Math.round(filters.maxPrice / USD_TO_GBP) : 999_999,
      };
    }

    const json = await gql(DIAMONDS_QUERY, {
      offset:  filters.offset ?? 0,
      limit:   filters.limit  ?? 48,
      filters: gqlFilters,
    }, token) as NivodaQueryResponse;

    // Surface any GraphQL errors from the query
    if (json.errors?.length) {
      const msg = json.errors.map(e => e.message).join('; ');
      console.error('[Nivoda] Query error:', msg);
      return null;
    }

    const items = json?.data?.diamonds?.items ?? [];
    const total = json?.data?.diamonds?.total_count ?? 0;
    console.log(`[Nivoda] ✅ ${items.length} diamonds fetched (total ${total})`);

    return {
      diamonds: items.filter(d => d.available).map(mapDiamond),
      total,
    };
  } catch (err) {
    console.error('[Nivoda] ❌ Error:', (err as Error).message);
    return null; // graceful fallback to MongoDB
  }
}

/**
 * Check Nivoda status — used by the admin debug endpoint.
 */
export async function checkNivodaStatus(): Promise<{
  configured: boolean;
  status: 'ok' | 'auth_failed' | 'query_failed' | 'not_configured';
  error?: string;
  diamondCount?: number;
}> {
  if (!process.env.NIVODA_USERNAME || !process.env.NIVODA_PASSWORD) {
    return { configured: false, status: 'not_configured' };
  }

  let token: string;
  try {
    token = await getToken();
  } catch (err) {
    return { configured: true, status: 'auth_failed', error: (err as Error).message };
  }

  try {
    const json = await gql(DIAMONDS_QUERY, {
      offset: 0, limit: 5, filters: { lab_grown: false },
    }, token) as NivodaQueryResponse;

    if (json.errors?.length) {
      return { configured: true, status: 'query_failed', error: json.errors[0].message };
    }

    const total = json?.data?.diamonds?.total_count ?? 0;
    return { configured: true, status: 'ok', diamondCount: total };
  } catch (err) {
    return { configured: true, status: 'query_failed', error: (err as Error).message };
  }
}
