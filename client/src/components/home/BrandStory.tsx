import Link from 'next/link';

export default function BrandStory() {
  return (
    <section className="flex flex-col md:flex-row">

      {/* ── Left: Editorial image ── */}
      {/*
        h-[340px] md:h-auto  — explicit height on mobile so the absolute image renders;
                                on desktop the flex-row stretches this div to match the
                                navy text column height automatically.
        object-[75%_center]  — shifts the focal point right so the ring (at ~70% across
                                the original 1920 px image) is centred in the cropped area
                                on both desktop and mobile viewports.
      */}
      <div className="relative md:w-1/2 h-[340px] md:h-auto overflow-hidden bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://res.cloudinary.com/dzwnc3gkw/image/upload/v1780913682/in_trend_new-1920x550_stcsxu.jpg"
          alt="Crafted With Intention"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-[75%_center]"
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
