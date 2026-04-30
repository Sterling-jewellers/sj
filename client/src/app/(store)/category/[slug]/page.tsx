import { Metadata } from 'next';
import CategoryClient from './_CategoryClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/categories/${params.slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    const cat = data.data ?? data;

    const name = cat.name || params.slug.replace(/-/g, ' ');
    const title = `${name} | Sterling Jewellers`;
    const description = cat.description || `Shop our ${name} collection. Ethically sourced, handcrafted fine jewellery from Sterling Jewellers.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: cat.image ? [{ url: cat.image, width: 1200, height: 630, alt: name }] : [{ url: '/og-image.jpg', width: 1200, height: 630 }],
      },
      alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk'}/category/${params.slug}` },
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
