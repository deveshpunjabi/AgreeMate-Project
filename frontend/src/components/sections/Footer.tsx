'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Sparkles, ArrowUpRight, ArrowUp } from 'lucide-react';

const productLinks = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Core Features', href: '/#features' },
  { label: 'Pricing Plans', href: '/pricing' },
  { label: 'Frequently Asked Questions', href: '/#faq' },
];

const platformLinks = [
  { label: 'App Dashboard', href: '/dashboard' },
  { label: 'User Profile', href: '/settings?tab=profile' },
  { label: 'Settings', href: '/settings' },
  { label: 'Help & Support Center', href: '/settings?tab=support' },
];

const supportLegalLinks = [
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cryptographic Hashing Spec', href: '/#features' },
];


export default function Footer() {
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === '/' && href.startsWith('/#')) {
      const targetId = href.substring(2);
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (pathname === '/' && href === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden pt-12 pb-8 px-4 sm:px-6 md:px-8 mt-16">
      {/* Background ambient lighting */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#0ea5e9]/10 via-[#003a5e]/5 to-transparent pointer-events-none -z-10" />

      <div className="container max-w-6xl mx-auto space-y-12">

        {/* Main Footer Container Card */}
        <div className="rounded-[32px] sm:rounded-[40px] border border-white/80 bg-white/70 backdrop-blur-2xl p-8 sm:p-10 md:p-12 shadow-card space-y-10">
          
          {/* Main 4-Column Navigation Grid */}
          <div className="grid gap-10 sm:gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr]">
            
            {/* Brand & Mission Statement */}
            <div className="space-y-4">
              <Link
                href="/"
                onClick={(e) => handleNavClick(e, '/')}
                className="inline-flex items-center gap-3 text-[#003a5e] select-none hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <img
                  src="/apple-touch-icon.png"
                  alt="AgreeMate Logo"
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-9 object-contain"
                />
                <div>
                  <div className="font-display text-lg font-bold tracking-tight text-[#003a5e]">
                    AgreeMate
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#0ea5e9]">
                    Lend with trust. Borrow with proof.
                  </div>
                </div>
              </Link>

              <p className="max-w-xs text-xs leading-relaxed text-[#1e2c3a]/70 font-medium">
                Tamper-proof lending platform designed to eliminate awkward lending disputes between friends, colleagues, and businesses.
              </p>
            </div>

            {/* Product Column */}
            <div className="space-y-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003a5e] flex items-center gap-1.5 border-b border-hairline/60 pb-2">
                <Sparkles className="h-3 w-3 text-[#0ea5e9]" />
                Product
              </div>
              <div className="space-y-2.5">
                {productLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    prefetch={true}
                    className="group flex items-center justify-between text-xs font-semibold text-[#1e2c3a]/75 transition-colors hover:text-[#0ea5e9]"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#0ea5e9]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* App Platform Column */}
            <div className="space-y-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003a5e] flex items-center gap-1.5 border-b border-hairline/60 pb-2">
                <ShieldCheck className="h-3 w-3 text-[#0ea5e9]" />
                Platform
              </div>
              <div className="space-y-2.5">
                {platformLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    prefetch={true}
                    className="group flex items-center justify-between text-xs font-semibold text-[#1e2c3a]/75 transition-colors hover:text-[#0ea5e9]"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#0ea5e9]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Support & Legal Column */}
            <div className="space-y-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#003a5e] border-b border-hairline/60 pb-2">
                Support & Legal
              </div>
              <div className="space-y-2.5">
                {supportLegalLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    prefetch={true}
                    className="group flex items-center justify-between text-xs font-semibold text-[#1e2c3a]/75 transition-colors hover:text-[#0ea5e9]"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#0ea5e9]" />
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* Divider */}
          <hr className="border-hairline/60" />

          {/* Bottom Copyright & Back to Top Row */}
          <div className="flex flex-col gap-4 text-xs font-semibold text-[#1e2c3a]/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} AgreeMate Inc. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[#003a5e] font-bold hidden md:inline">Built for awkward-free lending.</span>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline bg-white hover:bg-canvas-soft text-[#003a5e] text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                Back to top
                <ArrowUp className="w-3.5 h-3.5 text-[#0ea5e9]" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
