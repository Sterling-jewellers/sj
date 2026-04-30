'use client';

import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import Link from 'next/link';
import { User, Package, Heart, MapPin, LogOut, ChevronRight } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { IOrder } from '@/types';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders(),
    enabled: !!user,
  });

  const orders: IOrder[] = data?.data?.slice(0, 3) || [];

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    processing: 'bg-blue-50 text-blue-700',
    dispatched: 'bg-purple-50 text-purple-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="page-container max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="section-subtitle mb-1">My Account</p>
            <h1 className="font-serif text-4xl font-light text-charcoal">Welcome, {user.firstName}</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-sans text-gray-500 hover:text-red-500 transition-colors">
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Package, label: 'My Orders', href: '/account/orders', count: orders.length },
            { icon: Heart, label: 'Wishlist', href: '/account/wishlist', count: null },
            { icon: User, label: 'Profile', href: '/account/profile', count: null },
            { icon: MapPin, label: 'Addresses', href: '/account/profile', count: null },
          ].map(({ icon: Icon, label, href, count }) => (
            <Link key={label} href={href} className="bg-white p-5 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 border border-gray-100 group-hover:border-gold-300 flex items-center justify-center transition-colors">
                <Icon size={20} className="text-gold-500" />
              </div>
              <p className="text-xs font-sans font-medium tracking-widest uppercase text-charcoal">{label}</p>
              {count !== null && <span className="text-xs font-sans text-gray-400">{count} orders</span>}
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-sans font-semibold text-sm tracking-widest uppercase text-charcoal">Recent Orders</h2>
            <Link href="/account/orders" className="text-xs font-sans text-gold-600 hover:underline">View All</Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-sans text-gray-500">No orders yet</p>
              <Link href="/products" className="btn-gold inline-block mt-4 text-xs">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link key={order._id} href={`/account/orders/${order._id}`} className="flex items-center justify-between p-4 border border-gray-100 hover:border-gold-200 transition-colors group">
                  <div>
                    <p className="text-sm font-sans font-medium text-charcoal">{order.orderNumber}</p>
                    <p className="text-xs font-sans text-gray-500 mt-0.5">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-[10px] font-sans font-medium tracking-widest uppercase rounded-sm ${statusColors[order.orderStatus] || ''}`}>
                      {order.orderStatus}
                    </span>
                    <span className="text-sm font-sans font-medium text-charcoal">{formatPrice(order.total)}</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gold-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
