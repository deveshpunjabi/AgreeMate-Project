'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Capture what is being lent',
    description:
      'Add a photo, notes, serial number, or value. AgreeMate turns that handoff context into a durable evidence snapshot from the very beginning.',
  },
  {
    number: '02',
    title: 'Set terms without friction',
    description:
      'Choose the due date, return expectations, and optional penalties. It stays lightweight enough for friends, students, and small operators.',
  },
  {
    number: '03',
    title: 'Lock in mutual consent',
    description:
      'Both sides review the same terms and approve the same state. That shared confirmation becomes the reference point if anything changes later.',
  },
  {
    number: '04',
    title: 'Let the system handle it',
    description:
      'Automatic WhatsApp/email reminders, timeline logs, and export-ready receipts keep the process calm from pickup to return.',
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const isDesktop = window.innerWidth >= 1024;
            const type = entry.target.getAttribute('data-type');
            
            if (isDesktop && type === 'sentinel') {
              const index = Number(entry.target.getAttribute('data-index') || 0);
              setActiveStep(index);
            } else if (!isDesktop && type === 'card') {
              const index = Number(entry.target.getAttribute('data-index') || 0);
              setActiveStep(index);
            }
          }
        });
      },
      {
        rootMargin: '-20% 0px -40% 0px',
        threshold: 0.1,
      }
    );

    const currentStepRefs = stepRefs.current;
    const currentSentinelRefs = sentinelRefs.current;

    currentStepRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    currentSentinelRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentStepRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
      currentSentinelRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const handleStepClick = (idx: number) => {
    if (window.innerWidth >= 1024) {
      sentinelRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' });
    } else {
      stepRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section id="how-it-works" className="bg-transparent relative lg:h-[400vh]">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-t from-[#0ea5e9]/5 via-transparent to-transparent" />
      
      {/* Sticky Viewport Container */}
      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] flex lg:items-center py-24 lg:py-0 overflow-hidden relative z-10 w-full">
        <div className="container max-w-5xl w-full">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 items-center">
            
            {/* Left panel (Sticky header & navigation) */}
            <div className="w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-hairline shadow-sm text-[10px] font-extrabold uppercase tracking-widest text-[#005080] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                The lending flow
              </div>
              
              {/* Header */}
              <h2 className="max-w-[15ch] text-4xl sm:text-5xl lg:text-6xl text-[#003a5e] font-display font-normal tracking-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
                Premium clarity <br />in four <span className="text-[#0ea5e9]">calm steps.</span>
              </h2>
              
              {/* Subtitle */}
              <p className="max-w-md text-sm leading-relaxed text-[#1e2c3a]/80 font-medium mb-10">
                The experience is designed to feel structured without becoming heavy, so people actually use it when trust matters.
              </p>

              {/* Navigation Indicators */}
              <div className="flex flex-wrap gap-3 lg:flex-col max-w-xs">
                {steps.map((step, idx) => (
                  <button
                    key={step.number}
                    onClick={() => handleStepClick(idx)}
                    className={`flex items-center gap-4 rounded-full border px-5 py-3 text-left transition-all duration-300 ${
                      activeStep === idx
                        ? 'border-hairline bg-white shadow-md text-[#003a5e]'
                        : 'border-transparent bg-white/30 text-[#1e2c3a]/50 hover:text-[#003a5e] hover:bg-white/50 hover:shadow-sm'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-extrabold tracking-widest transition-colors duration-300 ${
                        activeStep === idx ? 'bg-[#003a5e] text-white' : 'bg-[#1e2c3a]/10 text-[#1e2c3a]/50'
                      }`}
                    >
                      {step.number}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest">
                      {step.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right panel (Stacked cards on desktop, scrolled cards on mobile) */}
            <div className="pt-10 lg:pt-0 lg:grid lg:grid-cols-1 lg:grid-rows-1 w-full relative">
              {steps.map((step, idx) => (
                <div
                  key={step.number}
                  ref={(el) => { stepRefs.current[idx] = el; }}
                  data-index={idx}
                  data-type="card"
                  className={`rounded-2xl p-8 sm:p-10 border 
                    lg:col-start-1 lg:row-start-1 lg:w-full
                    ${
                      activeStep === idx 
                        ? 'border-hairline bg-white shadow-raised scale-[1.02] opacity-100 z-10 translate-y-0 lg:card-3d-active' 
                        : `border-hairline-soft bg-white/30 opacity-40 scale-[0.97] lg:opacity-0 lg:pointer-events-none ${
                            idx < activeStep ? 'lg:card-3d-past' : 'lg:card-3d-future'
                          }`
                    }
                  `}
                  style={{
                    transition: activeStep === idx 
                      ? 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.5s, background-color 0.5s, box-shadow 0.5s'
                      : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease-out, border-color 0.4s, background-color 0.4s, box-shadow 0.4s',
                    willChange: 'transform, opacity',
                    zIndex: activeStep === idx ? 10 : idx,
                  }}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#0ea5e9] mb-4">Step {step.number}</div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#003a5e] mb-4">{step.title}</h3>
                  <p className="max-w-2xl text-[14px] sm:text-[15px] leading-relaxed text-[#1e2c3a]/80 font-medium">{step.description}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Invisible Desktop Sentinels for Scroll Tracking */}
      <div className="absolute inset-0 pointer-events-none hidden lg:flex lg:flex-col">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            ref={(el) => { sentinelRefs.current[idx] = el; }}
            data-index={idx}
            data-type="sentinel"
            className="h-screen w-full"
          />
        ))}
      </div>
    </section>
  );
}
