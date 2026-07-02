import { DynamoDBService } from '../src/modules/database/services/dynamodb.service';
import { RepositoryRegistry } from '../src/modules/database/repositories/registry';
import { DynamoDBUserRepository } from '../src/modules/database/repositories/dynamodb-user.repository';
import { DynamoDBWorkspaceRepository } from '../src/modules/database/repositories/dynamodb-workspace.repository';
import { DynamoDBFileRepository } from '../src/modules/database/repositories/dynamodb-file.repository';
import { DynamoDBShareRepository } from '../src/modules/database/repositories/dynamodb-share.repository';
import { DynamoDBActivityRepository } from '../src/modules/database/repositories/dynamodb-activity.repository';
import { DynamoDBNotificationRepository } from '../src/modules/database/repositories/dynamodb-notification.repository';
import { DynamoDBUploadRepository } from '../src/modules/database/repositories/dynamodb-upload.repository';
import { DynamoDBSearchRepository } from '../src/modules/database/repositories/dynamodb-search.repository';

// Setup in-memory mock store for simulating DynamoDB
let dbItems: any[] = [];

// Setup Jest Mock for @aws-sdk/lib-dynamodb commands and send method
const mockSend = (command: any) => {
  const name = command.constructor.name;
  const input = command.input;

  switch (name) {
    case 'PutCommand': {
      const item = input.Item;
      // Remove existing item with same PK and SK if present
      dbItems = dbItems.filter(i => !(i.PK === item.PK && i.SK === item.SK));
      dbItems.push(item);
      return { $metadata: {} };
    }

    case 'GetCommand': {
      const key = input.Key;
      const found = dbItems.find(i => i.PK === key.PK && i.SK === key.SK);
      return { Item: found ? { ...found } : undefined };
    }

    case 'DeleteCommand': {
      const key = input.Key;
      dbItems = dbItems.filter(i => !(i.PK === key.PK && i.SK === key.SK));
      return { $metadata: {} };
    }

    case 'QueryCommand': {
      let results = [...dbItems];
      const indexName = input.IndexName;

      // Handle GSI filtering
      if (indexName === 'GSI1') {
        const val = input.ExpressionAttributeValues[':gsi1pk'];
        results = results.filter(i => i.GSI1PK === val);
      } else if (indexName === 'GSI2') {
        const val = input.ExpressionAttributeValues[':gsi2pk'];
        results = results.filter(i => i.GSI2PK === val);
        const skPrefix = input.ExpressionAttributeValues[':gsi2sk'];
        if (skPrefix) {
          results = results.filter(i => i.GSI2SK && i.GSI2SK.startsWith(skPrefix));
        }
      } else if (indexName === 'GSI3') {
        const val = input.ExpressionAttributeValues[':gsi3pk'];
        results = results.filter(i => i.GSI3PK === val);
      } else if (indexName === 'GSI4') {
        const val = input.ExpressionAttributeValues[':gsi4pk'];
        results = results.filter(i => i.GSI4PK === val);
        // Sort descending on timestamp GSI4SK
        results.sort((a, b) => b.GSI4SK.localeCompare(a.GSI4SK));
      } else if (indexName === 'GSI5') {
        const val = input.ExpressionAttributeValues[':gsi5pk'];
        results = results.filter(i => i.GSI5PK === val);
        const skPrefix = input.ExpressionAttributeValues[':gsi5sk'];
        if (skPrefix) {
          results = results.filter(i => i.GSI5SK && i.GSI5SK.startsWith(skPrefix));
        }
        // Sort descending on GSI5SK timestamp
        results.sort((a, b) => b.GSI5SK.localeCompare(a.GSI5SK));
      } else {
        // Query on primary key
        const pk = input.ExpressionAttributeValues[':pk'];
        results = results.filter(i => i.PK === pk);
        const skPrefix = input.ExpressionAttributeValues[':sk'];
        if (skPrefix) {
          results = results.filter(i => i.SK && i.SK.startsWith(skPrefix));
        }
        // Primary sort key descending (newest activity/notification first)
        results.sort((a, b) => b.SK.localeCompare(a.SK));
      }

      // Handle simple FilterExpressions simulated
      if (input.FilterExpression) {
        if (input.FilterExpression.includes('status = :status')) {
          const status = input.ExpressionAttributeValues[':status'];
          results = results.filter(i => i.status === status);
        }
        if (input.FilterExpression.includes('status <> :deletedStatus')) {
          const delStatus = input.ExpressionAttributeValues[':deletedStatus'];
          results = results.filter(i => i.status !== delStatus);
        }
        if (input.FilterExpression.includes('favorite = :favorite')) {
          const fav = input.ExpressionAttributeValues[':favorite'];
          results = results.filter(i => i.favorite === fav);
        }
      }

      // Handle Limit
      if (input.Limit) {
        results = results.slice(0, input.Limit);
      }

      return { Items: results };
    }

    case 'ScanCommand': {
      let results = [...dbItems];
      if (input.FilterExpression && input.FilterExpression.includes('begins_with(SK, :sk)')) {
        const skPrefix = input.ExpressionAttributeValues[':sk'];
        results = results.filter(i => i.SK && i.SK.startsWith(skPrefix));
      }
      return { Items: results };
    }

    case 'UpdateCommand': {
      const key = input.Key;
      const index = dbItems.findIndex(i => i.PK === key.PK && i.SK === key.SK);
      if (index === -1) {
        throw new Error('Item not found for update mock');
      }
      // Simulate simple increment/date updates
      const item = dbItems[index];
      if (input.UpdateExpression.includes('frequency = frequency + :inc')) {
        item.frequency = (item.frequency || 0) + input.ExpressionAttributeValues[':inc'];
      }
      if (input.UpdateExpression.includes('lastSearchedAt = :now')) {
        item.lastSearchedAt = input.ExpressionAttributeValues[':now'];
      }
      dbItems[index] = item;
      return { Attributes: { ...item } };
    }

    default:
      throw new Error(`Unsupported command mock: ${name}`);
  }
};

