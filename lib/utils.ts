import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Static approximate exchange rates from USD
const USD_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  AUD: 1.53,
  INR: 83.5,
  ILS: 3.65,
  AED: 3.67,
  SGD: 1.34,
  JPY: 149,
  KRW: 1320,
  BRL: 4.97,
  MXN: 17.15,
  ZAR: 18.6,
  NZD: 1.64,
  CHF: 0.88,
  SEK: 10.5,
  NOK: 10.6,
  DKK: 6.88,
  PLN: 4.0,
  TRY: 30.5,
  MYR: 4.7,
  PHP: 56,
  THB: 35.5,
  IDR: 15600,
  HKD: 7.82,
  TWD: 31.5,
  CZK: 22.8,
  HUF: 355,
  CLP: 930,
  COP: 3950,
  PEN: 3.72,
  ARS: 850,
  EGP: 30.9,
  NGN: 1550,
  KES: 155,
  PKR: 280,
  BDT: 110,
  VND: 24500,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.376,
}

// Map locale to likely currency
const LOCALE_CURRENCY_MAP: Record<string, string> = {
  US: 'USD', GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR',
  IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR',
  GR: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR',
  LT: 'EUR', MT: 'EUR', CY: 'EUR', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  IN: 'INR', IL: 'ILS', AE: 'AED', SG: 'SGD', JP: 'JPY', KR: 'KRW',
  BR: 'BRL', MX: 'MXN', ZA: 'ZAR', CH: 'CHF', SE: 'SEK', NO: 'NOK',
  DK: 'DKK', PL: 'PLN', TR: 'TRY', MY: 'MYR', PH: 'PHP', TH: 'THB',
  ID: 'IDR', HK: 'HKD', TW: 'TWD', CZ: 'CZK', HU: 'HUF', CL: 'CLP',
  CO: 'COP', PE: 'PEN', AR: 'ARS', EG: 'EGP', NG: 'NGN', KE: 'KES',
  PK: 'PKR', BD: 'BDT', VN: 'VND', SA: 'SAR', QA: 'QAR', KW: 'KWD',
  BH: 'BHD',
}

/**
 * Detect the user's local currency from browser locale.
 * Returns currency code (e.g. "GBP") or "USD" as fallback.
 */
export function getLocalCurrency(): string {
  if (typeof navigator === 'undefined') return 'USD'
  const locale = navigator.language || 'en-US'
  const parts = locale.split('-')
  const country = (parts[1] || parts[0]).toUpperCase()
  return LOCALE_CURRENCY_MAP[country] || 'USD'
}

/**
 * Convert a USD cents price to the user's local currency, rounded down to the nearest whole unit.
 * Returns a formatted string like "£39" or "€45".
 */
export function formatLocalPrice(usdCents: number): string {
  const currency = getLocalCurrency()
  const rate = USD_EXCHANGE_RATES[currency] || 1
  const usdDollars = usdCents / 100
  const converted = Math.floor(usdDollars * rate)
  return new Intl.NumberFormat(typeof navigator !== 'undefined' ? navigator.language : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted)
}
