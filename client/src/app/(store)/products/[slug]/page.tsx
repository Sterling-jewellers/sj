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

    const title = `${p.name} | Sterling Jewellers`;
    const description = p.shortDescription || `Buy ${p.name} from Sterling Jewellers. Ethically sourced, handcrafted in the UK.`;
    const image = p.images?.[0] || '/og-image.jpg';
    const price = p.salePrice || p.basePrice;

    return {
      title,
      description,
      keywords: [p.name, p.category?.name, p.style, p.gemstone, p.settingType, 'engagement ring', 'fine jewellery', 'Sterling Jewellers'].filter(Boolean),
      openGraph: {
        title,
        description,
        type: 'website',
        images: [{ url: image, width: 800, height: 800, alt: p.name }],
        siteName: 'Sterling Jewellers',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
      other: {
        // Product structured data (passed to client for JSON-LD injection)
        'product:price:amount': String(price),
        'product:price:currency': 'GBP',
      },
    };
  } catch {
    return { title: 'Product | Sterling Jewellers' };
  }
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
