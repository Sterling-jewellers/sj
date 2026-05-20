import Link from 'next/link';

export default function BrandStory() {
  return (
    <section className="flex flex-col md:flex-row">

      {/* ── Left: Editorial image ── */}
      <div className="relative md:w-1/2 overflow-hidden bg-gray-100" style={{ minHeight: '500px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=900&fit=crop"
          alt="Crafted With Intention"
          loading="lazy"
          className="w-full h-full object-cover absolute inset-0"
        />
      </div>

      {/* ── Right: Navy bg, white text ── */}
      <div className="md:w-1/2 bg-navy flex items-center">
        <div className="px-10 md:px-16 py-16 md:py-20 max-w-xl">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-white/60 mb-5">
            Our Story
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white leading-tight mb-6">
            Crafted With Intention
          </h2>
          <p className="font-sans text-sm leading-relaxed text-white/80 mb-5">
            At Sterling Jewellers, every piece is created with the understanding that jewellery marks
            life&apos;s most meaningful moments. From the first sketch to the final hallmark, our
            craftspeople bring decades of expertise to each creation.
          </p>
          <p className="font-sans text-sm leading-relaxed text-white/80 mb-10">
            We work exclusively with ethically sourced precious metals and certified diamonds, ensuring
            that your piece is as beautiful in its origins as it is in its craftsmanship.
          </p>
          <Link
            href="/about"
            className="inline-block border border-white text-white font-sans text-[11px] tracking-widest uppercase px-8 py-3 hover:bg-white hover:text-navy transition-all duration-300"
          >
            Our Story
          </Link>
        </div>
      </div>

    </section>
  );
}
