import React, { createContext, useContext, useState, useEffect } from 'react';
import { getEntity, createEntity } from '../api/client';
import { LOGO_TALLER_360_DATA_URL } from '../utils/logoBase64';
import { SupportedCountry } from '../types/multicurrency';

export interface CompanySettings {
  commercialName: string;
  legalName: string;
  documentHeaderName: string;
  taxIdLabel: string; // 'RIF' | 'NIT' | 'RUC' | 'CIF' | 'EIN' | 'ID Fiscal'
  taxId: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  specialties: string;
  website: string;
  country: SupportedCountry;
  logoDataUrl: string;
  legalClause: string;
  updatedAt?: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  commercialName: 'Taller Integral 360',
  legalName: 'Urbaez Motors 2030 C.A.',
  documentHeaderName: 'TALLER INTEGRAL 360 GARAGE C.A.',
  taxIdLabel: 'RIF',
  taxId: 'J-50123456-7',
  phone: '(0212) 555-0360',
  whatsapp: '+58 414-1234567',
  email: 'contacto@taller360.com',
  address: 'Caracas, Venezuela',
  specialties: 'Mecánica General • Latonería y Pintura • Diagnóstico Computarizado',
  website: 'www.taller360.com',
  country: 'VE',
  logoDataUrl: LOGO_TALLER_360_DATA_URL,
  legalClause: 'El cliente autoriza los trabajos indicados y las pruebas de manejo correspondientes.'
};

const COMPANY_STORAGE_KEY = 'taller360_company_settings';

/**
 * Helper síncrono para obtener la configuración actual del taller desde cualquier utilidad
 * (como el generador de PDFs) sin requerir hooks de React.
 */
export function getStoredCompanySettings(): CompanySettings {
  try {
    const cached = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_COMPANY_SETTINGS,
          ...parsed,
          logoDataUrl: parsed.logoDataUrl || LOGO_TALLER_360_DATA_URL
        };
      }
    }
  } catch {
    // Fallback a valores por defecto
  }
  return DEFAULT_COMPANY_SETTINGS;
}

interface CompanyContextType {
  company: CompanySettings;
  loading: boolean;
  saving: boolean;
  updateCompanySettings: (newSettings: Partial<CompanySettings>) => Promise<boolean>;
  resetCompanySettings: () => Promise<boolean>;
}

const CompanyContext = createContext<CompanyContextType>({
  company: DEFAULT_COMPANY_SETTINGS,
  loading: false,
  saving: false,
  updateCompanySettings: async () => false,
  resetCompanySettings: async () => false
});

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<CompanySettings>(() => getStoredCompanySettings());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function loadFromBackend() {
      try {
        const list = await getEntity<any>('catalogState', {
          arrayFilter: [{ field: 'name', value: 'company_settings' }]
        });
        if (mounted && list && list.length > 0 && Array.isArray(list[0].metadata) && list[0].metadata.length > 0) {
          const remoteSettings = list[0].metadata[0];
          if (remoteSettings && typeof remoteSettings === 'object') {
            const merged: CompanySettings = {
              ...DEFAULT_COMPANY_SETTINGS,
              ...remoteSettings,
              logoDataUrl: remoteSettings.logoDataUrl || LOGO_TALLER_360_DATA_URL
            };
            setCompany(merged);
            localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.warn('Usando configuración de empresa local:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadFromBackend();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (company?.commercialName) {
      document.title = `${company.commercialName} - Sistema de Gestión`;
    }
  }, [company.commercialName]);

  const updateCompanySettings = async (newSettings: Partial<CompanySettings>): Promise<boolean> => {
    setSaving(true);
    const updated: CompanySettings = {
      ...company,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    setCompany(updated);
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(updated));

    try {
      await createEntity('catalogState', {
        name: 'company_settings',
        metadata: [updated]
      });
      return true;
    } catch (err) {
      console.error('Error guardando configuración de empresa en backend:', err);
      return true; // Guardado en localStorage de forma resiliente
    } finally {
      setSaving(false);
    }
  };

  const resetCompanySettings = async (): Promise<boolean> => {
    return updateCompanySettings(DEFAULT_COMPANY_SETTINGS);
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        loading,
        saving,
        updateCompanySettings,
        resetCompanySettings
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);

