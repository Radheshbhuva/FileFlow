import type { UploadFile, UploadQueueItem, ValidationError, UploadAnalytics, UploadSummary } from '../types/upload';
import type { FileType } from '../types/files';
import { useUploadStore } from '../stores/uploadStore';
import { useFilesStore } from '../stores/fileStore';
import { useActivityStore } from '../stores/activityStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import axios from 'axios';
import apiClient from './api/apiClient';

// Map to track active cancel tokens/sources
const activeUploadsMap = new Map<string, any>();
const filesMap = new Map<string, File>();

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit
const RESTRICTED_EXTENSIONS = ['exe', 'bat', 'cmd', 'sh', 'msi', 'vbs'];

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

export const uploadService = {
  /**
   * Validates select files against security rules, duplicate names, and sizes.
   */
  validateFiles: (files: File[]): { valid: UploadFile[]; errors: ValidationError[] } => {
    const valid: UploadFile[] = [];
    const errors: ValidationError[] = [];
    const currentFiles = useFilesStore.getState().files;

    files.forEach((f) => {
      const dotIdx = f.name.lastIndexOf('.');
      const ext = dotIdx !== -1 ? f.name.substring(dotIdx + 1) : '';
      const type = mapExtensionToType(ext);
      const isDuplicate = currentFiles.some((x) => x.name.toLowerCase() === f.name.toLowerCase() && x.sizeBytes === f.size);

      const id = `upl_file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const sizeLabel = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`;
      
      const uploadFile: UploadFile = {
        id,
        name: f.name,
        sizeBytes: f.size,
        sizeLabel,
        type,
        extension: ext,
        securityScore: Math.floor(Math.random() * 30) + 70, // 70 to 100
        isEncrypted: Math.random() > 0.4,
        lastModified: new Date(f.lastModified).toISOString()
      };

      // Rule 1: Size Limit
      if (f.size > MAX_FILE_SIZE_BYTES) {
        errors.push({
          id: `err_${Date.now()}_${f.name}`,
          fileName: f.name,
          message: 'File size exceeds maximum ingestion limit (100 MB).',
          suggestedFix: 'Compress the file or share via segmented links.',
          code: 'size_limit'
        });
      }
      // Rule 2: Restricted File Extensions
      else if (RESTRICTED_EXTENSIONS.includes(ext.toLowerCase())) {
        errors.push({
          id: `err_${Date.now()}_${f.name}`,
          fileName: f.name,
          message: `File extension .${ext} is restricted due to executable code policies.`,
          suggestedFix: 'Rename the extension or archive it in a secure zip package.',
          code: 'unsupported_type'
        });
      }
      // Rule 3: Duplicate Detections
      else if (isDuplicate) {
        errors.push({
          id: `err_${Date.now()}_${f.name}`,
          fileName: f.name,
          message: 'A file with matching name and storage footprint already exists in workspace.',
          suggestedFix: 'Rename the file or replace the existing document.',
          code: 'duplicate'
        });
      }
      // Valid file
      else {
        valid.push(uploadFile);
        filesMap.set(id, f);
      }
    });

    return { valid, errors };
  },

  /**
   * Main select file entry point. Handles validations, queue adjustments, and error listings.
   */
  selectFiles: (files: File[]) => {
    const store = useUploadStore.getState();
    const { valid, errors } = uploadService.validateFiles(files);

    store.addValidationErrors(errors);

    const queueItems: UploadQueueItem[] = valid.map((file) => ({
      id: `q_${file.id}`,
      file,
      progress: 0,
      status: 'pending'
    }));

    store.addToQueue(queueItems);
  },

  /**
   * Starts a real S3 upload via backend presigned URLs.
   */
  startUpload: async (queueItem: UploadQueueItem) => {
    const store = useUploadStore.getState();
    const activity = useActivityStore.getState();
    const notifications = useNotificationsStore.getState();

    if (activeUploadsMap.has(queueItem.id)) return;

    store.updateQueueItem(queueItem.id, { status: 'uploading', progress: 0, error: undefined });

    const rawFile = filesMap.get(queueItem.file.id);
    if (!rawFile) {
      store.updateQueueItem(queueItem.id, { status: 'failed', error: 'File data not found in local workspace.' });
      return;
    }

    try {
      // 1. Get presigned upload URL from backend
      const presignedRes = await apiClient.post('/uploads/presigned-url', {
        fileName: queueItem.file.name,
        fileSize: queueItem.file.sizeBytes,
        mimeType: rawFile.type || 'application/octet-stream',
        uploadMethod: 'STANDARD'
      });

      const { uploadUrl, upload } = presignedRes.data.data;
      const backendUploadId = upload.id;

      store.updateQueueItem(queueItem.id, { backendUploadId, status: 'uploading', progress: 0 });

      // 2. Perform direct PUT upload to S3 / Mock S3
      const CancelToken = axios.CancelToken;
      const source = CancelToken.source();

      // Store cancel token in active uploads map
      activeUploadsMap.set(queueItem.id, source);

      const startTime = Date.now();
      const totalSize = rawFile.size;

      await axios.put(uploadUrl, rawFile, {
        headers: {
          'Content-Type': rawFile.type || 'application/octet-stream',
        },
        cancelToken: source.token,
        onUploadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total || totalSize;
          const progress = Math.min(99, Math.round((loaded / total) * 100));

          // Calculate speed & remaining times
          const timeElapsed = (Date.now() - startTime) / 1000;
          const speed = Math.round(loaded / (timeElapsed || 1));
          const remainingBytes = total - loaded;
          const remainingSeconds = Math.max(1, Math.round(remainingBytes / (speed || 1024 * 1024)));

          store.updateQueueItem(queueItem.id, {
            progress,
            speedBytesPerSecond: speed,
            estimatedSecondsRemaining: remainingSeconds
          });
        }
      });

      // 3. Finalize upload at 100% on the backend
      await apiClient.patch(`/uploads/${backendUploadId}/progress`, {
        uploadProgress: 100
      });

      activeUploadsMap.delete(queueItem.id);

      // Update queue status
      store.updateQueueItem(queueItem.id, {
        status: 'completed',
        progress: 100,
        speedBytesPerSecond: 0,
        estimatedSecondsRemaining: 0
      });

      // Invalidate query cache to trigger automatic refetches on files lists and dashboards
      const { queryClient } = await import('../App');
      void queryClient.invalidateQueries({ queryKey: ['files'] });
      void queryClient.invalidateQueries({ queryKey: ['fileInsights'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboardStorage'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboardSecurity'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboardProductivity'] });

      // Log actions & notifications
      activity.logActivity('upload', `Uploaded file ${queueItem.file.name} (${queueItem.file.sizeLabel})`);
      notifications.addNotification(`Successfully uploaded file "${queueItem.file.name}"`, 'upload');

      // Move item to local history list
      const completedItem = { ...queueItem, status: 'completed' as const, progress: 100 };
      store.addToHistory(completedItem);

      // Recalculate summary
      uploadService.recalculateSummary();

    } catch (error: any) {
      activeUploadsMap.delete(queueItem.id);

      if (axios.isCancel(error)) {
        // Handle user cancel trigger
        try {
          const backendUploadId = store.queue.find((x) => x.id === queueItem.id)?.backendUploadId;
          if (backendUploadId) {
            await apiClient.patch(`/uploads/${backendUploadId}/cancel`);
          }
        } catch (e) {
          // ignore error during cancellation endpoint patch
        }
        store.updateQueueItem(queueItem.id, { status: 'cancelled' });
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
        store.updateQueueItem(queueItem.id, {
          status: 'failed',
          progress: 0,
          error: errorMsg
        });
        notifications.addNotification(`Upload failed for "${queueItem.file.name}": ${errorMsg}`, 'upload');
      }

      uploadService.recalculateSummary();
    }
  },

  /**
   * Cancels an active ongoing upload.
   */
  cancelUpload: (id: string) => {
    const store = useUploadStore.getState();
    const source = activeUploadsMap.get(id);
    if (source && typeof source.cancel === 'function') {
      source.cancel('Upload cancelled by user');
      activeUploadsMap.delete(id);
    } else {
      store.updateQueueItem(id, { status: 'cancelled' });
    }
    uploadService.recalculateSummary();
  },

  /**
   * Retries a cancelled or failed queue item.
   */
  retryUpload: async (id: string) => {
    const store = useUploadStore.getState();
    const item = store.queue.find((x) => x.id === id);
    if (item) {
      activeUploadsMap.delete(id);
      if (item.backendUploadId) {
        try {
          await apiClient.patch(`/uploads/${item.backendUploadId}/retry`);
        } catch (e) {
          // ignore or log
        }
      }
      uploadService.startUpload(item);
    }
  },

  /**
   * Triggers upload sequence for all pending items in the active list.
   */
  startAllUploads: () => {
    const { queue } = useUploadStore.getState();
    queue.forEach((item) => {
      if (item.status === 'pending' || item.status === 'cancelled' || item.status === 'failed') {
        uploadService.startUpload(item);
      }
    });
  },

  /**
   * Cancels all uploading queue items.
   */
  cancelAllUploads: () => {
    const { queue } = useUploadStore.getState();
    queue.forEach((item) => {
      if (item.status === 'uploading') {
        uploadService.cancelUpload(item.id);
      }
    });
  },

  /**
   * Recalculates user summary parameters.
   */
  recalculateSummary: () => {
    const store = useUploadStore.getState();
    const completed = store.queue.filter((x) => x.status === 'completed');
    const failed = store.queue.filter((x) => x.status === 'failed' || x.status === 'cancelled');

    if (completed.length + failed.length === 0) {
      store.setSummary(null);
      return;
    }

    const totalSize = completed.reduce((sum, x) => sum + x.file.sizeBytes, 0);
    const successRate = Math.round((completed.length / (completed.length + failed.length)) * 100);

    const summary: UploadSummary = {
      filesUploaded: completed.length,
      filesFailed: failed.length,
      totalSizeUploadedBytes: totalSize,
      totalDurationSeconds: completed.length * 1.5, // average simulation duration estimate
      successRate
    };

    store.setSummary(summary);
  },

  /**
   * Computes store queue statistics dynamically.
   */
  getUploadAnalytics: (): UploadAnalytics => {
    const { queue } = useUploadStore.getState();
    const filesSelected = queue.length;
    const totalSize = queue.reduce((sum, x) => sum + x.file.sizeBytes, 0);
    const avgSize = filesSelected > 0 ? Math.round(totalSize / filesSelected) : 0;
    
    const completed = queue.filter((x) => x.status === 'completed').length;
    const totalProcessed = queue.filter((x) => x.status === 'completed' || x.status === 'failed' || x.status === 'cancelled').length;
    const successRate = totalProcessed > 0 ? Math.round((completed / totalProcessed) * 100) : 100;

    // Type categories
    const categoriesCount: Record<string, number> = {};
    let largest: UploadFile | null = null;

    queue.forEach((item) => {
      const type = item.file.type;
      categoriesCount[type] = (categoriesCount[type] || 0) + 1;
      if (!largest || item.file.sizeBytes > largest.sizeBytes) {
        largest = item.file;
      }
    });

    let commonType = 'None';
    let maxCount = 0;
    Object.entries(categoriesCount).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        commonType = type.toUpperCase();
      }
    });

    return {
      filesSelected,
      totalUploadSizeBytes: totalSize,
      averageFileSizeBytes: avgSize,
      uploadSuccessRate: successRate,
      mostCommonFileType: commonType,
      largestFile: largest
    };
  }
};
