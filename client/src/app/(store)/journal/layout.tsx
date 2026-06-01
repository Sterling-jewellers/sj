import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Expert guides on diamonds, engagement rings, jewellery care and proposal planning — written by the gemmologists at Sterling Jewellers.',
  alternates: {
    canonical: `${SITE_URL}/journal`,
  },
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
