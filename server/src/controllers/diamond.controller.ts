import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Diamond from '../models/Diamond.model';
import { searchNivodaDiamonds, checkNivodaStatus } from '../services/nivoda.service';

// GET /api/diamonds/nivoda-status
// Admin debug endpoint — tells you if Nivoda is connected and has inventory
export const getNivodaStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = await checkNivodaStatus();
  res.json(status);
});

export const getDiamonds = asyncHandler(async (req: Request, res: Response) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Math.min(Number(req.query.limit) || 100, 500); // cap at 500 per page
  const skip  = (page - 1) * limit;

  // ── Build MongoDB query ───────────────────────────────────────────────────
  const query: Record<string, unknown> = { isAvailable: true };

  // Accept both spellings: labgrown (legacy) and labGrown (camelCase from frontend)
  const labgrownParam = (req.query.labGrown ?? req.query.labgrown) as string | undefined;
  if (labgrownParam === 'true')  query.isLabGrown = true;
  if (labgrownParam === 'false') query.isLabGrown = false;

  if (req.query.shape)   query.shape              = { $in: (req.query.shape as string).split(',').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) };
  if (req.query.color)   query.color              = { $in: (req.query.color as string).split(',').map(s => s.toUpperCase()) };
  if (req.query.clarity) query.clarity            = { $in: (req.query.clarity as string).split(',').map(s => s.toUpperCase()) };
  if (req.query.cut)     query.cut                = { $in: (req.query.cut as string).split(',') };
  if (req.query.lab)     query['certificate.lab'] = { $in: (req.query.lab as string).split(',').map(s => s.toUpperCase()) };

  if (req.query.minCarat || req.query.maxCarat) {
    query.caratWeight = {};
    if (req.query.minCarat) (query.caratWeight as Record<string, number>).$gte = Number(req.query.minCarat);
    if (req.query.maxCarat) (query.caratWeight as Record<string, number>).$lte = Number(req.query.maxCarat);
  }
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) (query.price as Record<string, number>).$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) (query.price as Record<string, number>).$lte = Number(req.query.maxPrice);
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    'price-asc':   { price: 1 }, 'price-desc': { price: -1 },
    'carat-asc':   { caratWeight: 1 }, 'carat-desc': { caratWeight: -1 },
  };
  const sort = sortMap[req.query.sort as string] || { price: 1 };

  // ── Use MongoDB first (synced from Nivoda) — no live API call per request ─
  const [diamonds, total] = await Promise.all([
    Diamond.find(query).lean().sort(sort).skip(skip).limit(limit),
    Diamond.countDocuments(query),
  ]);

  if (total > 0) {
    res.json({ diamonds, total, page, pages: Math.ceil(total / limit), source: 'local' });
    return;
  }

  // ── Fall back to live Nivoda only when local DB is empty ──────────────────
  const labgrown = labgrownParam === 'true' ? true : labgrownParam === 'false' ? false : undefined;
  const nivodaResult = await searchNivodaDiamonds({
    shapes:    req.query.shape   ? (req.query.shape as string).split(',')   : undefined,
    colors:    req.query.color   ? (req.query.color as string).split(',')   : undefined,
    clarities: req.query.clarity ? (req.query.clarity as string).split(',') : undefined,
    labs:      req.query.lab     ? (req.query.lab as string).split(',')     : undefined,
    minCarat:  req.query.minCarat ? Number(req.query.minCarat) : undefined,
    maxCarat:  req.query.maxCarat ? Number(req.query.maxCarat) : undefined,
    minPrice:  req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice:  req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    labgrown, limit, offset: skip,
  });

  if (nivodaResult) {
    res.json({ diamonds: nivodaResult.diamonds, total: nivodaResult.total, page, pages: Math.ceil(nivodaResult.total / limit), source: 'nivoda' });
    return;
  }

  res.json({ diamonds: [], total: 0, page, pages: 0, source: 'local' });
});

export const getDiamondById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Try MongoDB ObjectId first (24-char hex)
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    const diamond = await Diamond.findById(id).lean();
    if (diamond) { res.json(diamond); return; }
  }

  // Try nivodaId field (UUID) — synced diamonds are in MongoDB, no live API call needed
  const byNivodaId = await Diamond.findOne({ nivodaId: id }).lean();
  if (byNivodaId) { res.json(byNivodaId); return; }

  res.status(404).json({ message: 'Diamond not found' });
});

export const createDiamond = asyncHandler(async (req: Request, res: Response) => {
  const diamond = await Diamond.create(req.body);
  res.status(201).json(diamond);
});

export const updateDiamond = asyncHandler(async (req: Request, res: Response) => {
  const diamond = await Diamond.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!diamond) { res.status(404).json({ message: 'Diamond not found' }); return; }
  res.json(diamond);
});

export const deleteDiamond = asyncHandler(async (req: Request, res: Response) => {
  await Diamond.findByIdAndUpdate(req.params.id, { isAvailable: false });
  res.json({ message: 'Diamond removed' });
});
