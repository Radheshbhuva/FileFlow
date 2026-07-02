import { User, UserRepository } from '../interfaces/user.interface';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private static instance: InMemoryUserRepository;

  private constructor() {}

  public static getInstance(): InMemoryUserRepository {
    if (!InMemoryUserRepository.instance) {
      InMemoryUserRepository.instance = new InMemoryUserRepository();
    }
    return InMemoryUserRepository.instance;
  }

  public clear(): void {
    this.users = [];
  }

  public async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
    return user ? { ...user } : null;
  }

  public async findByVerificationToken(token: string): Promise<User | null> {
    const user = this.users.find((u) => u.verificationToken === token);
    return user ? { ...user } : null;
  }

  public async findByResetToken(token: string): Promise<User | null> {
    const user = this.users.find((u) => u.resetPasswordToken === token);
    return user ? { ...user } : null;
  }

  public async create(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'storageUsed' | 'storageLimit'>
  ): Promise<User> {
    const now = new Date();
    const newUser: User = {
      ...userData,
      id: uuidv4(),
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024, // Default 5 GB storage limit
      timezone: 'UTC',
      company: '',
      jobTitle: '',
      filesUploadedCount: 0,
      filesSharedCount: 0,
      favoritesCount: 0,
      recentActivityCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(newUser);
    return { ...newUser };
  }

  public async update(id: string, updates: Partial<User>): Promise<User> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser: User = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.users[userIndex] = updatedUser;
    return { ...updatedUser };
  }

  public async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return false;
    }
    this.users.splice(userIndex, 1);
    return true;
  }
}
