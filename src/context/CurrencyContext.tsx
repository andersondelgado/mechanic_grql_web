import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Currency, PaymentMethod, SupportedCountry, RateHistoryEntry } from '../types/multicurrency';
import {
  fetchCurrenciesFromBackend,
  saveCurrenciesToBackend,
  fetchPaymentMethodsFromBackend,
  savePaymentMethodsToBackend,
  fetchRateHistoryFromBackend,
  recordRateHistoryEntry,
  detectUserCountry,
  DEFAULT_CURRENCIES,
  DEFAULT_PAYMENT_METHODS
} from '../services/currencyService';

interface CurrencyContextType {
  currencies: Currency[];
  currentCurrency: Currency;
  setCurrencyCode: (code: string) => void;
  paymentMethods: PaymentMethod[];
  formatAmount: (amountInUSD: number, targetCurrencyCode?: string, showSymbol?: boolean) => string;
  convertAmount: (amount: number, fromCode: string, toCode: string) => number;
  updateExchangeRate: (code: string, newRate: number, source?: string, notes?: string) => Promise<boolean>;
  savePaymentMethod: (method: PaymentMethod) => Promise<boolean>;
  deletePaymentMethod: (id: string) => Promise<boolean>;
  togglePaymentMethod: (id: string) => Promise<boolean>;
  getMethodsByCountry: (country: SupportedCountry) => PaymentMethod[];
  // Geolocalización dinámica
  detectedCountry: SupportedCountry;
  detectedCoords?: { latitude: number; longitude: number };
  detectionSource: string;
  detectLocation: () => Promise<void>;
  isRateConfiguredForCountry: (country: SupportedCountry) => boolean;
  getDynamicMethodsForLocation: () => PaymentMethod[];
  // Histórico de tasas del día
  rateHistory: RateHistoryEntry[];
  fetchHistory: (currencyCode?: string) => Promise<RateHistoryEntry[]>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const ACTIVE_CURRENCY_KEY = 'taller360_active_currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_CURRENCY_KEY) || 'USD';
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>([]);
  const [detectedCountry, setDetectedCountry] = useState<SupportedCountry>('VE');
  const [detectedCoords, setDetectedCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [detectionSource, setDetectionSource] = useState<string>('default');
  const [loading, setLoading] = useState<boolean>(true);

  // Mapeo país -> moneda principal
  const countryCurrencyMap: Record<SupportedCountry, string> = {
    'VE': 'VES',
    'CO': 'COP',
    'US': 'USD',
    'ES': 'EUR',
    'GLOBAL': 'USDT'
  };

  const isRateConfiguredForCountry = useCallback((country: SupportedCountry): boolean => {
    const targetCode = countryCurrencyMap[country] || 'USD';
    if (targetCode === 'USD' || targetCode === 'USDT') return true;
    const curr = currencies.find(c => c.code.toUpperCase() === targetCode.toUpperCase());
    return Boolean(curr && curr.rate > 0);
  }, [currencies]);

  const detectLocation = useCallback(async () => {
    try {
      const result = await detectUserCountry();
      setDetectedCountry(result.country);
      setDetectedCoords(result.coords);
      setDetectionSource(result.source);

      // Si el país detectado tiene una moneda específica y tiene tasa configurada, alinear la moneda activa
      const mappedCurrency = countryCurrencyMap[result.country];
      if (mappedCurrency) {
        const hasRate = isRateConfiguredForCountry(result.country);
        if (hasRate && !localStorage.getItem(ACTIVE_CURRENCY_KEY)) {
          setCurrentCurrencyCode(mappedCurrency);
        }
      }
    } catch (e) {
      console.warn('Geolocation detection error:', e);
    }
  }, [isRateConfiguredForCountry]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [currs, pms, history] = await Promise.all([
        fetchCurrenciesFromBackend(),
        fetchPaymentMethodsFromBackend(),
        fetchRateHistoryFromBackend()
      ]);
      setCurrencies(currs);
      setPaymentMethods(pms);
      setRateHistory(history);
      await detectLocation();
    } catch (err) {
      console.error('Error refreshing currency & payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, [detectLocation]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currentCurrency = currencies.find(c => c.code.toUpperCase() === currentCurrencyCode.toUpperCase()) 
    || currencies[0] 
    || DEFAULT_CURRENCIES[0];

  const setCurrencyCode = (code: string) => {
    setCurrentCurrencyCode(code);
    localStorage.setItem(ACTIVE_CURRENCY_KEY, code);
  };

  /**
   * Convierte un monto de una moneda a otra usando la moneda base (USD)
   */
  const convertAmount = useCallback((amount: number, fromCode: string, toCode: string): number => {
    if (isNaN(amount) || amount === 0) return 0;
    if (fromCode.toUpperCase() === toCode.toUpperCase()) return amount;

    const fromCurr = currencies.find(c => c.code.toUpperCase() === fromCode.toUpperCase()) || { rate: 1.0 };
    const toCurr = currencies.find(c => c.code.toUpperCase() === toCode.toUpperCase()) || { rate: 1.0 };

    const inUSD = fromCurr.rate > 0 ? amount / fromCurr.rate : amount;
    const inTarget = inUSD * toCurr.rate;
    return inTarget;
  }, [currencies]);

  /**
   * Formatea un monto expresado en USD hacia la moneda activa o indicada
   */
  const formatAmount = useCallback((
    amountInUSD: number, 
    targetCurrencyCode?: string, 
    showSymbol: boolean = true
  ): string => {
    const targetCode = targetCurrencyCode || currentCurrency.code;
    const target = currencies.find(c => c.code.toUpperCase() === targetCode.toUpperCase()) || currentCurrency;
    
    const converted = target.code === 'USD' ? (amountInUSD || 0) : convertAmount(amountInUSD || 0, 'USD', target.code);

    const formattedNum = new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: target.decimals,
      maximumFractionDigits: target.decimals
    }).format(converted);

    if (!showSymbol) return formattedNum;

    if (target.code === 'USD') return `$${formattedNum}`;
    if (target.code === 'VES') return `${formattedNum} ${target.symbol}`;
    if (target.code === 'EUR') return `${formattedNum} €`;
    if (target.code === 'COP') return `${target.symbol} ${formattedNum}`;
    return `${formattedNum} ${target.symbol}`;
  }, [currencies, currentCurrency, convertAmount]);

  /**
   * Actualiza la tasa de cambio y registra automáticamente en el histórico
   */
  const updateExchangeRate = async (
    code: string, 
    newRate: number, 
    source: string = 'manual_taller',
    notes: string = 'Actualización de tasa del día'
  ): Promise<boolean> => {
    if (newRate <= 0) return false;
    const updated = currencies.map(c => {
      if (c.code.toUpperCase() === code.toUpperCase()) {
        return {
          ...c,
          rate: newRate,
          last_updated: new Date().toISOString()
        };
      }
      return c;
    });

    setCurrencies(updated);
    const saveOk = await saveCurrenciesToBackend(updated);

    // Guardar en histórico
    await recordRateHistoryEntry(code, newRate, source, notes);
    const updatedHistory = await fetchRateHistoryFromBackend();
    setRateHistory(updatedHistory);

    return saveOk;
  };

  const fetchHistory = async (currencyCode?: string): Promise<RateHistoryEntry[]> => {
    const list = await fetchRateHistoryFromBackend(currencyCode);
    setRateHistory(list);
    return list;
  };

  /**
   * Métodos dinámicos según el país detectado por geolocalización y validación de tasa
   */
  const getDynamicMethodsForLocation = useCallback((): PaymentMethod[] => {
    const country = detectedCountry;
    const targetCode = countryCurrencyMap[country] || 'USD';
    const isRateReady = isRateConfiguredForCountry(country);

    return paymentMethods.filter(m => {
      if (!m.is_active) return false;
      const isCountryMatch = m.country === country || m.country === 'GLOBAL';
      if (!isCountryMatch) return false;

      // Si el método opera en la moneda local y el taller no tiene configurada la tasa
      if (m.currency === targetCode && !isRateReady) {
        return false;
      }
      return true;
    });
  }, [detectedCountry, paymentMethods, isRateConfiguredForCountry]);

  const savePaymentMethod = async (method: PaymentMethod): Promise<boolean> => {
    const existingIndex = paymentMethods.findIndex(p => p.id === method.id);
    let updated: PaymentMethod[];
    if (existingIndex >= 0) {
      updated = [...paymentMethods];
      updated[existingIndex] = method;
    } else {
      updated = [method, ...paymentMethods];
    }

    setPaymentMethods(updated);
    return await savePaymentMethodsToBackend(updated);
  };

  const deletePaymentMethod = async (id: string): Promise<boolean> => {
    const updated = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updated);
    return await savePaymentMethodsToBackend(updated);
  };

  const togglePaymentMethod = async (id: string): Promise<boolean> => {
    const updated = paymentMethods.map(p => {
      if (p.id === id) {
        return { ...p, is_active: !p.is_active };
      }
      return p;
    });
    setPaymentMethods(updated);
    return await savePaymentMethodsToBackend(updated);
  };

  const getMethodsByCountry = useCallback((country: SupportedCountry): PaymentMethod[] => {
    return paymentMethods.filter(p => p.country === country || p.country === 'GLOBAL');
  }, [paymentMethods]);

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        currentCurrency,
        setCurrencyCode,
        paymentMethods,
        formatAmount,
        convertAmount,
        updateExchangeRate,
        savePaymentMethod,
        deletePaymentMethod,
        togglePaymentMethod,
        getMethodsByCountry,
        detectedCountry,
        detectedCoords,
        detectionSource,
        detectLocation,
        isRateConfiguredForCountry,
        getDynamicMethodsForLocation,
        rateHistory,
        fetchHistory,
        loading,
        refresh
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
