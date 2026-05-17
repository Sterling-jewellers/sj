'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
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

// ── Centre-stone overlay SVG (responsive, viewBox 0-100, no fixed px size) ───
// Rendered on top of the ring photo to simulate the chosen diamond shape.
function CentreStoneSVG({ shape }: { shape: string }) {
  const s = shape?.toLowerCase() || 'round';
  const C = 50, R = 43;
  const sw = 0.85;
  const id = `cso-${s}`;
  const grad = (
    <defs>
      <radialGradient id={id} cx="35%" cy="28%" r="75%">
        <stop offset="0%"   stopColor="#ffffff" />
        <stop offset="28%"  stopColor="#f4fbff" />
        <stop offset="62%"  stopColor="#c8e8f8" />
        <stop offset="100%" stopColor="#82b8e0" />
      </radialGradient>
    </defs>
  );
  const fill = `url(#${id})`, stroke = '#4a80aa', facet = '#78aece';
  const hi = (
    <ellipse cx={C * 0.80} cy={C * 0.72} rx={R * 0.22} ry={R * 0.12}
      fill="white" opacity="0.65" transform={`rotate(-38 ${C * 0.80} ${C * 0.72})`} />
  );
  const radPts = (n: number, r: number, off = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((i * 360) / n + off) * Math.PI / 180;
      return [C + r * Math.cos(a), C + r * Math.sin(a)] as [number, number];
    });

  let body: ReactNode;
  if (s === 'round') {
    const outer = radPts(8, R, -90), table = radPts(8, R * 0.42, -90), mid = radPts(8, R, -67.5);
    body = <>
      <circle cx={C} cy={C} r={R} fill={fill} stroke={stroke} strokeWidth={sw} />
      {outer.map(([x, y], i) => <line key={`o${i}`} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
      {mid.map(([x, y], i) => <line key={`m${i}`} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.4} opacity=".5" />)}
      <polygon points={table.map(([x, y]) => `${x},${y}`).join(' ')} fill="white" fillOpacity=".65" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  } else if (s === 'oval') {
    const pts = radPts(8, R, -90).map(([x, y]) => [C + (x - C) * 0.68, y] as [number, number]);
    const tbl = radPts(8, R * 0.42, -90).map(([x, y]) => [C + (x - C) * 0.68, y] as [number, number]);
    body = <>
      <ellipse cx={C} cy={C} rx={R * 0.68} ry={R} fill={fill} stroke={stroke} strokeWidth={sw} />
      {pts.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
      <polygon points={tbl.map(([x, y]) => `${x},${y}`).join(' ')} fill="white" fillOpacity=".65" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  } else if (s === 'princess' || s === 'cushion') {
    const h2 = R * 1.88, x0 = C - h2 / 2, y0 = C - h2 / 2, ti = h2 * 0.3, cr = s === 'cushion' ? h2 * 0.2 : 2;
    body = <>
      <rect x={x0} y={y0} width={h2} height={h2} rx={cr} fill={fill} stroke={stroke} strokeWidth={sw} />
      {([[x0, y0], [x0 + h2, y0], [x0 + h2, y0 + h2], [x0, y0 + h2]] as [number, number][]).map(([x, y], i) =>
        <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
      <rect x={x0 + ti} y={y0 + ti} width={h2 - ti * 2} height={h2 - ti * 2} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  } else if (s === 'emerald' || s === 'asscher') {
    const w = s === 'emerald' ? R * 1.5 : R * 1.88, h2 = s === 'emerald' ? R * 2.0 : R * 1.88;
    const x0 = C - w / 2, y0 = C - h2 / 2, cut = w * 0.12;
    const pts: [number, number][] = [
      [x0 + cut, y0], [x0 + w - cut, y0], [x0 + w, y0 + cut], [x0 + w, y0 + h2 - cut],
      [x0 + w - cut, y0 + h2], [x0 + cut, y0 + h2], [x0, y0 + h2 - cut], [x0, y0 + cut],
    ];
    body = <>
      <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} />
      {[0.2, 0.35, 0.5].map((t, i) =>
        <rect key={i} x={x0 + w * t} y={y0 + h2 * t} width={w * (1 - t * 2)} height={h2 * (1 - t * 2)}
          fill="none" stroke={facet} strokeWidth={sw * (0.7 - i * 0.15)} opacity={0.7 - i * 0.1} />)}
      {hi}
    </>;
  } else if (s === 'radiant') {
    const w = R * 1.5, h2 = R * 2.0, x0 = C - w / 2, y0 = C - h2 / 2, cut = w * 0.12, ti = w * 0.3;
    const pts: [number, number][] = [
      [x0 + cut, y0], [x0 + w - cut, y0], [x0 + w, y0 + cut], [x0 + w, y0 + h2 - cut],
      [x0 + w - cut, y0 + h2], [x0 + cut, y0 + h2], [x0, y0 + h2 - cut], [x0, y0 + cut],
    ];
    body = <>
      <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} />
      {pts.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.5} opacity=".6" />)}
      <rect x={x0 + ti} y={y0 + h2 * 0.3} width={w - ti * 2} height={h2 * 0.4} fill="white" fillOpacity=".55" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  } else if (s === 'pear') {
    const px = C, py = C - R * 0.9, bx = C, by = C + R * 0.9, lx = C - R * 0.62, ly = C + R * 0.1, rx2 = C + R * 0.62, ry2 = C + R * 0.1;
    body = <>
      <path d={`M${px},${py} C${rx2},${C - R * 0.5} ${rx2},${ry2} ${bx},${by} C${lx},${ry2} ${lx},${C - R * 0.5} ${px},${py}Z`} fill={fill} stroke={stroke} strokeWidth={sw} />
      {[[px, py], [lx, ly], [rx2, ry2], [bx, by]].map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
      <ellipse cx={C} cy={C + R * 0.1} rx={R * 0.3} ry={R * 0.25} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  } else if (s === 'marquise') {
    const lx = C - R, rx2 = C + R, ty = C - R * 0.42, by2 = C + R * 0.42;
    body = <>
      <path d={`M${lx},${C} C${lx},${ty} ${rx2},${ty} ${rx2},${C} C${rx2},${by2} ${lx},${by2} ${lx},${C}Z`} fill={fill} stroke={stroke} strokeWidth={sw} />
      {[[lx, C], [rx2, C], [C, ty], [C, by2]].map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
      <ellipse cx={C} cy={C} rx={R * 0.32} ry={R * 0.18} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  } else if (s === 'heart') {
    const w = R * 1.7;
    body = <>
      <path d={`M${C},${C + w * 0.42} C${C - w * 0.5},${C + w * 0.1} ${C - w * 0.55},${C - w * 0.18} ${C - w * 0.28},${C - w * 0.26} C${C - w * 0.08},${C - w * 0.34} ${C},${C - w * 0.18} ${C},${C - w * 0.05} C${C},${C - w * 0.18} ${C + w * 0.08},${C - w * 0.34} ${C + w * 0.28},${C - w * 0.26} C${C + w * 0.55},${C - w * 0.18} ${C + w * 0.5},${C + w * 0.1} ${C},${C + w * 0.42}Z`} fill={fill} stroke={stroke} strokeWidth={sw} />
      {[[C, C + w * 0.42], [C - w * 0.5, C + w * 0.1], [C + w * 0.5, C + w * 0.1], [C - w * 0.28, C - w * 0.26], [C + w * 0.28, C - w * 0.26]].map(([x, y], i) =>
        <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.65} />)}
      <ellipse cx={C} cy={C + w * 0.08} rx={R * 0.28} ry={R * 0.22} fill="white" fillOpacity=".6" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  } else {
    // Fallback: round
    const outer = radPts(8, R, -90), table = radPts(8, R * 0.42, -90);
    body = <>
      <circle cx={C} cy={C} r={R} fill={fill} stroke={stroke} strokeWidth={sw} />
      {outer.map(([x, y], i) => <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={facet} strokeWidth={sw * 0.7} />)}
      <polygon points={table.map(([x, y]) => `${x},${y}`).join(' ')} fill="white" fillOpacity=".65" stroke={facet} strokeWidth={sw * 0.7} />
      {hi}
    </>;
  }
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {grad}{body}
    </svg>
  );
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

