import type { IInvoice } from '../../modules/invoices/invoice.model.js';
import { getCurrencyExponent } from '../../utils/money.js';

export interface RenderOptions {
  invoice: IInvoice;
  isDraft: boolean;
  isFreePlan: boolean;
  size?: 'A4' | 'Letter';
}

function formatMoney(amountMinor: number, currencyCode: string): string {
  const exponent = getCurrencyExponent(currencyCode);
  const factor = Math.pow(10, exponent);
  const major = amountMinor / factor;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(major);
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function renderInvoiceHtml(options: RenderOptions): string {
  const { invoice, isDraft, isFreePlan } = options;
  const currency = invoice.currency || 'INR';

  // Palette mappings
  const colorSchemes: Record<string, { primary: string; primaryTint: string; text: string }> = {
    indigo: { primary: '#4F46E5', primaryTint: '#EEF2FF', text: '#0F172A' },
    emerald: { primary: '#10B981', primaryTint: '#ECFDF5', text: '#064E3B' },
    sky: { primary: '#0EA5E9', primaryTint: '#F0F9FF', text: '#0C4A6E' },
    amber: { primary: '#F59E0B', primaryTint: '#FFFBEB', text: '#78350F' },
    slate: { primary: '#334155', primaryTint: '#F8FAFC', text: '#0F172A' },
  };

  const scheme = colorSchemes[invoice.colorScheme || 'indigo'] || colorSchemes['indigo']!;
  const font = invoice.font || 'Inter';
  const template = invoice.templateId || 'classic';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <title>Invoice ${invoice.number || 'Draft'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime&family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@600;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      margin: 15mm 15mm 20mm 15mm;
      size: ${options.size || 'A4'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: '${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Watermark for Free Plan Drafts */
    ${
      isDraft && isFreePlan
        ? `
    .draft-watermark {
      position: fixed;
      top: 40%;
      left: 10%;
      right: 10%;
      text-align: center;
      font-size: 110px;
      font-weight: 900;
      color: rgba(239, 68, 68, 0.15);
      transform: rotate(-35deg);
      pointer-events: none;
      z-index: 1000;
      letter-spacing: 12px;
      text-transform: uppercase;
    }
    `
        : ''
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: ${template === 'minimal' ? '1px solid #E2E8F0' : '2px solid ' + scheme.primary};
    }
    .brand-title {
      font-size: 28px;
      font-weight: 700;
      color: ${scheme.primary};
      letter-spacing: -0.5px;
    }
    .logo-img {
      max-height: 60px;
      max-width: 180px;
      object-fit: contain;
      margin-bottom: 8px;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0F172A;
    }
    .invoice-meta {
      margin-top: 6px;
      font-size: 13px;
      color: #64748B;
    }

    /* Addresses Grid */
    .address-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
      gap: 32px;
    }
    .address-col {
      flex: 1;
    }
    .address-heading {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748B;
      margin-bottom: 6px;
    }
    .address-name {
      font-size: 15px;
      font-weight: 600;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .address-details {
      font-size: 13px;
      color: #475569;
      white-space: pre-line;
    }

    /* Items Table */
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    table.items-table th {
      background: ${template === 'bold' ? scheme.primary : scheme.primaryTint};
      color: ${template === 'bold' ? '#FFFFFF' : scheme.text};
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }
    table.items-table th.text-right {
      text-align: right;
    }
    table.items-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 13px;
    }
    table.items-table td.text-right {
      text-align: right;
    }
    .item-desc {
      font-weight: 500;
      color: #0F172A;
    }

    /* Summary & Totals */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .totals-box {
      width: 280px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .total-row.grand-total {
      border-top: 2px solid ${scheme.primary};
      margin-top: 8px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 700;
      color: #0F172A;
    }

    /* Notes & Terms */
    .notes-terms {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      gap: 32px;
    }
    .notes-col {
      flex: 1;
      font-size: 12px;
      color: #64748B;
    }
    .notes-col h4 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 4px;
    }

    /* Signature */
    .signature-box {
      margin-top: 28px;
      text-align: right;
    }
    .sig-line {
      display: inline-block;
      text-align: center;
      min-width: 160px;
      border-top: 1px solid #94A3B8;
      padding-top: 6px;
      font-size: 12px;
      color: #475569;
    }
    .sig-typed {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 20px;
      color: #1E293B;
      margin-bottom: 4px;
    }
    .sig-img {
      max-height: 48px;
      margin-bottom: 4px;
    }

    /* Free Tier Footer */
    .footer-badge {
      position: fixed;
      bottom: 5mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  ${isDraft && isFreePlan ? '<div class="draft-watermark">DRAFT</div>' : ''}

  <div class="container">
    <div class="header">
      <div>
        ${invoice.logoUrl ? `<img src="${invoice.logoUrl}" class="logo-img" alt="Logo" />` : ''}
        <div class="brand-title">${invoice.seller?.businessName || 'INVOICE'}</div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-title">${invoice.number ? 'INVOICE' : 'DRAFT INVOICE'}</div>
        <div class="invoice-meta"><strong>No:</strong> ${invoice.number || 'Unassigned'}</div>
        <div class="invoice-meta"><strong>Date:</strong> ${formatDate(invoice.issueDate)}</div>
        <div class="invoice-meta"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
      </div>
    </div>

    <div class="address-grid">
      <div class="address-col">
        <div class="address-heading">From (Seller)</div>
        <div class="address-name">${invoice.seller?.businessName || ''}</div>
        <div class="address-details">${invoice.seller?.address || ''}
${invoice.seller?.email ? `Email: ${invoice.seller.email}` : ''}
${invoice.seller?.taxId ? `Tax ID: ${invoice.seller.taxId}` : ''}</div>
      </div>
      <div class="address-col">
        <div class="address-heading">Billed To (Client)</div>
        <div class="address-name">${invoice.client?.name || 'Client'}</div>
        <div class="address-details">${invoice.client?.company ? `${invoice.client.company}\n` : ''}${invoice.client?.address || ''}
${invoice.client?.email ? `Email: ${invoice.client.email}` : ''}
${invoice.client?.taxId ? `Tax ID: ${invoice.client.taxId}` : ''}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item) => `
          <tr>
            <td><div class="item-desc">${item.description || 'Item'}</div></td>
            <td class="text-right">${item.quantity} ${item.unit || ''}</td>
            <td class="text-right">${formatMoney(item.unitPriceMinor, currency)}</td>
            <td class="text-right">${formatMoney(item.amountMinor, currency)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatMoney(invoice.subtotalMinor, currency)}</span>
        </div>
        ${
          invoice.discountMinor > 0
            ? `
        <div class="total-row">
          <span>Discount ${invoice.discount?.type === 'percent' ? `(${invoice.discount.value}%)` : ''}</span>
          <span>-${formatMoney(invoice.discountMinor, currency)}</span>
        </div>`
            : ''
        }
        ${
          invoice.taxMinor > 0
            ? `
        <div class="total-row">
          <span>${invoice.taxName || 'Tax'} (${invoice.taxPercent}%)</span>
          <span>+${formatMoney(invoice.taxMinor, currency)}</span>
        </div>`
            : ''
        }
        <div class="total-row grand-total">
          <span>Total</span>
          <span>${formatMoney(invoice.totalMinor, currency)}</span>
        </div>
      </div>
    </div>

    ${
      invoice.notes || invoice.terms || invoice.paymentDetails
        ? `
    <div class="notes-terms">
      ${
        invoice.notes
          ? `
      <div class="notes-col">
        <h4>Notes</h4>
        <p>${invoice.notes}</p>
      </div>`
          : ''
      }
      ${
        invoice.terms
          ? `
      <div class="notes-col">
        <h4>Terms & Conditions</h4>
        <p>${invoice.terms}</p>
      </div>`
          : ''
      }
      ${
        invoice.paymentDetails
          ? `
      <div class="notes-col">
        <h4>Payment Information</h4>
        <p>${invoice.paymentDetails}</p>
      </div>`
          : ''
      }
    </div>`
        : ''
    }

    ${
      invoice.signature
        ? `
    <div class="signature-box">
      ${
        invoice.signature.type === 'drawn'
          ? `<img src="${invoice.signature.value}" class="sig-img" alt="Signature" /><br/>`
          : `<div class="sig-typed">${invoice.signature.name || invoice.signature.value}</div>`
      }
      <div class="sig-line">Authorized Signature</div>
    </div>`
        : ''
    }

    ${isFreePlan ? '<div class="footer-badge">Made with Invoizmo</div>' : ''}
  </div>
</body>
</html>`;
}
