'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface NewCustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export default function NewCustomerPage() {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<NewCustomerForm>({
    defaultValues: { role: 'user' },
  });

  const mutation = useMutation({
    mutationFn: (data: NewCustomerForm) => adminApi.createCustomer(data),
    onSuccess: () => {
      toast.success('Customer created successfully');
      router.push('/admin/customers');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to create customer');
    },
  });

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide';

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/customers" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>First Name *</label>
            <input {...register('firstName', { required: 'Required' })} className={inputCls} placeholder="James" />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Last Name *</label>
            <input {...register('lastName', { required: 'Required' })} className={inputCls} placeholder="Smith" />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Email Address *</label>
          <input type="email" {...register('email', { required: 'Required' })} className={inputCls} placeholder="james@example.com" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Password *</label>
          <input type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} className={inputCls} placeholder="Minimum 6 characters" />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Role</label>
          <select {...register('role')} className={inputCls}>
            <option value="user">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-60">
            {mutation.isPending ? 'Creating…' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
