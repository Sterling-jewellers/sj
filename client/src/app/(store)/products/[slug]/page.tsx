import { Metadata } from 'next';
import ProductDetailClient from './_ProductDetailClient';

// ── Server-side metadata for SEO ────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products/${params.slug}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    const p = data.data ?? data;

    const title       = p.metaTitle       || `${p.name} | ${p.category?.name || 'Fine Jewellery'} | Sterling Jewellers`;
    const description = p.metaDescription || p.shortDescription || `Buy ${p.name} from Sterling Jewellers. Ethically sourced fine jewellery with free UK delivery & free returns.`;
    const image       = p.images?.[0] || '/og-image.jpg';
    const price       = p.salePrice || p.basePrice;
    const canonical   = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk'}/products/${params.slug}`;

    const keywords = [
      p.name,
      p.category?.name,
      p.style,
      p.gemstone,
      p.settingType,
      ...(p.tags || []),
      'fine jewellery uk',
      'buy jewellery online',
      'sterling jewellers',
    ].filter(Boolean) as string[];

    return {
      title,
      description,
      keywords: [...new Set(keywords)],
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type:   'website',
        url:    canonical,
        images: [
          { url: image, width: 800, height: 800, alt: p.name },
          ...(p.images?.slice(1, 3) || []).map((img: string) => ({ url: img, width: 800, height: 800, alt: p.name })),
        ],
        siteName: 'Sterling Jewellers',
      },
      twitter: {
        card:        'summary_large_image',
        title,
        description,
        images:      [image],
      },
      other: {
        'product:price:amount':   String(price),
        'product:price:currency': 'GBP',
        'product:availability':   'in stock',
        'product:brand':          'Sterling Jewellers',
        'product:category':       p.category?.name || '',
      },
    };
  } catch {
    return { title: 'Product | Sterling Jewellers' };
  }
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
