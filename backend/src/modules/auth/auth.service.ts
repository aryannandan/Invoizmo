import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../users/user.model.js';
import { RefreshToken } from './refreshToken.model.js';
import { EmailToken } from './emailToken.model.js';
import { AppError } from '../../utils/ownershipCheck.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { emailService } from '../../services/email.service.js';

function hashTokenSha256(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  /**
   * FR-AUTH-1: Signup with name, email, password.
   * Duplicate email returns generic 201 message to prevent account enumeration.
   */
  async signup(data: { name: string; email: string; password: string }): Promise<{ message: string }> {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      // Generic response - do not reveal that email is already registered
      return { message: 'Check your email to verify your account' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      emailVerified: false,
      plan: 'free',
    });

    // Generate 32-byte secure random verification token (24-hour expiry)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashTokenSha256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await EmailToken.create({
      userId: user._id,
      type: 'verify',
      tokenHash,
      expiresAt,
    });

    await emailService.sendVerificationEmail(user.email, rawToken);

    return { message: 'Check your email to verify your account' };
  }

  /**
   * FR-AUTH-2: Verify email token
   */
  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    const tokenHash = hashTokenSha256(rawToken);

    const emailToken = await EmailToken.findOne({
      tokenHash,
      type: 'verify',
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!emailToken) {
      throw new AppError('Invalid or expired verification link', 400, 'INVALID_REQUEST');
    }

    emailToken.usedAt = new Date();
    await emailToken.save();

    await User.findByIdAndUpdate(emailToken.userId, { emailVerified: true });

    return { message: 'Email verified successfully. You can now download and send invoices.' };
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });
    if (user && !user.emailVerified) {
      // Invalidate existing verify tokens
      await EmailToken.deleteMany({ userId: user._id, type: 'verify' });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashTokenSha256(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await EmailToken.create({
        userId: user._id,
        type: 'verify',
        tokenHash,
        expiresAt,
      });

      await emailService.sendVerificationEmail(user.email, rawToken);
    }

    return { message: 'If an unverified account exists, a new verification link has been sent.' };
  }

  /**
   * FR-AUTH-3 & FR-AUTH-6: Login with password & 15-minute lockout after 5 failed attempts
   */
  async login(
    data: { email: string; password: string },
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await User.findOne({ email: data.email });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account is locked due to too many failed attempts. Try again in ${waitMinutes} minute(s).`,
        423,
        'ACCOUNT_LOCKED'
      );
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);

    if (!isMatch) {
      user.failedLogins += 1;
      if (user.failedLogins >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
        await user.save();
        throw new AppError(
          'Account locked for 15 minutes due to too many failed login attempts.',
          423,
          'ACCOUNT_LOCKED'
        );
      }
      await user.save();
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Reset login failures on success
    if (user.failedLogins > 0 || user.lockedUntil) {
      user.failedLogins = 0;
      user.lockedUntil = undefined;
      await user.save();
    }

    // Generate tokens
    const authUser = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      plan: user.plan,
      emailVerified: user.emailVerified,
    };

    const accessToken = signAccessToken(authUser);
    const rawRefreshToken = signRefreshToken(authUser);

    // Hash refresh token before saving in DB
    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * FR-AUTH-7: Refresh token rotation and reuse detection (breach signal)
   */
  async refresh(
    rawRefreshToken: string,
    userAgent?: string
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    let payload: any;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'REFRESH_TOKEN_INVALID');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('User not found', 401, 'REFRESH_TOKEN_INVALID');
    }

    // Retrieve active and recently revoked tokens for this user
    const tokens = await RefreshToken.find({ userId: user._id });

    let matchedTokenRecord: any = null;
    for (const record of tokens) {
      const match = await bcrypt.compare(rawRefreshToken, record.tokenHash);
      if (match) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new AppError('Refresh token not found', 401, 'REFRESH_TOKEN_INVALID');
    }

    // If token was already revoked, this is a REUSE BREACH SIGNAL!
    if (matchedTokenRecord.revokedAt) {
      // Invalidate ALL sessions for this user immediately!
      await RefreshToken.deleteMany({ userId: user._id });
      throw new AppError(
        'Security breach detected: refresh token reused. All sessions have been revoked.',
        401,
        'REFRESH_TOKEN_INVALID'
      );
    }

    // Mark current token as revoked
    matchedTokenRecord.revokedAt = new Date();
    await matchedTokenRecord.save();

    // Rotate: Issue new access token and new refresh token
    const authUser = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      plan: user.plan,
      emailVerified: user.emailVerified,
    };

    const newAccessToken = signAccessToken(authUser);
    const newRawRefreshToken = signRefreshToken(authUser);

    const newHash = await bcrypt.hash(newRawRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newHash,
      expiresAt,
      userAgent,
    });

    return {
      accessToken: newAccessToken,
      newRefreshToken: newRawRefreshToken,
    };
  }

  /**
   * FR-AUTH-5: Logout
   */
  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;

    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      const tokens = await RefreshToken.find({ userId: payload.userId });

      for (const record of tokens) {
        const match = await bcrypt.compare(rawRefreshToken, record.tokenHash);
        if (match) {
          await RefreshToken.findByIdAndDelete(record._id);
          break;
        }
      }
    } catch {
      // Ignore token decode errors on logout
    }
  }

  /**
   * Log out from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
  }

  /**
   * FR-AUTH-4: Forgot password (generic response prevents email enumeration)
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });

    if (user) {
      await EmailToken.deleteMany({ userId: user._id, type: 'reset' });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashTokenSha256(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await EmailToken.create({
        userId: user._id,
        type: 'reset',
        tokenHash,
        expiresAt,
      });

      await emailService.sendPasswordResetEmail(user.email, rawToken);
    }

    return { message: 'If that email exists, we sent a password reset link' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = hashTokenSha256(rawToken);

    const emailToken = await EmailToken.findOne({
      tokenHash,
      type: 'reset',
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!emailToken) {
      throw new AppError('Invalid or expired password reset link', 400, 'INVALID_REQUEST');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(emailToken.userId, {
      passwordHash,
      failedLogins: 0,
      lockedUntil: undefined,
    });

    emailToken.usedAt = new Date();
    await emailToken.save();

    // Revoke all existing sessions for security
    await RefreshToken.deleteMany({ userId: emailToken.userId });

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }
}

export const authService = new AuthService();
