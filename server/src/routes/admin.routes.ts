import mongoose from 'mongoose';
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Anthropic from '@anthropic-ai/sdk';
import { v2 as cloudinary } from 'cloudinary';
import Order from '../models/Order.model';
import Product from '../models/Product.model';
import Diamond from '../models/Diamond.model';
import User from '../models/User.model';
import Coupon from '../models/Coupon.model';
import Category from '../models/Category.model';
import { protect, adminOnly } from '../middleware/auth.middleware';
import {
  fetchHanronProducts,
  checkHanronStatus,
  invalidateHanronSession,
} from '../services/hanron.service';
import {
  checkNivodaStatus,
  syncAllNivodaDiamonds,
} from '../services/nivoda.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(protect, adminOnly);

// ─── Dashboard Overview ───────────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  const { range = '30' } = req.query;
  const days = parseInt(range as string, 10) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const prevSince = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

  const pct = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  // Consolidate all Order queries into one $facet — single collection pass
  const [orderFacets, totalProducts, totalUsers, totalDiamonds] = await Promise.all([
    Order.aggregate([
      {
        $facet: {
          totalOrders:     [{ $count: 'n' }],
          totalRevenue:    [{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }],
          recentOrders:    [{ $sort: { createdAt: -1 } }, { $limit: 5 }],
          statusBreakdown: [{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          periodOrders:    [{ $match: { createdAt: { $gte: since } } }, { $count: 'n' }],
          periodRevenue:   [{ $match: { paymentStatus: 'paid', createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: '$total' } } }],
          prevPeriodOrders:  [{ $match: { createdAt: { $gte: prevSince, $lt: since } } }, { $count: 'n' }],
          prevPeriodRevenue: [{ $match: { paymentStatus: 'paid', createdAt: { $gte: prevSince, $lt: since } } }, { $group: { _id: null, total: { $sum: '$total' } } }],
          revenueTimeline: [
            { $match: { paymentStatus: 'paid', createdAt: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          topProducts: [
            { $match: { paymentStatus: 'paid', createdAt: { $gte: since } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.name', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, sold: { $sum: '$items.quantity' } } },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    Diamond.countDocuments(),
  ]);

  const f = orderFacets[0];

  // Populate users on recentOrders
  const recentOrderIds = f.recentOrders.map((o: { _id: mongoose.Types.ObjectId }) => o._id);
  const recentOrders = await Order.find({ _id: { $in: recentOrderIds } })
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName email')
    .lean();

  // User period counts use the indexed role+createdAt compound index
  const [newUsers, prevNewUsers] = await Promise.all([
    User.countDocuments({ role: 'user', createdAt: { $gte: since } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: prevSince, $lt: since } }),
  ]);

  const totalOrders    = f.totalOrders[0]?.n ?? 0;
  const totalRevenue   = f.totalRevenue[0]?.total ?? 0;
  const periodOrders   = f.periodOrders[0]?.n ?? 0;
  const pRevenue       = f.periodRevenue[0]?.total ?? 0;
  const prevPeriodOrders = f.prevPeriodOrders[0]?.n ?? 0;
  const ppRevenue      = f.prevPeriodRevenue[0]?.total ?? 0;

  res.json({
    totalOrders,
    totalRevenue,
    totalProducts,
    totalUsers,
    totalDiamonds,
    recentOrders,
    period: {
      days,
      orders:        periodOrders,
      revenue:       pRevenue,
      newUsers,
      ordersDelta:   pct(periodOrders, prevPeriodOrders),
      revenueDelta:  pct(pRevenue, ppRevenue),
      newUsersDelta: pct(newUsers, prevNewUsers),
    },
    statusBreakdown: f.statusBreakdown.map((s: { _id: string; count: number }) => ({ status: s._id, count: s.count })),
    revenueTimeline: f.revenueTimeline,
    topProducts:     f.topProducts,
  });
}));

// ─── Coupons ──────────────────────────────────────────────────────────────────
router.get('/coupons', asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
}));

router.post('/coupons', asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
}));

router.put('/coupons/:id', asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(coupon);
}));

router.delete('/coupons/:id', asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coupon deleted' });
}));

// ─── Products (admin) ─────────────────────────────────────────────────────────
router.get('/products', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const query: Record<string, unknown> = {};
  if (search) query.name = { $regex: search, $options: 'i' };

  const [products, total] = await Promise.all([
    Product.find(query)
      .lean()
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  res.json({ products, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  res.json(product);
}));

router.post('/products', asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  // Strip Mongoose-reserved fields so they never reach $set
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, createdAt, updatedAt, ...update } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: false }
  ).populate('category', 'name');
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  res.json(product);
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Product deactivated' });
}));

// ─── Diamonds (admin) ─────────────────────────────────────────────────────────
router.get('/diamonds', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const query: Record<string, unknown> = {};
  if (search) query.sku = { $regex: search, $options: 'i' };

  const [diamonds, total] = await Promise.all([
    Diamond.find(query).lean().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Diamond.countDocuments(query),
  ]);

  res.json({ diamonds, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/diamonds/:id', asyncHandler(async (req, res) => {
  const diamond = await Diamond.findById(req.params.id);
  if (!diamond) { res.status(404).json({ message: 'Diamond not found' }); return; }
  res.json(diamond);
}));

router.post('/diamonds', asyncHandler(async (req, res) => {
  const diamond = await Diamond.create(req.body);
  res.status(201).json(diamond);
}));

router.put('/diamonds/:id', asyncHandler(async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, createdAt, updatedAt, ...update } = req.body;
  const diamond = await Diamond.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: false }
  );
  if (!diamond) { res.status(404).json({ message: 'Diamond not found' }); return; }
  res.json(diamond);
}));

router.delete('/diamonds/:id', asyncHandler(async (req, res) => {
  await Diamond.findByIdAndDelete(req.params.id);
  res.json({ message: 'Diamond deleted' });
}));

// ─── Orders (admin) ───────────────────────────────────────────────────────────
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const search = req.query.search as string;

  const query: Record<string, unknown> = {};
  if (status && status !== 'all') query.orderStatus = status;
  if (search) query.orderNumber = { $regex: search, $options: 'i' };

  const [orders, total] = await Promise.all([
    Order.find(query)
      .lean()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  res.json(order);
}));

