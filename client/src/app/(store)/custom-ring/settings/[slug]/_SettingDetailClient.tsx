'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Check, ChevronLeft, ChevronRight, MessageCircle,
  RotateCcw, Truck, Award, RefreshCw, Heart, Sparkles,
  Gem, Diamond, Layers, Box,
} from 'lucide-react';
import { productsApi } from '@/lib/api';
import { IProduct } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useRingBuilder } from '@/store/ringBuilderStore';
import BuilderHeader from '@/components/ring-builder/BuilderHeader';
import Ring3DViewer from '@/components/ring-builder/Ring3DViewer';
import { cn } from '@/lib/utils';

// ── Inline SVG diamond illustration (replaces all Unsplash diamond photos) ───
function DiamondSVG({ shape, size = 160 }: { shape: string; size?: number }) {
  const s = shape?.toLowerCase() || 'round';
  const id = `std-${s}`;
  const C = size / 2, R = size * 0.43;
  const grad = (
    <defs>
      <radialGradient id={id} cx="38%" cy="30%" r="72%">
        <stop offset="0%"   stopColor="#ffffff" />
        <stop offset="35%"  stopColor="#eaf4ff" />
        <stop offset="75%"  stopColor="#b8d8f0" />
        <stop offset="100%" stopColor="#7aaed0" />
      </radialGradient>
    </defs>
  );
  const fill = `url(#${id})`, stroke = "#5a90b8", facet = "#82b4d0";
  const sw = size * 0.009;
  const radPts = (n: number, r: number, off = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((i * 360) / n + off) * Math.PI / 180;
      return [C + r * Math.cos(a), C + r * Math.sin(a)] as [number, number];
    });
  const highlight = <>
    <ellipse cx={C * 0.80} cy={C * 0.72} rx={R * 0.22} ry={R * 0.12}
      fill="white" opacity="0.55" transform={`rotate(-38 ${C * 0.80} ${C * 0.72})`} />
  </>;

  if (s === 'round') {
    const outer = radPts(8, R, -90), table = radPts(8, R * 0.42, -90);
    const mid = radPts(8, R, -67.5);
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <circle cx={C} cy={C} r={R} fill={fill} stroke={stroke} strokeWidth={sw} />
      {outer.map(([x,y],i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.7}/>)}
      {mid.map(([x,y],i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.4} opacity=".5"/>)}
      <polygon points={table.map(([x,y])=>`${x},${y}`).join(' ')} fill="white" fillOpacity=".65" stroke={facet} strokeWidth={sw*.7}/>
      {highlight}</svg>;
  }
  if (s === 'oval') {
    const pts = radPts(8, R, -90).map(([x,y]) => [C+(x-C)*.68, y] as [number,number]);
    const tbl = radPts(8, R*.42, -90).map(([x,y]) => [C+(x-C)*.68, y] as [number,number]);
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <ellipse cx={C} cy={C} rx={R*.68} ry={R} fill={fill} stroke={stroke} strokeWidth={sw}/>
      {pts.map(([x,y],i)=><line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.7}/>)}
      <polygon points={tbl.map(([x,y])=>`${x},${y}`).join(' ')} fill="white" fillOpacity=".65" stroke={facet} strokeWidth={sw*.7}/>
      {highlight}</svg>;
  }
  if (s === 'princess' || s === 'cushion') {
    const h2 = R*1.88, x0 = C-h2/2, y0 = C-h2/2, ti = h2*.3, cr = s==='cushion'?h2*.2:2;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <rect x={x0} y={y0} width={h2} height={h2} rx={cr} fill={fill} stroke={stroke} strokeWidth={sw}/>
      {([[x0,y0],[x0+h2,y0],[x0+h2,y0+h2],[x0,y0+h2]] as [number,number][]).map(([x,y],i)=><line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.7}/>)}
      <rect x={x0+ti} y={y0+ti} width={h2-ti*2} height={h2-ti*2} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw*.7}/>
      {highlight}</svg>;
  }
  if (s === 'emerald' || s === 'asscher') {
    const w = s==='emerald'?R*1.5:R*1.88, h2 = s==='emerald'?R*2.0:R*1.88;
    const x0=C-w/2, y0=C-h2/2, cut=w*.12;
    const pts: [number,number][] = [[x0+cut,y0],[x0+w-cut,y0],[x0+w,y0+cut],[x0+w,y0+h2-cut],[x0+w-cut,y0+h2],[x0+cut,y0+h2],[x0,y0+h2-cut],[x0,y0+cut]];
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <polygon points={pts.map(([x,y])=>`${x},${y}`).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw}/>
      {[0.2,0.35,0.5].map((t,i)=><rect key={i} x={x0+w*t} y={y0+h2*t} width={w*(1-t*2)} height={h2*(1-t*2)} fill="none" stroke={facet} strokeWidth={sw*(.7-i*.15)} opacity={.7-i*.1}/>)}
      {highlight}</svg>;
  }
  if (s === 'radiant') {
    const w=R*1.5, h2=R*2.0, x0=C-w/2, y0=C-h2/2, cut=w*.12;
    const pts: [number,number][] = [[x0+cut,y0],[x0+w-cut,y0],[x0+w,y0+cut],[x0+w,y0+h2-cut],[x0+w-cut,y0+h2],[x0+cut,y0+h2],[x0,y0+h2-cut],[x0,y0+cut]];
    const ti=w*.3;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <polygon points={pts.map(([x,y])=>`${x},${y}`).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw}/>
      {pts.map(([x,y],i)=><line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.5} opacity=".6"/>)}
      <rect x={x0+ti} y={y0+h2*.3} width={w-ti*2} height={h2*.4} fill="white" fillOpacity=".55" stroke={facet} strokeWidth={sw*.7}/>
      {highlight}</svg>;
  }
  if (s === 'pear') {
    const px=C, py=C-R*.9, bx=C, by=C+R*.9, lx=C-R*.62, ly=C+R*.1, rx2=C+R*.62, ry2=C+R*.1;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <path d={`M${px},${py} C${rx2},${C-R*.5} ${rx2},${ry2} ${bx},${by} C${lx},${ry2} ${lx},${C-R*.5} ${px},${py}Z`} fill={fill} stroke={stroke} strokeWidth={sw}/>
      {[[px,py],[lx,ly],[rx2,ry2],[bx,by]].map(([x,y],i)=><line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.7}/>)}
      <ellipse cx={C} cy={C+R*.1} rx={R*.3} ry={R*.25} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw*.7}/>
      {highlight}</svg>;
  }
  if (s === 'marquise') {
    const lx=C-R, rx2=C+R, ty=C-R*.42, by=C+R*.42;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <path d={`M${lx},${C} C${lx},${ty} ${rx2},${ty} ${rx2},${C} C${rx2},${by} ${lx},${by} ${lx},${C}Z`} fill={fill} stroke={stroke} strokeWidth={sw}/>
      {[[lx,C],[rx2,C],[C,ty],[C,by]].map(([x,y],i)=><line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.7}/>)}
      <ellipse cx={C} cy={C} rx={R*.32} ry={R*.18} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw*.7}/>
      {highlight}</svg>;
  }
  if (s === 'heart') {
    const w=R*1.7;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
      <path d={`M${C},${C+w*.42} C${C-w*.5},${C+w*.1} ${C-w*.55},${C-w*.18} ${C-w*.28},${C-w*.26} C${C-w*.08},${C-w*.34} ${C},${C-w*.18} ${C},${C-w*.05} C${C},${C-w*.18} ${C+w*.08},${C-w*.34} ${C+w*.28},${C-w*.26} C${C+w*.55},${C-w*.18} ${C+w*.5},${C+w*.1} ${C},${C+w*.42}Z`} fill={fill} stroke={stroke} strokeWidth={sw}/>
      {[[C,C+w*.42],[C-w*.5,C+w*.1],[C+w*.5,C+w*.1],[C-w*.28,C-w*.26],[C+w*.28,C-w*.26]].map(([x,y],i)=><line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.65}/>)}
      <ellipse cx={C} cy={C+w*.08} rx={R*.28} ry={R*.22} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw*.7}/>
      {highlight}</svg>;
  }
  // Fallback round
  const outer2 = radPts(8, R, -90), table2 = radPts(8, R*.42, -90);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{grad}
    <circle cx={C} cy={C} r={R} fill={fill} stroke={stroke} strokeWidth={sw}/>
    {outer2.map(([x,y],i)=><line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw*.7}/>)}
    <polygon points={table2.map(([x,y])=>`${x},${y}`).join(' ')} fill="white" fillOpacity=".65" stroke={facet} strokeWidth={sw*.7}/>
    {highlight}</svg>;
}

