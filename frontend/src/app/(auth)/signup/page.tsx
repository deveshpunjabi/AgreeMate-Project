'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import client from '@/lib/api/client';
import Button from '@/components/ui/Button';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const passwordValue = watch('password') || '';
  const hasLength = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasLower = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const strengthCount = [hasLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await client.post('/auth/signup', {
        email: data.email,
        password: data.password,
        full_name: data.fullName,
      });

      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      sessionStorage.setItem(`otp_session_${token}`, JSON.stringify({
        email: data.email,
        name: data.fullName,
        expiresAt,
      }));

      router.push(`/verify-otp?token=${token}&email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setApiError(detail.map((d: any) => d.msg).join(', '));
      } else {
        setApiError(detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display font-normal text-[#003a5e] tracking-tight text-2xl">Create an Account</h2>
        <p className="font-body text-[#1e2c3a]/60 text-sm mt-2 font-medium">Start lending and borrowing with proof.</p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mb-4 p-3 bg-danger-subtle border border-danger-border rounded-xl flex items-start gap-2 text-danger text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label className="font-body font-bold text-[10px] text-[#1e2c3a]/70 uppercase tracking-wider block mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft" />
            <input
              type="text"
              placeholder="Aarav Sharma"
              {...register('fullName')}
              className={`input-premium !pl-11 ${errors.fullName ? '!border-danger focus:!border-danger' : ''}`}
            />
          </div>
          {errors.fullName && (
            <p className="text-danger text-[10px] mt-1.5 font-semibold">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="font-body font-bold text-[10px] text-[#1e2c3a]/70 uppercase tracking-wider block mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft" />
            <input
              type="email"
              placeholder="aarav@example.com"
              {...register('email')}
              className={`input-premium !pl-11 ${errors.email ? '!border-danger focus:!border-danger' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="text-danger text-[10px] mt-1.5 font-semibold">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="font-body font-bold text-[10px] text-[#1e2c3a]/70 uppercase tracking-wider block mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`input-premium !pl-11 !pr-11 ${errors.password ? '!border-danger focus:!border-danger' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-soft hover:text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength */}
          {passwordValue.length > 0 && (
            <div className="mt-2.5 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      level <= strengthCount
                        ? strengthCount <= 1 ? 'bg-danger' : strengthCount <= 2 ? 'bg-warning' : strengthCount <= 3 ? 'bg-primary' : 'bg-success'
                        : 'bg-hairline'
                    }`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span className={`text-[9px] font-semibold ${hasLength ? 'text-success' : 'text-muted-soft'}`}>
                  {hasLength ? '✓' : '○'} 8+ chars
                </span>
                <span className={`text-[9px] font-semibold ${hasUpper ? 'text-success' : 'text-muted-soft'}`}>
                  {hasUpper ? '✓' : '○'} Uppercase
                </span>
                <span className={`text-[9px] font-semibold ${hasLower ? 'text-success' : 'text-muted-soft'}`}>
                  {hasLower ? '✓' : '○'} Lowercase
                </span>
                <span className={`text-[9px] font-semibold ${hasNumber ? 'text-success' : 'text-muted-soft'}`}>
                  {hasNumber ? '✓' : '○'} Number
                </span>
              </div>
            </div>
          )}

          {errors.password && !passwordValue && (
            <p className="text-danger text-[10px] mt-1.5 font-semibold">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          fullWidth
          iconRight={<ArrowRight className="w-4 h-4" />}
          className="!mt-6"
        >
          Sign Up
        </Button>
      </form>

      {/* Terms */}
      <p className="text-[10px] text-muted-soft text-center mt-4 leading-relaxed font-medium">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>

      {/* Footer */}
      <div className="text-center mt-6 text-sm text-[#1e2c3a]/60 font-medium">
        Already have an account?{' '}
        <Link href="/login" className="text-[#0ea5e9] hover:text-[#0068a3] font-bold transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}
