import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '@/components/layout/Breadcrumb';

export const articles = [
  {
    slug: '4-cs-of-diamonds',
    title: 'The 4 Cs of Diamonds Explained',
    excerpt: 'Cut, Colour, Clarity and Carat — a plain-English guide to the grading system that determines a diamond\'s beauty and value. Everything you need to know before you buy.',
    category: 'Diamond Guide',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
  {
    slug: 'how-to-measure-ring-size',
    title: 'How to Measure Ring Size at Home',
    excerpt: 'An accurate ring size is essential — especially for a surprise proposal. Our step-by-step guide covers three reliable methods, plus a printable ring sizer you can use right now.',
    category: 'Buying Guide',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
  {
    slug: 'lab-grown-vs-natural-diamonds',
    title: 'Lab-Grown vs Natural Diamonds: An Honest Comparison',
    excerpt: 'Are lab-grown diamonds "real"? Are they worth buying? We compare the two honestly — covering chemistry, certification, resale value, and which is right for your budget.',
    category: 'Diamond Guide',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
  {
    slug: 'how-to-plan-a-proposal',
    title: 'The Ultimate Proposal Planning Guide',
    excerpt: 'From choosing the ring to setting the scene — a practical, romantic guide to planning a proposal your partner will never forget.',
    category: 'Inspiration',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
];

const comingSoon = [
  { title: 'Diamond Shape Guide: 10 Shapes Ranked', category: 'Diamond Guide' },
  { title: 'Platinum vs White Gold vs Palladium', category: 'Metal Guide' },
  { title: 'Engagement Ring Styles Explained', category: 'Buying Guide' },
  { title: 'How Much Should You Spend on an Engagement Ring?', category: 'Buying Guide' },
  { title: 'Caring for Your Engagement Ring', category: 'Jewellery Care' },
  { title: 'Hallmarking Explained: What the Marks Mean', category: 'Education' },
  { title: 'How to Insure Fine Jewellery in the UK', category: 'Practical Guide' },
  { title: 'Eternity Rings: Occasions, Styles & Sizing', category: 'Buying Guide' },
];

export default function JournalPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Journal' }]} />

      {/* Header */}
      <div className="bg-navy text-white py-16 text-center">
        <p className="section-subtitle text-white/60 mb-3">Knowledge & Inspiration</p>
        <h1 className="font-serif text-5xl font-light mb-4">The Sterling Journal</h1>
        <p className="text-sm font-sans text-white/70 max-w-lg mx-auto leading-relaxed">
          Expert guides on diamonds, engagement rings, proposal planning and jewellery care — written by the gemmologists and craftsmen at Sterling Jewellers.
        </p>
      </div>

      <div className="bg-white py-16">
        <div className="page-container">

          {/* Live articles */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/journal/${article.slug}`}
                className="group block border border-gray-100 hover:border-navy transition-colors"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-navy text-white text-[9px] font-sans tracking-widest uppercase px-3 py-1">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-sans text-gray-400 uppercase tracking-widest">{article.date}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] font-sans text-gray-400">{article.readTime}</span>
                  </div>
                  <h2 className="font-serif text-xl font-light text-charcoal mb-3 group-hover:text-navy transition-colors leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-xs font-sans text-gray-500 leading-relaxed">{article.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-sans font-medium text-navy">
                    Read Guide
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Coming soon */}
          <div className="border-t border-gray-100 pt-16">
            <div className="text-center mb-10">
              <p className="section-subtitle mb-2">More Coming Soon</p>
              <h2 className="font-serif text-2xl font-light text-charcoal">Further Reading</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {comingSoon.map((item) => (
                <div key={item.title} className="border border-dashed border-gray-200 p-5">
                  <span className="text-[9px] font-sans tracking-widest uppercase text-gray-400 mb-2 block">{item.category}</span>
                  <p className="text-sm font-sans text-gray-500 leading-snug">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-20 bg-navy text-white p-12 text-center">
            <p className="section-subtitle text-white/60 mb-3">Never Miss a Guide</p>
            <h3 className="font-serif text-3xl font-light mb-4">Join Our Newsletter</h3>
            <p className="text-sm font-sans text-white/70 mb-6 max-w-md mx-auto">
              New guides, exclusive offers and first access to new collections — delivered to your inbox.
            </p>
            <Link href="/" className="inline-block bg-white text-navy text-xs font-sans font-semibold tracking-widest uppercase px-10 py-4 hover:bg-gray-100 transition-colors">
              Subscribe
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