// ── Virtual angle views — simulate multi-angle photography via CSS perspective ─
const ANGLE_VIEWS = [
  { label: 'Front',   transformStyle: {} },
  { label: '45°',     transformStyle: { transform: 'perspective(800px) rotateY(32deg) scale(0.88)',  transformOrigin: 'center' } },
  { label: 'Side',    transformStyle: { transform: 'perspective(800px) rotateY(62deg) scale(0.82)',  transformOrigin: 'center' } },
  { label: 'Top',     transformStyle: { transform: 'perspective(800px) rotateX(30deg) scale(0.87)',  transformOrigin: 'center' } },
  { label: 'Tilt',    transformStyle: { transform: 'perspective(800px) rotateX(-20deg) rotateY(25deg) scale(0.84)', transformOrigin: 'center' } },
];

// ── Style pickers ────────────────────────────────────────────────────────────
// (toSettingStyle removed — Ring3DViewer now accepts headStyle/bandStyle directly)
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

// ── Diamond Shape Icons — technical line-art cuts (48×48 viewBox, scales to `size`) ──
// Each shows: girdle outline + table polygon/shape + main facet spokes (like a real grading diagram)
const ShapeSVG = ({ shape, active, size = 22 }: { shape: string; active: boolean; size?: number }) => {
  const c  = active ? '#1a1a1a' : '#adb5bd';
  const sw = 1.15;
  const s  = shape.toLowerCase();
  // shared stroke props for outline, table, and spokes
  const outline = { fill: 'none', stroke: c, strokeWidth: sw,       strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const table   = { fill: 'none', stroke: c, strokeWidth: sw * 0.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const spk     = { stroke: c, strokeWidth: sw * 0.38, opacity: 0.55, strokeLinecap: 'round' as const };
  // polar helper: angle from 12-o'clock, cx/cy centre, r radius → [x, y]
  const P = (deg: number, r: number, cx = 24, cy = 24): [number, number] => [
    cx + r * Math.cos((deg - 90) * Math.PI / 180),
    cy + r * Math.sin((deg - 90) * Math.PI / 180),
  ];
  // draw N spokes from outer ring points to inner table points
  const spokes = (outer: [number,number][], inner: [number,number][]) =>
    outer.map(([ox, oy], i) => <line key={i} x1={ox} y1={oy} x2={inner[i % inner.length][0]} y2={inner[i % inner.length][1]} {...spk} />);

  if (s === 'round') {
    // Girdle circle r=20, table octagon at r=11 offset 22.5°, 8 facet spokes
    const G = Array.from({length:8}, (_,i) => P(i*45, 20));
    const T = Array.from({length:8}, (_,i) => P(i*45+22.5, 11));
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <circle cx="24" cy="24" r="20" {...outline} />
      <polygon points={T.map(p => p.join(',')).join(' ')} {...table} />
      {spokes(G, T)}
    </svg>;
  }

  if (s === 'oval') {
    // Girdle ellipse rx=14 ry=20, table ellipse rx=7.5 ry=11, 8 spokes
    const G = Array.from({length:8}, (_,i) => { const a=(i*45-90)*Math.PI/180; return [24+14*Math.cos(a), 24+20*Math.sin(a)] as [number,number]; });
    const T = Array.from({length:8}, (_,i) => { const a=((i*45+22.5)-90)*Math.PI/180; return [24+7.5*Math.cos(a), 24+11*Math.sin(a)] as [number,number]; });
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <ellipse cx="24" cy="24" rx="14" ry="20" {...outline} />
      <polygon points={T.map(p => p.join(',')).join(' ')} {...table} />
      {spokes(G, T)}
    </svg>;
  }

  if (s === 'princess') {
    // Square girdle, square table, 8 spokes (4 corners + 4 mid-edges)
    const G: [number,number][] = [[4,4],[44,4],[44,44],[4,44]];
    const M: [number,number][] = [[24,4],[44,24],[24,44],[4,24]]; // mid-edge outer
    const Tc: [number,number][] = [[13,13],[35,13],[35,35],[13,35]]; // table corners
    const Tm: [number,number][] = [[24,13],[35,24],[24,35],[13,24]]; // table mid-edge
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <rect x="4" y="4" width="40" height="40" {...outline} />
      <rect x="13" y="13" width="22" height="22" {...table} />
      {G.map(([x,y],i) => <line key={`c${i}`} x1={x} y1={y} x2={Tc[i][0]} y2={Tc[i][1]} {...spk} />)}
      {M.map(([x,y],i) => <line key={`m${i}`} x1={x} y1={y} x2={Tm[i][0]} y2={Tm[i][1]} {...spk} />)}
    </svg>;
  }

  if (s === 'cushion') {
    // Rounded square — same as princess with rx=8 on outer, rx=4 on table
    const G: [number,number][] = [[4,4],[44,4],[44,44],[4,44]];
    const M: [number,number][] = [[24,4],[44,24],[24,44],[4,24]];
    const Tc: [number,number][] = [[13,13],[35,13],[35,35],[13,35]];
    const Tm: [number,number][] = [[24,13],[35,24],[24,35],[13,24]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <rect x="4" y="4" width="40" height="40" rx="9" {...outline} />
      <rect x="13" y="13" width="22" height="22" rx="4" {...table} />
      {G.map(([x,y],i) => <line key={`c${i}`} x1={x} y1={y} x2={Tc[i][0]} y2={Tc[i][1]} {...spk} />)}
      {M.map(([x,y],i) => <line key={`m${i}`} x1={x} y1={y} x2={Tm[i][0]} y2={Tm[i][1]} {...spk} />)}
    </svg>;
  }

  if (s === 'emerald') {
    // Portrait step-cut: 3 concentric octagonal outlines (girdle + 2 step facets)
    const o: [number,number][] = [[16,4],[32,4],[39,11],[39,37],[32,44],[16,44],[9,37],[9,11]];
    const m: [number,number][] = [[17,9],[31,9],[36,14],[36,34],[31,39],[17,39],[12,34],[12,14]];
    const inn: [number,number][] = [[18,15],[30,15],[33,18],[33,30],[30,33],[18,33],[15,30],[15,18]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <polygon points={o.map(p=>p.join(',')).join(' ')} {...outline} />
      <polygon points={m.map(p=>p.join(',')).join(' ')} {...table} />
      <polygon points={inn.map(p=>p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={sw*0.4} opacity={0.7} />
    </svg>;
  }

  if (s === 'asscher') {
    // Square step-cut: 3 concentric square-octagons
    const o: [number,number][] = [[13,4],[35,4],[44,13],[44,35],[35,44],[13,44],[4,35],[4,13]];
    const m: [number,number][] = [[15,9],[33,9],[39,15],[39,33],[33,39],[15,39],[9,33],[9,15]];
    const inn: [number,number][] = [[17,15],[31,15],[33,17],[33,31],[31,33],[17,33],[15,31],[15,17]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <polygon points={o.map(p=>p.join(',')).join(' ')} {...outline} />
      <polygon points={m.map(p=>p.join(',')).join(' ')} {...table} />
      <polygon points={inn.map(p=>p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={sw*0.4} opacity={0.7} />
    </svg>;
  }

  if (s === 'radiant') {
    // Modified brilliant: octagonal outline + octagonal table + 8 facet spokes
    const o: [number,number][] = [[13,4],[35,4],[44,13],[44,35],[35,44],[13,44],[4,35],[4,13]];
    const t: [number,number][] = [[16,11],[32,11],[37,16],[37,32],[32,37],[16,37],[11,32],[11,16]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <polygon points={o.map(p=>p.join(',')).join(' ')} {...outline} />
      <polygon points={t.map(p=>p.join(',')).join(' ')} {...table} />
      {spokes(o, t)}
    </svg>;
  }

  if (s === 'pear') {
    // Teardrop: pointed bottom, rounded top lobe
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <path d="M24,44 C10,38 4,28 4,21 C4,12 13,4 24,4 C35,4 44,12 44,21 C44,28 38,38 24,44Z" {...outline} />
      <path d="M24,38 C13,33 10,25 10,21 C10,14 16,9 24,9 C32,9 38,14 38,21 C38,25 35,33 24,38Z" {...table} />
      <line x1="24" y1="4"  x2="24" y2="9"  {...spk} />
      <line x1="44" y1="21" x2="38" y2="21" {...spk} />
      <line x1="4"  y1="21" x2="10" y2="21" {...spk} />
      <line x1="24" y1="44" x2="24" y2="38" {...spk} />
      <line x1="9"  y1="9"  x2="15" y2="14" {...spk} />
      <line x1="39" y1="9"  x2="33" y2="14" {...spk} />
    </svg>;
  }

  if (s === 'marquise') {
    // Boat shape: pointed at both ends, widest at equator
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <path d="M24,3 C38,10 46,19 46,24 C46,29 38,38 24,45 C10,38 2,29 2,24 C2,19 10,10 24,3Z" {...outline} />
      <path d="M24,8 C36,13 41,19 41,24 C41,29 36,35 24,40 C12,35 7,29 7,24 C7,19 12,13 24,8Z" {...table} />
      <line x1="24" y1="3"  x2="24" y2="8"  {...spk} />
      <line x1="24" y1="45" x2="24" y2="40" {...spk} />
      <line x1="46" y1="24" x2="41" y2="24" {...spk} />
      <line x1="2"  y1="24" x2="7"  y2="24" {...spk} />
      <line x1="10" y1="10" x2="14" y2="14" {...spk} />
      <line x1="38" y1="10" x2="34" y2="14" {...spk} />
      <line x1="10" y1="38" x2="14" y2="34" {...spk} />
      <line x1="38" y1="38" x2="34" y2="34" {...spk} />
    </svg>;
  }

  if (s === 'heart') {
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <path d="M24,42 C5,30 2,19 2,15 C2,8 8,4 14,4 C18,4 22,6 24,10 C26,6 30,4 34,4 C40,4 46,8 46,15 C46,19 43,30 24,42Z" {...outline} />
      <path d="M24,35 C9,25 7,18 7,15 C7,11 10,8 14,8 C17,8 21,10 24,14 C27,10 31,8 34,8 C38,8 41,11 41,15 C41,18 39,25 24,35Z" {...table} />
      <line x1="24" y1="42" x2="24" y2="35" {...spk} />
      <line x1="2"  y1="15" x2="7"  y2="15" {...spk} />
      <line x1="46" y1="15" x2="41" y2="15" {...spk} />
      <line x1="4"  y1="7"  x2="9"  y2="11" {...spk} />
      <line x1="44" y1="7"  x2="39" y2="11" {...spk} />
    </svg>;
  }

  // fallback: plain circle
  return <svg viewBox="0 0 48 48" width={size} height={size}>
    <circle cx="24" cy="24" r="20" {...outline} />
  </svg>;
};

// ── Live Creative Studio Compositor ─────────────────────────────────────────
function LiveStudioCompositor({
  images, metalFilter, shape, selectedDiamond, activeMetal,
  headStyle, bandStyle, modelUrl, onSpin,
}: {
  images: string[];
  metalFilter: string;
  shape: string;
  onSpin: () => void;
  activeMetal?: string;
  headStyle?: string;
  bandStyle?: string;
  modelUrl?: string;
  selectedDiamond?: { loupe360?: string; videoUrl?: string; imageUrl?: string; shape?: string; caratWeight?: number } | null;
}) {
  // Primary view mode: 'photo' (default) | '3d' | 'diamond'
  const [viewMode, setViewMode] = useState<'photo' | '3d' | 'diamond'>('photo');
  // Which thumbnail is active (indexes into allThumbs below)
  const [activeThumb, setActiveThumb] = useState(0);
  // Zoom state for hover magnifier
  const [zoomed, setZoomed]   = useState(false);
  const [zoomXY, setZoomXY]   = useState({ x: 50, y: 50 });

  const baseImg = images[0] || '';

  // Build thumbnail list: real product images first, then virtual-angle views of img[0]
  const allThumbs = [
    ...images.map((src, i) => ({ src, angleStyle: {}, label: i === 0 ? 'Front' : `Photo ${i + 1}` })),
    // Virtual-angle views of the hero image (skip if no image)
    ...(baseImg
      ? ANGLE_VIEWS.slice(1).map(v => ({ src: baseImg, angleStyle: v.transformStyle, label: v.label }))
      : []),
  ];

  const currentThumb = allThumbs[activeThumb] ?? allThumbs[0];
  const hasDiamondLoupe = !!(selectedDiamond?.loupe360);
  const hasDiamondVideo = !!(selectedDiamond?.videoUrl);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomXY({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    });
  };

  return (
    <div className="w-full select-none">
      {/* ── keyframe for centre stone pop-in ── */}
      <style>{`
        @keyframes stoneAppear {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.55); }
          60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
          100% { opacity: 0.90; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* ── Blue Nile layout: left thumbnail strip + right main image ── */}
      <div className="flex gap-3">

        {/* ── Left thumbnail strip (desktop) ── */}
        <div className="hidden sm:flex flex-col gap-2 w-[72px] flex-shrink-0">
          {allThumbs.map((thumb, i) => (
            <button
              key={i}
              onClick={() => { setActiveThumb(i); setViewMode('photo'); }}
              className={cn(
                'relative w-[72px] h-[72px] flex-shrink-0 border-2 overflow-hidden bg-white transition-all',
                viewMode === 'photo' && activeThumb === i
                  ? 'border-charcoal'
                  : 'border-gray-200 hover:border-gray-400'
              )}
            >
              {thumb.src ? (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ filter: metalFilter, transition: 'filter 0.4s ease' }}>
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ ...thumb.angleStyle }}>
                    <Image src={thumb.src} alt={thumb.label} fill unoptimized className="object-contain p-1.5" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <svg viewBox="0 0 40 40" className="w-7 h-7 opacity-25">
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#888" strokeWidth="3.5" />
                  </svg>
                </div>
              )}
              {/* Tiny stone overlay on thumbnail */}
              {thumb.src && (
                <div className="absolute pointer-events-none z-10"
                  style={{
                    top: '29%', left: '50%',
                    width: '19%', aspectRatio: '1/1',
                    transform: 'translate(-50%, -50%)',
                    filter: 'drop-shadow(0 0 2px rgba(180,225,255,0.8))',
                    opacity: 0.88,
                  }}>
                  <CentreStoneSVG shape={shape} />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-white/80 text-center py-0.5">
                <span className="text-[7px] font-sans text-gray-500">{thumb.label}</span>
              </div>
            </button>
          ))}

          {/* 3D view thumbnail */}
          <button
            onClick={() => setViewMode('3d')}
            className={cn(
              'w-[72px] h-[72px] flex-shrink-0 border-2 flex flex-col items-center justify-center gap-1 bg-[#f8f8f6] transition-all',
              viewMode === '3d' ? 'border-charcoal' : 'border-gray-200 hover:border-gray-400'
            )}
          >
            <Box size={18} className="text-gray-400" />
            <span className="text-[7px] font-sans text-gray-500">3D View</span>
          </button>

          {/* Diamond thumbnail (if diamond selected) */}
          {selectedDiamond && (
            <button
              onClick={() => setViewMode('diamond')}
              className={cn(
                'w-[72px] h-[72px] flex-shrink-0 border-2 flex flex-col items-center justify-center gap-1 bg-[#f0f7ff] transition-all',
                viewMode === 'diamond' ? 'border-charcoal' : 'border-gray-200 hover:border-gray-400'
              )}
            >
              <Diamond size={18} className="text-blue-400" />
              <span className="text-[7px] font-sans text-gray-500">Diamond</span>
            </button>
          )}
        </div>

        {/* ── Main image panel ── */}
        <div className="flex-1 min-w-0">

          {/* ── PHOTO VIEW ── */}
          {viewMode === 'photo' && (
            <div
              className="relative bg-white border border-gray-100 overflow-hidden cursor-zoom-in"
              style={{ aspectRatio: '1 / 1' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
            >
              {currentThumb?.src ? (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ filter: metalFilter, transition: 'filter 0.45s ease' }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      ...currentThumb.angleStyle,
                      ...(zoomed
                        ? {
                            transform: `scale(2.2) translate(${(50 - zoomXY.x) * 0.45}%, ${(50 - zoomXY.y) * 0.45}%)`,
                            transition: 'none',
                          }
                        : { transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }),
                    }}
                  >
                    <Image
                      src={currentThumb.src}
                      alt="Ring setting"
                      fill
                      unoptimized
                      className="object-contain p-10"
                      priority
                    />
                  </div>
                </div>
              ) : (
                /* No photo — placeholder */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
                  <svg viewBox="0 0 80 80" className="w-20 h-20 opacity-15">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#888" strokeWidth="6" />
                    <circle cx="40" cy="40" r="18" fill="none" stroke="#888" strokeWidth="3" />
                  </svg>
                  <p className="text-[11px] font-sans text-gray-400">Ring photo coming soon</p>
                </div>
              )}

              {/* ── Centre stone diamond overlay ── */}
              {currentThumb?.src && (
                <div
                  key={shape}  // re-mounts → triggers CSS animation on shape change
                  className="absolute pointer-events-none z-10"
                  style={{
                    top: '29%',
                    left: '50%',
                    width: '19%',
                    aspectRatio: '1 / 1',
                    transform: 'translate(-50%, -50%)',
                    filter: [
                      'drop-shadow(0 0 5px rgba(180,225,255,0.75))',
                      'drop-shadow(0 2px 10px rgba(130,185,230,0.55))',
                      'drop-shadow(0 0 2px rgba(255,255,255,0.9))',
                    ].join(' '),
                    opacity: 0.90,
                    animation: 'stoneAppear 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
                  }}
                >
                  <CentreStoneSVG shape={shape} />
                </div>
              )}

              {/* Zoom hint */}
              {currentThumb?.src && !zoomed && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-sans text-gray-400 bg-white/80 border border-gray-100 px-2 py-1 pointer-events-none">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Hover to zoom
                </div>
              )}

              {/* 360° spin button */}
              <button
                onClick={onSpin}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-white/95 border border-gray-200 px-2.5 py-1.5 text-[10px] font-sans font-medium text-charcoal hover:bg-white shadow-sm transition-colors"
              >
                <RotateCcw size={10} /> 360°
              </button>

              {/* Shape badge */}
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-white/90 border border-gray-100 px-2 py-1">
                <ShapeSVG shape={shape} active size={10} />
                <span className="text-[9px] font-sans text-charcoal">{shape}</span>
              </div>
            </div>
          )}

          {/* ── 3D VIEW ── */}
          {viewMode === '3d' && (
            <div className="relative border border-gray-100 overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
              <Ring3DViewer
                modelUrl={modelUrl}
                metal={activeMetal}
                diamondShape={selectedDiamond?.shape || shape}
                caratWeight={selectedDiamond?.caratWeight || 1.0}
                headStyle={headStyle || 'four-claw'}
                bandStyle={bandStyle || 'plain'}
                className="w-full h-full"
              />
              <div className="absolute top-3 left-3 bg-white/90 border border-gray-100 text-[9px] font-sans px-2 py-1 text-gray-500 flex items-center gap-1">
                <Box size={9} /> Interactive 3D · Drag to rotate
              </div>
            </div>
          )}

          {/* ── DIAMOND VIEW ── */}
          {viewMode === 'diamond' && (
            <div className="relative border border-gray-100 overflow-hidden bg-[#f4f8ff]" style={{ aspectRatio: '1 / 1' }}>
              {hasDiamondLoupe ? (
                <iframe src={selectedDiamond!.loupe360} className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; gyroscope" title="360° Diamond View" />
              ) : hasDiamondVideo ? (
                <video src={selectedDiamond!.videoUrl} autoPlay muted loop playsInline
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : selectedDiamond?.imageUrl ? (
                <Image src={selectedDiamond.imageUrl} alt="Diamond" fill unoptimized className="object-contain p-10" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
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

          {/* ── Mobile thumbnail strip (shown below main image on mobile) ── */}
          <div className="flex sm:hidden gap-1.5 mt-2 overflow-x-auto pb-1">
            {allThumbs.map((thumb, i) => (
              <button
                key={i}
                onClick={() => { setActiveThumb(i); setViewMode('photo'); }}
                className={cn(
                  'relative w-14 h-14 flex-shrink-0 border-2 overflow-hidden bg-white transition-all',
                  viewMode === 'photo' && activeThumb === i ? 'border-charcoal' : 'border-gray-200'
                )}
              >
                {thumb.src && (
                  <div className="absolute inset-0" style={{ filter: metalFilter }}>
                    <Image src={thumb.src} alt={thumb.label} fill unoptimized className="object-contain p-1" />
                  </div>
                )}
              </button>
            ))}
            <button onClick={() => setViewMode('3d')}
              className={cn('w-14 h-14 flex-shrink-0 border-2 flex items-center justify-center bg-[#f8f8f6]',
                viewMode === '3d' ? 'border-charcoal' : 'border-gray-200')}>
              <Box size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Spec strip ── */}
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {[
          { label: 'Band Width',       value: '~2.0 mm' },
          { label: 'Setting Height',   value: '~6.5 mm' },
          { label: 'Est. Weight',      value: '~3.8 g'  },
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

// ── Head Style Icons — top-down technical jewellery sketches (64×64 viewBox) ──
// Each icon shows a true bird's-eye view: faceted diamond + shaped prongs/setting
function HeadStyleIcon({ styleKey, active }: { styleKey: string; active: boolean }) {
  const c  = active ? '#1a1a1a' : '#adb5bd';
  const sw = 1.0;
  const C  = 32; // centre
  // polar point: angle from 12-o'clock, clockwise
  const pt = (deg: number, r: number): [number, number] => [
    C + r * Math.cos((deg - 90) * Math.PI / 180),
    C + r * Math.sin((deg - 90) * Math.PI / 180),
  ];
  // filled tapered prong polygon – tipW at stone surface, baseW at gallery
  const prong = (deg: number, stoneR: number, galleryR: number, tipW: number, baseW: number, key: number | string) => {
    const a  = (deg - 90) * Math.PI / 180;
    const pa = a + Math.PI / 2;
    const [tx, ty] = [C + stoneR  * Math.cos(a), C + stoneR  * Math.sin(a)];
    const [bx, by] = [C + galleryR * Math.cos(a), C + galleryR * Math.sin(a)];
    const pts = [
      [tx + tipW  * Math.cos(pa), ty + tipW  * Math.sin(pa)],
      [tx - tipW  * Math.cos(pa), ty - tipW  * Math.sin(pa)],
      [bx - baseW * Math.cos(pa), by - baseW * Math.sin(pa)],
      [bx + baseW * Math.cos(pa), by + baseW * Math.sin(pa)],
    ];
    return <polygon key={key} points={pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')} fill={c} />;
  };
  // round brilliant top-view: girdle circle + octagonal table + 8 main facets
  const diamond = (r: number) => {
    const girdle = Array.from({ length: 8 }, (_, i) => pt(i * 45, r));
    const table  = Array.from({ length: 8 }, (_, i) => pt(i * 45 + 22.5, r * 0.52));
    return (
      <>
        <circle cx={C} cy={C} r={r} fill="none" stroke={c} strokeWidth={sw} />
        <polygon points={table.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}
          fill="none" stroke={c} strokeWidth={sw * 0.6} />
        {girdle.map(([gx, gy], i) => {
          const [tx, ty] = table[i];
          return <line key={`f${i}`} x1={gx.toFixed(2)} y1={gy.toFixed(2)}
            x2={tx.toFixed(2)} y2={ty.toFixed(2)} stroke={c} strokeWidth={sw * 0.45} opacity={0.65} />;
        })}
      </>
    );
  };
  const sR = 10, gR = 13.5, bR = 24;
  const bandRing = <circle cx={C} cy={C} r={bR} fill="none" stroke={c} strokeWidth={sw * 0.8} opacity={0.2} />;
  const gallery  = (r = gR) => <circle cx={C} cy={C} r={r} fill="none" stroke={c} strokeWidth={sw * 0.65} opacity={0.38} />;

  switch (styleKey) {
    case 'four-claw': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}{gallery()}
        {[0, 90, 180, 270].map((d, i) => prong(d, sR, bR, 1.35, 2.4, i))}
        {diamond(sR)}
      </svg>
    );
    case 'six-claw': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}{gallery()}
        {[0, 60, 120, 180, 240, 300].map((d, i) => prong(d, sR, bR, 1.0, 1.9, i))}
        {diamond(sR)}
      </svg>
    );
    case 'bezel': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}
        {/* thick bezel collar */}
        <circle cx={C} cy={C} r={sR + 3.8} fill={c} fillOpacity={0.07} stroke={c} strokeWidth={sw * 3.2} />
        {/* inner bezel edge */}
        <circle cx={C} cy={C} r={sR + 0.6} fill="none" stroke={c} strokeWidth={sw * 0.5} opacity={0.4} />
        {diamond(sR - 1)}
      </svg>
    );
    case 'pave': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}
        {/* inner pave ring */}
        {Array.from({ length: 10 }, (_, i) => { const [x, y] = pt(i * 36, sR + 4.5); return <circle key={`i${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={1.7} fill={c} />; })}
        {/* outer pave ring */}
        {Array.from({ length: 14 }, (_, i) => { const [x, y] = pt(i * (360/14), sR + 9.2); return <circle key={`o${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={1.4} fill={c} />; })}
        {[45,135,225,315].map((d, i) => prong(d, sR, sR+3.2, 0.9, 1.35, `p${i}`))}
        {diamond(sR)}
      </svg>
    );
    case 'halo': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}
        {/* halo setting rail */}
        <circle cx={C} cy={C} r={sR+5.5} fill="none" stroke={c} strokeWidth={sw*0.5} opacity={0.28} />
        {/* 12 halo diamonds */}
        {Array.from({ length: 12 }, (_, i) => { const [x, y] = pt(i*30, sR+5.5); return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={2.1} fill={c} />; })}
        {[0,90,180,270].map((d, i) => prong(d, sR, sR+3.5, 1.1, 1.6, i))}
        {diamond(sR)}
      </svg>
    );
    case 'classic-halo': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}
        {/* 14 round halo stones */}
        {Array.from({ length: 14 }, (_, i) => { const [x, y] = pt(i*(360/14), sR+5.5); return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={2.0} fill={c} />; })}
        {/* 4 claw bridges from halo to band */}
        {[0,90,180,270].map((d, i) => { const [x1,y1]=pt(d,sR+8.5); const [x2,y2]=pt(d,bR); return <line key={`b${i}`} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} stroke={c} strokeWidth={sw*1.4} strokeLinecap="round" />; })}
        {[0,90,180,270].map((d, i) => prong(d, sR, sR+3.5, 1.1, 1.6, i))}
        {diamond(sR)}
      </svg>
    );
    case 'floral-halo': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}
        {/* 6 petals */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i*60-90)*Math.PI/180;
          const [px, py] = [C+16*Math.cos(a), C+16*Math.sin(a)];
          return <ellipse key={i} cx={px.toFixed(2)} cy={py.toFixed(2)} rx={4} ry={7}
            transform={`rotate(${i*60} ${px.toFixed(2)} ${py.toFixed(2)})`}
            fill={c} fillOpacity={0.11} stroke={c} strokeWidth={sw*0.85} />;
        })}
        {/* stone at each petal centre */}
        {Array.from({ length: 6 }, (_, i) => { const [x,y]=pt(i*60, sR+6); return <circle key={`s${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={2.0} fill={c} />; })}
        {[45,135,225,315].map((d,i) => prong(d,sR,sR+3,1.0,1.4,i))}
        {diamond(sR)}
      </svg>
    );
    case 'hidden-halo': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}{gallery()}
        {/* normal 4-prong visible setting */}
        {[0,90,180,270].map((d,i) => prong(d,sR,bR,1.35,2.4,i))}
        {diamond(sR)}
        {/* hidden halo shown as dashed ring just under prong bases */}
        <circle cx={C} cy={C} r={sR+4.8} fill="none" stroke={c} strokeWidth={sw} strokeDasharray="2 2.5" opacity={0.42} />
        {Array.from({ length: 10 }, (_, i) => { const [x,y]=pt(i*36+18, sR+4.8); return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={1.35} fill={c} opacity={0.4} />; })}
      </svg>
    );
    case 'dual-halo': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}
        {/* inner halo */}
        {Array.from({ length: 10 }, (_, i) => { const [x,y]=pt(i*36, sR+4.5); return <circle key={`i${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={1.7} fill={c} />; })}
        {/* outer halo */}
        {Array.from({ length: 14 }, (_, i) => { const [x,y]=pt(i*(360/14), sR+9.2); return <circle key={`o${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={1.4} fill={c} />; })}
        {[45,135,225,315].map((d,i) => prong(d,sR,sR+3,1.0,1.4,i))}
        {diamond(sR)}
      </svg>
    );
    case 'plain':
    default: return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {bandRing}{gallery()}
        {[0,90,180,270].map((d,i) => prong(d,sR,bR,1.35,2.4,i))}
        {diamond(sR)}
      </svg>
    );
  }
}

// ── Band Style Icons — front-profile of ring band (64×64 viewBox) ─────────────
// Shows the band as a 3-D-feeling horizontal strip; each style has distinctive detail
function BandStyleIcon({ styleKey, active }: { styleKey: string; active: boolean }) {
  const c  = active ? '#1a1a1a' : '#adb5bd';
  const sw = 1.0;
  const lc = 'round' as const;
  const bp = { fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: lc } as const;
  // Band outline: arched top (domes up at centre), arched bottom, two end caps
  // 64×64 viewBox — band occupies y≈20–44
  const T  = 'M 4 26 Q 32 20 60 26';
  const Bt = 'M 4 38 Q 32 44 60 38';
  const EL = 'M 4 26 Q 2 32 4 38';
  const ER = 'M 60 26 Q 62 32 60 38';
  const Band = () => (
    <>
      <path d={T} {...bp} />
      <path d={Bt} {...bp} />
      <path d={EL} {...bp} />
      <path d={ER} {...bp} />
    </>
  );

  switch (styleKey) {
    case 'plain': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
        {/* subtle dome highlight to show rounded cross-section */}
        <path d="M 4 29 Q 32 23 60 29" fill="none" stroke={c} strokeWidth={sw*0.45} opacity={0.3} />
      </svg>
    );

    case 'knife-edge': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {/* ridge line arches high — the defining spine of a knife-edge */}
        <path d="M 4 32 Q 32 20 60 32" fill="none" stroke={c} strokeWidth={sw*1.9} strokeLinecap={lc} />
        {/* lower half */}
        <path d="M 4 32 Q 32 44 60 32" {...bp} />
        {/* end-cap dots */}
        <circle cx="4"  cy="32" r={sw*1.1} fill={c} />
        <circle cx="60" cy="32" r={sw*1.1} fill={c} />
      </svg>
    );

    case 'pave': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
        {/* two rows of pavé stones filling the band face */}
        {[8,15,22,29,36,43,50,57].map((x, i) => <circle key={`r1${i}`} cx={x} cy={27} r={2.1} fill={c} />)}
        {[8,15,22,29,36,43,50,57].map((x, i) => <circle key={`r2${i}`} cx={x} cy={35} r={2.1} fill={c} />)}
      </svg>
    );

    case 'half-pave': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
        {/* pavé only on the right half */}
        {[33,40,47,54].map((x, i) => <circle key={`r1${i}`} cx={x} cy={27} r={2.1} fill={c} />)}
        {[33,40,47,54].map((x, i) => <circle key={`r2${i}`} cx={x} cy={35} r={2.1} fill={c} />)}
        {/* dashed divider at mid-point */}
        <line x1="28" y1="22" x2="28" y2="42" stroke={c} strokeWidth={sw*0.65} strokeDasharray="2 2.2" opacity={0.45} />
      </svg>
    );

    case 'channel': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
        {/* channel rails */}
        <path d="M 4 28 Q 32 22.5 60 28" fill="none" stroke={c} strokeWidth={sw*0.75} opacity={0.55} />
        <path d="M 4 36 Q 32 41.5 60 36" fill="none" stroke={c} strokeWidth={sw*0.75} opacity={0.55} />
        {/* channel stones — rounded rectangles between the rails */}
        {[8,17,26,35,44,53].map((x, i) => (
          <rect key={i} x={x-3.5} y={28} width={7} height={8} rx={0.8}
            fill="none" stroke={c} strokeWidth={sw*0.85} />
        ))}
      </svg>
    );

    case 'twisted': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        {/* end-cap walls */}
        <line x1="4"  y1="22" x2="4"  y2="42" stroke={c} strokeWidth={sw} strokeLinecap={lc} />
        <line x1="60" y1="22" x2="60" y2="42" stroke={c} strokeWidth={sw} strokeLinecap={lc} />
        {/* strand 1: top-left → crosses to bottom-right → back to top-right */}
        <path d="M 4 24 C 18 24 22 40 32 32 C 42 24 46 24 60 24"
          fill="none" stroke={c} strokeWidth={sw*1.55} strokeLinecap={lc} />
        {/* strand 2: bottom-left → crosses to top-right → back to bottom-right */}
        <path d="M 4 40 C 18 40 22 24 32 32 C 42 40 46 40 60 40"
          fill="none" stroke={c} strokeWidth={sw*1.55} strokeLinecap={lc} />
      </svg>
    );

    case 'three-stone': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
        {/* centre stone — slightly raised, larger */}
        <ellipse cx="32" cy="26.5" rx="7.5" ry="6.5" fill="none" stroke={c} strokeWidth={sw} />
        {/* flanking stones */}
        <ellipse cx="14" cy="29" rx="5.5" ry="5" fill="none" stroke={c} strokeWidth={sw} />
        <ellipse cx="50" cy="29" rx="5.5" ry="5" fill="none" stroke={c} strokeWidth={sw} />
        {/* prong marks: N + S on each stone */}
        {[[32,20],[32,33],[14,24],[14,34],[50,24],[50,34]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={1} fill={c} />
        ))}
      </svg>
    );

    case 'baguette': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
        {/* baguette stones: tall, narrow rectangles, corner-cut for step-cut look */}
        {[7,18,29,40,51].map((x, i) => (
          <polygon key={i}
            points={`${x-3.5},23 ${x+3.5},23 ${x+4.5},24.5 ${x+4.5},39.5 ${x+3.5},41 ${x-3.5},41 ${x-4.5},39.5 ${x-4.5},24.5`}
            fill="none" stroke={c} strokeWidth={sw*0.85} />
        ))}
      </svg>
    );

    case 'floating': return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
        {/* floating stones elevated above band face — circle + thin stem + base */}
        {[10,22,34,46,58].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={24} r={4} fill="none" stroke={c} strokeWidth={sw} />
            <line x1={x} y1={28} x2={x} y2={33} stroke={c} strokeWidth={sw*0.6} strokeLinecap="round" />
            <line x1={x-2.5} y1={33} x2={x+2.5} y2={33} stroke={c} strokeWidth={sw*0.6} strokeLinecap="round" />
          </g>
        ))}
      </svg>
    );

    default: return (
      <svg viewBox="0 0 64 64" width="52" height="52">
        <Band />
      </svg>
    );
  }
}

