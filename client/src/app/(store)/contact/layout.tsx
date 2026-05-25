import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Sterling Jewellers. Our expert team is on hand to help you find the perfect piece of jewellery or engagement ring.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
