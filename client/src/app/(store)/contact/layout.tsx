import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Sterling Jewellers. Our expert team is on hand to help you find the perfect piece of jewellery or engagement ring.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
