'use client';

import React from 'react';
import { Cookie, Calendar } from 'lucide-react';

const cookieList = [
  {
    name: 'agreemate_session',
    type: 'Essential',
    purpose: 'Stores your active authentication session and cryptographic workspace locks.',
    duration: '30 Days',
  },
  {
    name: 'agreemate_preferences',
    type: 'Preference',
    purpose: 'Saves user theme selections, UI configurations, and sidebar layout settings.',
    duration: '1 Year',
  },
  {
    name: '_ga / _gid',
    type: 'Analytics',
    purpose: 'Measures anonymized usage patterns to help us improve page loads and design.',
    duration: '2 Years',
  },
];

export default function CookiesPage() {
  return (
    <section className="relative bg-gradient-to-b from-[#0ea5e9]/5 via-transparent to-transparent py-12 md:py-20 animate-[fadeInUp_0.8s_ease-out]">
      <div className="container max-w-4xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="badge-premium mb-4 inline-block bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-full px-4 py-1 font-display font-normal text-[#003a5e] tracking-tight">Legal</div>
          <h1 className="font-display font-normal text-[#003a5e] tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-6">
            Cookies Policy
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
            <Cookie className="h-6 w-6 text-[#0ea5e9] shrink-0 mt-0.5" />
            <p className="text-sm font-body text-[#1e2c3a]/80 leading-relaxed">
              AgreeMate uses standard cookies to enable essential services, save interface preferences, and analyze anonymized page metrics. We respect your choice regarding the tracking methods in use.
            </p>
          </div>

          <hr className="border-white/60" />

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your computer or mobile device by your web browser when you visit a site. They contain unique identifier keys that allow websites to recognize your device across page changes, authenticate sessions, and track configuration settings.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">2. How We Use Cookies</h2>
            <p>
              We classify cookies into three categories. We do not use any advertising or marketing retargeting cookies.
            </p>
            
            {/* Cookies Table */}
            <div className="overflow-x-auto mt-6 bg-white/50 backdrop-blur-xl border border-white/80 shadow-sm rounded-[24px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/60 bg-[#0ea5e9]/5 text-[10px] font-bold uppercase tracking-wider text-[#1e2c3a]/60">
                    <th className="p-5 font-body">Cookie Name</th>
                    <th className="p-5 font-body">Classification</th>
                    <th className="p-5 font-body">Purpose</th>
                    <th className="p-5 font-body">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {cookieList.map((cook) => (
                    <tr key={cook.name} className="hover:bg-white/40 transition-colors">
                      <td className="p-5 font-mono text-xs text-[#0ea5e9] font-medium">{cook.name}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                          cook.type === 'Essential' 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20'
                        }`}>
                          {cook.type}
                        </span>
                      </td>
                      <td className="p-5 text-sm font-body text-[#1e2c3a]/80 leading-relaxed">{cook.purpose}</td>
                      <td className="p-5 text-xs text-[#1e2c3a]/60 font-bold whitespace-nowrap">{cook.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">3. Managing Your Cookies</h2>
            <p>
              Most web browsers automatically accept cookies, but you can configure your browser settings to reject cookies or prompt you before accepting one. 
            </p>
            <p>
              Please note that if you disable essential session cookies, you will be unable to log in, access the dashboard, or sign mutual-consent agreements because we rely on these secure keys to identify your active session.
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="font-display font-normal tracking-tight text-xl sm:text-2xl text-[#003a5e]">4. Queries</h2>
            <p>
              If you have any questions regarding our cookie practices, please contact our compliance desk at:
            </p>
            <a href="mailto:compliance@agreemate.com" className="text-sm font-medium text-[#0ea5e9] hover:text-[#0284c7] hover:underline transition-colors">
              compliance@agreemate.com
            </a>
          </div>

          </div>
        </div>

      </div>
    </section>
  );
}
