/**
 * Nivoda Diamond API — GraphQL Integration (Loupe360 endpoint)
 *
 * Correct API structure (verified by introspection 2025-05):
 *  • Auth:    QUERY  { authenticate { username_and_password(username, password) { token } } }
 *  • Diamonds: QUERY  { diamonds_by_query(offset, limit, query) { items { ... } total_count } }
 *              → token sent as Authorization: Bearer header
 *  • All diamond media is on certificate: { image, v360 { url } }
 *  • Price is in cents USD (divide by 100)
 *  • Filter field names: labgrown (not lab_grown), color/clarity as arrays
 */

const NIVODA_GQL = 'https://integrations.nivoda.net/graphql-loupe360';
const USD_TO_GBP = parseFloat(process.env.USD_TO_GBP_RATE || '0.79');

// ── TypeScript interfaces ──────────────────────────────────────────────────────
interface NivodaSession {
  token:         string;
  expires:       number;
  refresh_token: string;
}
interface NivodaCertificate {
  certNumber:       string | null;
  lab:              string | null;
  labgrown:         boolean | null;
  shape:            string | null;
  carats:           number | null;
  color:            string | null;
  clarity:          string | null;
  cut:              string | null;
  polish:           string | null;
  symmetry:         string | null;
  floInt:           string | null;         // fluorescence intensity
  depthPercentage:  string | null;
  table:            string | null;
  length:           string | null;
  width:            string | null;
  depth:            string | null;
  pdfUrl:           string | null;
  image:            string | null;
  // v360 intentionally excluded — causes timeout for unverified accounts
}
interface NivodaDiamondItem {
  id:          string;
  price:       number;                    // price in USD cents
  certificate: NivodaCertificate;
}
interface NivodaQueryResponse {
  data?: {
    diamonds_by_query?: {
      items:       NivodaDiamondItem[];
      total_count: number;
    };
  };
  errors?: { message: string }[];
}

// ── Shape filter map ──────────────────────────────────────────────────────────
const SHAPE_MAP: Record<string, string> = {
  round:    'ROUND',   oval:     'OVAL',    princess: 'PRINCESS',
  cushion:  'CUSHION', emerald:  'EMERALD', pear:     'PEAR',
  radiant:  'RADIANT', asscher:  'ASSCHER', marquise: 'MARQUISE',
  heart:    'HEART',
};

// ── GraphQL query ─────────────────────────────────────────────────────────────
// NOTE: v360 { url } is intentionally EXCLUDED — it causes a timeout for accounts
// that don't have the Loupe360 media API enabled. image field is safe to include.
const DIAMONDS_QUERY = `
  query GetDiamonds($offset: Int, $limit: Int, $query: DiamondQuery) {
    diamonds_by_query(
      offset: $offset
      limit:  $limit
      query:  $query
    ) {
      total_count
      items {
        id
        price
        certificate {
          certNumber
          lab
          labgrown
          shape
          carats
          color
          clarity
          cut
          polish
          symmetry
          floInt
          depthPercentage
          table
          length
          width
          depth
          pdfUrl
          image
        }
      }
    }
  }
`;

// ── Token cache ───────────────────────────────────────────────────────────────
let cachedToken:    string | null = null;
let tokenExpiresAt: number        = 0;

