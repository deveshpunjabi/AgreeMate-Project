'use client';

import React from 'react';
import { FileText, Calendar } from 'lucide-react';

export default function TermsPage() {
  return (
    <section className="relative bg-gradient-to-b from-[#0ea5e9]/5 via-transparent to-transparent py-12 md:py-20 animate-[fadeInUp_0.8s_ease-out]">
      <div className="container max-w-4xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="badge-premium mb-4 inline-block bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-full px-4 py-1 font-display font-normal text-[#003a5e] tracking-tight">Legal</div>
          <h1 className="font-display font-normal text-[#003a5e] tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-6">
            Terms of Service
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs text-[#1e2c3a]/60 font-bold uppercase tracking-wider">
            <Calendar className="h-4.5 w-4.5 opacity-70" />
            <span>Last Updated: June 29, 2026</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[28px] p-8 sm:p-12 transition-all duration-500 hover:bg-white/80 space-y-10 text-sm font-body text-[#1e2c3a]/80 leading-relaxed relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[#0ea5e9]/5 pointer-events-none" />
          <div className="relative z-10 space-y-10">
          
          <div className="flex gap-4 p-5 rounded-2xl bg-white/50 border border-white/80 shadow-sm items-start">
            <FileText className="h-6 w-6 text-[#0ea5e9] shrink-0 mt-0.5" />
            <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed">
              Welcome to AgreeMate. By accessing our website or using our mutual-consent lending protocol services, you agree to comply with and be bound by the terms outlined below. Please read them carefully.
            </p>
          </div>

          <hr className="border-white/60" />

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">1. Acceptance of Terms</h2>
            <p>
              By creating an account, initiating an agreement, or clicking &quot;Accept&quot; on any lending request, you agree to these Terms of Service, all applicable laws, and regulations. If you do not agree to these terms, you are prohibited from using the platform.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">2. Description of Service</h2>
            <p>
              AgreeMate provides a digital workflow interface for creating formal mutual-consent records for physical items or informal peer-to-peer relationships. 
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li>AgreeMate is an agreement platform and record-keeper only. We do not act as an escrow agent, guarantor, or insurer.</li>
              <li>We supply cryptographic receipts (SHA-256 evidence keys) documenting user-submitted terms. The verification of the physical condition of items is the sole responsibility of the lending parties.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">3. Account Registration & Safety</h2>
            <p>
              To use the platform, you must register a verified email account. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li>Provide accurate, current, and complete registration information.</li>
              <li>Maintain the security and confidentiality of your credentials.</li>
              <li>Promptly notify AgreeMate support if you suspect any unauthorized access or breach of your account.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">4. Agreement Rules & Conduct</h2>
            <p>
              When creating agreements, you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li>You have the legal right and title to lend the physical item described.</li>
              <li>You will describe items, serial numbers, and condition accurately, and upload clear, untampered photo evidence.</li>
              <li>You will not use the platform for any illegal lending practices, extortion, or to document agreements involving prohibited items.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">5. Fees and Automated Reminders</h2>
            <p>
              AgreeMate offers a free tier as described in our pricing sheet. If you configure custom agreement penalty fees (e.g. late return charges), you acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li>Late fees are contractually agreed upon between the lender and borrower at the time of dual-signature consent.</li>
              <li>AgreeMate sends notifications and provides legal dispute exports, but does not enforce, collect, or adjudicate late fees on your behalf. Enforcement remains a civil matter between the contracting parties.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">6. Limitation of Liability</h2>
            <p>
              AgreeMate and its affiliates, directors, or employees shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li>The loss, theft, damage, or destruction of any physical items lent using our workflow.</li>
              <li>Any disputes between lenders and borrowers, including refusal to pay late fees.</li>
              <li>System downtime, database loss, or cryptographic signature key validation failure.</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">7. Contact Legal</h2>
            <p>
              For legal inquiries, dispute notifications, or formal requests, contact our compliance team at:
            </p>
            <a href="mailto:legal@agreemate.com" className="text-sm font-medium text-[#0ea5e9] hover:text-[#0284c7] hover:underline transition-colors">
              legal@agreemate.com
            </a>
          </div>

          </div>
        </div>

      </div>
    </section>
  );
}
