'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { diamondsApi } from '@/lib/api';
import { IDiamond } from '@/types';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, List, Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
// Shape-specific diamond photos — same as seeder so fallback looks consistent
const REAL_DIAMOND_PHOTOS: Record<string, string> = {
  round:    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&q=90',
  oval:     'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=600&fit=crop&q=90',
  princess: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&q=90',
  cushion:  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&q=90',
  emerald:  'https://images.unsplash.com/photo-1601121141418-728cf5bdbcae?w=600&h=600&fit=crop&q=90',
  pear:     'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop&q=90',
  radiant:  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&q=90',
  asscher:  'https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=600&h=600&fit=crop&q=90',
  marquise: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&q=90',
  heart:    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=600&fit=crop&q=90',
};

// ─── Shape SVG icons ──────────────────────────────────────────────────────────
const ShapeIcon = ({ shape, size = 28 }: { shape: string; size?: number }) => {
  const s = size, c = s / 2;
  const icons: Record<string, React.ReactNode> = {
    round:    <circle cx={c} cy={c} r={c * 0.82} stroke="currentColor" strokeWidth="1.5" fill="none" />,
    princess: <rect x={s*.12} y={s*.12} width={s*.76} height={s*.76} stroke="currentColor" strokeWidth="1.5" fill="none" />,
    oval:     <ellipse cx={c} cy={c} rx={c*.6} ry={c*.83} stroke="currentColor" strokeWidth="1.5" fill="none" />,
    cushion:  <rect x={s*.12} y={s*.12} width={s*.76} height={s*.76} rx="5" stroke="currentColor" strokeWidth="1.5" fill="none" />,
    emerald:  <rect x={s*.12} y={s*.2} width={s*.76} height={s*.6} rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />,
    pear:     <path d={`M${c},${s*.88} C${s*.08},${s*.7} ${s*.08},${s*.35} ${c},${s*.12} C${s*.92},${s*.35} ${s*.92},${s*.7} ${c},${s*.88}Z`} stroke="currentColor" strokeWidth="1.5" fill="none" />,
    marquise: <ellipse cx={c} cy={c} rx={c*.85} ry={c*.4} stroke="currentColor" strokeWidth="1.5" fill="none" />,
    radiant:  <rect x={s*.14} y={s*.18} width={s*.72} height={s*.64} rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />,
    asscher:  <><rect x={s*.14} y={s*.14} width={s*.72} height={s*.72} stroke="currentColor" strokeWidth="1.5" fill="none" /><rect x={s*.25} y={s*.25} width={s*.5} height={s*.5} stroke="currentColor" strokeWidth=".7" fill="none" /></>,
    heart:    <path d={`M${c},${s*.82} L${s*.1},${s*.38} A${s*.23},${s*.23},0,0,1,${c},${s*.32} A${s*.23},${s*.23},0,0,1,${s*.9},${s*.38}Z`} stroke="currentColor" strokeWidth="1.5" fill="none" />,
  };
  return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">{icons[shape.toLowerCase()] ?? icons['round']}</svg>;
};

