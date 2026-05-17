import { Metadata } from 'next';
import CategoryClient from './_CategoryClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/categories/${params.slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    const cat = data.data ?? data;

    const name        = cat.name || params.slug.replace(/-/g, ' ');
    const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
    const canonical   = `${siteUrl}/category/${params.slug}`;
    const title       = `${name} | Buy Online UK | Sterling Jewellers`;
    const description = cat.description || `Shop our stunning ${name} collection at Sterling Jewellers. Ethically sourced, hallmarked fine jewellery with free UK delivery and free 30-day returns.`;

    return {
      title,
      description,
      keywords: [name, `buy ${name.toLowerCase()} online`, `${name.toLowerCase()} uk`, 'fine jewellery', 'sterling jewellers', 'gold jewellery uk', 'free uk delivery'],
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url:    canonical,
        images: cat.image
          ? [{ url: cat.image, width: 1200, height: 630, alt: name }]
          : [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${name} | Sterling Jewellers` }],
        siteName: 'Sterling Jewellers',
      },
      twitter: {
        card:        'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return {
      title: `${params.slug.replace(/-/g, ' ')} | Sterling Jewellers`,
    };
  }
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryClient slug={params.slug} />;
}
