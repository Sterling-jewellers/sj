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
  'Engagement': [
    { label: 'All Engagement Rings', href: '/category/engagement-rings' },
    { label: 'Solitaire Rings',      href: '/category/engagement-rings?style=solitaire' },
    { label: 'Halo Rings',           href: '/category/engagement-rings?style=halo' },
    { label: 'Three Stone Rings',    href: '/category/engagement-rings?style=three-stone' },
    { label: 'Pavé Rings',           href: '/category/engagement-rings?style=pave' },
    { label: 'Vintage Rings',        href: '/category/engagement-rings?style=vintage' },
  ],
  'Wedding': [
    { label: 'All Wedding Rings',    href: '/category/wedding-rings' },
    { label: 'Wedding Bands',        href: '/category/wedding-bands' },
    { label: 'Ladies Bands',         href: '/category/wedding-bands?gender=ladies' },
    { label: 'Gents Bands',          href: '/category/wedding-bands?gender=gents' },
    { label: 'Eternity Rings',       href: '/category/eternity-rings' },
    { label: 'Diamond Bands',        href: '/category/wedding-bands?gemstone=diamond' },
  ],
  'Fine Jewellery': [
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
  'Diamonds': [
    { label: 'All Diamonds',       href: '/diamonds' },
    { label: 'Natural Diamonds',   href: '/diamonds?type=natural' },
    { label: 'Lab Grown Diamonds', href: '/diamonds?type=lab' },
    { label: 'Diamond Education',  href: '/diamond-education' },
    { label: 'The 4 Cs Explained', href: '/journal/4-cs-of-diamonds' },
  ],
  'Journal': [
    { label: 'All Guides',                       href: '/journal' },
    { label: 'The 4 Cs of Diamonds',             href: '/journal/4-cs-of-diamonds' },
    { label: 'Lab vs Natural Diamonds',          href: '/journal/lab-grown-vs-natural-diamonds' },
    { label: 'How to Measure Ring Size',         href: '/journal/how-to-measure-ring-size' },
    { label: 'The Ultimate Proposal Guide',      href: '/journal/how-to-plan-a-proposal' },
    { label: 'Bespoke Design',                   href: '/bespoke' },
    { label: 'Visit Our Boutique',               href: '/visit' },
  ],
  'Gifts': [
    { label: 'Shop All Gifts',      href: '/products?occasion=gift' },
    { label: 'Gifts Under £100',    href: '/products?maxPrice=100&occasion=gift' },
    { label: 'Gifts Under £250',    href: '/products?maxPrice=250&occasion=gift' },
    { label: 'Gifts Under £500',    href: '/products?maxPrice=500&occasion=gift' },
    { label: 'Birthday Gifts',      href: '/products?occasion=birthday' },
    { label: 'Anniversary Gifts',   href: '/products?occasion=anniversary' },
    { label: 'New Baby Gifts',      href: '/category/baby-rings' },
    { label: 'Personalised Gifts',  href: '/products?style=personalised' },
  ],
};

