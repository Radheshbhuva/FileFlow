import { EventEmitter } from 'events';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { Share, ShareRepository } from '../interfaces/share.interface';
import { FileRepository } from '../../files/interfaces/file.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { FileService } from '../../files/services/file.service';
import { StorageService } from '../../storage/services/storage.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../utils/app-error';

export const shareEventEmitter = new EventEmitter();

export class ShareService {
  private shareRepository: ShareRepository;
  private fileRepository: FileRepository;
  private storageService: StorageService;

  constructor(
    shareRepository: ShareRepository = RepositoryRegistry.getShareRepository(),
    fileRepository: FileRepository = RepositoryRegistry.getFileRepository(),
    storageService: StorageService = new StorageService()
  ) {
    this.shareRepository = shareRepository;
    this.fileRepository = fileRepository;
    this.storageService = storageService;
  }

  /**
   * Recalculates file security score based on active sharing configuration
   */
  private async recalculateFileSecurityScore(fileId: string): Promise<void> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) return;

    const activeShares = await this.shareRepository.findActiveByFileId(fileId);
    
    // Evaluate base metrics as PRIVATE
    const baseMetrics = FileService.calculateSecurityScore(file.fileName, file.fileSize, 'PRIVATE');
    let finalScore = baseMetrics.score;
    let finalShareStatus: 'PRIVATE' | 'SHARED' = 'PRIVATE';

    if (activeShares.length > 0) {
      finalShareStatus = 'SHARED';
      let sharePenalty = 15; // BaseSHARED penalty

      const hasUnprotected = activeShares.some((s) => !s.passwordProtected);
      const hasNoExpiry = activeShares.some((s) => !s.expiryDate);
      const hasNoLimit = activeShares.some((s) => !s.maxDownloads);

      if (hasUnprotected) sharePenalty += 10;
      if (hasNoExpiry) sharePenalty += 10;
      if (hasNoLimit) sharePenalty += 5;

      // Cap sharing penalty at 40 points
      sharePenalty = Math.min(40, sharePenalty);

      finalScore = baseMetrics.score - sharePenalty;
    }

    finalScore = Math.max(0, finalScore);
    
    await this.fileRepository.update(fileId, {
      securityScore: finalScore,
      shareStatus: finalShareStatus,
    });
  }

  /**
   * Creates a secure sharing configuration for a file
   */
  public async createShare(
    userId: string,
    dto: {
      fileId: string;
      accessLevel?: any;
      maxDownloads?: number;
      expiryDate?: string;
      password?: string;
      sharedWith?: string;
    }
  ): Promise<Share> {
    const file = await this.fileRepository.findById(dto.fileId);
    if (!file || file.status === 'DELETED') {
      throw new NotFoundError('File not found');
    }

    if (file.ownerId !== userId) {
      throw new ForbiddenError('You do not have permission to share this file');
    }

    const shareToken = crypto.randomBytes(24).toString('hex');
    const shareLink = `${env.CLIENT_URL || 'http://localhost:5173'}/sh/${shareToken}`;

    let passwordHash: string | undefined;
    let passwordProtected = false;

    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
      passwordProtected = true;
    }

    const share = await this.shareRepository.create({
      fileId: dto.fileId,
      ownerId: userId,
      shareLink,
      shareToken,
      accessLevel: dto.accessLevel || 'VIEW',
      shareStatus: 'ACTIVE',
      maxDownloads: dto.maxDownloads,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      passwordProtected,
      passwordHash,
      sharedWith: dto.sharedWith,
    });

    await this.recalculateFileSecurityScore(dto.fileId);

    shareEventEmitter.emit('shareCreated', { ownerId: userId, shareId: share.id, fileId: dto.fileId });

    return share;
  }

  /**
   * Retrieves share configuration and verifies ownership
   */
  public async getShare(userId: string, id: string): Promise<Share> {
    const share = await this.shareRepository.findById(id);
    if (!share) {
      throw new NotFoundError('Share configuration not found');
    }

    if (share.ownerId !== userId) {
      throw new ForbiddenError('You do not have permission to access this share');
    }

    return share;
  }

  /**
   * Lists all shares owned by the user
   */
  public async listShares(
    userId: string,
    filters: {
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
    } = {}
  ): Promise<{ shares: Array<Share & { fileName?: string }>; total: number }> {
    const shares = await this.shareRepository.findAll(userId);
    let enriched = await Promise.all(
      shares.map(async (share) => {
        const file = await this.fileRepository.findById(share.fileId);
        return {
          ...share,
          fileName: file ? file.fileName : 'Unknown File',
        };
      })
    );

    // Apply Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      enriched = enriched.filter(
        (s) =>
          s.fileName.toLowerCase().includes(q) ||
          s.shareToken.toLowerCase().includes(q) ||
          (s.sharedWith && s.sharedWith.toLowerCase().includes(q))
      );
    }

    // Apply Status Filter
    if (filters.status) {
      const now = new Date();
      enriched = enriched.filter((s) => {
        const isExpired = s.expiryDate ? new Date(s.expiryDate).getTime() < now.getTime() : false;
        const isRevoked = s.shareStatus === 'REVOKED';

        if (filters.status === 'REVOKED') return isRevoked;
        if (filters.status === 'EXPIRED') return isExpired && !isRevoked;
        if (filters.status === 'ACTIVE') return !isExpired && !isRevoked && s.shareStatus === 'ACTIVE';
        return true;
      });
    }

    // Apply Password Protected Filter
    if (filters.passwordProtected !== undefined && filters.passwordProtected !== '') {
      const target = filters.passwordProtected === 'true';
      enriched = enriched.filter((s) => s.passwordProtected === target);
    }

    // Apply Access Level Filter
    if (filters.accessLevel) {
      enriched = enriched.filter((s) => s.accessLevel === filters.accessLevel);
    }

    // Apply Date Range Filter
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      enriched = enriched.filter((s) => new Date(s.createdAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      enriched = enriched.filter((s) => new Date(s.createdAt).getTime() <= end);
    }

    // Apply Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    enriched.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'fileName') {
        valA = a.fileName.toLowerCase();
        valB = b.fileName.toLowerCase();
      } else if (valA instanceof Date) {
        valA = valA.getTime();
        valB = valB.getTime();
      }

      if (valA === undefined || valA === null) return sortOrder === 'asc' ? 1 : -1;
      if (valB === undefined || valB === null) return sortOrder === 'asc' ? -1 : 1;

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = enriched.length;

    // Apply Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIdx = (page - 1) * limit;
    const paginated = enriched.slice(startIdx, startIdx + limit);

    return { shares: paginated, total };
  }

  /**
   * Updates an existing share configuration
   */
  public async updateShare(
    userId: string,
    id: string,
    dto: {
      accessLevel?: any;
      maxDownloads?: number | null;
      expiryDate?: string | null;
      password?: string | null;
      shareStatus?: any;
    }
  ): Promise<Share> {
    const share = await this.getShare(userId, id);

    const updates: Partial<Share> = {};
    if (dto.accessLevel) updates.accessLevel = dto.accessLevel;
    
    if (dto.maxDownloads !== undefined) {
      updates.maxDownloads = dto.maxDownloads === null ? undefined : dto.maxDownloads;
    }

    if (dto.expiryDate !== undefined) {
      updates.expiryDate = dto.expiryDate === null ? undefined : new Date(dto.expiryDate);
    }

    if (dto.password !== undefined) {
      if (dto.password === null) {
        updates.passwordProtected = false;
        updates.passwordHash = undefined;
      } else {
        updates.passwordHash = await bcrypt.hash(dto.password, 10);
        updates.passwordProtected = true;
      }
    }

    if (dto.shareStatus) updates.shareStatus = dto.shareStatus;

    const updated = await this.shareRepository.update(id, updates);
    await this.recalculateFileSecurityScore(share.fileId);

    shareEventEmitter.emit('shareUpdated', { ownerId: userId, shareId: id, fileId: share.fileId });

    return updated;
  }

  /**
   * Revokes sharing permissions immediately
   */
  public async revokeShare(userId: string, id: string): Promise<Share> {
    const share = await this.getShare(userId, id);
    
    const updated = await this.shareRepository.update(id, { shareStatus: 'REVOKED' });
    await this.recalculateFileSecurityScore(share.fileId);

    shareEventEmitter.emit('shareRevoked', { ownerId: userId, shareId: id, fileId: share.fileId });

    return updated;
  }

  /**
   * Extends the expiry date of a share link
   */
  public async extendShare(userId: string, id: string, expiryDate: string): Promise<Share> {
    const share = await this.getShare(userId, id);

    const updated = await this.shareRepository.update(id, {
      expiryDate: new Date(expiryDate),
      shareStatus: 'ACTIVE', // Reset status back to ACTIVE if it was expired
    });
    await this.recalculateFileSecurityScore(share.fileId);

    shareEventEmitter.emit('expiryExtended', { ownerId: userId, shareId: id, fileId: share.fileId });

    return updated;
  }

  /**
   * Deletes a share configuration completely
   */
  public async deleteShare(userId: string, id: string): Promise<boolean> {
    const share = await this.getShare(userId, id);
    const result = await this.shareRepository.delete(id);
    
    await this.recalculateFileSecurityScore(share.fileId);

    return result;
  }

  /**
   * Resolves a public token, validating expiration, download limits, and status gates
   */
  public async getPublicShare(token: string): Promise<{ share: Omit<Share, 'passwordHash'>; file: any }> {
    const share = await this.shareRepository.findByToken(token);
    if (!share) {
      throw new NotFoundError('Shared link not found');
    }

    let statusChanged = false;
    let targetStatus = share.shareStatus;

    // Check expiration rule
    if (share.expiryDate && new Date(share.expiryDate) < new Date() && share.shareStatus === 'ACTIVE') {
      targetStatus = 'EXPIRED';
      statusChanged = true;
    }

    // Check download limits rule
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads && share.shareStatus === 'ACTIVE') {
      targetStatus = 'EXPIRED'; // Or DISABLED
      statusChanged = true;
    }

    if (statusChanged) {
      share.shareStatus = targetStatus;
      await this.shareRepository.update(share.id, { shareStatus: targetStatus });
      await this.recalculateFileSecurityScore(share.fileId);
    }

    if (share.shareStatus !== 'ACTIVE') {
      throw new BadRequestError('This shared link has expired, been revoked, or is disabled.');
    }

    const file = await this.fileRepository.findById(share.fileId);
    if (!file || file.status === 'DELETED') {
      throw new NotFoundError('The file associated with this share has been deleted.');
    }

    // Sanitize sensitive attributes before public return
    const { passwordHash, ...sanitizedShare } = share;
    
    // Sanitize file structure for public view
    const publicFile = {
      id: file.id,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      createdAt: file.createdAt,
    };

    return { share: sanitizedShare, file: publicFile };
  }

  /**
   * Verifies the password of a protected public link and returns a temporary stateless access token
   */
  public async verifyPublicSharePassword(token: string, password: string): Promise<{ success: boolean; verificationToken: string }> {
    const { share } = await this.getPublicShare(token);
    
    // Re-load full record to get passwordHash
    const fullShare = await this.shareRepository.findById(share.id);
    if (!fullShare || !fullShare.passwordProtected || !fullShare.passwordHash) {
      throw new BadRequestError('This link is not password protected.');
    }

    const isMatch = await bcrypt.compare(password, fullShare.passwordHash);
    if (!isMatch) {
      throw new ForbiddenError('Incorrect password provided.');
    }

    // Issue a short-lived stateless JWT session token
    const verificationToken = jwt.sign(
      { shareId: share.id, token, verified: true },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { success: true, verificationToken };
  }

  /**
   * Tracks and increments download count, validating session headers if password protected
   */
  public async downloadPublicShare(
    token: string,
    clientIp: string,
    userAgent: string,
    verificationToken?: string
  ): Promise<{ downloadUrl: string; file: any }> {
    const { share } = await this.getPublicShare(token);

    if (share.passwordProtected) {
      if (!verificationToken) {
        throw new ForbiddenError('This shared link requires password verification.');
      }

      try {
        const decoded = jwt.verify(verificationToken, env.JWT_SECRET) as any;
        if (decoded.shareId !== share.id || decoded.token !== token) {
          throw new ForbiddenError('Invalid password session token.');
        }
      } catch (error) {
        throw new ForbiddenError('Your password session has expired or is invalid. Re-authenticate.');
      }
    }

    // Increment downloads
    const updatedCount = share.downloadCount + 1;
    const updates: Partial<Share> = { downloadCount: updatedCount };

    if (share.maxDownloads && updatedCount >= share.maxDownloads) {
      updates.shareStatus = 'EXPIRED';
    }

    await this.shareRepository.update(share.id, updates);
    await this.recalculateFileSecurityScore(share.fileId);

    // Re-verify file state
    const file = await this.fileRepository.findById(share.fileId);
    if (!file) {
      throw new NotFoundError('File metadata not found');
    }

    // Mock tracking log output
    shareEventEmitter.emit('shareDownloaded', {
      shareId: share.id,
      fileId: share.fileId,
      downloadedAt: new Date(),
      clientIp,
      userAgent,
    });

    // Retrieve the real presigned download URL from storage provider
    const downloadUrl = await this.storageService.generateDownloadUrl(file.storagePath);

    return { downloadUrl, file };
  }

  /**
   * Retrieves shares aggregates
   */
  public async getAnalytics(userId: string): Promise<any> {
    return this.shareRepository.getAnalytics(userId);
  }
}
