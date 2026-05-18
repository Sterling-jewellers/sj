'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate } from '@/lib/utils';
import { IOrder } from '@/types';
import { Package, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react';

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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-sans font-semibold tracking-widest uppercase rounded-sm ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/sign-in?redirect=/account/orders');
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders(),
    enabled: !!user,
  });

  const orders: IOrder[] = data?.data || [];

  if (!user) return null;

  return (
    <div className="bg-ivory min-h-screen py-10">
      <div className="page-container max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="text-gray-400 hover:text-charcoal transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-gray-400">My Account</p>
            <h1 className="font-serif text-3xl font-light text-charcoal">My Orders</h1>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white animate-pulse h-24 rounded" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && orders.length === 0 && (
          <div className="bg-white text-center py-20 px-6">
            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-light text-charcoal mb-2">No orders yet</h2>
            <p className="text-sm font-sans text-gray-500 mb-6">When you place an order it will appear here.</p>
            <Link href="/category/jewellery" className="btn-gold inline-block">Start Shopping</Link>
          </div>
        )}

        {/* Order list */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/account/orders/${order._id}`}
                className="group bg-white border border-gray-100 hover:border-gold-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center gap-4 p-5"
              >
                {/* Product thumbnails */}
                <div className="flex -space-x-2 flex-shrink-0">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-12 h-12 border-2 border-white rounded overflow-hidden bg-gray-100 relative">
                      {item.image && item.image !== '/images/placeholder.jpg' ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={16} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-12 h-12 border-2 border-white rounded bg-gray-100 flex items-center justify-center text-[10px] font-sans text-gray-500 font-semibold">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-sans font-semibold text-charcoal">{order.orderNumber}</p>
                    <StatusBadge status={order.orderStatus} />
                  </div>
                  <p className="text-xs font-sans text-gray-500">
                    {formatDate(order.createdAt)} &nbsp;·&nbsp;
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                    {formatPrice(order.total)}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-xs font-sans text-gold-600 mt-1">Tracking: {order.trackingNumber}</p>
                  )}
                </div>

                <ChevronRight size={16} className="text-gray-300 group-hover:text-gold-500 transition-colors flex-shrink-0 hidden sm:block" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
