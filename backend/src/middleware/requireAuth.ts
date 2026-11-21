import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/ownershipCheck.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      _id: payload.userId,
      email: payload.email,
      name: payload.name,
      plan: payload.plan,
      emailVerified: payload.emailVerified,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid access token', 401, 'TOKEN_INVALID');
  }
}
