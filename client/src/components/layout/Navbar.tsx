'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Search, Heart, ShoppingBag, User, Menu, X, Phone, ChevronDown, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import MegaMenu from './MegaMenu';
import SearchModal from './SearchModal';
import { cn } from '@/lib/utils';
import { RING_BUILDER_ENABLED, DIAMONDS_ENABLED } from '@/lib/features';

// Mobile sub-menu links for each category (shown in accordion on mobile)
const MOBILE_SUB_LINKS: Record<string, { label: string; href: string }[]> = {
  'Engagement Rings': [
    { label: 'All Engagement Rings', href: '/category/engagement-rings' },
    { label: 'Solitaire Rings',      href: '/category/engagement-rings?style=solitaire' },
    { label: 'Halo Rings',           href: '/category/engagement-rings?style=halo' },
    { label: 'Three Stone Rings',    href: '/category/engagement-rings?style=three-stone' },
    { label: 'Pavé Rings',           href: '/category/engagement-rings?style=pave' },
    { label: 'Vintage Rings',        href: '/category/engagement-rings?style=vintage' },
  ],
  'Rings': [
    { label: 'All Rings',        href: '/category/rings' },
    { label: 'Ladies Rings',     href: '/category/ladies-rings' },
    { label: 'Gents Rings',      href: '/category/gents-rings' },
    { label: 'Signet Rings',     href: '/category/signet-rings' },
    { label: 'Baby Rings',       href: '/category/baby-rings' },
    { label: 'Silver Rings',     href: '/category/silver-rings' },
  ],
  'Wedding Rings': [
    { label: 'All Wedding Rings', href: '/category/wedding-rings' },
    { label: 'Wedding Bands',     href: '/category/wedding-bands' },
    { label: 'Ladies Bands',      href: '/category/wedding-bands?gender=ladies' },
    { label: 'Gents Bands',       href: '/category/wedding-bands?gender=gents' },
  ],
  'Diamonds': [
    { label: 'All Diamonds',       href: '/diamonds' },
    { label: 'Natural Diamonds',   href: '/diamonds?type=natural' },
    { label: 'Lab Grown Diamonds', href: '/diamonds?type=lab' },
    { label: 'Diamond Education',  href: '/diamond-education' },
  ],
  'Jewellery': [
    { label: 'All Jewellery',    href: '/category/jewellery' },
    { label: 'Gold Earrings',    href: '/category/gold-earrings' },
    { label: 'Gold Pendants',    href: '/category/gold-pendants' },
    { label: 'Gold Bracelets',   href: '/category/gold-bracelets' },
    { label: 'Gold Bangles',     href: '/category/gold-bangles' },
    { label: 'Gold Chains',      href: '/category/gold-chains' },
    { label: 'Silver Earrings',  href: '/category/silver-earrings' },
    { label: 'Silver Pendants',  href: '/category/silver-pendants' },
    { label: 'Silver Bracelets', href: '/category/silver-bracelets' },
  ],
};

