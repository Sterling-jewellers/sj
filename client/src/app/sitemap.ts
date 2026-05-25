/**
 * Next.js generates this at /sitemap.xml automatically.
 *
 * SUBMISSION CHECKLIST (do once after going live):
 *  1. Google Search Console  → Sitemaps → submit https://sterlingjewellers.co.uk/sitemap.xml
 *  2. Bing Webmaster Tools   → Sitemaps → submit the same URL
 *  3. Verify robots.txt at /robots.txt references the sitemap (it does — see robots.ts)
 *  4. Re-submit whenever you add a large batch of products or change URL structure
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000/api';

type ProductEntry = {
  slug: string;
  name?: string;
  updatedAt?: string;
  images?: string[];
};

type CategoryEntry = {
  slug: string;
  name?: string;
  updatedAt?: string;
  image?: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                         lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/products`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/diamonds`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/about`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/size-guide`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE_URL}/shipping-returns`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/privacy`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/terms`,              lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ];

  // ── Dynamic product pages (includes image data for Google Image Search) ───
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products?limit=1000&isActive=true`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const products: ProductEntry[] = data.data?.products || data.products || [];
      productPages = products.map((p) => ({
        url:             `${BASE_URL}/products/${p.slug}`,
        lastModified:    p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority:        0.8,
        // Image sitemap data helps Google index product images in image search
        ...(p.images?.[0] && {
          images: p.images.slice(0, 3).map((src) => ({
            url:   src.startsWith('http') ? src : `${BASE_URL}${src}`,
            title: p.name,
          })),
        }),
      }));
    }
  } catch {
    // fail silently — static pages still go out
  }

  // ── Dynamic category pages ─────────────────────────────────────────────────
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      const cats: CategoryEntry[] = data.data || data || [];
      categoryPages = cats.map((c) => ({
        url:             `${BASE_URL}/category/${c.slug}`,
        lastModified:    c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority:        0.7,
        ...(c.image && {
          images: [{ url: c.image.startsWith('http') ? c.image : `${BASE_URL}${c.image}`, title: c.name }],
        }),
      }));
    }
  } catch {
    // fail silently
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