// ── Style tile (Blue Nile spec: 104px tall, icon area 62px, label 11px) ───────
function StyleTile({ styleKey, label, active, onClick, mod, isHead }: {
  styleKey: string; label: string; active: boolean; onClick: () => void; mod?: number; isHead?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center justify-center gap-1 border text-center transition-all',
        'h-[104px] px-1',
        active ? 'border-charcoal bg-charcoal/[0.04]' : 'border-gray-200 hover:border-gray-400'
      )}
    >
      <div className="h-[62px] flex items-center justify-center">
        {isHead
          ? <HeadStyleIcon styleKey={styleKey} active={active} />
          : <BandStyleIcon styleKey={styleKey} active={active} />
        }
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

  const spinCallbackRef = useRef<(() => void) | null>(null);
  const handleSpin = useCallback(() => {
    // Spin is now handled inside LiveStudioCompositor via the 360° button.
    // This callback is kept for external callers (e.g. keyboard shortcut).
    spinCallbackRef.current?.();
  }, []);


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
              onSpin={handleSpin}
              selectedDiamond={selectedDiamond}
              activeMetal={activeMetal}
              headStyle={selectedHead}
              bandStyle={selectedBand}
              modelUrl={product?.model3dUrl}
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
                        <circle cx="14" cy="14" r="13" fill={METAL_COLORS[m.type] || '#D4A843'} stroke={activeMetal === m.type ? '#000000' : '#e5e7eb'} strokeWidth="1.5" />
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
                    styleKey={h.key}
                    label={h.label}
                    active={selectedHead === h.key}
                    onClick={() => setHead(h.key)}
                    mod={h.mod}
                    isHead
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
                    styleKey={b.key}
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
