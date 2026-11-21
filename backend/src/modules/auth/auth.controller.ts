import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

const COOKIE_NAME = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = (req.body.token || req.query.token) as string;
    const result = await authService.verifyEmail(token);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.resendVerification(req.body.email);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(req.body, userAgent);

    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken = req.cookies[COOKIE_NAME];
    const userAgent = req.headers['user-agent'];
    const result = await authService.refresh(rawRefreshToken, userAgent);

    res.cookie(COOKIE_NAME, result.newRefreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken = req.cookies[COOKIE_NAME];
    await authService.logout(rawRefreshToken);
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await authService.logoutAll(req.user._id);
    }
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out of all devices successfully',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