const allNavLinks = [
  { label: 'Engagement',     href: '/category/engagement-rings', hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Wedding',        href: '/category/wedding-rings',    hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Fine Jewellery', href: '/category/jewellery',        hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Diamonds',       href: '/diamonds',                  hasMenu: true,  ringBuilder: false, diamonds: true  },
  { label: 'Gifts',          href: '/products?occasion=gift',    hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Create Your Ring', href: '/custom-ring',             hasMenu: false, ringBuilder: true,  diamonds: false },
  { label: 'Journal',        href: '/journal',                   hasMenu: true,  ringBuilder: false, diamonds: false },
  { label: 'Book Appointment', href: '/book-appointment',        hasMenu: false, ringBuilder: false, diamonds: false },
];

const navLinks = allNavLinks.filter(l =>
  (!l.ringBuilder || RING_BUILDER_ENABLED) &&
  (!l.diamonds    || DIAMONDS_ENABLED)
);

export default function Navbar() {
  const [activeMenu,      setActiveMenu]      = useState<string | null>(null);
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [mobileExpanded,  setMobileExpanded]  = useState<string | null>(null);
  const [searchOpen,      setSearchOpen]      = useState(false);
  const [mounted,         setMounted]         = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getTotalItems, openCart } = useCartStore();
  const { items: wishlist }         = useWishlistStore();
  const { user }                    = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  const openMenu    = (label: string) => {
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
      {/* ── Row 1: Announcement bar ───────────────────────────────────────────── */}
      <div className="bg-navy text-white text-[11px] font-sans text-center py-2 tracking-[0.12em]">
        <span className="hidden sm:inline">Free UK Delivery on Orders Over £100</span>
        <span className="hidden sm:inline mx-3 opacity-40">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Phone size={11} /> +44 742 906 5954
        </span>
        {DIAMONDS_ENABLED && <><span className="hidden sm:inline mx-3 opacity-40">|</span>
        <span className="hidden sm:inline">GIA &amp; IGI Certified Diamonds</span></>}
      </div>

      {/* ── Main header ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 bg-white"
        onMouseLeave={scheduleClose}
      >
        {/* ── Row 2: Logo row (80px) — hamburger left, logo center, icons right ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-6 h-[80px] grid grid-cols-[1fr_auto_1fr] items-center">

            {/* Left: Mobile hamburger */}
            <div className="flex items-center">
              <button
                className="lg:hidden p-2 -ml-2 text-charcoal hover:text-gray-600 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="flex flex-col items-center select-none px-6">
              <span className="font-serif text-[26px] font-light tracking-[0.28em] text-black uppercase leading-none">
                Sterling
              </span>
              <span className="font-sans text-[8px] tracking-[0.55em] uppercase text-navy font-medium mt-1">
                Jewellers
              </span>
            </Link>

            {/* Right: Icon cluster */}
            <div className="flex items-center justify-end gap-0.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-charcoal hover:text-navy transition-colors"
                aria-label="Search"
              >
                <Search size={19} />
              </button>

              <Link
                href="/account/wishlist"
                className="p-2.5 text-charcoal hover:text-navy transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart size={19} />
                {mounted && wishlist.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-navy text-white text-[9px] rounded-full flex items-center justify-center font-medium leading-none">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link
                href={user ? '/account' : '/sign-in'}
                className="p-2.5 text-charcoal hover:text-navy transition-colors"
                aria-label="Account"
              >
                <User size={19} />
              </Link>

              <button
                onClick={openCart}
                className="p-2.5 text-charcoal hover:text-navy transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag size={19} />
                {mounted && getTotalItems() > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-navy text-white text-[9px] rounded-full flex items-center justify-center font-medium leading-none">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 3: Nav categories (desktop only) — centered ── */}
        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-6 h-[44px] flex items-center justify-center">
            <nav className="flex items-center h-full">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => link.hasMenu ? openMenu(link.label) : setActiveMenu(null)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'group relative flex items-center gap-0.5 px-4 h-full text-[12.5px] font-sans font-normal',
                      'tracking-wide transition-colors duration-150',
                      link.label === 'Book Appointment'
                        ? 'text-navy font-medium'
                        : 'text-black hover:text-navy',
                    )}
                  >
                    {link.label}
                    {link.hasMenu && (
                      <ChevronDown
                        size={10}
                        className={cn(
                          'ml-0.5 transition-transform duration-150',
                          activeMenu === link.label ? 'rotate-180' : ''
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'absolute bottom-0 left-4 right-4 h-px bg-navy origin-left',
                        'transition-transform duration-200 ease-in-out',
                        activeMenu === link.label
                          ? 'scale-x-100'
                          : 'scale-x-0 group-hover:scale-x-100'
                      )}
                    />
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Mega Menu ── */}
        {activeMenu && (
          <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            <MegaMenu activeMenu={activeMenu} />
          </div>
        )}

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 overflow-y-auto max-h-[80vh]">
            {navLinks.map((link) => {
              const subLinks  = MOBILE_SUB_LINKS[link.label];
              const isExpanded = mobileExpanded === link.label;

              if (link.hasMenu && subLinks) {
                return (
                  <div key={link.label} className="border-b border-gray-100">
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

            <div className="px-6 py-4 flex items-center gap-3 text-[12px] font-sans text-gray-400 bg-gray-50">
              <Phone size={13} className="text-navy" />
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
