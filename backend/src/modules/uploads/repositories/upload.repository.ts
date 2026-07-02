import { Upload, UploadRepository } from '../interfaces/upload.interface';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryUploadRepository implements UploadRepository {
  private uploads: Upload[] = [];
  private static instance: InMemoryUploadRepository;

  private constructor() {}

  public static getInstance(): InMemoryUploadRepository {
    if (!InMemoryUploadRepository.instance) {
      InMemoryUploadRepository.instance = new InMemoryUploadRepository();
    }
    return InMemoryUploadRepository.instance;
  }

  public clear(): void {
    this.uploads = [];
  }

  public async create(uploadData: Omit<Upload, 'id' | 'createdAt'>): Promise<Upload> {
    const now = new Date();
    const newUpload: Upload = {
      ...uploadData,
      id: uuidv4(),
      createdAt: now,
    };
    this.uploads.push(newUpload);
    return { ...newUpload };
  }

  public async findById(id: string): Promise<Upload | null> {
    const upload = this.uploads.find((u) => u.id === id);
    return upload ? { ...upload } : null;
  }

  public async update(id: string, updates: Partial<Upload>): Promise<Upload> {
    const uploadIndex = this.uploads.findIndex((u) => u.id === id);
    if (uploadIndex === -1) {
      throw new Error(`Upload transaction with ID ${id} not found`);
    }

    const updatedUpload: Upload = {
      ...this.uploads[uploadIndex],
      ...updates,
    };

    this.uploads[uploadIndex] = updatedUpload;
    return { ...updatedUpload };
  }

  public async delete(id: string): Promise<boolean> {
    const uploadIndex = this.uploads.findIndex((u) => u.id === id);
    if (uploadIndex === -1) {
      return false;
    }
    this.uploads.splice(uploadIndex, 1);
    return true;
  }

  public async findAll(userId: string): Promise<Upload[]> {
    return this.uploads.filter((u) => u.userId === userId).map((u) => ({ ...u }));
  }

  public async findHistory(userId: string, limit = 10): Promise<Upload[]> {
    return this.uploads
      .filter((u) => u.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((u) => ({ ...u }));
  }

  public async getAnalytics(userId: string): Promise<{
    totalUploads: number;
    successRate: number;
    failureRate: number;
    averageUploadSize: number;
    largestUpload: number;
    recentUploadCount: number;
  }> {
    const userUploads = this.uploads.filter((u) => u.userId === userId);
    const totalUploads = userUploads.length;

    if (totalUploads === 0) {
      return {
        totalUploads: 0,
        successRate: 0,
        failureRate: 0,
        averageUploadSize: 0,
        largestUpload: 0,
        recentUploadCount: 0,
      };
    }

    const completed = userUploads.filter((u) => u.uploadStatus === 'COMPLETED').length;
    const failed = userUploads.filter((u) => u.uploadStatus === 'FAILED').length;

    const successRate = Number(((completed / totalUploads) * 100).toFixed(2));
    const failureRate = Number(((failed / totalUploads) * 100).toFixed(2));

    const totalSize = userUploads.reduce((acc, u) => acc + u.fileSize, 0);
    const averageUploadSize = Math.round(totalSize / totalUploads);

    const largestUpload = userUploads.reduce((max, u) => (u.fileSize > max ? u.fileSize : max), 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUploadCount = userUploads.filter((u) => u.createdAt >= sevenDaysAgo).length;

    return {
      totalUploads,
      successRate,
      failureRate,
      averageUploadSize,
      largestUpload,
      recentUploadCount,
    };
  }
}
