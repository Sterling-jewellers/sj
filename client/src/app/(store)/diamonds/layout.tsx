import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export const metadata: Metadata = {
  title: 'Loose Diamonds',
  description: 'Search our collection of certified loose diamonds by shape, carat, cut, colour and clarity. GIA & IGI certified. Free UK delivery.',
  alternates: {
    canonical: `${SITE_URL}/diamonds`,
  },
  openGraph: {
    title: 'Loose Diamonds | Sterling Jewellers',
    description: 'Search certified loose diamonds by shape, carat, cut, colour and clarity. GIA & IGI certified.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function DiamondsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
