'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import TrailBorder from '@/components/ui/TrailBorder';
import VideoPlaybackButton from '@/components/ui/VideoPlaybackButton';

export default function Hero() {
  return (
    <section id="hero" className="relative w-full min-h-screen sm:h-screen overflow-hidden flex items-center justify-center bg-transparent py-20">
      {/* Background video — GPU-accelerated 0.9MB MP4 with instant 49KB WebP poster fallback */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/video/background-poster.webp"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      >
        <source src="/video/background-animation.mp4" type="video/mp4" />
      </video>

      {/* Overlay to ensure readability and match website blue-grey mist aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-transparent to-canvas/40 pointer-events-none z-0" />

      {/* Hero Copy (Centered) */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto my-auto">
        {/* Trail-orbiting Border Glow Badge */}
        <div className="reveal-on-scroll reveal-delay-100">
          <TrailBorder
            className="mb-6 select-none shadow-[0_8px_32px_0_rgba(0,104,163,0.15)]"
            accentColor="#0ea5e9"
            borderRadius={9999}
            borderWidth={2}
            trailSize={40}
            speed={5}
            borderColor="rgba(255,255,255,0.15)"
            contentBg="rgba(255,255,255,0.08)"
          >
            <div className="relative flex items-center gap-2.5 min-h-[2.2rem] px-4 py-1.5 rounded-full backdrop-blur-2xl text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-[#003a5e] !pl-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(255,255,255,0.1)] overflow-hidden">
              {/* Delicate Glass Bubble Specular Reflection */}
              <div className="absolute top-0 inset-x-3 h-[40%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />

              {/* Subtle crystal refraction */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#0ea5e9]/10 to-transparent opacity-60 pointer-events-none" />

              <span className="relative z-10 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#005080] to-[#0ea5e9] text-white text-[9px] font-black tracking-wider shadow-[0_2px_6px_rgba(0,104,163,0.35)]">
                New
              </span>
              <span className="relative z-10 font-extrabold tracking-widest text-[#003a5e] pr-1">
                Introducing AgreeMate
              </span>
            </div>
          </TrailBorder>
        </div>

        <h1
          className="font-light leading-[0.95] text-[#003a5e] text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem] max-w-5xl reveal-on-scroll reveal-delay-200"
          style={{ letterSpacing: '-0.035em' }}
        >
          Lend with Trust.
          <br />
          <span className="text-[#0ea5e9] italic font-normal">
            Borrow with Proof.
          </span>
        </h1>
        <p className="mt-6 sm:mt-8 text-[#1e2c3a] text-xs sm:text-sm md:text-base leading-relaxed max-w-md px-2 font-medium reveal-on-scroll reveal-delay-300">
          Create elegant mutual-consent lending records with tamper-proof SHA-256 evidence keys and dual digital signature locks.
        </p>

        {/* Mobile Primary Action Button */}
        <div className="sm:hidden mt-6 flex flex-col items-center gap-4 w-full">
          <Link
            href="/signup"
            prefetch={true}
            className="bg-[#005080] hover:bg-[#003a5e] text-white text-[11px] font-extrabold uppercase tracking-widest px-7 py-3 rounded-full transition-all shadow-md"
          >
            TRY IT LIVE
          </Link>
          <div className="w-full max-w-xs">
            <VideoPlaybackButton />
          </div>
        </div>
      </div>

      {/* Bottom-left CTA block — Hidden on Mobile, Only Visible in Desktop View */}
      <div className="hidden sm:block absolute left-6 md:left-10 bottom-8 md:bottom-10 z-10 max-w-sm reveal-on-scroll reveal-delay-500">
        <div className="flex items-center gap-2 text-white/95 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">
            AgreeMate
          </span>
        </div>
        <p className="text-white/90 text-xs leading-relaxed mb-6 max-w-xs font-normal">
          AgreeMate smoothly records physical assets and informal loans, protecting relationships with cryptographic validation.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/signup"
            prefetch={true}
            className="bg-white hover:bg-white/90 text-[#003a5e] text-[11px] font-extrabold uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-md"
          >
            TRY IT LIVE
          </Link>
          <Link
            href="#about"
            className="bg-white/15 hover:bg-white/25 text-white text-[11px] font-extrabold uppercase tracking-widest px-5 py-3 rounded-full border border-white/30 backdrop-blur-md transition-all shadow-xs"
          >
            KNOW MORE.
          </Link>
        </div>
      </div>

      {/* Desktop/Tablet Bottom-Right Video Playback Card */}
      <div className="absolute right-6 md:right-10 bottom-8 md:bottom-10 z-10 hidden sm:block reveal-on-scroll reveal-delay-700">
        <VideoPlaybackButton />
      </div>
    </section>
  );
}
