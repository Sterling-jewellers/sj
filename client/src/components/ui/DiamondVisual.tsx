'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * DiamondVisual — renders a beautiful 3D-style diamond illustration.
 *
 * If `imageUrl` is provided the actual photo is shown.
 * Otherwise a photorealistic SVG facet illustration is rendered for the shape.
 * Supports: round, princess, cushion, oval, emerald, pear, radiant, asscher, marquise, heart.
 */

// ─── Per-shape SVG facet paths ────────────────────────────────────────────────
const FACET_DEFS: Record<string, { outline: string; table: string; facets: string[] }> = {
  round: {
    outline: 'M 100,10 A 90,90 0 1,1 99.9,10 Z',
    table: 'M 100,35 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0',
    facets: [
      'M100,35 L148,52 M100,35 L135,82 M100,35 L100,100 M100,35 L65,82 M100,35 L52,52',
      'M100,35 L155,100 M100,35 L100,165 M100,35 L45,100',
    ],
  },
  princess: {
    outline: 'M 15,15 H 185 V 185 H 15 Z',
    table: 'M 45,45 H 155 V 155 H 45 Z',
    facets: [
      'M45,45 L15,15 M155,45 L185,15 M155,155 L185,185 M45,155 L15,185',
      'M100,45 L100,155 M45,100 L155,100',
    ],
  },
  cushion: {
    outline: 'M 25,15 Q 100,10 175,15 Q 185,90 175,185 Q 100,190 25,185 Q 15,90 25,15 Z',
    table: 'M 55,45 Q 100,40 145,45 Q 150,100 145,155 Q 100,160 55,155 Q 50,100 55,45 Z',
    facets: [
      'M100,45 L175,15 M145,100 L185,90 M100,155 L175,185 M55,100 L15,90',
      'M55,45 L25,15 M145,45 L175,15 M145,155 L175,185 M55,155 L25,185',
    ],
  },
  oval: {
    outline: 'M 100,12 A 70,88 0 1,1 99.9,12 Z',
    table: 'M 100,35 A 42,54 0 1,1 99.9,35 Z',
    facets: [
      'M100,35 L170,100 M100,35 L100,165 M100,35 L30,100',
      'M58,60 L142,60 M58,140 L142,140',
    ],
  },
  emerald: {
    outline: 'M 35,10 H 165 L 185,30 V 170 L 165,190 H 35 L 15,170 V 30 Z',
    table: 'M 55,40 H 145 L 160,55 V 145 L 145,160 H 55 L 40,145 V 55 Z',
    facets: [
      'M55,40 L35,10 M145,40 L165,10 M145,160 L165,190 M55,160 L35,190',
      'M40,100 L160,100 M100,40 L100,160',
    ],
  },
  pear: {
    outline: 'M 100,190 C 30,190 15,120 30,65 C 45,20 75,8 100,8 C 125,8 155,20 170,65 C 185,120 170,190 100,190 Z',
    table: 'M 100,165 C 60,165 45,110 55,70 C 65,38 82,28 100,28 C 118,28 135,38 145,70 C 155,110 140,165 100,165 Z',
    facets: [
      'M100,28 L170,65 M100,28 L30,65 M100,165 L30,140 M100,165 L170,140',
      'M55,100 L145,100 M100,28 L100,165',
    ],
  },
  radiant: {
    outline: 'M 30,10 H 170 L 190,30 V 170 L 170,190 H 30 L 10,170 V 30 Z',
    table: 'M 55,40 H 145 L 160,55 V 145 L 145,160 H 55 L 40,145 V 55 Z',
    facets: [
      'M55,40 L30,10 M145,40 L170,10 M145,160 L170,190 M55,160 L30,190',
      'M40,100 L160,100 M100,40 L100,160 M55,55 L145,145 M145,55 L55,145',
    ],
  },
  asscher: {
    outline: 'M 45,10 H 155 L 190,45 V 155 L 155,190 H 45 L 10,155 V 45 Z',
    table: 'M 65,40 H 135 L 160,65 V 135 L 135,160 H 65 L 40,135 V 65 Z',
    facets: [
      'M65,40 L45,10 M135,40 L155,10 M135,160 L155,190 M65,160 L45,190',
      'M40,100 L160,100 M100,40 L100,160',
    ],
  },
  marquise: {
    outline: 'M 100,8 C 155,40 185,100 100,192 C 15,100 45,40 100,8 Z',
    table: 'M 100,30 C 140,60 155,100 100,170 C 45,100 60,60 100,30 Z',
    facets: [
      'M100,30 L185,100 M100,30 L15,100 M100,170 L185,100 M100,170 L15,100',
      'M100,30 L100,170 M60,70 L140,130 M140,70 L60,130',
    ],
  },
  heart: {
    outline: 'M 100,180 C 40,140 10,100 10,65 C 10,38 30,18 55,18 C 72,18 87,28 100,45 C 113,28 128,18 145,18 C 170,18 190,38 190,65 C 190,100 160,140 100,180 Z',
    table: 'M 100,155 C 58,125 38,95 38,68 C 38,50 52,38 68,38 C 80,38 90,46 100,60 C 110,46 120,38 132,38 C 148,38 162,50 162,68 C 162,95 142,125 100,155 Z',
    facets: [
      'M100,60 L38,68 M100,60 L162,68 M100,155 L38,120 M100,155 L162,120',
      'M100,60 L100,155 M68,38 L132,38',
    ],
  },
};