router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { orderStatus, trackingNumber, trackingUrl } = req.body;
  const update: Record<string, unknown> = { orderStatus };
  if (trackingNumber) update.trackingNumber = trackingNumber;
  if (trackingUrl) update.trackingUrl = trackingUrl;
  if (orderStatus === 'delivered') update.deliveredAt = new Date();
  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'firstName lastName email');
  res.json(order);
}));

// ─── Customers (admin) ────────────────────────────────────────────────────────
router.get('/customers', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const query: Record<string, unknown> = { role: 'user' };
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    User.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: '_orders' } },
      {
        $addFields: {
          orderCount: { $size: '$_orders' },
          totalSpent: { $sum: '$_orders.total' },
        },
      },
      { $project: { password: 0, _orders: 0 } },
    ]),
    User.countDocuments(query),
  ]);

  res.json({ customers, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/customers/:id', asyncHandler(async (req, res) => {
  const [user, orders] = await Promise.all([
    User.findById(req.params.id).lean().select('-password'),
    Order.find({ user: req.params.id }).lean().sort({ createdAt: -1 }),
  ]);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json({ user, orders });
}));

// Create customer (admin)
router.post('/customers', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role = 'user' } = req.body;
  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ message: 'firstName, lastName, email and password are required' }); return;
  }
  const exists = await User.findOne({ email });
  if (exists) { res.status(400).json({ message: 'Email already in use' }); return; }
  const user = await User.create({ firstName, lastName, email, password, role });
  const userObj = user.toObject() as unknown as Record<string, unknown>;
  delete userObj.password;
  res.status(201).json(userObj);
}));

// Update customer (admin)
router.put('/customers/:id', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, role } = req.body;
  const update: Record<string, unknown> = {};
  if (firstName) update.firstName = firstName;
  if (lastName) update.lastName = lastName;
  if (email) update.email = email;
  if (role && ['user', 'admin'].includes(role)) update.role = role;
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json(user);
}));

router.delete('/customers/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Customer deleted' });
}));

router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) { res.status(400).json({ message: 'Invalid role' }); return; }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  res.json(user);
}));

// ─── Categories (admin) ───────────────────────────────────────────────────────
router.get('/categories', asyncHandler(async (_req, res) => {
  const cats = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json(cats);
}));

router.post('/categories', asyncHandler(async (req, res) => {
  const cat = await Category.create(req.body);
  res.status(201).json(cat);
}));

router.put('/categories/:id', asyncHandler(async (req, res) => {
  const { _id, __v, createdAt, updatedAt, ...update } = req.body;
  const cat = await Category.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!cat) { res.status(404).json({ message: 'Category not found' }); return; }
  res.json(cat);
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
}));

// ─── AI: Estimate Competitor / High Street Price ──────────────────────────────
router.post('/ai/competitor-price', asyncHandler(async (req: Request, res: Response) => {
  const { name, metalType, karat, settingType, bandStyle, shankWidth, gemstone, caratWeight } = req.body as {
    name: string; metalType?: string; karat?: string; settingType?: string;
    bandStyle?: string; shankWidth?: string; gemstone?: string; caratWeight?: number;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ message: 'Set ANTHROPIC_API_KEY to use AI price estimation' });
    return;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a luxury jewellery pricing expert with deep knowledge of UK high-street jewellery retailers (Mappin & Webb, Goldsmiths, Ernest Jones, Beaverbrooks, H.Samuel).

Estimate the typical high-street retail price in GBP for this ring:
- Name: ${name}
- Metal: ${karat ? `${karat} ` : ''}${metalType || 'Not specified'}
- Setting Style: ${settingType || 'Not specified'}
- Band Style: ${bandStyle || 'Plain'}
- Shank Width: ${shankWidth || 'Standard'}
- Gemstone / Diamond: ${gemstone || 'Not specified'}${caratWeight ? ` (${caratWeight}ct)` : ''}

Return ONLY a JSON object with no markdown or extra text:
{
  "estimatedHighStreetPrice": <number in GBP, whole number>,
  "rationale": "<one sentence explaining the estimate>",
  "comparables": ["<retailer 1>: approx £<price>", "<retailer 2>: approx £<price>"]
}

Base this on current (2024/2025) UK high-street prices. Be realistic and conservative — don't underestimate. For engagement rings with diamonds, factor in the diamond cost. For plain gold rings, factor in gold market price × typical retail markup.`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const result = JSON.parse(jsonStr);
  res.json(result);
}));

