import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  roundHalfUp,
  calculateLineAmount,
  calculateTotals,
  getCurrencyExponent,
} from './money.js';

describe('Financial Math Engine (money.ts)', () => {
  it('correctly implements round_half_up', () => {
    assert.equal(roundHalfUp(2.4), 2);
    assert.equal(roundHalfUp(2.5), 3);
    assert.equal(roundHalfUp(2.6), 3);
    assert.equal(roundHalfUp(0.5), 1);
    assert.equal(roundHalfUp(0.4), 0);
  });

  it('calculates line item amounts in minor units with fractional quantities', () => {
    // 1.5 hours at 5000 paise (Rs 50.00) = 7500 paise (Rs 75.00)
    assert.equal(calculateLineAmount(1.5, 5000), 7500);

    // 0.333 hours at 1000 paise = 333 paise (round half up)
    assert.equal(calculateLineAmount(0.333, 1000), 333);
  });

  it('calculates totals for 2-decimal currencies (INR/USD) with percent discount and tax', () => {
    // Item 1: 2 units * 10000 paise (Rs 100) = 20000 paise
    // Item 2: 1 unit * 5000 paise (Rs 50) = 5000 paise
    // Subtotal = 25000 paise (Rs 250)
    // Discount: 10% = 2500 paise
    // Taxable: 25000 - 2500 = 22500 paise
    // Tax: 18% GST on 22500 = 4050 paise
    // Total: 22500 + 4050 = 26550 paise (Rs 265.50)
    const result = calculateTotals({
      items: [
        { description: 'Item 1', quantity: 2, unitPriceMinor: 10000 },
        { description: 'Item 2', quantity: 1, unitPriceMinor: 5000 },
      ],
      discount: { type: 'percent', value: 10 },
      taxPercent: 18,
    });

    assert.equal(result.subtotalMinor, 25000);
    assert.equal(result.discountMinor, 2500);
    assert.equal(result.taxableMinor, 22500);
    assert.equal(result.taxMinor, 4050);
    assert.equal(result.totalMinor, 26550);
  });

  it('calculates totals with fixed discount capped at subtotal', () => {
    const result = calculateTotals({
      items: [{ description: 'Dev', quantity: 1, unitPriceMinor: 5000 }],
      discount: { type: 'fixed', value: 6000 }, // exceeds subtotal
      taxPercent: 10,
    });

    assert.equal(result.subtotalMinor, 5000);
    assert.equal(result.discountMinor, 5000); // capped at 5000
    assert.equal(result.taxableMinor, 0);
    assert.equal(result.taxMinor, 0);
    assert.equal(result.totalMinor, 0);
  });

  it('handles 0-decimal currencies like JPY', () => {
    assert.equal(getCurrencyExponent('JPY'), 0);
    const result = calculateTotals({
      items: [{ description: 'Widget', quantity: 3, unitPriceMinor: 1500 }],
      taxPercent: 10,
    });

    assert.equal(result.subtotalMinor, 4500);
    assert.equal(result.taxMinor, 450);
    assert.equal(result.totalMinor, 4950);
  });

  it('handles 3-decimal currencies like KWD', () => {
    assert.equal(getCurrencyExponent('KWD'), 3);
    // 1 KWD = 1000 fils
    const result = calculateTotals({
      items: [{ description: 'Service', quantity: 2, unitPriceMinor: 1250 }], // 1.250 KWD each
      taxPercent: 5,
    });

    assert.equal(result.subtotalMinor, 2500); // 2.500 KWD
    assert.equal(result.taxMinor, 125); // 5% of 2500 = 125 fils
    assert.equal(result.totalMinor, 2625); // 2.625 KWD
  });
});
