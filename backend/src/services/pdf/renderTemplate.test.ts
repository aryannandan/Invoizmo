import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderInvoiceHtml } from './renderTemplate.js';
import { signPrintToken, verifyPrintToken } from './printToken.js';

describe('PDF & Print Service', () => {
  const dummyInvoice: any = {
    number: 'INV-0042',
    currency: 'INR',
    status: 'draft',
    templateId: 'classic',
    font: 'Inter',
    colorScheme: 'indigo',
    seller: {
      businessName: 'Apex Studio',
      address: '123 MG Road, Bengaluru',
      email: 'apex@example.com',
      taxId: '29ABCDE1234F1Z5',
    },
    client: {
      name: 'Rohan Sharma',
      company: 'Nova Corp',
      address: '456 Brigade Road',
      email: 'rohan@nova.com',
    },
    items: [
      {
        description: 'UI/UX Design',
        quantity: 5,
        unit: 'hrs',
        unitPriceMinor: 200000,
        amountMinor: 1000000,
      },
    ],
    subtotalMinor: 1000000,
    discountMinor: 100000,
    taxMinor: 162000,
    taxPercent: 18,
    taxName: 'GST',
    totalMinor: 1062000,
    issueDate: new Date('2026-11-01'),
    dueDate: new Date('2026-11-15'),
  };

  it('renders watermark on free plan drafts', () => {
    const html = renderInvoiceHtml({
      invoice: dummyInvoice,
      isDraft: true,
      isFreePlan: true,
    });

    assert.ok(html.includes('draft-watermark'));
    assert.ok(html.includes('DRAFT'));
    assert.ok(html.includes('Made with Invoizmo'));
  });

  it('omits watermark on sent invoices and pro plan', () => {
    const html = renderInvoiceHtml({
      invoice: { ...dummyInvoice, status: 'sent' },
      isDraft: false,
      isFreePlan: false,
    });

    assert.ok(!html.includes('draft-watermark'));
    assert.ok(!html.includes('Made with Invoizmo'));
  });

  it('signs and verifies short-lived print tokens', () => {
    const token = signPrintToken('inv_123', 'usr_456');
    assert.ok(typeof token === 'string');

    const decoded = verifyPrintToken(token);
    assert.equal(decoded.invoiceId, 'inv_123');
    assert.equal(decoded.userId, 'usr_456');
  });
});
