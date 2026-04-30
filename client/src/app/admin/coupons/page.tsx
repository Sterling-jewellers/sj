'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Plus, Trash2, Edit2, X, Check, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CouponData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxUses?: number;
  expiresAt?: string;
  isActive: boolean;
}

const emptyForm: CouponData = {
  code: '', type: 'percentage', value: 10,
  minOrderValue: undefined, maxUses: undefined, expiresAt: '', isActive: true,
};

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponData>(emptyForm);

  const { data } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons(),
  });

  const coupons = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: CouponData) => editId ? adminApi.updateCoupon(editId, data) : adminApi.createCoupon(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const handleEdit = (c: CouponData & { _id: string }) => {
    setEditId(c._id);
    setForm({
      code: c.code, type: c.type, value: c.value,
      minOrderValue: c.minOrderValue, maxUses: c.maxUses, isActive: c.isActive,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">{coupons.length} active coupon codes</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Discount Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))} className={inputCls}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (£)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Discount Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {form.type === 'percentage' ? '%' : '£'}
                </span>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                  className={`${inputCls} pl-8`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Min Order (£)</label>
              <input
                type="number"
                value={form.minOrderValue || ''}
                onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="No minimum"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max Usages</label>
              <input
                type="number"
                value={form.maxUses || ''}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Unlimited"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Expires At</label>
              <input
                type="date"
                value={form.expiresAt || ''}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.code || createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-60"
              >
                <Check size={15} />
                {createMutation.isPending ? 'Saving…' : editId ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Order</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expires</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <Tag size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No coupons yet. Create your first discount code.</p>
                </td>
              </tr>
            ) : coupons.map((c: {
              _id: string; code: string; type: string; value: number;
              minOrderValue?: number; maxUses?: number; usedCount: number;
              expiresAt?: string; isActive: boolean;
            }) => {
              const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
              return (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">{c.code}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {c.type === 'percentage' ? `${c.value}%` : `£${c.value}`}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{c.minOrderValue ? `£${c.minOrderValue}` : '—'}</td>
                  <td className="px-4 py-4 text-gray-600">
                    {c.usedCount || 0}
                    {c.maxUses ? ` / ${c.maxUses}` : ' uses'}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB') : '—'}
                    {isExpired && <span className="ml-1 text-red-500 font-medium">Expired</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', c.isActive && !isExpired ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {c.isActive && !isExpired ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(c as CouponData & { _id: string })} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) deleteMutation.mutate(c._id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
