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
import Bestsellers from '@/components/home/Bestsellers';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import TrustReviews from '@/components/home/TrustReviews';
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
      <BrandStory />
      <Bestsellers />
      <WhyChooseUs />
      <TrustReviews />
      <InstagramGallery />
    </>
  );
}
