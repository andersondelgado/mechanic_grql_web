import { getEntity, createEntity, updateEntity } from '../api/client';
import { Currency, PaymentMethod } from '../types/multicurrency';

export const DEFAULT_CURRENCIES: Currency[] = [
  {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: '$',
    rate: 1.0,
    is_base: true,
    decimals: 2,
    flag: '🇺🇸',
    countries: ['US', 'VE', 'PA', 'EC', 'GLOBAL'],
    last_updated: new Date().toISOString()
  },
  {
    code: 'VES',
    name: 'Bolívar Digital',
    symbol: 'Bs.',
    rate: 50.0,
    is_base: false,
    decimals: 2,
    flag: '🇻🇪',
    countries: ['VE'],
    last_updated: new Date().toISOString()
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rate: 0.92,
    is_base: false,
    decimals: 2,
    flag: '🇪🇺',
    countries: ['ES', 'EU'],
    last_updated: new Date().toISOString()
  },
  {
    code: 'COP',
    name: 'Peso Colombiano',
    symbol: 'COP$',
    rate: 4150.0,
    is_base: false,
    decimals: 0,
    flag: '🇨🇴',
    countries: ['CO'],
    last_updated: new Date().toISOString()
  },
  {
    code: 'USDT',
    name: 'Tether USD (Binance)',
    symbol: 'USDT',
    rate: 1.0,
    is_base: false,
    decimals: 2,
    flag: '🟡',
    countries: ['GLOBAL', 'VE', 'US', 'CO', 'ES'],
    last_updated: new Date().toISOString()
  }
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  // 🇻🇪 VENEZUELA
  {
    id: 'pm-ve-pago-movil',
    country: 'VE',
    type: 'pago_movil',
    title: 'Pago Móvil (Interbancario)',
    currency: 'VES',
    bank_name: '0102 - Banco de Venezuela',
    phone: '0414-1234567',
    tax_id: 'J-50123456-7',
    beneficiary: 'Taller Mecánico 360 C.A.',
    instructions: 'Realizar el pago móvil a la tasa acordada del día. Adjuntar captura legible con el número de referencia.',
    is_active: true
  },
  {
    id: 'pm-ve-pago-movil-banesco',
    country: 'VE',
    type: 'pago_movil',
    title: 'Pago Móvil Banesco',
    currency: 'VES',
    bank_name: '0134 - Banesco Banco Universal',
    phone: '0424-9876543',
    tax_id: 'J-50123456-7',
    beneficiary: 'Taller Mecánico 360 C.A.',
    instructions: 'Acreditación inmediata. Notificar vía WhatsApp con número de presupuesto o placa.',
    is_active: true
  },
  {
    id: 'pm-ve-efectivo-divisa',
    country: 'VE',
    type: 'divisa',
    title: 'Divisa en Efectivo (USD / EUR)',
    currency: 'USD',
    beneficiary: 'Caja Principal - Taller 360',
    instructions: 'Pago presencial en la caja del taller. Billetes en buen estado (sin roturas, sellos o rasgaduras).',
    is_active: true
  },
  {
    id: 'pm-ve-zelle',
    country: 'VE',
    type: 'zelle',
    title: 'Zelle (Dólares USD)',
    currency: 'USD',
    email: 'pagos.taller360@gmail.com',
    beneficiary: 'Taller 360 LLC',
    instructions: 'Indicar en el memo/concepto ÚNICAMENTE el número de presupuesto o placa. No incluir términos automotrices.',
    is_active: true
  },
  {
    id: 'pm-ve-usdt-binance',
    country: 'VE',
    type: 'usdt',
    title: 'USDT (Binance Pay / Crypto)',
    currency: 'USDT',
    binance_id: '284910283',
    email: 'binance@taller360.com',
    network: 'Tron (TRC-20) / BSC (BEP-20)',
    wallet_address: 'TQrL7YF45dM2qN9c8Pz1V8kJ6xR2mP7tWv',
    instructions: 'Binance Pay instantáneo sin comisión. Para retiros de otras billeteras verificar la red TRC20.',
    is_active: true
  },
  {
    id: 'pm-ve-transferencia-bs',
    country: 'VE',
    type: 'transferencia',
    title: 'Transferencia Bancaria (Bs)',
    currency: 'VES',
    bank_name: '0102 - Banco de Venezuela',
    account_number: '0102-0123-45-0000123456',
    tax_id: 'J-50123456-7',
    beneficiary: 'Taller Mecánico 360 C.A.',
    instructions: 'Cuenta corriente jurídica. Adjuntar comprobante oficial emitido por el banco.',
    is_active: true
  },

  // 🇺🇸 ESTADOS UNIDOS / INTERNACIONAL
  {
    id: 'pm-us-zelle',
    country: 'US',
    type: 'zelle',
    title: 'Zelle Direct Pay (USD)',
    currency: 'USD',
    email: 'billing@taller360garage.com',
    phone: '+1 (786) 555-0199',
    beneficiary: 'Taller 360 Garage LLC',
    instructions: 'Direct instant payment via US banking app. Enter vehicle license plate in memo.',
    is_active: true
  },
  {
    id: 'pm-us-ach',
    country: 'US',
    type: 'transferencia',
    title: 'Wire / ACH Direct Deposit',
    currency: 'USD',
    bank_name: 'Chase Bank / Bank of America',
    account_number: '9876543210',
    beneficiary: 'Taller 360 Garage LLC',
    instructions: 'Routing (ABA): 021000021. For domestic ACH or wire transfers.',
    is_active: true
  },
  {
    id: 'pm-us-cash',
    country: 'US',
    type: 'divisa',
    title: 'Cash USD (In-Shop)',
    currency: 'USD',
    beneficiary: 'Cashier Desk',
    instructions: 'Pay at physical workshop reception desk.',
    is_active: true
  },

  // 🇨🇴 COLOMBIA
  {
    id: 'pm-co-nequi',
    country: 'CO',
    type: 'nequi',
    title: 'Nequi / Daviplata',
    currency: 'COP',
    phone: '310-555-0144',
    tax_id: 'CC 1020304050',
    beneficiary: 'Taller 360 Colombia SAS',
    instructions: 'Transferencias desde Nequi o Daviplata. Enviar comprobante con fecha y hora.',
    is_active: true
  },
  {
    id: 'pm-co-bancolombia',
    country: 'CO',
    type: 'transferencia',
    title: 'Bancolombia (Ahorros / Corriente)',
    currency: 'COP',
    bank_name: 'Bancolombia',
    account_number: '123-456789-01 (Ahorros)',
    tax_id: 'NIT 901.234.567-8',
    beneficiary: 'Taller 360 Colombia SAS',
    instructions: 'Transferencia directa o código QR Bancolombia.',
    is_active: true
  },
  {
    id: 'pm-co-efectivo',
    country: 'CO',
    type: 'divisa',
    title: 'Efectivo en Pesos (COP)',
    currency: 'COP',
    beneficiary: 'Caja Taller',
    instructions: 'Pago en caja del taller.',
    is_active: true
  },

  // 🇪🇸 ESPAÑA / EUROPA
  {
    id: 'pm-es-bizum',
    country: 'ES',
    type: 'bizum',
    title: 'Bizum',
    currency: 'EUR',
    phone: '+34 612 345 678',
    beneficiary: 'Taller 360 Automoción SL',
    instructions: 'Envío instantáneo mediante Bizum. Indicar matrícula en el concepto.',
    is_active: true
  },
  {
    id: 'pm-es-sepa',
    country: 'ES',
    type: 'transferencia',
    title: 'Transferencia SEPA (IBAN)',
    currency: 'EUR',
    bank_name: 'CaixaBank / BBVA',
    account_number: 'ES91 2100 0418 4502 0005 1234',
    beneficiary: 'Taller 360 Automoción SL',
    instructions: 'Transferencia bancaria europea SEPA en Euros.',
    is_active: true
  },

  // 🌐 GLOBAL
  {
    id: 'pm-global-binance-usdt',
    country: 'GLOBAL',
    type: 'usdt',
    title: 'Binance Pay / USDT Global',
    currency: 'USDT',
    binance_id: '284910283',
    network: 'Tron (TRC-20)',
    wallet_address: 'TQrL7YF45dM2qN9c8Pz1V8kJ6xR2mP7tWv',
    instructions: 'Aceptamos USDT para clientes internacionales. Red TRC20 o Binance Pay ID.',
    is_active: true
  }
];

