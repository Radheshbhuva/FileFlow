import { File, FileRepository, ListFilesFilters, ListFilesPagination, ListFilesSort } from '../../files/interfaces/file.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBFileRepository implements FileRepository {
  private static instance: DynamoDBFileRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBFileRepository {
    if (!DynamoDBFileRepository.instance) {
      DynamoDBFileRepository.instance = new DynamoDBFileRepository();
    }
    return DynamoDBFileRepository.instance;
  }

  private mapItemToFile(item: any): File {
    return {
      id: item.id,
      ownerId: item.ownerId,
      fileName: item.fileName,
      originalName: item.originalName,
      fileType: item.fileType,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      storagePath: item.storagePath,
      securityScore: item.securityScore,
      favorite: item.favorite,
      status: item.status,
      shareStatus: item.shareStatus,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }

  private marshalFile(file: Partial<File>): Record<string, any> {
    const marshalled: Record<string, any> = { ...file };
    if (file.createdAt instanceof Date) marshalled.createdAt = file.createdAt.toISOString();
    if (file.updatedAt instanceof Date) marshalled.updatedAt = file.updatedAt.toISOString();
    return marshalled;
  }

  public async create(fileData: Omit<File, 'id' | 'createdAt' | 'updatedAt'>): Promise<File> {
    const id = uuidv4();
    const now = new Date();
    const newFile: File = {
      ...fileData,
      id,
      fileType: fileData.fileType.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalFile(newFile);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${newFile.ownerId}`, // Treating user ownerId as default workspace partition
        SK: `FILE#${id}`,
        GSI3PK: `FILE#${id}`,
        GSI3SK: `WORKSPACE#${newFile.ownerId}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return newFile;
  }

  public async findById(id: string): Promise<File | null> {
    const docClient = DynamoDBService.getDocClient();
    
    // Look up file key in GSI3
    const queryGsiCommand = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `FILE#${id}`,
      },
    });

    const gsiResponse = await docClient.send(queryGsiCommand);
    if (!gsiResponse.Items || gsiResponse.Items.length === 0) return null;

    const pointer = gsiResponse.Items[0];
    
    // Fetch file from primary table
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: pointer.PK,
        SK: pointer.SK,
      },
    });

    const response = await docClient.send(command);
    if (!response.Item) return null;
    return this.mapItemToFile(response.Item);
  }

  public async update(id: string, updates: Partial<File>): Promise<File> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`File with ID ${id} not found`);
    }

    const updatedFile: File = {
      ...existing,
      ...updates,
      fileType: updates.fileType ? updates.fileType.toLowerCase() : existing.fileType,
      createdAt: updates.createdAt || existing.createdAt,
      updatedAt: new Date(),
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalFile(updatedFile);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${updatedFile.ownerId}`,
        SK: `FILE#${id}`,
        GSI3PK: `FILE#${id}`,
        GSI3SK: `WORKSPACE#${updatedFile.ownerId}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return updatedFile;
  }

  public async delete(id: string): Promise<boolean> {
    const file = await this.findById(id);
    if (!file) return false;

    const docClient = DynamoDBService.getDocClient();
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `WORKSPACE#${file.ownerId}`,
        SK: `FILE#${id}`,
      },
    });

    await docClient.send(command);
    return true;
  }

  public async findAll(
    ownerId: string,
    filters: ListFilesFilters,
    pagination: ListFilesPagination,
    sort: ListFilesSort
  ): Promise<{ files: File[]; total: number }> {
    const docClient = DynamoDBService.getDocClient();

    // Setup base query for workspace files
    const queryInput: any = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `WORKSPACE#${ownerId}`,
        ':sk': 'FILE#',
      },
    };

    // Build filter expressions for DynamoDB query
    const filterExpressions: string[] = [];
    
    if (filters.status) {
      filterExpressions.push('status = :status');
      queryInput.ExpressionAttributeValues[':status'] = filters.status;
    } else {
      filterExpressions.push('status <> :deletedStatus');
      queryInput.ExpressionAttributeValues[':deletedStatus'] = 'DELETED';
    }

    if (filters.fileType) {
      filterExpressions.push('fileType = :fileType');
      queryInput.ExpressionAttributeValues[':fileType'] = filters.fileType.toLowerCase();
    }

    if (filters.favorite !== undefined) {
      filterExpressions.push('favorite = :favorite');
      queryInput.ExpressionAttributeValues[':favorite'] = filters.favorite;
    }

    if (filters.shareStatus) {
      filterExpressions.push('shareStatus = :shareStatus');
      queryInput.ExpressionAttributeValues[':shareStatus'] = filters.shareStatus;
    }

    if (filters.minSecurityScore !== undefined) {
      filterExpressions.push('securityScore >= :minSecurityScore');
      queryInput.ExpressionAttributeValues[':minSecurityScore'] = filters.minSecurityScore;
    }

    if (filters.startDate) {
      filterExpressions.push('createdAt >= :startDate');
      queryInput.ExpressionAttributeValues[':startDate'] = filters.startDate.toISOString();
    }

    if (filters.endDate) {
      filterExpressions.push('createdAt <= :endDate');
      queryInput.ExpressionAttributeValues[':endDate'] = filters.endDate.toISOString();
    }

    if (filterExpressions.length > 0) {
      queryInput.FilterExpression = filterExpressions.join(' AND ');
    }

    // Query files matching workspace and filter criteria
    const response = await docClient.send(new QueryCommand(queryInput));
    if (!response.Items) return { files: [], total: 0 };

    let results = response.Items.map((item) => this.mapItemToFile(item));

    // Handle search query filtering in code for substring search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((f) => f.fileName.toLowerCase().includes(q));
    }

    const total = results.length;

    // Apply sorting logic
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

    // Handle pagination offsets
    const { page, limit } = pagination;
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return {
      files: paginatedResults,
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
    const docClient = DynamoDBService.getDocClient();

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `WORKSPACE#${ownerId}`,
        ':sk': 'FILE#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) {
      return {
        mostDownloaded: [],
        mostShared: [],
        largestFiles: [],
        leastUsedFiles: [],
        recentFiles: [],
      };
    }

    const ownerFiles = response.Items
      .map((item) => this.mapItemToFile(item))
      .filter((f) => f.status !== 'DELETED');

    const largestFiles = [...ownerFiles]
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, 5);

    const recentFiles = [...ownerFiles]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    const mostShared = ownerFiles
      .filter((f) => f.shareStatus === 'SHARED')
      .slice(0, 5);

    // Mocking matching logic from InMemory repository for consistency
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
