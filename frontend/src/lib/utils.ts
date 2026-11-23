import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountMinor: number, currencyCode = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const zeroDecimal = ['JPY', 'KRW', 'VND', 'CLP', 'PYG'];
  const threeDecimal = ['BHD', 'KWD', 'OMR', 'JOD'];

  let exponent = 2;
  if (zeroDecimal.includes(code)) exponent = 0;
  if (threeDecimal.includes(code)) exponent = 3;

  const major = amountMinor / Math.pow(10, exponent);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(major);
  } catch {
    return `${code} ${major.toFixed(exponent)}`;
  }
}

export function toMajorUnits(amountMinor: number, currencyCode = 'INR'): number {
  const code = (currencyCode || 'INR').toUpperCase();
  const zeroDecimal = ['JPY', 'KRW', 'VND', 'CLP', 'PYG'];
  const threeDecimal = ['BHD', 'KWD', 'OMR', 'JOD'];

  let exponent = 2;
  if (zeroDecimal.includes(code)) exponent = 0;
  if (threeDecimal.includes(code)) exponent = 3;

  return amountMinor / Math.pow(10, exponent);
}

export function toMinorUnits(majorAmount: number, currencyCode = 'INR'): number {
  const code = (currencyCode || 'INR').toUpperCase();
  const zeroDecimal = ['JPY', 'KRW', 'VND', 'CLP', 'PYG'];
  const threeDecimal = ['BHD', 'KWD', 'OMR', 'JOD'];

  let exponent = 2;
  if (zeroDecimal.includes(code)) exponent = 0;
  if (threeDecimal.includes(code)) exponent = 3;

  return Math.round(majorAmount * Math.pow(10, exponent));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDaysRemaining(purgeAt?: string | null): number {
  if (!purgeAt) return 30;
  const target = new Date(purgeAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}
