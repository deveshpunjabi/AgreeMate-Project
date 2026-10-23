'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  X,
  ArrowRight,
  Check,
  AlertCircle,
  Plus,
  User,
  Building2,
  Store,
  FileCode2,
  Camera,
  ShieldCheck,
  Info,
  BadgeCheck,
  Trash2,
  HelpCircle,
  Sparkles,
  ListPlus,
} from 'lucide-react';
import { useWizardStore } from '@/stores/wizard.store';
import { useAuthStore } from '@/stores/auth.store';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { agreementsApi } from '@/lib/api/agreements';
import { itemsApi } from '@/lib/api/items';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AgreementContractPreviewModal, { AgreementContractData, ContractParty } from '../AgreementContractPreviewModal';

export interface ExtraPartyInput {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  gstNumber: string;
  address: string;
  role: 'Borrower' | 'Partner' | 'Client';
}

const universalWizardSchema = z.object({
  persona: z.enum(['individual', 'shopkeeper', 'business']),
  
  // Asset / Item Details
  assetType: z.enum(['digital', 'physical']),
  assetName: z.string().min(2, 'Asset or item title is required'),
  assetDescription: z.string().optional(),
  assetValue: z.number().min(0, 'Estimated value cannot be negative').optional(),
  mediaUrl: z.string().optional(),

  // Terms & Dates
  agreementTitle: z.string().min(3, 'Agreement title is required'),
  effectiveDate: z.string().optional(),
  dueDate: z.string().refine((val) => {
    if (!val) return true;
    const selected = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  }, 'Due date must be today or in the future'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day').optional(),
  penaltyType: z.enum(['per_day', 'fixed', 'percentage']),
  penaltyRate: z.number().min(0, 'Penalty rate cannot be negative'),
  gracePeriodDays: z.number().min(0, 'Grace period cannot be negative'),
  specialConditions: z.string().optional(),
});

type UniversalWizardValues = z.infer<typeof universalWizardSchema>;

const PERSONA_INFO = {
  individual: {
    title: 'Individual / Peer-to-Peer',
    tagline: 'Personal Lending & Handover',
    desc: 'Designed for friends, colleagues, and acquaintances lending cameras, laptops, vehicles, books, or peer cash loans.',
    defaultTerms: 'Fixed or daily late return penalty, photo SHA-256 custody verification, mutual consent lock.',
    clauses: 'Standard Peer Bailment, Personal Custody & Care, Return Intact Guarantee.',
    icon: User,
  },
  shopkeeper: {
    title: 'Shopkeeper / Khatabook Credit',
    tagline: 'Store Ledger & Rental Equipment',
    desc: 'Designed for local businesses, merchant ledger tabs, commercial equipment rentals, customer credit accounts, and return reminders.',
    defaultTerms: 'Automated return reminders via SMS/Email, structured repayment schedule, ledger audit trail.',
    clauses: 'Commercial Store Credit, Equipment Rental Bailment, Penalty Accrual on Grace Expiry.',
    icon: Store,
  },
  business: {
    title: 'Business & Service Contract',
    tagline: 'Corporate Assets & Contractor Scope',
    desc: 'Designed for freelancers, IT contractors, digital asset transfers, client service scopes, vendor retainers, and GSTIN-compliant equipment.',
    defaultTerms: 'Milestone due dates, digital handover verification, GST & corporate entity registration.',
    clauses: 'Service Deliverables Scope, Intellectual Property Non-Disclosure, Breach of Agreement Indemnity.',
    icon: Building2,
  },
};

export default function AgreementWizard() {
  const { isOpen, closeWizard } = useWizardStore();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showPersonaHelpModal, setShowPersonaHelpModal] = useState(false);

  // Dynamic Contracting Parties State (Max 5 Total)
  const [parties, setParties] = useState<ExtraPartyInput[]>([
    {
      id: 'p_1',
      name: '',
      phone: '',
      email: '',
      idNumber: '',
      gstNumber: '',
      address: '',
      role: 'Borrower',
    },
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UniversalWizardValues>({
    resolver: zodResolver(universalWizardSchema),
    defaultValues: {
      persona: 'individual',
      assetType: 'physical',
      assetName: '',
      assetDescription: '',
      assetValue: 5000,
      mediaUrl: '',
      agreementTitle: 'Mutual Lending & Service Agreement',
      effectiveDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      durationDays: 5,
      penaltyType: 'per_day',
      penaltyRate: 50,
      gracePeriodDays: 2,
      specialConditions: '',
    },
  });

  const formValues = watch();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setApiError(null);
      setIsPreviewModalOpen(false);
      setShowPersonaHelpModal(false);
      setParties([
        {
          id: 'p_1',
          name: '',
          phone: '',
          email: '',
          idNumber: '',
          gstNumber: '',
          address: '',
          role: 'Borrower',
        },
      ]);
      reset({
        persona: 'individual',
        assetType: 'physical',
        assetName: '',
        assetDescription: '',
        assetValue: 5000,
        mediaUrl: '',
        agreementTitle: 'Mutual Lending & Service Agreement',
        effectiveDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        durationDays: 5,
        penaltyType: 'per_day',
        penaltyRate: 50,
        gracePeriodDays: 2,
        specialConditions: '',
      });
    }
  }, [isOpen, reset]);

  const handleAddParty = () => {
    if (parties.length >= 4) return;
    setParties((prev) => [
      ...prev,
      {
        id: `p_${Date.now()}`,
        name: '',
        phone: '',
        email: '',
        idNumber: '',
        gstNumber: '',
        address: '',
        role: 'Borrower',
      },
    ]);
  };

  const handleRemoveParty = (id: string) => {
    if (parties.length <= 1) return;
    setParties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateParty = (id: string, field: keyof ExtraPartyInput, value: string) => {
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddConditionBullet = () => {
    const current = formValues.specialConditions || '';
    const bullet = current.length > 0 && !current.endsWith('\n') ? '\n• ' : '• ';
    setValue('specialConditions', current + bullet);
  };

  const handleInsertConditionTemplate = (text: string) => {
    const current = formValues.specialConditions || '';
    const separator = current.trim() ? '\n' : '';
    setValue('specialConditions', current + separator + text);
  };

  const createAgreementMutation = useMutation({
    mutationFn: async (data: UniversalWizardValues) => {
      const primaryBorrower = parties[0];

      // 1. Create item record via itemsApi (FastAPI backend)
      let itemId = '';
      try {
        const createdItem = await itemsApi.create({
          title: data.assetName,
          category: data.assetType === 'digital' ? 'Digital Asset' : 'Physical Item',
          description: data.assetDescription || `${data.assetType} asset agreement`,
          estimated_value: Number(data.assetValue) || 5000,
          condition: 'good',
        });
        itemId = createdItem.id || createdItem._id || '';
      } catch (e: any) {
        throw new Error(e?.response?.data?.detail || 'Failed to register the item for this agreement. Please verify details.');
      }

      if (!itemId) {
        throw new Error('Could not establish item record for this agreement.');
      }

      // 2. Create agreement
      const agr = await agreementsApi.create({
        item_id: itemId,
        borrower_email: primaryBorrower?.email || 'client@example.com',
        borrower_name: primaryBorrower?.name,
        borrower_phone: primaryBorrower?.phone,
        due_date: data.dueDate,
        penalty_type: data.penaltyType as any,
        penalty_rate: data.penaltyRate,
        grace_period_days: data.gracePeriodDays,
        special_conditions: data.specialConditions || `${data.agreementTitle} | Total Parties: ${parties.length + 1}`,
      });

      // 3. Generate invite link
      await agreementsApi.generateInvite(agr.id);
      return agr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['recent-agreements'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      closeWizard();
    },
    onError: (err: any) => {
      console.error(err);
      setApiError(err.response?.data?.detail || 'Failed to generate agreement contract. Please check form details.');
    },
  });

  const handleNextStep = () => {
    setApiError(null);
    if (step === 1 && !formValues.persona) {
      setApiError('Please select an agreement category.');
      return;
    }
    if (step === 2) {
      const invalidParty = parties.find((p) => !p.name.trim() || !p.email.trim());
      if (invalidParty) {
        setApiError('Please fill in Name and Email for all contracting parties.');
        return;
      }
    }
    if (step === 3 && !formValues.assetName) {
      setApiError('Please enter asset or item title.');
      return;
    }
    if (step === 4 && (!formValues.agreementTitle || errors.dueDate)) {
      setApiError('Please specify agreement title and return due date.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setApiError(null);
    setStep((prev) => prev - 1);
  };

  const onSubmit = () => {
    setIsPreviewModalOpen(true);
  };

  const handleConfirmFinalSubmit = () => {
    createAgreementMutation.mutate(formValues);
  };

  if (!isOpen) return null;

  const formattedContractParties: ContractParty[] = parties.map((p) => ({
    name: p.name || 'Contracting Party',
    phone: p.phone || 'N/A',
    email: p.email || 'N/A',
    idNumber: p.idNumber,
    gstNumber: p.gstNumber,
    address: p.address,
    role: p.role,
    verificationStatus: 'Pending Acceptance',
  }));

  const contractPreviewData: AgreementContractData = {
    title: formValues.agreementTitle || 'Lending Agreement',
    persona: formValues.persona,
    ownerName: user?.full_name || 'Primary Owner / Lender',
    ownerPhone: user?.phone || '+91 98765 43210',
    ownerEmail: user?.email || 'owner@agreemate.io',
    ownerId: user?.id ? `AGM-${user.id.slice(0, 6).toUpperCase()}` : 'Aadhaar / Mobile OTP Verified',
    ownerGst: 'Optional',
    ownerAddress: user?.city ? `${user.city}, India` : 'Registered Office Address, India',
    parties: formattedContractParties,
    assetType: formValues.assetType,
    assetName: formValues.assetName,
    assetDescription: formValues.assetDescription,
    assetValue: Number(formValues.assetValue) || 5000,
    effectiveDate: formValues.effectiveDate || new Date().toISOString().split('T')[0],
    dueDate: formValues.dueDate,
    gracePeriodDays: formValues.gracePeriodDays,
    penaltyType: formValues.penaltyType,
    penaltyRate: formValues.penaltyRate,
    specialConditions: formValues.specialConditions,
  };

  const activePersonaConfig = PERSONA_INFO[formValues.persona || 'individual'];
  const PersonaIcon = activePersonaConfig.icon;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeWizard} />

        {/* Modal Window */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 bg-slate-50/80 shrink-0">
            <div>
              <h2 className="font-display font-bold text-[#003a5e] text-base tracking-tight">Create Mutual Agreement</h2>
              <p className="font-body text-[10px] text-slate-500 font-medium mt-0.5">
                Universal contract builder supporting up to 5 parties with legal audit vault.
              </p>
            </div>
            <button
              type="button"
              onClick={closeWizard}
              className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Progress Header */}
          <div className="bg-slate-50/50 border-b border-slate-200/80 py-2.5 px-6 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-mono font-extrabold text-[#0ea5e9] uppercase tracking-wider">
              Step {step} of 5 — {
                step === 1 ? 'Select Persona' :
                step === 2 ? 'Contracting Parties' :
                step === 3 ? 'Asset Details' :
                step === 4 ? 'Terms & Penalty' : 'Review & Draft'
              }
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-[#003a5e] w-5' : 'bg-slate-200 w-1.5'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-600 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* STEP 1: PERSONA / AGREEMENT CATEGORY DROPDOWN & GUIDE */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xs text-[#003a5e] uppercase tracking-wider">
                        Select Agreement Persona &amp; Use Case
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Choose your persona to load tailored terms, reminder schedules &amp; legal clauses.
                      </p>
                    </div>

                    {/* Interactive Help Question Mark Icon */}
                    <button
                      type="button"
                      onClick={() => setShowPersonaHelpModal(!showPersonaHelpModal)}
                      className="size-8 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0ea5e9] flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105"
                      title="Click to understand agreement personas"
                    >
                      <HelpCircle className="size-4.5" />
                    </button>
                  </div>

                  {/* Persona Dropdown Selector Box */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Agreement Category / Persona *
                    </label>
                    <div className="relative">
                      <select
                        value={formValues.persona}
                        onChange={(e) => setValue('persona', e.target.value as any)}
                        className="w-full h-11 pl-3.5 pr-10 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold text-[#003a5e] outline-none focus:border-[#0ea5e9] cursor-pointer appearance-none shadow-xs transition-colors"
                      >
                        <option value="individual">👤 Individual / Peer-to-Peer (Gadgets, Cameras, Books, Cash)</option>
                        <option value="shopkeeper">🏬 Shopkeeper / Khatabook Credit (Store Credit, Equipment Rental Tabs)</option>
                        <option value="business">🏢 Business &amp; Service Contract (Contractors, Assets, IT Services)</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Active Persona Scope & Information Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-[#003a5e] text-white flex items-center justify-center shrink-0">
                          <PersonaIcon className="size-4.5 text-[#0ea5e9]" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-[#003a5e]">{activePersonaConfig.title}</h4>
                          <span className="text-[10px] font-mono text-[#0068a3] font-bold block">{activePersonaConfig.tagline}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0068a3] text-[10px] font-mono font-bold">
                        Auto-Configured
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {activePersonaConfig.desc}
                    </p>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><b>Protection Rules:</b> {activePersonaConfig.defaultTerms}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <ShieldCheck className="size-3.5 text-[#0ea5e9] shrink-0 mt-0.5" />
                        <span><b>Legal Scope:</b> {activePersonaConfig.clauses}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Question Explanation Helper Box */}
                  {showPersonaHelpModal && (
                    <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-2 text-xs text-[#003a5e] animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="size-4 text-[#0ea5e9]" />
                          Persona Selector Guide:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPersonaHelpModal(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Hide Guide
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        AgreeMate customizes the formal legal clauses, dispute resolution protocols, and automated return notification cadence based on the selected persona.
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-700 list-disc pl-4">
                        <li><b>Individual:</b> Focuses on item condition photos and friend-to-friend mutual consent.</li>
                        <li><b>Shopkeeper:</b> Adds payment ledger balance tracking and store credit collection logs.</li>
                        <li><b>Business:</b> Includes GSTIN identifiers, NDA clauses, and service deliverable milestones.</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: CONTRACTING PARTIES (PARTY 1 AUTO-FILLED + MULTI PARTIES MAX 5) */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xs text-[#003a5e] uppercase tracking-wider">
                        Contracting Parties ({parties.length + 1} / 5 Max)
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Party 1 (Owner) is auto-verified. Add up to 4 additional contracting parties.
                      </p>
                    </div>
                  </div>

                  {/* Party 1 (Owner) - Auto Filled & Verified */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-extrabold text-[#0068a3] uppercase tracking-wider block">
                        PARTY 1: OWNER / CREATOR
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Aadhaar &amp; Mobile Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#003a5e] text-sm">{user?.full_name || 'Devesh Punjabi'}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{user?.email || 'punjabidevesh5810@gmail.com'}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        Owner Profile Active
                      </span>
                    </div>
                  </div>

                  {/* Additional Parties Cards */}
                  <div className="space-y-3">
                    {parties.map((party, idx) => (
                      <div key={party.id} className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-2xs relative">
                        
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-mono font-extrabold text-[#0ea5e9] uppercase tracking-wider">
                            PARTY {idx + 2} DETAILS ({party.role.toUpperCase()})
                          </span>

                          {parties.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveParty(party.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Full Legal Name *"
                            placeholder="Full Name"
                            value={party.name}
                            onChange={(e) => handleUpdateParty(party.id, 'name', e.target.value)}
                          />
                          <Input
                            label="Mobile Number *"
                            placeholder="98765 43210"
                            value={party.phone}
                            onChange={(e) => handleUpdateParty(party.id, 'phone', e.target.value)}
                          />
                        </div>

                        <Input
                          label="Email Address * (For Invite)"
                          type="email"
                          placeholder="party@example.com"
                          value={party.email}
                          onChange={(e) => handleUpdateParty(party.id, 'email', e.target.value)}
                        />

                        {/* Separate ID Number vs GSTIN Number Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Government ID Number (Optional)"
                            placeholder="Aadhaar / PAN / Passport"
                            value={party.idNumber}
                            onChange={(e) => handleUpdateParty(party.id, 'idNumber', e.target.value)}
                          />
                          <Input
                            label="GSTIN Number (Optional)"
                            placeholder="GSTIN (For Business)"
                            value={party.gstNumber}
                            onChange={(e) => handleUpdateParty(party.id, 'gstNumber', e.target.value)}
                          />
                        </div>

                        <Input
                          label="Physical / Business Address (Optional)"
                          placeholder="City / Address"
                          value={party.address}
                          onChange={(e) => handleUpdateParty(party.id, 'address', e.target.value)}
                        />

                      </div>
                    ))}
                  </div>

                  {/* Add Party Button (Max 5 Total) */}
                  {parties.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddParty}
                      className="w-full h-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-mono font-bold text-[#003a5e] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#0ea5e9]" />
                      <span>+ Add Another Party (Max 5 Total)</span>
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3: ASSET DETAILS (DIGITAL VS PHYSICAL) */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-xs text-[#003a5e] uppercase tracking-wider">
                      Asset / Item Details &amp; Proof Mode
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Select whether the asset is Digital (contracts, online deals) or Physical (tools, cameras, cash).
                    </p>
                  </div>

                  {/* Asset Type Switcher */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setValue('assetType', 'physical')}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-center space-y-1.5 transition-all ${
                        formValues.assetType === 'physical'
                          ? 'border-[#0ea5e9] bg-sky-50/60 font-bold text-[#003a5e]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <Camera className="w-5 h-5 mx-auto text-[#0ea5e9]" />
                      <p className="text-xs">Physical Asset</p>
                      <span className="text-[10px] text-slate-400 font-normal block">Cash, Tools, Laptop, Vehicle</span>
                    </div>

                    <div
                      onClick={() => setValue('assetType', 'digital')}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-center space-y-1.5 transition-all ${
                        formValues.assetType === 'digital'
                          ? 'border-[#0ea5e9] bg-sky-50/60 font-bold text-[#003a5e]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <FileCode2 className="w-5 h-5 mx-auto text-[#0ea5e9]" />
                      <p className="text-xs">Digital Asset</p>
                      <span className="text-[10px] text-slate-400 font-normal block">Contract, Online Transfer, Domain</span>
                    </div>
                  </div>

                  {/* Asset Title & Description */}
                  <Input
                    label="Asset / Item Title *"
                    placeholder="e.g. Sony A7IV Camera / Khatabook Tab Credit / IT Services"
                    error={errors.assetName?.message}
                    {...register('assetName')}
                  />

                  <Input
                    label="Estimated Valuation / Replacement Value (₹)"
                    type="number"
                    placeholder="5000"
                    error={errors.assetValue?.message}
                    {...register('assetValue', { valueAsNumber: true })}
                  />

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Description &amp; Scope Details
                    </label>
                    <textarea
                      placeholder="e.g. Serial numbers, specific condition, login credentials scope, or online transaction reference..."
                      rows={2}
                      {...register('assetDescription')}
                      className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0ea5e9] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: TERMS, DATES & OWNER HANDOVER NOTES */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-xs text-[#003a5e] uppercase tracking-wider">
                      Agreement Terms &amp; Penalty Rules
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Set return due dates, penalty fees, grace periods, and owner handover conditions.
                    </p>
                  </div>

                  <Input label="Agreement Title *" placeholder="e.g. Lending Agreement: Sony Camera" {...register('agreementTitle')} />

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Effective Start Date" type="date" {...register('effectiveDate')} />
                    <Input label="Due Return Date *" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Penalty Type</label>
                      <select
                        {...register('penaltyType')}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#003a5e] outline-none focus:border-[#0ea5e9]"
                      >
                        <option value="per_day">Daily Flat (₹/day)</option>
                        <option value="fixed">Fixed One-Time (₹)</option>
                        <option value="percentage">Daily Percentage (%)</option>
                      </select>
                    </div>

                    <Input label="Penalty Rate / Amount" type="number" placeholder="50" {...register('penaltyRate', { valueAsNumber: true })} />
                  </div>

                  <Input label="Grace Period (Days)" type="number" placeholder="2" {...register('gracePeriodDays', { valueAsNumber: true })} />

                  {/* Owner Special Conditions & Handover Notes Editor */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold text-[#003a5e] uppercase tracking-wider block">
                        Owner Special Conditions &amp; Handover Notes (Optional)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAddConditionBullet}
                          className="h-6 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0068a3] text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer border border-sky-200 transition-colors"
                        >
                          <ListPlus className="size-3 text-[#0ea5e9]" />
                          <span>+ Bullet (•)</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Preset Condition Chips */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleInsertConditionTemplate('• Return in original box and packaging.')}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      >
                        + Original Box
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertConditionTemplate('• No third-party lending or subletting permitted.')}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      >
                        + No Sub-Lending
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertConditionTemplate('• Borrower is liable for any physical damage or loss.')}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      >
                        + Damage Liability
                      </button>
                    </div>

                    <textarea
                      placeholder="Add specific handover instructions, inspection checklists, or special terms in paragraphs or bullet points..."
                      rows={3}
                      {...register('specialConditions')}
                      className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0ea5e9] resize-none font-body leading-relaxed"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-sky-500/8 border border-sky-500/20 space-y-1 text-xs text-[#003a5e]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Info className="w-4 h-4 text-[#0ea5e9]" />
                      <span>Owner Editing Protocol:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      Only Party 1 (Owner) has permission to edit agreement terms once created. Contracting parties can submit extension requests with notes. Any approved edits log a new revision record and notify all parties.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & DRAFT PREVIEW */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-xs text-[#003a5e] uppercase tracking-wider">
                      Review Agreement Contract Draft
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Verify all contract clauses and owner notes before locking draft and generating the PDF preview.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-mono font-bold text-[#003a5e]">{formValues.agreementTitle}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                        Draft Ready ({parties.length + 1} Parties)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px]">PARTY 1 (OWNER)</span>
                        <span className="font-bold text-[#003a5e]">{user?.full_name || 'Devesh Punjabi'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px]">CONTRACTING PARTIES</span>
                        <span className="font-bold text-[#003a5e]">{parties.map((p) => p.name || 'Party').join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px]">DUE RETURN DATE</span>
                        <span className="font-bold text-[#003a5e]">{formValues.dueDate || 'Open'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[9px]">PENALTY RATE</span>
                        <span className="font-bold text-[#003a5e]">₹{formValues.penaltyRate}/day</span>
                      </div>
                    </div>

                    {formValues.specialConditions && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block font-mono text-[9px] mb-1">OWNER SPECIAL NOTES</span>
                        <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-[11px] text-slate-700 whitespace-pre-line">
                          {formValues.specialConditions}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono text-center">
                    Digital Audit Stamp · AgreeMate Encrypted Legal Vault
                  </p>
                </div>
              )}

            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <Button type="button" variant="secondary" size="sm" onClick={handlePrevStep}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={closeWizard}>
                Cancel
              </Button>
            )}

            {step < 5 ? (
              <Button type="button" size="sm" onClick={handleNextStep} iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit(onSubmit)}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Preview Contract &amp; Generate
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* Contract Full Document Preview Modal */}
      <AgreementContractPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        data={contractPreviewData}
        isSubmitting={createAgreementMutation.isPending}
        onConfirmSubmit={handleConfirmFinalSubmit}
      />
    </>
  );
}
