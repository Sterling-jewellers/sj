import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.model';
import Coupon from '../models/Coupon.model';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendAdminNewOrderNotification,
  OrderEmailData,
} from '../services/email.service';

/* ── helpers ───────────────────────────────────────────────────────────────── */
function buildEmailData(order: InstanceType<typeof Order>, orderId: string): OrderEmailData {
  return {
    orderNumber:     order.orderNumber,
    orderId,
    items:           order.items.map((i) => ({
      name:          i.name,
      image:         i.image,
      price:         i.price,
      quantity:      i.quantity,
      selectedMetal: i.selectedMetal,
      selectedSize:  i.selectedSize,
    })),
    subtotal:        order.subtotal,
    discount:        order.discount,
    shippingCost:    order.shippingCost,
    tax:             order.tax,
    total:           order.total,
    shippingMethod:  order.shippingMethod,
    shippingAddress: order.shippingAddress,
    estimatedDelivery: order.estimatedDelivery,
    trackingNumber:  order.trackingNumber,
    trackingUrl:     order.trackingUrl,
    orderStatus:     order.orderStatus,
  };
}

/**
 * Send order emails AFTER the HTTP response has been flushed.
 * This keeps checkout fast — SMTP latency never touches the user's wait time.
 */
function dispatchOrderEmails(
  emailData: OrderEmailData,
  customerEmail: string,
  firstName: string,
) {
  // setImmediate runs after the current event-loop tick (response already sent)
  setImmediate(async () => {
    try {
      await Promise.allSettled([
        sendOrderConfirmation(customerEmail, firstName, emailData),
        sendAdminNewOrderNotification(emailData, customerEmail),
      ]);
    } catch (err) {
      console.error('[email] order emails failed:', err);
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════════ */

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, shippingAddress, shippingMethod, couponCode, paymentIntentId, email: bodyEmail } = req.body;

  const shippingCosts: Record<string, number> = { standard: 0, express: 9.99, 'next-day': 14.99 };
  const shippingCost = shippingCosts[shippingMethod] || 0;
  const subtotal = items.reduce(
    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
    0,
  );

  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      discount = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  const tax   = (subtotal - discount) * 0.2;
  const total = subtotal - discount + shippingCost + tax;

  // Ensure every item has a non-empty image
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
    paymentStatus:     paymentIntentId ? 'paid' : 'pending',
    orderStatus:       'confirmed',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // ── Respond immediately — emails fire after flush ──────────────────────────
  res.status(201).json(order);

  // ── Resolve customer email (priority: form email → DB lookup) ──────────────
  try {
    const emailData  = buildEmailData(order, order._id.toString());
    let customerEmail: string | undefined = bodyEmail || req.body.guestEmail;
    let firstName = shippingAddress?.fullName?.split(' ')[0] || 'Customer';

    if (!customerEmail && req.user?._id) {
      const user = await User.findById(req.user._id).select('email firstName');
      if (user) {
        customerEmail = user.email;
        firstName     = user.firstName;
      }
    }

    if (customerEmail) {
      dispatchOrderEmails(emailData, customerEmail, firstName);
    } else {
      console.warn(`[email] no customer email found for order ${order.orderNumber}`);
    }
  } catch (err) {
    console.error('[email] failed to resolve customer email:', err);
  }
});

export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ user: req.user?._id })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images');
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
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName email');
  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      orderStatus: req.body.status,
      ...(req.body.trackingNumber ? { trackingNumber: req.body.trackingNumber } : {}),
      ...(req.body.trackingUrl    ? { trackingUrl:    req.body.trackingUrl    } : {}),
    },
    { new: true },
  ).populate('user', 'firstName email');

  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }

  // Respond immediately, then email
  res.json(order);

  // ── Status update email (non-blocking) ─────────────────────────────────────
  setImmediate(async () => {
    try {
      const populatedUser = order.user as unknown as { firstName?: string; email?: string } | null;
      const customerEmail = populatedUser?.email;
      const firstName     = populatedUser?.firstName || 'Customer';

      if (customerEmail && ['processing', 'dispatched', 'delivered', 'cancelled'].includes(order.orderStatus)) {
        const emailData = buildEmailData(order, order._id.toString());
        await sendOrderStatusUpdate(customerEmail, firstName, emailData);
      }
    } catch (err) {
      console.error('[email] status update email failed:', err);
    }
  });
});
