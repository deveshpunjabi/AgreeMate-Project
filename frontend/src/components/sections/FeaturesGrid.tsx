'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Zap,
  Columns2,
  FileText,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  MoreHorizontal,
  Download,
  ChevronRight,
  Shield,
  MessageCircle,
  Mail,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

type FeatureItem = {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  badge: string;
  badgeVariant: 'blue' | 'green' | 'amber';
  hotspot: 'hash' | 'signatures' | 'penalty' | 'diff' | 'export' | 'whatsapp';
};

const FEATURES: FeatureItem[] = [
  {
    id: 'evidence-vault',
    icon: ShieldCheck,
    title: 'SHA-256 Evidence Vault',
    desc: 'Every item photo is hashed on server intake — creating an immutable, tamper-proof court-admissible audit trail.',
    badge: 'MIL-STD GRADE',
    badgeVariant: 'blue',
    hotspot: 'hash',
  },
  {
    id: 'mutual-consent',
    icon: Lock,
    title: 'Mutual Consent Lock',
    desc: 'Agreements lock only when both Lender and Borrower sign the exact terms. Zero unapproved edits.',
    badge: 'DUAL SIGNED',
    badgeVariant: 'blue',
    hotspot: 'signatures',
  },
  {
    id: 'penalty-engine',
    icon: Zap,
    title: 'Automated Penalty Engine',
    desc: 'Late fees calculate automatically based on agreed terms — eliminating awkward personal money talks.',
    badge: 'AUTO-ACCRUING',
    badgeVariant: 'amber',
    hotspot: 'penalty',
  },
  {
    id: 'visual-diff',
    icon: Columns2,
    title: 'Side-by-Side Visual Diff',
    desc: 'Handover and return photos paired side-by-side. Any new scratches, dents, or wear are instantly obvious.',
    badge: 'PHOTO EVIDENCE',
    badgeVariant: 'green',
    hotspot: 'diff',
  },
  {
    id: 'dispute-exports',
    icon: FileText,
    title: 'Dispute-Ready Legal Exports',
    desc: 'One-click export of a complete lawyer-ready packet: signed contract PDF, raw evidence photos, and logs.',
    badge: 'PDF + ZIP PACKET',
    badgeVariant: 'blue',
    hotspot: 'export',
  },
  {
    id: 'return-nudges',
    icon: RefreshCw,
    title: 'Automated Return Nudges',
    desc: 'Gentle return reminders sent automatically via WhatsApp and Email — no uncomfortable manual chasing.',
    badge: 'WHATSAPP SYNC',
    badgeVariant: 'green',
    hotspot: 'whatsapp',
  },
];

/* ── Hardware-Accelerated Spotlight Highlight Ring ───────── */
const SpotlightRing = ({ active, className = '' }: { active: boolean; className?: string }) => (
  <span
    aria-hidden="true"
    className={`pointer-events-none absolute -inset-1 rounded-2xl transition-all duration-300 z-20 ${
      active
        ? 'opacity-100 ring-2 ring-[#0ea5e9] shadow-[0_0_24px_rgba(14,165,233,0.3)]'
        : 'opacity-0'
    } ${className}`}
  />
);

