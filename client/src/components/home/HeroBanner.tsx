import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="flex flex-col md:flex-row w-full" style={{ minHeight: '100vh' }}>

      {/* ── Left Panel: Engagement Rings ── */}
      <div className="relative flex-1 min-h-[60vh] md:min-h-0 overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&h=1200&fit=crop&q=90"
          alt="Engagement Rings"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Text content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-white/70 mb-4">
            Engagement Rings
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-light text-white leading-tight mb-8">
            Begin Your Story
          </h2>
          <Link
            href="/category/engagement-rings"
            className="inline-block border border-white text-white font-sans text-[11px] tracking-widest uppercase px-8 py-3 hover:bg-white hover:text-black transition-all duration-300"
          >
            Explore Collection
          </Link>
        </div>
      </div>

      {/* ── Right Panel: Fine Jewellery ── */}
      <div className="relative flex-1 min-h-[60vh] md:min-h-0 overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=1000&h=1200&fit=crop&q=90"
          alt="Fine Jewellery"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Text content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-white/70 mb-4">
            Fine Jewellery
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-light text-white leading-tight mb-8">
            For Every Moment
          </h2>
          <Link
            href="/category/jewellery"
            className="inline-block border border-white text-white font-sans text-[11px] tracking-widest uppercase px-8 py-3 hover:bg-white hover:text-black transition-all duration-300"
          >
            Explore Collection
          </Link>
        </div>
      </div>

    </section>
  );
}
