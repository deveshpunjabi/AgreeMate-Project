'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Is AgreeMate really free?',
      a: 'Yes! The core platform is completely free forever. You get up to 10 active agreements, 5GB storage, SHA-256 hashing, WhatsApp reminders, and full dispute management at no cost. We only charge for extra storage (50GB for ₹99/month) or optional lawyer services.'
    },
    {
      q: 'How does the SHA-256 evidence work?',
      a: 'When you upload a photo or document, we compute a SHA-256 cryptographic hash — a unique digital fingerprint. This hash is stored separately from the file. If anyone tampers with the evidence, the hash won\'t match, proving the alteration. It\'s the same technology used in blockchain and banking.'
    },
    {
      q: 'What happens if someone disputes a lending?',
      a: 'AgreeMate generates a comprehensive PDF report containing the full agreement timeline, all evidence with verified hashes, penalty calculations, and communication history. This document is designed to be admissible in consumer courts and mediation.'
    },
    {
      q: 'Can I use it for money lending?',
      a: 'Absolutely. While AgreeMate was designed for physical items, it works perfectly for informal cash lending. Track amounts, set interest rates, configure penalty structures, and maintain a complete evidence trail — all with mutual consent.'
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. We use Argon2id for password hashing (the strongest available), JWT tokens with 15-minute expiry, and all evidence is stored in an append-only vault — meaning no one can delete or modify uploaded evidence. All API endpoints are rate-limited and protected against IDOR attacks.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-transparent py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-t from-[#0ea5e9]/5 via-transparent to-transparent" />
      <div className="container max-w-4xl relative z-10 mx-auto px-4 md:px-6">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display font-normal text-4xl sm:text-5xl text-[#003a5e] tracking-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
            Frequently Asked Questions
          </h2>
          <p className="font-body text-[#1e2c3a]/80 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Have questions about terms, security, or legal formats? We've got answers.
          </p>
        </div>

        {/* FAQ List */}
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`overflow-hidden transition-all duration-300 rounded-xl border ${
                  isOpen 
                    ? 'border-hairline bg-white shadow-card' 
                    : 'border-hairline-soft bg-white hover:border-hairline'
                }`}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-body font-bold text-[#003a5e] sm:text-lg leading-snug">
                    {faq.q}
                  </span>
                  <span className={`p-1.5 rounded-full border transition-all duration-300 ml-4 shrink-0 ${
                    isOpen ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/20' : 'bg-white/50 border-white/60'
                  }`}>
                    <Plus 
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isOpen ? 'rotate-[135deg] text-[#0ea5e9]' : 'text-[#1e2c3a]/50'
                      }`} 
                    />
                  </span>
                </button>

                {/* Answer */}
                <div
                  className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 sm:px-8 pb-8 pt-0 font-body text-[15px] text-[#1e2c3a]/80 leading-relaxed font-medium">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
