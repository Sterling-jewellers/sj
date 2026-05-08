'use client';

import { useState, useEffect } from 'react';
import { getSocialProofCount, getUrgencyStock } from '@/lib/personalization';

interface SocialProofProps {
  productId: string;
  variants?: { stock: number }[];
  className?: string;
}

export default function SocialProof({ productId, variants, className }: SocialProofProps) {
  const [count, setCount]     = useState<number | null>(null);
  const urgency = getUrgencyStock(variants);

  useEffect(() => {
    setCount(getSocialProofCount(productId));
    const timer = setInterval(() => {
      setCount(getSocialProofCount(productId));
    }, 45_000);
    return () => clearInterval(timer);
  }, [productId]);

  if (!count && !urgency) return null;

  return (
    <div className={`space-y-1 ${className || ''}`}>
      {count !== null && (
        <p className="text-xs font-sans text-gray-500 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {count} people viewing this right now
        </p>
      )}
      {urgency && (
        <p className="text-xs font-sans font-medium text-amber-600 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
          {urgency} at this price
        </p>
      )}
    </div>
  );
}
