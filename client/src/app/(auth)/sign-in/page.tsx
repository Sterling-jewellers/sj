'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface LoginForm { email: string; password: string; }

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/account';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setUser(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      // Admin users go to the admin dashboard (or redirect param)
      if (res.data.user.role === 'admin') {
        router.push(redirectTo.startsWith('/admin') ? redirectTo : '/admin/dashboard');
      } else {
        router.push(redirectTo.startsWith('/admin') ? '/account' : redirectTo);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-10 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-light text-charcoal">Welcome Back</h1>
          <p className="text-sm font-sans text-gray-500 mt-2">Sign in to your Sterling Jewellers account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Email Address</label>
            <input
              {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
              type="email"
              className="input-field"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-sans font-medium tracking-widest uppercase text-charcoal">Password</label>
              <Link href="/forgot-password" className="text-xs font-sans text-gold-600 hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <input
                {...register('password', { required: 'Password is required' })}
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Your password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign In
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm font-sans text-gray-500">
            New to Sterling Jewellers?{' '}
            <Link href="/sign-up" className="text-gold-600 hover:underline font-medium">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
