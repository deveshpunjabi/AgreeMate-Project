'use client';

import React from 'react';
import { MapPin, Calendar, ArrowUpRight, Users, Heart, Zap } from 'lucide-react';
import Link from 'next/link';

const values = [
  {
    icon: Users,
    title: 'Extreme Trust',
    description: 'We believe in async-first collaboration, flexible schedules, and absolute transparency in how we run things.',
  },
  {
    icon: Heart,
    title: 'Design-Obsessed',
    description: "Every button click, animation, and paragraph of copy must feel premium. We don't settle for mediocre user experiences.",
  },
  {
    icon: Zap,
    title: 'Ownership Mentality',
    description: 'You own your feature vertical entirely. No micromanagement, just clear goals and the freedom to construct the best path.',
  },
];

const jobs = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Lead the development of our mutual-consent protocol and evidence lockers. Expert-level React, Next.js, Node.js, and PostgreSQL required.',
  },
  {
    title: 'Lead Product Designer',
    department: 'Design',
    location: 'Remote (IST/CET)',
    type: 'Full-time',
    description: 'Own the visual language, design system, and dashboard flow of AgreeMate. Experience building high-trust financial interfaces is a huge plus.',
  },
  {
    title: 'Security Operations Engineer',
    department: 'Security',
    location: 'Remote (US/EU)',
    type: 'Part-time / Contract',
    description: 'Audit our cryptographic ledger key generation, secure SHA-256 evidence databases, and run continuous vulnerability audits.',
  },
];

export default function CareersPage() {
  return (
    <section className="relative bg-gradient-to-b from-[#0ea5e9]/5 via-transparent to-transparent py-12 md:py-20 animate-[fadeInUp_0.8s_ease-out]">
      <div className="container max-w-5xl relative z-10">
        
        {/* Hero Area */}
        <div className="text-center mb-20">
          <div className="badge-premium mb-4 inline-block bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-full px-4 py-1 font-display font-normal text-[#003a5e] tracking-tight">Careers</div>
          <h1 className="font-display font-normal text-[#003a5e] tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-6">
            Help us build the <br />
            trust layer of the <span className="text-[#0ea5e9] italic font-serif">future.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed font-body text-[#1e2c3a]/80">
            AgreeMate is remote-first, design-focused, and building a lightweight mutual-consent lending network. 
            Join us to eliminate the awkwardness of borrowing and lending.
          </p>
        </div>

        {/* Culture & Values Grid */}
        <div className="mb-24">
          <h2 className="font-display font-normal text-[#003a5e] tracking-tight text-2xl sm:text-3xl text-center mb-12">Our Core Principles</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((val) => (
              <div 
                key={val.title}
                className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[24px] p-6 hover:bg-white/90 hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] mb-4">
                  <val.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-normal tracking-tight text-lg text-[#003a5e] mb-2">{val.title}</h3>
                <p className="text-xs leading-relaxed font-body text-[#1e2c3a]/80">{val.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Job Listings */}
        <div>
          <h2 className="font-display font-normal text-[#003a5e] tracking-tight text-2xl sm:text-3xl text-center mb-12">Open Opportunities</h2>
          <div className="space-y-6">
            {jobs.map((job) => (
              <div 
                key={job.title}
                className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-[24px] p-6 sm:p-8 hover:bg-white/90 hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#0ea5e9] px-2.5 py-0.5 rounded-full bg-[#0ea5e9]/10">
                      {job.department}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#1e2c3a]/60 px-2.5 py-0.5 rounded-full bg-black/5">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="font-display font-normal tracking-tight text-xl text-[#003a5e] group-hover:text-[#0ea5e9] transition-colors duration-300">
                    {job.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed font-body text-[#1e2c3a]/80 max-w-2xl">
                    {job.description}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-[#1e2c3a]/60 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 opacity-70" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 opacity-70" />
                      Posted 2d ago
                    </span>
                  </div>
                </div>

                <div>
                  <Link 
                    href={`/contact?subject=Application%20for%20${encodeURIComponent(job.title)}`}
                    className="bg-[#0ea5e9] text-white py-3.5 px-6 rounded-full font-body font-medium text-sm shadow-md hover:bg-[#0284c7] hover:shadow-lg w-full md:w-auto flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    <span>Apply Now</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-white/50 backdrop-blur-xl border border-white/80 shadow-md rounded-[24px] p-8">
            <h3 className="font-display font-normal tracking-tight text-xl text-[#003a5e] mb-2">Don't see your role?</h3>
            <p className="text-sm font-body text-[#1e2c3a]/80 max-w-md mx-auto mb-4 leading-relaxed">
              We're always looking for brilliant designers, security researchers, and developers. Reach out and pitch us your own role.
            </p>
            <Link href="/contact" className="text-sm font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors uppercase tracking-wider flex items-center justify-center gap-1">
              Send an open application <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
