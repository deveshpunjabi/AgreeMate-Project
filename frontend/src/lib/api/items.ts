import apiClient from './client';

export interface ItemMedia {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  is_primary: boolean;
}

export interface Item {
  id: string;
  _id?: string; // MongoDB format fallback
  owner_id: string;
  title: string;
  description?: string;
  category?: string;
  estimated_value?: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
  status: 'available' | 'on_loan' | 'unavailable';
  media?: ItemMedia[];
  created_at: string;
  updated_at: string;
}

export interface ItemCreate {
  title: string;
  description?: string;
  category?: string;
  estimated_value?: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
}

const extractId = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '$oid' in value) return String((value as { $oid: string }).$oid);
  return String(value);
};

// Backend serializes the Mongo `_id` alias, so normalize to a guaranteed `id`.
const normalizeItem = (i: Item): Item => ({ ...i, id: extractId(i.id ?? i._id) });

export const itemsApi = {
  create: async (data: ItemCreate) => {
    const res = await apiClient.post<Item>('/items', data);
    return normalizeItem(res.data);
  },

  list: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const res = await apiClient.get<{ items: Item[]; total: number }>('/items', { params });
    return { ...res.data, items: (res.data.items || []).map(normalizeItem) };
  },

  get: async (id: string) => {
    const res = await apiClient.get<Item>(`/items/${id}`);
    return normalizeItem(res.data);
  },
  
  update: async (id: string, data: Partial<ItemCreate>) => {
    const res = await apiClient.patch<Item>(`/items/${id}`, data);
    return normalizeItem(res.data);
  },
  
  delete: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/items/${id}`);
    return res.data;
  },
  
  uploadMedia: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ media_url: string; media_id: string }>(`/items/${id}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
};