const CURRENCY_STORAGE_KEY = 'taller360_currencies';
const PAYMENT_METHODS_STORAGE_KEY = 'taller360_payment_methods';

export async function fetchCurrenciesFromBackend(): Promise<Currency[]> {
  try {
    const list = await getEntity<any>('catalogState', {
      arrayFilter: [{ field: 'name', value: 'currency_settings' }]
    });
    if (list && list.length > 0 && Array.isArray(list[0].metadata) && list[0].metadata.length > 0) {
      localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(list[0].metadata));
      return list[0].metadata;
    }
  } catch (err) {
    console.warn('Could not fetch currencies from backend, checking local storage', err);
  }

  const cached = localStorage.getItem(CURRENCY_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch { }
  }

  // Si no hay nada, guardar defaults
  localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(DEFAULT_CURRENCIES));
  // Intentar inicializar en backend en segundo plano
  createEntity('catalogState', {
    name: 'currency_settings',
    metadata: DEFAULT_CURRENCIES
  }).catch(() => { });

  return DEFAULT_CURRENCIES;
}

export async function saveCurrenciesToBackend(currencies: Currency[]): Promise<boolean> {
  localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currencies));
  try {
    await createEntity('catalogState', {
      name: 'currency_settings',
      metadata: currencies
    });
    return true;
  } catch (err) {
    console.error('Error saving currencies to backend:', err);
    return false;
  }
}