// ─── Gradient definitions ─────────────────────────────────────────────────────
function DiamondGradients({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`bg-${id}`} cx="38%" cy="32%" r="65%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.98" />
        <stop offset="18%"  stopColor="#f4f6ff" stopOpacity="0.95" />
        <stop offset="45%"  stopColor="#dde2f5" stopOpacity="0.92" />
        <stop offset="75%"  stopColor="#c8ceea" stopOpacity="0.90" />
        <stop offset="100%" stopColor="#a8b0d0" stopOpacity="0.88" />
      </radialGradient>
      <radialGradient id={`table-${id}`} cx="35%" cy="30%" r="70%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="50%"  stopColor="#e8ecff" stopOpacity="0.60" />
        <stop offset="100%" stopColor="#b0b8d8" stopOpacity="0.40" />
      </radialGradient>
      <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id={`sparkle-${id}`}>
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
}

// ─── Sparkle points ───────────────────────────────────────────────────────────
function SparklePoints({ id }: { id: string }) {
  const pts = [
    { cx: 62,  cy: 48,  r: 3 },
    { cx: 138, cy: 58,  r: 2 },
    { cx: 78,  cy: 72,  r: 1.5 },
    { cx: 155, cy: 90,  r: 2.5 },
    { cx: 48,  cy: 110, r: 2 },
    { cx: 122, cy: 130, r: 1.5 },
  ];
  return (
    <g filter={`url(#sparkle-${id})`}>
      {pts.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity="0.9" />
      ))}
      {/* Star cross-sparkles */}
      <line x1="60" y1="44" x2="64" y2="52" stroke="white" strokeWidth="1.2" opacity="0.8" />
      <line x1="58" y1="48" x2="66" y2="48" stroke="white" strokeWidth="1.2" opacity="0.8" />
    </g>
  );
}

// ─── Main visual component ────────────────────────────────────────────────────
interface DiamondVisualProps {
  shape?: string;
  imageUrl?: string;
  size?: number;
  active?: boolean;
  className?: string;
  /** Show just the outline icon (no gradients) for compact selectors */
  compact?: boolean;
}

