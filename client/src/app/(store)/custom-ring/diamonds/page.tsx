'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Check, ChevronRight, X, RotateCcw, Play,
  LayoutGrid, List, ExternalLink, Info,
} from 'lucide-react';
import { diamondsApi } from '@/lib/api';
import { IDiamond } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useRingBuilder } from '@/store/ringBuilderStore';
import BuilderHeader from '@/components/ring-builder/BuilderHeader';
import { cn } from '@/lib/utils';

// ── SVG Diamond Illustrations ─────────────────────────────────────────────────
// Renders a realistic faceted diamond illustration for each shape.
// Used as fallback when no Nivoda imageUrl is available.
function DiamondIllustration({ shape, size = 200 }: { shape: string; size?: number }) {
  const s = shape?.toLowerCase() || 'round';
  const id = `dg-${s}-${size}`;
  const C = size / 2, R = size * 0.44;

  const grad = (
    <defs>
      <radialGradient id={id} cx="38%" cy="30%" r="72%">
        <stop offset="0%"   stopColor="#ffffff" />
        <stop offset="35%"  stopColor="#eaf4ff" />
        <stop offset="75%"  stopColor="#b8d8f0" />
        <stop offset="100%" stopColor="#7aaed0" />
      </radialGradient>
      <radialGradient id={`${id}t`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#d0ebfa" stopOpacity="0.5" />
      </radialGradient>
    </defs>
  );

  const fill = `url(#${id})`;
  const tableFill = `url(#${id}t)`;
  const stroke = "#5a90b8";
  const facet  = "#82b4d0";
  const sw     = size * 0.008;

  const radPts = (n: number, r: number, offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((i * 360) / n + offset) * Math.PI / 180;
      return [C + r * Math.cos(a), C + r * Math.sin(a)] as [number, number];
    });

  const poly = (pts: [number, number][]) =>
    <polygon points={pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
      fill={tableFill} stroke={facet} strokeWidth={sw * 0.7} />;

  const highlight = (
    <>
      <ellipse cx={C * 0.80} cy={C * 0.72} rx={R * 0.22} ry={R * 0.12}
        fill="white" opacity="0.55" transform={`rotate(-38 ${C * 0.80} ${C * 0.72})`} />
      <ellipse cx={C * 0.75} cy={C * 0.67} rx={R * 0.10} ry={R * 0.055}
        fill="white" opacity="0.38" transform={`rotate(-38 ${C * 0.75} ${C * 0.67})`} />
    </>
  );

  if (s === 'round') {
    const outer = radPts(8, R, -90);
    const mid   = radPts(8, R, -67.5);
    const table = radPts(8, R * 0.42, -90);
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <circle cx={C} cy={C} r={R} fill={fill} stroke={stroke} strokeWidth={sw} />
        {outer.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
        {mid.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.45} opacity="0.6" />)}
        {poly(table)}
        {highlight}
      </svg>
    );
  }

  if (s === 'oval') {
    const rx = R * 0.65, ry = R;
    const outerPts = Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45 - 90) * Math.PI / 180;
      return [C + rx * Math.cos(a), C + ry * Math.sin(a)] as [number, number];
    });
    const tablePts = Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45 - 90) * Math.PI / 180;
      return [C + rx * 0.42 * Math.cos(a), C + ry * 0.42 * Math.sin(a)] as [number, number];
    });
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <ellipse cx={C} cy={C} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
        {outerPts.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
        {poly(tablePts)}
        {highlight}
      </svg>
    );
  }

  if (s === 'princess') {
    const h = R * 1.88, x0 = C - h / 2, y0 = C - h / 2;
    const corners: [number, number][] = [[x0,y0],[x0+h,y0],[x0+h,y0+h],[x0,y0+h]];
    const ti = h * 0.3;
    const table: [number, number][] = [[x0+ti,y0+ti],[x0+h-ti,y0+ti],[x0+h-ti,y0+h-ti],[x0+ti,y0+h-ti]];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <rect x={x0} y={y0} width={h} height={h} fill={fill} stroke={stroke} strokeWidth={sw} />
        {corners.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
        {poly(table)}
        <line x1={x0+ti} y1={y0} x2={x0+ti} y2={y0+h} stroke={facet} strokeWidth={sw * 0.45} opacity="0.5" />
        <line x1={x0+h-ti} y1={y0} x2={x0+h-ti} y2={y0+h} stroke={facet} strokeWidth={sw * 0.45} opacity="0.5" />
        <line x1={x0} y1={y0+ti} x2={x0+h} y2={y0+ti} stroke={facet} strokeWidth={sw * 0.45} opacity="0.5" />
        <line x1={x0} y1={y0+h-ti} x2={x0+h} y2={y0+h-ti} stroke={facet} strokeWidth={sw * 0.45} opacity="0.5" />
        {highlight}
      </svg>
    );
  }

  if (s === 'cushion') {
    const h = R * 1.88, x0 = C - h / 2, y0 = C - h / 2, cr = h * 0.2;
    const corners: [number, number][] = [[x0,y0],[x0+h,y0],[x0+h,y0+h],[x0,y0+h]];
    const ti = h * 0.3;
    const table: [number, number][] = [[x0+ti,y0+ti],[x0+h-ti,y0+ti],[x0+h-ti,y0+h-ti],[x0+ti,y0+h-ti]];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <rect x={x0} y={y0} width={h} height={h} rx={cr} fill={fill} stroke={stroke} strokeWidth={sw} />
        {corners.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
        {poly(table)}
        {highlight}
      </svg>
    );
  }

  if (s === 'emerald') {
    const w = R * 1.5, h = R * 2.0, x0 = C - w / 2, y0 = C - h / 2, cut = w * 0.12;
    const outline: [number, number][] = [
      [x0+cut,y0],[x0+w-cut,y0],[x0+w,y0+cut],
      [x0+w,y0+h-cut],[x0+w-cut,y0+h],[x0+cut,y0+h],[x0,y0+h-cut],[x0,y0+cut]
    ];
    const steps = [0.2, 0.35, 0.5];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <polygon points={outline.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} />
        {steps.map((t, i) => (
          <rect key={i} x={x0+w*t} y={y0+h*t} width={w*(1-t*2)} height={h*(1-t*2)}
            fill="none" stroke={facet} strokeWidth={sw * (0.7 - i * 0.15)} opacity={0.7 - i * 0.1} />
        ))}
        {highlight}
      </svg>
    );
  }

  if (s === 'asscher') {
    const h = R * 1.88, x0 = C - h / 2, y0 = C - h / 2, cut = h * 0.12;
    const outline: [number, number][] = [
      [x0+cut,y0],[x0+h-cut,y0],[x0+h,y0+cut],
      [x0+h,y0+h-cut],[x0+h-cut,y0+h],[x0+cut,y0+h],[x0,y0+h-cut],[x0,y0+cut]
    ];
    const steps = [0.2, 0.35, 0.5];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <polygon points={outline.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} />
        {steps.map((t, i) => (
          <rect key={i} x={x0+h*t} y={y0+h*t} width={h*(1-t*2)} height={h*(1-t*2)}
            fill="none" stroke={facet} strokeWidth={sw * (0.7 - i * 0.15)} opacity={0.7 - i * 0.1} />
        ))}
        {highlight}
      </svg>
    );
  }

  if (s === 'radiant') {
    const w = R * 1.5, h = R * 2.0, x0 = C - w / 2, y0 = C - h / 2, cut = w * 0.12;
    const outline: [number, number][] = [
      [x0+cut,y0],[x0+w-cut,y0],[x0+w,y0+cut],
      [x0+w,y0+h-cut],[x0+w-cut,y0+h],[x0+cut,y0+h],[x0,y0+h-cut],[x0,y0+cut]
    ];
    const corners: [number, number][] = [[x0+cut,y0],[x0+w-cut,y0],[x0+w,y0+cut],[x0+w,y0+h-cut],
      [x0+w-cut,y0+h],[x0+cut,y0+h],[x0,y0+h-cut],[x0,y0+cut]];
    const ti = w * 0.3;
    const table: [number, number][] = [[x0+ti,y0+h*0.3],[x0+w-ti,y0+h*0.3],[x0+w-ti,y0+h*0.7],[x0+ti,y0+h*0.7]];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <polygon points={outline.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} />
        {corners.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.55} opacity="0.65" />)}
        {poly(table)}
        {highlight}
      </svg>
    );
  }

  if (s === 'pear') {
    const px = C, py = C - R * 0.92, bx = C, by = C + R * 0.92;
    const lx = C - R * 0.62, ly = C + R * 0.1;
    const rx2 = C + R * 0.62, ry2 = C + R * 0.1;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <path d={`M${px},${py} C${rx2},${C-R*0.5} ${rx2},${ry2} ${bx},${by} C${lx},${ry2} ${lx},${C-R*0.5} ${px},${py}Z`}
          fill={fill} stroke={stroke} strokeWidth={sw} />
        <line x1={C} y1={C} x2={px} y2={py} stroke={facet} strokeWidth={sw * 0.7} />
        <line x1={C} y1={C} x2={lx} y2={ly} stroke={facet} strokeWidth={sw * 0.7} />
        <line x1={C} y1={C} x2={rx2} y2={ry2} stroke={facet} strokeWidth={sw * 0.7} />
        <line x1={C} y1={C} x2={bx} y2={by} stroke={facet} strokeWidth={sw * 0.7} />
        <ellipse cx={C} cy={C + R * 0.1} rx={R * 0.3} ry={R * 0.25} fill={tableFill} stroke={facet} strokeWidth={sw * 0.7} />
        {highlight}
      </svg>
    );
  }

  if (s === 'marquise') {
    const lx = C - R, rx2 = C + R, ty = C - R * 0.42, by = C + R * 0.42;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <path d={`M${lx},${C} C${lx},${ty} ${rx2},${ty} ${rx2},${C} C${rx2},${by} ${lx},${by} ${lx},${C}Z`}
          fill={fill} stroke={stroke} strokeWidth={sw} />
        <line x1={C} y1={C} x2={lx} y2={C} stroke={facet} strokeWidth={sw * 0.7} />
        <line x1={C} y1={C} x2={rx2} y2={C} stroke={facet} strokeWidth={sw * 0.7} />
        <line x1={C} y1={C} x2={C} y2={ty} stroke={facet} strokeWidth={sw * 0.7} />
        <line x1={C} y1={C} x2={C} y2={by} stroke={facet} strokeWidth={sw * 0.7} />
        <ellipse cx={C} cy={C} rx={R * 0.32} ry={R * 0.18} fill={tableFill} stroke={facet} strokeWidth={sw * 0.7} />
        {highlight}
      </svg>
    );
  }

  if (s === 'heart') {
    const w = R * 1.7;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grad}
        <path d={`M${C},${C + w * 0.42}
          C${C - w * 0.5},${C + w * 0.1} ${C - w * 0.55},${C - w * 0.18} ${C - w * 0.28},${C - w * 0.26}
          C${C - w * 0.08},${C - w * 0.34} ${C},${C - w * 0.18} ${C},${C - w * 0.05}
          C${C},${C - w * 0.18} ${C + w * 0.08},${C - w * 0.34} ${C + w * 0.28},${C - w * 0.26}
          C${C + w * 0.55},${C - w * 0.18} ${C + w * 0.5},${C + w * 0.1} ${C},${C + w * 0.42}Z`}
          fill={fill} stroke={stroke} strokeWidth={sw} />
        <line x1={C} y1={C} x2={C} y2={C + w * 0.42} stroke={facet} strokeWidth={sw * 0.7} />
        <line x1={C} y1={C} x2={C - w * 0.5} y2={C + w * 0.1} stroke={facet} strokeWidth={sw * 0.55} />
        <line x1={C} y1={C} x2={C + w * 0.5} y2={C + w * 0.1} stroke={facet} strokeWidth={sw * 0.55} />
        <line x1={C} y1={C} x2={C - w * 0.28} y2={C - w * 0.26} stroke={facet} strokeWidth={sw * 0.55} />
        <line x1={C} y1={C} x2={C + w * 0.28} y2={C - w * 0.26} stroke={facet} strokeWidth={sw * 0.55} />
        <ellipse cx={C} cy={C + w * 0.08} rx={R * 0.28} ry={R * 0.22} fill={tableFill} stroke={facet} strokeWidth={sw * 0.7} />
        {highlight}
      </svg>
    );
  }

  // Fallback: round
  const outer = radPts(8, R, -90);
  const table = radPts(8, R * 0.42, -90);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {grad}
      <circle cx={C} cy={C} r={R} fill={fill} stroke={stroke} strokeWidth={sw} />
      {outer.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
      {poly(table)}
      {highlight}
    </svg>
  );
}

