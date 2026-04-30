import { Router } from 'express';
import { getDiamonds, getDiamondById, createDiamond, updateDiamond, deleteDiamond } from '../controllers/diamond.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDiamonds);
router.get('/:id', getDiamondById);
router.post('/', protect, adminOnly, createDiamond);
router.put('/:id', protect, adminOnly, updateDiamond);
router.delete('/:id', protect, adminOnly, deleteDiamond);

export default router;
