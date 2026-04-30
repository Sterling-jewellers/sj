'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { diamondsApi } from '@/lib/api';
import { IDiamond } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const shapeOptions = ['round', 'princess', 'oval', 'cushion', 'emerald', 'pear', 'marquise', 'radiant', 'asscher', 'heart'];
const colorOptions = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const clarityOptions = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];
const cutOptions = ['Ideal', 'Excellent', 'Very Good', 'Good'];
const labOptions = ['GIA', 'IGI', 'HRD'];

type SortKey = 'price' | 'caratWeight' | 'cut' | 'color' | 'clarity';

export default function DiamondSearchPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'price', dir: 'asc' });

  const { data, isLoading } = useQuery({
    queryKey: ['diamonds', filters, sort],
    queryFn: () => diamondsApi.getAll({ ...filters, sort: `${sort.key}-${sort.dir}`, limit: 50 }),
  });

  const diamonds: IDiamond[] = data?.data?.diamonds || [];
  const total: number = data?.data?.total || 0;

  const setFilter = (key: string, value: string) =>
    setFilters((p) => ({ ...p, [key]: p[key] === value ? '' : value }));

  const toggleSort = (key: SortKey) =>
    setSort((p) => ({ key, dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc' }));

  const SortIcon = ({ col }: { col: SortKey }) =>
    sort.key === col ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-30" />;

  const clarityGrade = { FL: 10, IF: 9, VVS1: 8, VVS2: 7, VS1: 6, VS2: 5, SI1: 4, SI2: 3, I1: 2 };
  const cutGrade = { Ideal: 5, Excellent: 4, 'Very Good': 3, Good: 2, Fair: 1 };

  return (
    <div className="bg-ivory min-h-screen py-10">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="section-subtitle mb-3">GIA & IGI Certified</p>
          <h1 className="section-title">Diamond Search</h1>
          <div className="gold-divider mt-4" />
          <p className="text-sm font-sans text-gray-500 mt-4">Search over {total > 0 ? total.toLocaleString() : '10,000'}+ diamonds to find your perfect stone</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* Shape */}
            <div>
              <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">Shape</p>
              <div className="flex flex-wrap gap-1.5">
                {shapeOptions.map((s) => (
                  <button key={s} onClick={() => setFilter('shape', s)} className={cn('px-2.5 py-1.5 text-[10px] font-sans border capitalize transition-colors', filters.shape === s ? 'bg-gold-500 border-gold-500 text-white' : 'border-gray-200 text-gray-600 hover:border-gold-300')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">Colour</p>
              <div className="flex flex-wrap gap-1.5">
                {colorOptions.map((c) => (
                  <button key={c} onClick={() => setFilter('color', c)} className={cn('w-9 h-9 text-xs font-sans border transition-colors', filters.color === c ? 'bg-gold-500 border-gold-500 text-white font-medium' : 'border-gray-200 text-gray-600 hover:border-gold-300')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Clarity */}
            <div>
              <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">Clarity</p>
              <div className="flex flex-wrap gap-1.5">
                {clarityOptions.map((c) => (
                  <button key={c} onClick={() => setFilter('clarity', c)} className={cn('px-2.5 py-1.5 text-[10px] font-sans border transition-colors', filters.clarity === c ? 'bg-gold-500 border-gold-500 text-white font-medium' : 'border-gray-200 text-gray-600 hover:border-gold-300')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Cut */}
            <div>
              <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">Cut</p>
              <div className="space-y-1.5">
                {cutOptions.map((c) => (
                  <button key={c} onClick={() => setFilter('cut', c)} className={cn('block w-full text-left px-3 py-1.5 text-xs font-sans border transition-colors', filters.cut === c ? 'bg-gold-500 border-gold-500 text-white font-medium' : 'border-gray-200 text-gray-600 hover:border-gold-300')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Carat & Lab */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">Carat</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" step="0.1" min="0.1" onChange={(e) => setFilters((p) => ({ ...p, minCarat: e.target.value }))} className="input-field py-2 text-xs w-full" />
                  <input type="number" placeholder="Max" step="0.1" min="0.1" onChange={(e) => setFilters((p) => ({ ...p, maxCarat: e.target.value }))} className="input-field py-2 text-xs w-full" />
                </div>
              </div>
              <div>
                <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">Certificate</p>
                <div className="flex gap-1.5">
                  {labOptions.map((l) => (
                    <button key={l} onClick={() => setFilter('lab', l)} className={cn('flex-1 py-1.5 text-[10px] font-sans border transition-colors', filters.lab === l ? 'bg-gold-500 border-gold-500 text-white' : 'border-gray-200 text-gray-600 hover:border-gold-300')}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {Object.values(filters).some(Boolean) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => setFilters({})} className="text-xs font-sans text-gold-600 hover:underline">Clear all filters</button>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-charcoal text-white">
              <tr>
                {[
                  { label: 'Shape', key: null },
                  { label: 'Carat', key: 'caratWeight' as SortKey },
                  { label: 'Cut', key: 'cut' as SortKey },
                  { label: 'Color', key: 'color' as SortKey },
                  { label: 'Clarity', key: 'clarity' as SortKey },
                  { label: 'Certificate', key: null },
                  { label: 'Price', key: 'price' as SortKey },
                  { label: '', key: null },
                ].map(({ label, key }) => (
                  <th key={label} className="px-4 py-4 text-left">
                    {key ? (
                      <button onClick={() => toggleSort(key)} className="flex items-center gap-1 text-xs tracking-widest uppercase font-medium hover:text-gold-300 transition-colors">
                        {label} <SortIcon col={key} />
                      </button>
                    ) : (
                      <span className="text-xs tracking-widest uppercase font-medium">{label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : diamonds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">No diamonds found. Try adjusting your filters.</td>
                </tr>
              ) : (
                diamonds.map((diamond) => (
                  <tr key={diamond._id} className="hover:bg-gold-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 capitalize font-medium">{diamond.shape}</td>
                    <td className="px-4 py-3">{diamond.caratWeight.toFixed(2)}ct</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 text-xs rounded-sm', (cutGrade[diamond.cut as keyof typeof cutGrade] || 0) >= 4 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600')}>
                        {diamond.cut}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{diamond.color}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 text-xs rounded-sm', (clarityGrade[diamond.clarity as keyof typeof clarityGrade] || 0) >= 7 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600')}>
                        {diamond.clarity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium">{diamond.certificate.lab}</span>
                      {diamond.certificate.pdfUrl && (
                        <a href={diamond.certificate.pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-gold-500 hover:text-gold-600" onClick={(e) => e.stopPropagation()}>
                          <ExternalLink size={11} className="inline" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gold-600">{formatPrice(diamond.price)}</td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1.5 bg-charcoal text-white text-[10px] font-sans tracking-widest uppercase hover:bg-gold-500 transition-colors">Select</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs font-sans text-gray-400 mt-4 text-center">
          {total > 0 && `Showing ${Math.min(diamonds.length, 50)} of ${total.toLocaleString()} diamonds`}
        </p>
      </div>
    </div>
  );
}
