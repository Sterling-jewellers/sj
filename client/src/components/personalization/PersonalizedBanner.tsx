'use client';

import { useEffect, useState } from 'react';
import { getTopStyles, getTopMetals, isReturningVisitor } from '@/lib/personalization';
import Link from 'next/link';

const STYLE_LABELS: Record<string, string> = {
  solitaire: 'solitaire', halo: 'halo', vintage: 'vintage',
  pave: 'pavé', 'three-stone': 'three-stone', bezel: 'bezel',
};
const METAL_LABELS: Record<string, string> = {
  'yellow-gold': 'yellow gold', 'white-gold': 'white gold',
  'rose-gold': 'rose gold', platinum: 'platinum', silver: 'silver',
};

export default function PersonalizedBanner() {
  const [topStyle, setTopStyle]   = useState<string | null>(null);
  const [topMetal, setTopMetal]   = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const styles = getTopStyles(1);
    const metals = getTopMetals(1);
    setTopStyle(styles[0] || null);
    setTopMetal(metals[0] || null);
    setReturning(isReturningVisitor());
  }, []);

  if (!returning || (!topStyle && !topMetal)) return null;

  const styleLabel = topStyle ? STYLE_LABELS[topStyle] || topStyle : null;
  const metalLabel = topMetal ? METAL_LABELS[topMetal] || topMetal : null;

  const message = styleLabel && metalLabel
    ? `Continuing where you left off — ${metalLabel} ${styleLabel} rings`
    : styleLabel ? `Continuing where you left off — ${styleLabel} rings`
    : metalLabel ? `Continuing where you left off — ${metalLabel} jewellery`
    : null;

  if (!message) return null;

  const href = topStyle
    ? `/products?style=${topStyle}${topMetal ? `&metal=${topMetal}` : ''}`
    : topMetal ? `/products?metal=${topMetal}` : '/products';

  return (
    <div className="bg-charcoal/95 text-white py-2.5 px-4">
      <div className="page-container flex items-center justify-between">
        <p className="text-xs font-sans text-gray-300">
          Welcome back ·{' '}
          <span className="text-gold-400 font-medium capitalize">{message}</span>
        </p>
        <Link href={href} className="text-[10px] font-sans tracking-widest uppercase text-gold-400 hover:text-gold-300 transition-colors">
          Continue browsing →
        </Link>
      </div>
    </div>
  );
}
