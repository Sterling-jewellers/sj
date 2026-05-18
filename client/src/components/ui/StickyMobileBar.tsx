'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 300;
const FOOTER_MARGIN = 200;

export default function StickyMobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const nearBottom = scrollY + viewportHeight >= docHeight - FOOTER_MARGIN;

      if (scrollY > SCROLL_THRESHOLD && !nearBottom) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white border-t-2 border-gold-500',
        'transition-transform duration-300 ease-in-out',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      <div className="flex">
        <Link
          href="/category/jewellery"
          className="flex-1 py-4 text-center text-sm font-sans font-medium tracking-wide border-r border-gray-100 text-charcoal border border-charcoal hover:bg-gray-50 transition-colors"
        >
          Browse Collections
        </Link>
        <Link
          href="/category/rings"
          className="flex-1 py-4 text-center text-sm font-sans font-medium tracking-wide bg-gold-500 text-white hover:bg-gold-600 transition-colors"
        >
          Shop Rings
        </Link>
      </div>
    </div>
  );
}
