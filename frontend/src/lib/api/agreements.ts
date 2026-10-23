import apiClient from './client';
import { Item } from './items';

export interface AgreementTerms {
  due_date: string;
  penalty_type: 'fixed' | 'per_day' | 'percentage';
  penalty_rate: number;
  grace_period_days?: number;
  special_conditions?: string;
  locked_at?: string | null;
}

export interface StatusHistoryEntry {
  from_status: string;
  to_status: string;
  changed_by: string;
  note?: string;
  created_at: string;
}

export interface SignatureEvent {
  id?: string;
  user_id: string;
  event_type: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface Agreement {
  id: string;
  _id?: string; // MongoDB format fallback
  item_id: string;
  owner_id: string;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  borrower_id?: string | null;
  borrower_name?: string | null;
  borrower_email: string;
  borrower_phone?: string | null;
  status: 'draft' | 'pending_borrower_acceptance' | 'pending_owner_confirmation' | 'active' | 'overdue' | 'return_initiated' | 'completed' | 'disputed' | 'rejected' | 'cancelled';
  invite_token?: string | null;
  invite_expires_at?: string | null;
  terms: AgreementTerms;
  status_history?: StatusHistoryEntry[];
  signature_events?: SignatureEvent[];
  created_at: string;
  updated_at: string;
  item?: Item;
}

export interface AgreementCreate {
  item_id: string;
  borrower_email: string;
  borrower_name?: string;
  borrower_phone?: string;
  due_date: string;
  penalty_type: 'fixed' | 'per_day' | 'percentage';
  penalty_rate: number;
  grace_period_days?: number;
  special_conditions?: string;
}

export interface AgreementUpdate {
  borrower_email?: string;
  borrower_name?: string;
  borrower_phone?: string;
  due_date?: string;
  penalty_type?: 'fixed' | 'per_day' | 'percentage';
  penalty_rate?: number;
  grace_period_days?: number;
  special_conditions?: string;
  asset_name?: string;
  asset_value?: number;
}

export interface PenaltyRecord {
  overdue_days: number;
  grace_period_days: number;
  billable_days: number;
  penalty_type: string;
  penalty_rate: number;
  calculated_amount: number;
  formula_snapshot: string;
  is_overridden: boolean;
  override_amount?: number | null;
  override_reason?: string | null;
}

// Backend serializes the Mongo `_id` alias, so normalize to a guaranteed `id`.
const normalizeAgreement = (a: Agreement): Agreement => ({
  ...a,
  id: a.id ?? a._id ?? '',
});

export const agreementsApi = {
  create: async (data: AgreementCreate) => {
    const res = await apiClient.post<Agreement>('/agreements', data);
    return normalizeAgreement(res.data);
  },

  list: async (params?: { status?: string; role?: 'owner' | 'borrower'; limit?: number; offset?: number }) => {
    const res = await apiClient.get<{ agreements: Agreement[]; total: number }>('/agreements', { params });
    return { ...res.data, agreements: (res.data.agreements || []).map(normalizeAgreement) };
  },

  getDashboardStats: async (role: 'owner' | 'borrower' | 'all' = 'all') => {
    const res = await apiClient.get<{
      stats: {
        activeAgreements: number;
        pendingActions: number;
        itemsLent: number;
        itemsBorrowed: number;
        completedAgreements: number;
        disputedAgreements: number;
      };
      recentActivity: Array<{
        id: string;
        message: string;
        time: string;
        timestamp: number;
        hash: string | null;
        item_id: string;
      }>;
      hasAgreements: boolean;
    }>('/agreements/dashboard-stats', { params: { role } });
    return res.data;
  },
  
  get: async (id: string) => {
    const res = await apiClient.get<Agreement>(`/agreements/${id}`);
    return normalizeAgreement(res.data);
  },

  generateInvite: async (id: string) => {
    const res = await apiClient.post<{
      invite_url: string;
      expires_at: string;
      email_sent: boolean;
      invite_token: string;
      is_resend: boolean;
    }>(`/agreements/${id}/invite`);
    return res.data;
  },

  resendInvite: async (id: string) => {
    const res = await apiClient.post<{
      invite_url: string;
      expires_at: string;
      email_sent: boolean;
      invite_token: string;
      is_resend: boolean;
    }>(`/agreements/${id}/invite`);
    return res.data;
  },

  update: async (id: string, data: AgreementUpdate) => {
    const res = await apiClient.patch<Agreement>(`/agreements/${id}`, data);
    return normalizeAgreement(res.data);
  },

  getInvitePreview: async (token: string) => {
    const res = await apiClient.get<Agreement>(`/agreements/invite/${token}`);
    return normalizeAgreement(res.data);
  },
  
  acceptTerms: async (id: string) => {
    const res = await apiClient.post<Agreement>(`/agreements/${id}/accept`);
    return res.data;
  },
  
  rejectTerms: async (id: string, reason?: string) => {
    const res = await apiClient.post<Agreement>(`/agreements/${id}/reject`, { reason });
    return res.data;
  },
  
  confirmHandover: async (id: string) => {
    const res = await apiClient.post<Agreement>(`/agreements/${id}/confirm`);
    return res.data;
  },
  
  cancelAgreement: async (id: string, reason?: string) => {
    const res = await apiClient.post<Agreement>(`/agreements/${id}/cancel`, { reason });
    return res.data;
  },
  
  initiateReturn: async (id: string) => {
    const res = await apiClient.post<Agreement>(`/agreements/${id}/return`);
    return res.data;
  },
  
  completeAgreement: async (id: string) => {
    const res = await apiClient.post<Agreement>(`/agreements/${id}/complete`);
    return res.data;
  },
  
  disputeAgreement: async (id: string, reason: string) => {
    const res = await apiClient.post<Agreement>(`/agreements/${id}/dispute`, { reason });
    return res.data;
  },

  resolveDispute: async (id: string, target_status: 'active' | 'completed' | 'cancelled', resolution_notes: string) => {
    const res = await apiClient.patch<Agreement>(`/agreements/${id}/dispute-resolve`, {
      target_status,
      resolution_notes,
    });
    return normalizeAgreement(res.data);
  },

  updateNotes: async (id: string, notes: string) => {
    const res = await apiClient.patch<Agreement>(`/agreements/${id}/notes`, {
      notes,
    });
    return normalizeAgreement(res.data);
  },
  
  getPenalty: async (id: string) => {
    const res = await apiClient.get<PenaltyRecord>(`/agreements/${id}/penalty`);
    return res.data;
  },
  
  overridePenalty: async (id: string, amount: number, reason: string) => {
    const res = await apiClient.post<PenaltyRecord>(`/agreements/${id}/penalty/override`, { amount, reason });
    return res.data;
  },

  downloadPdf: async (id: string) => {
    const res = await apiClient.get(`/agreements/${id}/report/pdf`, {
      responseType: 'blob',
    });
    return res.data;
  },

  downloadPreviewPdf: async (data: Record<string, unknown>) => {
    const res = await apiClient.post('/agreements/preview-pdf', data, {
      responseType: 'blob',
    });
    return res.data;
  },

  downloadZip: async (id: string) => {
    const res = await apiClient.get(`/agreements/${id}/report/zip`, {
      responseType: 'blob',
    });
    return res.data;
  }
};
