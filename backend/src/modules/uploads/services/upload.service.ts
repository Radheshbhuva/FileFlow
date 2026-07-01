import { EventEmitter } from 'events';
import { UploadRepository, Upload } from '../interfaces/upload.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { FileService } from '../../files/services/file.service';
import { StorageService } from '../../storage/services/storage.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../utils/app-error';

// Real-time Event Emitter for future WebSockets
export const uploadEventEmitter = new EventEmitter();

export class UploadService {
  private uploadRepository: UploadRepository;
  private userRepository: UserRepository;
  private fileService: FileService;

  constructor(
    uploadRepository: UploadRepository = RepositoryRegistry.getUploadRepository(),
    userRepository: UserRepository = RepositoryRegistry.getUserRepository(),
    fileService: FileService = new FileService()
  ) {
    this.uploadRepository = uploadRepository;
    this.userRepository = userRepository;
    this.fileService = fileService;
  }

  /**
   * Helper to restrict specific executable extensions
   */
  public validateUpload(fileName: string, fileSize: number): void {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const restricted = ['exe', 'bat', 'sh', 'cmd', 'vbs', 'scr', 'js', 'msi'];

    if (ext && restricted.includes(ext)) {
      throw new BadRequestError('Restricted file extension type blocked for security reasons.');
    }

    if (fileSize <= 0) {
      throw new BadRequestError('File size must be a positive number of bytes.');
    }
  }

  /**
   * Initializes upload transactions and returns chunk parts for S3 multipart
   */
  public async createUpload(
    userId: string,
    dto: any
  ): Promise<{ upload: Upload; uploadUrl?: string; parts?: any[] }> {
    this.validateUpload(dto.fileName, dto.fileSize);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const currentUsed = user.storageUsed || 0;
    const currentLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
    if (currentUsed + dto.fileSize > currentLimit) {
      throw new BadRequestError('Storage limit exceeded. Upgrade your plan.');
    }

    const upload = await this.uploadRepository.create({
      userId,
      uploadStatus: 'PENDING',
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      uploadProgress: 0,
      uploadMethod: dto.uploadMethod,
      startedAt: new Date(),
    });

    uploadEventEmitter.emit('uploadStarted', { userId, uploadId: upload.id });

    // Handle Multipart S3 upload mockup
    if (dto.uploadMethod === 'MULTIPART') {
      const partSize = 5 * 1024 * 1024; // 5MB parts
      const totalParts = Math.ceil(dto.fileSize / partSize);
      const parts = [];

      for (let i = 1; i <= totalParts; i++) {
        parts.push({
          partNumber: i,
          uploadUrl: `https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/uploads/${upload.id}/part-${i}?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&partNumber=${i}`,
        });
      }

      return { upload, parts };
    }

    // Generate a real presigned URL for this object key
    const storageService = new StorageService();
    const objectKey = `uploads/${upload.id}-${dto.fileName}`;
    const uploadUrl = await storageService.generateUploadUrl(objectKey);
    return { upload, uploadUrl };
  }

  /**
   * Creates a transaction and generates S3 upload params
   */
  public async createPresignedUrl(
    userId: string,
    dto: any
  ): Promise<{ uploadUrl: string; objectKey: string; expiration: number; metadata: any; upload: Upload }> {
    const { upload, uploadUrl } = await this.createUpload(userId, dto);
    const objectKey = `uploads/${upload.id}-${dto.fileName}`;
    return {
      uploadUrl: uploadUrl || '',
      objectKey,
      expiration: 900,
      metadata: {
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
      },
      upload,
    };
  }

  /**
   * Tracks upload progress. Automatically creates the File entity at 100%.
   */
  public async trackProgress(
    userId: string,
    uploadId: string,
    progress: number
  ): Promise<Upload> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload) {
      throw new NotFoundError('Upload transaction not found');
    }

    if (upload.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this upload');
    }

    if (upload.uploadStatus === 'COMPLETED' || upload.uploadStatus === 'FAILED' || upload.uploadStatus === 'CANCELLED') {
      throw new BadRequestError(`Cannot update progress of upload in ${upload.uploadStatus} state`);
    }

    const updates: Partial<Upload> = {
      uploadProgress: progress,
      uploadStatus: progress === 100 ? 'COMPLETED' : 'UPLOADING',
    };

    if (progress === 100) {
      updates.completedAt = new Date();

      // Trigger automatic File registration at 100% completion
      try {
        const fileResult = await this.fileService.createFile(userId, {
          fileName: upload.fileName,
          originalName: upload.fileName,
          fileType: upload.fileName.split('.').pop() || 'bin',
          mimeType: upload.mimeType,
          fileSize: upload.fileSize,
        });

        updates.fileId = fileResult.file.id;

        // Relocate the uploaded S3 object from temporary path to final user destination
        const storageService = new StorageService();
        const sourceKey = `uploads/${uploadId}-${upload.fileName}`;
        const destKey = fileResult.file.storagePath;
        if (await storageService.exists(sourceKey)) {
          await storageService.moveFile(sourceKey, destKey);
        }

        uploadEventEmitter.emit('uploadCompleted', { userId, uploadId, fileId: fileResult.file.id });
      } catch (error: any) {
        updates.uploadStatus = 'FAILED';
        updates.failedAt = new Date();
        updates.errorMessage = error.message || 'File creation failed';
        uploadEventEmitter.emit('uploadFailed', { userId, uploadId, error: updates.errorMessage });
      }
    }

    return this.uploadRepository.update(uploadId, updates);
  }

  /**
   * Resets progress to 0% and retry a failed/cancelled upload transaction
   */
  public async retryUpload(userId: string, uploadId: string): Promise<Upload> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload) {
      throw new NotFoundError('Upload transaction not found');
    }

    if (upload.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this upload');
    }

    if (upload.uploadStatus !== 'FAILED' && upload.uploadStatus !== 'CANCELLED') {
      throw new BadRequestError('Only failed or cancelled uploads can be retried');
    }

    const updated = await this.uploadRepository.update(uploadId, {
      uploadStatus: 'PENDING',
      uploadProgress: 0,
      startedAt: new Date(),
      failedAt: undefined,
      errorMessage: undefined,
      completedAt: undefined,
    });

    uploadEventEmitter.emit('uploadStarted', { userId, uploadId });
    return updated;
  }

  /**
   * Cancels a pending or active upload transaction
   */
  public async cancelUpload(userId: string, uploadId: string): Promise<Upload> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload) {
      throw new NotFoundError('Upload transaction not found');
    }

    if (upload.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this upload');
    }

    if (upload.uploadStatus === 'COMPLETED' || upload.uploadStatus === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel upload in ${upload.uploadStatus} state`);
    }

    const updated = await this.uploadRepository.update(uploadId, {
      uploadStatus: 'CANCELLED',
      failedAt: new Date(),
    });

    uploadEventEmitter.emit('uploadCancelled', { userId, uploadId });
    return updated;
  }

  public async getUploadHistory(userId: string, limit?: number): Promise<Upload[]> {
    return this.uploadRepository.findHistory(userId, limit);
  }

  public async getUploadAnalytics(userId: string): Promise<any> {
    return this.uploadRepository.getAnalytics(userId);
  }

  public async getUpload(userId: string, id: string): Promise<Upload> {
    const upload = await this.uploadRepository.findById(id);
    if (!upload) {
      throw new NotFoundError('Upload transaction not found');
    }

    if (upload.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this upload');
    }

    return upload;
  }

  public async deleteUpload(userId: string, id: string): Promise<boolean> {
    // Confirm ownership
    await this.getUpload(userId, id);
    return this.uploadRepository.delete(id);
  }
}
