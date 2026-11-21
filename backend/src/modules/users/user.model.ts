import mongoose, { Schema, type Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  plan: 'free' | 'pro';
  business: {
    name?: string;
    address?: string;
    taxId?: string;
    phone?: string;
    website?: string;
  };
  logoUrl?: string;
  signatureUrl?: string;
  defaults: {
    currency: string;
    paymentTermsDays: number;
    notes?: string;
    terms?: string;
  };
  invoicePrefix: string;
  startingNumber: number;
  failedLogins: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    business: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      taxId: { type: String, default: '' },
      phone: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    logoUrl: { type: String },
    signatureUrl: { type: String },
    defaults: {
      currency: { type: String, default: 'INR' },
      paymentTermsDays: { type: Number, default: 15 },
      notes: { type: String, default: '' },
      terms: { type: String, default: '' },
    },
    invoicePrefix: { type: String, default: 'INV-' },
    startingNumber: { type: Number, default: 1 },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