// CSS clip-path per shape (cuts the diamond SVG into the correct outline)
const SHAPE_CLIPS: Record<string, string> = {
  Round:    'circle(47% at 50% 50%)',
  Oval:     'ellipse(38% 47% at 50% 50%)',
  Princess: 'inset(3% round 2%)',
  Cushion:  'inset(3% round 20%)',
  Emerald:  'inset(5% 10% round 3%)',
  Radiant:  'polygon(8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%, 0% 8%)',
  Pear:     'polygon(50% 0%, 72% 14%, 95% 38%, 95% 68%, 78% 88%, 50% 100%, 22% 88%, 5% 68%, 5% 38%, 28% 14%)',
  Marquise: 'ellipse(48% 30% at 50% 50%)',
  Asscher:  'polygon(16% 0%, 84% 0%, 100% 16%, 100% 84%, 84% 100%, 16% 100%, 0% 84%, 0% 16%)',
  Heart:    'polygon(50% 10%, 65% 0%, 82% 5%, 95% 22%, 92% 45%, 78% 65%, 50% 100%, 22% 65%, 8% 45%, 5% 22%, 18% 5%, 35% 0%)',
};

// ── Metal constants ──────────────────────────────────────────────────────────
const METAL_FILTERS: Record<string, string> = {
  'yellow-gold': 'none',
  'white-gold':  'grayscale(0.78) brightness(1.18) contrast(1.06)',
  'rose-gold':   'sepia(0.28) saturate(1.55) hue-rotate(-12deg) brightness(1.04)',
  platinum:      'grayscale(0.92) brightness(1.22) contrast(1.10)',
  silver:        'grayscale(0.72) brightness(1.12) saturate(0.35)',
};
const METAL_COLORS: Record<string, string> = {
  'yellow-gold': '#D4A843', 'white-gold': '#D8D8D8',
  'rose-gold':   '#E8A090', platinum:    '#A8A8BC', silver: '#C0C0C0',
};
const METAL_LABELS: Record<string, string> = {
  'yellow-gold': 'Yellow Gold', 'white-gold': 'White Gold',
  'rose-gold':   'Rose Gold',   platinum:     'Platinum', silver: 'Silver',
};