// ─── Dual-handle range slider ─────────────────────────────────────────────────
function DualSlider({ min, max, step = 1, lo, hi, onChange, fmt = String }:
  { min: number; max: number; step?: number; lo: number; hi: number; onChange: (lo: number, hi: number) => void; fmt?: (v: number) => string }) {
  const pLo = ((lo - min) / (max - min)) * 100;
  const pHi = ((hi - min) / (max - min)) * 100;
  return (
    <div className="px-1">
      <div className="flex justify-between text-[11px] font-sans text-amber-700 font-medium mb-2">
        <span>{fmt(lo)}</span><span>{fmt(hi)}</span>
      </div>
      <div className="relative h-5">
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-amber-400 rounded" style={{ left: `${pLo}%`, right: `${100 - pHi}%` }} />
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={e => onChange(Math.min(+e.target.value, hi - step), hi)}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10" />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={e => onChange(lo, Math.max(+e.target.value, lo + step))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-20" />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-full shadow pointer-events-none" style={{ left: `calc(${pLo}% - 7px)` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-full shadow pointer-events-none" style={{ left: `calc(${pHi}% - 7px)` }} />
      </div>
    </div>
  );
}

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className={cn('px-2.5 py-1 text-[11px] font-sans border rounded transition-all',
    active ? 'bg-amber-500 border-amber-500 text-white font-medium' : 'border-gray-200 text-gray-600 hover:border-amber-300')}>
    {children}
  </button>
);

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between mb-3">
        <p className="text-[11px] font-sans font-semibold tracking-widest uppercase text-charcoal">{title}</p>
        {open ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

function DiamondCard({ d }: { d: IDiamond }) {
  return (
    <div className="bg-white border border-gray-100 group hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Real diamond photo */}
      <div className="relative aspect-square overflow-hidden bg-gray-900 group-hover:brightness-105 transition-all">
        <Image
          src={d.imageUrl || REAL_DIAMOND_PHOTOS[d.shape?.toLowerCase()] || REAL_DIAMOND_PHOTOS.round}
          alt={`${d.caratWeight}ct ${d.shape} diamond`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {d.certificate?.lab && (
          <div className={cn(
            'absolute top-2 left-2 text-[9px] font-sans font-bold px-1.5 py-0.5',
            d.certificate.lab === 'GIA' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
          )}>
            {d.certificate.lab}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-50 flex-1 flex flex-col">
        {/* Cert badge */}
        <div className="flex items-center justify-between mb-2">
          {d.certificate?.lab && (
            <span className={cn('text-[9px] font-sans font-bold px-1.5 py-0.5 rounded',
              d.certificate.lab === 'GIA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
            )}>
              {d.certificate.lab}
            </span>
          )}
          <span className="text-[9px] font-sans text-gray-400 capitalize">{d.shape}</span>
        </div>

        <p className="font-serif text-base font-light text-charcoal">{formatPrice(d.price)}</p>
        <p className="text-[11px] font-sans text-gray-500 mt-0.5">{d.caratWeight}ct · {d.cut} Cut</p>
        <p className="text-[11px] font-sans text-gray-400">Colour {d.color} · {d.clarity}</p>

        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-50">
          <Link href={`/diamonds/${d._id}`} className="text-[11px] font-sans font-medium text-charcoal hover:text-gold-600 transition-colors">
            View Details →
          </Link>
          <Link href={`/custom-ring?diamond=${d._id}`} className="text-[10px] font-sans text-gold-600 hover:underline">
            Use in Ring
          </Link>
        </div>
      </div>
    </div>
  );
}

function DiamondRow({ d, i }: { d: IDiamond; i: number }) {
  return (
    <div className={cn('grid items-center px-4 py-3 gap-3 text-sm font-sans hover:bg-champagne/40 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60')}
      style={{ gridTemplateColumns: '56px 1fr 72px 80px 64px 80px 96px 96px' }}>
      {/* Real diamond photo */}
      <div className="w-14 h-14 relative overflow-hidden bg-gray-900 shrink-0">
        <Image
          src={d.imageUrl || REAL_DIAMOND_PHOTOS[d.shape?.toLowerCase()] || REAL_DIAMOND_PHOTOS.round}
          alt=""
          fill
          className="object-cover"
        />
      </div>
      <div>
        <p className="text-charcoal font-medium capitalize">{d.shape}</p>
        {d.certificate?.lab && (
          <span className={cn('text-[9px] font-sans font-bold px-1 py-0.5 rounded',
            d.certificate.lab === 'GIA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
          )}>{d.certificate.lab}</span>
        )}
      </div>
      <span className="text-gray-700">{d.caratWeight}ct</span>
      <span className="text-gray-700">{d.cut}</span>
      <span className="text-gray-700">{d.color}</span>
      <span className="text-gray-700">{d.clarity}</span>
      <span className="font-semibold text-charcoal">{formatPrice(d.price)}</span>
      <div className="flex flex-col gap-1 text-right">
        <Link href={`/diamonds/${d._id}`} className="text-[11px] font-medium text-charcoal hover:text-gold-600 transition-colors">Details →</Link>
        <Link href={`/custom-ring?diamond=${d._id}`} className="text-[10px] text-gold-600 hover:underline">Use in Ring</Link>
      </div>
    </div>
  );
}

// ─── Filter constants ─────────────────────────────────────────────────────────
const SHAPES   = ['round','princess','oval','cushion','emerald','pear','marquise','radiant','asscher','heart'];
const COLOURS  = ['D','E','F','G','H','I','J','K'];
const CLARITY  = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2'];
const CUTS     = ['Excellent','Very Good','Good'];
const LABS     = ['GIA','IGI'];
const D_CARAT: [number,number] = [0.20, 2.00];
const D_PRICE: [number,number] = [100, 50000];

export default function DiamondSearchPage() {
  const [stoneType, setStoneType] = useState<'natural'|'lab'>('natural');
  const [shapes,    setShapes]    = useState<string[]>([]);
  const [colours,   setColours]   = useState<string[]>([]);
  const [clarities, setClarities] = useState<string[]>([]);
  const [cuts,      setCuts]      = useState<string[]>([]);
  const [labs,      setLabs]      = useState<string[]>([]);
  const [carat,     setCarat]     = useState<[number,number]>(D_CARAT);
  const [priceR,    setPriceR]    = useState<[number,number]>(D_PRICE);
  const [search,    setSearch]    = useState('');
  const [view,      setView]      = useState<'grid'|'list'>('grid');
  const [sort,      setSort]      = useState('price-asc');

  const tog = useCallback((arr: string[], set: (v: string[]) => void, v: string) => {
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  }, []);

  const hasFilters = shapes.length || colours.length || clarities.length || cuts.length || labs.length || search ||
    carat[0] !== D_CARAT[0] || carat[1] !== D_CARAT[1] || priceR[0] !== D_PRICE[0] || priceR[1] !== D_PRICE[1];

  const reset = () => { setShapes([]); setColours([]); setClarities([]); setCuts([]); setLabs([]);
    setCarat(D_CARAT); setPriceR(D_PRICE); setSearch(''); };

  const params: Record<string,string|number> = {
    limit: 60, sort,
    labGrown: stoneType === 'lab' ? 'true' : 'false',
    minCarat: carat[0], maxCarat: carat[1],
    minPrice: priceR[0], maxPrice: priceR[1],
    ...(shapes[0]    ? { shape:   shapes[0]    } : {}),
    ...(colours[0]   ? { color:   colours[0]   } : {}),
    ...(clarities[0] ? { clarity: clarities[0] } : {}),
    ...(cuts[0]      ? { cut:     cuts[0]      } : {}),
    ...(labs[0]      ? { lab:     labs[0]      } : {}),
  };

  const { data, isLoading } = useQuery({ queryKey: ['diamonds', params], queryFn: () => diamondsApi.getAll(params) });

  let diamonds: IDiamond[] = data?.data?.diamonds || [];
  if (shapes.length > 1)    diamonds = diamonds.filter(d => shapes.includes(d.shape?.toLowerCase()));
  if (colours.length > 1)   diamonds = diamonds.filter(d => colours.includes(d.color));
  if (clarities.length > 1) diamonds = diamonds.filter(d => clarities.includes(d.clarity));
  if (cuts.length > 1)      diamonds = diamonds.filter(d => cuts.some(c => c.toLowerCase() === d.cut?.toLowerCase()));
  if (labs.length > 1)      diamonds = diamonds.filter(d => labs.includes(d.certificate?.lab?.toUpperCase() ?? ''));
  if (search) { const q = search.toLowerCase(); diamonds = diamonds.filter(d => d.sku?.toLowerCase().includes(q) || d.certificate?.number?.toLowerCase().includes(q)); }

  return (
    <div className="bg-ivory min-h-screen">
      <div className="bg-charcoal py-8">
        <div className="page-container text-center">
          <p className="section-subtitle text-gold-400 mb-2">GIA &amp; IGI Certified</p>
          <h1 className="font-serif text-4xl font-light text-white">Choose Your Diamond</h1>
          <div className="gold-divider mt-3" />
        </div>
      </div>

      <div className="page-container py-8">
        <div className="flex gap-8 items-start">

          {/* ── Sidebar ── */}
          <aside className="w-72 shrink-0 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="bg-white border border-gray-100 p-5 shadow-sm">
              {/* Stone type */}
              <div className="flex rounded border border-gray-200 overflow-hidden mb-5">
                {(['natural','lab'] as const).map(t => (
                  <button key={t} onClick={() => setStoneType(t)}
                    className={cn('flex-1 py-2 text-[11px] font-sans font-medium transition-all',
                      stoneType === t ? 'bg-charcoal text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
                    {t === 'lab' ? 'Lab Grown Diamond' : 'Natural Diamond'}
                  </button>
                ))}
              </div>

              <FilterBlock title="Shape">
                <div className="grid grid-cols-5 gap-1.5">
                  {SHAPES.map(s => (
                    <button key={s} onClick={() => tog(shapes, setShapes, s)} title={s.charAt(0).toUpperCase()+s.slice(1)}
                      className={cn('flex flex-col items-center gap-1 py-1.5 border rounded transition-all',
                        shapes.includes(s) ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-100 text-gray-400 hover:border-gray-300')}>
                      <ShapeIcon shape={s} size={22} />
                      <span className="text-[8px] font-sans capitalize">{s.slice(0,3)}</span>
                    </button>
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock title="Carat">
                <DualSlider min={0.20} max={5.00} step={0.05} lo={carat[0]} hi={carat[1]}
                  onChange={(a,b) => setCarat([a,b])} fmt={v => `${v.toFixed(2)} ct`} />
              </FilterBlock>

              <FilterBlock title="Clarity">
                <div className="flex flex-wrap gap-1">{CLARITY.map(c => <Pill key={c} active={clarities.includes(c)} onClick={() => tog(clarities, setClarities, c)}>{c}</Pill>)}</div>
              </FilterBlock>

              <FilterBlock title="Colour">
                <div className="flex flex-wrap gap-1">
                  {COLOURS.map(c => (
                    <button key={c} onClick={() => tog(colours, setColours, c)}
                      className={cn('w-8 h-8 text-xs font-sans border rounded transition-all',
                        colours.includes(c) ? 'bg-amber-500 border-amber-500 text-white font-semibold' : 'border-gray-200 text-gray-600 hover:border-amber-300')}>
                      {c}
                    </button>
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock title="Certificate">
                <div className="flex gap-2">{LABS.map(l => <Pill key={l} active={labs.includes(l)} onClick={() => tog(labs, setLabs, l)}>{l}</Pill>)}</div>
              </FilterBlock>

              <FilterBlock title="Cut">
                <div className="flex flex-wrap gap-1">{CUTS.map(c => <Pill key={c} active={cuts.includes(c)} onClick={() => tog(cuts, setCuts, c)}>{c}</Pill>)}</div>
              </FilterBlock>

              <FilterBlock title="Price">
                <DualSlider min={100} max={100000} step={100} lo={priceR[0]} hi={priceR[1]}
                  onChange={(a,b) => setPriceR([a,b])} fmt={v => `£${v.toLocaleString('en-GB')}`} />
              </FilterBlock>

              {hasFilters && (
                <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-sans border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors rounded mt-1">
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-serif text-xl text-charcoal">Choose Your Diamond</h2>
                <p className="text-xs font-sans text-gray-400 mt-0.5">
                  {isLoading ? 'Searching…' : `${diamonds.length.toLocaleString()} diamonds found matching your criteria`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code"
                    className="pl-7 pr-3 py-1.5 text-xs font-sans border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-300 w-36" />
                </div>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="text-xs font-sans border border-gray-200 rounded px-2 py-1.5 focus:outline-none">
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="caratWeight-desc">Carat ↓</option>
                  <option value="caratWeight-asc">Carat ↑</option>
                </select>
                <div className="flex border border-gray-200 rounded overflow-hidden">
                  {(['grid','list'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)} className={cn('p-1.5 transition-colors', view === v ? 'bg-charcoal text-white' : 'text-gray-400 hover:bg-gray-50')}>
                      {v === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({length:9}).map((_,i) => (
                  <div key={i} className="bg-white border border-gray-100 animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2"><div className="h-4 bg-gray-200 rounded w-16" /><div className="h-3 bg-gray-200 rounded w-24" /></div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && diamonds.length === 0 && (
              <div className="text-center py-20 bg-white border border-gray-100">
                <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" viewBox="0 0 64 64" fill="none"><polygon points="32,4 58,20 50,54 14,54 6,20" stroke="currentColor" strokeWidth="2" /></svg>
                <p className="font-sans text-gray-500 mb-4">No diamonds found matching your filters</p>
                <button onClick={reset} className="btn-gold text-xs">Reset Filters</button>
              </div>
            )}

            {!isLoading && view === 'grid' && diamonds.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {diamonds.map(d => <DiamondCard key={d._id} d={d} />)}
              </div>
            )}

            {!isLoading && view === 'list' && diamonds.length > 0 && (
              <div className="border border-gray-100 overflow-x-auto">
                <div className="bg-charcoal text-white text-[10px] font-sans font-semibold uppercase tracking-wide px-4 py-2 min-w-[640px]"
                  style={{ display:'grid', gridTemplateColumns:'52px 1fr 72px 80px 64px 80px 96px 88px', gap:'12px' }}>
                  <span /><span>Shape</span><span>Carat</span><span>Cut</span><span>Colour</span><span>Clarity</span><span>Price</span><span />
                </div>
                <div className="min-w-[640px]">{diamonds.map((d,i) => <DiamondRow key={d._id} d={d} i={i} />)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
