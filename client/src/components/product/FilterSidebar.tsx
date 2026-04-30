'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
}

const filterSections = [
  {
    key: 'metal',
    label: 'Metal',
    options: [
      { label: 'Platinum', value: 'platinum' },
      { label: '18ct Yellow Gold', value: 'yellow-gold' },
      { label: '18ct White Gold', value: 'white-gold' },
      { label: '18ct Rose Gold', value: 'rose-gold' },
      { label: 'Silver', value: 'silver' },
    ],
  },
  {
    key: 'style',
    label: 'Style',
    options: [
      { label: 'Solitaire', value: 'solitaire' },
      { label: 'Halo', value: 'halo' },
      { label: 'Three Stone', value: 'three-stone' },
      { label: 'Vintage', value: 'vintage' },
      { label: 'Pavé', value: 'pave' },
    ],
  },
  {
    key: 'gemstone',
    label: 'Diamond Shape',
    options: [
      { label: 'Round', value: 'round' },
      { label: 'Oval', value: 'oval' },
      { label: 'Princess', value: 'princess' },
      { label: 'Cushion', value: 'cushion' },
      { label: 'Emerald', value: 'emerald' },
      { label: 'Pear', value: 'pear' },
    ],
  },
];

const priceRanges = [
  { label: 'Under £500', min: '0', max: '500' },
  { label: '£500 – £1,000', min: '500', max: '1000' },
  { label: '£1,000 – £2,500', min: '1000', max: '2500' },
  { label: '£2,500 – £5,000', min: '2500', max: '5000' },
  { label: 'Over £5,000', min: '5000', max: '99999' },
];

export default function FilterSidebar({ filters, onFilterChange, onClearAll }: FilterSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ metal: true, style: true, price: true });
  const activeCount = Object.values(filters).filter(Boolean).length;

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  return (
    <aside className="w-64 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sans font-medium text-sm tracking-widest uppercase text-charcoal">Filters</h3>
        {activeCount > 0 && (
          <button onClick={onClearAll} className="flex items-center gap-1 text-xs font-sans text-gold-600 hover:text-gold-700">
            <X size={12} /> Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Price range */}
      <div className="mb-6 border-b border-gray-100 pb-6">
        <button className="flex items-center justify-between w-full mb-3" onClick={() => toggle('price')}>
          <span className="font-sans text-xs font-semibold tracking-widest uppercase text-charcoal">Price</span>
          <ChevronDown size={14} className={cn('transition-transform', !expanded.price && '-rotate-90')} />
        </button>
        {expanded.price && (
          <div className="space-y-2">
            {priceRanges.map((range) => {
              const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    if (isActive) { onFilterChange('minPrice', ''); onFilterChange('maxPrice', ''); }
                    else { onFilterChange('minPrice', range.min); onFilterChange('maxPrice', range.max); }
                  }}
                  className={cn('w-full text-left text-sm font-sans px-3 py-2 transition-colors', isActive ? 'bg-gold-50 text-gold-700 font-medium' : 'text-gray-600 hover:text-gold-600 hover:bg-gray-50')}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic filter sections */}
      {filterSections.map((section) => (
        <div key={section.key} className="mb-6 border-b border-gray-100 pb-6">
          <button className="flex items-center justify-between w-full mb-3" onClick={() => toggle(section.key)}>
            <span className="font-sans text-xs font-semibold tracking-widest uppercase text-charcoal">{section.label}</span>
            <ChevronDown size={14} className={cn('transition-transform', !expanded[section.key] && '-rotate-90')} />
          </button>
          {expanded[section.key] && (
            <div className="space-y-2">
              {section.options.map((opt) => {
                const isActive = filters[section.key] === opt.value;
                return (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={cn('w-4 h-4 border flex items-center justify-center transition-colors flex-shrink-0', isActive ? 'bg-gold-500 border-gold-500' : 'border-gray-300 group-hover:border-gold-400')}>
                      {isActive && <div className="w-2 h-2 bg-white" />}
                    </div>
                    <input type="checkbox" className="sr-only" checked={isActive} onChange={() => onFilterChange(section.key, isActive ? '' : opt.value)} />
                    <span className={cn('text-sm font-sans transition-colors', isActive ? 'text-gold-700 font-medium' : 'text-gray-600 group-hover:text-charcoal')}>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
