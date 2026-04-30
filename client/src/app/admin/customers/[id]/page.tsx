'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Mail, MapPin, ShoppingBag, Edit2, X, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700', dispatched: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
};

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => adminApi.getCustomer(id),
  });

  const customer = data?.data?.user;
  const orders: Array<{
    _id: string; orderNumber: string; total: number;
    orderStatus: string; paymentStatus: string; createdAt: string; items: unknown[];
  }> = data?.data?.orders || [];

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm<EditForm>();

  const updateMutation = useMutation({
    mutationFn: (formData: EditForm) => adminApi.updateCustomer(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      setEditOpen(false);
      toast.success('Customer updated successfully');
    },
    onError: () => toast.error('Failed to update customer'),
  });

  const openEdit = () => {
    if (customer) {
      resetForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        role: customer.role,
      });
      setEditOpen(true);
    }
  };

  if (isLoading) return <div className="p-8"><div className="h-8 w-48 bg-gray-100 rounded animate-pulse" /></div>;
  if (!customer) return <div className="p-8 text-gray-500">Customer not found.</div>;

  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((s, o) => s + o.total, 0);

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/customers" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
            {customer.firstName?.[0]}{customer.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{customer.firstName} {customer.lastName}</h1>
            <p className="text-sm text-gray-500">Member since {new Date(customer.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-gray-500">Spent</p>
            </div>
          </div>
          <button
            onClick={openEdit}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Edit2 size={14} /> Edit
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Edit Customer</h2>
              <button onClick={() => setEditOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input {...register('firstName', { required: 'Required' })} className={inputCls} />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Last Name *</label>
                  <input {...register('lastName', { required: 'Required' })} className={inputCls} />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>Email Address *</label>
                <input type="email" {...register('email', { required: 'Required' })} className={inputCls} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select {...register('role')} className={inputCls}>
                  <option value="user">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
                  {updateMutation.isPending ? 'Saving…' : <><Check size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <span className="break-all">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`px-2 py-0.5 rounded-full font-medium ${customer.provider === 'google' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                  {customer.provider || 'email'}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${customer.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  {customer.role}
                </span>
                {customer.isEmailVerified && <span className="text-green-600">✓ Verified</span>}
              </div>
            </div>
          </div>

          {customer.addresses?.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-1.5">
                <MapPin size={14} /> Addresses
              </h3>
              {customer.addresses.map((addr: {
                _id?: string; fullName: string; line1: string; line2?: string;
                city: string; county: string; postcode: string; country: string; isDefault: boolean;
              }) => (
                <address key={addr._id} className="not-italic text-xs text-gray-600 space-y-0.5 mb-3 last:mb-0">
                  {addr.isDefault && <span className="text-[10px] text-amber-600 font-medium block">Default</span>}
                  <p className="font-medium text-gray-800">{addr.fullName}</p>
                  <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p>{addr.city}, {addr.postcode}</p>
                </address>
              ))}
            </div>
          )}
        </div>

        {/* Order history */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
              <ShoppingBag size={14} /> Order History
            </h3>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <Link key={o._id} href={`/admin/orders/${o._id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div>
                      <p className="font-mono text-xs font-semibold text-gray-800 group-hover:text-amber-600">{o.orderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('en-GB')} · {(o.items as unknown[]).length} item{(o.items as unknown[]).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium capitalize', STATUS_COLORS[o.orderStatus] || 'bg-gray-100 text-gray-600')}>
                        {o.orderStatus}
                      </span>
                      <span className="font-semibold text-gray-900 text-sm">{formatPrice(o.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
