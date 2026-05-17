import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.model';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { isActive: true };

  if (req.query.category) query.category = req.query.category;
  if (req.query.minPrice || req.query.maxPrice) {
    query.basePrice = {};
    if (req.query.minPrice) (query.basePrice as Record<string, number>).$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) (query.basePrice as Record<string, number>).$lte = Number(req.query.maxPrice);
  }
  if (req.query.metal) query['metalOptions.type'] = req.query.metal;
  if (req.query.gemstone) query.gemstone = req.query.gemstone;
  if (req.query.style) query.style = req.query.style;
  if (req.query.isFeatured) query.isFeatured = req.query.isFeatured === 'true';
  if (req.query.isRingBuilder !== undefined) query.isRingBuilder = req.query.isRingBuilder === 'true';
  if (req.query.search) query.$text = { $search: req.query.search as string };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    'price-asc': { basePrice: 1 },
    'price-desc': { basePrice: -1 },
    newest: { createdAt: -1 },
    rating: { averageRating: -1 },
    popular: { soldCount: -1 },
  };
  const sort = sortMap[req.query.sort as string] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(query).lean().sort(sort).skip(skip).limit(limit).populate('category', 'name slug'),
    Product.countDocuments(query),
  ]);

  res.json({ products, total, page, pages: Math.ceil(total / limit) });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).lean().populate('category', 'name slug');
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }
  res.json(product);
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .lean().limit(8)
    .populate('category', 'name slug');
  res.json(products);
});

export const getBestsellers = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isBestseller: true, isActive: true })
    .lean().sort({ soldCount: -1 })
    .limit(8)
    .populate('category', 'name slug');
  res.json(products);
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).lean().limit(4).populate('category', 'name slug');
  res.json(related);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  res.json({ message: 'Product removed' });
});
