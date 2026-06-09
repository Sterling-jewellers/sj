'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ICategory, IProduct } from '@/types';
import Link from 'next/link';

// Jewellery categories shown in Bestsellers — deliberately NO rings to avoid overlap with Featured
const BESTSELLER_SLUGS = [
  'gold-chains',
  'gold-earrings',
  'gold-bangles',
  'gold-bracelets',
  'gold-pendants',
  'silver-earrings',
  'silver-bracelets',
  'silver-pendants',
];

export default function Bestsellers() {
  // ── Step 1: fetch all categories ──────────────────────────────────────────
  const { data: catData } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 600_000,
  });

  const allCats: ICategory[] = catData?.data || [];

  // ── Step 2: find matching category objects ────────────────────────────────
  const targetCats = allCats.filter(c => BESTSELLER_SLUGS.includes(c.slug));

  // ── Step 3: fetch up to 3 products from each matching category ─────────────
  const productQueries = useQueries({
    queries: targetCats.map(cat => ({
      queryKey: ['products-by-category', String(cat._id)],
      queryFn: () => productsApi.getAll({ category: String(cat._id), limit: 3 }),
      staleTime: 300_000,
    })),
  });

  const catLoading  = !catData;
  const prodLoading = productQueries.some(q => q.isLoading);
  const isLoading   = catLoading || (targetCats.length > 0 && prodLoading);

  // Interleave: take 1 product from each category in round-robin until we have 8
  const interleaved: IProduct[] = [];
  if (productQueries.length > 0) {
    const buckets = productQueries.map(q => q.data?.data?.products || []);
    const maxRounds = 8;
    let round = 0;
    while (interleaved.length < maxRounds) {
      let added = false;
      for (const bucket of buckets) {
        if (interleaved.length >= maxRounds) break;
        if (bucket[round]) { interleaved.push(bucket[round]); added = true; }
      }
      if (!added) break;
      round++;
    }
  }

  if (!isLoading && interleaved.length === 0) return null;

  return (
    <section className="py-28 bg-[#F5F7FA]">
      <div className="page-container">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Customer Favourites</p>
          <h2 className="section-title">Our Bestsellers</h2>
          <div className="gold-divider mt-4" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="bg-gray-100 aspect-square w-full" />
                  <div className="bg-gray-100 h-4 w-3/4 rounded" />
                  <div className="bg-gray-100 h-3 w-1/2 rounded" />
                  <div className="bg-gray-100 h-4 w-1/3 rounded" />
                </div>
              ))
            : interleaved.map((p) => <ProductCard key={p._id} product={p} />)
          }
        </div>

        <div className="text-center mt-10">
          <Link href="/products" className="btn-outline-gold inline-block">
            Shop All Jewellery
          </Link>
        </div>
      </div>
    </section>
  );
}