// DiamondImage: uses Nivoda URL if available, else shows SVG illustration
function DiamondImage({ shape, imageUrl, fill: fillImg = false, className = '' }:
  { shape: string; imageUrl?: string | null; fill?: boolean; className?: string }) {
  if (imageUrl) {
    return fillImg
      ? <Image src={imageUrl} alt={`${shape} diamond`} fill className={className} />
      : <Image src={imageUrl} alt={`${shape} diamond`} width={200} height={200} className={className} />;
  }
  return (
    <div className={cn('w-full h-full flex items-center justify-center bg-[#f0f7ff]', className)}>
      <DiamondIllustration shape={shape} size={180} />
    </div>
  );
}

// ── Shape SVGs ────────────────────────────────────────────────────────────────
const ShapeSVG = ({ shape, size = 36 }: { shape: string; size?: number }) => {
  const s = size, c = s / 2, r = s * 0.44;
  const paths: Record<string, React.ReactNode> = {
    round:    <circle cx={c} cy={c} r={r} />,
    oval:     <ellipse cx={c} cy={c} rx={r * 0.68} ry={r} />,
    princess: <rect x={s*.1} y={s*.1} width={s*.8} height={s*.8} />,
    cushion:  <rect x={s*.1} y={s*.1} width={s*.8} height={s*.8} rx={s*.15} />,
    emerald:  <rect x={s*.1} y={s*.2} width={s*.8} height={s*.6} rx={s*.04} />,
    radiant:  <polygon points={`${c},${s*.06} ${s*.88},${s*.22} ${s*.94},${s*.78} ${c},${s*.94} ${s*.06},${s*.78} ${s*.12},${s*.22}`} />,
    pear:     <path d={`M${c},${s*.92} C${s*.1},${s*.7} ${s*.1},${s*.42} ${c},${s*.08} C${s*.9},${s*.42} ${s*.9},${s*.7} ${c},${s*.92}Z`} />,
    marquise: <ellipse cx={c} cy={c} rx={r} ry={r*.42} />,
    asscher:  <><rect x={s*.14} y={s*.14} width={s*.72} height={s*.72} /><rect x={s*.24} y={s*.24} width={s*.52} height={s*.52} fill="none" stroke="currentColor" strokeWidth=".8" /></>,
    heart:    <path d={`M${c},${s*.84} C${s*.05},${s*.54} ${s*.05},${s*.25} ${c*.72},${s*.2} C${c},${s*.12} ${c*1.28},${s*.2} ${c*1.5},${s*.3} C${s*.95},${s*.25} ${s*.95},${s*.54} ${c},${s*.84}Z`} />,
  };
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="currentColor">
      {paths[shape.toLowerCase()] ?? paths.round}
    </svg>
  );
};

