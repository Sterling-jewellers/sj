'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { IProduct } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => productsApi.getAll({ search: debouncedQuery, limit: 6 }),
    enabled: debouncedQuery.length >= 2,
  });

  const results: IProduct[] = data?.data?.products || [];

  return (
    <div className="fixed inset-0 z-[100] bg-charcoal/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-ivory w-full max-w-2xl mx-auto mt-20 rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <Search size={18} className="text-gold-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for rings, diamonds, jewellery..."
            className="flex-1 bg-transparent text-sm font-sans outline-none text-charcoal placeholder:text-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 size={16} className="animate-spin text-gold-500" />}
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="py-2 max-h-96 overflow-y-auto">
            {results.map((product) => (
              <Link key={product._id} href={`/products/${product.slug}`} onClick={onClose} className="flex items-center gap-4 px-6 py-3 hover:bg-champagne transition-colors">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover rounded" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-medium text-charcoal truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category?.name}</p>
                </div>
                <span className="text-sm font-medium text-gold-600">{formatPrice(product.salePrice || product.basePrice)}</span>
              </Link>
            ))}
            <div className="px-6 py-3 border-t border-gray-100">
              <Link href={`/products?search=${debouncedQuery}`} onClick={onClose} className="text-xs font-sans tracking-widest uppercase text-gold-600 hover:text-gold-700">
                View all results for "{debouncedQuery}" →
              </Link>
            </div>
          </div>
        )}

        {debouncedQuery.length >= 2 && results.length === 0 && !isLoading && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-sans text-gray-500">No results found for "{debouncedQuery}"</p>
          </div>
        )}

        {!debouncedQuery && (
          <div className="px-6 py-6">
            <p className="text-xs font-sans tracking-widest uppercase text-gray-400 mb-3">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Engagement Rings', 'Diamond Rings', 'Gold Necklace', 'Wedding Bands', 'Eternity Ring'].map((term) => (
                <button key={term} onClick={() => setQuery(term)} className="px-3 py-1.5 border border-gray-200 text-xs font-sans text-charcoal hover:border-gold-400 hover:text-gold-600 transition-colors rounded-full">
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
