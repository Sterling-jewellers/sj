'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { diamondsApi } from '@/lib/api';
import { IDiamond } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ChevronDown, ChevronUp, Gem, X, Check, Award, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Shape SVG icons ────────────────────────────────────────────────────────────
const SHAPE_ICONS: Record<string, string> = {
  round: '⬤',
  oval: '⬭',
  princess: '■',
  cushion: '▪',
  emerald: '▬',
  pear: '🍐',
  marquise: '◆',
  heart: '♥',
  radiant: '◻',
  asscher: '◼',
};

const SHAPES = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear', 'marquise', 'heart', 'radiant', 'asscher'];
const CUTS = ['Ideal', 'Excellent', 'Very Good', 'Good'];
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];

type SortKey = 'price' | 'caratWeight' | 'cut';
type SortDir = 'asc' | 'desc';

interface Filters {
  shape: string;
  caratMin: number;
  caratMax: number;
  cut: string;
  color: string;
  clarity: string;
  priceMin: number;
  priceMax: number;
}

const DEFAULT_FILTERS: Filters = {
  shape: '', caratMin: 0, caratMax: 100,
  cut: '', color: '', clarity: '',
  priceMin: 0, priceMax: 99_999_999,  // no ceiling — Nivoda diamonds can be £1M+
};

interface DiamondPickerProps {
  selectedDiamond: IDiamond | null;
  onSelect: (diamond: IDiamond | null) => void;
}

