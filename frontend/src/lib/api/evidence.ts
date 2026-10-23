import apiClient from './client';

export interface EvidenceFile {
  id: string;
  _id?: string; // MongoDB format fallback
  agreement_id: string;
  uploaded_by: string;
  evidence_type: 'handover' | 'return' | 'damage' | 'payment' | 'communication';
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size_bytes: number;
  note?: string | null;
  sha256_hash?: string | null;
  hash_verified_at?: string | null;
  created_at: string;
}

export const evidenceApi = {
  upload: async (
    agreementId: string,
    fileData: {
      file: File;
      evidence_type: 'handover' | 'return' | 'damage' | 'payment' | 'communication';
      note?: string;
    }
  ) => {
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('evidence_type', fileData.evidence_type);
    if (fileData.note) {
      formData.append('note', fileData.note);
    }
    
    const res = await apiClient.post<EvidenceFile>(
      `/agreements/${agreementId}/evidence`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data;
  },
  
  list: async (agreementId: string, params?: { type?: string; limit?: number }) => {
    const res = await apiClient.get<EvidenceFile[]>(
      `/agreements/${agreementId}/evidence`,
      { params }
    );
    return res.data;
  }
};
