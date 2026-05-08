'use client';

export const dynamic = 'force-dynamic';

import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { IProduct } from '@/types';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  if (!user) {
    router.push('/sign-in?redirect=/account/wishlist');
    return null;
  }

  const handleMoveToCart = (product: IProduct) => {
    addItem(product, { quantity: 1, selectedMetal: product.metalOptions?.find((m) => m.isDefault)?.type });
    removeItem(product._id);
    toast.success(`${product.name} moved to bag`);
  };

  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="page-container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/account" className="text-gray-400 hover:text-charcoal transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="section-subtitle mb-1">My Account</p>
            <h1 className="font-serif text-4xl font-light text-charcoal flex items-center gap-3">
              <Heart size={28} className="text-gold-500" />
              Wishlist
            </h1>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white p-16 text-center">
            <Heart size={56} className="text-gray-200 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-light text-charcoal mb-2">Your wishlist is empty</h2>
            <p className="text-sm font-sans text-gray-500 mb-6">
              Save the pieces you love and come back to them later.
            </p>
            <Link href="/products" className="btn-gold inline-block">
              Explore Collection
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm font-sans text-gray-500 mb-6">
              {items.length} item{items.length !== 1 ? 's' : ''} saved
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((product) => {
                const displayPrice = product.salePrice ?? product.basePrice;
                const originalPrice = product.salePrice ? product.basePrice : null;
                const image = product.images?.[0];

                return (
                  <div key={product._id} className="bg-white group">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <Heart size={40} />
                        </div>
                      )}
                      {product.salePrice && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-sans font-medium tracking-wider px-2 py-1">
                          SALE
                        </span>
                      )}
                      <button
                        onClick={() => removeItem(product._id)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <Link href={`/products/${product.slug}`} className="hover:text-gold-600 transition-colors">
                        <h3 className="font-serif text-base font-light text-charcoal line-clamp-2 leading-snug mb-1">
                          {product.name}
                        </h3>
                      </Link>

                      {product.metalOptions && product.metalOptions.length > 0 && (
                        <p className="text-xs font-sans text-gray-400 mb-3">
                          {product.metalOptions
                            .map((m) => `${m.karat ?? ''} ${m.type.replace(/-/g, ' ')}`.trim())
                            .slice(0, 3)
                            .join(' · ')}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-sans font-semibold text-charcoal">
                          {formatPrice(displayPrice)}
                        </span>
                        {originalPrice && (
                          <span className="font-sans text-sm text-gray-400 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex-1 text-center text-xs font-sans font-medium tracking-widest uppercase border border-charcoal text-charcoal py-2.5 hover:bg-charcoal hover:text-white transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleMoveToCart(product)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-sans font-medium tracking-widest uppercase bg-charcoal text-white py-2.5 hover:bg-gold-600 transition-colors"
                        >
                          <ShoppingBag size={13} />
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
