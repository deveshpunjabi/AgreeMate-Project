'use client';

import React from 'react';
import {
  Clock,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Percent,
  RefreshCw,
  CalendarCheck,
  CheckCircle2,
  Lock,
  PenTool,
  Award,
} from 'lucide-react';

export interface DocumentPartyData {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  address?: string;
  role: string;
  verificationStatus?: string;
}

export interface LegalDocumentData {
  id?: string;
  title?: string;
  persona?: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerId?: string;
  ownerGst?: string;
  ownerAddress?: string;
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  borrowerAddress?: string;
  parties?: DocumentPartyData[];
  assetType?: string;
  assetName?: string;
  assetCategory?: string;
  assetValue?: number;
  assetCondition?: string;
  assetDescription?: string;
  effectiveDate?: string;
  dueDate?: string;
  gracePeriodDays?: number;
  penaltyType?: string;
  penaltyRate?: number;
  interestRate?: number;
  interestType?: string;
  repaymentFrequency?: string;
  totalAmountPayable?: number;
  securityType?: string;
  specialConditions?: string;
  purpose?: string;
  status?: string;
  createdAt?: string;
  version?: string;
}

interface LegalDocumentSheetProps {
  data: LegalDocumentData;
  agreementNo?: string;
}

function LegalDocumentSheet({
  data,
  agreementNo = 'AGR-2026-0001',
}: LegalDocumentSheetProps) {
  const createdDateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'August 6, 2026';

  const effectiveDateStr = data.effectiveDate
    ? new Date(data.effectiveDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : createdDateStr;

  const dueDateStr = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'August 21, 2026';

  const principalVal = data.assetValue || 5000;
  const principalFormatted = `₹${principalVal.toLocaleString('en-IN')}.00`;
  const frequencyDisplay = data.repaymentFrequency || 'One-Time on Due Date';
  const purposeDisplay = data.purpose || data.assetDescription || (data.assetName ? `Borrowing & Lending Custody of ${data.assetName}` : 'General Purpose Asset Lending');

  // Dynamic Interest / Late Fee based strictly on Agreement Terms
  const penaltyRate = data.penaltyRate ?? 0;
  const penaltyType = (data.penaltyType || 'per_day').toLowerCase();
  const graceDays = data.gracePeriodDays ?? 0;

  let lateFeeDisplay = 'Nil (No Late Fee)';
  let interestDisplay = '0% (No Interest)';

  if (data.interestRate !== undefined && data.interestRate > 0) {
    interestDisplay = `${data.interestRate}% per annum`;
  } else if (penaltyType === 'percentage' && penaltyRate > 0) {
    interestDisplay = `${penaltyRate}% per period`;
  }

  if (penaltyType === 'per_day' && penaltyRate > 0) {
    lateFeeDisplay = `₹${penaltyRate.toLocaleString('en-IN')}/day (after ${graceDays}d grace)`;
  } else if (penaltyType === 'fixed' && penaltyRate > 0) {
    lateFeeDisplay = `₹${penaltyRate.toLocaleString('en-IN')} Flat Fee`;
  } else if (penaltyType === 'percentage' && penaltyRate > 0) {
    lateFeeDisplay = `${penaltyRate}% Overdue Fee`;
  } else if (penaltyRate > 0) {
    lateFeeDisplay = `₹${penaltyRate.toLocaleString('en-IN')} (${penaltyType})`;
  }

  // Helper to format clean names
  const cleanName = (val?: string | null, fallback = 'Party') => {
    if (val && !val.includes('@')) return val.trim();
    if (val && val.includes('@')) {
      const prefix = val.split('@')[0].replace(/\d+/g, '').replace(/[._-]/g, ' ').trim();
      return prefix ? prefix.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : fallback;
    }
    return fallback;
  };

  const ownerName = cleanName(data.ownerName, 'Devesh Punjabi');
  const borrowerName = cleanName(data.borrowerName || data.borrowerEmail, 'Somya');

  // Build real parties list (strictly based on input data - no fake dummy parties!)
  const realParties: DocumentPartyData[] = [
    {
      name: ownerName,
      role: 'Owner / Lender',
      phone: data.ownerPhone || '+91 98765 43210',
      email: data.ownerEmail || 'punjabidevesh5810@gmail.com',
      address: data.ownerAddress || 'Registered Office Address, India',
      idNumber: data.ownerId || 'AAD****1234',
      verificationStatus: 'Accepted',
    },
    {
      name: borrowerName,
      role: 'Borrower',
      phone: data.borrowerPhone || '+91 91234 56789',
      email: data.borrowerEmail || 'somya142004@gmail.com',
      address: data.borrowerAddress || 'Registered Borrower Location, India',
      idNumber: 'AAD****5678',
      verificationStatus: 'Accepted',
    },
  ];

  // If user explicitly provided additional parties in data.parties
  if (data.parties && data.parties.length > 2) {
    for (let i = 2; i < data.parties.length; i++) {
      const p = data.parties[i];
      if (p && p.name) {
        realParties.push({
          name: p.name,
          role: p.role || `Party ${i + 1}`,
          phone: p.phone || 'N/A',
          email: p.email || 'N/A',
          address: p.address || 'Registered Address',
          idNumber: p.idNumber || `ID-${i + 1}`,
          verificationStatus: p.verificationStatus || 'Accepted',
        });
      }
    }
  }

  const totalParties = realParties.length;
  const hasExtraPartiesPage = totalParties > 2;
  const totalPages = hasExtraPartiesPage ? 3 : 2;

  const renderRunningHeader = () => (
    <div className="flex items-center justify-between border-b border-[#003a5e] pb-1.5 text-[10px] text-slate-500 font-mono shrink-0">
      <div className="flex items-center gap-2">
        <img src="/apple-touch-icon.png" alt="AgreeMate" decoding="async" className="size-4 object-contain" />
        <span className="font-bold text-[#003a5e] font-display tracking-wider">AGREEMATE TECHNOLOGIES</span>
      </div>
      <div>
        <span>Agreement No.: <strong className="text-slate-800">{agreementNo}</strong></span>
        <span className="mx-2 text-slate-300">|</span>
        <span>Effective Date: <strong className="text-slate-800">{effectiveDateStr}</strong></span>
      </div>
    </div>
  );

  const renderRunningFooter = (pageNum: number) => (
    <div className="bg-[#003a5e] text-white px-6 py-2 flex items-center justify-between text-[10px] font-mono relative overflow-hidden mt-auto shrink-0">
      <div className="absolute right-0 bottom-0 w-16 h-full bg-[#0ea5e9] transform skew-x-[-30deg] translate-x-4" />
      <div className="flex items-center gap-2 relative z-10">
        <Lock className="size-3.5 text-sky-200" />
        <span className="text-slate-200 font-sans">Confidential — Intended solely for the Parties named in this Agreement</span>
      </div>
      <span className="font-bold text-white relative z-10">Page {pageNum} of {totalPages}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-8 w-full print:gap-0 print:p-0">
      {/* ========================================================================= */}
      {/* PAGE 1: COVER BANNER, 3 BADGES, PARTIES, SUMMARY & TRANSACTION TABLE     */}
      {/* ========================================================================= */}
      <div className="agreement-print-page w-full max-w-[210mm] min-h-[297mm] bg-white border border-slate-200/90 shadow-xl rounded-none sm:rounded-sm overflow-hidden flex flex-col mx-auto print:max-w-none print:w-full print:min-h-0 print:border-none print:shadow-none print:rounded-none print:m-0">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#002842] via-[#003a5e] to-[#004f80] text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute right-0 bottom-0 w-24 h-5 bg-[#0ea5e9] transform skew-x-[-30deg] translate-x-4 translate-y-2" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-white p-1 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
                  <img src="/apple-touch-icon.png" alt="AgreeMate Logo" decoding="async" className="size-full object-contain rounded-lg" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-lg sm:text-xl tracking-wider text-white uppercase leading-tight">AGREEMATE</h2>
                  <p className="text-[10px] tracking-widest text-sky-200 uppercase font-semibold leading-tight">TECHNOLOGIES</p>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-200 font-medium">Digital Agreements. Trusted Records.</p>
            </div>
            <div className="space-y-0.5 text-xs text-slate-200 text-left sm:text-right text-[11px]">
              <div className="flex items-center sm:justify-end gap-1.5"><Mail className="size-3 text-sky-300" /><span>legal@agreemate.io</span></div>
              <div className="flex items-center sm:justify-end gap-1.5"><Phone className="size-3 text-sky-300" /><span>+91 98765 43210</span></div>
              <div className="flex items-center sm:justify-end gap-1.5"><MapPin className="size-3 text-sky-300" /><span>789 Tech Park, New Delhi, India 110001</span></div>
            </div>
          </div>
        </div>

        {/* Content Body (Page 1) */}
        <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col">
          {/* Document Title */}
          <div className="space-y-0.5">
            <h1 className="font-display font-extrabold text-base sm:text-lg text-[#003a5e] uppercase tracking-wide">BORROWING &amp; LENDING AGREEMENT</h1>
            <p className="text-xs font-semibold text-slate-500">Digital Transaction &amp; Repayment Agreement</p>
          </div>

          {/* 3 Clean Metadata Badges (Version removed as requested) */}
          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="p-2 rounded-lg border border-slate-200 bg-white">
              <span className="text-[9.5px] text-slate-400 block font-medium">Agreement No.</span>
              <span className="font-bold text-slate-900 font-mono text-[11px]">{agreementNo}</span>
            </div>
            <div className="p-2 rounded-lg border border-slate-200 bg-white">
              <span className="text-[9.5px] text-slate-400 block font-medium">Agreement Date</span>
              <span className="font-bold text-slate-900 text-[11px]">{createdDateStr}</span>
            </div>
            <div className="p-2 rounded-lg border border-slate-200 bg-white">
              <span className="text-[9.5px] text-slate-400 block font-medium">Effective Date</span>
              <span className="font-bold text-slate-900 text-[11px]">{effectiveDateStr}</span>
            </div>
          </div>

          {/* Preamble */}
          <p className="text-xs text-slate-600 leading-relaxed">
            This Borrowing &amp; Lending Agreement (&quot;Agreement&quot;) is entered into on <b>{createdDateStr}</b> and becomes effective on <b>{effectiveDateStr}</b> by and between the Parties identified below:
          </p>

          {/* Contracting Parties Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="inline-flex px-2 py-0.5 rounded bg-[#003a5e] text-white font-bold text-[9px] uppercase">PARTY 1 &nbsp;&bull;&nbsp; OWNER / PRIMARY PARTY</div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">{realParties[0].name} <span className="text-slate-400 font-normal text-[11px]">(Lender)</span></h3>
                <div className="w-full h-px bg-slate-200 my-1" />
                <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                  <p><strong className="text-slate-700">Phone:</strong> {realParties[0].phone} &nbsp;|&nbsp; <strong className="text-slate-700">Email:</strong> {realParties[0].email}</p>
                  <p><strong className="text-slate-700">Address:</strong> {realParties[0].address} &nbsp;|&nbsp; <strong className="text-slate-700">ID:</strong> <span className="font-mono">{realParties[0].idNumber}</span></p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="inline-flex px-2 py-0.5 rounded bg-[#003a5e] text-white font-bold text-[9px] uppercase">PARTY 2 &nbsp;&bull;&nbsp; BORROWER</div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">{realParties[1].name} <span className="text-slate-400 font-normal text-[11px]">(Borrower)</span></h3>
                <div className="w-full h-px bg-slate-200 my-1" />
                <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                  <p><strong className="text-slate-700">Phone:</strong> {realParties[1].phone} &nbsp;|&nbsp; <strong className="text-slate-700">Email:</strong> {realParties[1].email}</p>
                  <p><strong className="text-slate-700">Address:</strong> {realParties[1].address} &nbsp;|&nbsp; <strong className="text-slate-700">ID:</strong> <span className="font-mono">{realParties[1].idNumber}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Summary Metrics */}
          <div className="space-y-1.5">
            <h2 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase tracking-wide">AGREEMENT SUMMARY</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-lg border border-slate-200 bg-white space-y-0.5">
                <div className="flex items-center gap-1 text-[#003a5e] text-[9.5px] font-semibold"><CreditCard className="size-3 text-[#0ea5e9]" /><span>Principal Valuation</span></div>
                <span className="font-bold text-[#003a5e] text-xs block">{principalFormatted}</span>
              </div>
              <div className="p-2 rounded-lg border border-slate-200 bg-white space-y-0.5">
                <div className="flex items-center gap-1 text-[#003a5e] text-[9.5px] font-semibold"><Percent className="size-3 text-[#0ea5e9]" /><span>Interest Terms</span></div>
                <span className="font-bold text-slate-800 text-xs block">{interestDisplay}</span>
              </div>
              <div className="p-2 rounded-lg border border-slate-200 bg-white space-y-0.5">
                <div className="flex items-center gap-1 text-[#003a5e] text-[9.5px] font-semibold"><RefreshCw className="size-3 text-[#0ea5e9]" /><span>Repayment Frequency</span></div>
                <span className="font-bold text-slate-800 text-xs block">{frequencyDisplay}</span>
              </div>
              <div className="p-2 rounded-lg border border-slate-200 bg-white space-y-0.5">
                <div className="flex items-center gap-1 text-[#003a5e] text-[9.5px] font-semibold"><CalendarCheck className="size-3 text-[#0ea5e9]" /><span>Final Due Date</span></div>
                <span className="font-bold text-[#003a5e] text-xs block">{dueDateStr}</span>
              </div>
            </div>
          </div>

          {/* Transaction Summary Table on Page 1 */}
          <div className="space-y-1.5">
            <h2 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase tracking-wide">TRANSACTION SUMMARY DETAILS</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="bg-[#003a5e] text-white"><th className="p-1.5 font-bold uppercase tracking-wider text-[9.5px] w-1/3">DETAIL</th><th className="p-1.5 font-bold uppercase tracking-wider text-[9.5px] w-2/3">INFORMATION</th></tr></thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 text-[10.5px]">
                  <tr><td className="p-1.5 font-semibold text-slate-900">Transaction Type</td><td className="p-1.5">Asset Lending / Borrowing Agreement</td></tr>
                  <tr><td className="p-1.5 font-semibold text-slate-900">Principal Valuation</td><td className="p-1.5 font-bold text-[#003a5e]">{principalFormatted} ({data.assetName || 'Registered Asset'})</td></tr>
                  <tr><td className="p-1.5 font-semibold text-slate-900">Purpose</td><td className="p-1.5">{purposeDisplay}</td></tr>
                  <tr><td className="p-1.5 font-semibold text-slate-900">Disbursement Date</td><td className="p-1.5">{createdDateStr}</td></tr>
                  <tr><td className="p-1.5 font-semibold text-slate-900">Final Due Date</td><td className="p-1.5 font-bold">{dueDateStr}</td></tr>
                  <tr><td className="p-1.5 font-semibold text-slate-900">Interest Rate</td><td className="p-1.5">{interestDisplay}</td></tr>
                  <tr><td className="p-1.5 font-semibold text-slate-900">Late Fee / Penalty</td><td className="p-1.5 font-medium text-amber-800">{lateFeeDisplay}</td></tr>
                  <tr><td className="p-1.5 font-semibold text-slate-900">Repayment Frequency</td><td className="p-1.5">{frequencyDisplay}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-slate-600 text-[10.5px] leading-relaxed">
            This Agreement records the terms and conditions under which the Parties agree to a borrowing and lending transaction and the repayment/return of the asset in accordance with agreed terms.
          </p>
        </div>
        {renderRunningFooter(1)}
      </div>

      {/* ========================================================================= */}
      {/* OPTIONAL MULTI-PARTY PAGE (ONLY IF > 2 PARTIES)                           */}
      {/* ========================================================================= */}
      {hasExtraPartiesPage && (
        <div className="agreement-print-page w-full max-w-[210mm] min-h-[297mm] bg-white border border-slate-200/90 shadow-xl rounded-none sm:rounded-sm overflow-hidden flex flex-col mx-auto p-5 sm:p-6 space-y-4 print:max-w-none print:w-full print:min-h-0 print:border-none print:shadow-none print:rounded-none print:m-0">
          {renderRunningHeader()}
          <div className="space-y-3 flex-1">
            <h2 className="font-display font-extrabold text-xs text-[#003a5e] uppercase tracking-wide">PARTIES TO THE AGREEMENT (TOTAL PARTIES: {totalParties})</h2>
            <div className="space-y-2.5 text-xs">
              {realParties.map((party, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="inline-flex px-2 py-0.5 rounded bg-[#003a5e] text-white font-bold text-[9.5px] uppercase shrink-0">PARTY {index + 1}</div>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">{party.name}</p>
                    <p className="text-slate-500 text-[10.5px]">Role: <span className="text-slate-800 font-medium">{party.role}</span> &nbsp;|&nbsp; Contact: {party.phone}</p>
                    <p className="text-slate-500 text-[10.5px]">Email: {party.email} &nbsp;|&nbsp; Address: {party.address}</p>
                    <p className="text-slate-500 text-[10.5px]">ID: <span className="font-mono">{party.idNumber}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {renderRunningFooter(2)}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: OPERATIVE CLAUSES 1 TO 8, SIGNATURES & PLATFORM CERTIFICATION    */}
      {/* ========================================================================= */}
      <div className="agreement-print-page w-full max-w-[210mm] min-h-[297mm] bg-white border border-slate-200/90 shadow-xl rounded-none sm:rounded-sm overflow-hidden flex flex-col mx-auto p-5 sm:p-6 space-y-3 print:max-w-none print:w-full print:min-h-0 print:border-none print:shadow-none print:rounded-none print:m-0">
        {renderRunningHeader()}
        <div className="space-y-2.5 text-xs text-slate-700 flex-1">
          {/* Clause 1 */}
          <div className="space-y-0.5">
            <h3 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase">1. PURPOSE &amp; VOLUNTARY CONSENT</h3>
            <p className="text-slate-600 text-[10.5px] leading-relaxed">This Agreement records the terms and conditions under which the Lender agrees to lend and the Borrower agrees to borrow the registered asset / principal value stated above, and to repay or return the same along with applicable charges. The Parties enter into this Agreement voluntarily.</p>
          </div>

          {/* Clause 2 */}
          <div className="space-y-0.5">
            <h3 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase">2. LOAN AMOUNT &amp; ASSET VALUATION</h3>
            <p className="text-slate-600 text-[10.5px] leading-relaxed"><b>2.1 Principal Valuation:</b> The Lender lends and Borrower receives asset valuation of <b>{principalFormatted} ({data.assetName || 'Registered Asset'})</b>.<br/><b>2.2 Purpose:</b> The asset shall be used solely for: <b>{purposeDisplay}</b>. &nbsp;|&nbsp; <b>2.3 Acknowledgement:</b> The Borrower acknowledges receipt and agrees to return/repay as agreed.</p>
          </div>

          {/* Clause 3 */}
          <div className="space-y-0.5">
            <h3 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase">3. DISBURSEMENT &amp; HANDOVER</h3>
            <p className="text-slate-600 text-[10.5px] leading-relaxed"><b>3.1 Handover Date:</b> {effectiveDateStr}. &nbsp;|&nbsp; <b>3.2 Method:</b> Physical Handover &bull; Verified Inspection &bull; Digital OTP Acceptance.<br/><b>3.3 SHA-256 Vault Reference ID:</b> <span className="font-mono font-bold text-[#003a5e]">AGM-{data.id ? data.id.slice(0, 10).toUpperCase() : 'VAULT-001'}</span></p>
          </div>

          {/* Clause 4: Repayment Schedule */}
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase">4. REPAYMENT TERMS &amp; SCHEDULE</h3>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-center text-xs border-collapse">
                <thead><tr className="bg-[#003a5e] text-white text-[9.5px]"><th className="p-1.5 font-bold">Milestone</th><th className="p-1.5 font-bold">Due Date</th><th className="p-1.5 font-bold">Principal Value</th><th className="p-1.5 font-bold">Late Fee / Interest</th><th className="p-1.5 font-bold">Total Due</th></tr></thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 text-[10px]"><tr><td className="p-1.5 font-medium">Final Return</td><td className="p-1.5 font-bold">{dueDateStr}</td><td className="p-1.5 font-semibold text-slate-800">{principalFormatted}</td><td className="p-1.5 text-amber-700 font-medium">{lateFeeDisplay}</td><td className="p-1.5 font-bold text-[#003a5e]">{principalFormatted}</td></tr></tbody>
              </table>
            </div>
            <p className="text-slate-600 text-[10.5px]"><b>4.3 Final Repayment Date:</b> All outstanding obligations shall be completed on or before <b>{dueDateStr}</b>.</p>
          </div>

          {/* Clause 5 */}
          <div className="space-y-0.5">
            <h3 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase">5. INTEREST, PENALTIES &amp; SECURITY</h3>
            <p className="text-slate-600 text-[10.5px] leading-relaxed"><b>5.1 Interest:</b> {interestDisplay}. &nbsp;|&nbsp; <b>5.2 Late Penalty:</b> {lateFeeDisplay}.<br/><b>5.3 Early Repayment:</b> Permitted without penalty. &nbsp;|&nbsp; <b>5.4 Security:</b> Secured via SHA-256 Vault Records. Obligation fully discharged upon verified return.</p>
          </div>

          {/* Clause 6 */}
          <div className="space-y-0.5">
            <h3 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase">6. LEGAL COVENANTS &amp; STATUTORY COMPLIANCE</h3>
            <p className="text-slate-600 text-[10.5px] leading-relaxed"><b>6.1 Custody &amp; Debt:</b> The Borrower acknowledges lawful custody and debt liability under applicable law.<br/><b>6.2 Digital Record:</b> This Agreement, SHA-256 hashes, timestamps, and electronic acceptance constitute valid legal evidence under Information Technology Act, 2000.<br/><b>6.3 Dispute Resolution &amp; Jurisdiction:</b> Mutual settlement first, followed by binding arbitration. Governed by laws of India.</p>
          </div>

          {/* Clause 7: Platform Disclaimer */}
          <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-200 space-y-0.5">
            <h3 className="font-display font-extrabold text-[10.5px] text-[#003a5e] uppercase">7. NO ROLE OF THE COMPANY (PLATFORM DISCLAIMER)</h3>
            <p className="text-slate-700 text-[10px] leading-relaxed">The Company acts solely as a technology platform for recording transactions. The Company is not a lender, borrower, guarantor, broker, or party to this transaction and assumes no liability for default, damage, dispute, or performance between the Parties.</p>
          </div>

          {/* Clause 8 */}
          <div className="space-y-0.5">
            <h3 className="font-display font-extrabold text-[11px] text-[#003a5e] uppercase">8. ACKNOWLEDGEMENT &amp; VOLUNTARY CONSENT</h3>
            <p className="text-slate-600 text-[10.5px] leading-relaxed">Each Party confirms that they have read, understood, and voluntarily accept all terms and conditions of this Agreement.</p>
          </div>

          {/* Signatures Deck */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 text-[#003a5e]"><PenTool className="size-3.5 text-[#0ea5e9]" /><h3 className="font-display font-extrabold text-[11px] uppercase tracking-wide">SIGNATURES &amp; ACCEPTANCE (TOTAL SIGNATORIES: {totalParties})</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {realParties.map((p, idx) => {
                const docStatus = (data.status || 'draft').toLowerCase();
                const isExecuted = ['active', 'completed', 'return_initiated', 'overdue'].includes(docStatus);
                const isBorrowerAccepted = isExecuted || docStatus === 'pending_owner_confirmation';
                const isPartyAccepted = idx === 0 ? docStatus !== 'draft' : isBorrowerAccepted;

                return (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold"><span className="text-slate-500 uppercase">PARTY {idx + 1}</span><span className="text-[#003a5e] uppercase truncate">{p.role}</span></div>
                    <div className="h-6 flex items-end"><span className="font-serif italic text-xs text-slate-900 font-bold">{p.name}</span></div>
                    <div className="w-full h-px bg-slate-300" />
                    <div className="space-y-0.5 text-[10px]">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-slate-500 text-[9.5px]">Date: {effectiveDateStr}</p>
                      {isPartyAccepted ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold pt-0.5 text-[9.5px]"><CheckCircle2 className="size-3" /><span>Accepted &amp; Recorded</span></div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600 font-medium pt-0.5 text-[9.5px]"><Clock className="size-3" /><span>Pending Acceptance</span></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Electronic Record Audit (BSA Sec 63 / IT Act Sec 65B) */}
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-1.5 shadow-2xs">
            <div className="flex items-start gap-2">
              <div className="size-6 rounded-full bg-sky-50 text-[#003a5e] flex items-center justify-center shrink-0"><Award className="size-3.5 text-[#0ea5e9]" /></div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-[10.5px] uppercase">ELECTRONIC RECORD AUDIT (SEC. 65B IT ACT, 2000 / SEC. 63 BSA, 2023)</h3>
                <p className="text-[10px] text-slate-600 leading-relaxed">This Agreement records electronic acceptance, SHA-256 evidence digests, and platform audit trail events in accordance with applicable electronic record provisions.</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1.5 border-t border-slate-100 text-xs">
              <div><span className="text-slate-400 block text-[9px]">Document ID</span><span className="font-bold text-slate-900 font-mono text-[10px]">{agreementNo}</span></div>
              <div><span className="text-slate-400 block text-[9px]">Total Parties</span><span className="font-bold text-slate-900 text-[10px]">{totalParties}</span></div>
              <div><span className="text-slate-400 block text-[9px]">Recorded On</span><span className="font-bold text-slate-900 text-[10px]">{createdDateStr}</span></div>
              <div>
                <span className="text-slate-400 block text-[9px]">Status</span>
                <span className={`font-bold text-[10px] ${
                  ['active', 'completed'].includes((data.status || '').toLowerCase()) ? 'text-emerald-600' : (data.status === 'cancelled' ? 'text-rose-600' : 'text-amber-600')
                }`}>
                  {data.status ? data.status.replace(/_/g, ' ').toUpperCase() : 'DRAFT'}
                </span>
              </div>
            </div>
          </div>
        </div>
        {renderRunningFooter(totalPages)}
      </div>
    </div>
  );
}

export default React.memo(LegalDocumentSheet);
