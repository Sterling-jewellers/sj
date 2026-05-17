'use client';

import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/product/ProductCard';
import { productsApi } from '@/lib/api';
import { IProduct } from '@/types';
import Link from 'next/link';

function ProductSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton aspect-square w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-4 w-1/3" />
    </div>
  );
}

export default function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsApi.getFeatured(),
  });

  const products: IProduct[] = data?.data || [];

  return (
    <section className="py-28 bg-white">
      <div className="page-container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="section-subtitle mb-3">Handpicked For You</p>
            <h2 className="section-title">Featured Pieces</h2>
            <div className="gold-divider mt-4 mx-0" />
          </div>
          <Link href="/products?isFeatured=true" className="hidden md:block text-xs font-sans tracking-widest uppercase text-gold-600 hover:text-gold-700 font-medium">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product._id} product={product} />)
          }
        </div>

        <div className="text-center mt-10">
          <Link href="/products" className="btn-outline-gold inline-block">View All Products</Link>
        </div>
      </div>
    </section>
  );
}
