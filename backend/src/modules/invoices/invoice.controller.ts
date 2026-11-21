import type { Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service.js';
import { renderInvoiceHtml } from '../../services/pdf/renderTemplate.js';
import { pdfService } from '../../services/pdf/pdf.service.js';

export async function downloadInvoicePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoiceId = req.params.id as string;
    const size = (req.query.size as 'A4' | 'Letter') || 'A4';
    const invoice = await invoiceService.getInvoiceById(req.user!._id, invoiceId);

    const isDraft = invoice.status === 'draft';
    const isFreePlan = req.user!.plan === 'free';

    const html = renderInvoiceHtml({
      invoice,
      isDraft,
      isFreePlan,
      size,
    });

    const pdfBuffer = await pdfService.generatePdf(html, { format: size });

    const clientName = (invoice.client?.name || invoice.client?.company || 'Client')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = isDraft
      ? `Draft-${clientName}.pdf`
      : `Invoice-${invoice.number || 'INV'}-${clientName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.createDraft(req.user!._id, req.body);
    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await invoiceService.listInvoices(req.user!._id, req.query as any);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.getInvoiceById(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await invoiceService.updateInvoice(req.user!._id, req.params.id as string, req.body);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function markSent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sent = await invoiceService.markSent(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        invoice: {
          id: sent._id,
          status: sent.status,
          number: sent.number,
          sentAt: sent.sentAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const paid = await invoiceService.markPaid(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        invoice: {
          id: paid._id,
          status: paid.status,
          paidAt: paid.paidAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markUnpaid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const unpaid = await invoiceService.markUnpaid(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        invoice: {
          id: unpaid._id,
          status: unpaid.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const draft = await invoiceService.markDraft(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        invoice: {
          id: draft._id,
          status: draft.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const archived = await invoiceService.archive(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: archived,
    });
  } catch (error) {
    next(error);
  }
}

export async function unarchiveInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const unarchived = await invoiceService.unarchive(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: unarchived,
    });
  } catch (error) {
    next(error);
  }
}

export async function duplicateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const draft = await invoiceService.createDraft(req.user!._id, {
      duplicateFrom: req.params.id as string,
    });
    res.status(201).json({
      success: true,
      data: draft,
    });
  } catch (error) {
    next(error);
  }
}

export async function moveToTrash(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await invoiceService.moveToTrash(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function listTrash(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await invoiceService.listTrash(req.user!._id);
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreTrash(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const restored = await invoiceService.restoreFromTrash(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: restored,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteForever(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await invoiceService.deleteForever(req.user!._id, req.params.id as string);
    res.status(200).json({
      success: true,
      data: {
        message: 'Invoice permanently deleted',
      },
    });
  } catch (error) {
    next(error);
  }
}
