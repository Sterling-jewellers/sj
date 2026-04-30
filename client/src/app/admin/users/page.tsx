'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Plus, Search, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const emptyUser: NewUser = { firstName: '', lastName: '', email: '', password: '', role: 'user' };

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewUser>(emptyUser);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => adminApi.getCustomers({ page, limit: 20, search }),
  });

  const createMutation = useMutation({
    mutationFn: (data: NewUser) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sj_token')}` },
        body: JSON.stringify(data),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message || 'Failed to create user');
        // If admin role needed, update after creation
        if (data.role === 'admin') {
          await adminApi.updateUserRole(json.user._id, 'admin');
        }
        return json;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
      setShowForm(false);
      setForm(emptyUser);
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const customers = data?.data?.customers || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{total} registered accounts</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyUser); setFormError(''); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Create User Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Create New User</h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">First Name *</label>
              <input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last Name *</label>
              <input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as 'user' | 'admin' }))} className={inputCls}>
                <option value="user">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.firstName || !form.email || !form.password || createMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-60"
            >
              <Check size={15} />
              {createMutation.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search users…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg">Search</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              : customers.map((c: {
                  _id: string; firstName: string; lastName: string; email: string;
                  role: string; provider: string; orderCount: number; createdAt: string;
                }) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </div>
                        <span className="font-medium text-gray-900">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{c.email}</td>
                    <td className="px-4 py-4">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', c.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600')}>
                        {c.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', c.provider === 'google' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600')}>
                        {c.provider}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{c.orderCount}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
