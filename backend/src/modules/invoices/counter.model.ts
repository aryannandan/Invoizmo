import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface ICounter extends Document {
  userId: Types.ObjectId;
  series: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    series: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

counterSchema.index({ userId: 1, series: 1 }, { unique: true });

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);
