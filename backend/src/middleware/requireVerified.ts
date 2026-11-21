import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/ownershipCheck.js';

export function requireVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || !req.user.emailVerified) {
    throw new AppError(
      'Please verify your email address to perform this action',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }
  next();
}
