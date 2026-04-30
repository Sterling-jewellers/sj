import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Category from '../models/Category.model';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
  res.json(categories);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) { res.status(404).json({ message: 'Category not found' }); return; }
  res.json(category);
}));

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
}));

router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
}));

router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category removed' });
}));

export default router;
