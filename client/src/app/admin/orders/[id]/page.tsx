'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered'];
const ALL_STATUSES = [...STATUS_FLOW, 'cancelled', 'returned'];

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock, confirmed: CheckCircle, processing: Package,
  dispatched: Truck, delivered: CheckCircle, cancelled: XCircle, returned: RotateCcw,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-indigo-600 bg-indigo-50',
  dispatched: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  returned: 'text-gray-600 bg-gray-100',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminApi.getOrder(id),
  });

  const order = data?.data;

  const mutation = useMutation({
    mutationFn: () => adminApi.updateOrderStatus(id, {
      orderStatus: newStatus,
      trackingNumber: trackingNumber || undefined,
      trackingUrl: trackingUrl || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order', id] });
      setNewStatus('');
    },
  });

  if (isLoading) {
    return <div className="p-8"><div className="h-8 w-48 bg-gray-100 rounded animate-pulse" /></div>;
  }

  if (!order) {
    return <div className="p-8 text-gray-500">Order not found.</div>;
  }

  const StatusIcon = STATUS_ICONS[order.orderStatus] || Clock;
  const currentStep = STATUS_FLOW.indexOf(order.orderStatus);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            Placed {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={cn('flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium capitalize', STATUS_COLORS[order.orderStatus])}>
          <StatusIcon size={16} />
          {order.orderStatus}
        </div>
      </div>

      {/* Progress stepper */}
      {!['cancelled', 'returned'].includes(order.orderStatus) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    i < currentStep ? 'bg-amber-500 text-white' :
                    i === currentStep ? 'bg-amber-500 text-white ring-4 ring-amber-100' :
                    'bg-gray-100 text-gray-400'
                  )}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1.5 capitalize">{s}</span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2 mb-4', i < currentStep ? 'bg-amber-400' : 'bg-gray-200')} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Order items */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="divide-y divide-gray-100">
              {order.items.map((item: {
                _id?: string; name: string; image: string; price: number;
                quantity: number; selectedMetal?: string; selectedSize?: string; engraving?: string;
              }) => (
                <div key={item._id || item.name} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.selectedMetal && <span className="text-xs text-gray-500">Metal: {item.selectedMetal}</span>}
                      {item.selectedSize && <span className="text-xs text-gray-500">Size: {item.selectedSize}</span>}
                      {item.engraving && <span className="text-xs text-amber-600">Engraving: "{item.engraving}"</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
              {[
                { label: 'Subtotal', value: formatPrice(order.subtotal) },
                ...(order.discount > 0 ? [{ label: `Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, value: `-${formatPrice(order.discount)}` }] : []),
                { label: `Shipping (${order.shippingMethod})`, value: formatPrice(order.shippingCost) },
                { label: 'Tax (20% VAT)', value: formatPrice(order.tax) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Update Status</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select status…</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tracking Number</label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tracking URL</label>
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.royalmail.com/…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <button
              onClick={() => mutation.mutate()}
              disabled={!newStatus || mutation.isPending}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Updating…' : 'Update Order'}
            </button>
            {mutation.isSuccess && <p className="text-sm text-green-600 mt-2">✓ Order updated successfully</p>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Customer</h3>
            {order.user ? (
              <div>
                <p className="font-medium text-gray-900 text-sm">{order.user.firstName} {order.user.lastName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{order.user.email}</p>
                <Link href={`/admin/customers/${order.user._id}`} className="text-xs text-amber-600 hover:underline mt-2 inline-block">
                  View customer profile →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Guest — {order.guestEmail}</p>
            )}
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Shipping Address</h3>
            <address className="not-italic text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.county}</p>
              <p>{order.shippingAddress.postcode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="text-gray-400 text-xs mt-1">{order.shippingAddress.phone}</p>
            </address>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="capitalize text-gray-800">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                  order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-600'
                )}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking</span>
                  {order.trackingUrl ? (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-xs">
                      {order.trackingNumber}
                    </a>
                  ) : (
                    <span className="text-gray-800 font-mono text-xs">{order.trackingNumber}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
