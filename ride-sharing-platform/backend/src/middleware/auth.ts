import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';
import { ErrorCodes } from '@rideshare/shared';
import type { User, UserRole } from '@rideshare/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Authentication middleware
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(
        'No authentication token provided',
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    } as User;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token has expired', 401, ErrorCodes.TOKEN_EXPIRED));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, ErrorCodes.INVALID_TOKEN));
    } else {
      next(error);
    }
  }
}

// Optional authentication (doesn't fail if no token)
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      } as User;
    }

    next();
  } catch {
    // Continue without authentication
    next();
  }
}

// Role-based authorization middleware
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401, ErrorCodes.UNAUTHORIZED));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          'You do not have permission to access this resource',
          403,
          ErrorCodes.FORBIDDEN
        )
      );
      return;
    }

    next();
  };
}

// Generate JWT token
export function generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// Verify token without middleware
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    return null;
  }
}
