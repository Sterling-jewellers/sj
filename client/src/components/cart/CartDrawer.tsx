'use client';

import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[80] bg-charcoal/50 backdrop-blur-sm" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-[90] w-full max-w-md bg-ivory shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-gold-500" />
            <span className="font-serif text-xl font-light text-charcoal">Your Bag</span>
            <span className="text-sm font-sans text-gray-500">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </div>
          <button onClick={closeCart} className="p-1 hover:text-gold-600 transition-colors"><X size={20} /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <ShoppingBag size={48} className="text-gray-200" />
              <div>
                <p className="font-serif text-xl text-charcoal">Your bag is empty</p>
                <p className="text-sm font-sans text-gray-500 mt-1">Discover our beautiful collections</p>
              </div>
              <button onClick={closeCart} className="btn-gold mt-2">Continue Shopping</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div key={`${item.product._id}-${item.selectedMetal}-${item.selectedSize}-${idx}`} className="flex gap-4 px-6 py-4">
                  {/* Image */}
                  <Link href={`/products/${item.product.slug}`} onClick={closeCart} className="flex-shrink-0">
                    <div className="relative w-20 h-20 bg-gray-50">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product.slug}`} onClick={closeCart}>
                      <p className="text-sm font-sans font-medium text-charcoal leading-tight hover:text-gold-600 transition-colors">{item.product.name}</p>
                    </Link>
                    <div className="mt-1 space-y-0.5">
                      {item.selectedMetal && <p className="text-xs text-gray-500 font-sans">{item.selectedMetal.replace(/-/g, ' ')}</p>}
                      {item.selectedSize && <p className="text-xs text-gray-500 font-sans">Size: {item.selectedSize}</p>}
                      {item.engraving && <p className="text-xs text-gray-500 font-sans italic">"{item.engraving}"</p>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      {/* Qty */}
                      <div className="flex items-center border border-gray-200">
                        <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-sans">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-medium font-sans text-gold-600">{formatPrice(item.totalPrice * item.quantity)}</span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button onClick={() => removeItem(item.product._id, item.selectedMetal, item.selectedSize)} className="text-gray-300 hover:text-red-400 transition-colors self-start mt-1">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-6 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-sans text-gray-600">Subtotal</span>
              <span className="font-serif text-lg text-charcoal">{formatPrice(getTotalPrice())}</span>
            </div>
            <p className="text-xs font-sans text-gray-400 mb-4">Shipping & taxes calculated at checkout</p>
            <Link href="/checkout" onClick={closeCart} className="btn-gold w-full block text-center">
              Proceed to Checkout
            </Link>
            <button onClick={closeCart} className="w-full text-center text-xs font-sans tracking-widest uppercase text-gray-500 hover:text-gold-600 transition-colors mt-3 py-2">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
