'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Visual breadcrumb trail.
 * Pass `href` for every item except the last (current page).
 *
 * Also renders BreadcrumbList JSON-LD so Google can show
 * breadcrumb rich results in the SERP.
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'Engagement Rings', href: '/category/engagement-rings' },
 *     { label: 'Round Solitaire in Platinum' },
 *   ]} />
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const allItems = [{ label: 'Home', href: '/' }, ...items];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href && { item: `${SITE_URL}${item.href}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav
        aria-label="Breadcrumb"
        className={`py-3 border-b border-gray-100 bg-white ${className}`}
      >
        <div className="page-container">
          <ol className="flex items-center gap-1 flex-wrap">
            {allItems.map((item, i) => {
              const isLast = i === allItems.length - 1;
              return (
                <li key={i} className="flex items-center gap-1">
                  {i === 0 ? (
                    item.href ? (
                      <Link
                        href={item.href}
                        className="text-gray-400 hover:text-charcoal transition-colors"
                        aria-label="Home"
                      >
                        <Home size={12} />
                      </Link>
                    ) : (
                      <Home size={12} className="text-gray-400" />
                    )
                  ) : (
                    <>
                      <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                      {!isLast && item.href ? (
                        <Link
                          href={item.href}
                          className="text-xs font-sans text-gray-500 hover:text-charcoal transition-colors"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          className="text-xs font-sans text-charcoal font-medium"
                          aria-current="page"
                        >
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
