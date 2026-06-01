import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export const metadata: Metadata = {
  title: 'Visit Our London Boutique',
  description: 'Visit Sterling Jewellers at 48 Bond Street, London W1S 1RB. Open Mon–Sat 9am–6pm, Sunday 11am–5pm. Book a free consultation with our gemmologists.',
  alternates: {
    canonical: `${SITE_URL}/visit`,
  },
  openGraph: {
    title: 'Visit Sterling Jewellers | 48 Bond Street, London',
    description: 'Our London boutique is open 6 days a week. Book a free ring consultation or walk in to browse our engagement ring and fine jewellery collections.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function VisitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