// ── Virtual angle views (CSS 3D perspective on a single image) ───────────────
// This creates the illusion of multiple ring angles without needing actual
// multi-angle product photography. Blue Nile uses pre-rendered 3D models;
// we simulate it with CSS perspective transforms.
const ANGLE_VIEWS = [
  { label: 'Front',  style: {} },
  { label: '45°',    style: { transform: 'perspective(720px) rotateY(34deg) scale(0.86)',     transformOrigin: 'center' } },
  { label: '135°',   style: { transform: 'perspective(720px) rotateY(-34deg) scale(0.86)',    transformOrigin: 'center' } },
  { label: 'Top',    style: { transform: 'perspective(720px) rotateX(28deg) scale(0.88)',     transformOrigin: 'center' } },
];

// ── Style pickers ────────────────────────────────────────────────────────────
const HEAD_STYLES = [
  { key: 'four-claw',    label: '4-Prong',      mod: 0   },
  { key: 'six-claw',     label: '6-Prong',      mod: 45  },
  { key: 'bezel',        label: 'Bezel',         mod: 75  },
  { key: 'pave',         label: 'Pavé',          mod: 140 },
  { key: 'halo',         label: 'Halo',          mod: 195 },
  { key: 'hidden-halo',  label: 'Hidden Halo',   mod: 165 },
  { key: 'classic-halo', label: 'Classic Halo',  mod: 175 },
  { key: 'floral-halo',  label: 'Floral Halo',   mod: 185 },
  { key: 'dual-halo',    label: 'Dual Halo',     mod: 220 },
  { key: 'plain',        label: 'Plain',         mod: 0   },
];
const BAND_STYLES = [
  { key: 'plain',       label: 'Solitaire',   mod: 0   },
  { key: 'knife-edge',  label: 'Knife Edge',  mod: 35  },
  { key: 'pave',        label: 'Pavé',        mod: 110 },
  { key: 'half-pave',   label: 'Half Pavé',   mod: 65  },
  { key: 'channel',     label: 'Channel',     mod: 80  },
  { key: 'twisted',     label: 'Twisted',     mod: 75  },
  { key: 'three-stone', label: 'Triple Row',  mod: 120 },
  { key: 'baguette',    label: 'Baguette',    mod: 100 },
  { key: 'floating',    label: 'Floating',    mod: 60  },
];
const SHAPES = ['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Pear', 'Radiant', 'Asscher', 'Marquise', 'Heart'];

