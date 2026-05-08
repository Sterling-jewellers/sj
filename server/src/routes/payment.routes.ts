import { Router } from 'express';
import { createPaymentIntent, handleWebhook, validateCoupon } from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// No auth required — guests can pay too; auth token is optional
router.post('/create-intent', createPaymentIntent);
router.post('/webhook', handleWebhook);
router.post('/validate-coupon', validateCoupon);

export default router;
