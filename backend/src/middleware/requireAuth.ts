import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/ownershipCheck.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.trim()) {
    throw new AppError('Authentication required. Missing Authorization header.', 401, 'UNAUTHORIZED');
  }

  // Handle "Bearer <token>" and forgive duplicate "Bearer Bearer <token>"
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();
  while (token.toLowerCase().startsWith('bearer ')) {
    token = token.replace(/^Bearer\s+/i, '').trim();
  }

  if (!token) {
    throw new AppError('Authentication required. Token is empty.', 401, 'UNAUTHORIZED');
  }

  // Friendly error if Postman environment variable was not resolved
  if (token === '{{accessToken}}' || token.startsWith('{{')) {
    throw new AppError(
      "Postman variable '{{accessToken}}' is unresolved. Please select 'Invoizmo Local Environment' in the top-right dropdown of Postman and run POST /auth/login first.",
      401,
      'UNAUTHORIZED'
    );
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
      throw new AppError('Access token expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid access token. Please log in again to get a fresh token.', 401, 'TOKEN_INVALID');
  }
}
