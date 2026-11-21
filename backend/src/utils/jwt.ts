import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser } from '../types/express.js';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  emailVerified: boolean;
}

export function signAccessToken(user: AuthUser): string {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    plan: user.plan,
    emailVerified: user.emailVerified,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(user: AuthUser): string {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    plan: user.plan,
    emailVerified: user.emailVerified,
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
