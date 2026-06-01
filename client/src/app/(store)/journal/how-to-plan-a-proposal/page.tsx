import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { articles } from '../page';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
const SLUG = 'how-to-plan-a-proposal';

export const metadata: Metadata = {
  title: 'The Ultimate Proposal Planning Guide',
  description:
    'From choosing the ring to setting the scene — a practical, romantic guide to planning a proposal your partner will never forget. Ring timelines, sizing tips, location ideas and more.',
  alternates: {
    canonical: `${SITE_URL}/journal/${SLUG}`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'The Ultimate Proposal Planning Guide',
  description:
    'From choosing the ring to setting the scene — a practical, romantic guide to planning a proposal your partner will never forget.',
  author: { '@type': 'Person', name: 'Sterling Jewellers Team' },
  publisher: {
    '@type': 'Organization',
    name: 'Sterling Jewellers',
    logo: { '@type': 'ImageObject', url: 'https://sterlingjewellers.co.uk/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified: '2026-05-01',
  image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&h=600&fit=crop',
};

const relatedArticles = articles.filter((a) => a.slug !== SLUG);

export default function ProposalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Journal', href: '/journal' },
          { label: 'The Ultimate Proposal Planning Guide' },
        ]}
      />

      {/* Hero */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-charcoal">
        <Image
          src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&h=600&fit=crop"
          alt="A couple sharing an intimate moment during a proposal"
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="bg-navy text-white text-[9px] font-sans tracking-widest uppercase px-3 py-1 mb-4">
            Inspiration
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-white max-w-2xl leading-tight mb-4">
            The Ultimate Proposal Planning Guide
          </h1>
          <div className="flex items-center gap-3 text-white/60 text-xs font-sans">
            <span>May 2026</span>
            <span>·</span>
            <span>12 min read</span>
            <span>·</span>
            <span>Sterling Jewellers Team</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-8">
            A proposal is one of the few moments in life that you will remember in detail for the rest of it. The right amount of planning — not so little that it feels careless, not so much that it becomes a performance — makes all the difference. This guide walks through the practical decisions you need to make, in roughly the order you will need to make them. It is written for the person who wants to get this right without over-thinking it.
          </p>

          {/* Timeline */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">How Far in Advance Should You Start Planning?</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The most common mistake we see is leaving too little time for the ring. If you are buying a ready-made ring from stock, two to three weeks is technically sufficient — but it does not leave room for resizing, engraving, or changing your mind. A <strong>minimum of four weeks</strong> before the proposed date is sensible; six to eight weeks is comfortable.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            For bespoke or made-to-order rings — where the design is created specifically for you — allow a minimum of eight weeks, and twelve if you want to be relaxed about it. The design process itself typically takes one to two weeks, followed by four to six weeks of manufacturing. Rush orders are sometimes possible but they add cost and reduce the time available for refinements.
          </p>

          <div className="border-l-4 border-navy bg-gray-50 px-6 py-4 mb-10">
            <p className="font-sans text-sm text-charcoal font-medium">
              If you have a specific date in mind — an anniversary, a birthday, a holiday — count backwards from that date and book a consultation as early as possible. The most popular times of year (Christmas, Valentine's Day, summer holidays) see our appointment book fill up weeks in advance.
            </p>
          </div>

          {/* Ring size */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Finding Out the Ring Size Without Giving It Away</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            This is the question almost everyone asks, and there is no single answer — it depends on how observant your partner is, how good your poker face is, and how close you are to their friends and family. Here are five approaches that work:
          </p>
          <ol className="list-decimal list-outside pl-5 space-y-4 font-sans text-base text-gray-700 mb-8">
            <li>
              <strong className="text-charcoal">Enlist a trusted friend or family member.</strong> Someone who shops with them or is close to them physically may already know their ring size, or can ask as part of a casual conversation about jewellery — "I was thinking of getting X something, what size are they?" A good co-conspirator is worth their weight in platinum here.
            </li>
            <li>
              <strong className="text-charcoal">Borrow an existing ring for an hour.</strong> If they wear rings on that finger, slipping one into your pocket for a brief visit to a jeweller is the most accurate method available. We can measure it instantly and hand it back before they have noticed anything is amiss. Bring it to us in any clean container — a coin envelope, a small box.
            </li>
            <li>
              <strong className="text-charcoal">Trace it whilst they sleep.</strong> This sounds more dramatic than it is. A ring placed flat on paper can be traced with a pencil in about ten seconds. The inner circle diameter gives you the size directly. See our <Link href="/journal/how-to-measure-ring-size" className="text-navy underline underline-offset-2 hover:text-charcoal transition-colors">ring size guide</Link> for the conversion chart.
            </li>
            <li>
              <strong className="text-charcoal">Ask casually about jewellery in general.</strong> Conversations about a friend's engagement ring or a piece of jewellery you see in passing can naturally invite "I'd need a size N, I think." People mention their ring size more often than you might expect if the question comes up naturally.
            </li>
            <li>
              <strong className="text-charcoal">When in doubt, size up.</strong> If you have no reliable measurement, buy a ring in a size slightly larger than your best estimate. It is far easier — and less emotionally charged — to have a ring gently tightened the week after a proposal than to be at a dinner table working out how to explain that it will not go on. We offer complimentary first-time resizing on rings purchased from us.
            </li>
          </ol>

          {/* The moment */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Choosing the Right Moment: Private vs Public</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Public proposals — in restaurants, at sports events, on screens — remain popular, and when they work, they are genuinely moving. When they go wrong, the situation is painful for everyone, especially the person being proposed to. Before planning anything public, ask yourself honestly: does your partner enjoy being the centre of attention? Are they comfortable with spontaneous emotional moments in front of strangers? If the answer to either question is "not especially," a private proposal is almost certainly the better choice.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Private does not mean unromantic. Some of the most genuinely memorable proposals happen at home, in a setting made special by candles, music, flowers, and care — not by the scale of the gesture. A proposal at the kitchen table of the flat you share, done with complete sincerity, will be remembered more warmly than a helicopter ride done because it seemed impressive.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            If your partner is someone who would love the public moment, by all means plan it — but have a quiet, intimate version of the proposal prepared as well, for just the two of you afterwards. The public moment can be the celebration; the private one is the actual question.
          </p>

          {/* Locations */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Popular Proposal Locations in the UK</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The location should feel meaningful to you specifically, not impressive in the abstract. That said, a few broad settings tend to work well:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-3 font-sans text-base text-gray-700 mb-8">
            <li><strong>The British countryside.</strong> A long-planned walk to a hilltop or a bench with a view is romantic precisely because it requires effort and forethought. The Lake District, the Yorkshire Dales, the Cotswolds and the Jurassic Coast all offer settings that feel timeless. The weather is unpredictable — plan for it.</li>
            <li><strong>London.</strong> Rooftop bars at dusk, riverside spots along the South Bank, or a quiet garden square in the evening all offer intimacy within a city setting. Book ahead for rooftop venues; good positions go quickly, particularly in summer.</li>
            <li><strong>A meaningful place.</strong> Wherever you had your first date, wherever you spent a significant early trip together, wherever they have told you they love — these personal choices land harder than any objectively "impressive" location.</li>
            <li><strong>Home.</strong> Underestimated. A genuinely well-prepared evening at home — good food, candles, perhaps a playlist of songs that mean something to you — can create the most intimate and personal proposal possible, with no logistics to manage and no strangers in the background.</li>
          </ul>

          {/* The speech */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">What to Actually Say: The Speech</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            You do not need a script, and you probably should not read from one. But some preparation is worth doing — not so that you sound rehearsed, but so that emotion on the day does not leave you unable to say the things you genuinely mean.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Write down, in advance, three things: why you love this person specifically, what you imagine your life together to be, and why now feels right. You do not need to say all three — you might say none of them in exactly those words. But the act of articulating them clearly to yourself means that when the moment comes and your voice shakes (it usually does), you will have something real to reach for.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Keep it short. The ring will say most of what needs to be said. Your words are the context for it.
          </p>

          {/* After the yes */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Planning for After the Yes</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The period immediately after a successful proposal is joyful and slightly chaotic. A few practical things to know:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-3 font-sans text-base text-gray-700 mb-8">
            <li><strong>Insure the ring within 24 hours.</strong> An engagement ring is a high-value item being worn in unfamiliar, celebratory circumstances. Contact your home insurance provider immediately to add it to your policy as a named item, or arrange specialist jewellery insurance. Waiting weeks is common; it is also unwise.</li>
            <li><strong>Don't rush the announcement.</strong> You will want to tell people immediately — and you should tell close family first, in person or by phone rather than via social media. A congratulatory call from a parent is worth more than twenty comments on an Instagram post.</li>
            <li><strong>The ring may need adjustment.</strong> If it is slightly loose or tight, there is no urgency — allow a few days of wearing it before coming in for resizing, so the finger settles to its normal size rather than its proposal-day size.</li>
            <li><strong>Book a celebration dinner.</strong> It sounds obvious, but it is easy to forget in the excitement. Book somewhere meaningful the same evening if you can — you will want to mark it properly.</li>
          </ul>

          {/* The thing people forget */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">The One Thing People Always Forget</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            A backup plan. British weather, cancelled reservations, delayed trains, unexpected illness — any of these can disrupt an elaborate proposal. If you have only planned one option and it falls through on the day, you are left either proposing in circumstances that feel wrong or postponing entirely, which is its own kind of stress.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Keep the backup simple: if everything goes wrong, you will propose at home that evening. The setting does not have to be the one you planned. The question is the same, and the answer will be too.
          </p>

          {/* Closing */}
          <div className="border-l-4 border-navy bg-gray-50 px-6 py-4 mt-10 mb-4">
            <p className="font-sans text-sm text-charcoal leading-relaxed">
              The truth about proposals is that the details matter far less than the feeling behind them. The ring, the location, the speech — all of it is context for something much simpler: a question asked with complete sincerity by someone who means it. Get that part right, and the rest will take care of itself. We are always happy to help with the ring side of things, and we genuinely mean it when we say that nothing in this job is more satisfying than being part of how a proposal begins.
            </p>
          </div>

        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="section-subtitle text-white/60 mb-3">Ready to Find the Ring?</p>
          <h2 className="font-serif text-3xl font-light mb-4">Browse Engagement Rings or Book a Consultation</h2>
          <p className="font-sans text-sm text-white/70 mb-8 max-w-lg mx-auto">
            Whether you know exactly what you want or are starting from scratch, our team is here to help you find the right ring at the right pace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/category/engagement-rings" className="btn-gold">
              Browse Engagement Rings
            </Link>
            <Link href="/book-appointment" className="btn-outline-gold">
              Book a Private Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Related articles */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="section-subtitle mb-2">Continue Reading</p>
            <h2 className="font-serif text-2xl font-light text-charcoal">Related Guides</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
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
                  <div className="absolute top-3 left-3">
                    <span className="bg-navy text-white text-[9px] font-sans tracking-widest uppercase px-2 py-1">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-sans text-gray-400">{article.date}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] font-sans text-gray-400">{article.readTime}</span>
                  </div>
                  <h3 className="font-serif text-base font-light text-charcoal group-hover:text-navy transition-colors leading-snug mb-2">
                    {article.title}
                  </h3>
                  <span className="text-xs font-sans font-medium text-navy flex items-center gap-1">
                    Read Guide <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
