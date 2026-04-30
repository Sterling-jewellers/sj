'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { paymentApi, ordersApi } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Tag, X, ChevronRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// ── Stripe init (publishable key only – safe to expose) ─────────────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// ── Checkout form types ──────────────────────────────────────────────────────
interface ShippingForm {
  fullName: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
  postcode: string;
  phone: string;
  shippingMethod: 'standard' | 'express' | 'next-day';
}

const shippingOptions = [
  { value: 'standard', label: 'Standard Delivery', sub: '5–7 working days', price: 0 },
  { value: 'express', label: 'Express Delivery', sub: '2–3 working days', price: 9.99 },
  { value: 'next-day', label: 'Next Day Delivery', sub: 'Order by 1pm', price: 14.99 },
];

// ── Step 2: Stripe PaymentElement form ──────────────────────────────────────
interface PaymentStepProps {
  total: number;
  shippingData: ShippingForm;
  couponCode: string;
  couponData: { type: string; value: number } | null;
  onBack: () => void;
}

function PaymentStep({ total, shippingData, couponCode, couponData, onBack }: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      // Save order data to sessionStorage BEFORE redirect (3DS may redirect away)
      sessionStorage.setItem('sj_pending_order', JSON.stringify({
        shippingData,
        couponCode,
        couponData,
        cartItems: items.map((i) => ({
          product: i.product._id,
          name: i.product.name,
          image: i.product.images[0],
          price: i.totalPrice,
          quantity: i.quantity,
          selectedMetal: i.selectedMetal,
          selectedSize: i.selectedSize,
          engraving: i.engraving,
        })),
      }));

      // Confirm payment — for cards not needing redirect this resolves inline
      // For 3DS/bank auth, Stripe redirects to return_url
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        sessionStorage.removeItem('sj_pending_order');
        toast.error(error.message || 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // No redirect needed — create order inline
        await ordersApi.create({
          items: items.map((i) => ({
            product: i.product._id,
            name: i.product.name,
            image: i.product.images[0],
            price: i.totalPrice,
            quantity: i.quantity,
            selectedMetal: i.selectedMetal,
            selectedSize: i.selectedSize,
            engraving: i.engraving,
          })),
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
          paymentIntentId: paymentIntent.id,
        });

        sessionStorage.removeItem('sj_pending_order');
        clearCart();
        router.push('/checkout/success');
      }
    } catch {
      sessionStorage.removeItem('sj_pending_order');
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Order summary mini header */}
      <div className="bg-white p-5 rounded-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sans font-semibold text-sm tracking-widest uppercase text-charcoal">Payment Details</h2>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Lock size={12} /> Secured by Stripe
          </div>
        </div>
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: shippingData.fullName,
                email: shippingData.email,
              },
            },
          }}
        />
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || !stripe || !elements}
          className="btn-gold w-full flex items-center justify-center gap-2 mt-6"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Processing…' : `Pay ${formatPrice(total)}`}
        </button>
        <button type="button" onClick={onBack} className="w-full text-xs text-center text-gray-400 hover:text-gray-600 mt-3 underline">
          ← Back to shipping
        </button>
      </div>
    </div>
  );
}

