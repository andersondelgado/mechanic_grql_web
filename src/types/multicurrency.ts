export type SupportedCountry = 'VE' | 'CO' | 'US' | 'ES' | 'GLOBAL';

export type PaymentMethodType = 
  | 'pago_movil' 
  | 'zelle' 
  | 'divisa' 
  | 'usdt' 
  | 'transferencia' 
  | 'nequi' 
  | 'bizum' 
  | 'tarjeta'
  | 'otro';

export interface CountryInfo {
  code: SupportedCountry;
  name: string;
  flag: string;
  currencyCode: string;
  currency: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', currencyCode: 'VES', currency: 'VES' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currencyCode: 'COP', currency: 'COP' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', currencyCode: 'USD', currency: 'USD' },
  { code: 'ES', name: 'España / Europa', flag: '🇪🇸', currencyCode: 'EUR', currency: 'EUR' },
  { code: 'GLOBAL', name: 'Internacional / Cripto', flag: '🌐', currencyCode: 'USDT', currency: 'USDT' },
];

export interface Currency {
  code: string; // 'USD' | 'VES' | 'EUR' | 'COP' | 'USDT'
  name: string;
  symbol: string;
  rate: number; // Factor relativo a 1 USD (1 USD = rate Moneda)
  is_base: boolean;
  decimals: number;
  flag: string;
  countries: string[];
  last_updated?: string;
}

export interface PaymentMethod {
  id: string;
  country: SupportedCountry;
  type: PaymentMethodType;
  title: string;
  currency: string;
  bank_name?: string;
  phone?: string;
  tax_id?: string; // CI / RIF / NIT / SSN
  beneficiary?: string; // Titular
  account_number?: string;
  email?: string; // Para Zelle o Binance Pay
  binance_id?: string; // Binance Pay ID
  wallet_address?: string; // Dirección USDT
  network?: string; // TRC20, BEP20, ERC20
  instructions?: string;
  is_active: boolean;
  qr_code_url?: string;
}

export interface RateHistoryEntry {
  id: string;
  date?: string; // YYYY-MM-DD
  currency_code?: string;
  currency: string;
  rate: number;
  source: string; // 'manual_taller' | 'bcv_oficial' | 'paralelo' | 'trm' | 'snapshot_diario'
  notes?: string;
  timestamp?: string;
  recorded_at?: string;
}


