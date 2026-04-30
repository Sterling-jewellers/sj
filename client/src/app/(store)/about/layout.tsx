import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Sterling Jewellers — our story, our craft, and our commitment to ethically sourced fine jewellery handcrafted in the UK.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