// ── Tiny shape SVG icons ─────────────────────────────────────────────────────
const ShapeSVG = ({ shape, active, size = 22 }: { shape: string; active: boolean; size?: number }) => {
  const cls = `transition-colors ${active ? 'fill-charcoal' : 'fill-gray-300 group-hover:fill-gray-500'}`;
  const s = shape.toLowerCase();
  const c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={cls}>
      {s === 'round'    && <circle cx={c} cy={c} r={c * 0.82} />}
      {s === 'princess' && <rect x={c * 0.22} y={c * 0.22} width={c * 1.56} height={c * 1.56} />}
      {s === 'cushion'  && <rect x={c * 0.22} y={c * 0.22} width={c * 1.56} height={c * 1.56} rx={size * 0.17} />}
      {s === 'oval'     && <ellipse cx={c} cy={c} rx={c * 0.58} ry={c * 0.82} />}
      {s === 'emerald'  && <rect x={c * 0.43} y={c * 0.12} width={c * 1.14} height={c * 1.62} rx={size * 0.05} />}
      {s === 'pear'     && <path d={`M${c},${size * 0.88} C${size * 0.12},${size * 0.62} ${size * 0.12},${size * 0.3} ${c},${size * 0.12} C${size * 0.88},${size * 0.3} ${size * 0.88},${size * 0.62} ${c},${size * 0.88}Z`} />}
      {s === 'radiant'  && <polygon points={`${c},${size * 0.06} ${size * 0.88},${size * 0.22} ${size * 0.94},${size * 0.78} ${c},${size * 0.94} ${size * 0.06},${size * 0.78} ${size * 0.12},${size * 0.22}`} />}
      {s === 'asscher'  && <polygon points={`${c * 0.6},${size * 0.05} ${c * 1.4},${size * 0.05} ${size * 0.95},${c * 0.6} ${size * 0.95},${c * 1.4} ${c * 1.4},${size * 0.95} ${c * 0.6},${size * 0.95} ${size * 0.05},${c * 1.4} ${size * 0.05},${c * 0.6}`} />}
      {s === 'marquise' && <path d={`M${c},${size * 0.08} C${size * 0.88},${c} ${c},${size * 0.92} ${size * 0.12},${c} C${size * 0.12},${size * 0.3} ${c},${size * 0.08} ${c},${size * 0.08}Z`} />}
      {s === 'heart'    && <path d={`M${c},${size * 0.85} C${size * 0.04},${size * 0.55} ${size * 0.04},${size * 0.22} ${c * 0.72},${size * 0.18} C${c},${size * 0.1} ${c * 1.28},${size * 0.18} ${c * 1.72},${size * 0.18} C${size * 0.96},${size * 0.22} ${size * 0.96},${size * 0.55} ${c},${size * 0.85}Z`} />}
    </svg>
  );
};

