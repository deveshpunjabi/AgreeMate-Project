'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function LoadingScreen() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(true);
  const [fade, setFade] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('SYSTEM_INIT');

  useEffect(() => {
    // Only display loading screen on the main landing page
    if (pathname && pathname !== '/') {
      setMounted(false);
      return;
    }

    // Hide scrollbar briefly during fast splash
    document.body.style.overflow = 'hidden';

    let currentProgress = 0;
    const interval = setInterval(() => {
      // Rapid, smooth progress acceleration (~250ms total)
      currentProgress += Math.floor(Math.random() * 16) + 14;

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setStatusText('READY');

        // Reset scroll position and clear hash if on homepage
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          if (window.location.hash) {
            window.history.replaceState(null, '', '/');
          }
          window.scrollTo(0, 0);
        }

        // Fast, smooth fade out sequence
        setTimeout(() => {
          setFade(true);
          // Unmount and restore scrollbar once fade animation completes
          setTimeout(() => {
            setMounted(false);
            document.body.style.overflow = '';
          }, 350);
        }, 100);
      } else {
        setProgress(currentProgress);
        const states = [
          'SYSTEM_INIT',
          'VERIFYING_VAULT',
          'LOADING_ASSETS',
          'READY'
        ];
        const stageIndex = Math.floor((currentProgress / 100) * states.length);
        setStatusText(states[stageIndex] || 'LOADING');
      }
    }, 28);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = '';
    };
  }, [pathname]);

  if (!mounted || (pathname && pathname !== '/')) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#f8fafc]/95 backdrop-blur-md transition-all duration-350 ease-out will-change-transform ${
        fade ? 'opacity-0 scale-[1.01] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative flex flex-col items-center text-center max-w-sm px-6">
        {/* Ambient Radial Brand Glow */}
        <div className="absolute -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Logo Display with Outfit & Instrument Serif typography */}
        <h1 className="font-display font-light text-[2.75rem] text-[#003a5e] tracking-tight leading-none mb-2 select-none">
          Agree<span className="font-serif italic text-[#0ea5e9]">Mate</span>
        </h1>

        {/* Subtle tagline */}
        <span className="text-[9.5px] uppercase tracking-[0.25em] font-extrabold text-[#5c6f84] opacity-80 mb-7 block">
          Lend with Trust. Borrow with Proof.
        </span>

        {/* Monospace count progress tracker */}
        <div className="font-mono text-[11px] text-[#0ea5e9] tracking-widest font-bold mb-2.5 select-none">
          {progress.toString().padStart(3, '0')}%
        </div>

        {/* Minimalist 1px progress track */}
        <div className="w-44 h-[1.5px] bg-[#0068a3]/15 rounded-full overflow-hidden mb-3.5 relative">
          <div
            className="h-full bg-gradient-to-r from-[#0068a3] to-[#0ea5e9] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Hex-style dynamic logs */}
        <p className="font-mono text-[9px] text-[#64748b] tracking-widest font-extrabold uppercase">
          [ {statusText} ]
        </p>
      </div>
    </div>
  );
}
