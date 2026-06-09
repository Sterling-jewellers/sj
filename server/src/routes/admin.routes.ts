import mongoose from 'mongoose';
import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';
import {
  generateProductContent,
  estimateCompetitorPrice as geminiEstimatePrice,
  generateProductSideView,
  generateLifestylePhoto as geminiGenerateLifestyle,
} from '../services/gemini.service';
import {
  generateMetalVariantImage,
  checkMetalVariantStatus,
} from '../services/fal.service';
import Order from '../models/Order.model';
import Product from '../models/Product.model';
import Diamond from '../models/Diamond.model';
import User from '../models/User.model';
import Review from '../models/Review.model';
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

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ message: 'Set GEMINI_API_KEY to use AI price estimation' });
    return;
  }

  try {
    const result = await geminiEstimatePrice({ name, metalType, karat, settingType, bandStyle, shankWidth, gemstone, caratWeight });
    res.json(result);
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message || 'AI estimation failed');
    res.status(502).json({ message: msg });
  }
}));

// ─── AI Product Generation (Gemini) ──────────────────────────────────────────
router.post('/ai/generate-product', asyncHandler(async (req: Request, res: Response) => {
  const { name, category, metalOptions, style, settingType, gemstone } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ message: 'AI generation not configured — set GEMINI_API_KEY' });
    return;
  }

  try {
    const result = await generateProductContent({ name, category, metalOptions, style, settingType, gemstone });
    res.json(result);
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message || 'AI generation failed');
    res.status(502).json({ message: msg });
  }
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
// ─── AI: Generate Metal Colour Variant (fal.ai Flux Kontext) ─────────────────
router.post('/ai/generate-metal-image', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl, metalType, karat } = req.body as { imageUrl: string; metalType: string; karat?: string };

  if (!process.env.FAL_KEY) {
    res.status(503).json({ message: 'AI image generation not configured — add FAL_KEY to server/.env' });
    return;
  }
  if (!imageUrl || !metalType) {
    res.status(400).json({ message: 'imageUrl and metalType are required' });
    return;
  }

  const { predictionId } = await generateMetalVariantImage(imageUrl, metalType, karat);
  res.json({ predictionId, status: 'processing' });
}));

// ─── AI: Poll fal.ai Generation Status ───────────────────────────────────────
router.get('/ai/generation-status/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!process.env.FAL_KEY) {
    res.status(503).json({ message: 'FAL_KEY not set' });
    return;
  }
  const result = await checkMetalVariantStatus(req.params.id);
  res.json(result);
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

/** Upload a base64-encoded image buffer to Cloudinary and return the secure URL */
async function uploadBase64ToCloudinary(base64: string, mimeType: string, folder: string): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const buffer = Buffer.from(base64, 'base64');
  return new Promise<string>((resolve, reject) => {
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: ext },
      (err, res) => (err ? reject(err) : resolve((res as { secure_url: string }).secure_url)),
    );
    stream.end(buffer);
  });
}

// ─── AI: Generate side-view product photo (Gemini) ───────────────────────────
/** Wrap an async generation fn with a hard wall-clock timeout */
async function withTimeout<T>(fn: () => Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

router.post('/products/:id/generate-side-view', asyncHandler(async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ message: 'GEMINI_API_KEY not configured' }); return;
  }
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }

  const imgUrl = product.images?.[0];
  if (!imgUrl) { res.status(400).json({ message: 'Product has no images' }); return; }

  const metal = product.metalOptions?.find(m => m.isDefault)?.type || product.metalOptions?.[0]?.type;
  console.log('[admin] generating side view for:', product.name, '| metal:', metal);

  let result: { base64: string; mimeType: string } | null;
  try {
    result = await withTimeout(
      () => generateProductSideView(imgUrl, product.name, metal),
      120_000, 'Side view generation',
    );
  } catch (e) {
    console.error('[admin] side view error:', (e as Error).message);
    res.status(502).json({ message: (e as Error).message }); return;
  }

  if (!result) { res.status(502).json({ message: 'Gemini returned no image. Check server logs.' }); return; }

  const url = await uploadBase64ToCloudinary(result.base64, result.mimeType, 'sterling-jewellers/side-views');
  await Product.findByIdAndUpdate(product._id, { sideImageUrl: url });
  res.json({ sideImageUrl: url });
}));

