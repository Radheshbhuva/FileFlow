import { File, FileRepository, ListFilesFilters, ListFilesPagination, ListFilesSort } from '../interfaces/file.interface';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryFileRepository implements FileRepository {
  private files: File[] = [];
  private static instance: InMemoryFileRepository;

  private constructor() {}

  public static getInstance(): InMemoryFileRepository {
    if (!InMemoryFileRepository.instance) {
      InMemoryFileRepository.instance = new InMemoryFileRepository();
    }
    return InMemoryFileRepository.instance;
  }

  public clear(): void {
    this.files = [];
  }

  public async create(fileData: Omit<File, 'id' | 'createdAt' | 'updatedAt'>): Promise<File> {
    const now = new Date();
    const newFile: File = {
      ...fileData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.files.push(newFile);
    return { ...newFile };
  }

  public async findById(id: string): Promise<File | null> {
    const file = this.files.find((f) => f.id === id);
    return file ? { ...file } : null;
  }

  public async update(id: string, updates: Partial<File>): Promise<File> {
    const fileIndex = this.files.findIndex((f) => f.id === id);
    if (fileIndex === -1) {
      throw new Error(`File with ID ${id} not found`);
    }

    const updatedFile: File = {
      ...this.files[fileIndex],
      ...updates,
      createdAt: updates.createdAt || this.files[fileIndex].createdAt,
      updatedAt: updates.updatedAt || new Date(),
    };

    this.files[fileIndex] = updatedFile;
    return { ...updatedFile };
  }

  public async delete(id: string): Promise<boolean> {
    const fileIndex = this.files.findIndex((f) => f.id === id);
    if (fileIndex === -1) {
      return false;
    }
    this.files.splice(fileIndex, 1);
    return true;
  }

  public async findAll(
    ownerId: string,
    filters: ListFilesFilters,
    pagination: ListFilesPagination,
    sort: ListFilesSort
  ): Promise<{ files: File[]; total: number }> {
    let results = this.files.filter((f) => f.ownerId === ownerId);

    if (filters.status) {
      results = results.filter((f) => f.status === filters.status);
    } else {
      results = results.filter((f) => f.status !== 'DELETED');
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((f) => f.fileName.toLowerCase().includes(q));
    }

    if (filters.fileType) {
      results = results.filter((f) => f.fileType.toLowerCase() === filters.fileType?.toLowerCase());
    }

    if (filters.favorite !== undefined) {
      results = results.filter((f) => f.favorite === filters.favorite);
    }

    if (filters.shareStatus) {
      results = results.filter((f) => f.shareStatus === filters.shareStatus);
    }

    if (filters.minSecurityScore !== undefined) {
      const minScore = filters.minSecurityScore;
      results = results.filter((f) => f.securityScore >= minScore);
    }

    if (filters.startDate) {
      const start = filters.startDate;
      results = results.filter((f) => f.createdAt >= start);
    }

    if (filters.endDate) {
      const end = filters.endDate;
      results = results.filter((f) => f.createdAt <= end);
    }

    const total = results.length;

    const { sortBy, sortOrder } = sort;
    results.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA instanceof Date) {
        valA = valA.getTime();
        valB = valB.getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const { page, limit } = pagination;
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return {
      files: paginatedResults.map((f) => ({ ...f })),
      total,
    };
  }

  public async findInsights(ownerId: string): Promise<{
    mostDownloaded: File[];
    mostShared: File[];
    largestFiles: File[];
    leastUsedFiles: File[];
    recentFiles: File[];
  }> {
    const ownerFiles = this.files.filter((f) => f.ownerId === ownerId && f.status !== 'DELETED');

    const largestFiles = [...ownerFiles]
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, 5);

    const recentFiles = [...ownerFiles]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    const mostShared = ownerFiles
      .filter((f) => f.shareStatus === 'SHARED')
      .slice(0, 5);

    const mostDownloaded = [...ownerFiles]
      .sort((a, b) => a.fileName.localeCompare(b.fileName))
      .slice(0, 3);

    const leastUsedFiles = [...ownerFiles]
      .sort((a, b) => b.fileName.localeCompare(a.fileName))
      .slice(0, 3);

    return {
      mostDownloaded,
      mostShared,
      largestFiles,
      leastUsedFiles,
      recentFiles,
    };
  }
}
