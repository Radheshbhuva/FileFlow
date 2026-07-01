import apiClient from './api/apiClient';
import type { ShareRecord } from '../stores/sharesStore';

export interface ShareFilter {
  search?: string;
  status?: string;
  passwordProtected?: string;
  accessLevel?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const mapBackendShareToShareRecord = (share: any): ShareRecord => {
  const expiryStr = share.expiryDate 
    ? new Date(share.expiryDate).toISOString() 
    : '';

  // Determine active status: active, expired, revoked
  let status: 'active' | 'expired' | 'revoked' = 'active';
  if (share.shareStatus === 'REVOKED') {
    status = 'revoked';
  } else if (share.expiryDate && new Date(share.expiryDate).getTime() < Date.now()) {
    status = 'expired';
  } else if (share.shareStatus === 'EXPIRED') {
    status = 'expired';
  }

  // Build the public share link correctly using the window origin
  const shareLink = `${window.location.origin}/share/${share.shareToken}`;

  return {
    id: share.id,
    fileId: share.fileId,
    fileName: share.fileName || 'Unknown File',
    sharedWith: share.sharedWith || 'public@web.link',
    shareDate: share.createdAt ? new Date(share.createdAt).toISOString() : new Date().toISOString(),
    expiryDate: expiryStr,
    status,
    shareLink,
    downloadCount: share.downloadCount || 0,
    passwordProtected: !!share.passwordProtected,
    accessLevel: share.accessLevel || 'VIEW',
    maxDownloads: share.maxDownloads,
  };
};

export const shareService = {
  getShares: async (filters: ShareFilter = {}): Promise<{ shares: ShareRecord[]; total: number }> => {
    const res = await apiClient.get('/shares', { params: filters });
    const { shares = [], total = 0 } = res.data.data || {};
    return {
      shares: shares.map(mapBackendShareToShareRecord),
      total,
    };
  },

  createShare: async (payload: {
    fileId: string;
    accessLevel?: string;
    maxDownloads?: number;
    expiryDate?: string;
    password?: string;
    sharedWith?: string;
  }): Promise<ShareRecord> => {
    const res = await apiClient.post('/shares', payload);
    return mapBackendShareToShareRecord(res.data.data.share);
  },

  getShare: async (id: string): Promise<ShareRecord> => {
    const res = await apiClient.get(`/shares/${id}`);
    return mapBackendShareToShareRecord(res.data.data.share);
  },

  updateShare: async (
    id: string,
    payload: {
      accessLevel?: string;
      maxDownloads?: number | null;
      expiryDate?: string | null;
      password?: string | null;
      shareStatus?: string;
    }
  ): Promise<ShareRecord> => {
    const res = await apiClient.patch(`/shares/${id}`, payload);
    return mapBackendShareToShareRecord(res.data.data.share);
  },

  revokeShare: async (id: string): Promise<ShareRecord> => {
    const res = await apiClient.patch(`/shares/${id}/revoke`);
    return mapBackendShareToShareRecord(res.data.data.share);
  },

  extendShare: async (id: string, expiryDate: string): Promise<ShareRecord> => {
    const res = await apiClient.patch(`/shares/${id}/extend`, { expiryDate });
    return mapBackendShareToShareRecord(res.data.data.share);
  },

  deleteShare: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/shares/${id}`);
    return true;
  },

  getAnalytics: async (): Promise<any> => {
    const res = await apiClient.get('/shares/analytics');
    return res.data.data.analytics;
  },
};