// ── Main checkout page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [shippingData, setShippingData] = useState<ShippingForm | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stepLoading, setStepLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData, setCouponData] = useState<{ type: string; value: number } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ShippingForm>({
    defaultValues: { shippingMethod: 'standard' },
  });

  const shippingMethod = watch('shippingMethod');
  const shippingCost = shippingOptions.find((s) => s.value === shippingMethod)?.price || 0;
  const subtotal = getTotalPrice();
  const discount = couponData
    ? couponData.type === 'percentage'
      ? (subtotal * couponData.value) / 100
      : couponData.value
    : 0;
  const tax = (subtotal - discount) * 0.2;
  const total = subtotal - discount + shippingCost + tax;

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await paymentApi.validateCoupon(couponCode);
      setCouponData(res.data);
      toast.success('Coupon applied!');
    } catch {
      toast.error('Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  // Step 1 → Step 2: create PaymentIntent, advance
  const onShippingSubmit = async (data: ShippingForm) => {
    if (items.length === 0) return;
    setStepLoading(true);
    try {
      const intentRes = await paymentApi.createIntent({
        amount: total,
        metadata: {
          items: items.length,
          email: data.email,
          name: data.fullName,
        },
      });
      setClientSecret(intentRes.data.clientSecret);
      setShippingData(data);
      setStep(2);
    } catch {
      toast.error('Could not initialise payment. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center page-container">
        <h2 className="font-serif text-3xl text-charcoal mb-4">Your bag is empty</h2>
        <Link href="/products" className="btn-gold inline-block">Continue Shopping</Link>
      </div>
    );
  }

  // Order summary sidebar (shared between steps)
  const OrderSummary = () => (
    <div className="bg-white p-6">
      <h2 className="font-sans font-semibold text-sm tracking-widest uppercase text-charcoal mb-5">Order Summary</h2>
      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="relative w-14 h-14 flex-shrink-0">
              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white text-[9px] rounded-full flex items-center justify-center">{item.quantity}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-sans font-medium text-charcoal leading-tight truncate">{item.product.name}</p>
              {item.selectedMetal && <p className="text-xs text-gray-400">{item.selectedMetal.replace(/-/g, ' ')}</p>}
              {item.selectedSize && <p className="text-xs text-gray-400">Size: {item.selectedSize}</p>}
              {item.diamond && <p className="text-xs text-gold-600">+ {item.diamond.caratWeight}ct {item.diamond.shape} diamond</p>}
            </div>
            <span className="text-xs font-medium font-sans text-charcoal">{formatPrice(item.totalPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Coupon — only on step 1 */}
      {step === 1 && (
        <div className="mb-5">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="input-field pl-9 text-xs" />
            </div>
            <button type="button" onClick={handleCoupon} disabled={couponLoading} className="px-4 py-3 bg-charcoal text-white text-xs font-sans font-medium hover:bg-gray-800 transition-colors">
              {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
            </button>
          </div>
          {couponData && (
            <div className="flex items-center gap-1 mt-2 text-xs font-sans text-green-600">
              <span>Coupon applied!</span>
              <button onClick={() => { setCouponData(null); setCouponCode(''); }}><X size={12} /></button>
            </div>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2 border-t border-gray-100 pt-4">
        <div className="flex justify-between text-sm font-sans">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm font-sans text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-sans">
          <span className="text-gray-500">Shipping</span>
          <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-sm font-sans">
          <span className="text-gray-500">VAT (20%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between font-serif text-xl text-charcoal border-t border-gray-100 pt-3 mt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-ivory min-h-screen py-10">
      <div className="page-container">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex items-center gap-2 text-sm font-sans ${step === 1 ? 'text-charcoal font-semibold' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-charcoal text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            Shipping
          </div>
          <ChevronRight size={14} className="text-gray-300" />
          <div className={`flex items-center gap-2 text-sm font-sans ${step === 2 ? 'text-charcoal font-semibold' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-charcoal text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            Payment
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left column */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <form onSubmit={handleSubmit(onShippingSubmit)} className="space-y-8">
                {/* Contact */}
                <div className="bg-white p-6">
                  <h2 className="font-sans font-semibold text-sm tracking-widest uppercase text-charcoal mb-5">Contact Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-sans text-gray-500 mb-1.5">Full Name</label>
                      <input {...register('fullName', { required: 'Required' })} className="input-field" />
                      {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-sans text-gray-500 mb-1.5">Email Address</label>
                      <input {...register('email', { required: 'Required' })} type="email" className="input-field" />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-sans text-gray-500 mb-1.5">Phone Number</label>
                      <input {...register('phone', { required: 'Required' })} className="input-field" />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white p-6">
                  <h2 className="font-sans font-semibold text-sm tracking-widest uppercase text-charcoal mb-5">Delivery Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-sans text-gray-500 mb-1.5">Address Line 1</label>
                      <input {...register('line1', { required: 'Required' })} className="input-field" placeholder="House number & street name" />
                      {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-sans text-gray-500 mb-1.5">Address Line 2 <span className="text-gray-400">(optional)</span></label>
                      <input {...register('line2')} className="input-field" placeholder="Apartment, suite, etc." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans text-gray-500 mb-1.5">City / Town</label>
                        <input {...register('city', { required: 'Required' })} className="input-field" />
                        {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-sans text-gray-500 mb-1.5">County</label>
                        <input {...register('county', { required: 'Required' })} className="input-field" />
                        {errors.county && <p className="text-xs text-red-500 mt-1">{errors.county.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans text-gray-500 mb-1.5">Postcode</label>
                        <input {...register('postcode', { required: 'Required' })} className="input-field" />
                        {errors.postcode && <p className="text-xs text-red-500 mt-1">{errors.postcode.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-sans text-gray-500 mb-1.5">Country</label>
                        <input value="United Kingdom" readOnly className="input-field bg-gray-50 cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="bg-white p-6">
                  <h2 className="font-sans font-semibold text-sm tracking-widest uppercase text-charcoal mb-5">Delivery Method</h2>
                  <div className="space-y-3">
                    {shippingOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-4 p-4 border cursor-pointer hover:border-gold-300 transition-colors">
                        <input {...register('shippingMethod')} type="radio" value={opt.value} className="accent-gold-500" />
                        <div className="flex-1">
                          <p className="text-sm font-sans font-medium text-charcoal">{opt.label}</p>
                          <p className="text-xs font-sans text-gray-500">{opt.sub}</p>
                        </div>
                        <span className="text-sm font-sans font-medium text-charcoal">{opt.price === 0 ? 'Free' : formatPrice(opt.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={stepLoading} className="btn-gold w-full flex items-center justify-center gap-2">
                  {stepLoading && <Loader2 size={16} className="animate-spin" />}
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </form>
            )}

            {step === 2 && clientSecret && shippingData && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#c9a96e',
                      fontFamily: '"Montserrat", sans-serif',
                      borderRadius: '0px',
                    },
                  },
                }}
              >
                <PaymentStep
                  total={total}
                  shippingData={shippingData}
                  couponCode={couponCode}
                  couponData={couponData}
                  onBack={() => setStep(1)}
                />
              </Elements>
            )}
          </div>

          {/* Right: Order Summary */}
          <div>
            <OrderSummary />
            <p className="text-xs font-sans text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
              <Lock size={11} /> SSL encrypted · Powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
