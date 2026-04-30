import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Stripe from 'stripe';
import Order from '../models/Order.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const { amount, currency = 'gbp', metadata } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    res.status(400).json({ message: 'Webhook error' });
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await Order.findOneAndUpdate(
        { paymentIntentId: pi.id },
        { paymentStatus: 'paid', orderStatus: 'confirmed' }
      );
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await Order.findOneAndUpdate({ paymentIntentId: pi.id }, { paymentStatus: 'failed' });
      break;
    }
  }

  res.json({ received: true });
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const Coupon = (await import('../models/Coupon.model')).default;
  const coupon = await Coupon.findOne({ code: req.body.code?.toUpperCase(), isActive: true });

  if (!coupon || (coupon.expiresAt && coupon.expiresAt < new Date())) {
    res.status(404).json({ message: 'Invalid or expired coupon' });
    return;
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    res.status(400).json({ message: 'Coupon usage limit reached' });
    return;
  }

  res.json({ type: coupon.type, value: coupon.value, minOrderValue: coupon.minOrderValue });
});
