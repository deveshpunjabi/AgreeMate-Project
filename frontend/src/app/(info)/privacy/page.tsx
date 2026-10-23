'use client';

import React from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <section className="relative bg-gradient-to-b from-[#0ea5e9]/5 via-transparent to-transparent py-12 md:py-20 animate-[fadeInUp_0.8s_ease-out]">
      <div className="container max-w-4xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="badge-premium mb-4 inline-block bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-full px-4 py-1 font-display font-normal text-[#003a5e] tracking-tight">Legal</div>
          <h1 className="font-display font-normal text-[#003a5e] tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-6">
            Privacy Policy
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
            <ShieldCheck className="h-6 w-6 text-[#0ea5e9] shrink-0 mt-0.5" />
            <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed">
              At AgreeMate, we take your privacy seriously. This document outlines exactly what data we collect, how it is secured using cryptographic methods, and your rights regarding the data you store with us.
            </p>
          </div>

          <hr className="border-white/60" />

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">1. Information We Collect</h2>
            <p>
              We collect information to provide a secure, mutual-consent lending record. The data collected falls into the following categories:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> Your name, email address, password hash, and profile picture (if uploaded) to authenticate you and identify you to borrowing partners.
              </li>
              <li>
                <strong>Agreement Information:</strong> Product names, serial numbers, descriptions, estimated valuations, and photographic evidence uploaded to secure your agreements.
              </li>
              <li>
                <strong>Consent Signatures:</strong> Digital signature records, timestamps, and browser configurations linked to your specific agreement receipt hash.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">2. How We Use Your Information</h2>
            <p>
              We process your personal information only for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">System Integrity:</strong> To build and maintain the tamper-proof cryptographic ledger keys for your agreements.</li>
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">Notifications:</strong> To dispatch automated notifications (OTP codes, signature requests, return reminders, penalty notifications) via email or integrations.</li>
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">Verification:</strong> To verify the identities of lenders and borrowers before securing digital signature locks.</li>
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">Compliance:</strong> To enable legal exports (dispute receipts) containing item descriptions and consent details.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">3. Data Security & Storage</h2>
            <p>
              Your trust is our priority. We employ industry-grade methods to protect your data:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">SHA-256 Receipts:</strong> Agreement details are hashed on-device or at the API level using SHA-256. This means even if database storage is compromised, the integrity of your signed agreement remains independently verifiable.</li>
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">Encryption:</strong> Database fields are encrypted using AES-256. All communications rely on HTTPS/TLS 1.3 encryption.</li>
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">Access Control:</strong> Only authenticated users can access the attachments, serial numbers, or details of agreements they are party to.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">4. Data Sharing & Third Parties</h2>
            <p>
              We do not sell, rent, or trade your personal data. Your data is shared with third parties only in the following scenarios:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">Between Parties:</strong> Your registered email and name are shared with the specific user you invite to sign or manage an agreement.</li>
              <li><strong className="text-[#003a5e] font-display font-normal tracking-tight">Infrastructure Providers:</strong> We use secure enterprise providers (e.g., MongoDB Atlas, Cloudinary Media Storage, Google SMTP) to host databases and deliver notification alerts. These services are bound by strict data processing agreements.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">5. Your Rights & Deletion</h2>
            <p>
              You maintain full ownership of your data. You have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-3 marker:text-[#0ea5e9]">
              <li>Access, correct, or export your profile information and agreement logs.</li>
              <li>Delete your account at any time. Account deletion triggers a complete cascade purge of your personal details. Note that signed hashes associated with active agreements containing other users will remain active to protect the borrower-lender legal record.</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">6. Contact Privacy Team</h2>
            <p>
              For privacy-related questions, data export requests, or to report data protection issues, please email our security officer at:
            </p>
            <a href="mailto:privacy@agreemate.com" className="text-sm font-medium text-[#0ea5e9] hover:text-[#0284c7] hover:underline transition-colors">
              privacy@agreemate.com
            </a>
          </div>

          </div>
        </div>

      </div>
    </section>
  );
}
