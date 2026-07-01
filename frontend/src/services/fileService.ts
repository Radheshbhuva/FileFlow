import type { File, FileInsights, FileActivity, FileFilter } from '../types/files';
import apiClient from './api/apiClient';
import { useProfileStore } from '../stores/profileStore';
import type { FileType } from '../types/files';

const mapExtensionToType = (ext: string): FileType => {
  const e = ext.toLowerCase();
  if (['pdf'].includes(e)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'image';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) return 'spreadsheet';
  if (['doc', 'docx', 'odt', 'rtf'].includes(e)) return 'document';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'archive';
  if (['txt', 'md', 'html', 'css', 'js', 'ts', 'json', 'yaml', 'yml'].includes(e)) return 'text';
  return 'other';
};

export const mapBackendFileToFrontendFile = (file: any): File => {
  const user = useProfileStore.getState().user;
  const extension = file.fileType || file.fileName.split('.').pop() || 'bin';
  const sizeLabel = file.fileSize > 1048576 
    ? `${(file.fileSize / 1048576).toFixed(1)} MB` 
    : `${(file.fileSize / 1024).toFixed(0)} KB`;
  
  const score = file.securityScore !== undefined ? file.securityScore : 100;
  const label = score >= 90 ? 'Secure' : score >= 70 ? 'Good' : score >= 50 ? 'Warning' : 'Risk';

  return {
    id: file.id,
    name: file.fileName,
    type: mapExtensionToType(extension),
    extension,
    sizeBytes: file.fileSize,
    sizeLabel,
    owner: {
      id: file.ownerId || user.id || 'usr_01',
      name: user.fullName || 'Alex Morgan',
      initials: user.avatarInitials || 'AM'
    },
    uploadDate: file.createdAt ? new Date(file.createdAt).toISOString() : new Date().toISOString(),
    lastModified: file.updatedAt ? new Date(file.updatedAt).toISOString() : new Date().toISOString(),
    downloadCount: file.downloadCount || 0,
    shareCount: file.shareCount || 0,
    security: {
      score,
      label,
      factors: ['Ingested via FileFlow Ingestion Hub', 'Vulnerability check passed'],
      isEncrypted: score >= 80
    },
    status: 'ready',
    tags: ['uploaded', 'ingested'],
    sharedStatus: file.shareStatus === 'SHARED' ? 'team' : 'private',
    isFavorite: file.favorite || false,
    previewUrl: file.storagePath ? `http://localhost:5000/api/v1/storage/mock-s3/${file.storagePath}` : undefined
  };
};

