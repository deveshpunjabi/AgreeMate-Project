'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Command,
  Diamond,
  Globe,
  Layers,
  Minus,
} from 'lucide-react';

interface PricingFaq {
  question: string;
  answer: string;
}

interface FeatureRow {
  category: string;
  feature: string;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

type PlanTone = 'starter' | 'professional' | 'organization';

const pricingFaqs: PricingFaq[] = [
  {
    question: 'Is AgreeMate completely free during the Beta release?',
    answer:
      'Yes. All core features - including agreement creation, digital evidence photo logging, automated return email reminders, and penalty fee calculation - are free during the public beta. No credit card is required.',
  },
  {
    question: 'How does the Digital Evidence Vault protect my items?',
    answer:
      'When item condition photos or handover receipts are uploaded, our server creates a timestamped digital record linked to your agreement. This immutable trail proves original item condition and signature events if a dispute ever arises.',
  },
  {
    question: 'What happens to my records when Pro and Organization plans launch?',
    answer:
      'Existing Beta users retain full access to active agreements, evidence packets, and historical records. When Pro features launch, beta members will receive an exclusive early-adopter legacy discount.',
  },
  {
    question: 'Can I export legal PDF audit reports for formal disputes?',
    answer:
      'Yes. In one click, you can generate a dispute-ready PDF audit packet containing item valuation details, digital signature event logs, IP addresses, and penalty calculations ready for formal claims.',
  },
];

const comparisonMatrix: FeatureRow[] = [
  { category: 'Core Limits', feature: 'Active Lending Agreements', starter: '15 Active', pro: 'Unlimited', enterprise: 'Custom Workspace' },
  { category: 'Core Limits', feature: 'Registered Asset Inventory', starter: 'Unlimited Items', pro: 'Unlimited Items', enterprise: 'Unlimited Items' },
  { category: 'Evidence Vault', feature: 'Digital Handover Photo Logging', starter: true, pro: true, enterprise: true },
  { category: 'Evidence Vault', feature: 'Raw ZIP Media Evidence Packet', starter: false, pro: true, enterprise: true },
  { category: 'Automated Nudges', feature: 'Email Return Reminders (7d, 3d, 1d)', starter: true, pro: true, enterprise: true },
  { category: 'Automated Nudges', feature: 'WhatsApp and SMS Alerts', starter: false, pro: true, enterprise: true },
  { category: 'Penalty Engine', feature: 'Automatic Late Fee Calculation', starter: true, pro: true, enterprise: true },
  { category: 'Penalty Engine', feature: 'Custom Rate Rules and Grace Period', starter: false, pro: true, enterprise: true },
  { category: 'Exports and Legal', feature: 'One-Click PDF Audit Export', starter: true, pro: true, enterprise: true },
  { category: 'Exports and Legal', feature: 'Custom Business PDF Branding', starter: false, pro: true, enterprise: true },
  { category: 'Team Controls', feature: 'Multi-User Organization Workspace', starter: false, pro: false, enterprise: true },
  { category: 'Team Controls', feature: 'Dedicated REST API and Webhooks', starter: false, pro: false, enterprise: true },
];

const planFeatures = {
  starter: [
    'Up to 15 active agreements',
    'Digital photo and handover evidence logging',
    'Automated email return nudges',
    'Automatic late penalty calculator',
    'One-click legal PDF audit export',
  ],
  professional: [
    'Everything in Starter',
    'Unlimited active lending agreements',
    'Raw ZIP evidence packets with photos',
    'WhatsApp and SMS return alerts',
    'Custom penalty rates and grace periods',
    'Custom business branding on PDF exports',
  ],
  organization: [
    'Everything in Professional',
    'Multi-user organization workspace',
    'REST API and webhook access',
    'Custom legal contract templates',
    'Role-based access control',
    'Dedicated account manager and SLA',
  ],
};

const featureToneClasses: Record<PlanTone, { ring: string; dot: string }> = {
  starter: {
    ring: 'border-[#7f9eb8]/60 bg-white/85',
    dot: 'bg-[#003a5e]',
  },
  professional: {
    ring: 'border-[#0ea5e9]/55 bg-[#eaf8fe]',
    dot: 'bg-[#0ea5e9]',
  },
  organization: {
    ring: 'border-[#94aabe]/70 bg-[#f4f8fb]',
    dot: 'bg-[#005080]',
  },
};

function FeatureList({ features, tone }: { features: string[]; tone: PlanTone }) {
  const toneClasses = featureToneClasses[tone];

  return (
    <ul className="space-y-3.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-[13px] font-semibold leading-5 text-[#1e2c3a]">
          <span
            aria-hidden="true"
            className={'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ' + toneClasses.ring}
          >
            <span className={'size-1.5 rounded-full ' + toneClasses.dot} />
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  return (
    <section id="pricing" className="relative w-full overflow-hidden bg-transparent py-16 sm:py-24 lg:py-28">
      <div className="container relative z-10 mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="space-y-12 sm:space-y-16">
          <header className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.045em] text-[#003a5e] sm:text-4xl">
              Plans &amp; Pricing
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-[#526170] sm:text-base">
              Choose the protection that fits the way you lend, from personal handovers to growing teams.
            </p>

            <div className="mt-6 flex justify-center sm:mt-7">
              <div
                role="radiogroup"
                aria-label="Billing preference"
                className="relative isolate grid min-h-[66px] w-full max-w-[calc(100vw-2rem)] grid-cols-[minmax(0,1fr)_68px_minmax(0,1fr)] items-center overflow-hidden rounded-[24px] border border-[#e3e9f2] bg-white px-6 shadow-[0_10px_24px_rgba(15,23,42,0.07),0_2px_6px_rgba(15,23,42,0.03)] sm:min-h-[70px] sm:max-w-[340px] sm:rounded-[26px] sm:px-7"
              >
                <span
                  aria-hidden="true"
                  className={
                    'pointer-events-none absolute inset-y-0 w-[64%] bg-[radial-gradient(ellipse_130%_120%_at_0%_50%,rgba(197,218,248,0.96)_0%,rgba(220,234,253,0.92)_50%,transparent_78%)] [clip-path:polygon(0_0,54%_0,100%_50%,54%_100%,0_100%)] transition-opacity duration-300 ' +
                    (isAnnual ? 'right-0 scale-x-[-1]' : 'left-0')
                  }
                />
                <button
                  type="button"
                  role="radio"
                  aria-checked={!isAnnual}
                  onClick={() => setIsAnnual(false)}
                  className={
                    'relative z-10 flex min-h-11 cursor-pointer items-center justify-self-start whitespace-nowrap rounded-xl font-display text-[15px] leading-none tracking-[-0.04em] transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/20 sm:text-lg ' +
                    (!isAnnual ? 'opacity-100 font-bold text-[#003a5e]' : 'opacity-70 font-medium text-[#071429]')
                  }
                >
                  Monthly
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAnnual}
                  aria-label={isAnnual ? 'Switch to monthly billing' : 'Switch to annual billing'}
                  onClick={() => setIsAnnual((prev) => !prev)}
                  className="relative z-10 flex h-8 w-[68px] cursor-pointer items-center rounded-full border border-[#cad7e5] bg-[#edf2f7] p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] transition-colors hover:border-[#0ea5e9]/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/20"
                >
                  <span
                    className={
                      'flex h-6 w-8 items-center justify-center rounded-full bg-[#003a5e] shadow-[0_3px_8px_rgba(0,58,94,0.24)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
                      (isAnnual ? 'translate-x-7' : 'translate-x-0')
                    }
                  >
                    <span className="h-0.5 w-2.5 rounded-full bg-white" />
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isAnnual}
                  onClick={() => setIsAnnual(true)}
                  className={
                    'relative z-10 flex min-h-11 cursor-pointer items-center justify-self-end whitespace-nowrap rounded-xl font-display text-[15px] leading-none tracking-[-0.04em] transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/20 sm:text-lg ' +
                    (isAnnual ? 'opacity-100 font-bold text-[#003a5e]' : 'opacity-70 font-medium text-[#071429]')
                  }
                >
                  Annually
                </button>
                <span className="sr-only" aria-live="polite">
                  {isAnnual ? 'Annual billing selected' : 'Monthly billing selected'}
                </span>
              </div>
            </div>
          </header>

          <div className="rounded-[34px] border border-[#d8e1ec] bg-[#e8eef7]/90 p-3 shadow-[var(--shadow-floating)] sm:rounded-[38px] sm:p-4 lg:p-5">
            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] lg:gap-5">
              <article className="flex min-w-0 flex-col rounded-[28px] border border-[#d3dfeb] bg-[#e5edf7] p-6 sm:p-8 lg:rounded-[30px] lg:p-9">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#cbd9e7] bg-white text-[#003a5e] shadow-[0_2px_8px_rgba(0,58,94,0.04)]">
                      <Command aria-hidden="true" className="size-[18px]" />
                    </span>
                    <h2 className="font-display text-[1.4rem] font-bold tracking-[-0.04em] text-[#003a5e]">Starter</h2>
                  </div>

                  <div className="mt-8">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-display text-[2.25rem] font-extrabold leading-none tracking-[-0.055em] text-[#003a5e]">Free</span>
                      <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#047857]">/ In beta</span>
                    </div>
                    <p className="mt-4 max-w-[31rem] text-sm font-medium leading-6 text-[#4b5b6b]">
                      Ideal for lending personal gear with a clear, shared record from handover through return.
                    </p>
                  </div>

                  <div className="mt-9">
                    <FeatureList features={planFeatures.starter} tone="starter" />
                  </div>
                </div>

                <Link
                  href="/signup"
                  aria-label="Register for the Starter plan"
                  className="mt-10 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-[17px] bg-[#003a5e] px-5 text-xs font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_6px_0_rgba(0,38,61,0.14),0_12px_24px_rgba(0,58,94,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#005080] hover:shadow-[0_7px_0_rgba(0,38,61,0.12),0_16px_28px_rgba(0,58,94,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/30 lg:mt-auto"
                >
                  Register for free
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </article>

              <div className="min-w-0 overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_14px_34px_rgba(0,58,94,0.07)] lg:rounded-[30px]">
                <div className="grid h-full min-w-0 md:grid-cols-2">
                  <article className="flex min-w-0 flex-col border-b border-hairline p-6 sm:p-8 md:border-b-0 md:border-r lg:p-9">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#cfe9f6] bg-[#f0faff] text-[#0068a3] shadow-[0_2px_8px_rgba(0,104,163,0.05)]">
                          <Diamond aria-hidden="true" className="size-[19px] text-[#0ea5e9]" />
                        </span>
                        <h2 className="font-display text-[1.4rem] font-bold tracking-[-0.04em] text-[#003a5e]">Professional</h2>
                      </div>

                      <div className="mt-8">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-display text-[2.25rem] font-extrabold leading-none tracking-[-0.055em] text-[#003a5e]">Coming</span>
                          <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0068a3]">/ Soon</span>
                        </div>
                        <p className="mt-4 max-w-[31rem] text-sm font-medium leading-6 text-[#4b5b6b]">
                          Built for frequent lenders who need deeper vault controls and more automated follow-through.
                        </p>
                      </div>

                      <div className="mt-9">
                        <FeatureList features={planFeatures.professional} tone="professional" />
                      </div>
                    </div>

                    <Link
                      href="/signup"
                      aria-label="Get started with the Professional plan"
                      className="mt-10 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-[17px] border border-[#d8e3ee] bg-white px-5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#003a5e] shadow-[0_3px_10px_rgba(0,58,94,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0ea5e9]/60 hover:bg-[#f4fbff] hover:shadow-[0_9px_20px_rgba(0,104,163,0.09)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/25 sm:w-auto sm:min-w-[178px] md:mt-auto"
                    >
                      Get started
                      <ArrowRight aria-hidden="true" className="size-4 text-[#0ea5e9]" />
                    </Link>
                  </article>

                  <article className="flex min-w-0 flex-col p-6 sm:p-8 lg:p-9">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#dce5ed] bg-[#f6f9fb] text-[#003a5e] shadow-[0_2px_8px_rgba(0,58,94,0.04)]">
                          <Globe aria-hidden="true" className="size-[18px]" />
                        </span>
                        <h2 className="font-display text-[1.4rem] font-bold tracking-[-0.04em] text-[#003a5e]">Organization</h2>
                      </div>

                      <div className="mt-8">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-display text-[2.25rem] font-extrabold leading-none tracking-[-0.055em] text-[#003a5e]">Custom</span>
                          <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#005080]">/ Workspace</span>
                        </div>
                        <p className="mt-4 max-w-[31rem] text-sm font-medium leading-6 text-[#4b5b6b]">
                          For teams, rental desks, and businesses managing lending at a larger operational scale.
                        </p>
                      </div>

                      <div className="mt-9">
                        <FeatureList features={planFeatures.organization} tone="organization" />
                      </div>
                    </div>

                    <Link
                      href="/contact"
                      aria-label="Get started with the Organization plan"
                      className="mt-10 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-[17px] border border-[#d8e3ee] bg-white px-5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#003a5e] shadow-[0_3px_10px_rgba(0,58,94,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#003a5e]/35 hover:bg-[#f6f9fb] hover:shadow-[0_9px_20px_rgba(0,58,94,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/25 sm:w-auto sm:min-w-[178px] md:mt-auto"
                    >
                      Get started
                      <ArrowRight aria-hidden="true" className="size-4 text-[#0ea5e9]" />
                    </Link>
                  </article>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-1 sm:pt-3">
            <div className="flex justify-center">
              <button
                type="button"
                aria-expanded={showMatrix}
                aria-controls="pricing-comparison"
                onClick={() => setShowMatrix((current) => !current)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-hairline bg-white px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#003a5e] shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bcd9ea] hover:bg-[#f8fcff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/20"
              >
                <Layers aria-hidden="true" className="size-4 text-[#0ea5e9]" />
                <span>{showMatrix ? 'Hide full plan comparison' : 'Compare all features'}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={'size-4 text-[#0ea5e9] transition-transform duration-200 ' + (showMatrix ? 'rotate-180' : '')}
                />
              </button>
            </div>

            {showMatrix && (
              <div
                id="pricing-comparison"
                role="region"
                aria-label="Detailed plan comparison"
                tabIndex={0}
                className="overflow-x-auto rounded-[26px] border border-hairline bg-white p-5 shadow-[var(--shadow-card)] sm:p-7"
              >
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <caption className="sr-only">Detailed AgreeMate plan comparison</caption>
                  <thead>
                    <tr className="border-b border-hairline">
                      <th scope="col" className="w-1/2 px-4 py-3 font-display text-sm font-bold text-[#003a5e]">
                        Features and limits
                      </th>
                      <th scope="col" className="w-1/6 px-4 py-3 text-center font-mono text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#047857]">
                        Starter
                      </th>
                      <th scope="col" className="w-1/6 px-4 py-3 text-center font-mono text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#0068a3]">
                        Professional
                      </th>
                      <th scope="col" className="w-1/6 px-4 py-3 text-center font-mono text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#003a5e]">
                        Organization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70 text-xs font-medium text-[#1e2c3a]">
                    {comparisonMatrix.map((row) => (
                      <tr key={row.feature} className="transition-colors hover:bg-[#f8fbfe]">
                        <td className="px-4 py-3.5 font-semibold text-[#003a5e]">{row.feature}</td>
                        <td className="px-4 py-3.5 text-center">
                          {typeof row.starter === 'boolean' ? (
                            row.starter ? (
                              <Check aria-label="Included" className="mx-auto size-4 text-[#10b981]" />
                            ) : (
                              <Minus aria-label="Not included" className="mx-auto size-4 text-muted-soft" />
                            )
                          ) : (
                            <span className="font-bold text-[#047857]">{row.starter}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? (
                              <Check aria-label="Included" className="mx-auto size-4 text-[#0ea5e9]" />
                            ) : (
                              <Minus aria-label="Not included" className="mx-auto size-4 text-muted-soft" />
                            )
                          ) : (
                            <span className="font-bold text-[#0068a3]">{row.pro}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {typeof row.enterprise === 'boolean' ? (
                            row.enterprise ? (
                              <Check aria-label="Included" className="mx-auto size-4 text-[#003a5e]" />
                            ) : (
                              <Minus aria-label="Not included" className="mx-auto size-4 text-muted-soft" />
                            )
                          ) : (
                            <span className="font-bold text-[#003a5e]">{row.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mx-auto max-w-3xl space-y-5 pt-2 sm:pt-4">
            <div className="space-y-2 text-center">
              <h2 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#003a5e]">
                Frequently asked questions
              </h2>
              <p className="text-sm font-medium text-[#5c6a78]">
                Everything you need to know about AgreeMate pricing and Beta access.
              </p>
            </div>

            <div className="space-y-1 rounded-[26px] border border-hairline bg-white p-3 shadow-[var(--shadow-card)] sm:p-4">
              {pricingFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                const faqPanelId = 'pricing-faq-' + index;

                return (
                  <div key={faq.question} className="border-b border-hairline last:border-b-0">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={faqPanelId}
                      onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl px-3 text-left text-sm font-bold text-[#003a5e] transition-colors duration-200 hover:bg-[#f8fbfe] hover:text-[#0068a3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0ea5e9]/20"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        aria-hidden="true"
                        className={'size-4 shrink-0 text-[#0ea5e9] transition-transform duration-200 ' + (isOpen ? 'rotate-180' : '')}
                      />
                    </button>
                    {isOpen && (
                      <div id={faqPanelId} className="px-3 pb-4 pt-1 text-sm font-medium leading-6 text-[#526170]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
