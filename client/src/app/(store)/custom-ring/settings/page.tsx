'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SlidersHorizontal, Check } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { IProduct } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useRingBuilder } from '@/store/ringBuilderStore';
import BuilderHeader from '@/components/ring-builder/BuilderHeader';
import { cn } from '@/lib/utils';

const STYLES   = ['All','Solitaire','Halo','Three Stone','Pavé','Vintage','Cluster'];
const METALS   = ['All','Platinum','18ct Yellow Gold','18ct White Gold','18ct Rose Gold','9ct Gold'];
const METAL_COLORS: Record<string, string> = {
  'yellow-gold': '#D4A843', 'white-gold': '#D8D8D8',
  'rose-gold': '#E8A090', platinum: '#A8A8BC', silver: '#C0C0C0',
};
const METAL_FILTERS: Record<string, string> = {
  'yellow-gold': 'none',
  'white-gold':  'grayscale(0.78) brightness(1.18) contrast(1.06)',
  'rose-gold':   'sepia(0.28) saturate(1.55) hue-rotate(-12deg) brightness(1.04)',
  platinum:      'grayscale(0.92) brightness(1.22) contrast(1.10)',
  silver:        'grayscale(0.72) brightness(1.12) saturate(0.35)',
};

export default function SettingsPage() {
  const router = useRouter();
  const { setting: chosenSetting, setSetting } = useRingBuilder();

  const [styleFilter, setStyleFilter] = useState('All');
  const [metalFilter, setMetalFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [previewMetal, setPreviewMetal] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['ring-settings-gallery'],
    queryFn: () => productsApi.getAll({ isRingBuilder: 'true', limit: 200, sort: 'newest' }),
  });

  const allSettings: IProduct[] = useMemo(() => {
    const raw = data?.data;
    const all: IProduct[] = Array.isArray(raw) ? raw : (raw?.products || []);
    // Only show engagement ring settings (Ladies Rings → engagement-rings category)
    // Wedding bands, signet rings and gents rings are excluded from the builder
    return all.filter(p =>
      p.isRingBuilder === true &&
      (p.category as { slug?: string })?.slug === 'engagement-rings'
    );
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...allSettings];
    if (styleFilter !== 'All') list = list.filter(p => p.style?.toLowerCase().includes(styleFilter.toLowerCase()));
    if (metalFilter !== 'All') list = list.filter(p => p.metalOptions?.some(m => {
      const label = `${m.karat || ''} ${m.type}`.toLowerCase();
      return metalFilter.toLowerCase().split(' ').every(w => label.includes(w));
    }));
    if (sort === 'price-asc')  list.sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
    if (sort === 'price-desc') list.sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
    return list;
  }, [allSettings, styleFilter, metalFilter, sort]);

  const handleSelect = (p: IProduct) => {
    setSetting(p);
    router.push(`/custom-ring/settings/${p.slug}`);
  };

  return (
    <div className="bg-white min-h-screen">
      <BuilderHeader />

      {/* Sub-header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="font-serif text-xl font-light text-charcoal">Choose a Setting</h1>
            <p className="text-xs font-sans text-gray-400 mt-0.5">{filtered.length} settings available</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-xs font-sans border border-gray-200 px-3 py-2 bg-white text-charcoal focus:outline-none focus:border-charcoal">
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low–High</option>
              <option value="price-desc">Price: High–Low</option>
            </select>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 flex gap-8">
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-sans font-bold tracking-widest uppercase text-gray-400">Style</p>
            <div className="flex gap-1.5 flex-wrap">
              {STYLES.map(s => (
                <button key={s} onClick={() => setStyleFilter(s)}
                  className={cn('px-3 py-1 text-xs font-sans border transition-colors',
                    styleFilter === s ? 'border-charcoal bg-charcoal text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filtered.map(setting => {
              const metal = previewMetal[setting._id] || setting.metalOptions?.find(m => m.isDefault)?.type || setting.metalOptions?.[0]?.type || '';
              const filter = METAL_FILTERS[metal] || 'none';
              const isSelected = chosenSetting?._id === setting._id;

              return (
                <div
                  key={setting._id}
                  className={cn(
                    'group cursor-pointer bg-white border-2 transition-all duration-200 hover:shadow-lg',
                    isSelected ? 'border-charcoal shadow-lg' : 'border-gray-100 hover:border-gray-300'
                  )}
                >
                  {/* Image */}
                  <div
                    className="relative aspect-square overflow-hidden bg-gray-50"
                    onClick={() => handleSelect(setting)}
                  >
                    {setting.images[0] ? (
                      <Image
                        src={setting.images[0]}
                        alt={setting.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ filter, transition: 'filter 0.4s ease' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-charcoal rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-sans font-medium text-charcoal line-clamp-2 leading-tight min-h-[2rem]"
                      onClick={() => handleSelect(setting)}>
                      {setting.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">From {formatPrice(setting.salePrice || setting.basePrice)}</p>

                    {/* Metal swatches */}
                    {setting.metalOptions?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {setting.metalOptions.slice(0, 5).map(m => (
                          <button
                            key={m.type}
                            onClick={() => setPreviewMetal(prev => ({ ...prev, [setting._id]: m.type }))}
                            title={m.type}
                            className={cn('w-4 h-4 rounded-full border-2 transition-all',
                              (previewMetal[setting._id] || setting.metalOptions?.find(x => x.isDefault)?.type) === m.type
                                ? 'border-charcoal scale-110' : 'border-transparent hover:scale-110'
                            )}
                            style={{ backgroundColor: METAL_COLORS[m.type] || '#D4A843' }}
                          />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleSelect(setting)}
                      className="w-full mt-3 py-2 text-[11px] font-sans font-medium tracking-wider border border-gray-300 text-charcoal hover:bg-charcoal hover:text-white hover:border-charcoal transition-colors"
                    >
                      SELECT SETTING
                    </button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !isLoading && (
              <div className="col-span-5 py-20 text-center text-gray-400">
                <p className="font-sans text-sm">No settings found — try adjusting the filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
