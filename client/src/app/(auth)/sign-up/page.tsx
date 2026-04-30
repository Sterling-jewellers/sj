'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await authApi.register({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password });
      setUser(res.data.user, res.data.token);
      toast.success('Account created! Welcome to Sterling Jewellers.');
      router.push('/account');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-10 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-light text-charcoal">Create Account</h1>
          <p className="text-sm font-sans text-gray-500 mt-2">Join Sterling Jewellers for exclusive benefits</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">First Name</label>
              <input {...register('firstName', { required: 'Required' })} className="input-field" placeholder="Jane" />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Last Name</label>
              <input {...register('lastName', { required: 'Required' })} className="input-field" placeholder="Smith" />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Email Address</label>
            <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} type="email" className="input-field" placeholder="you@example.com" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Password</label>
            <div className="relative">
              <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} type={showPassword ? 'text' : 'password'} className="input-field pr-10" placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-sans font-medium tracking-widest uppercase text-charcoal mb-2">Confirm Password</label>
            <input {...register('confirmPassword', { required: 'Please confirm password', validate: (v) => v === watch('password') || 'Passwords do not match' })} type="password" className="input-field" placeholder="Repeat password" />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 mt-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-xs font-sans text-gray-400 text-center mt-4">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-gold-600 hover:underline">Terms</Link> and{' '}
          <Link href="/privacy" className="text-gold-600 hover:underline">Privacy Policy</Link>.
        </p>

        <div className="text-center mt-4">
          <p className="text-sm font-sans text-gray-500">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-gold-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
