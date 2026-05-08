'use client';

import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getRecentlyViewedSlugs } from '@/lib/personalization';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { IProduct } from '@/types';

export default function RecentlyViewed() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(getRecentlyViewedSlugs(8));
  }, []);

  const results = useQueries({
    queries: slugs.map(slug => ({
      queryKey: ['product', slug],
      queryFn: () => productsApi.getBySlug(slug),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const products = results
    .map(r => r.data?.data as IProduct | undefined)
    .filter(Boolean) as IProduct[];

  if (products.length < 2) return null;

  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-sans tracking-widest uppercase text-gold-600 mb-1">Your History</p>
            <h2 className="font-serif text-2xl font-light text-charcoal">Recently Viewed</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {products.slice(0, 5).map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