export default function DiamondVisual({
  shape = 'round',
  imageUrl,
  size = 160,
  active = false,
  className,
  compact = false,
}: DiamondVisualProps) {
  const key = shape.toLowerCase().replace(/\s+/g, '-').replace(' ', '-');
  const facetData = FACET_DEFS[key] || FACET_DEFS.round;
  const uid = `dv-${key}-${size}`;

  if (imageUrl) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={imageUrl}
          alt={`${shape} diamond`}
          fill
          className="object-contain"
        />
      </div>
    );
  }

  if (compact) {
    // Compact mode: simple filled outline used in shape selectors
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} className={cn(className)}>
        <path
          d={facetData.outline}
          fill={active ? 'rgba(179,142,55,0.15)' : 'rgba(180,180,200,0.12)'}
          stroke={active ? '#B38E37' : '#9090a8'}
          strokeWidth="3"
        />
        <path
          d={facetData.table}
          fill="none"
          stroke={active ? '#B38E37' : '#9090a8'}
          strokeWidth="1.5"
          opacity="0.6"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cn('drop-shadow-xl', active && 'drop-shadow-2xl', className)}
    >
      <DiamondGradients id={uid} />

      {/* Main body */}
      <path
        d={facetData.outline}
        fill={`url(#bg-${uid})`}
        stroke="#c8ceea"
        strokeWidth="1.5"
      />

      {/* Table facet */}
      <path
        d={facetData.table}
        fill={`url(#table-${uid})`}
        stroke="#b0b8d8"
        strokeWidth="1"
        opacity="0.8"
      />

      {/* Facet lines */}
      {facetData.facets.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#9098c0"
          strokeWidth="0.8"
          opacity="0.45"
        />
      ))}

      {/* Bright highlight top-left */}
      <ellipse cx="75" cy="65" rx="28" ry="18" fill="white" opacity="0.30" transform="rotate(-25 75 65)" />

      {/* Glow overlay */}
      <path
        d={facetData.outline}
        fill={`url(#glow-${uid})`}
        opacity="0.15"
      />

      {/* Sparkle points */}
      <SparklePoints id={uid} />

      {/* Active ring */}
      {active && (
        <path
          d={facetData.outline}
          fill="none"
          stroke="#B38E37"
          strokeWidth="3"
          opacity="0.6"
        />
      )}
    </svg>
  );
}

// ─── Diamond card used in selectors / grids ───────────────────────────────────
interface DiamondCardProps {
  shape: string;
  caratWeight: number;
  cut: string;
  color: string;
  clarity: string;
  price: number;
  certLab: string;
  imageUrl?: string;
  selected?: boolean;
  onClick?: () => void;
  formatPrice: (n: number) => string;
}

export function DiamondCard({
  shape, caratWeight, cut, color, clarity, price,
  certLab, imageUrl, selected, onClick, formatPrice,
}: DiamondCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer bg-white border-2 transition-all duration-200 flex flex-col hover:shadow-lg group',
        selected ? 'border-charcoal shadow-xl scale-[1.02]' : 'border-gray-100 hover:border-gray-300'
      )}
    >
      {/* Visual top */}
      <div className={cn(
        'flex items-center justify-center py-6 transition-colors duration-200',
        selected ? 'bg-gradient-to-b from-slate-50 to-white' : 'bg-gradient-to-b from-gray-50 to-white group-hover:from-slate-50'
      )}>
        <DiamondVisual
          shape={shape}
          imageUrl={imageUrl}
          size={100}
          active={selected}
        />
      </div>

      {/* Details */}
      <div className="p-3 flex-1 flex flex-col gap-1.5 border-t border-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-sans font-semibold text-sm text-charcoal capitalize leading-tight">
              {caratWeight.toFixed(2)}ct {shape}
            </p>
            <p className="text-[11px] font-sans text-gray-500 mt-0.5">
              {cut} Cut · {color} · {clarity}
            </p>
          </div>
          {selected && (
            <div className="w-5 h-5 bg-charcoal rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Cert badge + price */}
        <div className="flex items-center justify-between mt-1">
          <span className={cn(
            'text-[9px] font-sans font-semibold tracking-widest uppercase px-1.5 py-0.5',
            certLab === 'GIA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
          )}>
            {certLab}
          </span>
          <p className="font-sans font-bold text-sm text-charcoal">{formatPrice(price)}</p>
        </div>
      </div>
    </div>
  );
}
