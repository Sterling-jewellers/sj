'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { IProduct } from '@/types';
import Image from 'next/image';

export default function CategoryClient({ slug }: { slug: string }) {
  const { data: categoryData } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['category-products', slug],
    queryFn: () => productsApi.getAll({ category: categoryData?.data?._id, limit: 12 }),
    enabled: !!categoryData?.data,
  });

  const category = categoryData?.data;
  const products: IProduct[] = productsData?.data?.products || [];

  return (
    <div className="bg-ivory min-h-screen">
      {category?.image && (
        <div className="relative h-64 overflow-hidden">
          <Image src={category.image} alt={category.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-charcoal/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="font-serif text-5xl font-light">{category?.name || slug.replace(/-/g, ' ')}</h1>
            {category?.description && (
              <p className="text-sm font-sans text-gray-300 mt-2 max-w-md text-center">{category.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="page-container py-12">
        {!category?.image && (
          <h1 className="section-title mb-8 capitalize">{slug.replace(/-/g, ' ')}</h1>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-square" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-charcoal">No products found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
