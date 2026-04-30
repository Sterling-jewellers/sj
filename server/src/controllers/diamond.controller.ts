import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Diamond from '../models/Diamond.model';

export const getDiamonds = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { isAvailable: true };

  if (req.query.shape) query.shape = { $in: (req.query.shape as string).split(',') };
  if (req.query.color) query.color = { $in: (req.query.color as string).split(',') };
  if (req.query.clarity) query.clarity = { $in: (req.query.clarity as string).split(',') };
  if (req.query.cut) query.cut = { $in: (req.query.cut as string).split(',') };
  if (req.query.lab) query['certificate.lab'] = { $in: (req.query.lab as string).split(',') };

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
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'carat-asc': { caratWeight: 1 },
    'carat-desc': { caratWeight: -1 },
  };
  const sort = sortMap[req.query.sort as string] || { price: 1 };

  const [diamonds, total] = await Promise.all([
    Diamond.find(query).sort(sort).skip(skip).limit(limit),
    Diamond.countDocuments(query),
  ]);

  res.json({ diamonds, total, page, pages: Math.ceil(total / limit) });
});

export const getDiamondById = asyncHandler(async (req: Request, res: Response) => {
  const diamond = await Diamond.findById(req.params.id);
  if (!diamond) { res.status(404).json({ message: 'Diamond not found' }); return; }
  res.json(diamond);
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
