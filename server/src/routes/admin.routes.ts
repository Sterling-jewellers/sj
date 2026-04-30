import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.model';
import Product from '../models/Product.model';
import Diamond from '../models/Diamond.model';
import User from '../models/User.model';
import Coupon from '../models/Coupon.model';
import { protect, adminOnly } from '../middleware/auth.middleware';

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

export default router;
