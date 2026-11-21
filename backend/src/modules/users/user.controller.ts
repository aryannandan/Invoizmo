import type { Request, Response, NextFunction } from 'express';
import { userService } from './user.service.js';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await userService.getProfile(req.user!._id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function patchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await userService.updateProfile(req.user!._id, req.body);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteAccount(req.user!._id, req.body.confirmText);
    res.clearCookie('refreshToken', { path: '/' });
    res.status(200).json({
      success: true,
      data: {
        message: 'Account deleted successfully',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await userService.exportData(req.user!._id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
