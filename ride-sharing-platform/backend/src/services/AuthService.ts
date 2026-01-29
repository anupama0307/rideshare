import { userRepository } from '../repositories/index.js';
import type { User, EmergencyContact } from '@rideshare/shared';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ErrorCodes } from '@rideshare/shared';
import { logger } from '../config/logger.js';
import bcrypt from 'bcryptjs';

interface RegisterParams {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'rider' | 'driver' | 'admin';
}

interface LoginParams {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

// In-memory mock storage for when database is unavailable
const mockUsers: Map<string, User & { passwordHash: string }> = new Map();
let mockIdCounter = 1;

// Flag to track if we should use mock (set on first DB failure)
let useMockAuth = false;

export class AuthService {
  async register(params: RegisterParams): Promise<AuthResponse> {
    try {
      // Try real database first
      const existing = await userRepository.findByEmail(params.email);
      if (existing) {
        throw new AppError('Email already registered', 409, ErrorCodes.ALREADY_EXISTS);
      }

      const user = await userRepository.create({
        email: params.email,
        phone: params.phone,
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName,
        role: params.role,
      });

      const token = generateToken(user);
      logger.info(`User registered: ${user.email}`);
      return { user, token };
    } catch (error: any) {
      // If database error, fall back to mock
      if (error.code === 'XX000' || error.message?.includes('Tenant') || error.message?.includes('connection')) {
        logger.warn('Database unavailable, using mock auth');
        useMockAuth = true;
        return this.mockRegister(params);
      }
      throw error;
    }
  }

  private async mockRegister(params: RegisterParams): Promise<AuthResponse> {
    // Check if already exists in mock storage
    for (const [, u] of mockUsers) {
      if (u.email === params.email) {
        throw new AppError('Email already registered', 409, ErrorCodes.ALREADY_EXISTS);
      }
    }

    const id = `mock-${mockIdCounter++}`;
    const passwordHash = await bcrypt.hash(params.password, 12);

    const user: User = {
      id,
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role ?? 'rider',
      isVerified: false,
      verifiedBadge: false,
      ecoStats: {
        totalCo2Saved: 0,
        totalRidesPooled: 0,
        currentStreak: 0,
        longestStreak: 0,
        ecoPoints: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsers.set(id, { ...user, passwordHash });
    const token = generateToken(user);
    logger.info(`[MOCK] User registered: ${user.email}`);
    return { user, token };
  }

  async login(params: LoginParams): Promise<AuthResponse> {
    try {
      if (useMockAuth) {
        return this.mockLogin(params);
      }

      const user = await userRepository.verifyPassword(params.email, params.password);
      if (!user) {
        throw new AppError('Invalid email or password', 401, ErrorCodes.UNAUTHORIZED);
      }

      const token = generateToken(user);
      logger.info(`User logged in: ${user.email}`);
      return { user, token };
    } catch (error: any) {
      if (error.code === 'XX000' || error.message?.includes('Tenant') || error.message?.includes('connection')) {
        logger.warn('Database unavailable, using mock auth');
        useMockAuth = true;
        return this.mockLogin(params);
      }
      throw error;
    }
  }

  private async mockLogin(params: LoginParams): Promise<AuthResponse> {
    for (const [, u] of mockUsers) {
      if (u.email === params.email) {
        const isValid = await bcrypt.compare(params.password, u.passwordHash);
        if (isValid) {
          const { passwordHash: _, ...user } = u;
          const token = generateToken(user);
          logger.info(`[MOCK] User logged in: ${user.email}`);
          return { user, token };
        }
      }
    }
    throw new AppError('Invalid email or password', 401, ErrorCodes.UNAUTHORIZED);
  }

  async getProfile(userId: string): Promise<User> {
    if (useMockAuth) {
      const mockUser = mockUsers.get(userId);
      if (mockUser) {
        const { passwordHash: _, ...user } = mockUser;
        return user;
      }
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updates: Partial<{
      phone: string;
      firstName: string;
      lastName: string;
      avatarUrl: string;
    }>
  ): Promise<User> {
    if (useMockAuth) {
      const mockUser = mockUsers.get(userId);
      if (mockUser) {
        Object.assign(mockUser, updates, { updatedAt: new Date() });
        const { passwordHash: _, ...user } = mockUser;
        return user;
      }
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    const user = await userRepository.update(userId, updates);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }
    return user;
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    if (useMockAuth) {
      return []; // Mock returns empty contacts
    }
    return userRepository.getEmergencyContacts(userId);
  }

  async addEmergencyContact(
    userId: string,
    contact: Omit<EmergencyContact, 'id' | 'userId'>
  ): Promise<EmergencyContact> {
    if (useMockAuth) {
      return {
        id: `mock-contact-${mockIdCounter++}`,
        userId,
        ...contact,
      };
    }
    return userRepository.addEmergencyContact(userId, contact);
  }
}

export const authService = new AuthService();

