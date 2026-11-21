import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

class EmailService {
  private transporter: MailTransporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 465,
        secure: (env.SMTP_PORT || 465) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    const subject = 'Verify your Invoizmo account';
    const text = `Welcome to Invoizmo!\n\nPlease verify your email by clicking the link below (valid for 24 hours):\n${verifyUrl}\n\nIf you did not sign up for Invoizmo, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Welcome to Invoizmo</h2>
        <p>Please click the button below to verify your email address (link expires in 24 hours):</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </p>
        <p style="color: #64748B; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    `;

    if (!this.transporter) {
      console.log(`\n📧 [DEV EMAIL MOCK] Verification email to: ${to}`);
      console.log(`🔗 Verification Link: ${verifyUrl}\n`);
      return;
    }

    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    const subject = 'Reset your Invoizmo password';
    const text = `You requested a password reset for Invoizmo.\n\nClick the link below to set a new password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Invoizmo Password Reset</h2>
        <p>You requested to reset your password. Click the button below (link expires in 30 minutes):</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #64748B; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
    `;

    if (!this.transporter) {
      console.log(`\n📧 [DEV EMAIL MOCK] Password reset email to: ${to}`);
      console.log(`🔗 Password Reset Link: ${resetUrl}\n`);
      return;
    }

    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
  }
}

export const emailService = new EmailService();
