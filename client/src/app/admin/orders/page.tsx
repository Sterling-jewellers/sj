'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled', 'returned'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  dispatched: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status, search],
    queryFn: () => adminApi.getOrders({ page, limit: 20, status, search }),
  });

  const orders = data?.data?.orders || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Order number…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 w-52"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg">Search</button>
        </form>

        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors',
                status === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : orders.map((o: {
                  _id: string; orderNumber: string;
                  user?: { firstName: string; lastName: string; email: string };
                  guestEmail?: string;
                  items: unknown[]; total: number;
                  paymentStatus: string; orderStatus: string; createdAt: string;
                }) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-gray-800">{o.orderNumber}</p>
                    </td>
                    <td className="px-4 py-4">
                      {o.user ? (
                        <div>
                          <p className="font-medium text-gray-900">{o.user.firstName} {o.user.lastName}</p>
                          <p className="text-xs text-gray-400">{o.user.email}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs">{o.guestEmail || 'Guest'}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{formatPrice(o.total)}</td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        o.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' :
                        o.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        o.paymentStatus === 'failed' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                      )}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize', STATUS_COLORS[o.orderStatus] || 'bg-gray-100 text-gray-600')}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/orders/${o._id}`} className="p-1.5 inline-flex text-gray-400 hover:text-amber-600 transition-colors">
                        <ExternalLink size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages} · {total} orders</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
