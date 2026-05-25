import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Sterling Jewellers — our story, our craft, and our commitment to ethically sourced fine jewellery handcrafted in the UK.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
