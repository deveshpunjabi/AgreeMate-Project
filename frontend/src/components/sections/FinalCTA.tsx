'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24 text-center bg-gradient-to-r from-primary to-crypto noise-overlay">
      {/* Dynamic Background glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-4xl relative z-10 flex flex-col items-center">
        {/* Headline */}
        <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight mb-4 max-w-2xl">
          Ready to Lend with Confidence?
        </h2>
        
        {/* Subtitle */}
        <p className="font-body text-white/90 text-base sm:text-lg max-w-lg mb-10 leading-relaxed">
          Join 2,500+ users who trust AgreeMate. Set terms, upload evidence, and protect your items. Free forever.
        </p>

        {/* CTA Button */}
        <div className="mb-6 w-full sm:w-auto px-4">
          <Link 
            href="/signup" 
            prefetch={true}
            className="btn-white w-full sm:w-auto flex items-center justify-center gap-2 group text-base font-semibold py-4 px-8 rounded-full bg-white text-primary hover:scale-[1.03] transition-transform duration-300"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Trust bulletpoints */}
        <div className="font-body text-xs text-white/70 font-medium tracking-wide uppercase flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>No credit card required</span>
          <span className="hidden sm:inline">•</span>
          <span>Free forever</span>
          <span className="hidden sm:inline">•</span>
          <span>5GB evidence storage included</span>
        </div>
      </div>
    </section>
  );
}
