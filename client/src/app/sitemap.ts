import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/diamonds`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/size-guide`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ];

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products?limit=1000&isActive=true`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const products = data.data?.products || data.products || [];
      productPages = products.map((p: { slug: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // fail silently — static pages still go out
  }

  // Dynamic category pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      const cats = data.data || data || [];
      categoryPages = cats.map((c: { slug: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/category/${c.slug}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch {
    // fail silently
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
