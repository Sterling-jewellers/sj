import { Metadata } from 'next';
import HeroBanner from '@/components/home/HeroBanner';

export const metadata: Metadata = {
  title: { absolute: 'Sterling Jewellers | Fine Jewellery & Engagement Rings' },
  description: 'Discover exquisite engagement rings, wedding bands, and fine jewellery. Handcrafted in the UK with ethically sourced diamonds and precious metals. Free UK delivery.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk',
  },
};
import FeaturedProducts from '@/components/home/FeaturedProducts';
import PromoBanner from '@/components/home/PromoBanner';
import Bestsellers from '@/components/home/Bestsellers';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Testimonials from '@/components/home/Testimonials';
import InstagramGallery from '@/components/home/InstagramGallery';
import PersonalizedBanner from '@/components/personalization/PersonalizedBanner';
import ShopByOccasion from '@/components/home/ShopByOccasion';
import BrandStory from '@/components/home/BrandStory';

export default function HomePage() {
  return (
    <>
      {/* Subtle returning-visitor banner — hidden for new visitors */}
      <PersonalizedBanner />
      <HeroBanner />
      <ShopByOccasion />
      <FeaturedProducts />
      <PromoBanner />
      <BrandStory />
      <Bestsellers />
      <WhyChooseUs />
      <Testimonials />
      <InstagramGallery />
    </>
  );
}
