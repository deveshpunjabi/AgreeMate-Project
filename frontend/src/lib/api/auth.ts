import axios from 'axios';
import apiClient, { API_URL } from './client';

export interface ProfileInfo {
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  email_verified: boolean;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
}

interface BackendUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  email_verified: boolean;
  profile?: ProfileInfo | null;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
}

interface TokenPayload {
  access_token: string;
  refresh_token: string;
  user: BackendUser;
}

export interface SignUpRequest {
  email: string;
  password?: string;
  full_name: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp_code: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  totp_code?: string;
}

const normalizeUser = (user: BackendUser): User => ({
  id: user.id,
  email: user.email,
  role: user.role,
  email_verified: user.email_verified,
  full_name: user.full_name ?? user.profile?.full_name ?? null,
  phone: user.phone ?? user.profile?.phone ?? null,
  city: user.city ?? user.profile?.city ?? null,
  avatar_url: user.avatar_url ?? user.profile?.avatar_url ?? null,
});

const normalizeTokenPayload = (payload: TokenPayload) => ({
  access_token: payload.access_token,
  refresh_token: payload.refresh_token,
  user: normalizeUser(payload.user),
});

export const authApi = {
  signup: async (data: SignUpRequest) => {
    const res = await apiClient.post<{ user_id: string; message: string }>('/auth/signup', data);
    return res.data;
  },
  
  verifyOtp: async (data: VerifyOTPRequest) => {
    const res = await apiClient.post<TokenPayload>('/auth/verify-otp', data);
    return normalizeTokenPayload(res.data);
  },
  
  resendOtp: async (email: string) => {
    const res = await apiClient.post<{ message: string; retry_after_seconds: number }>('/auth/resend-otp', { email });
    return res.data;
  },
  
  login: async (data: LoginRequest) => {
    const res = await apiClient.post<TokenPayload>('/auth/login', data);
    return normalizeTokenPayload(res.data);
  },
  
  logout: async (refreshToken: string) => {
    // Use raw axios so logout never triggers the auth refresh interceptor.
    const res = await axios.post<{ message: string }>(`${API_URL}/auth/logout`, { refresh_token: refreshToken });
    return res.data;
  },
  
  getCurrentUser: async () => {
    const res = await apiClient.get<BackendUser>('/users/me');
    return normalizeUser(res.data);
  },
  
  updateProfile: async (data: { full_name?: string; phone?: string; city?: string }) => {
    const res = await apiClient.patch<User>('/users/me', data);
    return res.data;
  },
  
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ avatar_url: string }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  downloadInvoicePdf: async (invoiceId: string) => {
    const res = await apiClient.get(`/users/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AgreeMate_Invoice_${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