// ─── AI Product Generation ────────────────────────────────────────────────────
router.post('/ai/generate-product', asyncHandler(async (req: Request, res: Response) => {
  const { name, category, metalOptions, style, settingType, gemstone } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ message: 'AI generation not configured — set ANTHROPIC_API_KEY' });
    return;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const metalStr = (metalOptions || []).map((m: { karat?: string; type: string }) => `${m.karat ?? ''} ${m.type}`.trim()).join(', ');
  const prompt = `You are a luxury jewellery copywriter for Sterling Jewellers, a UK-based fine jewellery brand.

Write the following for this product:
- Product name: ${name}
- Category: ${category}
- Metal options: ${metalStr || 'Not specified'}
- Style: ${style || 'Not specified'}
- Setting: ${settingType || 'Not specified'}
- Gemstone: ${gemstone || 'Not specified'}

Output ONLY a JSON object with these fields (no markdown, no extra text):
{
  "shortDescription": "One sentence (under 120 chars) for product listings",
  "description": "3-4 sentences rich HTML describing the piece. Use <p> tags. Mention craftsmanship, occasion suitability, and unique features.",
  "metaTitle": "SEO title under 60 chars including 'Sterling Jewellers'",
  "metaDescription": "SEO meta description 140-160 chars with primary keyword",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  // Strip any accidental markdown fences
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const result = JSON.parse(jsonStr);
  res.json(result);
}));

// ─── Excel Bulk Import ────────────────────────────────────────────────────────
router.post('/products/import', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ message: 'No file uploaded' }); return; }

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (!rows.length) { res.status(400).json({ message: 'Excel file is empty or unreadable' }); return; }

  const errors: string[] = [];
  const toInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // 1-based, header is row 1

    const name = String(r['name'] || r['Name'] || '').trim();
    const categoryId = String(r['categoryId'] || r['CategoryId'] || r['category_id'] || '').trim();
    const basePrice = parseFloat(String(r['basePrice'] || r['BasePrice'] || r['base_price'] || '0'));

    if (!name) { errors.push(`Row ${rowNum}: name is required`); continue; }
    if (!categoryId) { errors.push(`Row ${rowNum}: categoryId is required`); continue; }
    if (isNaN(basePrice) || basePrice <= 0) { errors.push(`Row ${rowNum}: basePrice must be a positive number`); continue; }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now() + '-' + i;

    toInsert.push({
      name,
      slug,
      category: categoryId,
      basePrice,
      shortDescription: String(r['shortDescription'] || r['Short Description'] || name),
      description: String(r['description'] || r['Description'] || ''),
      style: String(r['style'] || r['Style'] || ''),
      gemstone: String(r['gemstone'] || r['Gemstone'] || ''),
      settingType: String(r['settingType'] || r['Setting Type'] || ''),
      salePrice: r['salePrice'] || r['Sale Price'] ? parseFloat(String(r['salePrice'] || r['Sale Price'])) : undefined,
      competitorPrice: r['competitorPrice'] || r['Competitor Price'] ? parseFloat(String(r['competitorPrice'] || r['Competitor Price'])) : undefined,
      images: String(r['images'] || r['Images'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      tags: String(r['tags'] || r['Tags'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      metalOptions: [{ type: String(r['metalType'] || r['Metal Type'] || 'yellow-gold'), karat: String(r['karat'] || r['Karat'] || '18ct'), priceModifier: 0, isDefault: true, images: [] }],
      isActive: true, isNewArrival: true, isFeatured: false, isBestseller: false, isEngravable: false,
      deliveryDays: parseInt(String(r['deliveryDays'] || r['Delivery Days'] || '7'), 10) || 7,
    });
  }

  let inserted = 0;
  const insertErrors: string[] = [];
  for (const doc of toInsert) {
    try {
      await Product.create(doc);
      inserted++;
    } catch (e: unknown) {
      insertErrors.push(`"${doc.name}": ${(e as Error).message}`);
    }
  }

  res.json({
    message: `Import complete: ${inserted} products created, ${errors.length + insertErrors.length} errors`,
    inserted,
    validationErrors: errors,
    insertErrors,
  });
}));

// ─── AI: Generate Metal-Coloured Image (Replicate img2img) ───────────────────
router.post('/ai/generate-metal-image', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl, metalType, karat } = req.body as { imageUrl: string; metalType: string; karat?: string };

  if (!process.env.REPLICATE_API_TOKEN) {
    res.status(503).json({ message: 'AI image generation not configured — add REPLICATE_API_TOKEN to server/.env' });
    return;
  }
  if (!imageUrl || !metalType) {
    res.status(400).json({ message: 'imageUrl and metalType are required' });
    return;
  }

  const metalPrompts: Record<string, string> = {
    'yellow-gold': `luxury jewellery product photo, ${karat || '18ct'} yellow gold ring, rich warm golden metal, same ring design, professional studio lighting, pure white background, 8K`,
    'white-gold':  `luxury jewellery product photo, ${karat || '18ct'} white gold ring, bright cool polished silver-white metal, same ring design, professional studio lighting, pure white background, 8K`,
    'rose-gold':   `luxury jewellery product photo, ${karat || '18ct'} rose gold ring, warm blush-pink polished metal, same ring design, professional studio lighting, pure white background, 8K`,
    'platinum':    `luxury jewellery product photo, platinum ring, cool grey polished metal, same ring design, professional studio lighting, pure white background, 8K`,
    'silver':      `luxury jewellery product photo, sterling silver ring, bright neutral polished metal, same ring design, professional studio lighting, pure white background, 8K`,
  };

  const prompt = metalPrompts[metalType] ?? metalPrompts['yellow-gold'];

  // Call Replicate /models/{owner}/{name}/predictions — uses latest version automatically
  const r = await fetch('https://api.replicate.com/v1/models/stability-ai/sdxl/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'respond-async',
    },
    body: JSON.stringify({
      input: {
        prompt,
        image: imageUrl,
        prompt_strength: 0.35, // keep ring shape, change metal colour
        num_inference_steps: 30,
        guidance_scale: 7.5,
        refine: 'expert_ensemble_refiner',
        high_noise_frac: 0.8,
      },
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    res.status(502).json({ message: `Replicate error: ${err}` });
    return;
  }

  const prediction = await r.json() as { id: string; status: string };
  res.json({ predictionId: prediction.id, status: prediction.status });
}));

// ─── AI: Poll Replicate Generation Status ────────────────────────────────────
router.get('/ai/generation-status/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!process.env.REPLICATE_API_TOKEN) {
    res.status(503).json({ message: 'REPLICATE_API_TOKEN not set' });
    return;
  }
  const r = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
    headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
  });
  const data = await r.json() as { status: string; output?: string[]; error?: string };
  res.json({ status: data.status, output: data.output, error: data.error });
}));

// ─── AI: Patch Metal Option Images ───────────────────────────────────────────
router.patch('/products/:id/metal-images', asyncHandler(async (req: Request, res: Response) => {
  const { metalType, imageUrl } = req.body as { metalType: string; imageUrl: string };
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  const idx = product.metalOptions.findIndex(m => m.type === metalType);
  if (idx === -1) { res.status(404).json({ message: 'Metal option not found on this product' }); return; }
  product.metalOptions[idx].images.push(imageUrl);
  await product.save();
  res.json({ success: true, images: product.metalOptions[idx].images });
}));

// Ensure an image URL is publicly accessible before sending to Meshy.
// Non-Cloudinary URLs (e.g. scraped Hanron images) are fetched server-side
// and re-uploaded to Cloudinary so Meshy can always download them.
async function toPublicImageUrl(imageUrl: string): Promise<string> {
  if (imageUrl.includes('res.cloudinary.com')) return imageUrl;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const resp = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SterlingBot/1.0)' },
  });
  if (!resp.ok) throw new Error(`Could not fetch image (${resp.status}): ${imageUrl}`);

  const buffer = Buffer.from(await resp.arrayBuffer());
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sterling-jewellers/3d-source', resource_type: 'image' },
      (err, res) => (err ? reject(err) : resolve(res as { secure_url: string })),
    );
    stream.end(buffer);
  });
  return result.secure_url;
}

// Upload a Hanron product image to Cloudinary so it can be served from CDN in production.
// Hanron's website is behind Cloudflare which blocks datacenter IPs (Render/Netlify image
// optimiser). By re-hosting on Cloudinary during the sync (which always runs from localhost)
// the production site never needs to contact hanronjewellery.com.
// Returns the Cloudinary URL on success, or the original URL as a fallback.
async function uploadHanronImageToCloudinary(imageUrl: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.includes('res.cloudinary.com'))   return imageUrl; // already uploaded

  const hasCredentials =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY    &&
    process.env.CLOUDINARY_API_SECRET;
  if (!hasCredentials) return imageUrl; // no Cloudinary config — keep original

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const resp = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':     'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer':    'https://hanronjewellery.com/',
      },
    });
    if (!resp.ok) {
      console.warn(`[Hanron] ⚠️  Could not fetch image (${resp.status}): ${imageUrl}`);
      return imageUrl;
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sterling-jewellers/hanron', resource_type: 'image' },
        (err, res) => (err ? reject(err) : resolve(res as { secure_url: string })),
      );
      stream.end(buffer);
    });
    return result.secure_url;
  } catch (err) {
    console.warn(`[Hanron] ⚠️  Cloudinary upload failed for ${imageUrl}: ${(err as Error).message}`);
    return imageUrl; // non-fatal — keep original URL
  }
}

// ─── AI: Start 3D Model Generation (Meshy.ai image-to-3d) ────────────────────
router.post('/ai/generate-3d', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = req.body as { imageUrl: string };

  if (!process.env.MESHY_API_KEY) {
    res.status(503).json({ message: '3D generation not configured — add MESHY_API_KEY to server/.env' });
    return;
  }
  if (!imageUrl) { res.status(400).json({ message: 'imageUrl is required' }); return; }

  let publicUrl: string;
  try {
    publicUrl = await toPublicImageUrl(imageUrl);
  } catch (e) {
    res.status(502).json({ message: `Could not retrieve image: ${(e as Error).message}` });
    return;
  }

  const r = await fetch('https://api.meshy.ai/v1/image-to-3d', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: publicUrl,
      ai_model:  'meshy-6',
    }),
  });

  if (!r.ok) {
    const body = await r.text();
    let msg: string;
    try { msg = (JSON.parse(body) as { message?: string })?.message || body; } catch { msg = body; }
    res.status(502).json({ message: `Meshy error: ${msg}` });
    return;
  }

  const data = await r.json() as { result?: string; task_id?: string };
  const taskId = data.result ?? data.task_id;
  if (!taskId) { res.status(502).json({ message: 'Meshy returned no task ID' }); return; }
  res.json({ taskId });
}));

// ─── AI: Poll Meshy 3D Task Status ───────────────────────────────────────────
router.get('/ai/3d-status/:taskId', asyncHandler(async (req: Request, res: Response) => {
  if (!process.env.MESHY_API_KEY) {
    res.status(503).json({ message: 'MESHY_API_KEY not set' }); return;
  }

  const r = await fetch(`https://api.meshy.ai/v1/image-to-3d/${req.params.taskId}`, {
    headers: { Authorization: `Bearer ${process.env.MESHY_API_KEY}` },
  });
  if (!r.ok) {
    const body = await r.text();
    res.status(502).json({ message: `Meshy status error: ${body}` }); return;
  }

  const data = await r.json() as {
    status: string; progress?: number;
    model_urls?: { glb?: string; fbx?: string; obj?: string };
    thumbnail_url?: string;
    task_error?: { message: string };
  };

  const status = (data.status || '').toUpperCase();
  if (status === 'SUCCEEDED' || status === 'COMPLETE' || status === 'COMPLETED') {
    res.json({ status: 'completed', modelUrl: data.model_urls?.glb, previewUrl: data.thumbnail_url });
  } else if (status === 'FAILED' || status === 'ERROR') {
    res.json({ status: 'failed', error: data.task_error?.message || 'Generation failed' });
  } else {
    res.json({ status: 'processing', progress: data.progress ?? 0 });
  }
}));

