'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { IProduct } from '@/types';
import Link from 'next/link';

export default function Bestsellers() {
  const { data, isLoading } = useQuery({
    queryKey: ['bestsellers'],
    queryFn: () => productsApi.getBestsellers(),
  });

  const products: IProduct[] = data?.data || [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-20 bg-champagne">
      <div className="page-container">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Customer Favourites</p>
          <h2 className="section-title">Our Bestsellers</h2>
          <div className="gold-divider mt-4" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="skeleton aspect-square w-full" />
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-4 w-1/3" />
                </div>
              ))
            : products.map((p) => <ProductCard key={p._id} product={p} />)
          }
        </div>

        <div className="text-center mt-10">
          <Link href="/products?sort=popular" className="btn-outline-gold inline-block">Shop Bestsellers</Link>
        </div>
      </div>
    </section>
  );
}