// ── Quality badge colors ──────────────────────────────────────────────────────
const CUT_COLORS: Record<string, string> = {
  Ideal:       'bg-emerald-700 text-white',
  Excellent:   'bg-emerald-600 text-white',
  'Very Good': 'bg-blue-600 text-white',
  Good:        'bg-gray-500 text-white',
  Fair:        'bg-gray-400 text-white',
};
const LAB_COLORS: Record<string, string> = {
  GIA: 'bg-[#003087] text-white',
  IGI: 'bg-[#006241] text-white',
  HRD: 'bg-[#C6003B] text-white',
  AGS: 'bg-charcoal text-white',
};

// ── Filter constants ──────────────────────────────────────────────────────────
const SHAPES    = ['Round','Oval','Cushion','Princess','Emerald','Pear','Radiant','Asscher','Marquise','Heart'];
const COLORS    = ['D','E','F','G','H','I','J','K'];
const CLARITIES = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1'];
const CUTS      = ['Ideal','Excellent','Very Good','Good'];
const LABS      = ['GIA','IGI','HRD'];

// ── Dual-handle range slider ──────────────────────────────────────────────────
function RangeSlider({ label, min, max, step, lo, hi, onChange, fmt }:
  { label: string; min: number; max: number; step: number; lo: number; hi: number;
    onChange: (lo: number, hi: number) => void; fmt: (v: number) => string }) {
  const pLo = ((lo - min) / (max - min)) * 100;
  const pHi = ((hi - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between text-[11px] font-sans mb-1">
        <span className="font-semibold text-charcoal">{label}</span>
        <span className="text-gray-500">{fmt(lo)} — {fmt(hi)}</span>
      </div>
      <div className="relative h-5 mt-1">
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-charcoal rounded"
          style={{ left: `${pLo}%`, right: `${100 - pHi}%` }} />
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={e => onChange(Math.min(+e.target.value, hi - step), hi)}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10" />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={e => onChange(lo, Math.max(+e.target.value, lo + step))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-20" />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-charcoal rounded-full shadow -translate-x-1/2 pointer-events-none"
          style={{ left: `${pLo}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-charcoal rounded-full shadow -translate-x-1/2 pointer-events-none"
          style={{ left: `${pHi}%` }} />
      </div>
    </div>
  );
}

// ── Loupe360 / Video viewer ───────────────────────────────────────────────────
function DiamondViewer({ diamond }: { diamond: IDiamond }) {
  const [tab, setTab] = useState<'photo'|'360'|'video'>(
    diamond.loupe360 ? '360' : diamond.videoUrl ? 'video' : 'photo'
  );
  return (
    <div className="w-full">
      {/* Tab switcher */}
      {(diamond.loupe360 || diamond.videoUrl) && (
        <div className="flex border-b border-gray-200 mb-3">
          {(['photo', diamond.loupe360 ? '360' : null, diamond.videoUrl ? 'video' : null] as const)
            .filter(Boolean)
            .map(t => (
              <button key={t!}
                onClick={() => setTab(t!)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-[11px] font-sans font-medium border-b-2 -mb-px transition-colors',
                  tab === t
                    ? 'border-charcoal text-charcoal'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                )}
              >
                {t === 'photo' && <span>Photo</span>}
                {t === '360'   && <><RotateCcw size={12} /> 360° View</>}
                {t === 'video' && <><Play size={12} /> Video</>}
              </button>
            ))}
        </div>
      )}

      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {tab === 'photo' && (
          <DiamondImage shape={diamond.shape} imageUrl={diamond.imageUrl} fill className="object-contain p-4" />
        )}
        {tab === '360' && diamond.loupe360 && (
          <iframe
            src={diamond.loupe360}
            className="w-full h-full border-0"
            allow="accelerometer; gyroscope"
            title="360° Diamond View"
          />
        )}
        {tab === 'video' && diamond.videoUrl && (
          <video src={diamond.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
        )}
      </div>
    </div>
  );
}

// ── Diamond detail pane ───────────────────────────────────────────────────────
function DiamondDetailPane({ diamond, onSelect, isSelected, onClose }:
  { diamond: IDiamond; onSelect: (d: IDiamond) => void; isSelected: boolean; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Close (mobile) */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-sans tracking-widest uppercase text-gray-400">Diamond Details</p>
        <button onClick={onClose} className="lg:hidden p-1 hover:text-charcoal transition-colors text-gray-400">
          <X size={16} />
        </button>
      </div>

      <DiamondViewer diamond={diamond} />

      {/* Specs */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: 'Shape',        value: diamond.shape },
          { label: 'Carat',        value: `${diamond.caratWeight.toFixed(2)}ct` },
          { label: 'Cut',          value: diamond.cut },
          { label: 'Colour',       value: diamond.color },
          { label: 'Clarity',      value: diamond.clarity },
          { label: 'Polish',       value: diamond.polish },
          { label: 'Symmetry',     value: diamond.symmetry },
          { label: 'Fluorescence', value: diamond.fluorescence },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 px-3 py-2">
            <p className="text-[9px] font-sans uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-[12px] font-sans font-semibold text-charcoal mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Measurements */}
      {diamond.measurements && (
        <div className="mt-3 bg-gray-50 px-3 py-2">
          <p className="text-[9px] font-sans uppercase tracking-wider text-gray-400 mb-1.5">Measurements</p>
          <p className="text-[11px] font-sans text-charcoal">
            {diamond.measurements.length?.toFixed(2)} ×{' '}
            {diamond.measurements.width?.toFixed(2)} ×{' '}
            {diamond.measurements.depth?.toFixed(2)} mm
            {diamond.measurements.depthPercent ? ` · Depth ${diamond.measurements.depthPercent}%` : ''}
            {diamond.measurements.tablePercent ? ` · Table ${diamond.measurements.tablePercent}%` : ''}
          </p>
        </div>
      )}

      {/* Certificate */}
      {diamond.certificate && (
        <div className="mt-3 flex items-center justify-between bg-gray-50 px-3 py-2">
          <div>
            <p className="text-[9px] font-sans uppercase tracking-wider text-gray-400">Certificate</p>
            <p className="text-[12px] font-sans font-semibold text-charcoal mt-0.5">
              {diamond.certificate.lab} #{diamond.certificate.number}
            </p>
          </div>
          {diamond.certificate.pdfUrl && (
            <a href={diamond.certificate.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-sans text-blue-600 hover:text-blue-800 transition-colors">
              View Report <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      {/* Price + CTA */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="font-serif text-2xl font-light text-charcoal">{formatPrice(diamond.price)}</p>
        <p className="text-[11px] text-gray-400 font-sans mt-0.5 mb-3">Diamond price only · Setting priced separately</p>
        <button
          onClick={() => onSelect(diamond)}
          className={cn(
            'w-full py-3.5 text-sm font-sans font-medium tracking-wider transition-colors',
            isSelected
              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
              : 'bg-charcoal text-white hover:bg-black'
          )}
        >
          {isSelected ? <span className="flex items-center justify-center gap-2"><Check size={15} /> Diamond Selected</span> : 'SELECT THIS DIAMOND'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DiamondBrowserPage() {
  const router  = useRouter();
  const { setting, diamond: chosenDiamond, setDiamond, settingPrice, totalPrice } = useRingBuilder();

  // ── Filters ──
  const [shapes,      setShapes]      = useState<string[]>([]);
  const [cuts,        setCuts]        = useState<string[]>([]);
  const [colorMin,    setColorMin]    = useState(0);   // index into COLORS
  const [colorMax,    setColorMax]    = useState(COLORS.length - 1);
  const [clarityMin,  setClarityMin]  = useState(0);
  const [clarityMax,  setClarityMax]  = useState(CLARITIES.length - 1);
  const [caratMin,    setCaratMin]    = useState(0.25);
  const [caratMax,    setCaratMax]    = useState(5.0);
  const [priceMin,    setPriceMin]    = useState(0);
  const [priceMax,    setPriceMax]    = useState(50000);
  const [labs,        setLabs]        = useState<string[]>([]);
  const [sort,        setSort]        = useState('price-asc');
  const [viewMode,    setViewMode]    = useState<'table'|'grid'>('table');
  const [selected,    setSelected]    = useState<IDiamond | null>(chosenDiamond);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Data ──
  const { data, isLoading } = useQuery({
    queryKey: ['diamonds-browser'],
    queryFn:  () => diamondsApi.getAll({ limit: 200 }),
    staleTime: 5 * 60_000,
  });
  const allDiamonds: IDiamond[] = useMemo(() => {
    const raw = data?.data;
    return Array.isArray(raw) ? raw : (raw?.diamonds ?? []);
  }, [data]);

  // ── Filtered + sorted list ──
  const filtered = useMemo(() => {
    const activeColors    = COLORS.slice(colorMin, colorMax + 1);
    const activeClarities = CLARITIES.slice(clarityMin, clarityMax + 1);
    let list = allDiamonds.filter(d => {
      if (shapes.length  && !shapes.includes(d.shape))                    return false;
      if (cuts.length    && !cuts.includes(d.cut))                        return false;
      if (labs.length    && !labs.includes(d.certificate?.lab))           return false;
      if (!activeColors.includes(d.color))                                return false;
      if (!activeClarities.includes(d.clarity))                           return false;
      if (d.caratWeight < caratMin || d.caratWeight > caratMax)           return false;
      if (d.price < priceMin || d.price > priceMax)                       return false;
      return true;
    });
    if (sort === 'price-asc')   list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc')  list.sort((a, b) => b.price - a.price);
    if (sort === 'carat-asc')   list.sort((a, b) => a.caratWeight - b.caratWeight);
    if (sort === 'carat-desc')  list.sort((a, b) => b.caratWeight - a.caratWeight);
    return list;
  }, [allDiamonds, shapes, cuts, colorMin, colorMax, clarityMin, clarityMax,
      caratMin, caratMax, priceMin, priceMax, labs, sort]);

  const toggleShape = (s: string) => setShapes(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleCut   = (c: string) => setCuts(prev =>
    prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleLab   = (l: string) => setLabs(prev =>
    prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const resetFilters = useCallback(() => {
    setShapes([]); setCuts([]); setLabs([]);
    setColorMin(0); setColorMax(COLORS.length - 1);
    setClarityMin(0); setClarityMax(CLARITIES.length - 1);
    setCaratMin(0.25); setCaratMax(5);
    setPriceMin(0); setPriceMax(50000);
  }, []);

  const handleSelect = (d: IDiamond) => {
    setSelected(d);
    setDiamond(d);
  };
  const handleProceed = () => {
    if (selected) router.push('/custom-ring/review');
  };

  const hasActiveFilters = shapes.length > 0 || cuts.length > 0 || labs.length > 0
    || colorMin > 0 || colorMax < COLORS.length - 1
    || clarityMin > 0 || clarityMax < CLARITIES.length - 1
    || caratMin > 0.25 || caratMax < 5 || priceMin > 0 || priceMax < 50000;

  return (
    <div className="bg-white min-h-screen">
      <BuilderHeader />

      {/* ── Shape selector bar ── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <p className="text-[11px] font-sans tracking-widest uppercase text-gray-400 mb-3">Shape</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* All Shapes */}
            <button
              onClick={() => setShapes([])}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 border flex-shrink-0 transition-all',
                'w-20 h-[72px]',
                shapes.length === 0
                  ? 'border-charcoal bg-charcoal/[0.04]'
                  : 'border-gray-200 hover:border-gray-400'
              )}
            >
              <div className="grid grid-cols-2 gap-0.5 opacity-60">
                {['round','oval','princess','cushion'].map(s => (
                  <div key={s} className="w-3.5 h-3.5 flex items-center justify-center text-charcoal">
                    <ShapeSVG shape={s} size={12} />
                  </div>
                ))}
              </div>
              <span className={cn('text-[11px] font-sans capitalize', shapes.length === 0 ? 'text-charcoal font-medium' : 'text-gray-500')}>
                All
              </span>
            </button>

            {SHAPES.map(shape => (
              <button
                key={shape}
                onClick={() => toggleShape(shape)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 border flex-shrink-0 transition-all',
                  'w-20 h-[72px]',
                  shapes.includes(shape)
                    ? 'border-charcoal bg-charcoal/[0.04]'
                    : 'border-gray-200 hover:border-gray-400'
                )}
              >
                <span className={shapes.includes(shape) ? 'text-charcoal' : 'text-gray-400'}>
                  <ShapeSVG shape={shape} size={28} />
                </span>
                <span className={cn('text-[11px] font-sans capitalize', shapes.includes(shape) ? 'text-charcoal font-medium' : 'text-gray-500')}>
                  {shape}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Horizontal filter bar ── */}
      <div className="border-b border-gray-100 bg-gray-50/50 sticky top-[52px] z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          {/* Cut */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-sans text-gray-500 mr-1">Cut:</span>
            {CUTS.map(c => (
              <button key={c} onClick={() => toggleCut(c)}
                className={cn('px-2 py-1 text-[11px] font-sans border transition-colors',
                  cuts.includes(c) ? 'bg-charcoal border-charcoal text-white' : 'border-gray-300 text-gray-600 hover:border-charcoal'
                )}>
                {c}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-300 hidden sm:block" />

          {/* Color range */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-sans text-gray-500">Colour:</span>
            {COLORS.map((c, i) => (
              <button key={c} onClick={() => {
                if (i < colorMin) setColorMin(i);
                else if (i > colorMax) setColorMax(i);
                else if (i === colorMin && colorMin < colorMax) setColorMin(colorMin + 1);
                else if (i === colorMax && colorMax > colorMin) setColorMax(colorMax - 1);
              }}
                className={cn('w-7 h-7 text-[11px] font-sans border transition-colors font-medium',
                  i >= colorMin && i <= colorMax
                    ? 'bg-charcoal border-charcoal text-white'
                    : 'border-gray-300 text-gray-400 hover:border-charcoal'
                )}>
                {c}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-300 hidden sm:block" />

          {/* Lab */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-sans text-gray-500">Cert:</span>
            {LABS.map(l => (
              <button key={l} onClick={() => toggleLab(l)}
                className={cn('px-2 py-1 text-[11px] font-sans font-bold border transition-colors',
                  labs.includes(l) ? 'bg-charcoal border-charcoal text-white' : 'border-gray-300 text-gray-600 hover:border-charcoal'
                )}>
                {l}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="text-[11px] font-sans text-gray-500 hover:text-charcoal flex items-center gap-1 transition-colors">
                <X size={11} /> Reset
              </button>
            )}
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-[11px] font-sans border border-gray-300 px-2 py-1.5 bg-white text-charcoal focus:outline-none focus:border-charcoal">
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="carat-asc">Carat ↑</option>
              <option value="carat-desc">Carat ↓</option>
            </select>
            {/* View toggle */}
            <div className="flex border border-gray-300">
              <button onClick={() => setViewMode('table')}
                className={cn('p-1.5 transition-colors', viewMode === 'table' ? 'bg-charcoal text-white' : 'text-gray-500 hover:text-charcoal')}>
                <List size={14} />
              </button>
              <button onClick={() => setViewMode('grid')}
                className={cn('p-1.5 transition-colors', viewMode === 'grid' ? 'bg-charcoal text-white' : 'text-gray-500 hover:text-charcoal')}>
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Carat + Price range sliders */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-3 grid grid-cols-2 gap-6 max-w-xl">
          <RangeSlider label="Carat" min={0.25} max={5} step={0.05}
            lo={caratMin} hi={caratMax}
            onChange={(lo, hi) => { setCaratMin(lo); setCaratMax(hi); }}
            fmt={v => `${v.toFixed(2)}ct`} />
          <RangeSlider label="Price" min={0} max={50000} step={250}
            lo={priceMin} hi={priceMax}
            onChange={(lo, hi) => { setPriceMin(lo); setPriceMax(hi); }}
            fmt={v => `£${(v/1000).toFixed(0)}k`} />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Result count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-sans text-gray-500">
            <span className="font-semibold text-charcoal">{filtered.length}</span> diamonds
            {setting && <span className="ml-2 text-gray-400">· Adding to your {setting.name}</span>}
          </p>
          {selected && (
            <button onClick={() => setPreviewOpen(true)}
              className="lg:hidden flex items-center gap-1.5 text-[11px] font-sans text-charcoal border border-charcoal px-3 py-1.5">
              <Info size={12} /> View Selected
            </button>
          )}
        </div>

        <div className="flex gap-6">
          {/* ── Diamond list ── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-sans text-sm text-gray-400">No diamonds match your filters.</p>
                <button onClick={resetFilters} className="mt-3 text-xs font-sans text-charcoal underline">
                  Clear all filters
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* ── TABLE VIEW ── */
              <div className="border border-gray-200 overflow-hidden">
                {/* Table header */}
                <div className="grid text-[10px] font-sans font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-200 px-4 py-2"
                  style={{ gridTemplateColumns: '36px 1fr 90px 52px 52px 52px 60px 80px 100px' }}>
                  <span />
                  <span>Shape</span>
                  <span>Carat</span>
                  <span>Cut</span>
                  <span>Colour</span>
                  <span>Clarity</span>
                  <span>Lab</span>
                  <span className="text-right">Price</span>
                  <span />
                </div>

                <div className="divide-y divide-gray-100">
                  {filtered.map(d => {
                    const isChosen = selected?._id === d._id;
                    const has360   = !!d.loupe360;
                    return (
                      <div
                        key={d._id}
                        onClick={() => { setSelected(d); setPreviewOpen(true); }}
                        className={cn(
                          'grid items-center px-4 py-3 cursor-pointer transition-colors text-sm',
                          'hover:bg-gray-50',
                          isChosen ? 'bg-charcoal/[0.04] border-l-2 border-l-charcoal' : ''
                        )}
                        style={{ gridTemplateColumns: '36px 1fr 90px 52px 52px 52px 60px 80px 100px' }}
                      >
                        {/* Shape icon */}
                        <span className="text-gray-500">
                          <ShapeSVG shape={d.shape} size={22} />
                        </span>

                        {/* Shape name */}
                        <span className="font-sans text-[12px] text-charcoal font-medium">
                          {d.shape}
                          {has360 && (
                            <span className="ml-2 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 font-sans font-bold">
                              360°
                            </span>
                          )}
                        </span>

                        {/* Carat */}
                        <span className="font-sans text-[13px] font-bold text-charcoal">
                          {d.caratWeight.toFixed(2)}ct
                        </span>

                        {/* Cut badge */}
                        <span className={cn(
                          'text-[9px] font-sans font-bold px-1.5 py-0.5 text-center leading-tight',
                          CUT_COLORS[d.cut] || 'bg-gray-200 text-gray-700'
                        )}>
                          {d.cut === 'Very Good' ? 'V.Good' : d.cut}
                        </span>

                        {/* Color */}
                        <span className="font-sans text-[13px] font-semibold text-charcoal text-center">
                          {d.color}
                        </span>

                        {/* Clarity */}
                        <span className="font-sans text-[12px] text-charcoal text-center">
                          {d.clarity}
                        </span>

                        {/* Lab badge */}
                        <span className={cn(
                          'text-[9px] font-sans font-bold px-1.5 py-0.5 text-center',
                          LAB_COLORS[d.certificate?.lab] || 'bg-gray-200 text-gray-700'
                        )}>
                          {d.certificate?.lab}
                        </span>

                        {/* Price */}
                        <span className="font-sans text-[13px] font-bold text-charcoal text-right">
                          {formatPrice(d.price)}
                        </span>

                        {/* Select button */}
                        <button
                          onClick={e => { e.stopPropagation(); handleSelect(d); }}
                          className={cn(
                            'ml-2 px-3 py-1.5 text-[11px] font-sans font-medium tracking-wider border transition-colors',
                            isChosen
                              ? 'bg-charcoal text-white border-charcoal'
                              : 'border-gray-300 text-charcoal hover:bg-charcoal hover:text-white hover:border-charcoal'
                          )}
                        >
                          {isChosen ? <Check size={12} className="mx-auto" /> : 'Select'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── GRID VIEW ── */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(d => {
                  const isChosen = selected?._id === d._id;
                  return (
                    <div
                      key={d._id}
                      onClick={() => { setSelected(d); setPreviewOpen(true); }}
                      className={cn(
                        'group cursor-pointer border-2 bg-white transition-all hover:shadow-md',
                        isChosen ? 'border-charcoal' : 'border-gray-100 hover:border-gray-300'
                      )}
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <DiamondImage shape={d.shape} imageUrl={d.imageUrl} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                        {isChosen && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-charcoal rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                        {d.loupe360 && (
                          <div className="absolute bottom-2 left-2 bg-white/90 text-[9px] font-sans font-bold text-blue-700 px-1.5 py-0.5">
                            360°
                          </div>
                        )}
                        {d.certificate?.lab && (
                          <div className={cn('absolute bottom-2 right-2 text-[9px] font-sans font-bold px-1.5 py-0.5',
                            LAB_COLORS[d.certificate.lab] || 'bg-gray-200 text-gray-700')}>
                            {d.certificate.lab}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[12px] font-sans font-semibold text-charcoal">
                          {d.caratWeight.toFixed(2)}ct {d.shape}
                        </p>
                        <div className="flex gap-1.5 mt-1">
                          <span className={cn('text-[9px] font-sans font-bold px-1.5 py-0.5',
                            CUT_COLORS[d.cut] || 'bg-gray-200 text-gray-700')}>
                            {d.cut === 'Very Good' ? 'VG' : d.cut.slice(0, 4)}
                          </span>
                          <span className="text-[11px] font-sans text-gray-500">{d.color} · {d.clarity}</span>
                        </div>
                        <p className="text-[13px] font-sans font-bold text-charcoal mt-2">{formatPrice(d.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right detail pane (desktop) ── */}
          {selected && (
            <div className="hidden lg:flex w-[340px] flex-shrink-0">
              <div className="sticky top-[160px] w-full border border-gray-200 p-4 h-fit max-h-[calc(100vh-180px)] overflow-y-auto">
                <DiamondDetailPane
                  diamond={selected}
                  onSelect={handleSelect}
                  isSelected={selected?._id === selected?._id}
                  onClose={() => setSelected(null)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile detail drawer ── */}
      {previewOpen && selected && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-4 shadow-2xl">
            <DiamondDetailPane
              diamond={selected}
              onSelect={handleSelect}
              isSelected={true}
              onClose={() => setPreviewOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Sticky bottom CTA ── */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300',
        selected ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          {selected && (
            <>
              <div className="w-12 h-12 relative overflow-hidden bg-[#f0f7ff] border border-gray-200 flex-shrink-0 flex items-center justify-center">
                <DiamondImage shape={selected.shape} imageUrl={selected.imageUrl} fill className="object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-sans font-semibold text-charcoal truncate">
                  {selected.caratWeight.toFixed(2)}ct {selected.shape} — {selected.color}/{selected.clarity} {selected.certificate?.lab}
                </p>
                <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                  {formatPrice(selected.price)}
                  {setting && (
                    <> · {setting.name} · <span className="font-semibold text-charcoal">Total: {formatPrice(totalPrice())}</span></>
                  )}
                </p>
              </div>
            </>
          )}
          <div className="flex gap-2 flex-shrink-0">
            <Link href="/custom-ring/settings"
              className="px-4 py-2.5 text-[12px] font-sans border border-gray-300 text-gray-600 hover:border-charcoal hover:text-charcoal transition-colors">
              ← Back
            </Link>
            <button onClick={handleProceed} disabled={!selected}
              className="flex items-center gap-2 px-6 py-2.5 text-[12px] font-sans font-medium tracking-wider bg-charcoal text-white hover:bg-black transition-colors disabled:opacity-40">
              COMPLETE RING <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="h-20" />
    </div>
  );
}
