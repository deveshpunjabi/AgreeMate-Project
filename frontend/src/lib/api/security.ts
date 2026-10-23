import apiClient from './client';

export interface SessionItem {
  id: string;
  user_agent: string;
  device_name: string;
  ip_address: string;
  last_active_at: string;
  is_current: boolean;
}

export interface AuditLogItem {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface VerificationLevel {
  badge: 'Basic' | 'Standard' | 'Verified' | 'High Trust';
  email_verified: boolean;
  phone_verified: boolean;
  id_uploaded: boolean;
  selfie_uploaded: boolean;
}

export const securityApi = {
  changePassword: async (current_password: string, new_password: string) => {
    const res = await apiClient.post<{ message: string }>('/security/change-password', {
      current_password,
      new_password,
    });
    return res.data;
  },

  setup2FA: async () => {
    const res = await apiClient.post<{ totp_secret: string; otpauth_url: string }>('/security/2fa/setup');
    return res.data;
  },

  verify2FA: async (totp_code: string) => {
    const res = await apiClient.post<{ success: boolean; backup_codes: string[] }>('/security/2fa/verify', {
      totp_code,
    });
    return res.data;
  },

  disable2FA: async (current_password: string, totp_code: string) => {
    const res = await apiClient.post<{ message: string }>('/security/2fa/disable', {
      current_password,
      totp_code,
    });
    return res.data;
  },

  regenerateBackupCodes: async () => {
    const res = await apiClient.post<{ success: boolean; backup_codes: string[] }>('/security/2fa/backup-codes/regenerate');
    return res.data;
  },

  listSessions: async () => {
    const res = await apiClient.get<SessionItem[]>('/security/sessions');
    return res.data;
  },

  revokeSession: async (sessionId: string) => {
    const res = await apiClient.delete<{ message: string }>(`/security/sessions/${sessionId}`);
    return res.data;
  },

  revokeAllOtherSessions: async () => {
    const res = await apiClient.delete<{ message: string }>('/security/sessions');
    return res.data;
  },

  getActivityLog: async () => {
    const res = await apiClient.get<AuditLogItem[]>('/security/activity-log');
    return res.data;
  },

  getVerificationLevel: async () => {
    const res = await apiClient.get<VerificationLevel>('/security/verification-level');
    return res.data;
  },

  requestDataExport: async () => {
    const res = await apiClient.post<{ status: string; message: string }>('/security/data-export');
    return res.data;
  },

  deactivateAccount: async (current_password: string, reason?: string) => {
    const res = await apiClient.post<{ message: string }>('/security/deactivate', {
      current_password,
      reason,
    });
    return res.data;
  },

  deleteAccountPermanently: async (current_password: string, confirmation_word: string) => {
    const res = await apiClient.post<{ message: string }>('/security/delete', {
      current_password,
      confirmation_word,
    });
    return res.data;
  },
};
