import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User.model';
import { protect, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();

router.get('/wishlist', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).populate('wishlist');
  res.json(user?.wishlist || []);
}));

router.post('/wishlist/:productId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  const pid = req.params.productId as unknown as import('mongoose').Types.ObjectId;
  const idx = user.wishlist.findIndex((id) => id.toString() === req.params.productId);
  if (idx > -1) user.wishlist.splice(idx, 1);
  else user.wishlist.push(pid);
  await user.save();
  res.json({ wishlist: user.wishlist });
}));

router.put('/profile', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.user?._id, req.body, { new: true });
  res.json(user);
}));

router.post('/addresses', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  user.addresses.push(req.body);
  await user.save();
  res.json(user.addresses);
}));

router.get('/', protect, adminOnly, asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
}));

export default router;
