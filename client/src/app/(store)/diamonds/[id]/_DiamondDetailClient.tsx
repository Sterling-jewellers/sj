'use client';

import { useQuery } from '@tanstack/react-query';
import { diamondsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ShoppingBag, ChevronRight, Calendar } from 'lucide-react';
import { IDiamond } from '@/types';

// ─── Data tables ──────────────────────────────────────────────────────────────
const colorDesc: Record<string, string> = {
  D: 'Exceptional White +', E: 'Exceptional White', F: 'Rare White +',
  G: 'Rare White', H: 'White', I: 'Slightly Tinted White', J: 'Slightly Tinted White',
  K: 'Tinted White',
};
const clarityDesc: Record<string, string> = {
  FL: 'Flawless', IF: 'Internally Flawless',
  VVS1: 'Very Very Slightly Included 1', VVS2: 'Very Very Slightly Included 2',
  VS1: 'Very Slightly Included 1', VS2: 'Very Slightly Included 2',
  SI1: 'Slightly Included 1', SI2: 'Slightly Included 2', I1: 'Included 1',
};
const colorOrder = ['D','E','F','G','H','I','J','K'];
const clarityOrder = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1'];
const cutOrder = ['Poor','Fair','Good','Very Good','Excellent','Ideal'];

// ─── SVG: top-view diamond diagram ───────────────────────────────────────────
function DiamondTopView({ width, length }: { width: number; length: number }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-[140px]" fill="none">
      <ellipse cx="60" cy="60" rx="48" ry="48" stroke="#999" strokeWidth="1" />
      <ellipse cx="60" cy="60" rx="30" ry="30" stroke="#999" strokeWidth="1" strokeDasharray="3 2" />
      <ellipse cx="60" cy="60" rx="12" ry="12" stroke="#bbb" strokeWidth="1" />
      {[0,45,90,135,180,225,270,315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={60 + 12 * Math.cos(rad)} y1={60 + 12 * Math.sin(rad)}
            x2={60 + 48 * Math.cos(rad)} y2={60 + 48 * Math.sin(rad)}
            stroke="#ccc" strokeWidth="0.8" />
        );
      })}
      {/* dimension labels */}
      <line x1="12" y1="108" x2="108" y2="108" stroke="#aaa" strokeWidth="0.6" />
      <text x="60" y="116" textAnchor="middle" fontSize="8" fill="#888">{width ? `${width}mm` : 'width'}</text>
      <line x1="108" y1="12" x2="108" y2="108" stroke="#aaa" strokeWidth="0.6" />
      <text x="116" y="64" textAnchor="middle" fontSize="8" fill="#888" transform="rotate(90 116 64)">{length ? `${length}mm` : 'length'}</text>
    </svg>
  );
}

// ─── SVG: side cross-section diagram ─────────────────────────────────────────
function DiamondSideView({ depth, tablePercent }: { depth: number; tablePercent: number }) {
  const tableW = Math.min(80, Math.max(40, (tablePercent || 60) * 0.8));
  return (
    <svg viewBox="0 0 120 80" className="w-full max-w-[140px]" fill="none">
      {/* crown */}
      <polygon points={`${(120 - tableW) / 2},40 60,8 ${(120 + tableW) / 2},40`} stroke="#999" strokeWidth="1" fill="rgba(200,200,220,0.15)" />
      {/* table */}
      <line x1={(120 - tableW) / 2} y1="40" x2={(120 + tableW) / 2} y2="40" stroke="#888" strokeWidth="1.5" />
      {/* pavilion */}
      <polygon points={`${(120 - tableW) / 2},40 60,72 ${(120 + tableW) / 2},40`} stroke="#999" strokeWidth="1" fill="rgba(200,200,220,0.15)" />
      {/* depth label */}
      <line x1="104" y1="8" x2="104" y2="72" stroke="#aaa" strokeWidth="0.6" />
      <text x="112" y="42" textAnchor="middle" fontSize="7" fill="#888">{depth ? `${depth}mm` : 'depth'}</text>
      {/* table label */}
      <text x="60" y="36" textAnchor="middle" fontSize="7" fill="#888">Table</text>
    </svg>
  );
}

