'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/product/ProductCard';
import { productsApi } from '@/lib/api';
import { IProduct } from '@/types';
import Link from 'next/link';
import { getPersonalizationScore, isReturningVisitor, getTopStyles, getTopMetals } from '@/lib/personalization';

function ProductSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="bg-gray-100 aspect-square w-full" />
      <div className="bg-gray-100 h-4 w-3/4 rounded" />
      <div className="bg-gray-100 h-3 w-1/2 rounded" />
      <div className="bg-gray-100 h-4 w-1/3 rounded" />
    </div>
  );
}

interface PersonalisedLabel {
  eyebrow: string;
  heading: string;
  sub: string | null;
}

export default function FeaturedProducts() {
  const [label, setLabel]       = useState<PersonalisedLabel>({
    eyebrow: 'Handpicked For You',
    heading: 'Featured Pieces',
    sub: null,
  });
  const [sorted, setSorted]     = useState<IProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsApi.getFeatured(),
  });

  const products: IProduct[] = data?.data || [];

  // Runs once on the client — reads localStorage preferences
  useEffect(() => {
    setHydrated(true);

    const returning   = isReturningVisitor();
    const topStyles   = getTopStyles(2);
    const topMetals   = getTopMetals(1);

    if (returning && topStyles.length > 0) {
      const styleName = topStyles[0].replace(/-/g, ' ');
      setLabel({
        eyebrow: 'Tailored To Your Taste',
        heading: 'Picked For You',
        sub: `Based on your interest in ${styleName}${topMetals[0] ? ` · ${topMetals[0].replace(/-/g, ' ')}` : ''}`,
      });
    } else if (returning) {
      setLabel({
        eyebrow: 'Welcome Back',
        heading: 'Trending Now',
        sub: 'Our most-loved pieces this week',
      });
    }
    // else: first-time visitor — keep default label
  }, []);

  // Re-sort products by personalisation score whenever products or hydration changes
  useEffect(() => {
    if (!products.length) return;
    const scored = [...products]
      .map(p => ({
        product: p,
        score: getPersonalizationScore({
          style: (p as any).style,
          metalOptions: p.metalOptions,
          basePrice: p.basePrice,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);

    setSorted(scored);
  }, [products, hydrated]);

  const displayProducts = sorted.length > 0 ? sorted : products;

  return (
    <section className="py-28 bg-white">
      <div className="page-container">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="section-subtitle mb-3">{label.eyebrow}</p>
            <h2 className="section-title">{label.heading}</h2>
            <div className="gold-divider mt-4 mx-0" />
            {label.sub && (
              <p className="mt-3 text-xs font-sans text-gray-400 tracking-wide">{label.sub}</p>
            )}
          </div>
          <Link
            href="/products?isFeatured=true"
            className="hidden md:flex items-center gap-1 text-xs font-sans tracking-widest uppercase text-navy hover:text-black font-medium transition-colors"
          >
            View All <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : displayProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
          }
        </div>

        {/* Mobile view all */}
        <div className="text-center mt-10">
          <Link href="/products" className="btn-outline-gold inline-block">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
