'use client';

import { useState } from 'react';
import { BookOpen, Store, Camera, Building2, Wallet } from 'lucide-react';

export default function TargetAudience() {
  const [activeTab, setActiveTab] = useState(0);

  const audienceData = [
    {
      label: 'Students',
      icon: <BookOpen />,
      title: 'Hostel life, shared spaces, borrowed gear.',
      description: 'Prove what you lent and get it back without the awkward follow-ups. Perfect for cameras, laptops, books, and study notes.',
      features: ['Awkwardness-free reminders', 'Zero-setup quick mode', 'Hostel roommate verification']
    },
    {
      label: 'Shopkeepers',
      icon: <Store />,
      title: 'Equipment, tools, machines.',
      description: 'Lend utility tools to customers on mutual trust. Keep photographic proof of condition at checkout to ensure it returns intact.',
      features: ['Lending liability terms', 'Overdue penalty calculations', 'Customer sign-off logs']
    },
    {
      label: 'Studios',
      icon: <Camera />,
      title: 'Cameras, premium lenses, lighting rigs.',
      description: 'Track high-value media assets. Capture high-res condition photos, sign terms electronically, and ensure proper return conditions.',
      features: ['High-res photo comparisons', 'Estimated item values', 'Admissible PDF summaries']
    },
    {
      label: 'Business',
      icon: <Building2 />,
      title: 'B2B asset tracking & office rentals.',
      description: 'Formalize internal asset assignments or vendor logistics. Generate dispute-ready SHA-256 evidence packets for physical operations.',
      features: ['Multi-member dashboards', 'Immutable history reports', 'Enterprise storage caps']
    },
    {
      label: 'Cash Lenders',
      icon: <Wallet />,
      title: 'Informal cash logs & loans.',
      description: 'Bring cryptographic accountability to cash exchanges. Log dates, amounts, interest rates, and signed repayment agreements.',
      features: ['Custom interest rate models', 'Repayment receipts log', 'Signed digital terms']
    }
  ];

  return (
    <section id="about" className="bg-transparent py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-t from-[#0ea5e9]/5 via-transparent to-transparent" />
      <div className="container max-w-6xl relative z-10">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#0ea5e9] font-mono font-bold tracking-widest text-xs uppercase mb-4 block">Tailored Solutions</span>
          <h2 className="font-display font-normal text-4xl sm:text-5xl md:text-6xl text-[#003a5e] tracking-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
            Built for Every Agreement
          </h2>
          <p className="font-body text-[#1e2c3a]/80 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Whether you're tracking B2B assets or logging informal loans, AgreeMate adapts to your exact workflow.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-start md:justify-center overflow-x-auto pb-4 mb-12 scrollbar-none">
          <div className="flex bg-white border border-hairline p-1.5 rounded-full w-max gap-1 shadow-sm">
            {audienceData.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  activeTab === idx 
                    ? 'bg-white text-[#003a5e] shadow-md border border-white/80' 
                    : 'text-[#1e2c3a]/60 hover:text-[#003a5e] hover:bg-white/50 border border-transparent'
                }`}
              >
                <span className="text-[#0ea5e9] [&>svg]:w-5 [&>svg]:h-5">{tab.icon}</span>
                <span className="whitespace-nowrap tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Card */}
        <div className="rounded-2xl bg-white border border-hairline p-8 sm:p-14 shadow-card transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="animate-fadeIn">
              <span className="text-[#0ea5e9] text-xs font-bold uppercase tracking-widest block mb-4 font-mono">
                Case Study — {audienceData[activeTab].label}
              </span>
              <h3 className="font-display font-normal text-3xl sm:text-4xl text-[#003a5e] tracking-tight mb-6 leading-snug">
                {audienceData[activeTab].title}
              </h3>
              <p className="font-body text-[#1e2c3a]/80 leading-relaxed text-[17px] mb-10 font-medium">
                {audienceData[activeTab].description}
              </p>

              {/* Bullet list */}
              <div className="flex flex-col gap-4">
                {audienceData[activeTab].features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3 text-[15px] text-[#1e2c3a]/90 font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9]">
                      <span className="text-sm">✓</span>
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual Box */}
            <div className="h-72 sm:h-96 bg-gradient-to-br from-[#0ea5e9]/5 to-transparent border border-hairline rounded-2xl p-6 relative overflow-hidden flex items-center justify-center select-none">
              <div className="absolute top-6 left-6 font-mono text-[11px] text-[#003a5e]/40 font-bold uppercase tracking-widest">
                [ {audienceData[activeTab].label.toLowerCase()}_workspace ]
              </div>
              
              {/* Floating inner card */}
              <div className="text-center p-8 bg-white border border-hairline rounded-2xl shadow-card flex flex-col items-center gap-4 max-w-sm">
                <div className="text-[#0ea5e9] mb-2 drop-shadow-md [&>svg]:w-10 [&>svg]:h-10 bg-[#0ea5e9]/10 p-3 rounded-full">{audienceData[activeTab].icon}</div>
                <div className="font-display font-bold text-lg text-[#003a5e] tracking-tight">
                  {audienceData[activeTab].label} Template Activated
                </div>
                <div className="text-sm text-[#1e2c3a]/70 font-medium leading-relaxed">
                  Click 'Get Started' to pre-populate custom lending terms tailored specifically for {audienceData[activeTab].label.toLowerCase()}.
                </div>
                <div className="mt-4 w-full bg-[#0ea5e9]/5 text-[#005080]/60 font-bold text-xs uppercase tracking-widest py-3 rounded-xl text-center">
                  Preview Template
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