// ─── AI: Generate lifestyle photo for one product (Gemini) ───────────────────
router.post('/products/:id/generate-lifestyle', asyncHandler(async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ message: 'GEMINI_API_KEY not configured' }); return;
  }
  const product = await Product.findById(req.params.id).populate('category', 'slug');
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }

  const imgUrl = product.images?.[0];
  if (!imgUrl) { res.status(400).json({ message: 'Product has no images' }); return; }

  const catSlug = (product.category as unknown as { slug?: string })?.slug || '';
  const metal = product.metalOptions?.find(m => m.isDefault)?.type || product.metalOptions?.[0]?.type;
  console.log('[admin] generating lifestyle photo for:', product.name, '| type:', catSlug, '| metal:', metal);

  let result: { base64: string; mimeType: string } | null;
  try {
    result = await withTimeout(
      () => geminiGenerateLifestyle(imgUrl, product.name, catSlug, metal),
      120_000, 'Lifestyle photo generation',
    );
  } catch (e) {
    console.error('[admin] lifestyle error:', (e as Error).message);
    res.status(502).json({ message: (e as Error).message }); return;
  }

  if (!result) { res.status(502).json({ message: 'Gemini returned no image. Check server logs.' }); return; }

  const url = await uploadBase64ToCloudinary(result.base64, result.mimeType, 'sterling-jewellers/lifestyle');
  await Product.findByIdAndUpdate(product._id, { lifestyleImageUrl: url });
  res.json({ lifestyleImageUrl: url });
}));

// ─── Manual Lifestyle Photo Upload ───────────────────────────────────────────
router.post('/products/:id/upload-lifestyle', upload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ message: 'No image file provided' }); return; }
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const url = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sterling-jewellers/lifestyle', resource_type: 'image' },
      (err, res) => err ? reject(err) : resolve((res as { secure_url: string }).secure_url),
    );
    stream.end(req.file!.buffer);
  });

  await Product.findByIdAndUpdate(product._id, { lifestyleImageUrl: url });
  res.json({ lifestyleImageUrl: url });
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

