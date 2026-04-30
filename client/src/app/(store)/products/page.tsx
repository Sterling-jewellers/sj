'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Grid3X3, List, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import FilterSidebar from '@/components/product/FilterSidebar';
import { productsApi } from '@/lib/api';
import { IProduct } from '@/types';
import { cn } from '@/lib/utils';

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Best Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

// ── Inner component uses useSearchParams — must be inside Suspense ─────────────
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);

  const getFilters = useCallback(() => {
    const f: Record<string, string> = {};
    ['metal', 'style', 'gemstone', 'minPrice', 'maxPrice', 'sort', 'search', 'category'].forEach((k) => {
      const v = searchParams?.get(k);
      if (v) f[k] = v;
    });
    return f;
  }, [searchParams]);

  const filters = getFilters();

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll({ ...filters, limit: 12 }),
  });

  const products: IProduct[] = data?.data?.products || [];
  const total: number = data?.data?.total || 0;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const clearAll = () => router.push('/products');

  return (
    <div className="py-10 bg-ivory min-h-screen">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sans text-gray-500 mb-4">
            <a href="/" className="hover:text-gold-600">Home</a>
            <span>/</span>
            <span className="text-charcoal" aria-current="page">All Jewellery</span>
          </nav>
          <h1 className="section-title">All Jewellery</h1>
          <p className="font-sans text-sm text-gray-500 mt-2">{total} products</p>
        </div>

        {/* Sort & view controls */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 text-xs font-sans font-medium tracking-widest uppercase text-charcoal hover:text-gold-600 transition-colors lg:hidden">
            <SlidersHorizontal size={15} /> Filters
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans text-gray-500">Sort:</span>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="text-xs font-sans border border-gray-200 px-3 py-2 bg-white outline-none focus:border-gold-400"
              >
                {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <button onClick={() => setView('grid')} aria-label="Grid view" className={cn('p-2 transition-colors', view === 'grid' ? 'text-gold-600' : 'text-gray-400 hover:text-gray-600')}>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setView('list')} aria-label="List view" className={cn('p-2 transition-colors', view === 'list' ? 'text-gold-600' : 'text-gray-400 hover:text-gray-600')}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar filters={filters} onFilterChange={updateFilter} onClearAll={clearAll} />
          </div>

          {/* Mobile filter overlay */}
          {filterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-charcoal/50" onClick={() => setFilterOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-ivory p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-sans font-semibold text-sm tracking-widest uppercase">Filters</h3>
                  <button onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={18} /></button>
                </div>
                <FilterSidebar filters={filters} onFilterChange={updateFilter} onClearAll={clearAll} />
              </div>
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="skeleton aspect-square" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-serif text-2xl text-charcoal mb-2">No products found</p>
                <p className="text-sm font-sans text-gray-500 mb-6">Try adjusting your filters</p>
                <button onClick={clearAll} className="btn-outline-gold">Clear Filters</button>
              </div>
            ) : (
              <div className={cn('grid gap-5', view === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1')}>
                {products.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="py-10 bg-ivory min-h-screen page-container">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-square" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
