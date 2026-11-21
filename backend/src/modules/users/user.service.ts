import bcrypt from 'bcryptjs';
import { User, type IUser } from './user.model.js';
import { RefreshToken } from '../auth/refreshToken.model.js';
import { EmailToken } from '../auth/emailToken.model.js';
import { AppError } from '../../utils/ownershipCheck.js';
import mongoose from 'mongoose';

export class UserService {
  async getProfile(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  }

  async updateProfile(userId: string, data: any): Promise<Partial<IUser>> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new AppError('Current password is required to set a new password', 400, 'INVALID_REQUEST');
      }

      const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Incorrect current password', 400, 'INVALID_REQUEST');
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(data.newPassword, salt);
    }

    if (data.name) user.name = data.name;
    if (data.business) user.business = { ...user.business, ...data.business };
    if (data.defaults) user.defaults = { ...user.defaults, ...data.defaults };
    if (data.invoicePrefix !== undefined) user.invoicePrefix = data.invoicePrefix;
    if (data.startingNumber !== undefined) user.startingNumber = data.startingNumber;

    await user.save();

    const sanitized = user.toObject();
    delete (sanitized as any).passwordHash;
    return sanitized;
  }

  async deleteAccount(userId: string, confirmText: string): Promise<void> {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      throw new AppError(
        'Confirmation text mismatch. Type "DELETE MY ACCOUNT" to confirm deletion.',
        400,
        'CONFIRM_TEXT_MISMATCH'
      );
    }

    // Danger zone deletion: delete user, tokens, and invoices
    await User.findByIdAndDelete(userId);
    await RefreshToken.deleteMany({ userId });
    await EmailToken.deleteMany({ userId });

    // Clean up invoices and counters if collections exist
    if (mongoose.models['Invoice']) {
      await mongoose.models['Invoice'].deleteMany({ userId });
    }
    if (mongoose.models['Counter']) {
      await mongoose.models['Counter'].deleteMany({ userId });
    }
  }

  async exportData(userId: string): Promise<{ user: any; invoices: any[]; exportedAt: Date }> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    let invoices: any[] = [];
    if (mongoose.models['Invoice']) {
      invoices = await mongoose.models['Invoice'].find({ userId }).lean();
    }

    return {
      user,
      invoices,
      exportedAt: new Date(),
    };
  }
}

export const userService = new UserService();
