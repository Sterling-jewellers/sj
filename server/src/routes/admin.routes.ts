import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Anthropic from '@anthropic-ai/sdk';
import Order from '../models/Order.model';
import Product from '../models/Product.model';
import Diamond from '../models/Diamond.model';
import User from '../models/User.model';
import Coupon from '../models/Coupon.model';
import Category from '../models/Category.model';
import { protect, adminOnly } from '../middleware/auth.middleware';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(protect, adminOnly);

// ─── Dashboard Overview ───────────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  const { range = '30' } = req.query;
  const days = parseInt(range as string, 10) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const prevSince = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    revenueAgg,
    totalProducts,
    totalUsers,
    totalDiamonds,
    recentOrders,
    // period comparisons
    periodOrders,
    periodRevenue,
    prevPeriodOrders,
    prevPeriodRevenue,
    newUsers,
    prevNewUsers,
    // order status breakdown
    statusBreakdown,
    // revenue over time (daily)
    revenueTimeline,
    // top products
    topProducts,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    Diamond.countDocuments(),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'firstName lastName email'),
    // period metrics
    Order.countDocuments({ createdAt: { $gte: since } }),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: prevSince, $lt: since } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    User.countDocuments({ role: 'user', createdAt: { $gte: since } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: prevSince, $lt: since } }),
    // status breakdown
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // daily revenue for period
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // top selling products by revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          sold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const pRevenue = periodRevenue[0]?.total || 0;
  const ppRevenue = prevPeriodRevenue[0]?.total || 0;

  const pct = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  res.json({
    totalOrders,
    totalRevenue: revenueAgg[0]?.total || 0,
    totalProducts,
    totalUsers,
    totalDiamonds,
    recentOrders,
    period: {
      days,
      orders: periodOrders,
      revenue: pRevenue,
      newUsers,
      ordersDelta: pct(periodOrders, prevPeriodOrders),
      revenueDelta: pct(pRevenue, ppRevenue),
      newUsersDelta: pct(newUsers, prevNewUsers),
    },
    statusBreakdown: statusBreakdown.map((s: { _id: string; count: number }) => ({ status: s._id, count: s.count })),
    revenueTimeline,
    topProducts,
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
    Diamond.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
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

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query),
  ]);

  // Attach order count per user
  const userIds = users.map((u) => u._id);
  const orderCounts = await Order.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', count: { $sum: 1 }, spent: { $sum: '$total' } } },
  ]);
  const orderMap = Object.fromEntries(orderCounts.map((o: { _id: string; count: number; spent: number }) => [o._id.toString(), o]));

  const enriched = users.map((u) => ({
    ...u.toObject(),
    orderCount: orderMap[u._id.toString()]?.count || 0,
    totalSpent: orderMap[u._id.toString()]?.spent || 0,
  }));

  res.json({ customers: enriched, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/customers/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
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

// ─── AI: Start 3D Model Generation (Meshy.ai image-to-3d) ────────────────────
router.post('/ai/generate-3d', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = req.body as { imageUrl: string };

  if (!process.env.MESHY_API_KEY) {
    res.status(503).json({ message: '3D generation not configured — add MESHY_API_KEY to server/.env' });
    return;
  }
  if (!imageUrl) { res.status(400).json({ message: 'imageUrl is required' }); return; }

  const r = await fetch('https://api.meshy.ai/openapi/v2/image-to-3d', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      enable_pbr: true,          // physically based rendering materials
      ai_model: 'meshy-4',
      topology: 'quad',
      target_polycount: 30000,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    res.status(502).json({ message: `Meshy error: ${err}` });
    return;
  }

  const data = await r.json() as { result: string };
  res.json({ taskId: data.result });
}));

// ─── AI: Poll Meshy 3D Task Status ───────────────────────────────────────────
router.get('/ai/3d-status/:taskId', asyncHandler(async (req: Request, res: Response) => {
  if (!process.env.MESHY_API_KEY) {
    res.status(503).json({ message: 'MESHY_API_KEY not set' }); return;
  }

  const r = await fetch(`https://api.meshy.ai/openapi/v2/image-to-3d/${req.params.taskId}`, {
    headers: { Authorization: `Bearer ${process.env.MESHY_API_KEY}` },
  });
  const data = await r.json() as {
    status: string; progress?: number;
    model_urls?: { glb?: string; fbx?: string; obj?: string };
    thumbnail_url?: string;
    task_error?: { message: string };
  };

  if (data.status === 'SUCCEEDED') {
    res.json({ status: 'completed', modelUrl: data.model_urls?.glb, previewUrl: data.thumbnail_url });
  } else if (data.status === 'FAILED') {
    res.json({ status: 'failed', error: data.task_error?.message });
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
router.get('/products/import/template', (_req, res) => {
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

export default router;
