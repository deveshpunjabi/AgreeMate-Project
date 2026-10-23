'use client';

import React from 'react';
import { Key, Cpu, Lock, Server, FileCheck, Mail, ShieldAlert } from 'lucide-react';

const securityFeatures = [
  {
    icon: Key,
    title: 'SHA-256 Evidence Keys',
    description: 'Every agreement generates a unique cryptographic receipt hash utilizing SHA-256. This acts as a digital fingerprint that guarantees the terms and evidence have not been altered.',
  },
  {
    icon: Lock,
    title: 'Dual Signature Consent',
    description: 'Agreements cannot be activated or finalized without verifiable consent signatures from both the lender and borrower, locked onto the receipt hash.',
  },
  {
    icon: Server,
    title: 'Data Encryption',
    description: 'All sensitive customer records and physical item details are encrypted using AES-256 at rest and HTTPS/TLS 1.3 in transit.',
  },
  {
    icon: Cpu,
    title: 'Vulnerability Isolation',
    description: 'We run on sandboxed serverless environments with strict least-privilege IAM policies, ensuring components remain fully isolated.',
  },
];

export default function SecurityPage() {
  return (
    <section className="relative bg-gradient-to-b from-[#0ea5e9]/5 via-transparent to-transparent py-12 md:py-20 animate-[fadeInUp_0.8s_ease-out]">
      <div className="container max-w-5xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="badge-premium mb-4 inline-block bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-full px-4 py-1 font-display font-normal text-[#003a5e] tracking-tight">Security</div>
          <h1 className="font-display font-normal text-[#003a5e] tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-6">
            Cryptographic trust <br />
            built into every <span className="text-[#0ea5e9] italic font-serif">record.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed font-body text-[#1e2c3a]/80">
            AgreeMate is designed around proof, not just promises. Our security posture ensures that your mutual-consent lending data remains private, secure, and legally reliable.
          </p>
        </div>

        {/* Security Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-20">
          {securityFeatures.map((feat) => (
            <div 
              key={feat.title}
              className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[24px] p-8 hover:bg-white/90 hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex gap-5 group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] transition-transform duration-500 group-hover:scale-110">
                <feat.icon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-normal tracking-tight text-lg text-[#003a5e]">{feat.title}</h3>
                <p className="text-xs leading-relaxed font-body text-[#1e2c3a]/80">{feat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Evidence Verification Process Section */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[28px] p-8 sm:p-10 mb-20 relative overflow-hidden transition-all duration-500 hover:bg-white/80">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[#0ea5e9]/5 pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <h2 className="font-display font-normal tracking-tight text-2xl text-[#003a5e] mb-4 flex items-center gap-3">
              <FileCheck className="h-6 w-6 text-[#0ea5e9]" />
              The Consent Proof Loop
            </h2>
            <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed mb-8">
              When you lend or borrow on AgreeMate, the agreement parameters (item, serial number, estimated value, penalty fees, and durations) are converted into a structured payload.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start group">
                <div className="h-8 w-8 rounded-full bg-white border border-[#0ea5e9]/20 shadow-sm flex items-center justify-center text-xs font-bold text-[#0ea5e9] shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-500">1</div>
                <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed">
                  <strong className="text-[#003a5e] font-display font-normal tracking-tight">Signature Hash Generation:</strong> AgreeMate builds a canonical JSON structure containing all terms and hashes it locally in the browser to ensure terms are frozen.
                </p>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="h-8 w-8 rounded-full bg-white border border-[#0ea5e9]/20 shadow-sm flex items-center justify-center text-xs font-bold text-[#0ea5e9] shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-500">2</div>
                <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed">
                  <strong className="text-[#003a5e] font-display font-normal tracking-tight">Lender & Borrower Consent:</strong> Both parties must cryptographically sign off on this specific hash. Even a single character change in the terms will completely invalidate the receipt hash.
                </p>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="h-8 w-8 rounded-full bg-white border border-[#0ea5e9]/20 shadow-sm flex items-center justify-center text-xs font-bold text-[#0ea5e9] shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-500">3</div>
                <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed">
                  <strong className="text-[#003a5e] font-display font-normal tracking-tight">SHA-256 Key Export:</strong> The final receipt key is stored and can be exported as a PDF with legal-ready dispute data, making it audit-ready for small claims court or insurance claims.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Bounty & Reporting */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[24px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all duration-500 hover:bg-white/90">
          <div className="space-y-3">
            <h2 className="font-display font-normal tracking-tight text-xl text-[#003a5e] flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Responsible Disclosure
            </h2>
            <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed max-w-2xl">
              We value the contributions of security researchers. If you discover a vulnerability within AgreeMate, please report it to us privately. We will coordinate remediation and acknowledge your contributions.
            </p>
          </div>
          <div className="shrink-0">
            <a 
              href="mailto:security@agreemate.com"
              className="bg-[#0ea5e9] text-white py-3.5 px-6 rounded-full font-body font-medium text-sm shadow-md hover:bg-[#0284c7] hover:shadow-lg w-full flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group"
            >
              <Mail className="h-4 w-4 transition-transform group-hover:scale-110" />
              Report Vulnerability
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