/* ── Interactive AgreeMate Product Mockup Deck ───────────── */
const MockupDeck = ({ activeHotspot }: { activeHotspot: FeatureItem['hotspot'] }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [hashValue, setHashValue] = useState('a1b1fde0e6b5faa88afdad26');

  // Subtle live cryptographic pulse (pure string swap, zero layout shift)
  useEffect(() => {
    const chars = '0123456789abcdef';
    const interval = setInterval(() => {
      const prefix = 'a1b1fde0';
      const suffix = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      setHashValue(`${prefix}${suffix}...`);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('SH256');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('a1b1fde0e6b5faa88afdad26e902c4b817e9231f82c7304192bce');
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="relative select-none w-full max-w-[640px] mx-auto lg:max-w-none">
      {/* Ambient Lighting Backplate */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-tr from-sky-400/10 via-blue-500/5 to-transparent blur-2xl" />

      {/* Main Outer App Shell */}
      <div className="relative overflow-hidden rounded-[26px] border border-slate-200/90 bg-white p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,58,94,0.07)] transition-all duration-300">
        
        {/* 1. Window Top Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2 sm:gap-4">
          {/* macOS Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>

          {/* Browser Address Pill */}
          <div className="flex flex-1 items-center justify-center max-w-[340px] gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1 text-xs text-slate-600 shadow-2xs min-w-0">
            <Lock className="h-3 w-3 text-slate-400 shrink-0" strokeWidth={2.2} />
            <span className="font-mono text-[11px] truncate text-slate-700">
              <span className="font-semibold text-slate-900">app.agreemate.in</span>
              <span className="text-slate-400">/evidence/vault/SH256</span>
            </span>
          </div>

          {/* Live & Secure Badge */}
          <div className="flex items-center gap-1.5 shrink-0 bg-emerald-50/80 border border-emerald-200/70 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Live &amp; Secure</span>
            <Shield className="h-3 w-3 text-emerald-600" strokeWidth={2.2} />
          </div>
        </div>

        {/* 2. Top Loan Card: MacBook Pro 16" M3 Max */}
        <div className="relative mb-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Stylized Laptop Hardware Badge */}
              <div className="relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-b from-[#003a5e] to-[#00243b] p-2 shadow-sm shrink-0 border border-slate-700/50">
                <svg viewBox="0 0 64 48" className="w-full h-full text-slate-200" fill="none" stroke="currentColor">
                  <rect x="8" y="6" width="48" height="30" rx="3" fill="#0b1726" stroke="#38bdf8" strokeWidth="1.5" />
                  <path d="M14 12 L32 26 L50 12" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                  <rect x="2" y="38" width="60" height="3" rx="1.5" fill="#64748b" />
                  <path d="M26 38 H38" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-[#003a5e] text-white shadow-xs">
                  <Lock className="h-2 w-2 text-white" strokeWidth={2.5} />
                </span>
              </div>

              {/* Loan Meta */}
              <div className="min-w-0">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-[15px] leading-tight truncate">
                  MacBook Pro 16&quot; M3 Max
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium truncate">
                  <span>Lender</span>
                  <span className="font-bold text-slate-800">Amit P.</span>
                  <span className="text-slate-300">→</span>
                  <span>Borrower</span>
                  <span className="font-bold text-slate-800">Sneha R.</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                  <span>Evidence ID:</span>
                  <span className="font-mono font-bold text-[#0068a3]">SH256</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copy Evidence ID"
                    className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Status */}
            <div className="text-right shrink-0">
              <div className="flex items-center justify-end gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active Loan
                </span>
                <button
                  type="button"
                  aria-label="Options"
                  className="hidden sm:flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200/70 bg-white text-slate-400"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-1 flex items-center justify-end gap-1 text-[10.5px] font-medium text-slate-500">
                <Calendar className="h-3 w-3 text-slate-400" />
                Due in 2 days
              </p>
            </div>
          </div>
        </div>

        {/* 3. Agreement Lifecycle Stepper Bar */}
        <div className="relative mb-3.5 rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between">
            {[
              { label: 'Draft', state: 'completed' },
              { label: 'Signed', state: 'completed' },
              { label: 'Active', state: 'active' },
              { label: 'Return', state: 'pending' },
              { label: 'Closed', state: 'pending' },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-5.5 w-5.5 items-center justify-center rounded-full text-[10px] font-bold ${
                      step.state === 'completed'
                        ? 'bg-[#003a5e] text-white shadow-2xs'
                        : step.state === 'active'
                        ? 'border-2 border-[#0ea5e9] bg-white text-[#0ea5e9] shadow-2xs'
                        : 'border border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {step.state === 'completed' ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : step.state === 'active' ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
                    ) : null}
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-bold ${
                      step.state === 'completed'
                        ? 'text-slate-800'
                        : step.state === 'active'
                        ? 'text-[#005080]'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-2 ${
                      idx === 0
                        ? 'bg-[#003a5e]'
                        : idx === 1
                        ? 'bg-[#0ea5e9]/50'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 4. Dynamic Hotspot 1: SHA-256 Vault Box */}
        <div className="relative mb-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all">
          <SpotlightRing active={activeHotspot === 'hash'} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#0068a3] border border-sky-100">
                <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <div>
                <h5 className="font-display font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                  Evidence Sealed &amp; Immutable
                </h5>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  SHA-256 hash calculated on server intake
                </p>
              </div>
            </div>

            {/* Live SHA-256 Hash Display */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-700 shadow-2xs">
              <span className="select-all truncate max-w-[140px] sm:max-w-[160px] font-mono">
                {hashValue}
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                title="Copy SHA-256 Hash"
                className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer shrink-0"
              >
                {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* 5. Dynamic Hotspot 2 & 3: Dual Signatures (Left) + Penalty Engine (Right) */}
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dual Signatures */}
          <div className="relative rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all">
            <SpotlightRing active={activeHotspot === 'signatures'} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Dual Signatures</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600 border border-slate-200">
                <Lock className="h-2.5 w-2.5 text-slate-500" />
                Locked
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="flex -space-x-2">
                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full border-2 border-white bg-[#003a5e] text-[9.5px] font-bold text-white shadow-2xs">
                  AP
                </div>
                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full border-2 border-white bg-[#005080] text-[9.5px] font-bold text-white shadow-2xs">
                  SR
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Mutual Consent</p>
                <div className="flex items-center gap-1 mt-0.5 text-[10.5px] font-bold text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.6} />
                  <span>OTP Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Penalty Engine */}
          <div className="relative rounded-xl border border-rose-100 bg-[#fffbfc] p-3 shadow-2xs transition-all">
            <SpotlightRing active={activeHotspot === 'penalty'} className="ring-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.3)]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-600">
                <Zap className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                <span className="text-xs font-bold text-slate-900">Penalty Engine</span>
              </div>
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase text-rose-600 border border-rose-200/70">
                Auto-Accruing
              </span>
            </div>

            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-lg font-extrabold text-rose-600">₹200</span>
              <span className="text-[11px] font-medium text-slate-500">(4d Overdue)</span>
            </div>

            <div className="mt-2 grid grid-cols-5 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-1.5 rounded-full bg-rose-500" />
              ))}
              <div className="h-1.5 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>

        {/* 6. Dynamic Hotspot 4: Side-by-Side Visual Diff Showcase */}
        {activeHotspot === 'diff' ? (
          <div className="relative mb-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 shadow-2xs transition-all">
            <SpotlightRing active={true} className="ring-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.3)]" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <Columns2 className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Visual Diff Inspection Active</span>
              </div>
              <span className="text-[9.5px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Tamper Checked
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Handover (Intake)</span>
                <span className="font-bold text-slate-800 text-[11px]">Pristine • Zero Flaws</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-emerald-300">
                <span className="text-[9px] font-mono text-emerald-600 block uppercase">Return Check</span>
                <span className="font-bold text-emerald-700 text-[11px]">100% Match • Verified</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* 7. Bottom 4 Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: WhatsApp Nudge */}
          <div className="relative rounded-xl border border-slate-200/80 bg-white p-2.5 flex flex-col justify-between shadow-2xs transition-all">
            <SpotlightRing active={activeHotspot === 'whatsapp'} />
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <MessageCircle className="h-3 w-3" />
                </span>
                <span className="text-[9.5px] font-mono text-slate-400">09:08 AM</span>
              </div>
              <h6 className="mt-1.5 text-xs font-bold text-slate-900 leading-tight">WhatsApp Nudge</h6>
              <span className="block text-[9.5px] text-slate-400 font-mono">Nudge #1</span>
              <p className="mt-1 text-[10.5px] text-slate-500 leading-tight line-clamp-2">
                Hi Sneha, the MacBook Pro is due tomorrow. Tap to...
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-[#005080]">
              <span>View Agreement</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>

          {/* Card 2: Return Nudges */}
          <div className="relative rounded-xl border border-slate-200/80 bg-white p-2.5 flex flex-col justify-between shadow-2xs transition-all">
            <SpotlightRing active={activeHotspot === 'whatsapp'} />
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[#0068a3]">
                  <Mail className="h-3 w-3" />
                </span>
                <span className="text-[9.5px] font-mono text-slate-400">After 24h</span>
              </div>
              <h6 className="mt-1.5 text-xs font-bold text-slate-900 leading-tight">Return Nudges</h6>
              <p className="mt-1 text-[10.5px] text-slate-500 leading-tight">
                Gentle reminders sent automatically via WhatsApp &amp; Email.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-[#005080]">
              <span>Settings</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>

          {/* Card 3: Report */}
          <div className="relative rounded-xl border border-sky-300 bg-white p-2.5 flex flex-col justify-between shadow-2xs ring-1 ring-sky-200/50 transition-all">
            <SpotlightRing active={activeHotspot === 'export'} />
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 text-[#0ea5e9]">
                  <FileText className="h-3 w-3" />
                </span>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Generate</span>
              </div>
              <h6 className="mt-1.5 text-xs font-bold text-slate-900 leading-tight">Report</h6>
              <p className="mt-1 text-[10.5px] text-slate-500 leading-tight">
                Detailed activity and audit report in one click.
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-[#003a5e]">
              <span>Create Report</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>

          {/* Card 4: Export Evidence PDF + ZIP Dark Vault */}
          <div className="relative rounded-xl border border-slate-800 bg-[#001f35] p-2.5 flex flex-col justify-between text-white shadow-md overflow-hidden group transition-all">
            <SpotlightRing active={activeHotspot === 'export'} className="ring-sky-400" />
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="block text-[9px] font-mono uppercase text-slate-400">Export Evidence</span>
                  <span className="block text-xs font-bold text-white mt-0.5">PDF + ZIP</span>
                </div>
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white/10 text-white group-hover:bg-white/20 transition-colors">
                  <Download className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* Cryptographic Badge */}
            <div className="mt-2 flex items-center justify-center">
              <div className="relative flex h-9 w-12 items-center justify-center rounded-lg border border-white/15 bg-white/10 shadow-inner">
                <Lock className="h-3 w-3 text-cyan-300" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ── Main FeaturesGrid Section Component ─────────────────── */
export default function FeaturesGrid() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-cycle feature spotlight every 3.8s when not hovered (zero lag)
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % FEATURES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isHovered]);

  const currentFeature = FEATURES[activeIdx];

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-transparent py-20 sm:py-28"
    >
      {/* Background Soft Glow Lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-slate-50/20 to-transparent" />

      <div className="container relative z-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto mb-14 sm:mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#005080] shadow-2xs backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#0ea5e9] animate-pulse" />
            Core Capabilities
          </div>
          <h2
            className="font-display text-3xl font-extrabold tracking-tight text-[#003a5e] sm:text-4xl md:text-5xl lg:text-[52px] leading-[1.15]"
            style={{ letterSpacing: '-0.025em' }}
          >
            Everything that makes a <br className="hidden sm:block" />
            handshake <span className="text-[#0ea5e9] italic font-serif font-normal">actually hold up.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium text-slate-600 sm:text-lg leading-relaxed font-sans">
            Six automated protections working in unison the moment trust matters.
          </p>
        </div>

        {/* 2-Column Grid: Device Mockup (Left) + 6 Feature Cards (Right) */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 xl:gap-14">
          
          {/* Left Column: Product App Mockup Deck */}
          <div className="w-full flex justify-center">
            <MockupDeck activeHotspot={currentFeature.hotspot} />
          </div>

          {/* Right Column: 6 Feature Showcase Cards */}
          <div
            className="flex flex-col gap-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {FEATURES.map((feature, idx) => {
              const IconComp = feature.icon;
              const isActive = idx === activeIdx;

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  aria-label={`Select ${feature.title} capability`}
                  className={`group relative flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer outline-none ${
                    isActive
                      ? 'border-[#0ea5e9] bg-white shadow-[0_10px_30px_rgba(14,165,233,0.14)] ring-1 ring-[#0ea5e9]/40 scale-[1.01]'
                      : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  {/* Left Icon Container */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-sky-50 border-sky-200 text-[#0068a3]'
                        : 'bg-slate-50 border-slate-200/70 text-slate-700 group-hover:bg-sky-50/70 group-hover:text-[#0068a3] group-hover:border-sky-200'
                    }`}
                  >
                    <IconComp className="h-5 w-5" strokeWidth={2.2} />
                  </div>

                  {/* Middle Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`font-display font-bold text-[15px] sm:text-base transition-colors leading-snug ${
                          isActive ? 'text-[#003a5e]' : 'text-slate-900 group-hover:text-[#003a5e]'
                        }`}
                      >
                        {feature.title}
                      </h3>

                      {/* Right Pill Badge */}
                      <span
                        className={`font-mono text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shrink-0 ${
                          feature.badgeVariant === 'green'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : feature.badgeVariant === 'amber'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                            : 'bg-sky-50 text-[#0068a3] border border-sky-200/70'
                        }`}
                      >
                        {feature.badge}
                      </span>
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {feature.desc}
                    </p>
                  </div>

                  {/* Right Chevron Arrow */}
                  <div className="shrink-0 pl-1">
                    <ChevronRight
                      className={`h-4 w-4 transition-all duration-200 ${
                        isActive
                          ? 'text-[#0ea5e9] translate-x-0.5'
                          : 'text-slate-300 group-hover:text-[#0ea5e9] group-hover:translate-x-0.5'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
