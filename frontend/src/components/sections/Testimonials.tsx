'use client';

import React from 'react';
import { Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      quote: "Finally, I can lend my camera gear without anxiety. The evidence vault is genius.",
      author: "Rahul M.",
      role: "Photographer",
      city: "Mumbai",
      rating: 5,
      initials: "RM",
      color: "bg-[#0ea5e9]/10 text-[#005080]"
    },
    {
      quote: "My customers return items on time now. The WhatsApp reminders do the chasing for me.",
      author: "Priya S.",
      role: "Hardware Shop Owner",
      city: "Pune",
      rating: 5,
      initials: "PS",
      color: "bg-blue-500/10 text-blue-700"
    },
    {
      quote: "Used it for hostel lending. No more 'I never borrowed that' excuses.",
      author: "Arjun K.",
      role: "Engineering Student",
      city: "Bangalore",
      rating: 5,
      initials: "AK",
      color: "bg-indigo-500/10 text-indigo-700"
    },
    {
      quote: "The dispute PDF saved us ₹2L in a vendor disagreement. Worth every rupee.",
      author: "Meera D.",
      role: "Studio Manager",
      city: "Delhi",
      rating: 5,
      initials: "MD",
      color: "bg-amber-500/10 text-amber-700"
    },
    {
      quote: "Simple enough for daily use, powerful enough for legal evidence.",
      author: "Vikram T.",
      role: "Small Business Owner",
      city: "Chennai",
      rating: 4,
      initials: "VT",
      color: "bg-rose-500/10 text-rose-700"
    }
  ];

  // Duplicate testimonials thrice to ensure a seamless scrolling experience
  const scrollTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section 
      id="testimonials" 
      className="bg-transparent py-20 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      
      <div className="container max-w-6xl flex flex-col items-center relative z-10 px-4">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display font-normal text-4xl sm:text-5xl text-[#003a5e] tracking-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
            Trusted by <span className="text-[#0ea5e9]">Thousands</span>
          </h2>
          <p className="font-body text-[#1e2c3a]/80 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Real stories from students, creators, and businesses across India.
          </p>
        </div>

        {/* Infinite Scrolling Marquee */}
        <div className="w-full overflow-hidden relative py-4">
          {/* Fade overlays for smooth aesthetic edges */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-canvas via-canvas/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-canvas via-canvas/50 to-transparent z-10 pointer-events-none" />
          
          <div className="animate-marquee">
            {scrollTestimonials.map((test, idx) => (
              <div
                key={idx}
                className="w-[280px] sm:w-[320px] flex-shrink-0 mx-3 rounded-2xl bg-white border border-hairline p-5 sm:p-6 flex flex-col justify-between shadow-card hover:shadow-raised transition-shadow duration-300"
              >
                {/* Review info */}
                <div>
                  {/* Rating Stars */}
                  <div className="flex gap-0.5 mb-3.5">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <Star 
                        key={starIdx} 
                        className={`w-3.5 h-3.5 ${starIdx < test.rating ? 'text-amber-400 fill-amber-400' : 'text-black/5'}`} 
                      />
                    ))}
                  </div>
                  <p className="font-body text-xs sm:text-[13px] text-[#1e2c3a]/80 font-medium leading-relaxed mb-6 whitespace-normal">
                    "{test.quote}"
                  </p>
                </div>

                {/* Profile row */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[11px] uppercase ${test.color} shadow-sm border border-white/50`}>
                    {test.initials}
                  </div>
                  <div>
                    <div className="font-body font-bold text-[#003a5e] text-xs mb-0.5">{test.author}</div>
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#1e2c3a]/40">{test.role} • {test.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 35s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `
      }} />
    </section>
  );
}
