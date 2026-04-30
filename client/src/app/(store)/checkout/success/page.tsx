'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';

// Handles both:
// 1. Inline payment success (navigated here by the checkout page)
// 2. Stripe 3DS redirect (?payment_intent=pi_xxx&redirect_status=succeeded)
export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (paymentIntent && redirectStatus === 'succeeded') {
      // 3DS redirect flow — retrieve pending order data from sessionStorage and create the order
      const pending = sessionStorage.getItem('sj_pending_order');
      if (pending) {
        const { shippingData, couponCode, couponData, cartItems } = JSON.parse(pending);
        ordersApi
          .create({
            items: cartItems,
            shippingAddress: {
              fullName: shippingData.fullName,
              line1: shippingData.line1,
              line2: shippingData.line2,
              city: shippingData.city,
              county: shippingData.county,
              postcode: shippingData.postcode,
              country: 'United Kingdom',
              phone: shippingData.phone,
            },
            shippingMethod: shippingData.shippingMethod,
            couponCode: couponData ? couponCode : undefined,
            paymentIntentId: paymentIntent,
          })
          .then(() => {
            sessionStorage.removeItem('sj_pending_order');
            clearCart();
            setStatus('success');
          })
          .catch(() => setStatus('error'));
      } else {
        // Order might have already been created by webhook or inline
        clearCart();
        setStatus('success');
      }
    } else if (redirectStatus === 'failed') {
      setStatus('error');
    } else {
      // Normal inline success flow (no redirect params)
      setStatus('success');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-sm font-sans text-gray-500">Confirming your order…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center py-20">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✕</span>
          </div>
          <h1 className="font-serif text-4xl font-light text-charcoal mb-4">Payment Failed</h1>
          <p className="text-sm font-sans text-gray-600 leading-relaxed mb-8">
            Your payment was not completed. No charge has been made.
          </p>
          <Link href="/checkout" className="btn-gold inline-block">Try Again</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center py-20">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h1 className="font-serif text-4xl font-light text-charcoal mb-4">Order Confirmed!</h1>
        <p className="text-sm font-sans text-gray-600 leading-relaxed mb-2">
          Thank you for your order with Sterling Jewellers. A confirmation email has been sent to your inbox.
        </p>
        <p className="text-sm font-sans text-gray-500 mb-8">
          Your piece is being lovingly prepared and will be delivered within the timeframe selected.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/account/orders" className="btn-gold">Track Your Order</Link>
          <Link href="/products" className="btn-outline-gold">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