// ─── Save 3D Model URL to Product ────────────────────────────────────────────
router.patch('/products/:id/model3d', asyncHandler(async (req: Request, res: Response) => {
  const { model3dUrl, model3dPreview } = req.body as { model3dUrl: string; model3dPreview?: string };
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { model3dUrl, ...(model3dPreview && { model3dPreview }) },
    { new: true },
  );
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  res.json({ success: true, model3dUrl: product.model3dUrl });
}));

// ─── Sample Excel Template Download ──────────────────────────────────────────
router.get('/products/import/template', (_req: Request, res: Response) => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['name','categoryId','basePrice','salePrice','competitorPrice','shortDescription','description','style','gemstone','settingType','metalType','karat','images','tags','deliveryDays'],
    ['Classic Round Solitaire','<paste category _id here>','850','','1200','Elegant round brilliant diamond ring','<p>A timeless solitaire ring...</p>','solitaire','round','four-claw','platinum','18ct','https://example.com/image.jpg','engagement,solitaire,classic','7'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="sterling-import-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// ─── Hanron Jewellery Integration ────────────────────────────────────────────

// GET /api/admin/hanron/status
router.get('/hanron/status', asyncHandler(async (_req: Request, res: Response) => {
  const status = await checkHanronStatus();
  res.json(status);
}));

// POST /api/admin/hanron/sync
// Body: { categories?: string[], maxPages?: number, detailScrape?: boolean,
//         saveToDb?: boolean, defaultCategoryId?: string }
router.post('/hanron/sync', asyncHandler(async (req: Request, res: Response) => {
  // Hanron scraping only works from a residential IP.
  // Cloudflare blocks Render's datacenter IPs with a 403.
  if (process.env.NODE_ENV === 'production') {
    res.status(503).json({
      success: false,
      message: 'Hanron sync is unavailable on the production server — Cloudflare blocks datacenter IPs.',
      fix: 'Run this sync from your local machine: POST http://localhost:5001/api/admin/hanron/sync',
    });
    return;
  }

  const {
    categories,
    saveToDb    = false,
    defaultCategoryId,
  } = req.body as {
    categories?:        string[];
    saveToDb?:          boolean;
    defaultCategoryId?: string;
  };

  const result = await fetchHanronProducts({ categories });

  if (!saveToDb) {
    // Dry-run: return scraped data without saving
    res.json({
      success: true,
      total:   result.total,
      errors:  result.errors,
      preview: result.products.slice(0, 50),
    });
    return;
  }


  // ── Hanron categories that should appear as ring mounts in the ring builder ───
  // Only Gold Ladies Rings are engagement ring settings in the ring builder.
  // Wedding Bands, Signet Rings and Gents Rings are separate product categories.
  const RING_BUILDER_CATS = new Set([
    'Gold Ladies Rings',
  ]);

  // ── Category map: Hanron category name → Sterling Jewellers category ─────────
  const HANRON_CAT_MAP: Record<string, { name: string; slug: string; description: string; sortOrder: number }> = {
    'Gold Ladies Rings':  { name: 'Engagement Ring Settings', slug: 'engagement-rings', description: 'Handcrafted engagement ring settings in 9ct and 18ct gold. Browse our ring mounts and pair with a diamond to build your perfect engagement ring.', sortOrder: 5 },
    'Gold Gents Rings':   { name: 'Gents Rings',        slug: 'gents-rings',        description: 'Sophisticated gents gold rings for every occasion. Discover our range of 9ct and 18ct gold rings for men.',                      sortOrder: 11 },
    'Gold Baby Rings':    { name: 'Baby & Children Rings', slug: 'baby-rings',      description: 'Delicate gold baby and children\'s rings — a timeless and cherished gift for christenings, birthdays and special occasions.',    sortOrder: 12 },
    'Gold Signet Rings':  { name: 'Signet Rings',       slug: 'signet-rings',       description: 'Classic and personalised gold signet rings. Traditional flat and engraved styles in 9ct and 18ct yellow, white and rose gold.',  sortOrder: 13 },
    'Gold Earrings':      { name: 'Gold Earrings',      slug: 'gold-earrings',      description: 'Stunning gold earrings — studs, hoops, drops and dangles in 9ct and 18ct yellow, white and rose gold. Free UK delivery.',        sortOrder: 20 },
    'Gold Pendants':      { name: 'Gold Pendants',      slug: 'gold-pendants',      description: 'Beautiful gold pendants and necklaces for every style and occasion. Shop 9ct and 18ct gold pendants with free UK delivery.',      sortOrder: 30 },
    'Gold Bracelets':     { name: 'Gold Bracelets',     slug: 'gold-bracelets',     description: 'Exquisite gold bracelets in 9ct and 18ct yellow, white and rose gold. From delicate chains to bold statement pieces.',            sortOrder: 40 },
    'Gold Bangles':       { name: 'Gold Bangles',       slug: 'gold-bangles',       description: 'Luxurious gold bangles — a timeless addition to any jewellery collection. Shop 9ct and 18ct gold bangles online.',                sortOrder: 41 },
    'Gold Chains':        { name: 'Gold Chains',        slug: 'gold-chains',        description: 'Fine gold chains in a range of styles, lengths and weights. Shop 9ct and 18ct yellow, white and rose gold chains.',               sortOrder: 50 },
    'Silver Rings':       { name: 'Silver Rings',       slug: 'silver-rings',       description: 'Contemporary and classic sterling silver rings. Shop our full range of 925 sterling silver rings with free UK delivery.',          sortOrder: 60 },
    'Silver Earrings':    { name: 'Silver Earrings',    slug: 'silver-earrings',    description: 'Beautiful sterling silver earrings — studs, hoops and drops. Shop our full 925 silver earring range with free UK delivery.',       sortOrder: 61 },
    'Silver Pendants':    { name: 'Silver Pendants',    slug: 'silver-pendants',    description: 'Elegant sterling silver pendants and necklaces. Discover our range of 925 silver pendants with fast UK delivery.',                  sortOrder: 62 },
    'Silver Bracelets':   { name: 'Silver Bracelets',   slug: 'silver-bracelets',   description: 'Stylish sterling silver bracelets and bangles. Shop our 925 silver bracelet collection with free UK delivery.',                    sortOrder: 63 },
    'Diamonds':           { name: 'Diamond Jewellery',  slug: 'diamond-jewellery',  description: 'Exquisite diamond jewellery — rings, earrings, pendants and bracelets. Ethically sourced diamonds, expertly set.',                 sortOrder: 70 },
    'Wedding Bands':      { name: 'Wedding Bands',      slug: 'wedding-bands',      description: 'Beautiful wedding bands in gold, platinum and silver. Shop classic, pave and diamond-set wedding rings for him and her.',           sortOrder: 80 },
    'Lab Grown Diamonds': { name: 'Lab Grown Diamonds', slug: 'lab-grown-diamonds', description: 'Stunning lab grown diamond jewellery — sustainable, ethical and beautiful. Same brilliance as mined diamonds at a lower price.',    sortOrder: 85 },
  };

  // ── Pre-build category ID cache (find-or-create once per unique category) ────
  const categoryIdCache: Record<string, string> = {};
  if (!defaultCategoryId) {
    for (const [hanronName, catDef] of Object.entries(HANRON_CAT_MAP)) {
      let cat = await Category.findOne({ slug: catDef.slug });
      if (!cat) {
        cat = await Category.create({
          name:        catDef.name,
          slug:        catDef.slug,
          description: catDef.description,
          image:       '/images/categories/placeholder.jpg',
          isActive:    true,
          sortOrder:   catDef.sortOrder,
          sourceStore: 'Hanron Jewellery',
        });
      }
      categoryIdCache[hanronName] = (cat._id as mongoose.Types.ObjectId).toString();
    }
  }

  // Save to MongoDB — upsert on slug to avoid duplicates
  let created = 0, updated = 0;
  const saveErrors: string[] = [...result.errors];

  for (const p of result.products) {
    try {
      const metalParts = p.metal.split(' ');
      const karat      = metalParts.find(x => x.includes('ct') || x.includes('k')) || '9ct';
      const metalType  = metalParts.filter(x => x !== karat).join(' ').trim() || 'yellow-gold';

      const metalTypeEnum = (['yellow-gold', 'white-gold', 'rose-gold', 'platinum', 'silver'] as const)
        .includes(metalType as 'yellow-gold') ? metalType as 'yellow-gold' | 'white-gold' | 'rose-gold' | 'platinum' | 'silver'
        : 'yellow-gold';

      const karatEnum = (['9ct', '14ct', '18ct'] as const).includes(karat as '9ct') ? karat as '9ct' | '14ct' | '18ct' : '9ct';

      // Resolve category for this product
      const resolvedCategoryId = defaultCategoryId || categoryIdCache[p.category] || Object.values(categoryIdCache)[0] || '';
      if (!resolvedCategoryId) {
        saveErrors.push(`SKU ${p.sku}: no category resolved for Hanron category "${p.category}"`);
        continue;
      }

      // ── Upload image to Cloudinary (so production CDN never hits Hanron's CF) ──
      const rawImageUrl = p.images[0] || '';
      const hostedImage = rawImageUrl
        ? await uploadHanronImageToCloudinary(rawImageUrl)
        : '';

      // ── SEO fields ────────────────────────────────────────────────────────────
      const metalLabel  = p.metal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const catLabel    = HANRON_CAT_MAP[p.category]?.name || p.category;
      const sizesText   = p.sizes.length ? ` Available in ring sizes ${p.sizes.slice(0, 6).join(', ')}${p.sizes.length > 6 ? ' and more' : ''}.` : '';
      const priceText   = p.price ? ` From £${p.price.toFixed(2)}.` : '';
      const gemLabel    = guessGemstone(p.name).replace('-', ' ');

      const metaTitle = `${p.name} | ${metalLabel} | Sterling Jewellers`
        .replace(/\s{2,}/g, ' ').slice(0, 70);

      const metaDescription = (
        `Buy the ${p.name} — a stunning ${metalLabel} piece from our ${catLabel} collection.` +
        `${priceText}` +
        ` Ethically sourced, hallmarked fine jewellery with free UK delivery & free returns.` +
        `${sizesText}`
      ).slice(0, 160);

      const shortDescription = (
        `${p.name} crafted in ${metalLabel}. ` +
        (gemLabel !== 'diamond' ? `Features beautiful ${gemLabel}. ` : '') +
        `Part of our ${catLabel} collection — ethically sourced fine jewellery with free UK delivery.`
      ).slice(0, 200);

      const purityMap: Record<string, string> = { '9ct': '37.5% pure gold', '14ct': '58.3% pure gold', '18ct': '75.0% pure gold' };
      const purityText = purityMap[karatEnum] || '';

      const htmlDescription = `
<h2>${p.name}</h2>
<p>This exquisite <strong>${p.name}</strong> is expertly crafted in <strong>${metalLabel}</strong>, making it a perfect addition to any jewellery collection or a wonderful gift for a loved one.</p>
${purityText ? `<p><strong>Metal Purity:</strong> ${karatEnum} ${metalLabel} — ${purityText}. All pieces are fully hallmarked to UK assay standards.</p>` : ''}
${p.sizes.length ? `<p><strong>Available ring sizes:</strong> ${p.sizes.join(', ')}. Need a different size? Contact us for a free resize.</p>` : ''}
<h3>Why Choose Sterling Jewellers?</h3>
<ul>
  <li>All pieces are fully hallmarked and ethically sourced</li>
  <li>Free UK delivery on all orders</li>
  <li>Free 30-day returns</li>
  <li>Expert customer support 7 days a week</li>
</ul>`.trim();

      const seoTags = buildTags(p);
      // Add high-value search keywords
      seoTags.push(catLabel.toLowerCase(), metalLabel.toLowerCase(), `buy ${catLabel.toLowerCase()} online`, `${metalLabel.toLowerCase()} jewellery uk`);
      if (p.price) {
        if (p.price < 200)  seoTags.push('jewellery under £200', 'affordable gold jewellery');
        if (p.price < 500)  seoTags.push('jewellery under £500');
        if (p.price < 1000) seoTags.push('jewellery under £1000');
      }
      const uniqueTags = [...new Set(seoTags)];

      // ── Pricing: Hanron website price × 1.8 ──────────────────────────────
      const basePrice = +(p.price * 1.8).toFixed(2);

      const doc = {
        name:             p.name,
        slug:             slugifyProduct(p.name + '-' + p.sku),
        shortDescription,
        description:      htmlDescription,
        metaTitle,
        metaDescription,
        basePrice,
        images:           hostedImage ? [hostedImage] : ['/images/placeholder.jpg'],
        metalOptions: [{
          type:          metalTypeEnum,
          karat:         karatEnum,
          images:        hostedImage ? [hostedImage] : ['/images/placeholder.jpg'],
          isDefault:     true,
          priceModifier: 0,
        }],
        variants: (p.sizes || []).map((size: string) => ({
          size:  String(size),
          stock: 10,
          sku:   `${p.sku}-${String(size).replace(/\s+/g, '')}`,
        })),
        weightBySize: (p.sizes || []).map((size: string) => ({
          size:        String(size),
          weightGrams: 3.5,
        })),
        style:          guessStyle(p.name + ' ' + p.category),
        gemstone:       guessGemstone(p.name),
        settingType:    guessSettingType(p.name),
        tags:           uniqueTags,
        category:       resolvedCategoryId,
        source:         'hanron',
        isRingBuilder:  RING_BUILDER_CATS.has(p.category),
        isActive:       true,
        isNewArrival:   true,
      };

      const existing = await Product.findOne({ slug: doc.slug });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { $set: doc });
        updated++;
      } else {
        await Product.create(doc);
        created++;
      }
    } catch (err) {
      saveErrors.push(`SKU ${p.sku} (${p.name}): ${(err as Error).message}`);
    }
  }

  // Count ring builder products that need 3D models generated
  const needModels = await Product.find({
    isRingBuilder: true,
    model3dUrl: { $exists: false },
    isActive: true,
  }).select('_id images name').lean();

  res.json({
    success: true,
    created,
    updated,
    errors:      saveErrors,
    total:       result.total,
    meshyQueued: needModels.length,
  });

  // ── Background: auto-generate Meshy 3D models for ring settings ──────────
  if (process.env.MESHY_API_KEY && needModels.length > 0) {
    const MESHY_KEY = process.env.MESHY_API_KEY;

    const pollTask = async (taskId: string, productId: string) => {
      let attempts = 0;
      const iv = setInterval(async () => {
        attempts++;
        if (attempts > 24) { clearInterval(iv); return; } // max 12 min
        try {
          const sr = await fetch(`https://api.meshy.ai/v1/image-to-3d/${taskId}`, {
            headers: { Authorization: `Bearer ${MESHY_KEY}` },
          });
          if (!sr.ok) return;
          const sd = await sr.json() as { status: string; model_urls?: { glb?: string }; thumbnail_url?: string };
          const s = (sd.status || '').toUpperCase();
          if (s === 'SUCCEEDED' || s === 'COMPLETE' || s === 'COMPLETED') {
            clearInterval(iv);
            if (sd.model_urls?.glb) {
              await Product.findByIdAndUpdate(productId, {
                model3dUrl:     sd.model_urls.glb,
                ...(sd.thumbnail_url ? { model3dPreview: sd.thumbnail_url } : {}),
              });
            }
          } else if (s === 'FAILED' || s === 'ERROR') {
            clearInterval(iv);
          }
        } catch { /* ignore poll errors */ }
      }, 30_000);
    };

    // Fire Meshy for up to 5 products per sync to avoid overloading the API
    const batch = needModels.filter(p => p.images?.[0]?.startsWith('http')).slice(0, 5);
    for (const p of batch) {
      try {
        const publicImageUrl = await toPublicImageUrl(p.images[0]).catch(() => null);
        if (!publicImageUrl) continue;
        const r = await fetch('https://api.meshy.ai/v1/image-to-3d', {
          method:  'POST',
          headers: { Authorization: `Bearer ${MESHY_KEY}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ image_url: publicImageUrl, ai_model: 'meshy-6' }),
        });
        if (!r.ok) continue;
        const data = await r.json() as { result?: string; task_id?: string };
        const taskId = data.result ?? data.task_id;
        if (taskId) pollTask(taskId, String(p._id));
      } catch { /* ignore trigger errors */ }
    }
  }
}));

// POST /api/admin/hanron/seed-categories — create all Hanron categories without scraping
router.post('/hanron/seed-categories', asyncHandler(async (_req: Request, res: Response) => {
  const CATS = [
    { name: 'Engagement Ring Settings', slug: 'engagement-rings', description: 'Handcrafted engagement ring settings in 9ct and 18ct gold. Browse our ring mounts and build your perfect engagement ring with a GIA-certified diamond.', sortOrder: 5 },
    { name: 'Ladies Rings',         slug: 'ladies-rings',       description: 'Elegant ladies gold rings crafted in 9ct and 18ct gold. Shop our full range with free UK delivery.',                   sortOrder: 10 },
    { name: 'Gents Rings',          slug: 'gents-rings',        description: 'Sophisticated gents gold rings for every occasion. Discover 9ct and 18ct gold rings for men.',                         sortOrder: 11 },
    { name: 'Baby & Children Rings',slug: 'baby-rings',         description: 'Delicate gold baby and children\'s rings — a cherished gift for christenings, birthdays and special occasions.',       sortOrder: 12 },
    { name: 'Signet Rings',         slug: 'signet-rings',       description: 'Classic and personalised gold signet rings in 9ct and 18ct yellow, white and rose gold.',                              sortOrder: 13 },
    { name: 'Gold Earrings',        slug: 'gold-earrings',      description: 'Stunning gold earrings — studs, hoops, drops and dangles in 9ct and 18ct gold. Free UK delivery.',                    sortOrder: 20 },
    { name: 'Gold Pendants',        slug: 'gold-pendants',      description: 'Beautiful gold pendants and necklaces for every style. Shop 9ct and 18ct gold pendants with free UK delivery.',        sortOrder: 30 },
    { name: 'Gold Bracelets',       slug: 'gold-bracelets',     description: 'Exquisite gold bracelets in 9ct and 18ct yellow, white and rose gold.',                                                sortOrder: 40 },
    { name: 'Gold Bangles',         slug: 'gold-bangles',       description: 'Luxurious gold bangles — a timeless addition to any jewellery collection.',                                            sortOrder: 41 },
    { name: 'Gold Chains',          slug: 'gold-chains',        description: 'Fine gold chains in a range of styles, lengths and weights. Shop 9ct and 18ct gold chains.',                           sortOrder: 50 },
    { name: 'Silver Rings',         slug: 'silver-rings',       description: 'Contemporary and classic sterling silver rings with free UK delivery.',                                                 sortOrder: 60 },
    { name: 'Silver Earrings',      slug: 'silver-earrings',    description: 'Beautiful sterling silver earrings — studs, hoops and drops with free UK delivery.',                                   sortOrder: 61 },
    { name: 'Silver Pendants',      slug: 'silver-pendants',    description: 'Elegant sterling silver pendants and necklaces with fast UK delivery.',                                                 sortOrder: 62 },
    { name: 'Silver Bracelets',     slug: 'silver-bracelets',   description: 'Stylish sterling silver bracelets and bangles with free UK delivery.',                                                  sortOrder: 63 },
    { name: 'Diamond Jewellery',    slug: 'diamond-jewellery',  description: 'Exquisite diamond jewellery — rings, earrings, pendants and bracelets. Ethically sourced.',                            sortOrder: 70 },
    { name: 'Wedding Bands',        slug: 'wedding-bands',      description: 'Beautiful wedding bands in gold, platinum and silver for him and her.',                                                 sortOrder: 80 },
    { name: 'Lab Grown Diamonds',   slug: 'lab-grown-diamonds', description: 'Stunning lab grown diamond jewellery — sustainable, ethical and beautiful.',                                            sortOrder: 85 },
  ];

  let created = 0, existing = 0;
  for (const c of CATS) {
    const found = await Category.findOne({ slug: c.slug });
    if (!found) {
      await Category.create({ ...c, image: '/images/categories/placeholder.jpg', isActive: true, sourceStore: 'Hanron Jewellery' });
      created++;
    } else {
      existing++;
    }
  }
  res.json({ success: true, created, existing, total: CATS.length });
}));

// POST /api/admin/hanron/invalidate  — force re-login
router.post('/hanron/invalidate', (_req: Request, res: Response) => {
  invalidateHanronSession();
  res.json({ success: true, message: 'Hanron session cleared — next request will re-authenticate' });
});

// POST /api/admin/hanron/fix-images
// Re-uploads all Hanron product images that are still on hanronjewellery.com to Cloudinary.
// Run this once from localhost after a sync to fix images on existing products.
// On production this returns 503 (same Cloudflare restriction as the sync).
router.post('/hanron/fix-images', asyncHandler(async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(503).json({
      success: false,
      message: 'Hanron image fix must be run from localhost — Cloudflare blocks datacenter IPs.',
      fix: 'Run from your local machine: POST http://localhost:5001/api/admin/hanron/fix-images',
    });
    return;
  }

  // Find all Hanron products whose images are still on hanronjewellery.com
  const products = await Product.find({
    source: 'hanron',
    $or: [
      { 'images.0': /hanronjewellery\.com/ },
      { 'metalOptions.0.images.0': /hanronjewellery\.com/ },
    ],
  }).select('_id name images metalOptions').lean();

  console.log(`[Hanron fix-images] ${products.length} products need image migration`);

  let fixed = 0, failed = 0;
  for (const product of products) {
    try {
      const rawUrl = (product.images as string[])?.[0] || '';
      if (!rawUrl || rawUrl.includes('res.cloudinary.com')) continue;

      const cloudUrl = await uploadHanronImageToCloudinary(rawUrl);
      if (cloudUrl === rawUrl) { failed++; continue; } // upload failed — kept original

      // Update both top-level images array and every metalOption's images array
      await Product.findByIdAndUpdate(product._id, {
        $set: {
          images: [cloudUrl],
          'metalOptions.$[].images': [cloudUrl],
        },
      });
      fixed++;
      if (fixed % 20 === 0) console.log(`[Hanron fix-images] ${fixed}/${products.length} fixed…`);
    } catch (err) {
      failed++;
      console.warn(`[Hanron fix-images] ⚠️  ${(err as Error).message}`);
    }
  }

  console.log(`[Hanron fix-images] ✅ Done — ${fixed} fixed, ${failed} failed`);
  res.json({ success: true, total: products.length, fixed, failed });
}));

// ─── Nivoda Diamond Integration ──────────────────────────────────────────────

// GET /api/admin/nivoda/status
router.get('/nivoda/status', asyncHandler(async (_req: Request, res: Response) => {
  const status = await checkNivodaStatus();
  res.json(status);
}));

// POST /api/admin/nivoda/sync
// Fetches ALL diamonds from Nivoda and upserts into the Diamond collection.
// This can take several minutes for large inventories — responds when done.
router.post('/nivoda/sync', asyncHandler(async (_req: Request, res: Response) => {
  const result = await syncAllNivodaDiamonds((bucketsDone, bucketsTotal, savedSoFar) => {
    console.log(`[Nivoda sync] ${bucketsDone}/${bucketsTotal} buckets — ${savedSoFar} saved so far`);
  });

  res.json({
    success: true,
    message: `Nivoda sync complete: ${result.saved} saved, ${result.skipped} skipped from ${result.total} fetched across all shape/carat buckets`,
    ...result,
  });
}));

// ── Helpers used by the Hanron sync route ─────────────────────────────────────
function slugifyProduct(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function guessStyle(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('halo'))        return 'halo';
  if (t.includes('eternity'))    return 'eternity';
  if (t.includes('three stone') || t.includes('trilogy')) return 'three-stone';
  if (t.includes('pave') || t.includes('pavé'))           return 'pave';
  if (t.includes('cluster'))     return 'cluster';
  if (t.includes('solitaire'))   return 'solitaire';
  if (t.includes('wedding') || t.includes('band'))        return 'band';
  return 'solitaire';
}

function guessGemstone(name: string): string {
  const t = name.toLowerCase();
  if (t.includes('diamond'))  return 'diamond';
  if (t.includes('cz'))       return 'cubic-zirconia';
  if (t.includes('sapphire')) return 'sapphire';
  if (t.includes('ruby'))     return 'ruby';
  if (t.includes('emerald'))  return 'emerald';
  if (t.includes('pearl'))    return 'pearl';
  return 'diamond';
}

function guessSettingType(name: string): string {
  const t = name.toLowerCase();
  if (t.includes('claw') || t.includes('prong'))    return 'claw';
  if (t.includes('bezel'))                           return 'bezel';
  if (t.includes('pave') || t.includes('pavé'))     return 'pave';
  if (t.includes('channel'))                        return 'channel';
  if (t.includes('tension'))                        return 'tension';
  if (t.includes('halo'))                           return 'halo';
  return 'solitaire';
}

function buildTags(p: { name: string; category: string; metal: string }): string[] {
  const tags: string[] = ['hanron'];
  const t = (p.name + ' ' + p.category).toLowerCase();
  if (t.includes('ring'))          tags.push('ring');
  if (t.includes('earring'))       tags.push('earring');
  if (t.includes('pendant'))       tags.push('pendant');
  if (t.includes('bracelet'))      tags.push('bracelet');
  if (t.includes('necklace'))      tags.push('necklace');
  if (t.includes('wedding'))       tags.push('wedding');
  if (t.includes('engagement'))    tags.push('engagement');
  if (t.includes('diamond'))       tags.push('diamond');
  if (t.includes('cz'))            tags.push('cz');
  if (p.metal)   tags.push(p.metal.toLowerCase().replace(/\s+/g, '-'));
  return [...new Set(tags)];
}

export default router;
