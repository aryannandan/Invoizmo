import { Types } from 'mongoose';
import { Invoice, type IInvoice } from './invoice.model.js';
import { Counter } from './counter.model.js';
import { User } from '../users/user.model.js';
import { AppError, assertOwnership } from '../../utils/ownershipCheck.js';
import { calculateTotals } from '../../utils/money.js';

export class InvoiceService {
  /**
   * Generates next invoice number atomically.
   */
  private async getNextInvoiceNumber(userId: string, prefix: string, startSeq: number): Promise<string> {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Try to increment existing counter
    let counter = await Counter.findOneAndUpdate(
      { userId: userObjectId, series: prefix },
      { $inc: { seq: 1 } },
      { new: true }
    );

    // 2. If no counter exists yet, atomically create with startSeq
    if (!counter) {
      try {
        counter = await Counter.create({
          userId: userObjectId,
          series: prefix,
          seq: Math.max(1, startSeq),
        });
      } catch {
        // Race condition: another concurrent call created it first
        counter = await Counter.findOneAndUpdate(
          { userId: userObjectId, series: prefix },
          { $inc: { seq: 1 } },
          { new: true }
        );
      }
    } else if (counter.seq < startSeq) {
      // If user bumped startingNumber in settings higher than current sequence
      counter = await Counter.findOneAndUpdate(
        { userId: userObjectId, series: prefix },
        { $set: { seq: startSeq } },
        { new: true }
      );
    }

    const seq = counter?.seq ?? Math.max(1, startSeq);
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /**
   * Creates a new draft invoice with prefilled settings and plan limit checks.
   */
  async createDraft(
    userId: string,
    data: { templateId?: string; currency?: string; duplicateFrom?: string }
  ): Promise<IInvoice> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    // Free plan checks: max 5 invoices per calendar month
    if (user.plan === 'free') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyCount = await Invoice.countDocuments({
        userId: user._id,
        createdAt: { $gte: startOfMonth },
      });

      if (monthlyCount >= 5) {
        throw new AppError(
          'Free plan limit of 5 new invoices per month reached. Upgrade to Pro for unlimited invoices.',
          403,
          'PLAN_LIMIT_REACHED'
        );
      }

      // Free plan allows only Classic and Modern templates
      const template = data.templateId || 'classic';
      if (!['classic', 'modern'].includes(template)) {
        throw new AppError(
          'The selected template is available exclusively on the Pro plan.',
          403,
          'PLAN_LIMIT_REACHED'
        );
      }
    }

    // Duplicate flow
    if (data.duplicateFrom) {
      const original = await assertOwnership(Invoice, data.duplicateFrom, userId);
      const duplicatedData = original.toObject();
      delete (duplicatedData as any)._id;
      delete (duplicatedData as any).createdAt;
      delete (duplicatedData as any).updatedAt;

      const newDraft = await Invoice.create({
        ...duplicatedData,
        userId: user._id,
        number: null,
        status: 'draft',
        sentAt: null,
        paidAt: null,
        archivedAt: null,
        deletedAt: null,
        purgeAt: null,
        templateId: data.templateId || original.templateId,
        currency: data.currency || original.currency,
      });

      return newDraft;
    }

    // Create fresh draft prefilled from user business and defaults
    const currency = data.currency || user.defaults?.currency || 'INR';
    const paymentDays = user.defaults?.paymentTermsDays || 15;
    const now = new Date();
    const dueDate = new Date(now.getTime() + paymentDays * 24 * 60 * 60 * 1000);

    const draft = await Invoice.create({
      userId: user._id,
      number: null,
      status: 'draft',
      templateId: data.templateId || 'classic',
      currency,
      seller: {
        businessName: user.business?.name || user.name,
        address: user.business?.address || '',
        taxId: user.business?.taxId || '',
        email: user.email,
        phone: user.business?.phone || '',
      },
      client: {
        name: '',
        company: '',
        email: '',
        address: '',
        taxId: '',
      },
      items: [
        {
          description: 'Consulting services',
          quantity: 1,
          unit: 'hrs',
          unitPriceMinor: 0,
          amountMinor: 0,
        },
      ],
      discount: { type: 'percent', value: 0 },
      taxName: 'GST',
      taxPercent: 0,
      subtotalMinor: 0,
      discountMinor: 0,
      taxableMinor: 0,
      taxMinor: 0,
      totalMinor: 0,
      issueDate: now,
      dueDate,
      notes: user.defaults?.notes || '',
      terms: user.defaults?.terms || '',
      logoUrl: user.logoUrl,
      signature: user.signatureUrl
        ? { type: 'drawn', value: user.signatureUrl, name: user.name }
        : undefined,
    });

