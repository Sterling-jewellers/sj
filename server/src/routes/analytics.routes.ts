import { Router } from 'express';
import { logBehavior, getBehaviorAnalytics, exportAdsData } from '../controllers/analytics.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// Public — any browser can log behavior (no PII collected)
router.post('/behavior', logBehavior);

// Admin only — view aggregated analytics and export ads data
router.get('/behavior',   protect, adminOnly, getBehaviorAnalytics);
router.get('/export-ads', protect, adminOnly, exportAdsData);

export default router;