// ─── Helper: seed 8 ghost reviews for a newly created product ────────────────
async function seedReviewsForProduct(productId: mongoose.Types.ObjectId): Promise<void> {
  const NAMES: [string, string][] = [
    ['Emma', 'Thompson'], ['Olivia', 'Clarke'], ['Sophia', 'Williams'], ['Amelia', 'Brown'],
    ['Isla', 'Jones'], ['Ava', 'Taylor'], ['Mia', 'Davies'], ['Grace', 'Evans'],
    ['Charlotte', 'Wilson'], ['Lily', 'Thomas'], ['Hannah', 'Roberts'], ['Lucy', 'White'],
    ['Zoe', 'Harris'], ['Poppy', 'Martin'], ['Ellie', 'Jackson'], ['Scarlett', 'Lewis'],
    ['Jessica', 'Walker'], ['Chloe', 'Hall'], ['Freya', 'Allen'], ['Ella', 'Young'],
    ['James', 'Smith'], ['Oliver', 'Johnson'], ['Harry', 'Lee'], ['George', 'King'],
    ['Noah', 'Wright'], ['Jack', 'Scott'], ['William', 'Green'], ['Liam', 'Baker'],
    ['Ethan', 'Adams'], ['Mason', 'Nelson'], ['Logan', 'Carter'], ['Lucas', 'Mitchell'],
    ['Aisha', 'Patel'], ['Priya', 'Shah'], ['Neha', 'Sharma'], ['Riya', 'Gupta'],
    ['Sarah', 'Murphy'], ['Rachel', "O'Brien"], ['Laura', 'Kelly'], ['Claire', 'Walsh'],
  ];

  const REVIEW_TEMPLATES = [
    { rating: 5, title: 'Absolutely stunning', body: "I bought this as a gift for my wife's birthday and she was absolutely speechless. The quality is exceptional — it looks far more expensive than it is. Packaging was gorgeous too, arrived beautifully presented. Will definitely be ordering again." },
    { rating: 5, title: 'Perfect in every way', body: "Gorgeous piece, exactly as described and photographed. Delivery was super fast and the quality is outstanding. My daughter cried when she opened it — in a good way! Highly recommend Sterling Jewellers." },
    { rating: 5, title: 'Exceptional quality', body: "I've bought jewellery from many places over the years but the finish on this is genuinely impressive. The detail is incredible and it feels substantial and well-made. Couldn't be happier." },
    { rating: 5, title: "Couldn't be happier", body: 'Ordered this for our anniversary and it arrived even quicker than expected. Looks even more beautiful in person than in the photos. The craftsmanship is second to none.' },
    { rating: 5, title: 'A real showstopper', body: 'Everyone keeps asking me where I got this from. The design is so elegant and the quality is obvious the moment you hold it. So pleased with this purchase.' },
    { rating: 5, title: 'Exactly what I was looking for', body: 'Searched everywhere for something like this and so glad I found Sterling Jewellers. Beautifully made, arrived promptly in lovely packaging. Perfect for the occasion.' },
    { rating: 4, title: 'Really lovely piece', body: 'Very happy with this purchase. The quality is great and it arrived quickly. Would give 5 stars but the sizing ran very slightly smaller than expected — just be aware of that. Still a beautiful piece.' },
    { rating: 4, title: 'Beautiful and well made', body: 'Lovely piece, exactly as described. Delivery was fast and the packaging was really nice. Just docking one star as delivery was slightly delayed, but the jewellery itself is perfect.' },
  ];

  // Shuffle names and pick 8
  const shuffledNames = [...NAMES].sort(() => Math.random() - 0.5).slice(0, 8);
  const ghostUsers: mongoose.Types.ObjectId[] = [];
  for (const [first, last] of shuffledNames) {
    const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}.buyer@sterling-reviews.internal`;
    const existingUser = await User.findOne({ email }).select('_id').lean();
    let userId: mongoose.Types.ObjectId;
    if (existingUser) {
      userId = existingUser._id as mongoose.Types.ObjectId;
    } else {
      const createdUser = await User.create({
        firstName: first,
        lastName: last,
        email,
        provider: 'local',
        role: 'user',
        isEmailVerified: true,
      });
      userId = createdUser._id as mongoose.Types.ObjectId;
    }
    ghostUsers.push(userId);
  }

  const now = Date.now();
  const TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < ghostUsers.length; i++) {
    const userId = ghostUsers[i];
    const existingReview = await Review.findOne({ product: productId, user: userId }).lean();
    if (existingReview) continue;

    const template = REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length];
    const createdAt = new Date(now - Math.floor(Math.random() * TWO_YEARS));
    const helpfulVotes = Math.floor(Math.random() * 25);

    await Review.create({
      product: productId,
      user: userId,
      rating: template.rating,
      title: template.title,
      body: template.body,
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulVotes,
      createdAt,
      updatedAt: createdAt,
    });
  }
}

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

  // ── GROUP products by base name: combine metal variants & length variants ──────
  // Hanron lists "9ct Y/G Figaro Chain 18 Inch", "9ct Y/G Figaro Chain 20 Inch",
  // "9ct W/G Figaro Chain 18 Inch" as separate products.
  // We group them into one product with multiple metalOptions and/or length variants.
  //
  // Grouping key = strip metal colour prefix + length/size suffix from the name,
  // then combine within the same Hanron category.

  function stripMetalAndSize(name: string): string {
    return name
      // Remove karat + metal colour prefix: "9ct Y/G", "18ct W/G", "9ct White Gold" etc.
      .replace(/^\d{1,2}ct\s+(?:y\/g|w\/g|r\/g|yellow\s+gold|white\s+gold|rose\s+gold|silver|platinum)\s+/i, '')
      // Remove trailing length/size: "18 Inch", "20\"", "18\"", "20mm", "22 Inches"
      .replace(/\s+\d+\.?\d*\s*(?:inch(?:es)?|in|mm|cm|\")\s*$/i, '')
      // Remove trailing ring size: " Size J", " Size N½"
      .replace(/\s+(?:size\s+)?[A-Z][½¼¾]?\s*$/i, '')
      .trim();
  }

  // Group by (category, strippedName)
  const groups = new Map<string, typeof result.products>();
  for (const p of result.products) {
    const key = `${p.category}__${stripMetalAndSize(p.name).toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  // Build merged products — first product in group is the "primary"
  type MergedProduct = typeof result.products[0] & {
    allSizes: string[];
    metalVariants: { metal: string; sku: string; imageUrl: string; price: number }[];
  };

  const mergedProducts: MergedProduct[] = [];
  for (const group of groups.values()) {
    const primary = group[0];
    // Collect all unique sizes across the group
    const allSizes = [...new Set(group.flatMap(p => p.sizes))].sort();
    // Collect metal variants (each unique metal in the group)
    const metalVariants = group.map(p => ({
      metal:    p.metal,
      sku:      p.sku,
      imageUrl: p.images[0] || '',
      price:    p.price,
    }));
    mergedProducts.push({
      ...primary,
      // Use the base name (without metal colour prefix) as the product name
      name:         stripMetalAndSize(primary.name) || primary.name,
      allSizes,
      metalVariants,
    });
  }

  // Save to MongoDB — upsert on slug to avoid duplicates
  let created = 0, updated = 0;
  const saveErrors: string[] = [...result.errors];

  for (const p of mergedProducts) {
    try {
      // ── Resolve category ────────────────────────────────────────────────
      const resolvedCategoryId = defaultCategoryId || categoryIdCache[p.category] || Object.values(categoryIdCache)[0] || '';
      if (!resolvedCategoryId) {
        saveErrors.push(`SKU ${p.sku}: no category resolved for Hanron category "${p.category}"`);
        continue;
      }

      // ── Build metalOptions from all variants in the group ───────────────
      // Each distinct metal colour/karat in the group becomes one metalOption.
      const metalOptionsList: {
        type: 'yellow-gold' | 'white-gold' | 'rose-gold' | 'platinum' | 'silver';
        karat?: '9ct' | '14ct' | '18ct';
        images: string[];
        isDefault: boolean;
        priceModifier: number;
      }[] = [];

      let primaryHostedImage = '';

      for (let vi = 0; vi < p.metalVariants.length; vi++) {
        const mv = p.metalVariants[vi];
        const parts = mv.metal.split(' ');
        const k     = parts.find(x => x.includes('ct') || x.includes('k')) || '9ct';
        const mt    = parts.filter(x => x !== k).join(' ').trim() || 'yellow-gold';

        const mType = (['yellow-gold','white-gold','rose-gold','platinum','silver'] as const)
          .includes(mt as 'yellow-gold') ? mt as 'yellow-gold'|'white-gold'|'rose-gold'|'platinum'|'silver'
          : 'yellow-gold';
        const kType = (['9ct','14ct','18ct'] as const).includes(k as '9ct') ? k as '9ct'|'14ct'|'18ct' : '9ct';

        // Upload image for this variant to Cloudinary
        let variantImage = '';
        try {
          variantImage = mv.imageUrl ? await uploadHanronImageToCloudinary(mv.imageUrl) : '';
        } catch { /* non-fatal */ }
        if (vi === 0) primaryHostedImage = variantImage;

        // Avoid exact duplicate metalOptions (same type+karat)
        const isDupe = metalOptionsList.some(m => m.type === mType && m.karat === kType);
        if (!isDupe) {
          metalOptionsList.push({
            type:          mType,
            karat:         kType,
            images:        variantImage ? [variantImage] : [],
            isDefault:     vi === 0,
            priceModifier: 0,
          });
        }
      }

      // Fallback if no metal options were built
      if (metalOptionsList.length === 0) {
        const parts  = p.metal.split(' ');
        const k      = parts.find(x => x.includes('ct') || x.includes('k')) || '9ct';
        const mt     = parts.filter(x => x !== k).join(' ').trim() || 'yellow-gold';
        metalOptionsList.push({
          type:          (['yellow-gold','white-gold','rose-gold','platinum','silver'] as const).includes(mt as 'yellow-gold') ? mt as 'yellow-gold'|'white-gold'|'rose-gold'|'platinum'|'silver' : 'yellow-gold',
          karat:         (['9ct','14ct','18ct'] as const).includes(k as '9ct') ? k as '9ct'|'14ct'|'18ct' : '9ct',
          images:        primaryHostedImage ? [primaryHostedImage] : [],
          isDefault:     true,
          priceModifier: 0,
        });
      }

      const primaryMetal = metalOptionsList[0];
      const karatEnum    = primaryMetal.karat || '9ct';

      // ── SEO fields ────────────────────────────────────────────────────────────
      // Build a human-readable metal label listing all available metals
      const metalNames = metalOptionsList.map(m => {
        const k = m.karat ? `${m.karat} ` : '';
        const t = m.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `${k}${t}`;
      });
      const metalLabel  = metalNames[0] || 'Gold';
      const catLabel    = HANRON_CAT_MAP[p.category]?.name || p.category;
      const allSizes    = p.allSizes;
      const sizesText   = allSizes.length ? ` Available in sizes ${allSizes.slice(0, 8).join(', ')}${allSizes.length > 8 ? ' and more' : ''}.` : '';
      const gemLabel    = guessGemstone(p.name).replace('-', ' ');
      const availMetals = metalNames.length > 1 ? ` Available in ${metalNames.join(', ')}.` : '';

      const metaTitle = `${p.name} | ${metalLabel} | Sterling Jewellers`
        .replace(/\s{2,}/g, ' ').slice(0, 70);

      const metaDescription = (
        `Buy the ${p.name} — a stunning ${metalLabel} piece from our ${catLabel} collection.` +
        ` Ethically sourced, hallmarked fine jewellery with free UK delivery & free returns.` +
        `${sizesText}${availMetals}`
      ).slice(0, 160);

      const shortDescription = (
        `${p.name} crafted in ${metalLabel}. ` +
        (gemLabel ? `Features beautiful ${gemLabel}. ` : '') +
        `Part of our ${catLabel} collection — ethically sourced fine jewellery with free UK delivery.`
      ).slice(0, 200);

      const purityMap: Record<string, string> = { '9ct': '37.5% pure gold', '14ct': '58.3% pure gold', '18ct': '75.0% pure gold' };
      const purityText = purityMap[karatEnum] || '';

      const htmlDescription = `
<h2>${p.name}</h2>
<p>This exquisite <strong>${p.name}</strong> is expertly crafted in <strong>${metalLabel}</strong>, making it a perfect addition to any jewellery collection or a wonderful gift for a loved one.</p>
${purityText ? `<p><strong>Metal Purity:</strong> ${karatEnum} ${metalLabel} — ${purityText}. All pieces are fully hallmarked to UK assay standards.</p>` : ''}
${metalNames.length > 1 ? `<p><strong>Available metals:</strong> ${metalNames.join(', ')}.</p>` : ''}
${allSizes.length ? `<p><strong>Available sizes:</strong> ${allSizes.join(', ')}. Need a different size? Contact us for a free resize.</p>` : ''}
<h3>Why Choose Sterling Jewellers?</h3>
<ul>
  <li>All pieces are fully hallmarked and ethically sourced</li>
  <li>Free UK delivery on all orders</li>
  <li>Free 30-day returns</li>
  <li>Expert customer support 7 days a week</li>
</ul>`.trim();

      const seoTags = buildTags(p);
      seoTags.push(catLabel.toLowerCase(), metalLabel.toLowerCase(), `buy ${catLabel.toLowerCase()} online`, `${metalLabel.toLowerCase()} jewellery uk`);
      if (p.price) {
        if (p.price < 200)  seoTags.push('jewellery under £200', 'affordable gold jewellery');
        if (p.price < 500)  seoTags.push('jewellery under £500');
        if (p.price < 1000) seoTags.push('jewellery under £1000');
      }
      const uniqueTags = [...new Set(seoTags)];

      // ── Pricing: use lowest price in group × 1.8 ─────────────────────────
      const minPrice = Math.min(...p.metalVariants.map(mv => mv.price).filter(x => x > 0));
      const basePrice = +((minPrice > 0 ? minPrice : p.price) * 1.8).toFixed(2);

      // ── Availability ────────────────────────────────────────────────────────
      const isOutOfStock    = p.availability === 'Out of Stock';
      const stockPerVariant = isOutOfStock ? 0 : 10;

      const doc = {
        name:             p.name,
        slug:             slugifyProduct(p.name + '-' + p.sku),
        shortDescription,
        description:      htmlDescription,
        metaTitle,
        metaDescription,
        basePrice,
        images:           primaryHostedImage ? [primaryHostedImage] : ['/images/placeholder.jpg'],
        metalOptions:     metalOptionsList.map(m => ({
          ...m,
          images: m.images.length ? m.images : [primaryHostedImage || '/images/placeholder.jpg'],
        })),
        variants: allSizes.map((size: string) => ({
          size:  String(size),
          stock: stockPerVariant,
          sku:   `${p.sku}-${String(size).replace(/\s+/g, '')}`,
        })),
        weightBySize: allSizes.map((size: string) => ({
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
        isActive:       !isOutOfStock,
        isNewArrival:   !isOutOfStock,
      };

      if (isOutOfStock) {
        console.log(`[Hanron sync] ⚠️  Out of stock — unlisting: ${p.name} (${p.sku})`);
      }

      const existing = await Product.findOne({ slug: doc.slug });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { $set: doc });
        updated++;
      } else {
        const newProd = await Product.create(doc);
        created++;
        seedReviewsForProduct(newProd._id as mongoose.Types.ObjectId).catch(() => {});
      }
    } catch (err) {
      saveErrors.push(`SKU ${p.sku} (${p.name}): ${(err as Error).message}`);
    }
  }

  res.json({
    success:      true,
    created,
    updated,
    errors:       saveErrors,
    total:        result.total,           // raw Hanron products scraped
    merged:       mergedProducts.length,  // products after variant grouping
  });
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
  // Default: no gemstone — chains, plain bands, and non-gem pieces get none
  return '';
}

function guessSettingType(name: string): string {
  const t = name.toLowerCase();
  if (t.includes('claw') || t.includes('prong'))    return 'claw';
  if (t.includes('bezel'))                           return 'bezel';
  if (t.includes('pave') || t.includes('pavé'))     return 'pave';
  if (t.includes('channel'))                        return 'channel';
  if (t.includes('tension'))                        return 'tension';
  if (t.includes('halo'))                           return 'halo';
  // Default: no setting — only set for ring products with a known style
  return '';
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

// ─── Seed Realistic Reviews ──────────────────────────────────────────────────
// POST /api/admin/reviews/seed
// Body: { productIds?: string[], perProduct?: number, clear?: boolean }
// Generates genuine-looking verified-purchase reviews for products.
// Each "reviewer" is a lightweight ghost user (no password) stored in Users.
router.post('/reviews/seed', asyncHandler(async (req: Request, res: Response) => {
  const { productIds, perProduct = 12, clear = false } = req.body as {
    productIds?: string[];
    perProduct?: number;
    clear?: boolean;
  };

  // Pool of realistic UK first+last names
  const NAMES = [
    ['Emma', 'Thompson'], ['Olivia', 'Clarke'], ['Sophia', 'Williams'], ['Amelia', 'Brown'],
    ['Isla', 'Jones'], ['Ava', 'Taylor'], ['Mia', 'Davies'], ['Grace', 'Evans'],
    ['Charlotte', 'Wilson'], ['Lily', 'Thomas'], ['Hannah', 'Roberts'], ['Lucy', 'White'],
    ['Zoe', 'Harris'], ['Poppy', 'Martin'], ['Ellie', 'Jackson'], ['Scarlett', 'Lewis'],
    ['Jessica', 'Walker'], ['Chloe', 'Hall'], ['Freya', 'Allen'], ['Ella', 'Young'],
    ['James', 'Smith'], ['Oliver', 'Johnson'], ['Harry', 'Lee'], ['George', 'King'],
    ['Noah', 'Wright'], ['Jack', 'Scott'], ['William', 'Green'], ['Liam', 'Baker'],
    ['Ethan', 'Adams'], ['Mason', 'Nelson'], ['Logan', 'Carter'], ['Lucas', 'Mitchell'],
    ['Aisha', 'Patel'], ['Priya', 'Shah'], ['Neha', 'Sharma'], ['Riya', 'Gupta'],
    ['Sarah', 'Murphy'], ['Rachel', 'O\'Brien'], ['Laura', 'Kelly'], ['Claire', 'Walsh'],
  ];

  // Review templates keyed by product type hint
  const REVIEW_TEMPLATES = [
    // 5 star
    { rating: 5, title: 'Absolutely stunning', body: 'I bought this as a gift for my wife\'s birthday and she was absolutely speechless. The quality is exceptional — it looks far more expensive than it is. Packaging was gorgeous too, arrived beautifully presented. Will definitely be ordering again.' },
    { rating: 5, title: 'Perfect in every way', body: 'Gorgeous piece, exactly as described and photographed. Delivery was super fast and the quality is outstanding. My daughter cried when she opened it — in a good way! Highly recommend Sterling Jewellers.' },
    { rating: 5, title: 'Exceptional quality', body: 'I\'ve bought jewellery from many places over the years but the finish on this is genuinely impressive. The detail is incredible and it feels substantial and well-made. Couldn\'t be happier.' },
    { rating: 5, title: 'Couldn\'t be happier', body: 'Ordered this for our anniversary and it arrived even quicker than expected. Looks even more beautiful in person than in the photos. The craftsmanship is second to none.' },
    { rating: 5, title: 'A real showstopper', body: 'Everyone keeps asking me where I got this from. The design is so elegant and the quality is obvious the moment you hold it. So pleased with this purchase.' },
    { rating: 5, title: 'Exactly what I was looking for', body: 'Searched everywhere for something like this and so glad I found Sterling Jewellers. Beautifully made, arrived promptly in lovely packaging. Perfect for the occasion.' },
    { rating: 5, title: 'Gorgeous piece', body: 'Bought this for myself as a treat and I\'m so glad I did. The quality really is exceptional — it photographs beautifully and catches the light wonderfully. Feels luxurious.' },
    { rating: 5, title: 'Outstanding craftsmanship', body: 'The level of detail on this piece is remarkable. You can tell it\'s been made with real care. My partner absolutely loves it and it fits perfectly. Excellent all round.' },
    // 4 star
    { rating: 4, title: 'Really lovely piece', body: 'Very happy with this purchase. The quality is great and it arrived quickly. Would give 5 stars but the sizing ran very slightly smaller than expected — just be aware of that. Still a beautiful piece.' },
    { rating: 4, title: 'Beautiful and well made', body: 'Lovely piece, exactly as described. Delivery was fast and the packaging was really nice. Just docking one star as delivery was slightly delayed, but the jewellery itself is perfect.' },
    { rating: 4, title: 'Great value and quality', body: 'Really pleased with this. The finish is excellent and it looks stunning. Would highly recommend to anyone looking for quality jewellery. Only wish there was a wider size range available.' },
    { rating: 4, title: 'Very pleased overall', body: 'This is such a lovely piece. The quality is exactly what I hoped for and the photos on the site really do it justice. Quick delivery too. Very happy customer.' },
    // 3 star
    { rating: 3, title: 'Nice but not perfect', body: 'The piece itself is lovely and the quality seems good. However delivery took a little longer than I expected and the packaging, while nice, was simpler than I hoped for a gift. The jewellery is beautiful though.' },
    { rating: 3, title: 'Good quality, slight sizing issue', body: 'Lovely design and the craftsmanship looks really good. Mine came up slightly small so I\'d recommend sizing up. Customer service was helpful when I reached out. Would order again.' },
  ];

  // Find target products
  const query = productIds?.length ? { _id: { $in: productIds } } : { isActive: true };
  const products = await Product.find(query).select('_id name').lean();
  if (!products.length) {
    res.status(404).json({ message: 'No matching products found' }); return;
  }

  // Optionally clear existing seeded reviews
  if (clear) {
    await Review.deleteMany({ isVerifiedPurchase: true, 'meta.seeded': true });
  }

  // Ensure ghost users exist (reuse by email)
  const ghostUsers: mongoose.Types.ObjectId[] = [];
  for (const [first, last] of NAMES) {
    const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}.buyer@sterling-reviews.internal`;
    const existing = await User.findOne({ email }).select('_id').lean();
    let userId: mongoose.Types.ObjectId;
    if (existing) {
      userId = existing._id as mongoose.Types.ObjectId;
    } else {
      const created = await User.create({
        firstName: first,
        lastName: last,
        email,
        provider: 'local',
        role: 'user',
        isEmailVerified: true,
      });
      userId = created._id as mongoose.Types.ObjectId;
    }
    ghostUsers.push(userId);
  }

  let created = 0, skipped = 0;
  const now = Date.now();
  const TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;

  for (const product of products) {
    // Pick random subset of reviewers (no duplicates per product)
    const shuffled = [...ghostUsers].sort(() => Math.random() - 0.5);
    const count = Math.min(perProduct, shuffled.length);

    for (let i = 0; i < count; i++) {
      const userId = shuffled[i];
      const existing = await Review.findOne({ product: product._id, user: userId }).lean();
      if (existing) { skipped++; continue; }

      // Pick a random template, weighted toward positive
      const template = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];

      // Random date in the last 2 years
      const createdAt = new Date(now - Math.floor(Math.random() * TWO_YEARS));

      // Random helpful votes (0–24)
      const helpfulVotes = Math.floor(Math.random() * 25);

      await Review.create({
        product: product._id,
        user: userId,
        rating: template.rating,
        title: template.title,
        body: template.body,
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulVotes,
        createdAt,
        updatedAt: createdAt,
      });
      created++;
    }
  }

  res.json({
    success: true,
    productsSeeded: products.length,
    reviewsCreated: created,
    reviewsSkipped: skipped,
  });
}));

export default router;
