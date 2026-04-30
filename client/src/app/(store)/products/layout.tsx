import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Jewellery',
  description: 'Browse our full collection of engagement rings, wedding bands, earrings, necklaces and bracelets. Ethically sourced diamonds, handcrafted in the UK.',
  keywords: ['engagement rings', 'wedding bands', 'diamond rings', 'fine jewellery UK', 'gold jewellery', 'platinum rings'],
  openGraph: {
    title: 'All Jewellery | Sterling Jewellers',
    description: 'Browse our full collection of fine jewellery. Ethically sourced, handcrafted in the UK.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