const allNavLinks = [
  { label: 'Engagement Rings', href: '/category/engagement-rings', hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Rings',            href: '/category/rings',            hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Wedding Rings',    href: '/category/wedding-rings',    hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Diamonds',         href: '/diamonds',                  hasMenu: true,  ringBuilder: false, diamonds: true  },
  { label: 'Jewellery',        href: '/category/jewellery',        hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Create Your Ring', href: '/custom-ring',               hasMenu: false, ringBuilder: true,  diamonds: false },
  { label: 'Book Appointment', href: '/book-appointment',          hasMenu: false, ringBuilder: false, diamonds: false },
];

const navLinks = allNavLinks.filter(l =>
  (!l.ringBuilder || RING_BUILDER_ENABLED) &&
  (!l.diamonds    || DIAMONDS_ENABLED)
);

export default function Navbar() {
  const [activeMenu,    setActiveMenu]    = useState<string | null>(null);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const closeTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getTotalItems, openCart } = useCartStore();
  const { items: wishlist }         = useWishlistStore();
  const { user }                    = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  // Delayed close so moving to mega-menu doesn't flicker
  const openMenu  = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(label);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <>
      {/* ── Promotional top bar ───────────────────────────────────────────── */}
      <div className="bg-charcoal text-white text-[11px] font-sans text-center py-2 tracking-[0.12em]">
        <span className="hidden sm:inline">Free UK Delivery on Orders Over £100</span>
        <span className="hidden sm:inline mx-3 opacity-40">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Phone size={11} /> +44 742 906 5954
        </span>
        {DIAMONDS_ENABLED && <><span className="hidden sm:inline mx-3 opacity-40">|</span>
        <span className="hidden sm:inline">GIA &amp; IGI Certified Diamonds</span></>}
      </div>

      {/* ── Main header ──────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
        onMouseLeave={scheduleClose}
      >
        {/* ── Primary nav row ── */}
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16">

          {/* Mobile menu trigger */}
          <button
            className="lg:hidden p-2 -ml-2 text-charcoal hover:text-gray-600 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex flex-col items-center select-none flex-shrink-0 mr-10">
            <span className="font-serif text-[22px] font-light tracking-[0.22em] text-charcoal uppercase leading-none">
              Sterling
            </span>
            <span className="font-sans text-[8px] tracking-[0.46em] uppercase text-gold-500 font-medium mt-0.5">
              Jewellers
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center flex-1 justify-center">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.hasMenu ? openMenu(link.label) : setActiveMenu(null)}
              >
                <Link
                  href={link.href}
                  className={cn(
                    'group relative flex items-center gap-0.5 px-3.5 py-5 text-[13.5px] font-sans font-normal',
                    'tracking-normal text-black transition-colors duration-150',
                    'hover:text-black',
                  )}
                >
                  {link.label}
                  {link.hasMenu && (
                    <ChevronDown
                      size={12}
                      className={cn(
                        'ml-0.5 transition-transform duration-150',
                        activeMenu === link.label ? 'rotate-180' : ''
                      )}
                    />
                  )}
                  {/* Animated underline – slides in from left on hover */}
                  <span
                    className={cn(
                      'absolute bottom-3 left-3.5 right-3.5 h-px bg-black origin-left',
                      'transition-transform duration-150 ease-in-out',
                      activeMenu === link.label
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </Link>
              </div>
            ))}
          </nav>

          {/* Icon cluster */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 text-charcoal hover:text-black transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <Link
              href="/account/wishlist"
              className="p-2.5 text-charcoal hover:text-black transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {mounted && wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-charcoal text-white text-[9px] rounded-full flex items-center justify-center font-medium leading-none">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              href={user ? '/account' : '/sign-in'}
              className="p-2.5 text-charcoal hover:text-black transition-colors"
              aria-label="Account"
            >
              <User size={20} />
            </Link>

            <button
              onClick={openCart}
              className="p-2.5 text-charcoal hover:text-black transition-colors relative"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {mounted && getTotalItems() > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-charcoal text-white text-[9px] rounded-full flex items-center justify-center font-medium leading-none">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Mega Menu (drops below primary nav row) ── */}
        {activeMenu && (
          <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            <MegaMenu activeMenu={activeMenu} />
          </div>
        )}

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 overflow-y-auto max-h-[80vh]">
            {navLinks.map((link) => {
              const subLinks = MOBILE_SUB_LINKS[link.label];
              const isExpanded = mobileExpanded === link.label;

              if (link.hasMenu && subLinks) {
                return (
                  <div key={link.label} className="border-b border-gray-100">
                    {/* Accordion header — tap chevron to expand, tap label to navigate */}
                    <div className="flex items-center">
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 px-6 py-4 text-[14px] font-sans font-medium text-black"
                      >
                        {link.label}
                      </Link>
                      <button
                        onClick={() => setMobileExpanded(isExpanded ? null : link.label)}
                        className="px-5 py-4 text-gray-400 hover:text-charcoal transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <ChevronDown size={16} className={cn('transition-transform duration-200', isExpanded && 'rotate-180')} />
                      </button>
                    </div>

                    {/* Sub-links */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        {subLinks.map(sub => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                            className="flex items-center gap-2 pl-9 pr-6 py-3 text-[13px] font-sans text-gray-600 hover:text-charcoal hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Plain link (no sub-menu)
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-6 py-4 text-[14px] font-sans font-medium text-black hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Contact */}
            <div className="px-6 py-4 flex items-center gap-3 text-[12px] font-sans text-gray-400 bg-gray-50">
              <Phone size={13} className="text-gold-500" />
              <span>+44 742 906 5954</span>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
