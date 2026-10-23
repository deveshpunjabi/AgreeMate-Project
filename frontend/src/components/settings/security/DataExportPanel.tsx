'use client';

import React, { useState } from 'react';
import { Download, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { securityApi } from '@/lib/api/security';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function DataExportPanel() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await securityApi.requestDataExport();
      toast(res.message || 'Personal data archive prepared.', 'success');
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/security/data-export/download`;
      window.open(downloadUrl, '_blank');
    } catch {
      toast('Failed to request data export.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* DPDP Data Export */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="font-bold text-[#003a5e] text-sm block">Export My Personal Data</span>
            <p className="text-slate-500 leading-relaxed">
              DPDP-compliant data portability export. Packages agreements, items, evidence logs, and audit trails into a verified ZIP archive.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#003a5e] px-4 text-xs font-semibold text-white hover:bg-[#005080] transition-colors disabled:opacity-50 cursor-pointer w-full"
          >
            {isExporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5 text-[#0ea5e9]" />}
            <span>Export Data Archive</span>
          </button>
        </div>

        {/* Download All Agreements Shortcut */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="font-bold text-[#003a5e] text-sm block">Download All Contracts</span>
            <p className="text-slate-500 leading-relaxed">
              Access your signed PDF agreement reports and digital evidence packets in My Agreements.
            </p>
          </div>
          <Link
            href="/agreements"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-[#003a5e] hover:bg-slate-100 transition-colors cursor-pointer w-full"
          >
            <FileText className="size-3.5 text-[#0ea5e9]" />
            <span>Open My Agreements</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-500 font-medium">AgreeMate DPDP &amp; GDPR Privacy Policy</span>
        <Link href="/privacy" className="inline-flex items-center gap-1 font-semibold text-[#0068a3] hover:text-[#003a5e]">
          <span>View Legal Policy</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
