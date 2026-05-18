import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.model';
import Coupon from '../models/Coupon.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, shippingAddress, shippingMethod, couponCode, paymentIntentId } = req.body;

  const shippingCosts: Record<string, number> = { standard: 0, express: 9.99, 'next-day': 14.99 };
  const shippingCost = shippingCosts[shippingMethod] || 0;
  const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);

  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      discount = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  const tax = (subtotal - discount) * 0.2;
  const total = subtotal - discount + shippingCost + tax;

  // Ensure every item has a non-empty image (some products may have no images yet)
  const safeItems = items.map((item: { image?: string; [key: string]: unknown }) => ({
    ...item,
    image: item.image || '/images/placeholder.jpg',
  }));

  const order = await Order.create({
    user: req.user?._id,
    items: safeItems,
    shippingAddress,
    shippingMethod,
    shippingCost,
    subtotal,
    discount,
    couponCode,
    tax,
    total,
    paymentIntentId,
    paymentStatus: paymentIntentId ? 'paid' : 'pending',
    orderStatus: 'confirmed',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.status(201).json(order);
});

export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ user: req.user?._id }).sort({ createdAt: -1 }).populate('items.product', 'name images');
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name images slug');
  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  if (order.user?.toString() !== req.user?._id && req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Not authorised' });
    return;
  }
  res.json(order);
});

export const getAllOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'firstName lastName email');
  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: req.body.status }, { new: true });
  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  res.json(order);
});
