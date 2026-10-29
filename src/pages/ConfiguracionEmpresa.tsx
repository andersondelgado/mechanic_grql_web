import React, { useState, useEffect, useRef } from 'react';
import { useCompany, CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../context/CompanyContext';
import { LOGO_TALLER_360_DATA_URL } from '../utils/logoBase64';
import { COUNTRIES, SupportedCountry } from '../types/multicurrency';
import { CountryFlag } from '../components/currency/CountryFlag';

const DEMO_PRESETS: Record<string, Partial<CompanySettings>> = {
  VE: {
    commercialName: 'Taller Integral 360',
    legalName: 'Urbaez Motors 2030 C.A.',
    documentHeaderName: 'TALLER INTEGRAL 360 GARAGE C.A.',
    taxIdLabel: 'RIF',
    taxId: 'J-50123456-7',
    phone: '(0212) 555-0360',
    whatsapp: '+58 414-1234567',
    email: 'contacto@taller360.com.ve',
    address: 'Caracas, Venezuela',
    specialties: 'Mecánica General • Latonería y Pintura • Diagnóstico Computarizado',
    country: 'VE'
  },
  CO: {
    commercialName: 'AutoTaller 360 Bogotá',
    legalName: 'Inversiones Automotrices 360 S.A.S.',
    documentHeaderName: 'AUTOTALLER 360 BOGOTÁ S.A.S.',
    taxIdLabel: 'NIT',
    taxId: '901.456.789-2',
    phone: '(601) 745-8900',
    whatsapp: '+57 310 555 0144',
    email: 'servicio@autotaller360.co',
    address: 'Bogotá D.C., Colombia',
    specialties: 'Mecánica Especializada • Colisión y Pintura • Peritaje Vehicular IA',
    country: 'CO'
  },
  US: {
    commercialName: '360 Auto Care & Collision',
    legalName: '360 Garage Solutions LLC',
    documentHeaderName: '360 AUTO CARE & COLLISION LLC',
    taxIdLabel: 'EIN',
    taxId: '88-1234567',
    phone: '+1 (305) 555-0199',
    whatsapp: '+1 (305) 555-0199',
    email: 'service@360autocare.us',
    address: 'Miami, FL - United States',
    specialties: 'General Mechanics • Body Shop & Paint • AI Computerized Diagnostics',
    country: 'US'
  },
  ES: {
    commercialName: 'Taller 360 Automoción',
    legalName: 'Taller 360 Automoción S.L.',
    documentHeaderName: 'TALLER 360 AUTOMOCIÓN S.L.',
    taxIdLabel: 'CIF',
    taxId: 'B-87654321',
    phone: '+34 910 555 360',
    whatsapp: '+34 612 345 678',
    email: 'info@taller360.es',
    address: 'Madrid, España',
    specialties: 'Mecánica Multimarca • Chapa y Pintura • Diagnosis Avanzada IA',
    country: 'ES'
  }
};

/**
 * Normaliza cualquier imagen subida (PNG, JPG, WebP, SVG) a un PNG Data URL optimizado (máx 256x256)
 * para garantizar compatibilidad total con pdf-lib (embedPng) y almacenamiento ligero en base de datos.
 */
function normalizeImageToPngDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 256;
        let width = img.width || maxSize;
        let height = img.height || maxSize;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ConfiguracionEmpresa() {
  const { company, saving, updateCompanySettings, resetCompanySettings } = useCompany();
  const [formData, setFormData] = useState<CompanySettings>(company);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(company);
  }, [company]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pngDataUrl = await normalizeImageToPngDataUrl(file);
      setFormData(prev => ({ ...prev, logoDataUrl: pngDataUrl }));
      showToast('Logo cargado en la vista previa. Haz clic en "Guardar Configuración" para aplicarlo.');
    } catch {
      alert('No se pudo procesar la imagen seleccionada. Intenta con un archivo PNG o JPG.');
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = DEMO_PRESETS[presetKey];
    if (!preset) return;
    setFormData(prev => ({
      ...prev,
      ...preset
    }));
    showToast(`Plantilla de ${presetKey} cargada en el formulario. Guarda para aplicar en todo el sistema.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompanySettings(formData);
    showToast('¡Configuración del taller guardada y aplicada en todo el sistema y PDFs!');
  };

  const handleReset = async () => {
    if (window.confirm('¿Deseas restaurar los datos e imagen originales de Taller Integral 360?')) {
      await resetCompanySettings();
      setFormData(DEFAULT_COMPANY_SETTINGS);
      showToast('Valores originales de Taller Integral 360 restaurados.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 xl:p-8 min-w-0">
      {/* Toast Flotante */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn border border-gray-700 max-w-md">
          <i className="fas fa-check-circle text-emerald-400 text-lg shrink-0"></i>
          <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 overflow-hidden">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="p-3 sm:p-3.5 bg-gradient-to-tr from-primary to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
            <i className="fas fa-building-shield text-xl sm:text-2xl"></i>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-secondary tracking-tight">
                Configuración del Taller & Marca (White-Label)
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                Multi-Taller / SaaS Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Personaliza el nombre comercial, razón social, RIF/NIT, teléfono, dirección y logo. Se actualizan automáticamente el menú lateral, pantalla de acceso, mensajes de WhatsApp y todos los PDFs oficiales.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto justify-center px-4 py-2.5 border-2 border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap"
          >
            <i className="fas fa-rotate-left"></i> Restaurar Original
          </button>
        </div>
      </div>

      {/* Selector Rápido de Plantillas para Demos Comerciales */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl p-4 sm:p-5 border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2.5 bg-white/10 rounded-2xl text-amber-400 text-lg shrink-0">
              <i className="fas fa-wand-magic-sparkles"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-300">
                  Modo Demo Comercial 1-Click
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ideal para Ventas
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                ¿En reunión con un cliente de otro país? Carga una plantilla preconfigurada según su país para mostrarle el sistema adaptado a su mercado:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {[
              { code: 'VE', label: 'Demo Venezuela (RIF)' },
              { code: 'CO', label: 'Demo Colombia (NIT)' },
              { code: 'US', label: 'Demo EE.UU. (EIN)' },
              { code: 'ES', label: 'Demo España (CIF)' }
            ].map(item => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleApplyPreset(item.code)}
                className={`px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 border whitespace-nowrap ${
                  formData.country === item.code
                    ? 'bg-white text-slate-900 border-white shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <CountryFlag countryCode={item.code} className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Principal: Formulario (Izquierda) + Vista Previa en Vivo (Derecha) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Formulario de Configuración */}
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-7 bg-white rounded-3xl shadow-card border border-gray-100 p-5 sm:p-6 space-y-6 min-w-0"
        >
          {/* Sección 1: Logo e Identidad Visual */}
          <div className="pb-5 border-b border-gray-100">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-secondary flex items-center gap-2 mb-4">
              <i className="fas fa-image text-primary"></i>
              <span>1. Logo e Identidad Visual del Taller</span>
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-200 shadow-sm flex items-center justify-center p-2 shrink-0 mx-auto sm:mx-0">
                <img
                  src={formData.logoDataUrl || LOGO_TALLER_360_DATA_URL}
                  alt="Logo del Taller"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <p className="text-xs font-bold text-gray-800">
                  Logotipo Oficial (Sidebar, Login, Ficha de Recepción y PDFs de Peritaje)
                </p>
                <p className="text-[11px] text-gray-500">
                  Formatos soportados: PNG, JPG o SVG. Se optimiza automáticamente para incrustación directa en documentos PDF.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <i className="fas fa-upload"></i> Subir Logo del Cliente
                  </button>
                  {formData.logoDataUrl !== LOGO_TALLER_360_DATA_URL && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoDataUrl: LOGO_TALLER_360_DATA_URL }))}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold transition"
                    >
                      Usar Logo 360 por Defecto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Datos Comerciales y Fiscales */}
          <div className="pb-5 border-b border-gray-100 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-secondary flex items-center gap-2">
              <i className="fas fa-id-card text-primary"></i>
              <span>2. Datos Comerciales y Registro Fiscal</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Nombre Comercial (Menú y Sistema) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.commercialName}
                  onChange={e => setFormData({ ...formData, commercialName: e.target.value })}
                  placeholder="Ej: Taller Integral 360"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Razón Social / Subtítulo Corporativo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.legalName}
                  onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="Ej: Urbaez Motors 2030 C.A."
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Título en Membrete Oficial (PDFs de Recepción y Peritaje) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.documentHeaderName}
                  onChange={e => setFormData({ ...formData, documentHeaderName: e.target.value })}
                  placeholder="Ej: TALLER INTEGRAL 360 GARAGE C.A."
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-black uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  País Principal de Operación
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 pointer-events-none flex items-center">
                    <CountryFlag countryCode={formData.country} className="w-4 h-4" />
                  </span>
                  <select
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value as SupportedCountry })}
                    className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-bold bg-white"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipo ID</label>
                  <select
                    value={formData.taxIdLabel}
                    onChange={e => setFormData({ ...formData, taxIdLabel: e.target.value })}
                    className="w-full px-2.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-bold bg-white"
                  >
                    <option value="RIF">RIF</option>
                    <option value="NIT">NIT</option>
                    <option value="RUC">RUC</option>
                    <option value="CIF">CIF</option>
                    <option value="EIN">EIN</option>
                    <option value="ID">ID</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Número Fiscal ({formData.taxIdLabel}) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="Ej: J-50123456-7"
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Especialidades / Subtítulo Técnico del Membrete
                </label>
                <input
                  type="text"
                  value={formData.specialties}
                  onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Ej: Mecánica General • Latonería y Pintura • Diagnóstico Computarizado"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Contacto, Ubicación y Cláusula Legal */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-secondary flex items-center gap-2">
              <i className="fas fa-location-dot text-primary"></i>
              <span>3. Contacto, Ubicación y Pie Legal</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Teléfono en Membrete *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: (0212) 555-0360"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  WhatsApp de Atención / Cobros
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="Ej: +58 414-1234567"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Ciudad / Dirección Corta (Membrete PDF) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Caracas, Venezuela"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Correo Electrónico Corporativo
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ej: contacto@taller.com"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Cláusula Legal en Ficha de Recepción (Pie de Firma)
                </label>
                <textarea
                  rows={2}
                  value={formData.legalClause}
                  onChange={e => setFormData({ ...formData, legalClause: e.target.value })}
                  className="w-full px-3.5 py-2 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-xs resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto justify-center px-6 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
              <span>{saving ? 'Guardando cambios...' : 'Guardar y Aplicar en Todo el Sistema'}</span>
            </button>
          </div>
        </form>

        {/* Columna Derecha: Vista Previa en Tiempo Real */}
        <div className="xl:col-span-5 space-y-5 min-w-0">
          {/* 1. Preview del Sidebar */}
          <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-5 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Vista Previa 1: Menú Lateral & Login
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-primary rounded-full">
                En Vivo
              </span>
            </div>

            <div className="bg-secondary text-white rounded-2xl p-4 flex items-center gap-3 border border-gray-800 shadow-md">
              <img
                src={formData.logoDataUrl || LOGO_TALLER_360_DATA_URL}
                alt={formData.commercialName}
                className="w-11 h-11 object-contain bg-white rounded-xl p-1 shadow-md border border-white/15 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base leading-tight truncate">{formData.commercialName || 'Nombre del Taller'}</h3>
                <p className="text-[11px] text-gray-400 truncate">{formData.legalName || 'Razón Social'}</p>
              </div>
            </div>
          </div>

          {/* 2. Preview del Membrete Oficial de PDFs (Recepción y Peritaje) */}
          <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-5 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Vista Previa 2: Membrete Oficial PDF
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                Recepción & Peritajes
              </span>
            </div>

            <div className="border-2 border-slate-900 rounded-2xl p-4 bg-white text-slate-900 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1 shrink-0">
                    <img
                      src={formData.logoDataUrl || LOGO_TALLER_360_DATA_URL}
                      alt="Logo PDF"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 uppercase break-words">
                      {formData.documentHeaderName || 'NOMBRE EN DOCUMENTOS'}
                    </h4>
                    <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider truncate">
                      {formData.specialties}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formData.taxIdLabel}: {formData.taxId} • Telf: {formData.phone} • {formData.address}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <span className="inline-block px-2 py-0.5 bg-slate-900 text-amber-400 font-mono font-bold text-[10px] rounded">
                    N° REC-0001
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                <strong>Cláusula Legal:</strong> {formData.legalClause}
              </div>
            </div>
          </div>

          {/* 3. Preview de Datos de Pago para WhatsApp */}
          <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-5 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Vista Previa 3: Formato WhatsApp Cobros
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                Portapapeles
              </span>
            </div>

            <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-4 font-mono text-xs space-y-1 border border-emerald-800/60">
              <p className="font-bold text-white">💳 *DATOS DE PAGO - {(formData.commercialName || 'TALLER 360').toUpperCase()}*</p>
              <p>📌 *Método:* Pago Móvil / Transferencia</p>
              <p>🆔 *{formData.taxIdLabel}:* {formData.taxId}</p>
              <p>👤 *Titular:* {formData.legalName}</p>
              <p>📱 *Contacto:* {formData.whatsapp || formData.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

