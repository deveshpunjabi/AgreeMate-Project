'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth';
import { API_URL } from '@/lib/api/client';
import Button from '@/components/ui/Button';

import { isAdminUser } from '@/lib/api/admin';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const sessionExpired = searchParams.get('session_expired') === 'true';
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setApiError(null);
    setUnverifiedEmail(null);

    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
        totp_code: totpCode ? totpCode.trim() : undefined,
      });

      setAuth(response.user, response.access_token, response.refresh_token);

      if (isAdminUser(response.user)) {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const detailStr = typeof detail === 'string' ? detail : '';

      if (detail === '2FA_REQUIRED') {
        setRequires2FA(true);
        setApiError('Two-factor authentication is required. Enter your 6-digit code or backup code.');
      } else if (
        err.response?.status === 403 &&
        (detailStr.includes('EMAIL_NOT_VERIFIED') || detailStr.toLowerCase().includes('verify your email'))
      ) {
        setUnverifiedEmail(data.email);
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        }, 1500);
      } else if (err.response?.status >= 500) {
        setApiError('Server error. Please try again later.');
      } else if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 403) {
        setApiError(detail || 'Invalid credentials or verification code.');
      } else if (!err.response) {
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.startsWith('http://')) {
          setApiError(`Mixed content blocked: Cannot connect to insecure HTTP backend (${API_URL}) from HTTPS. Please configure an HTTPS backend URL in NEXT_PUBLIC_API_URL.`);
        } else {
          setApiError(`Connection error: Could not reach AgreeMate API at ${API_URL}. Please verify the backend service is running.`);
        }
      } else {
        setApiError('Connection error. Please check your network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim()) {
      setApiError('Please enter your 6-digit code or backup code.');
      return;
    }
    const currentValues = getValues();
    await onSubmit(currentValues);
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display font-normal text-[#003a5e] tracking-tight text-2xl">
          {requires2FA ? 'Two-Factor Verification' : 'Welcome Back'}
        </h2>
        <p className="font-body text-[#1e2c3a]/60 text-sm mt-2 font-medium">
          {requires2FA ? 'Enter your 6-digit authenticator code or single-use backup code.' : 'Sign in to manage your lending agreements.'}
        </p>
      </div>

      {/* Unverified Email Warning with Direct Action Button */}
      {unverifiedEmail && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex flex-col gap-2 text-[#92400e] text-xs font-medium animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>Please verify your email address before signing in. A fresh 6-digit verification code has been dispatched to <strong>{unverifiedEmail}</strong>.</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
            <span className="text-[11px] text-amber-700/80">Redirecting to code entry...</span>
            <button
              type="button"
              onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`)}
              className="inline-flex items-center gap-1 font-bold text-[#0068a3] hover:text-[#005080] hover:underline cursor-pointer text-xs"
            >
              Enter Code Now &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Session expired */}
      {sessionExpired && !requires2FA && (
        <div className="mb-4 p-3 bg-warning-subtle border border-warning-border rounded-xl flex items-start gap-2 text-[#92400e] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Your session expired. Please sign in again.</span>
        </div>
      )}

      {/* API Error */}
      {apiError && !unverifiedEmail && (
        <div className="mb-4 p-3 bg-danger-subtle border border-danger-border rounded-xl flex items-start gap-2 text-danger text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {!requires2FA ? (
        /* Standard Login Form */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="font-body font-bold text-[10px] text-[#1e2c3a]/70 uppercase tracking-wider block mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft" />
              <input
                id="email"
                type="email"
                placeholder="aarav@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                {...register('email')}
                className={`input-premium !pl-11 !pr-4 ${errors.email ? '!border-danger focus:!border-danger' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-danger text-[10px] mt-1.5 font-semibold">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="font-body font-bold text-[10px] text-[#1e2c3a]/70 uppercase tracking-wider block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
                {...register('password')}
                className={`input-premium !pl-11 !pr-11 ${errors.password ? '!border-danger focus:!border-danger' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-soft hover:text-primary transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
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
            Sign In
          </Button>
        </form>
      ) : (
        /* 2FA Verification Form */
        <form onSubmit={handle2FASubmit} className="space-y-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 text-xs text-[#003a5e] flex items-center gap-3">
            <ShieldCheck className="size-6 text-[#0ea5e9] shrink-0" />
            <span>Enter the 6-digit verification code from your Authenticator App (Google Authenticator, Microsoft Authenticator, 1Password).</span>
          </div>

          <div>
            <label htmlFor="totpCode" className="font-body font-bold text-[10px] text-[#1e2c3a]/70 uppercase tracking-wider block mb-2">
              Authentication Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft" />
              <input
                id="totpCode"
                type="text"
                maxLength={10}
                placeholder="123456"
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                className="input-premium !pl-11 !pr-4 font-mono text-center tracking-[0.3em] text-lg font-bold"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !totpCode.trim()}
            loading={isLoading}
            fullWidth
            iconRight={<ArrowRight className="w-4 h-4" />}
            className="!mt-6"
          >
            Verify &amp; Sign In
          </Button>

          <button
            type="button"
            onClick={() => {
              setRequires2FA(false);
              setTotpCode('');
              setApiError(null);
            }}
            className="w-full text-center text-xs font-semibold text-[#0068a3] hover:text-[#003a5e] pt-2 cursor-pointer"
          >
            ← Back to regular sign in
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="text-center mt-6 text-sm text-[#1e2c3a]/60 font-medium">
        New to AgreeMate?{' '}
        <Link href="/signup" className="text-[#0ea5e9] hover:text-[#0068a3] font-bold transition-colors">
          Create an account
        </Link>
      </div>
    </div>
  );
}
