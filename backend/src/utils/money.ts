/**
 * Invoizmo Financial Calculation Engine (PRD Section 11.2)
 *
 * All money is stored as integers in smallest currency units (e.g. cents, paise).
 * Calculations use round_half_up.
 */

export interface LineItemInput {
  description: string;
  quantity: number; // up to 3 decimals
  unit?: string;
  unitPriceMinor: number; // integer in smallest currency unit
}

export interface CalculatedLineItem extends LineItemInput {
  amountMinor: number;
}

export interface DiscountInput {
  type: 'percent' | 'fixed';
  value: number; // percent (0-100) or fixed amount in minor units
}

export interface CalculationInput {
  items: LineItemInput[];
  discount?: DiscountInput;
  taxPercent?: number; // e.g. 18 for 18% GST/VAT
}

export interface CalculationResult {
  items: CalculatedLineItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
}

/**
 * Standard round-half-up to nearest integer.
 */
export function roundHalfUp(value: number): number {
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

/**
 * Calculates a single line item amount in minor units.
 * lineAmount = round_half_up(quantity * unitPriceMinor)
 */
export function calculateLineAmount(quantity: number, unitPriceMinor: number): number {
  if (quantity < 0 || unitPriceMinor < 0) return 0;
  return roundHalfUp(quantity * unitPriceMinor);
}

/**
 * Calculates subtotal, discount, taxable base, tax, and final total.
 */
export function calculateTotals(input: CalculationInput): CalculationResult {
  // 1. Line items
  const items: CalculatedLineItem[] = input.items.map((item) => {
    const amountMinor = calculateLineAmount(item.quantity, item.unitPriceMinor);
    return {
      ...item,
      amountMinor,
    };
  });

  // 2. Subtotal = sum of all line amounts
  const subtotalMinor = items.reduce((acc, item) => acc + item.amountMinor, 0);

  // 3. Discount
  let discountMinor = 0;
  if (input.discount && input.discount.value > 0) {
    if (input.discount.type === 'percent') {
      const pct = Math.min(100, Math.max(0, input.discount.value));
      discountMinor = roundHalfUp((subtotalMinor * pct) / 100);
    } else {
      // Fixed discount capped at subtotal
      discountMinor = Math.min(subtotalMinor, Math.max(0, Math.round(input.discount.value)));
    }
  }

  // 4. Taxable = subtotal - discount
  const taxableMinor = Math.max(0, subtotalMinor - discountMinor);

  // 5. Tax = round_half_up(taxable * taxPercent / 100)
  const taxPct = input.taxPercent && input.taxPercent > 0 ? input.taxPercent : 0;
  const taxMinor = roundHalfUp((taxableMinor * taxPct) / 100);

  // 6. Total = taxable + tax
  const totalMinor = taxableMinor + taxMinor;

  return {
    items,
    subtotalMinor,
    discountMinor,
    taxableMinor,
    taxMinor,
    totalMinor,
  };
}

/**
 * ISO 4217 Currency exponent helper
 * Most currencies have 2 decimals (USD, INR, EUR).
 * Zero decimal currencies: JPY, KRW, VND, CLF, etc.
 * Three decimal currencies: KWD, BHD, OMR, TND, JOD.
 */
export function getCurrencyExponent(currencyCode: string): number {
  const code = currencyCode.toUpperCase();
  const zeroDecimal = ['JPY', 'KRW', 'UGX', 'VND', 'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'KMF', 'PYG', 'RWF', 'VUV'];
  const threeDecimal = ['BHD', 'IQD', 'JOD', 'KWD', 'OMR', 'TND'];

  if (zeroDecimal.includes(code)) return 0;
  if (threeDecimal.includes(code)) return 3;
  return 2; // Default for USD, EUR, INR, GBP, etc.
}