export async function fetchPaymentMethodsFromBackend(): Promise<PaymentMethod[]> {
  try {
    const list = await getEntity<any>('catalogState', {
      arrayFilter: [{ field: 'name', value: 'payment_methods' }]
    });
    if (list && list.length > 0 && Array.isArray(list[0].metadata) && list[0].metadata.length > 0) {
      localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(list[0].metadata));
      return list[0].metadata;
    }
  } catch (err) {
    console.warn('Could not fetch payment methods from backend, checking local storage', err);
  }

  const cached = localStorage.getItem(PAYMENT_METHODS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch { }
  }

  localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(DEFAULT_PAYMENT_METHODS));
  createEntity('catalogState', {
    name: 'payment_methods',
    metadata: DEFAULT_PAYMENT_METHODS
  }).catch(() => { });

  return DEFAULT_PAYMENT_METHODS;
}

export async function savePaymentMethodsToBackend(methods: PaymentMethod[]): Promise<boolean> {
  localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(methods));
  try {
    await createEntity('catalogState', {
      name: 'payment_methods',
      metadata: methods
    });
    return true;
  } catch (err) {
    console.error('Error saving payment methods to backend:', err);
    return false;
  }
}

// ─── Histórico de Tasas de Cambio ──────────────────────────────────────────
export const RATE_HISTORY_STORAGE_KEY = 'taller360_rate_history';

export async function fetchRateHistoryFromBackend(currencyCode?: string): Promise<any[]> {
  try {
    const list = await getEntity<any>('catalogState', {
      arrayFilter: [{ field: 'name', value: 'exchange_rate_history' }]
    });
    if (list && list.length > 0 && Array.isArray(list[0].metadata)) {
      let history = list[0].metadata;
      if (currencyCode) {
        history = history.filter((h: any) => h.currency_code === currencyCode);
      }
      localStorage.setItem(RATE_HISTORY_STORAGE_KEY, JSON.stringify(history));
      return history;
    }
  } catch (err) {
    console.warn('Could not fetch rate history from backend', err);
  }

  const cached = localStorage.getItem(RATE_HISTORY_STORAGE_KEY);
  if (cached) {
    try {
      const arr = JSON.parse(cached);
      return currencyCode ? arr.filter((h: any) => h.currency_code === currencyCode) : arr;
    } catch { }
  }

  return [];
}

