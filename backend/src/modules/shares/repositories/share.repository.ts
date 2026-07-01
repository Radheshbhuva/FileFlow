import { Share, ShareRepository } from '../interfaces/share.interface';
import { InMemoryFileRepository } from '../../files/repositories/file.repository';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryShareRepository implements ShareRepository {
  private shares: Share[] = [];
  private static instance: InMemoryShareRepository;
  private fileRepository: InMemoryFileRepository;

  private constructor(fileRepository = InMemoryFileRepository.getInstance()) {
    this.fileRepository = fileRepository;
  }

  public static getInstance(): InMemoryShareRepository {
    if (!InMemoryShareRepository.instance) {
      InMemoryShareRepository.instance = new InMemoryShareRepository();
    }
    return InMemoryShareRepository.instance;
  }

  public clear(): void {
    this.shares = [];
  }

  public async create(shareData: Omit<Share, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<Share> {
    const now = new Date();
    const newShare: Share = {
      ...shareData,
      id: uuidv4(),
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.shares.push(newShare);
    return { ...newShare };
  }

  public async findById(id: string): Promise<Share | null> {
    const share = this.shares.find((s) => s.id === id);
    return share ? { ...share } : null;
  }

  public async findByToken(token: string): Promise<Share | null> {
    const share = this.shares.find((s) => s.shareToken === token);
    return share ? { ...share } : null;
  }

  public async update(id: string, updates: Partial<Share>): Promise<Share> {
    const shareIndex = this.shares.findIndex((s) => s.id === id);
    if (shareIndex === -1) {
      throw new Error(`Share transaction with ID ${id} not found`);
    }

    const updatedShare: Share = {
      ...this.shares[shareIndex],
      ...updates,
      createdAt: updates.createdAt || this.shares[shareIndex].createdAt,
      updatedAt: updates.updatedAt || new Date(),
    };

    this.shares[shareIndex] = updatedShare;
    return { ...updatedShare };
  }

  public async delete(id: string): Promise<boolean> {
    const shareIndex = this.shares.findIndex((s) => s.id === id);
    if (shareIndex === -1) {
      return false;
    }
    this.shares.splice(shareIndex, 1);
    return true;
  }

  public async findAll(ownerId: string): Promise<Share[]> {
    return this.shares.filter((s) => s.ownerId === ownerId).map((s) => ({ ...s }));
  }

  public async findActiveByFileId(fileId: string): Promise<Share[]> {
    return this.shares
      .filter((s) => s.fileId === fileId && s.shareStatus === 'ACTIVE')
      .map((s) => ({ ...s }));
  }

  public async getAnalytics(ownerId: string): Promise<{
    totalShares: number;
    activeShares: number;
    expiredShares: number;
    revokedShares: number;
    mostDownloadedFiles: Array<{ fileId: string; fileName: string; downloadCount: number }>;
    mostSharedFiles: Array<{ fileId: string; fileName: string; shareCount: number }>;
  }> {
    const userShares = this.shares.filter((s) => s.ownerId === ownerId);
    
    const totalShares = userShares.length;
    const activeShares = userShares.filter((s) => s.shareStatus === 'ACTIVE').length;
    const expiredShares = userShares.filter((s) => s.shareStatus === 'EXPIRED').length;
    const revokedShares = userShares.filter((s) => s.shareStatus === 'REVOKED').length;

    // Calculate most downloaded files
    const downloadMap = new Map<string, number>();
    userShares.forEach((s) => {
      const current = downloadMap.get(s.fileId) || 0;
      downloadMap.set(s.fileId, current + s.downloadCount);
    });

    const mostDownloadedRaw = Array.from(downloadMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const mostDownloadedFiles = await Promise.all(
      mostDownloadedRaw.map(async ([fileId, count]) => {
        const file = await this.fileRepository.findById(fileId);
        return {
          fileId,
          fileName: file ? file.fileName : 'Unknown File',
          downloadCount: count,
        };
      })
    );

    // Calculate most shared files
    const shareCountMap = new Map<string, number>();
    userShares.forEach((s) => {
      const current = shareCountMap.get(s.fileId) || 0;
      shareCountMap.set(s.fileId, current + 1);
    });

    const mostSharedRaw = Array.from(shareCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const mostSharedFiles = await Promise.all(
      mostSharedRaw.map(async ([fileId, count]) => {
        const file = await this.fileRepository.findById(fileId);
        return {
          fileId,
          fileName: file ? file.fileName : 'Unknown File',
          shareCount: count,
        };
      })
    );

    return {
      totalShares,
      activeShares,
      expiredShares,
      revokedShares,
      mostDownloadedFiles,
      mostSharedFiles,
    };
  }
}