// ── Live Creative Studio Compositor ─────────────────────────────────────────
// Four-tab studio: 3D (Three.js), Ring (CSS filter), Diamond (Loupe360), Combined
function LiveStudioCompositor({
  images, metalFilter, shape, angleIdx, setAngleIdx, onSpin, selectedDiamond, activeMetal,
}: {
  images: string[];
  metalFilter: string;
  shape: string;
  angleIdx: number;
  setAngleIdx: (i: number) => void;
  onSpin: () => void;
  activeMetal?: string;
  selectedDiamond?: { loupe360?: string; videoUrl?: string; imageUrl?: string; shape?: string; caratWeight?: number } | null;
}) {
  const [studioTab, setStudioTab] = useState<'3d'|'ring'|'diamond'|'combined'>('3d');
  const ringImg     = images[0] || '';
  const activeAngle = ANGLE_VIEWS[angleIdx];

  // Diamond display source priority: Loupe360 > video > imageUrl > shape photo
  const hasDiamondLoupe = !!(selectedDiamond?.loupe360);
  const hasDiamondVideo = !!(selectedDiamond?.videoUrl);

  return (
    <div className="w-full">

      {/* ── Studio tab bar ── */}
      <div className="flex border-b border-gray-200 mb-2">
        {[
          { key: '3d'       as const, label: '3D View',  Icon: Box     },
          { key: 'combined' as const, label: 'Combined', Icon: Layers  },
          { key: 'ring'     as const, label: 'Ring',     Icon: Gem     },
          { key: 'diamond'  as const, label: 'Diamond',  Icon: Diamond },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setStudioTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-sans font-medium border-b-2 -mb-px transition-colors',
              studioTab === key
                ? 'border-charcoal text-charcoal'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
        {/* Studio badge right */}
        <div className="ml-auto flex items-center gap-1 pr-2">
          <Sparkles size={9} className="text-gold-500" />
          <span className="text-[8px] font-sans tracking-widest uppercase text-gray-400">Creative Studio</span>
        </div>
      </div>

      {/* ── Main canvas ── */}
      <div className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden border border-gray-100"
        style={{ aspectRatio: studioTab === '3d' ? 'unset' : '1 / 1', minHeight: studioTab === '3d' ? 380 : undefined }}>

        {/* 3D TAB — Real Three.js ring configurator */}
        {studioTab === '3d' && (
          <Ring3DViewer
            metal={activeMetal}
            diamondShape={selectedDiamond?.shape || shape}
            caratWeight={selectedDiamond?.caratWeight || 1.0}
            className="w-full"
          />
        )}

        {/* DIAMOND TAB */}
        {studioTab === 'diamond' && (
          <div className="absolute inset-0">
            {hasDiamondLoupe ? (
              <iframe
                src={selectedDiamond!.loupe360}
                className="w-full h-full border-0"
                allow="accelerometer; gyroscope"
                title="360° Diamond View"
              />
            ) : hasDiamondVideo ? (
              <video
                src={selectedDiamond!.videoUrl}
                autoPlay muted loop playsInline
                className="w-full h-full object-cover"
              />
            ) : selectedDiamond?.imageUrl ? (
              <Image
                src={selectedDiamond.imageUrl}
                alt={`${shape} diamond`}
                fill
                className="object-contain p-8"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#f0f7ff]">
                <DiamondSVG shape={selectedDiamond?.shape || shape} size={220} />
              </div>
            )}
            {hasDiamondLoupe && (
              <div className="absolute top-3 left-3 bg-blue-600 text-white text-[9px] font-sans font-bold px-2 py-1">
                LIVE 360° VIEW
              </div>
            )}
            {!hasDiamondLoupe && !hasDiamondVideo && !selectedDiamond?.imageUrl && (
              <div className="absolute top-3 left-3 bg-[#e8f3ff] border border-[#b8d8f0] text-[9px] font-sans px-2 py-1 text-[#3a7abf]">
                Select a diamond for live view
              </div>
            )}
          </div>
        )}

        {/* RING TAB */}
        {studioTab === 'ring' && (
          <>
            {ringImg ? (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ filter: metalFilter, transition: 'filter 0.45s ease' }}>
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ ...activeAngle.style, transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>
                  <Image src={ringImg} alt="Ring setting" fill className="object-contain p-8" priority />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-24 h-24 opacity-20">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#888" strokeWidth="7" />
                </svg>
              </div>
            )}
          </>
        )}

        {/* COMBINED TAB */}
        {studioTab === 'combined' && (
          <>
            {ringImg ? (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ filter: metalFilter, transition: 'filter 0.45s ease' }}>
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ ...activeAngle.style, transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>
                  <Image src={ringImg} alt="Ring setting" fill className="object-contain p-8" priority />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-24 h-24 opacity-20">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#888" strokeWidth="7" />
                </svg>
              </div>
            )}
            {/* Diamond overlay — SVG illustration clipped to shape */}
            {ringImg && (
              <div className="absolute z-10 pointer-events-none"
                style={{
                  top: '30%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '19%', aspectRatio: '1 / 1',
                  clipPath: SHAPE_CLIPS[shape] || SHAPE_CLIPS.Round,
                  transition: 'clip-path 0.4s ease',
                  mixBlendMode: 'screen',
                  filter: 'brightness(1.5) contrast(1.2)',
                }}>
                <DiamondSVG shape={shape} size={80} />
              </div>
            )}
          </>
        )}

        {/* 360° spin button (ring/combined tabs only) */}
        {(studioTab === 'ring' || studioTab === 'combined') && (
          <button onClick={onSpin}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 px-2.5 py-1.5 text-[10px] font-sans font-medium text-charcoal hover:bg-white shadow-sm transition-colors">
            <RotateCcw size={11} /> 360°
          </button>
        )}

        {/* Shape badge */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-white/85 border border-gray-100 px-2 py-1">
          <ShapeSVG shape={shape} active size={11} />
          <span className="text-[9px] font-sans text-charcoal">{shape}</span>
        </div>
      </div>

      {/* ── 4 virtual-angle thumbnails (ring + combined tabs only) ── */}
      {(studioTab === 'ring' || studioTab === 'combined') && (
        <div className="grid grid-cols-4 gap-1.5 mt-1.5">
          {ANGLE_VIEWS.map((view, i) => (
            <button key={i} onClick={() => setAngleIdx(i)}
              className={cn(
                'relative aspect-square bg-gradient-to-br from-gray-50 to-white overflow-hidden border-2 transition-all',
                i === angleIdx ? 'border-charcoal shadow-sm' : 'border-gray-100 hover:border-gray-300'
              )}>
              {ringImg && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{ filter: metalFilter, transition: 'filter 0.4s ease' }}>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ ...view.style }}>
                    <Image src={ringImg} alt={`${view.label} view`} fill className="object-contain p-2" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-white/70 py-0.5 text-center">
                <span className="text-[8px] font-sans text-charcoal">{view.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Spec strip */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[
          { label: 'Band Width',       value: '~2.0 mm' },
          { label: 'Setting Height',   value: '~6.5 mm' },
          { label: 'Estimated Weight', value: '~3.8 g'  },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 border border-gray-100 px-2 py-2 text-center">
            <p className="text-[9px] font-sans uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-[11px] font-sans font-medium text-charcoal mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Style tile (Blue Nile spec: 104px tall, icon area 62px, label 11px) ───────
function StyleTile({ label, active, onClick, mod }: {
  label: string; active: boolean; onClick: () => void; mod?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center justify-center gap-1.5 border text-center transition-all',
        'h-[104px] px-1',
        active ? 'border-charcoal bg-charcoal/[0.04]' : 'border-gray-200 hover:border-gray-400'
      )}
    >
      {/* 62px icon area — simple ring-style SVG silhouettes */}
      <div className="h-[62px] flex items-center justify-center">
        <div className={cn(
          'w-8 h-8 rounded-full border-[3px] transition-colors',
          active ? 'border-charcoal' : 'border-gray-300 group-hover:border-gray-500'
        )}>
          {active && (
            <div className="w-full h-full rounded-full flex items-center justify-center">
              <Check size={12} className="text-charcoal" />
            </div>
          )}
        </div>
      </div>
      <span className={cn(
        'text-[11px] font-sans leading-tight capitalize',
        active ? 'text-charcoal font-semibold' : 'text-gray-500'
      )}>
        {label}
      </span>
      {mod != null && mod > 0 && (
        <span className="text-[9px] text-gold-600 font-sans">+£{mod}</span>
      )}
    </button>
  );
}

// ── Main SettingDetailClient ─────────────────────────────────────────────────
export default function SettingDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const {
    setSetting, selectedMetal, selectedHead, selectedBand,
    setMetal, setHead, setBand, setPreviewShape, previewShape,
    diamond: selectedDiamond,
  } = useRingBuilder();

  const [angleIdx, setAngleIdx] = useState(0);
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSpin = useCallback(() => {
    if (spinRef.current) clearInterval(spinRef.current);
    let i = 0;
    spinRef.current = setInterval(() => {
      i = (i + 1) % ANGLE_VIEWS.length;
      setAngleIdx(i);
      if (i === ANGLE_VIEWS.length - 1) {
        clearInterval(spinRef.current!);
        spinRef.current = null;
      }
    }, 600);
  }, []);

  // Cleanup interval on unmount
  useEffect(() => () => { if (spinRef.current) clearInterval(spinRef.current); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
    retry: 2,
  });
  const product = data?.data as IProduct | undefined;

  // Resolve active metal (defaults to the product's default metal on first load)
  const defaultMetal = product?.metalOptions?.find(m => m.isDefault)?.type
                    || product?.metalOptions?.[0]?.type
                    || '';
  const activeMetal  = selectedMetal || defaultMetal;
  const metalOption  = product?.metalOptions?.find(m => m.type === activeMetal);

  // If a metal option has its own photos, use those; otherwise apply CSS filter on base images
  const hasMetalImg = (metalOption?.images?.length ?? 0) > 0;
  const displayImgs = hasMetalImg ? metalOption!.images! : (product?.images || []);
  const metalFilter = !hasMetalImg ? (METAL_FILTERS[activeMetal] || 'none') : 'none';

  // Derived pricing
  const settingBase = product ? (product.salePrice ?? product.basePrice) : 0;
  const headMod     = HEAD_STYLES.find(h => h.key === selectedHead)?.mod ?? 0;
  const bandMod     = BAND_STYLES.find(b => b.key === selectedBand)?.mod ?? 0;
  const metalMod    = metalOption?.priceModifier ?? 0;
  const ringPrice   = settingBase + headMod + bandMod + metalMod;

  const handleSelectSetting = () => {
    if (!product) return;
    setSetting(product, activeMetal);
    router.push('/custom-ring/diamonds');
  };

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <BuilderHeader />
        <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 animate-pulse rounded" />
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" style={{ width: `${70 + i * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!product) {
    return (
      <div className="bg-white min-h-screen">
        <BuilderHeader />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-400">
          <p className="font-serif text-lg mb-3">Setting not found</p>
          <Link href="/custom-ring/settings" className="text-xs text-charcoal underline">
            ← Browse all settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <BuilderHeader />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8">
        <Link
          href="/custom-ring/settings"
          className="text-xs text-gray-400 hover:text-charcoal flex items-center gap-1 mb-6 transition-colors w-fit"
        >
          <ChevronLeft size={13} /> All Settings
        </Link>

        {/* Blue Nile layout: 630px left · 560px right with 60px gap */}
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-[60px]">

          {/* ── LEFT: Creative Studio live compositor (630px) ── */}
          <div className="w-full lg:w-[630px] flex-shrink-0">
            <LiveStudioCompositor
              images={displayImgs}
              metalFilter={metalFilter}
              shape={previewShape}
              angleIdx={angleIdx}
              setAngleIdx={setAngleIdx}
              onSpin={handleSpin}
              selectedDiamond={selectedDiamond}
              activeMetal={activeMetal}
            />
          </div>

          {/* ── RIGHT: Customiser (560px) ── */}
          <div className="flex-1 lg:max-w-[560px] space-y-6 lg:sticky top-[88px] self-start max-h-[calc(100vh-88px)] overflow-y-auto pb-8 pr-1 mt-8 lg:mt-0">

            {/* Name + price */}
            <div>
              <p className="text-[10px] font-sans tracking-widest uppercase text-gray-400 mb-1">
                Engagement Ring Setting
              </p>
              <h1 className="font-serif text-2xl font-light text-charcoal leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-3 mt-2">
                <p className="font-serif text-2xl font-light text-charcoal">{formatPrice(ringPrice)}</p>
                <p className="text-xs text-gray-400 font-sans">Setting only · diamond priced separately</p>
              </div>
              {product.competitorPrice && product.competitorPrice > ringPrice && (
                <p className="text-xs text-emerald-600 font-sans mt-1">
                  Save {formatPrice(product.competitorPrice - ringPrice)} vs high street
                </p>
              )}
            </div>

            {/* ── Centre Stone Shape ── */}
            <div>
              <p className="text-[11px] font-sans font-semibold tracking-[0.08em] uppercase text-charcoal mb-0.5">
                Shape
                <span className="ml-1.5 font-normal normal-case text-gray-400">— {previewShape}</span>
              </p>
              <p className="text-[11px] text-gray-400 font-sans mb-3">
                Select a shape to update the live preview
              </p>
              {/* Blue Nile: 90px tall tiles, 40px icon, 5 per row */}
              <div className="grid grid-cols-5 gap-2">
                {SHAPES.map(shape => (
                  <button
                    key={shape}
                    onClick={() => setPreviewShape(shape)}
                    className={cn(
                      'group flex flex-col items-center justify-center gap-2 border transition-all',
                      'h-[90px]',
                      previewShape === shape
                        ? 'border-charcoal bg-charcoal/[0.04]'
                        : 'border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <ShapeSVG shape={shape} active={previewShape === shape} size={40} />
                    <span className={cn(
                      'text-[11px] font-sans capitalize leading-tight',
                      previewShape === shape ? 'text-charcoal font-medium' : 'text-gray-500'
                    )}>
                      {shape}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Metal selector ── */}
            {(product.metalOptions?.length ?? 0) > 0 && (
              <div>
                <p className="text-[11px] font-sans font-semibold tracking-[0.08em] uppercase text-charcoal mb-3">
                  Metal
                  <span className="ml-1.5 font-normal normal-case text-gray-400">
                    — {metalOption?.karat ? `${metalOption.karat} ` : ''}{METAL_LABELS[activeMetal] || activeMetal}
                  </span>
                </p>
                {/* Blue Nile: 52px wide container, 28px SVG circles */}
                <div className="flex gap-2 flex-wrap">
                  {product.metalOptions.map(m => (
                    <button
                      key={m.type}
                      onClick={() => setMetal(m.type)}
                      title={`${m.karat ? m.karat + ' ' : ''}${METAL_LABELS[m.type] || m.type}`}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 border transition-all',
                        'w-[52px] h-[52px]',
                        activeMetal === m.type
                          ? 'border-charcoal bg-charcoal/[0.04]'
                          : 'border-gray-200 hover:border-gray-400'
                      )}
                    >
                      {/* 28×28 SVG circle swatch */}
                      <svg width="28" height="28" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r="13" fill={METAL_COLORS[m.type] || '#D4A843'} stroke={activeMetal === m.type ? '#333D29' : '#e5e7eb'} strokeWidth="1.5" />
                      </svg>
                      <span className={cn(
                        'text-[9px] font-sans leading-none',
                        activeMetal === m.type ? 'text-charcoal font-semibold' : 'text-gray-400'
                      )}>
                        {m.karat || 'Plat'}
                      </span>
                    </button>
                  ))}
                </div>
                {metalMod > 0 && (
                  <p className="text-[10px] text-gold-600 font-sans mt-1.5">+{formatPrice(metalMod)} for this metal</p>
                )}
              </div>
            )}

            {/* ── Head Style ── */}
            <div>
              <p className="text-[11px] font-sans font-semibold tracking-[0.08em] uppercase text-charcoal mb-3">
                Head Style
                <span className="ml-1.5 font-normal normal-case text-gray-400">
                  — {HEAD_STYLES.find(h => h.key === selectedHead)?.label}
                </span>
              </p>
              {/* Blue Nile: 104px tall, 62px icon area, 5 per row */}
              <div className="grid grid-cols-5 gap-2">
                {HEAD_STYLES.map(h => (
                  <StyleTile
                    key={h.key}
                    label={h.label}
                    active={selectedHead === h.key}
                    onClick={() => setHead(h.key)}
                    mod={h.mod}
                  />
                ))}
              </div>
            </div>

            {/* ── Band Style ── */}
            <div>
              <p className="text-[11px] font-sans font-semibold tracking-[0.08em] uppercase text-charcoal mb-3">
                Band Style
                <span className="ml-1.5 font-normal normal-case text-gray-400">
                  — {BAND_STYLES.find(b => b.key === selectedBand)?.label}
                </span>
              </p>
              <div className="grid grid-cols-5 gap-2">
                {BAND_STYLES.map(b => (
                  <StyleTile
                    key={b.key}
                    label={b.label}
                    active={selectedBand === b.key}
                    onClick={() => setBand(b.key)}
                    mod={b.mod}
                  />
                ))}
              </div>
            </div>

            {/* ── Price breakdown ── */}
            <div className="bg-gray-50 border border-gray-100 p-4 text-xs font-sans space-y-1.5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-2.5">Price Breakdown</p>
              <div className="flex justify-between text-gray-500">
                <span>Base setting</span>
                <span>{formatPrice(settingBase)}</span>
              </div>
              {headMod > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Head style (+{HEAD_STYLES.find(h => h.key === selectedHead)?.label})</span>
                  <span>+{formatPrice(headMod)}</span>
                </div>
              )}
              {bandMod > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Band style (+{BAND_STYLES.find(b => b.key === selectedBand)?.label})</span>
                  <span>+{formatPrice(bandMod)}</span>
                </div>
              )}
              {metalMod !== 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Metal</span>
                  <span>{metalMod > 0 ? '+' : ''}{formatPrice(metalMod)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-sm text-charcoal">
                <span>Setting total</span>
                <span>{formatPrice(ringPrice)}</span>
              </div>
              <p className="text-[9px] text-gray-400 pt-1">
                Diamond priced separately in Step 2 · Includes VAT
              </p>
            </div>

            {/* ── CTAs ── */}
            <div className="space-y-2">
              <button
                onClick={handleSelectSetting}
                className="w-full py-4 bg-charcoal text-white text-sm font-sans font-medium tracking-wider hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                SELECT THIS SETTING <ChevronRight size={15} />
              </button>
              <Link
                href="/contact"
                className="w-full py-3 border border-gray-300 text-sm font-sans font-medium text-charcoal hover:border-charcoal transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={14} /> CHAT WITH AN EXPERT
              </Link>
            </div>

            {/* ── Trust badges ── */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              {[
                { I: Truck,     t: 'Free Shipping',   s: 'Insured & tracked' },
                { I: Award,     t: 'Cert. Appraisal', s: 'Included free'     },
                { I: RefreshCw, t: 'Free Returns',    s: '30-day policy'     },
                { I: Heart,     t: 'Lifetime Care',   s: 'Complimentary'     },
              ].map(({ I, t, s }) => (
                <div key={t} className="flex items-start gap-2">
                  <I size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-sans font-semibold text-charcoal">{t}</p>
                    <p className="text-[10px] text-gray-400 font-sans">{s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