async function gql(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(NIVODA_GQL, {
    method:  'POST',
    headers,
    body:    JSON.stringify({ query, variables }),
    signal:  AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Nivoda HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Authenticate via:
 *   QUERY { authenticate { username_and_password(username, password) { token } } }
 *
 * No Authorization header needed for the auth query itself.
 */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const username = process.env.NIVODA_USERNAME;
  const password = process.env.NIVODA_PASSWORD;
  if (!username || !password) {
    throw new Error('NIVODA_USERNAME / NIVODA_PASSWORD not set in .env');
  }

  // Inline credentials — Nivoda auth is a QUERY, not a Mutation
  const json = await gql(
    `{ authenticate { username_and_password(username: "${username.replace(/"/g, '')}", password: "${password.replace(/"/g, '')}") { token expires } } }`
  ) as { data?: { authenticate?: { username_and_password?: NivodaSession } }; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`Nivoda auth error: ${json.errors.map(e => e.message).join('; ')}`);
  }

  const session = json?.data?.authenticate?.username_and_password;
  if (!session?.token) {
    throw new Error('Nivoda auth: no token in response — check credentials at app.nivoda.net');
  }

  cachedToken    = session.token;
  // Use expires from response if available, else 23h default
  tokenExpiresAt = session.expires
    ? session.expires - 60_000            // 1 min early refresh
    : Date.now() + 23 * 3_600_000;
  console.log('[Nivoda] ✅ Authenticated successfully');
  return cachedToken;
}

// ── Public filter interface ───────────────────────────────────────────────────
export interface NivodaFilters {
  shapes?:    string[];
  minCarat?:  number;
  maxCarat?:  number;
  colors?:    string[];
  clarities?: string[];
  labs?:      string[];
  minPrice?:  number;   // GBP
  maxPrice?:  number;   // GBP
  labgrown?:  boolean;  // true = lab grown, false = natural, undefined = all
  limit?:     number;
  offset?:    number;
}

function mapDiamond(d: NivodaDiamondItem) {
  const c = d.certificate;

  // Shape: Nivoda returns "PEAR", "CUSHION BRILLIANT", etc.
  const rawShape = c.shape ?? 'ROUND';
  const shapePart = rawShape.split(' ')[0]; // "CUSHION BRILLIANT" → "CUSHION"
  const shape = shapePart.charAt(0).toUpperCase() + shapePart.slice(1).toLowerCase();

  // Price is in USD *cents* → convert to GBP
  const priceGBP = Math.round((d.price / 100) * USD_TO_GBP);

  // Lab cert PDF
  const pdfUrl = c.pdfUrl
    || (c.lab === 'GIA' && c.certNumber
        ? `https://www.gia.edu/report-check?reportno=${c.certNumber}`
        : c.lab === 'IGI' && c.certNumber
        ? `https://www.igi.org/reports/verify-your-report/?r=${c.certNumber}`
        : undefined);

  // Fluorescence: Nivoda uses "NON", "FAINT", "MED", etc.
  const fluorMap: Record<string, string> = {
    NON: 'None', FAINT: 'Faint', MED: 'Medium', STG: 'Strong', VST: 'Very Strong',
  };
  const fluorescence = fluorMap[c.floInt ?? ''] ?? c.floInt ?? 'None';

  return {
    _id:         d.id,
    sku:         c.certNumber || d.id,
    shape,
    caratWeight: c.carats ?? 0,
    cut:         c.cut       ?? 'Excellent',
    color:       c.color     ?? 'G',
    clarity:     c.clarity   ?? 'VS1',
    polish:      c.polish    ?? 'Excellent',
    symmetry:    c.symmetry  ?? 'Excellent',
    fluorescence,
    price:       priceGBP,
    certificate: {
      lab:    c.lab    ?? undefined,
      number: c.certNumber ?? undefined,
      pdfUrl: pdfUrl   ?? undefined,
    },
    measurements: {
      length:       parseFloat(c.length  ?? '0') || 0,
      width:        parseFloat(c.width   ?? '0') || 0,
      depth:        parseFloat(c.depth   ?? '0') || 0,
      depthPercent: parseFloat(c.depthPercentage ?? '0') || 0,
      tablePercent: parseFloat(c.table   ?? '0') || 0,
    },
    imageUrl:    c.image          || null,
    videoUrl:    null,
    loupe360:    null,            // v360 disabled until account has media API access
    isLabGrown:  c.labgrown      ?? false,
    isAvailable: true,
    source:      'nivoda' as const,
  };
}

/**
 * Search Nivoda live inventory.
 * Returns null when credentials absent → caller falls back to MongoDB.
 */
export async function searchNivodaDiamonds(filters: NivodaFilters) {
  if (!process.env.NIVODA_USERNAME || !process.env.NIVODA_PASSWORD) return null;

  try {
    const token = await getToken();

    // ── Build DiamondQuery ────────────────────────────────────────────────────
    const query: Record<string, unknown> = {};

    // labgrown filter — undefined = show all (natural + lab grown)
    if (filters.labgrown !== undefined) {
      query.labgrown = filters.labgrown;
    }
    // If no explicit filter, don't add labgrown so Nivoda returns both types

    if (filters.shapes?.length) {
      query.shapes = filters.shapes.map(s => SHAPE_MAP[s.toLowerCase()] ?? s.toUpperCase());
    }
    if (filters.minCarat || filters.maxCarat) {
      // sizes is a LIST of FloatRange objects
      query.sizes = [{ from: filters.minCarat ?? 0.3, to: filters.maxCarat ?? 10 }];
    }
    if (filters.colors?.length) {
      query.color = filters.colors.map(c => c.toUpperCase());
    }
    if (filters.clarities?.length) {
      query.clarity = filters.clarities.map(c => c.toUpperCase());
    }
    if (filters.labs?.length) {
      query.certificate_lab = filters.labs.map(l => l.toUpperCase());
    }
    if (filters.minPrice || filters.maxPrice) {
      // Nivoda price is in USD cents; dollar_value is IntRange in USD
      const rateInv = 1 / USD_TO_GBP;
      query.dollar_value = {
        from: filters.minPrice ? Math.round(filters.minPrice * rateInv * 100) : 0,
        to:   filters.maxPrice ? Math.round(filters.maxPrice * rateInv * 100) : 999_999_999,
      };
    }

    const json = await gql(DIAMONDS_QUERY, {
      offset: filters.offset ?? 0,
      limit:  filters.limit  ?? 48,
      query,
    }, token) as NivodaQueryResponse;

    if (json.errors?.length) {
      const msg = json.errors.map(e => e.message).join('; ');
      console.error('[Nivoda] Query error:', msg);
      return null;
    }

    const items = json?.data?.diamonds_by_query?.items ?? [];
    const total = json?.data?.diamonds_by_query?.total_count ?? 0;
    console.log(`[Nivoda] ✅ ${items.length} diamonds fetched (total: ${total})`);

    return {
      diamonds: items.map(mapDiamond),
      total,
    };
  } catch (err) {
    console.error('[Nivoda] ❌', (err as Error).message);
    return null;
  }
}

// ── Enum maps for MongoDB Diamond model ──────────────────────────────────────
const VALID_SHAPES = new Set(['round','princess','oval','cushion','emerald','pear','marquise','radiant','asscher','heart']);
const VALID_CUTS   = new Set(['Ideal','Excellent','Very Good','Good','Fair']);
const VALID_COLORS = new Set(['D','E','F','G','H','I','J','K']);
const VALID_CLARITY = new Set(['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1']);
const VALID_LABS   = new Set(['GIA','IGI','HRD','AGS']);
const VALID_POLISH_SYM = new Set(['Excellent','Very Good','Good']);

const CUT_MAP: Record<string, string> = {
  IDEAL:     'Ideal',
  EXCELLENT: 'Excellent',
  VERY_GOOD: 'Very Good',
  'VERY GOOD': 'Very Good',
  GOOD:      'Good',
  FAIR:      'Fair',
};

function mapDiamondForDb(d: NivodaDiamondItem) {
  const c = d.certificate;

  // Shape → lowercase to match model enum
  const rawShape = (c.shape ?? 'ROUND').split(' ')[0].toLowerCase();
  const shape = VALID_SHAPES.has(rawShape) ? rawShape : null;
  if (!shape) return null;

  // Lab cert required fields
  const lab = c.lab?.toUpperCase() ?? '';
  if (!VALID_LABS.has(lab)) return null;
  const certNumber = c.certNumber;
  if (!certNumber) return null;

  // Color / clarity
  const color   = c.color?.toUpperCase() ?? '';
  const clarity = c.clarity?.toUpperCase() ?? '';
  if (!VALID_COLORS.has(color) || !VALID_CLARITY.has(clarity)) return null;

  // Cut — Nivoda sends "EXCELLENT", "VERY GOOD" etc.
  const rawCut = (c.cut ?? '').toUpperCase().replace(/_/g, ' ');
  const cut    = CUT_MAP[rawCut] ?? (VALID_CUTS.has(c.cut ?? '') ? c.cut! : 'Excellent');

  // Polish / symmetry
  const rawPolish = (c.polish ?? '').toUpperCase().replace(/_/g, ' ');
  const polish    = CUT_MAP[rawPolish] ?? 'Excellent';
  const rawSym    = (c.symmetry ?? '').toUpperCase().replace(/_/g, ' ');
  const symmetry  = CUT_MAP[rawSym] ?? 'Excellent';

  if (!VALID_POLISH_SYM.has(polish as string)) return null;
  if (!VALID_POLISH_SYM.has(symmetry as string)) return null;

  // Price USD cents → GBP
  const priceGBP = Math.round((d.price / 100) * USD_TO_GBP);
  if (priceGBP <= 0) return null;

  // Fluorescence
  const fluorMap: Record<string, string> = {
    NON: 'None', FAINT: 'Faint', MED: 'Medium', STG: 'Strong', VST: 'Very Strong',
    NONE: 'None', MEDIUM: 'Medium', STRONG: 'Strong',
  };
  const fluorescence = fluorMap[(c.floInt ?? '').toUpperCase()] ?? 'None';

  // Lab cert PDF
  const pdfUrl = c.pdfUrl
    || (lab === 'GIA' && certNumber ? `https://www.gia.edu/report-check?reportno=${certNumber}` : undefined)
    || (lab === 'IGI' && certNumber ? `https://www.igi.org/reports/verify-your-report/?r=${certNumber}` : undefined);

  return {
    sku:         certNumber,
    nivodaId:    d.id,
    shape,
    caratWeight: c.carats ?? 0,
    cut,
    color,
    clarity,
    polish,
    symmetry,
    fluorescence,
    price:       priceGBP,
    certificate: {
      lab,
      number:  certNumber,
      pdfUrl:  pdfUrl ?? undefined,
    },
    measurements: {
      length:       parseFloat(c.length  ?? '0') || 0,
      width:        parseFloat(c.width   ?? '0') || 0,
      depth:        parseFloat(c.depth   ?? '0') || 0,
      depthPercent: parseFloat(c.depthPercentage ?? '0') || 0,
      tablePercent: parseFloat(c.table   ?? '0') || 0,
    },
    imageUrl:    c.image || null,
    videoUrl:    null,
    isLabGrown:  c.labgrown ?? false,
    isAvailable: true,
    source:      'nivoda',
  };
}

const SYNC_BATCH = 200;

// Nivoda caps total_count per query at ~200 regardless of actual inventory size.
// To get broad coverage we iterate every (shape × carat-range × labgrown) bucket,
// paginating each bucket fully before moving to the next.
const ALL_SHAPES = ['ROUND','OVAL','PRINCESS','CUSHION','EMERALD','PEAR','RADIANT','ASSCHER','MARQUISE','HEART'];
const CARAT_RANGES = [
  { from: 0.18, to: 0.49 },
  { from: 0.50, to: 0.89 },
  { from: 0.90, to: 1.19 },
  { from: 1.20, to: 1.69 },
  { from: 1.70, to: 2.49 },
  { from: 2.50, to: 3.99 },
  { from: 4.00, to: 10.0 },
];
const LABGROWN_FLAGS = [false, true];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAndUpsertBucket(
  token: string,
  Diamond: any,
  query: Record<string, unknown>,
  bucketLabel: string,
  errors: string[],
): Promise<{ saved: number; skipped: number; fetched: number }> {
  let offset = 0;
  let saved = 0;
  let skipped = 0;
  let totalInBucket = 0;

  do {
    let items: NivodaDiamondItem[] = [];
    try {
      const json = await gql(DIAMONDS_QUERY, { offset, limit: SYNC_BATCH, query }, token) as NivodaQueryResponse;
      if (json.errors?.length) {
        errors.push(`${bucketLabel} offset=${offset}: ${json.errors.map(e => e.message).join('; ')}`);
        break;
      }
      items          = json?.data?.diamonds_by_query?.items ?? [];
      totalInBucket  = json?.data?.diamonds_by_query?.total_count ?? 0;
    } catch (err) {
      errors.push(`${bucketLabel} fetch error offset=${offset}: ${(err as Error).message}`);
      break;
    }

    if (!items.length) break;

    const docs = items.map(mapDiamondForDb).filter((d): d is NonNullable<typeof d> => d !== null);
    skipped += items.length - docs.length;

    if (docs.length) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ops = docs.map(doc => ({
          updateOne: { filter: { sku: doc.sku }, update: { $set: doc as any }, upsert: true },
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await Diamond.bulkWrite(ops as any, { ordered: false });
        saved += (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
      } catch (err) {
        errors.push(`${bucketLabel} DB write offset=${offset}: ${(err as Error).message}`);
      }
    }

    offset += items.length;
    if (items.length < SYNC_BATCH) break;
  } while (offset < totalInBucket);

  return { saved, skipped, fetched: offset };
}

/**
 * Bulk sync: iterates every (shape × carat-range × lab/natural) bucket so we
 * work around Nivoda's per-query result cap and pull the full catalogue.
 */
export async function syncAllNivodaDiamonds(
  onProgress?: (bucketsDone: number, bucketsTotal: number, savedSoFar: number) => void,
): Promise<{ saved: number; skipped: number; total: number; errors: string[] }> {
  if (!process.env.NIVODA_USERNAME || !process.env.NIVODA_PASSWORD) {
    throw new Error('NIVODA_USERNAME / NIVODA_PASSWORD not set in .env');
  }

  const Diamond = (await import('../models/Diamond.model')).default;
  const token   = await getToken();
  const errors: string[] = [];
  let saved   = 0;
  let skipped = 0;
  let fetched = 0;

  const buckets: Array<{ shapes: string[]; carat: { from: number; to: number }; labgrown: boolean }> = [];
  for (const labgrown of LABGROWN_FLAGS) {
    for (const carat of CARAT_RANGES) {
      for (const shape of ALL_SHAPES) {
        buckets.push({ shapes: [shape], carat, labgrown });
      }
    }
  }

  for (let i = 0; i < buckets.length; i++) {
    const { shapes, carat, labgrown } = buckets[i];
    const label = `${labgrown ? 'lab' : 'natural'} ${shapes[0]} ${carat.from}-${carat.to}ct`;

    const query: Record<string, unknown> = {
      labgrown,
      shapes,
      sizes: [{ from: carat.from, to: carat.to }],
    };

    const result = await fetchAndUpsertBucket(token, Diamond, query, label, errors);
    saved   += result.saved;
    skipped += result.skipped;
    fetched += result.fetched;

    console.log(`[Nivoda sync] bucket ${i + 1}/${buckets.length} "${label}" → +${result.saved} saved (total: ${saved})`);
    onProgress?.(i + 1, buckets.length, saved);
  }

  return { saved, skipped, total: fetched, errors };
}

/**
 * Status check for admin debug endpoint.
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
      offset: 0, limit: 3, query: { labgrown: false },
    }, token) as NivodaQueryResponse;

    if (json.errors?.length) {
      return { configured: true, status: 'query_failed', error: json.errors[0].message };
    }

    const total = json?.data?.diamonds_by_query?.total_count ?? 0;
    return { configured: true, status: 'ok', diamondCount: total };
  } catch (err) {
    return { configured: true, status: 'query_failed', error: (err as Error).message };
  }
}
