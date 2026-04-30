import { Router } from 'express';
import { createPaymentIntent, handleWebhook, validateCoupon } from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/create-intent', protect, createPaymentIntent);
router.post('/webhook', handleWebhook);
router.post('/validate-coupon', validateCoupon);

export default router;