export async function recordRateHistoryEntry(
  currencyCode: string,
  rate: number,
  source: string = 'manual_taller',
  notes: string = ''
): Promise<boolean> {
  const history = await fetchRateHistoryFromBackend();
  const dateStr = new Date().toISOString().split('T')[0];
  const newEntry = {
    id: `rate-${currencyCode.toLowerCase()}-${dateStr}-${Date.now()}`,
    date: dateStr,
    currency_code: currencyCode.toUpperCase(),
    rate,
    source,
    notes,
    timestamp: new Date().toISOString()
  };

  const existingIdx = history.findIndex((h: any) => h.date === dateStr && h.currency_code === currencyCode.toUpperCase());
  if (existingIdx >= 0) {
    history[existingIdx] = newEntry;
  } else {
    history.unshift(newEntry);
  }

  localStorage.setItem(RATE_HISTORY_STORAGE_KEY, JSON.stringify(history));

  try {
    await createEntity('catalogState', {
      name: 'exchange_rate_history',
      metadata: history.slice(0, 180)
    });
    return true;
  } catch (err) {
    console.error('Error saving rate history to backend:', err);
    return false;
  }
}

// ─── Detección Dinámica de País por Geolocalización (Latitud / Longitud) ─────
export function detectCountryFromCoordinates(lat: number, lon: number): 'VE' | 'CO' | 'US' | 'ES' | 'GLOBAL' {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return 'VE';
  }

  // 1. Venezuela: lat [0.6, 12.5], lon [-73.5, -59.8]
  if (lat >= 0.6 && lat <= 12.5 && lon >= -73.5 && lon <= -59.8) {
    if (lon < -72.5 && lat < 8.0) {
      return 'CO';
    }
    return 'VE';
  }

  // 2. Colombia: lat [-4.3, 12.5], lon [-79.1, -66.8]
  if (lat >= -4.3 && lat <= 12.5 && lon >= -79.1 && lon <= -66.8) {
    return 'CO';
  }

  // 3. Estados Unidos: lat [24.5, 49.5], lon [-125.0, -66.9]
  if (lat >= 24.5 && lat <= 49.5 && lon >= -125.0 && lon <= -66.9) {
    return 'US';
  }

  // 4. España / Europa: lat [35.0, 44.0], lon [-9.5, 4.5]
  if (lat >= 35.0 && lat <= 44.0 && lon >= -9.5 && lon <= 4.5) {
    return 'ES';
  }

  return 'GLOBAL';
}

/**
 * Obtiene la geolocalización del navegador y detecta el país automáticamente
 */
export async function detectUserCountry(): Promise<{
  country: 'VE' | 'CO' | 'US' | 'ES' | 'GLOBAL';
  coords?: { latitude: number; longitude: number };
  source: 'gps' | 'timezone' | 'default';
}> {
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          maximumAge: 300000,
          enableHighAccuracy: false
        });
      });

      const { latitude, longitude } = position.coords;
      const detected = detectCountryFromCoordinates(latitude, longitude);
      return {
        country: detected,
        coords: { latitude, longitude },
        source: 'gps'
      };
    } catch {
      // Si el usuario deniega GPS o hay timeout, fallback a zona horaria
    }
  }

  // Fallback por Timezone del navegador
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Caracas')) return { country: 'VE', source: 'timezone' };
    if (tz.includes('Bogota') || tz.includes('Colombia')) return { country: 'CO', source: 'timezone' };
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver') || tz.includes('America/')) {
      return { country: 'US', source: 'timezone' };
    }
    if (tz.includes('Madrid') || tz.includes('Europe')) return { country: 'ES', source: 'timezone' };
  } catch { }

  return { country: 'VE', source: 'default' };
}

