import { v4 as uuidv4 } from 'uuid';
import { FileRepository, File, ListFilesFilters, ListFilesPagination, ListFilesSort } from '../interfaces/file.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../utils/app-error';
import { eventBus } from '../../../shared/event-bus';

export class FileService {
  private fileRepository: FileRepository;
  private userRepository: UserRepository;

  constructor(
    fileRepository: FileRepository = RepositoryRegistry.getFileRepository(),
    userRepository: UserRepository = RepositoryRegistry.getUserRepository()
  ) {
    this.fileRepository = fileRepository;
    this.userRepository = userRepository;
  }

  /**
   * Helper to calculate the security score dynamically
   */
  public static calculateSecurityScore(
    fileName: string,
    fileSize: number,
    shareStatus: 'PRIVATE' | 'SHARED'
  ): { score: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; sharingAnalysis: string } {
    let score = 100;
    let sharingAnalysis = 'File is private and access-restricted.';

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const highRiskExtensions = ['exe', 'bat', 'sh', 'cmd', 'vbs', 'js', 'msi', 'scr'];
    const mediumRiskExtensions = ['zip', 'rar', 'tar', '7z', 'gz'];

    if (highRiskExtensions.includes(ext)) {
      score -= 40;
    } else if (mediumRiskExtensions.includes(ext)) {
      score -= 15;
    }

    if (shareStatus === 'SHARED') {
      score -= 15;
      sharingAnalysis = 'File is shared publicly. Exposure risk is increased.';
    }

    if (fileSize > 250 * 1024 * 1024) { // > 250MB
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (score < 50) {
      riskLevel = 'HIGH';
    } else if (score < 80) {
      riskLevel = 'MEDIUM';
    }

    return { score, riskLevel, sharingAnalysis };
  }

  /**
   * Creates a file, generating mock S3 locations and presigned upload links,
   * verifying user limits, and adjusting metrics in user accounts.
   */
  public async createFile(
    ownerId: string,
    dto: any
  ): Promise<{ file: File; uploadUrl: string }> {
    const user = await this.userRepository.findById(ownerId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    // Check storage limits
    const currentUsed = user.storageUsed || 0;
    const currentLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
    if (currentUsed + dto.fileSize > currentLimit) {
      throw new BadRequestError('Storage limit exceeded. Upgrade your plan.');
    }

    // Generate S3 mock params
    const fileId = uuidv4();
    const storagePath = `users/${ownerId}/files/${fileId}-${dto.fileName}`;
    const uploadUrl = `https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/${storagePath}?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=mockSignature&Expires=${Math.floor(Date.now() / 1000) + 900}`;

    const securityMetrics = FileService.calculateSecurityScore(dto.fileName, dto.fileSize, 'PRIVATE');

    const file = await this.fileRepository.create({
      ownerId,
      fileName: dto.fileName,
      originalName: dto.originalName || dto.fileName,
      fileType: dto.fileType,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      storagePath,
      securityScore: securityMetrics.score,
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'PRIVATE',
    });

    // Update user profile statistics
    await this.userRepository.update(ownerId, {
      storageUsed: currentUsed + dto.fileSize,
      filesUploadedCount: (user.filesUploadedCount || 0) + 1,
    });

    eventBus.emit('file.created', { userId: ownerId, fileId: file.id, fileName: file.fileName });

    return { file, uploadUrl };
  }

  /**
   * Lists files with search, sorting, and pagination
   */
  public async listFiles(
    ownerId: string,
    query: any
  ): Promise<{ files: File[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page as string, 10) || 1;
    const limit = parseInt(query.limit as string, 10) || 10;
    const sortBy = (query.sortBy as ListFilesSort['sortBy']) || 'createdAt';
    const sortOrder = (query.sortOrder as ListFilesSort['sortOrder']) || 'desc';

    const filters: ListFilesFilters = {};
    if (query.status) filters.status = query.status;
    if (query.search) filters.search = query.search;
    if (query.fileType) filters.fileType = query.fileType;
    if (query.shareStatus) filters.shareStatus = query.shareStatus;
    if (query.favorite !== undefined) {
      filters.favorite = query.favorite === 'true';
    }
    if (query.minSecurityScore) {
      filters.minSecurityScore = parseInt(query.minSecurityScore as string, 10);
    }
    if (query.startDate) {
      filters.startDate = new Date(query.startDate as string);
    }
    if (query.endDate) {
      filters.endDate = new Date(query.endDate as string);
    }

    const { files, total } = await this.fileRepository.findAll(
      ownerId,
      filters,
      { page, limit },
      { sortBy, sortOrder }
    );

    return { files, total, page, limit };
  }

  /**
   * Loads a file by ID and validates ownership
   */
  public async getFile(ownerId: string, id: string): Promise<File> {
    const file = await this.fileRepository.findById(id);
    if (!file || file.status === 'DELETED') {
      throw new NotFoundError('File not found');
    }

    if (file.ownerId !== ownerId) {
      throw new ForbiddenError('You do not have permission to access this file');
    }

    return file;
  }

  /**
   * Enriches metadata with security scoring analysis, owner details, and storage limits
   */
  public async getFileDetails(ownerId: string, id: string): Promise<any> {
    const file = await this.getFile(ownerId, id);
    const user = await this.userRepository.findById(ownerId);

    const securityMetrics = FileService.calculateSecurityScore(file.fileName, file.fileSize, file.shareStatus);

    return {
      metadata: file,
      securityAnalysis: {
        score: file.securityScore,
        riskLevel: securityMetrics.riskLevel,
        sharingAnalysis: securityMetrics.sharingAnalysis,
      },
      owner: {
        id: user?.id,
        fullName: user?.fullName,
        email: user?.email,
      },
      storage: {
        fileSize: file.fileSize,
        storageLimit: user?.storageLimit,
      },
      activitySummary: {
        lastModified: file.updatedAt,
      },
    };
  }

  /**
   * Updates file details
   */
  public async updateFile(ownerId: string, id: string, updates: any): Promise<File> {
    const file = await this.getFile(ownerId, id);

    const updatePayload: Partial<File> = {};
    if (updates.fileName) updatePayload.fileName = updates.fileName;

    if (updates.shareStatus && updates.shareStatus !== file.shareStatus) {
      updatePayload.shareStatus = updates.shareStatus;
      const securityMetrics = FileService.calculateSecurityScore(
        updates.fileName || file.fileName,
        file.fileSize,
        updates.shareStatus
      );
      updatePayload.securityScore = securityMetrics.score;
    }

    const updatedFile = await this.fileRepository.update(id, updatePayload);
    eventBus.emit('file.updated', { userId: ownerId, fileId: id, fileName: updatedFile.fileName, updates });
    return updatedFile;
  }

  /**
   * Soft deletes a file and releases storage space
   */
  public async deleteFile(ownerId: string, id: string): Promise<void> {
    const file = await this.getFile(ownerId, id);
    const user = await this.userRepository.findById(ownerId);

    await this.fileRepository.update(id, { status: 'DELETED' });

    if (user) {
      const currentUsed = user.storageUsed || 0;
      const currentFiles = user.filesUploadedCount || 0;

      await this.userRepository.update(ownerId, {
        storageUsed: Math.max(0, currentUsed - file.fileSize),
        filesUploadedCount: Math.max(0, currentFiles - 1),
      });
    }

    eventBus.emit('file.deleted', { userId: ownerId, fileId: id, fileName: file.fileName });
  }

  /**
   * Toggles the favorite status
   */
  public async favoriteFile(ownerId: string, id: string, favoriteFlag?: boolean): Promise<File> {
    const file = await this.getFile(ownerId, id);
    const user = await this.userRepository.findById(ownerId);

    const targetFavorite = favoriteFlag !== undefined ? favoriteFlag : !file.favorite;

    const updatedFile = await this.fileRepository.update(id, { favorite: targetFavorite });

    if (user) {
      const currentFavs = user.favoritesCount || 0;
      await this.userRepository.update(ownerId, {
        favoritesCount: targetFavorite ? currentFavs + 1 : Math.max(0, currentFavs - 1),
      });
    }

    eventBus.emit(targetFavorite ? 'file.favorited' : 'file.unfavorited', { userId: ownerId, fileId: id, fileName: file.fileName });

    return updatedFile;
  }

  /**
   * Archives or restores a file
   */
  public async archiveFile(ownerId: string, id: string, archiveFlag?: boolean): Promise<File> {
    const file = await this.getFile(ownerId, id);

    const isArchived = file.status === 'ARCHIVED';
    const targetArchived = archiveFlag !== undefined ? archiveFlag : !isArchived;

    const targetStatus: File['status'] = targetArchived ? 'ARCHIVED' : 'ACTIVE';

    const updatedFile = await this.fileRepository.update(id, { status: targetStatus });
    eventBus.emit('file.archived', { userId: ownerId, fileId: id, fileName: file.fileName, archive: targetArchived });
    return updatedFile;
  }

  /**
   * Returns aggregated file analytics (largest, recent, shared, etc.)
   */
  public async getFileInsights(ownerId: string): Promise<any> {
    const user = await this.userRepository.findById(ownerId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return this.fileRepository.findInsights(ownerId);
  }
}