export const fileService = {
  /**
   * Fetch files with pagination, search, sorting and filter support.
   */
  getFiles: async (
    query: string = '',
    filters: FileFilter = {},
    sortBy: string = 'lastModified',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: File[]; totalCount: number }> => {
    try {
      const params: any = {
        search: query || undefined,
        limit: 100,
        page: 1,
        sortBy: sortBy === 'lastModified' ? 'createdAt' : sortBy === 'size' ? 'fileSize' : sortBy,
        sortOrder
      };

      if (filters.type && filters.type.length > 0) {
        params.fileType = filters.type[0];
      }
      if (filters.isFavorite !== undefined) {
        params.favorite = filters.isFavorite;
      }
      if (filters.sharedStatus && filters.sharedStatus.length > 0) {
        params.shareStatus = filters.sharedStatus.includes('private') ? 'PRIVATE' : 'SHARED';
      }
      if (filters.minSecurityScore !== undefined) {
        params.minSecurityScore = filters.minSecurityScore;
      }

      const res = await apiClient.get('/files', { params });
      const { files = [], total = 0 } = res.data.data;

      return {
        data: files.map(mapBackendFileToFrontendFile),
        totalCount: total
      };
    } catch (error) {
      console.error('Error fetching files:', error);
      return { data: [], totalCount: 0 };
    }
  },

  /**
   * Retrieve calculated insights based on current files list.
   */
  getInsights: async (): Promise<FileInsights> => {
    try {
      const res = await apiClient.get('/files/insights');
      const insights = res.data.data;

      const storageRes = await apiClient.get('/users/storage');
      const { storageUsed = 0, storageLimit = 5 * 1024 * 1024 * 1024 } = storageRes.data.data || {};

      const mostDownloadedFile = insights.mostDownloaded?.[0] ? mapBackendFileToFrontendFile(insights.mostDownloaded[0]) : null;
      const recentlySharedFile = insights.mostShared?.[0] ? mapBackendFileToFrontendFile(insights.mostShared[0]) : null;
      const largestFileRecord = insights.largestFiles?.[0] ? mapBackendFileToFrontendFile(insights.largestFiles[0]) : null;

      return {
        mostDownloaded: mostDownloadedFile,
        recentlyShared: recentlySharedFile,
        largestFile: largestFileRecord,
        unusedFilesCount: insights.leastUsedFiles?.length || 0,
        storageConsumedBytes: storageUsed,
        storageMaxBytes: storageLimit,
        recentUploadCount: insights.recentFiles?.length || 0
      };
    } catch (error) {
      throw new Error('Failed to fetch insights');
    }
  },

  /**
   * Fetch activities for a single file or general timeline feed.
   */
  getFileActivities: async (fileId?: string): Promise<FileActivity[]> => {
    try {
      const res = await apiClient.get('/activities/recent');
      const activities = res.data.data.activities || res.data.data || [];
      
      const user = useProfileStore.getState().user;

      const mapped = activities.map((act: any) => {
        let action: any = 'uploaded';
        if (act.activityType === 'FILE_UPLOADED' || act.activityType === 'UPLOAD_COMPLETED') action = 'uploaded';
        else if (act.activityType === 'SHARE_DOWNLOADED') action = 'downloaded';
        else if (act.activityType === 'FILE_SHARED' || act.activityType === 'SHARE_CREATED') action = 'shared';
        else if (act.activityType === 'FILE_DELETED') action = 'deleted';
        else if (act.activityType === 'FILE_ARCHIVED') action = 'archived';
        else if (act.activityType === 'FILE_UPDATED') action = 'renamed';

        const createdDate = new Date(act.createdAt);
        const diffMs = Date.now() - createdDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        let relativeTime = 'Just now';
        if (diffDays > 0) relativeTime = `${diffDays}d ago`;
        else if (diffHours > 0) relativeTime = `${diffHours}h ago`;
        else if (diffMins > 0) relativeTime = `${diffMins}m ago`;

        return {
          id: act.id,
          fileId: act.resourceId || '',
          fileName: act.resourceName || 'Asset',
          action,
          user: user.fullName || 'Alex Morgan',
          timestamp: createdDate.toISOString(),
          relativeTime
        };
      });

      if (fileId) {
        return mapped.filter((m: any) => m.fileId === fileId);
      }
      return mapped;
    } catch (error) {
      return [];
    }
  },

  /**
   * Action methods updating database state
   */
  renameFile: async (id: string, newName: string): Promise<File> => {
    const res = await apiClient.patch(`/files/${id}`, {
      fileName: newName
    });
    return mapBackendFileToFrontendFile(res.data.data.file || res.data.data);
  },

  deleteFiles: async (ids: string[]): Promise<boolean> => {
    await Promise.all(
      ids.map((id) => apiClient.delete(`/files/${id}`))
    );
    return true;
  },

  archiveFiles: async (ids: string[]): Promise<boolean> => {
    await Promise.all(
      // Backend controller reads req.body.archive (boolean)
      ids.map((id) => apiClient.patch(`/files/${id}/archive`, { archive: true }))
    );
    return true;
  },

  shareFile: async (id: string, emails: string[]): Promise<File> => {
    await apiClient.post('/shares', {
      fileId: id,
      sharedWith: emails[0] || 'public@web.link',
      accessLevel: 'VIEW'
    });
    const fileRes = await apiClient.get(`/files/${id}`);
    return mapBackendFileToFrontendFile(fileRes.data.data.file);
  },

  downloadFile: async (id: string, name: string): Promise<void> => {
    // GET /files/:id/details returns { downloadUrl, storagePath, ... }
    const res = await apiClient.get(`/files/${id}/details`);
    const details = res.data?.data;
    const downloadUrl: string | undefined =
      details?.downloadUrl ||
      (details?.storagePath
        ? `http://localhost:5000/api/v1/storage/mock-s3/${details.storagePath}`
        : undefined);

    if (!downloadUrl) {
      throw new Error('No download URL available for this file');
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  toggleFavorite: async (id: string, isFavorite: boolean): Promise<File> => {
    const res = await apiClient.patch(`/files/${id}/favorite`, { favorite: isFavorite });
    return mapBackendFileToFrontendFile(res.data.data.file || res.data.data);
  }
};
