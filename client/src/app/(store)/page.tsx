import { Metadata } from 'next';
import HeroBanner from '@/components/home/HeroBanner';

export const metadata: Metadata = {
  title: 'Sterling Jewellers | Fine Jewellery & Engagement Rings',
  description: 'Discover exquisite engagement rings, wedding bands, and fine jewellery. Handcrafted in the UK with ethically sourced diamonds and precious metals. Free UK delivery.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk',
  },
};
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import PromoBanner from '@/components/home/PromoBanner';
import Bestsellers from '@/components/home/Bestsellers';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import RingBuilderCTA from '@/components/home/RingBuilderCTA';
import Testimonials from '@/components/home/Testimonials';
import InstagramGallery from '@/components/home/InstagramGallery';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryGrid />
      <FeaturedProducts />
      <PromoBanner />
      <Bestsellers />
      <RingBuilderCTA />
      <WhyChooseUs />
      <Testimonials />
      <InstagramGallery />
    </>
  );
}