export default function DiamondPicker({ selectedDiamond, onSelect }: DiamondPickerProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // Fetch all diamonds once; filter/sort client-side for snappy UX
  const { data, isLoading } = useQuery({
    queryKey: ['diamonds-picker'],
    queryFn: () => diamondsApi.getAll({ limit: 500 }),
    enabled: open,
    staleTime: 15 * 60_000,
  });

  const allDiamonds: IDiamond[] = data?.data?.diamonds || data?.data || [];

  const filtered = useMemo(() => {
    return allDiamonds.filter((d) => {
      if (filters.shape && d.shape !== filters.shape) return false;
      if (d.caratWeight < filters.caratMin || d.caratWeight > filters.caratMax) return false;
      if (filters.cut && d.cut !== filters.cut) return false;
      if (filters.color && d.color !== filters.color) return false;
      if (filters.clarity && d.clarity !== filters.clarity) return false;
      if (d.price < filters.priceMin || d.price > filters.priceMax) return false;
      return true;
    });
  }, [allDiamonds, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] as number | string;
      let bv = b[sortKey] as number | string;
      if (sortKey === 'cut') {
        const order = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'];
        av = order.indexOf(av as string);
        bv = order.indexOf(bv as string);
      }
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });
  }, [filtered, sortKey, sortDir]);

  const pages = Math.ceil(sorted.length / PER_PAGE);
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setPage(1); };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-30" />;

  return (
    <div className="mb-6">
      {/* Trigger */}
      <div className="border border-gray-200 rounded-sm">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Gem size={16} className="text-gold-500" />
            <span className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal">
              {selectedDiamond ? 'Change Diamond' : 'Choose a Diamond'}
            </span>
            {!selectedDiamond && (
              <span className="text-[10px] px-2 py-0.5 bg-gold-50 text-gold-700 rounded-full font-medium">Optional</span>
            )}
          </div>
          <ChevronRight size={15} className={cn('text-gray-400 transition-transform', open && 'rotate-90')} />
        </button>

        {/* Selected diamond summary */}
        {selectedDiamond && (
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{SHAPE_ICONS[selectedDiamond.shape] || '💎'}</span>
              <div>
                <p className="text-sm font-sans font-medium text-charcoal">
                  {selectedDiamond.caratWeight}ct {selectedDiamond.shape} — {selectedDiamond.cut} / {selectedDiamond.color} / {selectedDiamond.clarity}
                </p>
                <p className="text-xs text-gray-500">{selectedDiamond.certificate.lab} certified · {formatPrice(selectedDiamond.price)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded picker */}
      {open && (
        <div className="border border-t-0 border-gray-200 bg-white">
          {/* Shape tabs */}
          <div className="px-4 pt-4">
            <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-2">Shape</p>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilter('shape', '')}
                className={cn('px-3 py-1.5 text-xs rounded border font-medium transition-colors', !filters.shape ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-gray-600 hover:border-gray-400')}
              >
                All
              </button>
              {SHAPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter('shape', s)}
                  className={cn('flex flex-col items-center px-3 py-1.5 text-xs rounded border font-medium transition-colors', filters.shape === s ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-gray-600 hover:border-gray-400')}
                >
                  <span className="text-base leading-none mb-0.5">{SHAPE_ICONS[s]}</span>
                  <span className="capitalize">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter row */}
          <div className="px-4 py-3 flex flex-wrap gap-3 items-end">
            {/* Carat range */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Carat</p>
              <div className="flex items-center gap-1">
                <input
                  type="number" step="0.1" min="0" max="10"
                  value={filters.caratMin} onChange={(e) => setFilter('caratMin', +e.target.value)}
                  className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="Min"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number" step="0.1" min="0" max="10"
                  value={filters.caratMax} onChange={(e) => setFilter('caratMax', +e.target.value)}
                  className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Cut */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Cut</p>
              <select value={filters.cut} onChange={(e) => setFilter('cut', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400">
                <option value="">Any</option>
                {CUTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Color */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Color</p>
              <select value={filters.color} onChange={(e) => setFilter('color', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400">
                <option value="">Any</option>
                {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Clarity */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Clarity</p>
              <select value={filters.clarity} onChange={(e) => setFilter('clarity', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400">
                <option value="">Any</option>
                {CLARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Price (£)</p>
              <div className="flex items-center gap-1">
                <input
                  type="number" min="0"
                  value={filters.priceMin} onChange={(e) => setFilter('priceMin', +e.target.value)}
                  className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="Min"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number" min="0"
                  value={filters.priceMax === 999999 ? '' : filters.priceMax}
                  onChange={(e) => setFilter('priceMax', e.target.value ? +e.target.value : 999999)}
                  className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="Max"
                />
              </div>
            </div>

            <button type="button" onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear filters</button>
          </div>

          {/* Diamond table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-gray-400">Loading diamonds…</div>
            ) : sorted.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No diamonds match your filters.</div>
            ) : (
              <>
                <table className="w-full text-xs font-sans">
                  <thead className="bg-gray-50 border-y border-gray-100">
                    <tr>
                      <th className="w-6 px-4 py-2.5" />
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-gray-500">Shape</th>
                      <th
                        className="px-3 py-2.5 text-left cursor-pointer hover:text-amber-600 select-none"
                        onClick={() => handleSort('caratWeight')}
                      >
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
                          Carat <SortIcon k="caratWeight" />
                        </span>
                      </th>
                      <th
                        className="px-3 py-2.5 text-left cursor-pointer hover:text-amber-600 select-none"
                        onClick={() => handleSort('cut')}
                      >
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
                          Cut <SortIcon k="cut" />
                        </span>
                      </th>
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-gray-500">Color</th>
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-gray-500">Clarity</th>
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-gray-500">Cert</th>
                      <th
                        className="px-3 py-2.5 text-right cursor-pointer hover:text-amber-600 select-none"
                        onClick={() => handleSort('price')}
                      >
                        <span className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider text-gray-500">
                          Price <SortIcon k="price" />
                        </span>
                      </th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.map((d) => {
                      const isSelected = selectedDiamond?._id === d._id;
                      return (
                        <tr
                          key={d._id}
                          onClick={() => { onSelect(isSelected ? null : d); if (!isSelected) setOpen(false); }}
                          className={cn(
                            'cursor-pointer transition-colors',
                            isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'
                          )}
                        >
                          <td className="pl-4">
                            {isSelected && <Check size={13} className="text-amber-600" />}
                          </td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">{SHAPE_ICONS[d.shape] || '💎'}</span>
                              <span className="capitalize text-gray-700">{d.shape}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 font-medium text-charcoal">{d.caratWeight}ct</td>
                          <td className="px-3 py-3 text-gray-600">{d.cut}</td>
                          <td className="px-3 py-3 font-mono text-gray-600">{d.color}</td>
                          <td className="px-3 py-3 font-mono text-gray-600">{d.clarity}</td>
                          <td className="px-3 py-3">
                            {d.certificate?.lab && (
                              <span className="flex items-center gap-1 text-[10px] text-gold-600">
                                <Award size={10} /> {d.certificate.lab}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-charcoal">{formatPrice(d.price)}</td>
                          <td className="pr-4 py-3">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : d); if (!isSelected) setOpen(false); }}
                              className={cn(
                                'px-3 py-1.5 text-[10px] font-medium rounded border transition-colors whitespace-nowrap',
                                isSelected
                                  ? 'border-amber-400 bg-amber-500 text-white'
                                  : 'border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600'
                              )}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">{sorted.length} diamonds found</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pages }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPage(i + 1)}
                          className={cn('w-7 h-7 text-xs rounded transition-colors', page === i + 1 ? 'bg-charcoal text-white' : 'text-gray-500 hover:bg-gray-100')}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
