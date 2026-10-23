import apiClient from './client';
import { Agreement } from './agreements';

export interface AdminStats {
  total_users: number;
  total_agreements: number;
  total_items: number;
  total_valuation: number;
  active_loans: number;
  overdue_agreements: number;
  disputed_agreements: number;
  completed_agreements: number;
  pending_agreements: number;
}

export interface MonthlyBarChartPoint {
  month: string;
  month_key: string;
  count: number;
  valuation: number;
}

export interface StatusDistributionPoint {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CategoryDistributionPoint {
  category: string;
  count: number;
}

export interface AdminCharts {
  monthly_velocity: MonthlyBarChartPoint[];
  status_distribution: StatusDistributionPoint[];
  category_distribution: CategoryDistributionPoint[];
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  agreements_count: number;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  actor_id?: string | null;
  actor_email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface AdminSystemHealth {
  status: string;
  database: string;
  latency_ms: number;
  active_agreements: number;
  vault_status: string;
  server_time: string;
}

export const adminApi = {
  login: async (data: { login_id: string; password: string }) => {
    const res = await apiClient.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      user: AdminUser;
    }>('/admin/login', data);
    return res.data;
  },

  getStats: async () => {
    const res = await apiClient.get<AdminStats>('/admin/stats');
    return res.data;
  },

  getCharts: async () => {
    const res = await apiClient.get<AdminCharts>('/admin/charts');
    return res.data;
  },

  getUsers: async (params?: { limit?: number; offset?: number; search?: string }) => {
    const res = await apiClient.get<{ users: AdminUser[]; total: number }>('/admin/users', { params });
    return res.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    const res = await apiClient.patch<AdminUser>(`/admin/users/${userId}/status`, { is_active: isActive });
    return res.data;
  },

  getAgreements: async (params?: { limit?: number; offset?: number; status_filter?: string; search?: string }) => {
    const res = await apiClient.get<{ agreements: Agreement[]; total: number }>('/admin/agreements', { params });
    return res.data;
  },

  getAuditLogs: async (params?: { limit?: number; offset?: number }) => {
    const res = await apiClient.get<{ logs: AdminAuditLog[]; total: number }>('/admin/audit-logs', { params });
    return res.data;
  },

  getSystemHealth: async () => {
    const res = await apiClient.get<AdminSystemHealth>('/admin/system-health');
    return res.data;
  },
};


export function isAdminUser(
  user: { role?: string; email?: string | null } | null | undefined
): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
}
