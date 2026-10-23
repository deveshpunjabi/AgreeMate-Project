'use client';

import React from 'react';
import {
  X,
  FileText,
  Download,
  CheckCircle2,
  Printer,
  Loader2,
} from 'lucide-react';
import LegalDocumentSheet, { LegalDocumentData } from './LegalDocumentSheet';

import { useState } from 'react';
import { agreementsApi } from '@/lib/api/agreements';

export interface ContractParty {
  name: string;
  phone: string;
  email: string;
  idNumber?: string;
  gstNumber?: string;
  address?: string;
  role: 'Owner' | 'Borrower' | 'Partner' | 'Client';
  verificationStatus?: string;
}

export interface AgreementContractData {
  title: string;
  persona: 'individual' | 'shopkeeper' | 'business';
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerId?: string;
  ownerGst?: string;
  ownerAddress?: string;
  parties: ContractParty[];
  assetType: 'digital' | 'physical';
  assetName: string;
  assetDescription?: string;
  assetValue?: number;
  effectiveDate: string;
  dueDate: string;
  durationDays?: number;
  penaltyType: 'per_day' | 'fixed' | 'percentage';
  penaltyRate: number;
  gracePeriodDays: number;
  specialConditions?: string;
  status?: string;
  createdDate?: string;
}

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AgreementContractData;
  onDownloadPdf?: () => void;
  onConfirmSubmit?: () => void;
  isSubmitting?: boolean;
}

export default function AgreementContractPreviewModal({
  isOpen,
  onClose,
  data,
  onDownloadPdf,
  onConfirmSubmit,
  isSubmitting,
}: ContractPreviewModalProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    try {
      setIsDownloadingPdf(true);
      const reqPayload = {
        title: data.title,
        persona: data.persona,
        owner_name: data.ownerName,
        owner_phone: data.ownerPhone,
        owner_email: data.ownerEmail,
        owner_id: data.ownerId,
        owner_address: data.ownerAddress,
        borrower_name: data.parties[0]?.name || 'Borrower',
        borrower_email: data.parties[0]?.email || 'borrower@example.com',
        borrower_phone: data.parties[0]?.phone || '+91 91234 56789',
        borrower_address: data.parties[0]?.address || 'Registered Location',
        asset_name: data.assetName,
        asset_description: data.assetDescription,
        asset_value: data.assetValue || 5000,
        due_date: data.dueDate,
        penalty_rate: data.penaltyRate,
        penalty_type: data.penaltyType,
        grace_period_days: data.gracePeriodDays,
        special_conditions: data.specialConditions,
        parties: data.parties.map((p) => ({
          name: p.name,
          role: p.role,
          phone: p.phone,
          email: p.email,
          address: p.address,
          id_number: p.idNumber,
        })),
      };

      const blob = await agreementsApi.downloadPreviewPdf(reqPayload);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AgreeMate_Contract_Preview.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download preview PDF error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const docData: LegalDocumentData = {
    title: data.title,
    persona: data.persona,
    ownerName: data.ownerName,
    ownerPhone: data.ownerPhone,
    ownerEmail: data.ownerEmail,
    ownerId: data.ownerId,
    ownerGst: data.ownerGst,
    ownerAddress: data.ownerAddress,
    borrowerName: data.parties[0]?.name || 'Borrower',
    borrowerEmail: data.parties[0]?.email || 'borrower@example.com',
    borrowerPhone: data.parties[0]?.phone || 'N/A',
    borrowerAddress: data.parties[0]?.address || 'Registered Location',
    parties: data.parties,
    assetName: data.assetName,
    assetType: data.assetType,
    assetDescription: data.assetDescription,
    assetValue: data.assetValue || 5000,
    effectiveDate: data.effectiveDate,
    dueDate: data.dueDate,
    gracePeriodDays: data.gracePeriodDays,
    penaltyType: data.penaltyType,
    penaltyRate: data.penaltyRate,
    specialConditions: data.specialConditions,
    status: data.status || 'draft',
    createdAt: data.createdDate || new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none print:p-0 print:static print:z-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 print:hidden" onClick={onClose} />

      {/* Contract Modal Sheet */}
      <div className="print-modal-container isolate bg-slate-100 border border-slate-200/90 rounded-[28px] w-full max-w-4xl lg:max-w-5xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#003a5e] flex items-center justify-center text-white font-mono">
              <FileText className="size-4.5 text-[#0ea5e9]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-[#003a5e] text-sm">Agreement Contract PDF Preview</h2>
              <p className="text-[10px] text-slate-500 font-medium">Multi-Page Legal Document Suite &amp; Table of Contents</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="h-8 px-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-xs font-mono font-bold text-[#003a5e] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="size-3.5 animate-spin text-[#003a5e]" />
              ) : (
                <Download className="size-3.5 text-[#0ea5e9]" />
              )}
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-bold text-[#003a5e] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
            >
              <Printer className="size-3.5 text-slate-500" />
              <span>Print Preview</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area (GPU-Accelerated Smooth Scrolling) */}
        <div className="flex-1 agreement-scroll-container p-4 sm:p-8 bg-[#e2e8f0] space-y-6 print:p-0 print:overflow-visible print:bg-white">
          <LegalDocumentSheet data={docData} agreementNo="AGM/2026/08/21" />
        </div>

        {/* Modal Footer Actions */}
        {onConfirmSubmit && (
          <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Back to Edit
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirmSubmit}
              className="h-10 px-6 rounded-xl bg-[#003a5e] hover:bg-[#002a45] text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-[#0ea5e9]" />
                  <span>Confirm &amp; Generate Agreement</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
