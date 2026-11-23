import React from 'react';
import { formatMoney, formatDate } from '../../lib/utils';
import type { Invoice } from '../../types';

interface LiveInvoicePreviewProps {
  invoice: Partial<Invoice>;
  isFreePlan?: boolean;
}

export const LiveInvoicePreview: React.FC<LiveInvoicePreviewProps> = ({
  invoice,
  isFreePlan = false,
}) => {
  const currency = invoice.currency || 'INR';
  const isDraft = invoice.status === 'draft';

  // Palette accent styles
  const palettes = {
    indigo: { primary: '#4F46E5', tint: '#EEF2FF', border: '#C7D2FE' },
    emerald: { primary: '#10B981', tint: '#ECFDF5', border: '#A7F3D0' },
    sky: { primary: '#0EA5E9', tint: '#F0F9FF', border: '#BAE6FD' },
    amber: { primary: '#F59E0B', tint: '#FFFBEB', border: '#FDE68A' },
    slate: { primary: '#334155', tint: '#F8FAFC', border: '#E2E8F0' },
  };

  const scheme = palettes[invoice.colorScheme || 'indigo'] || palettes.indigo;
  const font = invoice.font || 'Inter';

  return (
    <div
      style={{ fontFamily: font }}
      className="relative w-full max-w-2xl mx-auto bg-white rounded-xl shadow-elevated border border-slate-200/90 p-8 sm:p-12 text-slate-800 transition-all text-xs sm:text-sm select-none"
    >
      {/* Watermark for Draft on Free Plan */}
      {isDraft && isFreePlan && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
          <span className="text-7xl sm:text-9xl font-black text-rose-500/10 uppercase transform -rotate-35 tracking-widest select-none">
            DRAFT
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-100">
        <div>
          <div
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: scheme.primary }}
          >
            INVOICE
          </div>
          <div className="font-mono text-slate-500 text-xs">
            #{invoice.number || 'DRAFT (Pending)'}
          </div>
          <div className="mt-3 text-xs text-slate-500 space-y-0.5">
            <div>
              <span className="font-medium text-slate-700">Issued:</span>{' '}
              {formatDate(invoice.issueDate)}
            </div>
            <div>
              <span className="font-medium text-slate-700">Due:</span>{' '}
              {formatDate(invoice.dueDate)}
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="text-right sm:max-w-[240px]">
          <div className="font-semibold text-slate-900 text-base">
            {invoice.seller?.businessName || 'Your Business Name'}
          </div>
          {invoice.seller?.address && (
            <div className="text-slate-500 text-xs mt-1 whitespace-pre-line leading-relaxed">
              {invoice.seller.address}
            </div>
          )}
          {invoice.seller?.taxId && (
            <div className="text-slate-500 text-xs mt-1 font-mono">
              Tax ID: {invoice.seller.taxId}
            </div>
          )}
        </div>
      </div>

      {/* Bill To */}
      <div className="py-6 border-b border-slate-100">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Billed To
        </div>
        <div className="font-semibold text-slate-900">
          {invoice.client?.name || invoice.client?.company || 'Client Name / Company'}
        </div>
        {invoice.client?.email && (
          <div className="text-slate-500 text-xs mt-0.5">{invoice.client.email}</div>
        )}
        {invoice.client?.address && (
          <div className="text-slate-500 text-xs mt-0.5 whitespace-pre-line">
            {invoice.client.address}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="py-6 border-b border-slate-100">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-medium">
              <th className="pb-2.5">Item Description</th>
              <th className="pb-2.5 text-center w-16">Qty</th>
              <th className="pb-2.5 text-right w-24">Price</th>
              <th className="pb-2.5 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(invoice.items || []).map((item, i) => (
              <tr key={i}>
                <td className="py-3 font-medium text-slate-800">
                  {item.description || 'Consulting Services'}
                </td>
                <td className="py-3 text-center text-slate-500 tabular-nums">
                  {item.quantity} {item.unit || ''}
                </td>
                <td className="py-3 text-right text-slate-500 tabular-nums">
                  {formatMoney(item.unitPriceMinor, currency)}
                </td>
                <td className="py-3 text-right font-medium text-slate-900 tabular-nums">
                  {formatMoney(item.amountMinor, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="pt-6 flex justify-end">
        <div className="w-64 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="font-mono text-slate-800">
              {formatMoney(invoice.subtotalMinor || 0, currency)}
            </span>
          </div>

          {(invoice.discountMinor || 0) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>
                Discount ({invoice.discount?.value}
                {invoice.discount?.type === 'percent' ? '%' : ''}):
              </span>
              <span className="font-mono">
                -{formatMoney(invoice.discountMinor || 0, currency)}
              </span>
            </div>
          )}

          {(invoice.taxMinor || 0) > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>
                {invoice.taxName || 'Tax'} ({invoice.taxPercent}%):
              </span>
              <span className="font-mono text-slate-800">
                +{formatMoney(invoice.taxMinor || 0, currency)}
              </span>
            </div>
          )}

          <div
            className="flex justify-between items-center pt-2 border-t text-sm font-bold text-slate-900"
            style={{ borderColor: scheme.border }}
          >
            <span>Total Due:</span>
            <span
              className="font-mono text-base tracking-tight"
              style={{ color: scheme.primary }}
            >
              {formatMoney(invoice.totalMinor || 0, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms || invoice.paymentDetails) && (
        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-3">
          {invoice.notes && (
            <div>
              <span className="font-semibold text-slate-700">Notes:</span> {invoice.notes}
            </div>
          )}
          {invoice.paymentDetails && (
            <div>
              <span className="font-semibold text-slate-700">Payment:</span> {invoice.paymentDetails}
            </div>
          )}
          {invoice.terms && (
            <div>
              <span className="font-semibold text-slate-700">Terms:</span> {invoice.terms}
            </div>
          )}
        </div>
      )}

      {/* Footer Branding for Free Plan */}
      {isFreePlan && (
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          Created with Invoizmo — Minimal, High-Craft Invoice Generator
        </div>
      )}
    </div>
  );
};
