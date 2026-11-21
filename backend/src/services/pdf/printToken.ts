import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/ownershipCheck.js';

interface PrintTokenPayload {
  invoiceId: string;
  userId: string;
}

export function signPrintToken(invoiceId: string, userId: string): string {
  return jwt.sign({ invoiceId, userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: '5m', // Short-lived 5-minute single-use print token
  });
}

export function verifyPrintToken(token: string): PrintTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as PrintTokenPayload;
  } catch {
    throw new AppError('Invalid or expired print token', 401, 'TOKEN_INVALID');
  }
}
