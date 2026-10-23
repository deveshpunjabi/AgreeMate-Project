'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import confetti from 'canvas-confetti';
import { authApi } from '@/lib/api/auth';
import { isAdminUser } from '@/lib/api/admin';
import Button from '@/components/ui/Button';

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="w-6 h-6 border-2 border-[#0ea5e9]/30 border-t-[#0ea5e9] rounded-full animate-spin mb-4" />
        <p className="text-[11px] text-[#1e2c3a]/80 font-bold uppercase tracking-wider">Preparing verification form...</p>
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const { setAuth } = useAuthStore();

  const [sessionData, setSessionData] = useState<{ email: string; name: string } | null>(null);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Session / Email validation
  useEffect(() => {
    // 1. Direct email parameter in URL
    if (emailParam && emailParam.includes('@')) {
      let name = emailParam.split('@')[0];
      if (token) {
        try {
          const sessionStr = sessionStorage.getItem(`otp_session_${token}`);
          if (sessionStr) {
            const parsed = JSON.parse(sessionStr);
            if (parsed.name) name = parsed.name;
          }
        } catch {}
      }
      setSessionData({ email: emailParam.trim(), name });
      setIsInitializing(false);
      return;
    }

    // 2. Token in sessionStorage
    if (token) {
      try {
        const sessionStr = sessionStorage.getItem(`otp_session_${token}`);
        if (sessionStr) {
          const data = JSON.parse(sessionStr);
          if (data?.email && typeof data.email === 'string') {
            setSessionData({ email: data.email, name: data.name || data.email.split('@')[0] });
            setIsInitializing(false);
            return;
          }
        }
      } catch {}
    }

    // 3. Fallback to unverified login stored email
    try {
      const storedEmail = sessionStorage.getItem('verify_email');
      if (storedEmail && storedEmail.includes('@')) {
        setSessionData({ email: storedEmail.trim(), name: storedEmail.split('@')[0] });
        setIsInitializing(false);
        return;
      }
    } catch {}

    // 4. No session: allow entering email manually
    setIsInitializing(false);
  }, [token, emailParam]);

  const email = sessionData?.email || '';

  // Timer cooldown logic
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle single character change
  const handleChange = (value: string, idx: number) => {
    if (!/^[0-9]?$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input cell
    if (value && idx < 5) {
      inputRefs[idx + 1].current?.focus();
    }
  };

  // Backspace deletion handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
      const newOtp = [...otp];
      newOtp[idx - 1] = '';
      setOtp(newOtp);
    }
  };

  // Multi-digit paste handling
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!/^[0-9]{6}$/.test(pastedText)) return; // Require exactly 6 digits

    const digits = pastedText.split('');
    setOtp(digits);
    setError(null);
    inputRefs[5].current?.focus(); // Focus last cell
  };

  const handleResend = async () => {
    const targetEmail = email || manualEmailInput.trim();
    if (cooldown > 0 || !targetEmail) return;
    setIsLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      await authApi.resendOtp(targetEmail);
      setCooldown(60);
      setOtp(Array(6).fill(''));
      setSuccessNotice('A fresh verification code has been dispatched to your email.');
      inputRefs[0].current?.focus();
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    const targetEmail = email || manualEmailInput.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Real backend OTP verification
      const res = await authApi.verifyOtp({ email: targetEmail, otp_code: fullOtp });
      setAuth(res.user, res.access_token, res.refresh_token);

      if (token) {
        try { sessionStorage.removeItem(`otp_session_${token}`); } catch {}
      }
      try { sessionStorage.removeItem('verify_email'); } catch {}

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (isAdminUser(res.user)) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail;

      setError(errorMsg || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        {error ? (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-600 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <span className="w-6 h-6 border-2 border-[#0ea5e9]/30 border-t-[#0ea5e9] rounded-full animate-spin mb-4" />
            <p className="text-[11px] text-[#1e2c3a]/80 font-bold uppercase tracking-wider">Validating secure session...</p>
          </>
        )}
      </div>
    );
  }

  if (!sessionData && !email) {
    return (
      <div>
        <div className="text-center mb-6">
          <h2 className="font-display font-normal text-[#003a5e] tracking-tight text-2xl">Verify Your Email</h2>
          <p className="font-body text-sm text-[#1e2c3a]/80 mt-2 leading-relaxed">
            Enter your email address to complete verification and enter your 6-digit code.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-600 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="font-body font-bold text-[10px] text-[#1e2c3a]/70 uppercase tracking-wider block mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input
                type="email"
                placeholder="name@example.com"
                value={manualEmailInput}
                onChange={(e) => setManualEmailInput(e.target.value)}
                className="w-full bg-white/70 border border-[#e2e8f0] rounded-xl pl-11 pr-4 py-3 text-sm text-[#1e2c3a] focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
          </div>

          <Button
            onClick={() => {
              if (!manualEmailInput || !manualEmailInput.includes('@')) {
                setError('Please enter a valid email address.');
                return;
              }
              setError(null);
              setSessionData({ email: manualEmailInput.trim(), name: manualEmailInput.trim().split('@')[0] });
              authApi.resendOtp(manualEmailInput.trim()).catch(() => {});
            }}
            fullWidth
            iconRight={<ArrowRight className="w-4 h-4" />}
            className="rounded-xl min-h-12 text-sm"
          >
            Continue to Code Entry
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs font-bold text-[#0068a3] hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="font-display font-normal text-[#003a5e] tracking-tight text-2xl">Enter Code</h2>
        <p className="font-body text-sm text-[#1e2c3a]/80 mt-2 leading-relaxed">
          We sent a verification code to <span className="font-semibold text-[#003a5e]">{email}</span>.
        </p>
      </div>

      {successNotice && (
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-600 text-xs font-semibold animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* OTP Grid inputs */}
      <div className="flex justify-between items-center gap-2 mb-8" onPaste={handlePaste}>
        {otp.map((val, idx) => (
          <input
            key={idx}
            ref={inputRefs[idx]}
            type="text"
            maxLength={1}
            value={val}
            onChange={(e) => handleChange(e.target.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className="w-10 sm:w-12 h-12 sm:h-14 text-center font-display text-xl font-bold rounded-xl border-2 border-[#1e2c3a]/10 focus:border-[#0ea5e9] focus:bg-white outline-none bg-white/70 text-[#003a5e] shadow-inner transition-all duration-300"
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        disabled={isLoading}
        loading={isLoading}
        fullWidth
        iconRight={<ShieldCheck className="w-4 h-4" />}
        className="mb-6 rounded-xl min-h-12 text-sm"
      >
        Verify OTP
      </Button>

      {/* Resend Cooldown triggers */}
      <div className="text-center text-xs font-bold uppercase tracking-wider">
        {cooldown > 0 ? (
          <span className="text-[#1e2c3a]/80">Resend code in <span className="text-[#003a5e]">{cooldown}s</span></span>
        ) : (
          <button
            onClick={handleResend}
            disabled={isLoading}
            className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 focus:outline-none transition-colors duration-300"
          >
            Resend Verification Code
          </button>
        )}
      </div>
    </div>
  );
}
