/**
 * Dynamic OG image for product pages.
 * Next.js renders this via the Edge runtime and serves it at
 * /products/[slug]/opengraph-image — automatically picked up by
 * the <meta og:image> tag when no explicit image is set in metadata.
 *
 * The metadata in page.tsx already sets openGraph.images to the product
 * photo, so this file acts as the branded fallback / template layer.
 * Google, Twitter and iMessage all read it correctly.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'Sterling Jewellers product';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export default async function Image({ params }: { params: { slug: string } }) {
  let name     = 'Fine Jewellery';
  let category = 'Sterling Jewellers';
  let price    = '';
  let imgSrc   = `${SITE_URL}/og-image.jpg`;

  try {
    const res = await fetch(`${API_URL}/products/${params.slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const p    = data.data ?? data;
      name     = p.name     || name;
      category = p.category?.name || category;
      price    = p.salePrice  ? `£${p.salePrice.toLocaleString('en-GB')}`
               : p.basePrice  ? `£${p.basePrice.toLocaleString('en-GB')}`
               : '';
      if (p.images?.[0]) imgSrc = p.images[0];
    }
  } catch {
    // use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          display:         'flex',
          width:           '1200px',
          height:          '630px',
          backgroundColor: '#042241',
          fontFamily:      'Georgia, serif',
        }}
      >
        {/* Product image — left half */}
        <div style={{ display: 'flex', width: '50%', height: '100%', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Dark overlay for contrast */}
          <div
            style={{
              position:        'absolute',
              inset:           0,
              background:      'linear-gradient(to right, transparent 60%, #042241)',
            }}
          />
        </div>

        {/* Text — right half */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'center',
            width:          '50%',
            padding:        '60px 60px 60px 40px',
            gap:            '16px',
          }}
        >
          {/* Brand wordmark */}
          <div
            style={{
              fontSize:      '13px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.5)',
            }}
          >
            Sterling Jewellers
          </div>

          {/* Category */}
          <div
            style={{
              fontSize:      '14px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.6)',
            }}
          >
            {category}
          </div>

          {/* Product name */}
          <div
            style={{
              fontSize:   '36px',
              fontWeight: '300',
              color:      '#FFFFFF',
              lineHeight: '1.25',
            }}
          >
            {name}
          </div>

          {/* Divider */}
          <div style={{ width: '48px', height: '1px', backgroundColor: 'rgba(255,255,255,0.4)' }} />

          {/* Price */}
          {price && (
            <div
              style={{
                fontSize:   '24px',
                fontWeight: '400',
                color:      '#FFFFFF',
              }}
            >
              {price}
            </div>
          )}

          {/* CTA hint */}
          <div
            style={{
              fontSize:      '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.4)',
              marginTop:     '8px',
            }}
          >
            sterlingjewellers.co.uk
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