describe('FileFlow DynamoDB Repository Layer Integration Tests', () => {
  const mockUserId = 'user-12345';
  const mockWorkspaceId = 'user-12345'; // defaults to ownerId

  beforeEach(() => {
    dbItems = [];
    process.env.DB_TYPE = 'dynamodb';

    // Mock getDocClient in beforeEach to override Jest's restoreMocks/resetMocks behavior
    jest.spyOn(DynamoDBService, 'getDocClient').mockImplementation(() => {
      return {
        send: (command: any) => mockSend(command),
      } as any;
    });
  });

  afterAll(() => {
    delete process.env.DB_TYPE;
  });

  describe('1. UserRepository CRUD & GSI Lookups', () => {
    const userRepo = DynamoDBUserRepository.getInstance();

    it('should create and retrieve a user profile by PK and SK', async () => {
      const user = await userRepo.create({
        fullName: 'John Dynamo',
        email: 'john@dynamo.com',
        passwordHash: 'hash123',
        role: 'USER',
        planType: 'PRO',
        emailVerified: true,
        accountStatus: 'ACTIVE',
      });

      expect(user.id).toBeDefined();
      expect(user.fullName).toBe('John Dynamo');

      const found = await userRepo.findById(user.id);
      expect(found).not.toBeNull();
      expect(found?.email).toBe('john@dynamo.com');
      expect(found?.createdAt).toBeInstanceOf(Date);
    });

    it('should resolve a user by email using GSI1', async () => {
      const user = await userRepo.create({
        fullName: 'Jane GSI',
        email: 'jane@gsi.com',
        passwordHash: 'hash456',
        role: 'USER',
        planType: 'FREE',
        emailVerified: false,
        accountStatus: 'PENDING_VERIFICATION',
        verificationToken: 'v-token-777',
      });

      const found = await userRepo.findByEmail('jane@gsi.com');
      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);

      const foundToken = await userRepo.findByVerificationToken('v-token-777');
      expect(foundToken).not.toBeNull();
      expect(foundToken?.id).toBe(user.id);
    });

    it('should update and delete user records and cleanup token pointers', async () => {
      const user = await userRepo.create({
        fullName: 'Trash User',
        email: 'trash@user.com',
        passwordHash: 'hash789',
        role: 'USER',
        planType: 'FREE',
        emailVerified: true,
        accountStatus: 'ACTIVE',
        verificationToken: 'v-trash',
      });

      await userRepo.update(user.id, { fullName: 'Updated User', planType: 'ENTERPRISE' });
      const updated = await userRepo.findById(user.id);
      expect(updated?.fullName).toBe('Updated User');
      expect(updated?.planType).toBe('ENTERPRISE');

      const deleted = await userRepo.delete(user.id);
      expect(deleted).toBe(true);

      const found = await userRepo.findById(user.id);
      expect(found).toBeNull();
    });
  });

  describe('2. WorkspaceRepository CRUD & Query', () => {
    const workspaceRepo = DynamoDBWorkspaceRepository.getInstance();

    it('should create, find, update, and query workspaces of an owner using GSI2', async () => {
      const workspace = await workspaceRepo.create({
        name: 'Design Team Workspace',
        ownerId: mockUserId,
        metadata: { department: 'creative' },
      });

      expect(workspace.id).toBeDefined();

      const found = await workspaceRepo.findById(workspace.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Design Team Workspace');

      await workspaceRepo.update(workspace.id, { name: 'Sleek Design Space' });

      const ownerWorkspaces = await workspaceRepo.findByOwnerId(mockUserId);
      expect(ownerWorkspaces.length).toBe(1);
      expect(ownerWorkspaces[0].name).toBe('Sleek Design Space');

      await workspaceRepo.delete(workspace.id);
      const afterDelete = await workspaceRepo.findById(workspace.id);
      expect(afterDelete).toBeNull();
    });
  });

  describe('3. FileRepository CRUD, GSI3 & Filters pagination', () => {
    const fileRepo = DynamoDBFileRepository.getInstance();

    it('should create and retrieve files using direct lookup index GSI3', async () => {
      const file = await fileRepo.create({
        ownerId: mockUserId,
        fileName: 'budget.xlsx',
        originalName: 'original_budget.xlsx',
        fileType: 'xlsx',
        mimeType: 'application/vnd.ms-excel',
        fileSize: 450000,
        storagePath: 'vault/budget.xlsx',
        securityScore: 88,
        favorite: true,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });

      const found = await fileRepo.findById(file.id);
      expect(found).not.toBeNull();
      expect(found?.fileName).toBe('budget.xlsx');
    });

    it('should filter, sort, and paginate files in findAll', async () => {
      // Create budget.xlsx (favorite: true)
      await fileRepo.create({
        ownerId: mockUserId,
        fileName: 'budget.xlsx',
        originalName: 'original_budget.xlsx',
        fileType: 'xlsx',
        mimeType: 'application/vnd.ms-excel',
        fileSize: 450000,
        storagePath: 'vault/budget.xlsx',
        securityScore: 88,
        favorite: true,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });

      await fileRepo.create({
        ownerId: mockUserId,
        fileName: 'report-a.pdf',
        originalName: 'report-a.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileSize: 10000,
        storagePath: 'vault/report-a.pdf',
        securityScore: 92,
        favorite: false,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });

      await fileRepo.create({
        ownerId: mockUserId,
        fileName: 'report-b.pdf',
        originalName: 'report-b.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileSize: 20000,
        storagePath: 'vault/report-b.pdf',
        securityScore: 40,
        favorite: true,
        status: 'ACTIVE',
        shareStatus: 'SHARED',
      });

      // Filter by favorite = true
      const { files, total } = await fileRepo.findAll(
        mockUserId,
        { favorite: true },
        { page: 1, limit: 10 },
        { sortBy: 'fileSize', sortOrder: 'desc' }
      );

      // Note: budget.xlsx and report-b.pdf are favorited in mockup db
      expect(total).toBe(2);
      expect(files[0].fileName).toBe('budget.xlsx'); // 450k size vs 20k
    });

    it('should compute insights successfully', async () => {
      // Create a file to ensure insights have data
      await fileRepo.create({
        ownerId: mockUserId,
        fileName: 'budget.xlsx',
        originalName: 'original_budget.xlsx',
        fileType: 'xlsx',
        mimeType: 'application/vnd.ms-excel',
        fileSize: 450000,
        storagePath: 'vault/budget.xlsx',
        securityScore: 88,
        favorite: true,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });

      const insights = await fileRepo.findInsights(mockUserId);
      expect(insights.largestFiles.length).toBeGreaterThan(0);
      expect(insights.recentFiles.length).toBeGreaterThan(0);
    });
  });

  describe('4. ShareRepository Link Transactions & Tokens', () => {
    const shareRepo = DynamoDBShareRepository.getInstance();

    it('should create and retrieve share records by token (GSI1) and ID (GSI3)', async () => {
      const share = await shareRepo.create({
        fileId: 'file-xyz',
        ownerId: mockUserId,
        shareLink: 'https://fileflow.io/s/t123',
        shareToken: 'token-abc',
        accessLevel: 'VIEW',
        shareStatus: 'ACTIVE',
        passwordProtected: false,
      });

      const foundId = await shareRepo.findById(share.id);
      expect(foundId).not.toBeNull();
      expect(foundId?.shareToken).toBe('token-abc');

      const foundToken = await shareRepo.findByToken('token-abc');
      expect(foundToken).not.toBeNull();
      expect(foundToken?.id).toBe(share.id);
    });
  });

  describe('5. ActivityRepository feeds and sorting GSI4', () => {
    const activityRepo = DynamoDBActivityRepository.getInstance();

    it('should push activity items and retrieve global/recent logs sorted descending', async () => {
      const act1 = await activityRepo.create({
        userId: mockUserId,
        activityType: 'LOGIN',
        description: 'User logged in',
        severity: 'INFO',
      });

      // Wait 5ms to guarantee distinct timestamps for query sorting
      await new Promise(resolve => setTimeout(resolve, 5));

      const act2 = await activityRepo.create({
        userId: mockUserId,
        activityType: 'FILE_UPLOADED',
        description: 'Uploaded tax.pdf',
        severity: 'INFO',
      });

      const recent = await activityRepo.findRecent(mockUserId, 10);
      expect(recent.length).toBe(2);
      // Descending order assertion: act2 created after act1
      expect(recent[0].activityType).toBe('FILE_UPLOADED');

      const summary = await activityRepo.getSummary(mockUserId);
      expect(summary.totalActivities).toBe(2);
      expect(summary.uploads).toBe(1);
    });
  });

  describe('6. NotificationRepository Status and GSI5 Queries', () => {
    const notificationRepo = DynamoDBNotificationRepository.getInstance();

    it('should push and retrieve unread notifications using GSI5 index startsWith UNREAD', async () => {
      const notif1 = await notificationRepo.create({
        userId: mockUserId,
        notificationType: 'SECURITY_ALERT',
        title: 'Malware Detected',
        message: 'Virus detected in uploads',
        severity: 'CRITICAL',
      });

      // Wait 5ms to guarantee distinct timestamps for query sorting
      await new Promise(resolve => setTimeout(resolve, 5));

      const notif2 = await notificationRepo.create({
        userId: mockUserId,
        notificationType: 'SYSTEM_MESSAGE',
        title: 'Maintenance',
        message: 'Scheduled downtime tonight',
        severity: 'INFO',
      });

      const unread = await notificationRepo.findUnread(mockUserId);
      expect(unread.length).toBe(2);
      expect(unread[0].notificationType).toBe('SYSTEM_MESSAGE'); // newest first

      await notificationRepo.markAllAsRead(mockUserId);

      const unreadAfter = await notificationRepo.findUnread(mockUserId);
      expect(unreadAfter.length).toBe(0);
    });
  });

  describe('7. UploadRepository and SearchHistoryRepository stubs', () => {
    const uploadRepo = DynamoDBUploadRepository.getInstance();
    const searchRepo = DynamoDBSearchRepository.getInstance();

    it('should handle uploads CRUD and analytics checks', async () => {
      const upload = await uploadRepo.create({
        userId: mockUserId,
        uploadStatus: 'COMPLETED',
        fileName: 'profile.png',
        fileSize: 50000,
        mimeType: 'image/png',
        uploadProgress: 100,
        uploadMethod: 'STANDARD',
        startedAt: new Date(),
      });

      const found = await uploadRepo.findById(upload.id);
      expect(found?.fileName).toBe('profile.png');

      const analytics = await uploadRepo.getAnalytics(mockUserId);
      expect(analytics.totalUploads).toBe(1);
      expect(analytics.successRate).toBe(100);
    });

    it('should store and aggregate query search terms in SearchHistory', async () => {
      await searchRepo.recordSearch(mockUserId, 'taxes');
      await searchRepo.recordSearch(mockUserId, 'taxes '); // duplicates check
      await searchRepo.recordSearch(mockUserId, 'report');

      const popular = await searchRepo.getPopular(5);
      expect(popular[0].query).toBe('taxes');
      expect(popular[0].frequency).toBe(2);

      const recent = await searchRepo.getRecent(mockUserId, 5);
      expect(recent).toContain('taxes');
      expect(recent).toContain('report');
    });
  });

  describe('8. RepositoryRegistry Provider Switch Checking', () => {
    it('should resolve active repository depending on env provider state', () => {
      process.env.DB_TYPE = 'dynamodb';
      const ddbUserRepo = RepositoryRegistry.getUserRepository();
      expect(ddbUserRepo).toBeInstanceOf(DynamoDBUserRepository);

      process.env.DB_TYPE = 'memory';
      const memUserRepo = RepositoryRegistry.getUserRepository();
      expect(memUserRepo).not.toBeInstanceOf(DynamoDBUserRepository);
    });
  });
});
