export type UserPlan = 'free' | 'pro';

export interface UserBusiness {
  name?: string;
  address?: string;
  taxId?: string;
  phone?: string;
  website?: string;
}

export interface UserDefaults {
  currency: string;
  paymentTermsDays: number;
  notes?: string;
  terms?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  plan: UserPlan;
  business?: UserBusiness;
  defaults?: UserDefaults;
  invoicePrefix?: string;
  startingNumber?: number;
  createdAt?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPriceMinor: number;
  amountMinor: number;
}

export interface Discount {
  type: 'percent' | 'fixed';
  value: number;
}

export interface Signature {
  type: 'typed' | 'drawn';
  value: string;
  name?: string;
}

export interface Invoice {
  _id: string;
  userId: string;
  number: string | null;
  status: 'draft' | 'sent' | 'paid';
  archivedAt: string | null;
  templateId: 'classic' | 'modern' | 'minimal' | 'bold';
  font: string;
  colorScheme: 'indigo' | 'emerald' | 'sky' | 'amber' | 'slate';
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
  items: LineItem[];
  discount: Discount;
  taxName: string;
  taxPercent: number;
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
  issueDate: string;
  dueDate: string;
  sentAt?: string | null;
  paidAt?: string | null;
  notes?: string;
  terms?: string;
  paymentDetails?: string;
  logoUrl?: string;
  signature?: Signature;
  deletedAt?: string | null;
  purgeAt?: string | null;
  isOverdue?: boolean;
  daysRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCounts {
  all: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  archived: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro';
  thumbnailUrl: string;
}