// ─── SVG: cut cross-section for 4C's cut scale ───────────────────────────────
function CutDiagramSvg({ grade, active }: { grade: string; active: boolean }) {
  // Each grade has different proportions — Excellent is ideal, Poor is very shallow/deep
  const configs: Record<string, { tableW: number; crownH: number; pavH: number }> = {
    Poor:       { tableW: 35, crownH: 6,  pavH: 36 }, // deep pavilion
    Fair:       { tableW: 42, crownH: 10, pavH: 30 },
    Good:       { tableW: 52, crownH: 14, pavH: 26 },
    'Very Good':{ tableW: 60, crownH: 16, pavH: 24 },
    Excellent:  { tableW: 64, crownH: 17, pavH: 22 },
    Ideal:      { tableW: 64, crownH: 17, pavH: 22 },
  };
  const c = configs[grade] || configs['Good'];
  const cx = 40;
  const topY = 8;
  const midY = topY + c.crownH;
  const botY = midY + c.pavH;
  const hw = c.tableW / 2;
  const outerHw = 38;
  return (
    <svg viewBox="0 0 80 60" className="w-14 h-14" fill="none">
      <polygon
        points={`${cx - hw},${midY} ${cx},${topY} ${cx + hw},${midY}`}
        stroke={active ? '#c9a96e' : '#999'} strokeWidth={active ? '1.5' : '1'}
        fill={active ? 'rgba(201,169,110,0.15)' : 'rgba(200,200,220,0.12)'} />
      <line x1={cx - hw} y1={midY} x2={cx + hw} y2={midY}
        stroke={active ? '#c9a96e' : '#aaa'} strokeWidth={active ? '1.5' : '1'} />
      <polygon
        points={`${cx - outerHw},${midY} ${cx},${botY} ${cx + outerHw},${midY}`}
        stroke={active ? '#c9a96e' : '#999'} strokeWidth={active ? '1.5' : '1'}
        fill={active ? 'rgba(201,169,110,0.1)' : 'rgba(200,200,220,0.08)'} />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DiamondDetailClient({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['diamond', id],
    queryFn: () => diamondsApi.getById(id),
  });
  const d: IDiamond | undefined = data?.data;

  if (isLoading) return <DiamondSkeleton />;
  if (error || !d) return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="text-center">
        <p className="font-sans text-gray-500 mb-4">Diamond not found.</p>
        <Link href="/diamonds" className="btn-gold text-xs">Browse Diamonds</Link>
      </div>
    </div>
  );

  const shapeName = d.shape ? d.shape.charAt(0).toUpperCase() + d.shape.slice(1) : 'Round';
  const colorIdx  = colorOrder.indexOf(d.color);
  const clarIdx   = clarityOrder.indexOf(d.clarity);
  const cutIdx    = cutOrder.findIndex(c => c.toLowerCase() === d.cut?.toLowerCase());

  return (
    <div className="bg-ivory min-h-screen">
      {/* Breadcrumb */}
      <div className="page-container py-4 border-b border-gray-100">
        <nav className="flex items-center gap-1.5 text-xs font-sans text-gray-400">
          <Link href="/" className="hover:text-charcoal">Home</Link>
          <ChevronRight size={11} />
          <Link href="/diamonds" className="hover:text-charcoal">Diamonds</Link>
          <ChevronRight size={11} />
          <span className="text-charcoal">{d.caratWeight}ct {shapeName}</span>
        </nav>
      </div>

      {/* ── TOP: 3-column layout ── */}
      <div className="page-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_360px] gap-8 items-start">

          {/* ── COL 1: Technical diagrams ── */}
          <div className="hidden lg:flex flex-col items-center gap-6">
            <div className="bg-white border border-gray-100 p-5 w-full">
              <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-3">Top View</p>
              <div className="flex justify-center">
                <DiamondTopView width={d.measurements?.width} length={d.measurements?.length} />
              </div>
              {d.measurements?.tablePercent && (
                <p className="text-center text-xs text-gray-500 mt-2">Table: {d.measurements.tablePercent}%</p>
              )}
            </div>
            <div className="bg-white border border-gray-100 p-5 w-full">
              <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-3">Side Profile</p>
              <div className="flex justify-center">
                <DiamondSideView depth={d.measurements?.depth} tablePercent={d.measurements?.tablePercent} />
              </div>
              {d.measurements && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  {d.measurements.length} × {d.measurements.width} × {d.measurements.depth} mm
                </p>
              )}
            </div>
            {d.measurements?.depthPercent && (
              <div className="bg-white border border-gray-100 p-4 w-full text-center">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-1">Depth %</p>
                <p className="font-serif text-2xl text-charcoal">{d.measurements.depthPercent}%</p>
              </div>
            )}
          </div>

          {/* ── COL 2: Photo ── */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-white border border-gray-100 overflow-hidden">
              {d.imageUrl ? (
                <Image src={d.imageUrl} alt={`${d.caratWeight}ct ${shapeName} diamond`} fill className="object-contain p-8" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-300">
                  <svg viewBox="0 0 80 80" className="w-24 h-24" fill="none">
                    <polygon points="40,4 74,28 62,70 18,70 6,28" stroke="#d1d5db" strokeWidth="2" fill="rgba(209,213,219,0.2)" />
                    <polygon points="40,4 74,28 62,70 18,70 6,28" stroke="#d1d5db" strokeWidth="1" fill="none"
                      transform="scale(0.55) translate(36,36)" />
                  </svg>
                  <p className="text-sm font-sans text-gray-400">{shapeName} Diamond</p>
                  <p className="text-xs font-sans text-gray-300">Image preview not available</p>
                </div>
              )}
              {d.certificate?.lab && (
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-gray-100 px-2.5 py-1.5 text-[11px] font-sans font-semibold text-charcoal">
                  {d.certificate.lab} Certified
                </div>
              )}
            </div>
            {/* Loupe360 interactive viewer (from Nivoda) or video */}
            {(d.loupe360 || d.videoUrl) && (
              <div className="bg-white border border-gray-100 overflow-hidden">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                  {d.loupe360 ? 'Interactive 360° View' : '360° Video'}
                </p>
                <div className="aspect-square">
                  <iframe
                    src={d.loupe360 || d.videoUrl}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    loading="lazy"
                  />
                </div>
                {d.loupe360 && (
                  <p className="text-[9px] font-sans text-gray-400 text-center py-1.5 border-t border-gray-50">
                    Powered by Loupe360 · Drag to rotate
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── COL 3: Details + CTA ── */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-sans text-gray-400 uppercase tracking-widest mb-1">DIAMOND DETAILS</p>
              <h1 className="font-serif text-2xl font-light text-charcoal">{d.caratWeight}ct, {shapeName}</h1>
              <p className="text-sm font-sans text-gray-500 mt-0.5">Naturally Mined Diamond</p>
              <p className="text-xs font-sans text-gray-400 mt-1">
                {[d.cut, d.color, d.clarity, d.polish && `${d.polish} Polish`, d.symmetry && `${d.symmetry} Sym`, d.fluorescence && `${d.fluorescence} Fluor`]
                  .filter(Boolean).join(' · ')}
              </p>
            </div>

            {/* Price */}
            <div className="py-4 border-t border-b border-gray-100">
              <p className="font-serif text-3xl font-light text-charcoal">{formatPrice(d.price)}</p>
              <p className="text-[11px] font-sans text-gray-400 mt-0.5">Includes VAT · Free insured delivery</p>
            </div>

            {/* CTAs */}
            <Link href="/custom-ring"
              className="flex items-center justify-center gap-2 w-full bg-gold-500 hover:bg-gold-600 text-white py-3.5 font-sans font-medium text-sm tracking-widest uppercase transition-colors">
              <ShoppingBag size={15} />
              Add to a Ring
            </Link>
            <Link href="/contact"
              className="flex items-center justify-center gap-2 w-full bg-charcoal hover:bg-gray-800 text-white py-3 font-sans font-medium text-sm tracking-widest uppercase transition-colors">
              <Calendar size={15} />
              Book Appointment
            </Link>

            {/* Diamond Details table */}
            <div className="bg-white border border-gray-100">
              <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 px-4 py-3 border-b border-gray-50">Diamond Details</p>
              <div className="grid grid-cols-2 divide-x divide-gray-50">
                <div className="divide-y divide-gray-50">
                  {[
                    ['Shape', shapeName],
                    ['Origin', 'Natural'],
                    ['Carat Weight', `${d.caratWeight} ct`],
                    ['Cut', d.cut || '—'],
                    ['Colour', d.color || '—'],
                    ['Clarity', d.clarity || '—'],
                    ['Fluorescence', d.fluorescence || 'None'],
                    ['Graining', '—'],
                    ['Face Up', '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="px-3 py-2">
                      <p className="text-[10px] font-sans text-gray-400">{label}</p>
                      <p className="text-xs font-sans font-medium text-charcoal">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    ['Certificate No.', d.certificate?.number || '—'],
                    ['Measurements', d.measurements ? `${d.measurements.length}×${d.measurements.width}×${d.measurements.depth}mm` : '—'],
                    ['Polish', d.polish || '—'],
                    ['Symmetry', d.symmetry || '—'],
                    ['Depth %', d.measurements?.depthPercent ? `${d.measurements.depthPercent}%` : '—'],
                    ['Table %', d.measurements?.tablePercent ? `${d.measurements.tablePercent}%` : '—'],
                    ['Lab', d.certificate?.lab || '—'],
                    ['SKU', d.sku || '—'],
                    ['Laser Inscription', d.certificate?.number ? `Yes — ${d.certificate.lab}` : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="px-3 py-2">
                      <p className="text-[10px] font-sans text-gray-400">{label}</p>
                      <p className="text-xs font-sans font-medium text-charcoal">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {d.certificate?.pdfUrl && (
              <a href={d.certificate.pdfUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-sans text-gold-600 hover:underline">
                <ExternalLink size={12} />
                View {d.certificate.lab} Certificate #{d.certificate.number}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM: The Four C's ── */}
      <div className="border-t border-gray-200">
        <div className="page-container py-14">
          <div className="text-center mb-12">
            <p className="section-subtitle mb-2">Education</p>
            <h2 className="font-serif text-3xl font-light text-charcoal">The Four C&apos;s of Your Diamond</h2>
            <div className="gold-divider mt-4" />
          </div>

          <div className="space-y-20">

            {/* ── 1. CARAT WEIGHT ── */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="section-subtitle mb-2">Carat Weight</p>
                <h3 className="font-serif text-2xl font-light text-charcoal mb-4">Carat Weight: {d.caratWeight} ct</h3>
                <p className="text-sm font-sans text-gray-600 leading-relaxed mb-3">
                  A diamond's carat weight is a measurement of how much a diamond weighs. A metric carat is defined as 200 milligrams (0.2g). The weight of your diamond can be To 0.05 grams. The weight of your diamond can be To roughly proportional by its size, so a 1.00ct round-cut diamond should be roughly 6.5mm in diameter.
                </p>
                <p className="text-sm font-sans text-gray-600 leading-relaxed">
                  Remember: Two diamonds can appear differently depending on how the diamond is cut. Take a look at your diamond's measurements for a better idea of how it will look when worn.
                </p>
              </div>
              <div className="bg-white border border-gray-100 p-8">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-6 text-center">Size Comparison</p>
                <div className="flex items-end justify-center gap-4">
                  {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0].map((ct) => {
                    const px = Math.round(8 + ct * 14);
                    const isActive = Math.abs(d.caratWeight - ct) < 0.15;
                    return (
                      <div key={ct} className="flex flex-col items-center gap-2">
                        <div
                          className={`rounded-full border-2 transition-all ${isActive ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
                          style={{ width: px, height: px }}
                        />
                        <span className={`text-[9px] font-sans ${isActive ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>{ct}ct</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── 2. COLOUR ── */}
            <div className="grid md:grid-cols-2 gap-12 items-center bg-white p-8 -mx-4">
              <div className="bg-white border border-gray-100 p-6">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-6 text-center">Colour Scale</p>
                <div className="flex justify-center gap-1 mb-4">
                  {colorOrder.map((c, idx) => {
                    const isActive = c === d.color;
                    // Simulate increasing yellow tint
                    const yellowness = idx * 12;
                    const fillColor = `rgb(${255}, ${255 - yellowness * 0.3}, ${255 - yellowness * 0.8})`;
                    return (
                      <div key={c} className="flex flex-col items-center gap-1.5">
                        <svg viewBox="0 0 28 28" className="w-7 h-7">
                          <polygon points="14,2 26,10 22,24 6,24 2,10"
                            fill={fillColor} stroke={isActive ? '#c9a96e' : '#d1d5db'} strokeWidth={isActive ? '2.5' : '1'} />
                        </svg>
                        <span className={`text-[10px] font-sans font-medium ${isActive ? 'text-amber-600' : 'text-gray-500'}`}>{c}</span>
                        {isActive && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[9px] font-sans text-gray-400 uppercase tracking-wider">Colourless</span>
                  <span className="text-[9px] font-sans text-gray-400 uppercase tracking-wider">Near Colourless</span>
                  <span className="text-[9px] font-sans text-gray-400 uppercase tracking-wider">Faint</span>
                </div>
              </div>
              <div>
                <p className="section-subtitle mb-2">Colour</p>
                <h3 className="font-serif text-2xl font-light text-charcoal mb-4">Color: {d.color}</h3>
                <p className="text-sm font-sans text-gray-600 leading-relaxed mb-3">
                  Colour {d.color} — {colorDesc[d.color] || 'High quality colour'}.
                  {colorIdx <= 2 && ' D–F colour diamonds are the finest and rarest — completely colourless and valued for their exceptional purity.'}
                  {colorIdx >= 3 && colorIdx <= 6 && ' G–J colour diamonds appear virtually colourless to the naked eye, offering excellent value without compromising visual quality.'}
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded px-4 py-3">
                  <p className="text-xs font-sans font-semibold text-amber-800">{d.color} — {colorDesc[d.color]}</p>
                  <p className="text-xs font-sans text-amber-700 mt-0.5">Rank {colorIdx + 1} of {colorOrder.length} on the colour scale</p>
                </div>
              </div>
            </div>

            {/* ── 3. CUT ── */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="section-subtitle mb-2">Cut</p>
                <h3 className="font-serif text-2xl font-light text-charcoal mb-4">Cut: {d.cut}</h3>
                <p className="text-sm font-sans text-gray-600 leading-relaxed mb-3">
                  Cut is the most important factor in determining a diamond's beauty and value. Excellent Cut is the highest standard — it reflects light directly through the crown, maximising brilliance and fire. A well-cut diamond will appear larger than its actual carat weight.
                </p>
                {(d.cut === 'Excellent' || d.cut === 'Ideal') && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded px-4 py-3">
                    <p className="text-xs font-sans font-semibold text-emerald-800">Top-tier cut grade</p>
                    <p className="text-xs font-sans text-emerald-700 mt-0.5">Only the top 3% of all diamonds achieve Excellent cut</p>
                  </div>
                )}
              </div>
              <div className="bg-white border border-gray-100 p-6">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-6 text-center">Cut Scale</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  {['Poor','Fair','Good','Very Good','Excellent'].map((grade) => {
                    const isActive = grade.toLowerCase() === d.cut?.toLowerCase() || (grade === 'Excellent' && d.cut === 'Ideal');
                    return (
                      <div key={grade} className={`flex flex-col items-center gap-2 p-2 rounded transition-all ${isActive ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}>
                        <CutDiagramSvg grade={grade} active={isActive} />
                        <span className={`text-[9px] font-sans font-medium uppercase tracking-wide ${isActive ? 'text-amber-600' : 'text-gray-400'}`}>{grade}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── 4. CLARITY ── */}
            <div className="grid md:grid-cols-2 gap-12 items-center bg-white p-8 -mx-4">
              <div className="bg-white border border-gray-100 p-6">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-5 text-center">Clarity Scale</p>
                <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                  {clarityOrder.map((c, idx) => {
                    const isActive = c === d.clarity;
                    return (
                      <div key={c}
                        className={`px-2.5 py-1.5 text-[11px] font-sans font-medium border transition-all rounded-sm ${
                          isActive ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-gray-500'}`}>
                        {c}
                      </div>
                    );
                  })}
                </div>
                {/* Inclusion dot diagram */}
                <div className="flex justify-center gap-3">
                  {clarityOrder.slice(0, 7).map((c, idx) => {
                    const isActive = c === d.clarity;
                    const dots = Math.max(0, idx - 1);
                    return (
                      <div key={c} className={`flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isActive ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                          {dots > 0 && <div className={`w-${Math.min(dots,3)} h-${Math.min(dots,3)} rounded-full bg-gray-400`} style={{ width: dots * 2, height: dots * 2 }} />}
                        </div>
                        <span className="text-[8px] font-sans text-gray-400">{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="section-subtitle mb-2">Clarity</p>
                <h3 className="font-serif text-2xl font-light text-charcoal mb-4">Clarity: {d.clarity}</h3>
                <p className="text-sm font-sans text-gray-600 leading-relaxed mb-3">
                  {clarityDesc[d.clarity] || d.clarity} — diamond clarity refers to the absence of internal inclusions or external blemishes.
                  {clarIdx <= 1 && ' FL and IF diamonds are extraordinarily rare — essentially perfect under 10× magnification.'}
                  {clarIdx >= 2 && clarIdx <= 3 && ' VVS diamonds have inclusions so slight they are difficult to see even under 10× magnification.'}
                  {clarIdx >= 4 && clarIdx <= 5 && ' VS diamonds have minor inclusions not typically visible to the naked eye.'}
                  {clarIdx >= 6 && clarIdx <= 7 && ' SI diamonds have inclusions that are noticeable under magnification but typically eye-clean.'}
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded px-4 py-3">
                  <p className="text-xs font-sans font-semibold text-amber-800">{d.clarity} — {clarityDesc[d.clarity] || d.clarity}</p>
                  <p className="text-xs font-sans text-amber-700 mt-0.5">Grade {clarIdx + 1} of {clarityOrder.length} on the clarity scale</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom CTA strip ── */}
      <div className="bg-charcoal py-12 mt-16">
        <div className="page-container text-center">
          <h2 className="font-serif text-2xl font-light text-white mb-2">Ready to build your ring?</h2>
          <p className="text-sm font-sans text-gray-300 mb-6">Pair this diamond with one of our hand-crafted ring settings</p>
          <Link href="/custom-ring" className="btn-gold inline-flex items-center gap-2">
            <ShoppingBag size={15} />
            Choose a Setting for This Diamond
          </Link>
        </div>
      </div>
    </div>
  );
}

function DiamondSkeleton() {
  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_360px] gap-8">
          <div className="hidden lg:block space-y-4">
            <div className="h-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-48 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="aspect-square bg-gray-200 animate-pulse rounded" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
            <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
