import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface ILineItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPriceMinor: number;
  amountMinor: number;
}

export interface IInvoice extends Document {
  userId: Types.ObjectId;
  number: string | null;
  status: 'draft' | 'sent' | 'paid';
  archivedAt: Date | null;
  templateId: string;
  font: string;
  colorScheme: string;
  currency: string;
  seller: {
    businessName?: string;
    address?: string;
    taxId?: string;
    email?: string;
    phone?: string;
  };
  client: {
    name?: string;
    company?: string;
    email?: string;
    address?: string;
    taxId?: string;
  };
  items: ILineItem[];
  discount: {
    type: 'percent' | 'fixed';
    value: number;
  };
  taxName: string;
  taxPercent: number;
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
  issueDate: Date;
  dueDate: Date;
  sentAt: Date | null;
  paidAt: Date | null;
  notes?: string;
  terms?: string;
  paymentDetails?: string;
  logoUrl?: string;
  signature?: {
    type: 'typed' | 'drawn';
    value: string;
    name?: string;
  };
  deletedAt: Date | null;
  purgeAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, required: true, default: '' },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'hrs' },
    unitPriceMinor: { type: Number, required: true, default: 0 },
    amountMinor: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: String, default: null },
    status: { type: String, enum: ['draft', 'sent', 'paid'], default: 'draft', required: true },
    archivedAt: { type: Date, default: null },
    templateId: { type: String, default: 'classic' },
    font: { type: String, default: 'Inter' },
    colorScheme: { type: String, default: 'indigo' },
    currency: { type: String, default: 'INR' },
    seller: {
      businessName: { type: String, default: '' },
      address: { type: String, default: '' },
      taxId: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    client: {
      name: { type: String, default: '' },
      company: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      taxId: { type: String, default: '' },
    },
    items: { type: [lineItemSchema], default: [] },
    discount: {
      type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
      value: { type: Number, default: 0 },
    },
    taxName: { type: String, default: 'GST' },
    taxPercent: { type: Number, default: 0 },
    subtotalMinor: { type: Number, default: 0 },
    discountMinor: { type: Number, default: 0 },
    taxableMinor: { type: Number, default: 0 },
    taxMinor: { type: Number, default: 0 },
    totalMinor: { type: Number, default: 0 },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
    sentAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    terms: { type: String, default: '' },
    paymentDetails: { type: String, default: '' },
    logoUrl: { type: String },
    signature: {
      type: { type: String, enum: ['typed', 'drawn'] },
      value: { type: String },
      name: { type: String },
    },
    deletedAt: { type: Date, default: null },
    purgeAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Unique partial index on (userId, number) for non-null numbers
invoiceSchema.index(
  { userId: 1, number: 1 },
  { unique: true, partialFilterExpression: { number: { $type: 'string' } } }
);

// Compound index for querying user dashboard
invoiceSchema.index({ userId: 1, status: 1, archivedAt: 1, deletedAt: 1, createdAt: -1 });

// TTL index for automatic 30-day purge from Trash
invoiceSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
