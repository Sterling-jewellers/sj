import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Review from '../models/Review.model';
import { protect, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();

router.get('/product/:productId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'firstName lastName avatar')
    .sort({ createdAt: -1 });
  res.json(reviews);
}));

router.post('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.create({ ...req.body, user: req.user?._id });
  res.status(201).json(review);
}));

router.patch('/:id/approve', protect, adminOnly, asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  res.json(review);
}));

router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: 'Review deleted' });
}));

export default router;
