/**
 * Dynamic OG image for category pages.
 * Generates a branded navy panel with the category name and product count.
 * Served at /category/[slug]/opengraph-image by Next.js Edge runtime.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'Sterling Jewellers collection';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export default async function Image({ params }: { params: { slug: string } }) {
  let catName   = params.slug.replace(/-/g, ' ');
  let subtitle  = 'Fine Jewellery Collection';
  let imgSrc    = `${SITE_URL}/og-image.jpg`;

  try {
    const res = await fetch(`${API_URL}/categories/${params.slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const cat  = data.data ?? data;
      catName  = cat.name || catName;
      subtitle = cat.description
        ? cat.description.slice(0, 80) + (cat.description.length > 80 ? '…' : '')
        : subtitle;
      if (cat.image) imgSrc = cat.image;
    }
  } catch {
    // use defaults
  }

  // Capitalise
  const displayName = catName
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

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
        {/* Background image — full bleed with overlay */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={displayName}
          style={{
            position:   'absolute',
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            opacity:    0.35,
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(135deg, rgba(4,34,65,0.9) 40%, rgba(4,34,65,0.6))',
          }}
        />

        {/* Content */}
        <div
          style={{
            position:       'relative',
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'center',
            alignItems:     'center',
            width:          '100%',
            height:         '100%',
            padding:        '80px',
            gap:            '20px',
            textAlign:      'center',
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontSize:      '12px',
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.5)',
            }}
          >
            Sterling Jewellers
          </div>

          {/* Category name */}
          <div
            style={{
              fontSize:   '64px',
              fontWeight: '300',
              color:      '#FFFFFF',
              lineHeight: '1.1',
            }}
          >
            {displayName}
          </div>

          {/* Divider */}
          <div style={{ width: '60px', height: '1px', backgroundColor: 'rgba(255,255,255,0.4)' }} />

          {/* Subtitle */}
          <div
            style={{
              fontSize:   '18px',
              fontWeight: '300',
              color:      'rgba(255,255,255,0.65)',
              maxWidth:   '600px',
              lineHeight: '1.4',
            }}
          >
            {subtitle}
          </div>

          {/* Domain */}
          <div
            style={{
              fontSize:      '11px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.35)',
              marginTop:     '12px',
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
