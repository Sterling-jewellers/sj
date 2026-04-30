'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { IProduct } from '@/types';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ProductCard({ product }: { product: IProduct }) {
  const { toggleItem, isWishlisted } = useWishlistStore();
  const { addItem } = useCartStore();
  const [imgIdx, setImgIdx] = useState(0);
  const wishlisted = isWishlisted(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const defaultMetal = product.metalOptions.find((m) => m.isDefault)?.type || product.metalOptions[0]?.type;
    addItem(product, { selectedMetal: defaultMetal });
    toast.success(`${product.name} added to bag`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product);
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', { icon: wishlisted ? '💔' : '❤️' });
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block card-hover">
      {/* Image container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={product.images[imgIdx] || product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          onMouseEnter={() => product.images[1] && setImgIdx(1)}
          onMouseLeave={() => setImgIdx(0)}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNewArrival && (
            <span className="px-2 py-1 bg-charcoal text-white text-[9px] font-sans tracking-widest uppercase">New</span>
          )}
          {product.isBestseller && (
            <span className="px-2 py-1 bg-gold-500 text-white text-[9px] font-sans tracking-widest uppercase">Bestseller</span>
          )}
          {product.salePrice && (
            <span className="px-2 py-1 bg-red-500 text-white text-[9px] font-sans tracking-widest uppercase">
              -{getDiscountPercent(product.basePrice, product.salePrice)}%
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button onClick={handleWishlist} className={cn('w-9 h-9 bg-white shadow-md flex items-center justify-center hover:bg-gold-50 transition-colors', wishlisted && 'text-red-400')}>
            <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleAddToCart} className="w-9 h-9 bg-white shadow-md flex items-center justify-center hover:bg-gold-50 transition-colors">
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-white">
        <p className="text-xs font-sans text-gray-400 tracking-widest uppercase mb-1">{product.category?.name}</p>
        <h3 className="font-serif text-base text-charcoal group-hover:text-gold-600 transition-colors leading-tight line-clamp-2 mb-2">
          {product.name}
        </h3>

        {/* Metals */}
        {product.metalOptions.length > 0 && (
          <div className="flex gap-1.5 mb-2">
            {product.metalOptions.map((metal) => (
              <div
                key={metal.type}
                title={metal.type.replace(/-/g, ' ')}
                className={cn('w-4 h-4 rounded-full border border-gray-200', {
                  'bg-yellow-400': metal.type === 'yellow-gold',
                  'bg-gray-200': metal.type === 'white-gold',
                  'bg-rose-300': metal.type === 'rose-gold',
                  'bg-slate-300': metal.type === 'platinum',
                  'bg-gray-300': metal.type === 'silver',
                })}
              />
            ))}
          </div>
        )}

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} className={i < Math.round(product.averageRating) ? 'text-gold-400 fill-gold-400' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className="text-xs font-sans text-gray-400 ml-1">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="font-sans font-semibold text-gold-600">{formatPrice(product.salePrice)}</span>
              <span className="font-sans text-sm text-gray-400 line-through">{formatPrice(product.basePrice)}</span>
            </>
          ) : (
            <span className="font-sans font-medium text-charcoal">{formatPrice(product.basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
