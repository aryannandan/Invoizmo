import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface IEmailToken extends Document {
  userId: Types.ObjectId;
  type: 'verify' | 'reset';
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const emailTokenSchema = new Schema<IEmailToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['verify', 'reset'], required: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    usedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const EmailToken = mongoose.model<IEmailToken>('EmailToken', emailTokenSchema);
