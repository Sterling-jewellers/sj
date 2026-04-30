import { Router } from 'express';
import {
  getProducts, getProductBySlug, getFeaturedProducts,
  getBestsellers, getRelatedProducts, createProduct, updateProduct, deleteProduct,
} from '../controllers/product.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestsellers);
router.get('/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
