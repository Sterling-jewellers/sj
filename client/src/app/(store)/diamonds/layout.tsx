import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loose Diamonds',
  description: 'Search our collection of certified loose diamonds by shape, carat, cut, colour and clarity. GIA & IGI certified. Free UK delivery.',
  keywords: ['loose diamonds UK', 'GIA certified diamonds', 'buy diamonds online', 'round brilliant diamonds', 'oval diamonds', 'diamond search'],
  openGraph: {
    title: 'Loose Diamonds | Sterling Jewellers',
    description: 'Search certified loose diamonds by shape, carat, cut, colour and clarity. GIA & IGI certified.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function DiamondsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
