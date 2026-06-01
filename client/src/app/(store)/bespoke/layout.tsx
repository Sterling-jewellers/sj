import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export const metadata: Metadata = {
  title: 'Bespoke Engagement Rings | Custom Jewellery Design',
  description: 'Create a truly one-of-a-kind bespoke engagement ring or fine jewellery piece with Sterling Jewellers. Work directly with our master craftsmen from sketch to finished piece.',
  alternates: {
    canonical: `${SITE_URL}/bespoke`,
  },
  openGraph: {
    title: 'Bespoke Jewellery Design | Sterling Jewellers',
    description: 'Commission a unique engagement ring or fine jewellery piece. Bring your ideas, a sketch, or a stone you love — our craftsmen will do the rest.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function BespokeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
