'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate } from '@/lib/utils';
import { IOrder } from '@/types';
import {
  Package,
  ArrowLeft,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

/* ── Status config ─────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-400'  },
  confirmed:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  processing: { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  dispatched: { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  delivered:  { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500'   },
  cancelled:  { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'     },
  returned:   { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400'    },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-sans font-semibold tracking-widest uppercase rounded-sm ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

/* ── Progress tracker ──────────────────────────────────────────────────────── */
const STEPS = [
  { key: 'confirmed',  label: 'Order Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing',       icon: Clock        },
  { key: 'dispatched', label: 'Dispatched',        icon: Truck        },
  { key: 'delivered',  label: 'Delivered',         icon: Package      },
];

const STEP_ORDER = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered'];

function OrderProgress({ status }: { status: string }) {
  if (status === 'cancelled' || status === 'returned') return null;

  const currentIdx = STEP_ORDER.indexOf(status);

  return (
    <div className="bg-white p-6 mb-4">
      <h2 className="text-[11px] font-sans tracking-[0.2em] uppercase text-gray-400 mb-5">Order Progress</h2>
      <div className="flex items-start justify-between relative">
        {/* connector line */}
        <div className="absolute top-4 left-0 right-0 h-px bg-gray-200 z-0" />
        {STEPS.map((step, idx) => {
          const stepIdx = STEP_ORDER.indexOf(step.key);
          const done    = stepIdx <= currentIdx;
          const active  = step.key === status;
          const Icon    = step.icon;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                done
                  ? active
                    ? 'bg-gold-500 text-white ring-4 ring-gold-100'
                    : 'bg-charcoal text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-300'
              }`}>
                <Icon size={15} />
              </div>
              <span className={`text-[10px] font-sans text-center leading-tight px-1 ${done ? 'text-charcoal font-semibold' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function OrderDetailPage() {
  const { user }  = useAuthStore();
  const router    = useRouter();
  const params    = useParams<{ id: string }>();
  const id        = params?.id ?? '';

  useEffect(() => {
    if (!user) router.push(`/sign-in?redirect=/account/orders/${id}`);
  }, [user, router, id]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => ordersApi.getById(id),
    enabled:  !!user && !!id,
  });

  const order: IOrder | undefined = data?.data;

  if (!user) return null;

  /* Loading */
  if (isLoading) {
    return (
      <div className="bg-ivory min-h-screen py-10">
        <div className="page-container max-w-4xl space-y-4">
          <div className="bg-white animate-pulse h-20 rounded" />
          <div className="bg-white animate-pulse h-48 rounded" />
          <div className="bg-white animate-pulse h-64 rounded" />
        </div>
      </div>
    );
  }

  /* Error / not found */
  if (isError || !order) {
    return (
      <div className="bg-ivory min-h-screen py-10">
        <div className="page-container max-w-4xl">
          <div className="bg-white text-center py-20 px-6">
            <XCircle size={48} className="text-gray-200 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-light text-charcoal mb-2">Order not found</h2>
            <p className="text-sm font-sans text-gray-500 mb-6">This order doesn&apos;t exist or you don&apos;t have permission to view it.</p>
            <Link href="/account/orders" className="btn-gold inline-block">Back to Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const isCancelled = order.orderStatus === 'cancelled';
  const isReturned  = order.orderStatus === 'returned';

  return (
    <div className="bg-ivory min-h-screen py-10">
      <div className="page-container max-w-4xl">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 mb-6">
          <Link href="/account/orders" className="text-gray-400 hover:text-charcoal transition-colors mt-1">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-gray-400">My Account / Orders</p>
            <div className="flex flex-wrap items-center gap-3 mt-0.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-light text-charcoal">{order.orderNumber}</h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs font-sans text-gray-400 mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* ── Cancelled / Returned banner ── */}
        {(isCancelled || isReturned) && (
          <div className={`flex items-center gap-3 p-4 mb-4 rounded text-sm font-sans ${isCancelled ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
            {isCancelled ? <XCircle size={18} /> : <RotateCcw size={18} />}
            <span>This order has been <strong>{order.orderStatus}</strong>.</span>
          </div>
        )}

        {/* ── Progress ── */}
        <OrderProgress status={order.orderStatus} />

        {/* ── Tracking ── */}
        {order.trackingNumber && (
          <div className="bg-white p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Truck size={17} className="text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-sans tracking-widest uppercase text-gray-400 mb-0.5">Tracking Number</p>
              <p className="text-sm font-sans font-semibold text-charcoal">{order.trackingNumber}</p>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-sans text-gold-600 hover:text-gold-700 transition-colors"
              >
                Track Package <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* ── Estimated delivery ── */}
        {order.estimatedDelivery && !isCancelled && (
          <div className="bg-white p-5 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Clock size={17} className="text-green-500" />
            </div>
            <div>
              <p className="text-[11px] font-sans tracking-widest uppercase text-gray-400 mb-0.5">Estimated Delivery</p>
              <p className="text-sm font-sans font-semibold text-charcoal">{formatDate(order.estimatedDelivery)}</p>
            </div>
          </div>
        )}

        {/* ── Items ── */}
        <div className="bg-white mb-4">
          <div className="px-6 pt-6 pb-3 border-b border-gray-100">
            <h2 className="text-[11px] font-sans tracking-[0.2em] uppercase text-gray-400">
              Items ({order.items.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 p-5">
                {/* Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 border border-gray-100 rounded overflow-hidden bg-gray-50 relative">
                  {item.image && item.image !== '/images/placeholder.jpg' ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-semibold text-charcoal leading-snug mb-1">
                    {item.name}
                  </p>
                  {item.selectedMetal && (
                    <p className="text-xs font-sans text-gray-500">Metal: {item.selectedMetal}</p>
                  )}
                  {item.selectedSize && (
                    <p className="text-xs font-sans text-gray-500">Size: {item.selectedSize}</p>
                  )}
                  <p className="text-xs font-sans text-gray-400 mt-1">Qty: {item.quantity}</p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-sans font-semibold text-charcoal">{formatPrice(item.price * item.quantity)}</p>
                  {item.quantity > 1 && (
                    <p className="text-[11px] font-sans text-gray-400">{formatPrice(item.price)} each</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-col: address + summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* Shipping address */}
          <div className="bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={15} className="text-gold-500" />
              <h2 className="text-[11px] font-sans tracking-[0.2em] uppercase text-gray-400">Delivery Address</h2>
            </div>
            <div className="text-sm font-sans text-gray-700 space-y-0.5 leading-relaxed">
              <p className="font-semibold text-charcoal">{addr.fullName}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{addr.city}{addr.county ? `, ${addr.county}` : ''}</p>
              <p>{addr.postcode}</p>
              <p>{addr.country}</p>
              {addr.phone && <p className="text-gray-400 text-xs pt-1">{addr.phone}</p>}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-sans tracking-widest uppercase text-gray-400 mb-1">Shipping Method</p>
              <p className="text-sm font-sans text-charcoal capitalize">{order.shippingMethod?.replace('-', ' ')}</p>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-gold-500" />
              <h2 className="text-[11px] font-sans tracking-[0.2em] uppercase text-gray-400">Order Summary</h2>
            </div>
            <div className="space-y-2.5 text-sm font-sans">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (20%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-charcoal border-t border-gray-100 pt-2.5 mt-1">
                <span>Total</span>
                <span className="text-base">{formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-sans tracking-widest uppercase text-gray-400 mb-1">Payment</p>
              <div className={`inline-flex items-center gap-1.5 text-xs font-sans font-semibold ${
                order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/account/orders" className="btn-outline-gold text-sm px-5 py-2.5">
            ← Back to Orders
          </Link>
          <Link href="/category/jewellery" className="btn-gold text-sm px-5 py-2.5">
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