    return draft;
  }

  /**
   * Retrieves paginated invoices with status tabs, search, and counts.
   */
  async listInvoices(
    userId: string,
    query: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const baseFilter: any = {
      userId: userObjectId,
      deletedAt: null, // Exclude trash
    };

    // Tab status filter
    const now = new Date();
    if (query.status === 'archived') {
      baseFilter.archivedAt = { $ne: null };
    } else {
      // In normal tabs, exclude archived
      baseFilter.archivedAt = null;

      if (query.status === 'draft') {
        baseFilter.status = 'draft';
      } else if (query.status === 'sent') {
        baseFilter.status = 'sent';
      } else if (query.status === 'paid') {
        baseFilter.status = 'paid';
      } else if (query.status === 'overdue') {
        baseFilter.status = 'sent';
        baseFilter.dueDate = { $lt: now };
      }
    }

    // Search filter
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const searchRegex = new RegExp(term, 'i');
      baseFilter.$or = [
        { number: searchRegex },
        { 'client.name': searchRegex },
        { 'client.company': searchRegex },
        { 'client.email': searchRegex },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [invoices, total] = await Promise.all([
      Invoice.find(baseFilter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(baseFilter),
    ]);

    // Attach dynamic isOverdue property
    const data = invoices.map((inv) => ({
      ...inv,
      isOverdue: inv.status === 'sent' && new Date(inv.dueDate) < now,
    }));

    // Status counts for UI tabs
    const counts = await this.getStatusCounts(userId);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts,
    };
  }

  /**
   * Counts for Dashboard tabs
   */
  async getStatusCounts(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();

    const [allCount, draftCount, sentCount, paidCount, overdueCount, archivedCount] = await Promise.all([
      Invoice.countDocuments({ userId: userObjectId, deletedAt: null, archivedAt: null }),
      Invoice.countDocuments({ userId: userObjectId, deletedAt: null, archivedAt: null, status: 'draft' }),
      Invoice.countDocuments({ userId: userObjectId, deletedAt: null, archivedAt: null, status: 'sent' }),
      Invoice.countDocuments({ userId: userObjectId, deletedAt: null, archivedAt: null, status: 'paid' }),
      Invoice.countDocuments({
        userId: userObjectId,
        deletedAt: null,
        archivedAt: null,
        status: 'sent',
        dueDate: { $lt: now },
      }),
      Invoice.countDocuments({ userId: userObjectId, deletedAt: null, archivedAt: { $ne: null } }),
    ]);

    return {
      all: allCount,
      draft: draftCount,
      sent: sentCount,
      paid: paidCount,
      overdue: overdueCount,
      archived: archivedCount,
    };
  }

  async getInvoiceById(userId: string, invoiceId: string): Promise<any> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);
    const obj = invoice.toObject();
    return {
      ...obj,
      isOverdue: obj.status === 'sent' && new Date(obj.dueDate) < new Date(),
    };
  }

  /**
   * Updates invoice content & styling.
   * Recomputes all totals on server; ignores client-supplied totals.
   */
  async updateInvoice(userId: string, invoiceId: string, updates: any): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (invoice.deletedAt) {
      throw new AppError('Cannot edit a trashed invoice. Restore it first.', 400, 'INVALID_REQUEST');
    }

    // If paid, only notes and terms can be edited
    if (invoice.status === 'paid') {
      const allowedKeys = ['notes', 'terms', 'paymentDetails'];
      const attemptKeys = Object.keys(updates);
      const illegalKeys = attemptKeys.filter((k) => !allowedKeys.includes(k));
      if (illegalKeys.length > 0) {
        throw new AppError(
          'Financial details of a paid invoice are locked. Mark as unpaid before editing.',
          400,
          'INVALID_STATE_TRANSITION'
        );
      }
    }

    // Apply allowed fields
    if (updates.templateId !== undefined) invoice.templateId = updates.templateId;
    if (updates.font !== undefined) invoice.font = updates.font;
    if (updates.colorScheme !== undefined) invoice.colorScheme = updates.colorScheme;
    if (updates.currency !== undefined) invoice.currency = updates.currency;
    if (updates.seller !== undefined) invoice.seller = { ...invoice.seller, ...updates.seller };
    if (updates.client !== undefined) invoice.client = { ...invoice.client, ...updates.client };
    if (updates.notes !== undefined) invoice.notes = updates.notes;
    if (updates.terms !== undefined) invoice.terms = updates.terms;
    if (updates.paymentDetails !== undefined) invoice.paymentDetails = updates.paymentDetails;
    if (updates.issueDate !== undefined) invoice.issueDate = new Date(updates.issueDate);
    if (updates.dueDate !== undefined) invoice.dueDate = new Date(updates.dueDate);
    if (updates.logoUrl !== undefined) invoice.logoUrl = updates.logoUrl;
    if (updates.signature !== undefined) invoice.signature = updates.signature;

    if (updates.items !== undefined) invoice.items = updates.items;
    if (updates.discount !== undefined) invoice.discount = updates.discount;
    if (updates.taxName !== undefined) invoice.taxName = updates.taxName;
    if (updates.taxPercent !== undefined) invoice.taxPercent = updates.taxPercent;

    // Recalculate totals on server
    const calculated = calculateTotals({
      items: invoice.items,
      discount: invoice.discount,
      taxPercent: invoice.taxPercent,
    });

    invoice.items = calculated.items as any;
    invoice.subtotalMinor = calculated.subtotalMinor;
    invoice.discountMinor = calculated.discountMinor;
    invoice.taxableMinor = calculated.taxableMinor;
    invoice.taxMinor = calculated.taxMinor;
    invoice.totalMinor = calculated.totalMinor;

    await invoice.save();
    return invoice;
  }

  /**
   * Marks invoice as Sent.
   * Atomically assigns the sequential number if not already assigned.
   */
  async markSent(userId: string, invoiceId: string): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (invoice.status === 'paid') {
      throw new AppError(
        'Invoice is already marked as paid. Mark as unpaid before setting to sent.',
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    // If invoice does not yet have a number, assign one atomically
    if (!invoice.number) {
      const user = await User.findById(userId);
      const prefix = user?.invoicePrefix || 'INV-';
      const startingNumber = user?.startingNumber || 1;
      invoice.number = await this.getNextInvoiceNumber(userId, prefix, startingNumber);
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();

    return invoice;
  }

  /**
   * Marks invoice as Paid. Allowed only from Sent.
   */
  async markPaid(userId: string, invoiceId: string): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (invoice.status !== 'sent') {
      throw new AppError(
        'Invoice must be marked as sent before marking as paid.',
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    return invoice;
  }

  /**
   * Marks invoice as Unpaid. Allowed from Paid -> Sent.
   */
  async markUnpaid(userId: string, invoiceId: string): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (invoice.status !== 'paid') {
      throw new AppError(
        'Only paid invoices can be marked as unpaid.',
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    invoice.status = 'sent';
    invoice.paidAt = null;
    await invoice.save();

    return invoice;
  }

  /**
   * Reverts Sent invoice back to Draft.
   */
  async markDraft(userId: string, invoiceId: string): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (invoice.status === 'paid') {
      throw new AppError(
        'Paid invoices cannot be reverted directly to draft. Mark as unpaid first.',
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    invoice.status = 'draft';
    await invoice.save();

    return invoice;
  }

  /**
   * Archive invoice (allowed on Sent or Paid).
   */
  async archive(userId: string, invoiceId: string): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (invoice.status === 'draft') {
      throw new AppError('Draft invoices cannot be archived.', 400, 'INVALID_REQUEST');
    }

    invoice.archivedAt = new Date();
    await invoice.save();

    return invoice;
  }

  /**
   * Unarchive invoice.
   */
  async unarchive(userId: string, invoiceId: string): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);
    invoice.archivedAt = null;
    await invoice.save();

    return invoice;
  }

  /**
   * Moves invoice to Trash (soft delete with 30-day purge TTL).
   */
  async moveToTrash(userId: string, invoiceId: string): Promise<{ purgeAt: Date }> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);
    const now = new Date();
    const purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    invoice.deletedAt = now;
    invoice.purgeAt = purgeAt;
    await invoice.save();

    return { purgeAt };
  }

  /**
   * Lists items in Trash with days remaining.
   */
  async listTrash(userId: string) {
    const items = await Invoice.find({
      userId: new Types.ObjectId(userId),
      deletedAt: { $ne: null },
    })
      .sort({ deletedAt: -1 })
      .lean();

    const now = Date.now();
    const enriched = items.map((item) => {
      const purgeTime = item.purgeAt ? new Date(item.purgeAt).getTime() : now;
      const daysRemaining = Math.max(0, Math.ceil((purgeTime - now) / (1000 * 60 * 60 * 24)));
      return {
        ...item,
        daysRemaining,
      };
    });

    return enriched;
  }

  /**
   * Restores an invoice from Trash.
   */
  async restoreFromTrash(userId: string, invoiceId: string): Promise<IInvoice> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (!invoice.deletedAt) {
      throw new AppError('Invoice is not in trash.', 400, 'INVALID_REQUEST');
    }

    invoice.deletedAt = null;
    invoice.purgeAt = null;
    await invoice.save();

    return invoice;
  }

  /**
   * Permanently deletes an invoice forever.
   */
  async deleteForever(userId: string, invoiceId: string): Promise<void> {
    const invoice = await assertOwnership(Invoice, invoiceId, userId);
    await Invoice.findByIdAndDelete(invoice._id);
  }
}

export const invoiceService = new InvoiceService();
