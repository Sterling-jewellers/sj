'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User, Menu, X, Phone } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import MegaMenu from './MegaMenu';
import SearchModal from './SearchModal';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Engagement Rings', href: '/category/engagement-rings', hasMenu: true },
  { label: 'Wedding Rings', href: '/category/wedding-rings', hasMenu: true },
  { label: 'Eternity Rings', href: '/category/eternity-rings', hasMenu: false },
  { label: 'Diamonds', href: '/diamonds', hasMenu: false },
  { label: 'Create Your Ring', href: '/custom-ring', hasMenu: false },
  { label: 'Jewellery', href: '/category/jewellery', hasMenu: true },
  { label: 'Gifts', href: '/category/gifts', hasMenu: false },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { getTotalItems, openCart } = useCartStore();
  const { items: wishlist } = useWishlistStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="bg-charcoal text-white text-xs font-sans text-center py-2 tracking-widest uppercase">
        <span>Free UK Delivery on Orders Over £100</span>
        <span className="mx-4 text-gold-500">|</span>
        <span className="inline-flex items-center gap-1">
          <Phone size={11} /> 0800 123 4567
        </span>
        <span className="mx-4 text-gold-500">|</span>
        <span>GIA & IGI Certified Diamonds</span>
      </div>

      {/* Main Navbar */}
      <header
        className={cn(
          'sticky top-0 z-50 bg-ivory border-b border-gray-200 transition-all duration-300',
          isScrolled && 'shadow-md'
        )}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu button */}
            <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex flex-col items-center lg:mr-8">
              <span className="font-serif text-2xl font-light tracking-[0.2em] text-charcoal uppercase">Sterling</span>
              <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-gold-500 font-medium -mt-1">Jewellers</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0 flex-1 justify-center">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.hasMenu ? setActiveMenu(link.label) : setActiveMenu(null)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'px-4 py-6 text-xs font-sans font-medium tracking-widest uppercase transition-colors hover:text-gold-600 block',
                      activeMenu === link.label ? 'text-gold-600' : 'text-charcoal'
                    )}
                  >
                    {link.label}
                  </Link>
                  {activeMenu === link.label && link.hasMenu && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-0.5 bg-gold-500" />
                  )}
                </div>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-1">
              <button onClick={() => setSearchOpen(true)} className="p-2.5 hover:text-gold-600 transition-colors" aria-label="Search">
                <Search size={19} />
              </button>
              <Link href="/account/wishlist" className="p-2.5 hover:text-gold-600 transition-colors relative" aria-label="Wishlist">
                <Heart size={19} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-gold-500 text-white text-[9px] rounded-full flex items-center justify-center font-medium">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link href={user ? '/account' : '/sign-in'} className="p-2.5 hover:text-gold-600 transition-colors" aria-label="Account">
                <User size={19} />
              </Link>
              <button onClick={openCart} className="p-2.5 hover:text-gold-600 transition-colors relative" aria-label="Cart">
                <ShoppingBag size={19} />
                {getTotalItems() > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-gold-500 text-white text-[9px] rounded-full flex items-center justify-center font-medium">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        {activeMenu && <MegaMenu activeMenu={activeMenu} />}

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-ivory border-t border-gray-200 py-4 px-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm font-sans font-medium tracking-widest uppercase border-b border-gray-100 text-charcoal hover:text-gold-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Search Modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
