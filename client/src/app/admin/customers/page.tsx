'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, User, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => adminApi.getCustomers({ page, limit: 20, search }),
  });

  const customers = data?.data?.customers || [];
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{total} registered customers</p>
        </div>
        <Link href="/admin/customers/new" className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">
          <UserPlus size={15} /> New Customer
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg">Search</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Spent</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : customers.map((c: {
                  _id: string; firstName: string; lastName: string; email: string;
                  avatar?: string; provider: string; orderCount: number;
                  totalSpent: number; createdAt: string;
                }) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                          {c.avatar ? (
                            <img src={c.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            (c.firstName?.[0] || '') + (c.lastName?.[0] || '')
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{c.email}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900">{c.orderCount}</span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{formatPrice(c.totalSpent)}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.provider === 'google' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {c.provider}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/customers/${c._id}`} className="p-1.5 inline-flex text-gray-400 hover:text-amber-600 transition-colors">
                        <User size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages}</p>
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
