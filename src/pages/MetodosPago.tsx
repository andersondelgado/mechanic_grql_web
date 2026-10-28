import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { PaymentMethod, SupportedCountry, COUNTRIES, CountryInfo, PaymentMethodType } from '../types/multicurrency';
import { CountryFlag } from '../components/currency/CountryFlag';

export default function MetodosPago() {
  const {
    currencies,
    paymentMethods,
    updateExchangeRate,
    savePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethod,
    loading,
    detectedCountry,
    detectedCoords,
    detectionSource,
    detectLocation,
    isRateConfiguredForCountry,
    getDynamicMethodsForLocation,
    rateHistory,
    fetchHistory
  } = useCurrency();

  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterByLocation, setFilterByLocation] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  // Estados de Edición de Tasa
  const [editingRateCode, setEditingRateCode] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<number>(0);

  // Histórico de Tasas
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyCurrencyFilter, setHistoryCurrencyFilter] = useState<string>('ALL');
  const [histForm, setHistForm] = useState({
    currency: 'VES',
    rate: 0,
    source: 'BCV Oficial',
    notes: 'Tasa del día'
  });
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  // Estados del Conversor Rápido
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcFromCurrency, setCalcFromCurrency] = useState<string>('USD');

  // Estados del Modal de Método de Pago
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    country: 'VE',
    type: 'pago_movil',
    title: '',
    currency: 'VES',
    is_active: true
  });
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

  // Ejecutar redetección de geolocalización
  const handleDetectLocation = async () => {
    setIsDetecting(true);
    await detectLocation();
    setIsDetecting(false);
  };

  // Filtrado de Métodos
  const baseMethods = filterByLocation ? getDynamicMethodsForLocation() : paymentMethods;

  const filteredMethods = baseMethods.filter(method => {
    const matchCountry = (filterByLocation || selectedCountry === 'ALL')
      ? true 
      : (method.country === selectedCountry || (selectedCountry !== 'GLOBAL' && method.country === 'GLOBAL'));
    
    const matchType = selectedType === 'ALL' ? true : method.type === selectedType;

    const matchSearch = searchTerm.trim() === '' ? true : (
      (method.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (method.bank_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (method.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (method.beneficiary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (method.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (method.tax_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return matchCountry && matchType && matchSearch;
  });

  // País detectado actual info
  const detectedCountryInfo: CountryInfo = COUNTRIES.find(c => c.code === detectedCountry) || {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    currencyCode: 'VES',
    currency: 'VES'
  };

  const isDetectedCountryRateConfigured = isRateConfiguredForCountry(detectedCountry);


  // Copiar datos formateados para WhatsApp / Cliente
  const handleCopyPaymentInfo = (m: PaymentMethod) => {
    let text = `💳 *DATOS DE PAGO - TALLER 360*\n`;
    text += `📌 *Método:* ${m.title} (${m.currency})\n`;
    if (m.bank_name) text += `🏦 *Banco:* ${m.bank_name}\n`;
    if (m.phone) text += `📱 *Teléfono:* ${m.phone}\n`;
    if (m.tax_id) text += `🆔 *Cédula / RIF / NIT:* ${m.tax_id}\n`;
    if (m.beneficiary) text += `👤 *Titular:* ${m.beneficiary}\n`;
    if (m.account_number) text += `🔢 *Cuenta:* ${m.account_number}\n`;
    if (m.email) text += `📧 *Correo / Zelle:* ${m.email}\n`;
    if (m.binance_id) text += `🟡 *Binance Pay ID:* ${m.binance_id}\n`;
    if (m.wallet_address) text += `🔗 *Billetera (${m.network || 'TRC20'}):* ${m.wallet_address}\n`;
    if (m.instructions) text += `ℹ️ *Nota:* ${m.instructions}\n`;

    navigator.clipboard.writeText(text);
    setCopySuccessMsg(`¡Datos de "${m.title}" copiados al portapapeles!`);
    setTimeout(() => setCopySuccessMsg(null), 3000);
  };

  const handleOpenNew = () => {
    setEditingMethod(null);
    setFormData({
      id: `pm-${Date.now()}`,
      country: selectedCountry === 'ALL' ? 'VE' : (selectedCountry as SupportedCountry),
      type: 'pago_movil',
      title: 'Pago Móvil Banco',
      currency: 'VES',
      is_active: true,
      bank_name: '',
      phone: '',
      tax_id: '',
      beneficiary: '',
      account_number: '',
      email: '',
      binance_id: '',
      wallet_address: '',
      network: 'Tron (TRC-20)',
      instructions: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: PaymentMethod) => {
    setEditingMethod(m);
    setFormData({ ...m });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    await savePaymentMethod(formData as PaymentMethod);
    setIsModalOpen(false);
  };

  const handleSaveRate = async (code: string) => {
    if (tempRate > 0) {
      await updateExchangeRate(code, tempRate);
    }
    setEditingRateCode(null);
  };

  // Cálculos de conversión rápida
  const getConvertedCalc = (targetCode: string) => {
    const fromCurr = currencies.find(c => c.code === calcFromCurrency) || { rate: 1.0 };
    const toCurr = currencies.find(c => c.code === targetCode) || { rate: 1.0, decimals: 2 };
    const inUSD = fromCurr.rate > 0 ? calcAmount / fromCurr.rate : calcAmount;
    const result = inUSD * toCurr.rate;
    const decimals = 'decimals' in toCurr ? toCurr.decimals : 2;
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(result);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 xl:p-8 min-w-0">
      {/* Toast de notificación de copiado */}
      {copySuccessMsg && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn border border-gray-700 max-w-md">
          <i className="fas fa-check-circle text-green-400 text-lg shrink-0"></i>
          <span className="text-xs sm:text-sm font-semibold truncate">{copySuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 overflow-hidden">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="p-3 sm:p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
            <i className="fas fa-money-bill-transfer text-xl sm:text-2xl"></i>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-secondary tracking-tight">
                Métodos de Pago & Multimoneda
              </h1>
              <span className="bg-blue-100 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                Multi-país
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Configura las cuentas de recepción de fondos por país (Zelle, Pago Móvil, Divisa, Binance USDT) y actualiza las tasas de cambio para facturación y cobros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleOpenNew}
            className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <i className="fas fa-plus"></i> Nuevo Método de Pago
          </button>
        </div>
      </div>

      {/* Banner de Detección Dinámica por Geolocalización (Latitud/Longitud) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl p-4 sm:p-5 lg:p-6 border border-indigo-900/50 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <div className="p-2.5 sm:p-3 bg-white/10 rounded-2xl text-amber-400 text-lg sm:text-xl backdrop-blur-sm shrink-0">
              <i className="fas fa-location-crosshairs"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider font-extrabold text-indigo-300">
                  Detección Dinámica por Geolocalización
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Activo
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <CountryFlag countryCode={detectedCountryInfo.code} className="w-5 h-5 sm:w-6 sm:h-6" />
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {detectedCountryInfo.name} ({detectedCountryInfo.code})
                </h3>
                <span className="text-xs text-indigo-200">
                  • Moneda Local: <span className="font-bold text-white">{detectedCountryInfo.currency}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-300 mt-1 flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                <span>
                  {detectedCoords 
                    ? `Coordenadas: [${detectedCoords.latitude.toFixed(4)}, ${detectedCoords.longitude.toFixed(4)}]` 
                    : `Detectado mediante: ${detectionSource}`}
                </span>
                <span className="text-white/40 hidden sm:inline">•</span>
                <span>Fuente: {detectionSource === 'geolocation' ? 'GPS Navegador' : 'Zona Horaria del Dispositivo'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto xl:shrink-0">
            <button
              type="button"
              onClick={() => setFilterByLocation(!filterByLocation)}
              className={`flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border whitespace-nowrap ${
                filterByLocation
                  ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <i className={`fas ${filterByLocation ? 'fa-filter-circle-xmark' : 'fa-filter'}`}></i>
              {filterByLocation ? 'Ver todos los métodos' : `Ver solo para ${detectedCountryInfo.code}`}
            </button>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              <i className={`fas fa-arrows-rotate ${isDetecting ? 'fa-spin' : ''}`}></i>
              {isDetecting ? 'Detectando...' : 'Re-detectar Ubicación'}
            </button>
          </div>
        </div>

        {/* Alerta si el negocio no ha configurado la tasa de cambio para el país detectado */}
        {!isDetectedCountryRateConfigured && (
          <div className="mt-4 pt-4 border-t border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30">
            <div className="flex items-start gap-3 min-w-0">
              <i className="fas fa-triangle-exclamation text-amber-400 text-lg mt-0.5 shrink-0"></i>
              <div className="text-xs min-w-0">
                <span className="font-black text-amber-300">
                  Tasa de cambio no configurada para {detectedCountryInfo.currency}:
                </span>
                <p className="text-gray-200 mt-0.5">
                  El negocio aún no tiene configurada una tasa de cambio activa para {detectedCountryInfo.name}. 
                  Los métodos de pago en moneda local ({detectedCountryInfo.currency}) 
                  permanecerán inactivos para los clientes hasta fijar una tasa mayor a 0.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingRateCode(detectedCountryInfo.currency);
                const curr = currencies.find(c => c.code === detectedCountryInfo.currency);
                setTempRate(curr?.rate || 0);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs whitespace-nowrap self-start sm:self-auto shrink-0 shadow-sm"
            >
              Fijar Tasa Ahora
            </button>
          </div>
        )}
      </div>

      {/* Tarjetas de Tasas de Cambio & Conversor Integrado (Responsive Grid) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Tasas de Cambio Live */}
        <div className="xl:col-span-7 bg-white rounded-3xl shadow-card border border-gray-100 p-4 sm:p-6 flex flex-col justify-between min-w-0 overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-4 sm:mb-5 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <i className="fas fa-chart-line text-lg"></i>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-secondary truncate">Tasas de Cambio Activas</h2>
                  <p className="text-xs text-gray-500 truncate">Valor de referencia relativo a 1 Dólar (USD)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm whitespace-nowrap"
                  title="Ver o registrar histórico de tasas del día"
                >
                  <i className="fas fa-clock-rotate-left"></i>
                  <span>Histórico</span>
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono leading-none">
                    {rateHistory.length}
                  </span>
                </button>
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                  Base: USD ($)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currencies.map(curr => {
                const isEditing = editingRateCode === curr.code;
                return (
                  <div
                    key={curr.code}
                    className={`p-3.5 rounded-2xl border transition-all min-w-0 overflow-hidden flex flex-col justify-between ${
                      curr.code === 'USD'
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-gray-50/70 hover:bg-white border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <CountryFlag countryCode={curr.code} className="w-5 h-5 shrink-0" />
                          <span className="font-extrabold text-sm text-gray-800 truncate">{curr.code}</span>
                        </div>
                        {curr.code !== 'USD' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditing) {
                                handleSaveRate(curr.code);
                              } else {
                                setEditingRateCode(curr.code);
                                setTempRate(curr.rate);
                              }
                            }}
                            className="text-xs text-primary hover:text-blue-700 font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-blue-50 transition shrink-0"
                            title={isEditing ? "Guardar tasa" : "Editar tasa"}
                          >
                            <i className={`fas ${isEditing ? 'fa-check text-green-600' : 'fa-pen text-gray-400'}`}></i>
                            <span className="text-[11px]">{isEditing ? 'Guardar' : 'Editar'}</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mb-2 truncate" title={curr.name}>{curr.name}</div>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 mt-1 min-w-0">
                          <input
                            type="number"
                            step="0.01"
                            value={tempRate}
                            onChange={e => setTempRate(parseFloat(e.target.value) || 0)}
                            className="w-full min-w-0 flex-1 px-2.5 py-1.5 text-sm font-bold border border-primary rounded-lg focus:outline-none bg-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRate(curr.code)}
                            className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs shrink-0"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-lg font-black text-secondary">
                            {curr.rate}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            {curr.symbol} / USD
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-400 mt-2 flex items-center justify-between gap-1 min-w-0">
                      <span className="truncate" title={curr.countries.join(', ')}>{curr.countries.join(', ')}</span>
                      {curr.code === 'VES' && <span className="font-bold text-emerald-600 shrink-0">Bs. Tasa Taller</span>}
                    </div>
                  </div>
                );
              })}

              {/* 6to Slot: Acceso directo al Histórico de Tasas del Día (completa el grid 3x2) */}
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="p-3.5 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/70 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[110px] min-w-0 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm shrink-0">
                  <i className="fas fa-clock-rotate-left text-xs"></i>
                </div>
                <span className="text-xs font-extrabold text-indigo-950 truncate max-w-full">Histórico del Día</span>
                <span className="text-[10px] font-semibold text-indigo-600 mt-0.5 truncate max-w-full">
                  {rateHistory.length} snapshots guardados
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Conversor Rápido en Vivo (Calculadora de Conversión Responsive) */}
        <div className="xl:col-span-5 bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-card p-4 sm:p-6 flex flex-col justify-between border border-gray-800 min-w-0 overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-primary/20 text-primary rounded-xl shrink-0">
                  <i className="fas fa-calculator text-base"></i>
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white truncate">
                    Calculadora de Conversión
                  </h3>
                  <p className="text-[11px] text-gray-400 truncate">Conversión en vivo con tasas activas</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Input Group Responsivo sin desbordamiento */}
              <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 transition min-w-0">
                <div className="min-w-0 flex-1 px-2 py-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block truncate">
                    Monto a Convertir
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={calcAmount}
                    onChange={e => setCalcAmount(parseFloat(e.target.value) || 0)}
                    className="w-full min-w-0 bg-transparent text-white font-black text-lg sm:text-xl outline-none placeholder-gray-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="shrink-0 flex items-center gap-1.5 bg-gray-800/90 hover:bg-gray-800 border border-white/15 rounded-xl px-2.5 py-2 transition">
                  <CountryFlag countryCode={calcFromCurrency} className="w-4 h-4 shrink-0" />
                  <select
                    value={calcFromCurrency}
                    onChange={e => setCalcFromCurrency(e.target.value)}
                    className="bg-transparent text-white font-extrabold text-xs outline-none cursor-pointer pr-1"
                    aria-label="Moneda de origen"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code} className="bg-gray-900 text-white">
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resultados en tiempo real: 2 cols en tablet/móvil ancho, 1 col en panel lateral xl */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-extrabold block mb-2.5">
                  Equivalencias Actuales:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                  {currencies
                    .filter(c => c.code !== calcFromCurrency)
                    .map(targetCurr => (
                      <div
                        key={targetCurr.code}
                        className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 transition border border-white/10 rounded-xl px-3 py-2 text-xs min-w-0"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <CountryFlag countryCode={targetCurr.code} className="w-4 h-4 shrink-0" />
                          <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                            <span className="font-extrabold text-white text-xs shrink-0">{targetCurr.code}</span>
                            <span className="text-[10px] text-gray-400 truncate">{targetCurr.name}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-baseline gap-1">
                          <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                            {getConvertedCalc(targetCurr.code)}
                          </span>
                          <span className="text-[10px] text-gray-300 font-semibold">{targetCurr.symbol}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <span className="text-[11px] text-gray-400">
              Cotizaciones automáticas calculadas con las tasas guardadas.
            </span>
          </div>
        </div>
      </div>

      {/* Pestañas por País & Buscador (Responsive) */}
      <div className="space-y-3 min-w-0">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 min-w-0">
          {/* Tabs con flex-wrap para que ninguna pestaña quede cortada */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-100/90 border border-gray-200/70 rounded-2xl min-w-0">
            <button
              type="button"
              onClick={() => setSelectedCountry('ALL')}
              className={`px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                selectedCountry === 'ALL'
                  ? 'bg-white text-secondary shadow-sm ring-1 ring-gray-200/80'
                  : 'bg-white/40 hover:bg-white text-gray-700 hover:text-secondary'
              }`}
            >
              <span>🌎</span>
              <span>Todos los Países</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                selectedCountry === 'ALL'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-200/80 text-gray-700'
              }`}>
                {paymentMethods.length}
              </span>
            </button>
            {COUNTRIES.map(ctry => {
              const count = paymentMethods.filter(p => p.country === ctry.code).length;
              const isSelected = selectedCountry === ctry.code;
              return (
                <button
                  type="button"
                  key={ctry.code}
                  onClick={() => setSelectedCountry(ctry.code)}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white text-secondary shadow-sm ring-1 ring-gray-200/80'
                      : 'bg-white/40 hover:bg-white text-gray-700 hover:text-secondary'
                  }`}
                >
                  <CountryFlag countryCode={ctry.code} className="w-4 h-4 shrink-0" />
                  <span>{ctry.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-200/80 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Buscador responsivo */}
          <div className="relative w-full 2xl:w-72 shrink-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por banco, teléfono, Zelle, Binance..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none text-xs bg-white"
            />
          </div>
        </div>

        {/* Filtros de Tipo con flex-wrap para visualización completa */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {[
            { id: 'ALL', label: 'Todos los Tipos', country: undefined },
            { id: 'pago_movil', label: '📱 Pago Móvil', country: undefined },
            { id: 'zelle', label: '💵 Zelle', country: undefined },
            { id: 'usdt', label: '🟡 Binance USDT', country: undefined },
            { id: 'divisa', label: '💶 Divisa en Efectivo', country: undefined },
            { id: 'transferencia', label: '🏦 Transferencias Bancarias', country: undefined },
            { id: 'nequi', label: 'Nequi / Daviplata', country: 'CO' },
            { id: 'bizum', label: 'Bizum', country: 'ES' }
          ].map(type => (
            <button
              type="button"
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                selectedType === type.id
                  ? 'bg-secondary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type.country && <CountryFlag countryCode={type.country} className="w-3.5 h-3.5 shrink-0" />}
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Alerta de País sin Tasa de Cambio */}
      {selectedCountry !== 'ALL' && selectedCountry !== 'GLOBAL' && !isRateConfiguredForCountry(selectedCountry as SupportedCountry) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <i className="fas fa-triangle-exclamation text-lg"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-900">
                Tasa de cambio no fijada para este país
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Para que los clientes puedan pagar usando métodos en moneda local, el taller debe configurar una tasa de cambio mayor a 0. Mientras tanto, estos métodos se mantienen desactivados para el cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const ctry = COUNTRIES.find(c => c.code === selectedCountry);
              if (ctry) {
                setEditingRateCode(ctry.currency);
                const curr = currencies.find(c => c.code === ctry.currency);
                setTempRate(curr?.rate || 0);
              }
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition self-start sm:self-auto shrink-0"
          >
            Fijar Tasa Ahora
          </button>
        </div>
      )}

      {/* Grid de Métodos de Pago */}
      {filteredMethods.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-200 shadow-card">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
            <i className="fas fa-credit-card"></i>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-700">No se encontraron métodos de pago</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
            No hay registros que coincidan con los filtros seleccionados. Puedes crear uno nuevo haciendo clic en el botón superior.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="mt-5 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-600 transition"
          >
            Agregar Método de Pago
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredMethods.map(method => {
            const isMethodRateReady = isRateConfiguredForCountry(method.country) || method.currency === 'USD' || method.currency === 'USDT';
            
            // Icono según el tipo
            let typeIcon = 'fas fa-money-check-dollar';
            let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';

            if (method.type === 'pago_movil') {
              typeIcon = 'fas fa-mobile-screen-button';
              badgeBg = 'bg-cyan-50 text-cyan-800 border-cyan-200';
            } else if (method.type === 'zelle') {
              typeIcon = 'fas fa-bolt';
              badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
            } else if (method.type === 'usdt') {
              typeIcon = 'fas fa-coins';
              badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
            } else if (method.type === 'divisa') {
              typeIcon = 'fas fa-hand-holding-dollar';
              badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            }

            return (
              <div
                key={method.id}
                className={`bg-white rounded-3xl border transition-all duration-200 p-4 sm:p-6 flex flex-col justify-between min-w-0 overflow-hidden ${
                  !isMethodRateReady
                    ? 'border-amber-200 bg-amber-50/20'
                    : method.is_active
                      ? 'border-gray-200 shadow-card hover:shadow-lg'
                      : 'border-dashed border-gray-300 opacity-60 bg-gray-50/50'
                }`}
              >
                <div className="min-w-0">
                  {/* Top Bar de la Tarjeta */}
                  <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`p-2.5 sm:p-3 rounded-2xl border text-lg sm:text-xl shrink-0 ${badgeBg}`}>
                        <i className={typeIcon}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <CountryFlag countryCode={method.country} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                          <span className="font-extrabold text-sm text-secondary leading-snug break-words" title={method.title}>
                            {method.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-bold text-primary inline-block">
                            Moneda: {method.currency}
                          </span>
                          {!isMethodRateReady && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              Sin Tasa Fijada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Switch de Activo/Inactivo */}
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod(method.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold transition flex items-center gap-1.5 shrink-0 ${
                        method.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={method.is_active ? 'Desactivar método' : 'Activar método'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${method.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                      {method.is_active ? 'Activo' : 'Pausado'}
                    </button>
                  </div>

                  {/* Detalles específicos del método */}
                  <div className="space-y-2 text-xs bg-gray-50/70 p-3.5 sm:p-4 rounded-2xl border border-gray-100 my-3 min-w-0 overflow-hidden">
                    {method.bank_name && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-gray-500 shrink-0">Banco:</span>
                        <span className="font-bold text-gray-800 truncate text-right" title={method.bank_name}>{method.bank_name}</span>
                      </div>
                    )}
                    {method.phone && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-gray-500 shrink-0">Teléfono:</span>
                        <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 truncate">
                          {method.phone}
                        </span>
                      </div>
                    )}
                    {method.tax_id && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-gray-500 shrink-0">Cédula / RIF / NIT:</span>
                        <span className="font-mono font-bold text-gray-800 truncate">{method.tax_id}</span>
                      </div>
                    )}
                    {method.beneficiary && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-gray-500 shrink-0">Titular:</span>
                        <span className="font-bold text-gray-800 truncate text-right" title={method.beneficiary}>
                          {method.beneficiary}
                        </span>
                      </div>
                    )}
                    {method.account_number && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-gray-200 min-w-0">
                        <span className="text-gray-500 text-[11px]">Número de Cuenta:</span>
                        <span className="font-mono font-bold text-gray-900 text-[11px] bg-white p-1.5 rounded border border-gray-200 select-all break-all">
                          {method.account_number}
                        </span>
                      </div>
                    )}
                    {method.email && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-gray-500 shrink-0">Correo / Zelle:</span>
                        <span className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded border border-gray-200 select-all truncate" title={method.email}>
                          {method.email}
                        </span>
                      </div>
                    )}
                    {method.binance_id && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-gray-500 shrink-0">Binance Pay ID:</span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 select-all truncate">
                          {method.binance_id}
                        </span>
                      </div>
                    )}
                    {method.wallet_address && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-gray-200 min-w-0">
                        <div className="flex items-center justify-between text-[11px] gap-2">
                          <span className="text-gray-500 truncate">Red: {method.network || 'TRC20'}</span>
                          <span className="text-amber-600 font-bold shrink-0">Billetera USDT</span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-700 bg-white p-1.5 rounded border border-gray-200 break-all select-all">
                          {method.wallet_address}
                        </span>
                      </div>
                    )}

                    {method.instructions && (
                      <div className="text-[11px] text-gray-500 italic pt-1 border-t border-gray-200 break-words">
                        "{method.instructions}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyPaymentInfo(method)}
                    className="flex-1 px-3 py-2 bg-blue-50/70 hover:bg-blue-100/70 text-primary font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                    title="Copiar datos estructurados para enviar por WhatsApp o SMS"
                  >
                    <i className="fas fa-copy"></i>
                    <span>Copiar Datos</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(method)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-xl transition"
                      title="Editar método"
                    >
                      <i className="fas fa-pen text-xs"></i>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`¿Deseas eliminar el método "${method.title}"?`)) {
                          await deletePaymentMethod(method.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Eliminar método"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear / Editar Método de Pago */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-strong max-w-2xl w-full max-h-[90vh] flex flex-col mx-auto animate-fadeIn overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 sm:p-3 bg-blue-50 text-primary rounded-2xl shrink-0">
                  <i className="fas fa-credit-card text-lg sm:text-xl"></i>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-secondary truncate">
                    {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">Configura los datos bancarios o billetera para cobros</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200/50 rounded-xl transition text-gray-400 hover:text-gray-600 shrink-0"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* País */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">País *</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 pointer-events-none flex items-center">
                        <CountryFlag countryCode={formData.country || 'VE'} className="w-4 h-4" />
                      </span>
                      <select
                        value={formData.country}
                        onChange={e => {
                          const newCountry = e.target.value as SupportedCountry;
                          const match = COUNTRIES.find(c => c.code === newCountry);
                          setFormData({
                            ...formData,
                            country: newCountry,
                            currency: match?.currencyCode || 'USD'
                          });
                        }}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs font-semibold bg-white"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tipo de Método */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipo de Método *</label>
                    <select
                      value={formData.type}
                      onChange={e => {
                        const t = e.target.value as PaymentMethodType;
                        let autoTitle = formData.title;
                        let autoCurr = formData.currency;

                        if (t === 'pago_movil') {
                          autoTitle = 'Pago Móvil (Interbancario)';
                          autoCurr = 'VES';
                        } else if (t === 'zelle') {
                          autoTitle = 'Zelle';
                          autoCurr = 'USD';
                        } else if (t === 'usdt') {
                          autoTitle = 'USDT (Binance Pay)';
                          autoCurr = 'USDT';
                        } else if (t === 'divisa') {
                          autoTitle = 'Divisa en Efectivo (USD)';
                          autoCurr = 'USD';
                        } else if (t === 'nequi') {
                          autoTitle = 'Nequi / Daviplata';
                          autoCurr = 'COP';
                        } else if (t === 'bizum') {
                          autoTitle = 'Bizum';
                          autoCurr = 'EUR';
                        }

                        setFormData({ ...formData, type: t, title: autoTitle, currency: autoCurr });
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs font-semibold bg-white"
                    >
                      <option value="pago_movil">📱 Pago Móvil (Venezuela)</option>
                      <option value="zelle">💵 Zelle (USD)</option>
                      <option value="usdt">🟡 USDT (Binance Pay / Crypto)</option>
                      <option value="divisa">💶 Divisa / Efectivo</option>
                      <option value="transferencia">🏦 Transferencia Bancaria Nacional</option>
                      <option value="nequi">📲 Nequi / Daviplata (Colombia)</option>
                      <option value="bizum">📲 Bizum (España)</option>
                      <option value="otro">⚙️ Otro Método</option>
                    </select>
                  </div>

                  {/* Título */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Título del Método *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej: Pago Móvil Banesco / Zelle Corporativo / USDT Binance"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
                    />
                  </div>

                  {/* Moneda */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Moneda Recibida *</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 pointer-events-none flex items-center">
                        <CountryFlag countryCode={formData.currency || 'USD'} className="w-4 h-4" />
                      </span>
                      <select
                        value={formData.currency}
                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs font-semibold bg-white"
                      >
                        {currencies.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Estado Activo */}
                  <div className="flex items-center gap-3 sm:pt-6">
                    <input
                      type="checkbox"
                      id="is_active_checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                    <label htmlFor="is_active_checkbox" className="text-xs font-bold text-gray-700 cursor-pointer">
                      Método Activo para Clientes
                    </label>
                  </div>
                </div>

                {/* Campos dinámicos según el tipo */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                    Detalles de la Cuenta / Receptor
                  </h4>

                  {/* Si es Banco o Pago Móvil */}
                  {(formData.type === 'pago_movil' || formData.type === 'transferencia' || formData.type === 'nequi') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Banco / Entidad</label>
                        <input
                          type="text"
                          value={formData.bank_name || ''}
                          onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                          placeholder="Ej: Banco de Venezuela (0102) / Banesco"
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono Móvil</label>
                        <input
                          type="text"
                          value={formData.phone || ''}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Ej: 0414-1234567"
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* Titular y Cédula/RIF */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Cédula / RIF / NIT</label>
                      <input
                        type="text"
                        value={formData.tax_id || ''}
                        onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                        placeholder="Ej: V-12345678 / J-50123456-7"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Titular / Beneficiario</label>
                      <input
                        type="text"
                        value={formData.beneficiary || ''}
                        onChange={e => setFormData({ ...formData, beneficiary: e.target.value })}
                        placeholder="Ej: Taller Mecánico 360 C.A."
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Número de Cuenta (si aplica) */}
                  {(formData.type === 'transferencia' || formData.type === 'pago_movil') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Número de Cuenta Bancaria</label>
                      <input
                        type="text"
                        value={formData.account_number || ''}
                        onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                        placeholder="Ej: 0102-0123-45-0000123456 (20 dígitos)"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Zelle o Correo */}
                  {(formData.type === 'zelle' || formData.type === 'usdt') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico (Zelle/Pay)</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Ej: pagos.taller360@gmail.com"
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-primary"
                        />
                      </div>
                      {formData.type === 'usdt' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Binance Pay ID</label>
                          <input
                            type="text"
                            value={formData.binance_id || ''}
                            onChange={e => setFormData({ ...formData, binance_id: e.target.value })}
                            placeholder="Ej: 284910283 (9 dígitos)"
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Crypto Billetera y Red */}
                  {formData.type === 'usdt' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Red Blockchain</label>
                        <select
                          value={formData.network || 'Tron (TRC-20)'}
                          onChange={e => setFormData({ ...formData, network: e.target.value })}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none bg-white font-semibold"
                        >
                          <option value="Tron (TRC-20)">Tron (TRC-20) - Recomendada</option>
                          <option value="BNB Smart Chain (BEP-20)">BNB Smart Chain (BEP-20)</option>
                          <option value="Ethereum (ERC-20)">Ethereum (ERC-20)</option>
                          <option value="Polygon">Polygon</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Dirección de Billetera USDT</label>
                        <input
                          type="text"
                          value={formData.wallet_address || ''}
                          onChange={e => setFormData({ ...formData, wallet_address: e.target.value })}
                          placeholder="Ej: TQrL7YF45dM2qN9c8Pz1V8kJ6xR2mP7tWv"
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* Instrucciones adicionales */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Instrucciones o Notas para el Cliente
                    </label>
                    <textarea
                      rows={2}
                      value={formData.instructions || ''}
                      onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Ej: Enviar comprobante al WhatsApp indicando número de presupuesto y placa."
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="p-4 sm:p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 sm:px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-600 transition font-bold text-xs shadow-md"
                >
                  {editingMethod ? 'Guardar Cambios' : 'Crear Método'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Tasas del Día */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden mx-auto">
            {/* Header del Modal */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 sm:p-3 bg-white/10 rounded-2xl text-amber-400 text-lg sm:text-xl shrink-0">
                  <i className="fas fa-clock-rotate-left"></i>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black tracking-tight truncate">Histórico de Tasas del Día</h3>
                  <p className="text-xs text-indigo-200 truncate">
                    Registro auditable de variaciones de tasas de cambio y snapshots diarios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition shrink-0"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Formulario para registrar una tasa del día */}
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-plus-circle text-primary text-sm"></i>
                  <h4 className="font-extrabold text-xs text-secondary uppercase tracking-wider">
                    Registrar Tasa del Día en el Histórico
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Moneda</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 pointer-events-none flex items-center">
                        <CountryFlag countryCode={histForm.currency} className="w-4 h-4" />
                      </span>
                      <select
                        value={histForm.currency}
                        onChange={e => {
                          const curr = currencies.find(c => c.code === e.target.value);
                          setHistForm({
                            ...histForm,
                            currency: e.target.value,
                            rate: curr?.rate || 0
                          });
                        }}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none bg-white focus:border-primary"
                      >
                        {currencies.filter(c => c.code !== 'USD').map(c => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Tasa de Cambio</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="0.00"
                      value={histForm.rate || ''}
                      onChange={e => setHistForm({ ...histForm, rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Fuente</label>
                    <select
                      value={histForm.source}
                      onChange={e => setHistForm({ ...histForm, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-primary"
                    >
                      <option value="BCV Oficial">BCV Oficial (Venezuela)</option>
                      <option value="Monitor Paralelo">Monitor Paralelo (Venezuela)</option>
                      <option value="TRM Oficial">TRM Oficial (Colombia)</option>
                      <option value="Binance P2P">Binance P2P (USDT)</option>
                      <option value="Banco Central Europeo">Banco Central Europeo (EUR)</option>
                      <option value="Manual Taller">Manual del Taller</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Nota o Referencia</label>
                    <input
                      type="text"
                      placeholder="Ej: Cierre de jornada"
                      value={histForm.notes}
                      onChange={e => setHistForm({ ...histForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary bg-white"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={isSavingHistory || histForm.rate <= 0}
                    onClick={async () => {
                      if (histForm.rate <= 0) return;
                      setIsSavingHistory(true);
                      await updateExchangeRate(histForm.currency, histForm.rate, histForm.source, histForm.notes);
                      setIsSavingHistory(false);
                      setHistForm({ ...histForm, notes: 'Actualizado' });
                    }}
                    className="w-full sm:w-auto justify-center px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <i className={`fas fa-floppy-disk ${isSavingHistory ? 'animate-spin' : ''}`}></i>
                    {isSavingHistory ? 'Guardando...' : 'Guardar y Fijar como Tasa Activa'}
                  </button>
                </div>
              </div>

              {/* Filtro y Lista de Historial */}
              <div className="space-y-3 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <span>Línea de Tiempo del Histórico</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                      {rateHistory.length} registros
                    </span>
                  </h4>

                  {/* Filtro por moneda */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {['ALL', 'VES', 'COP', 'EUR', 'USDT'].map(code => (
                      <button
                        type="button"
                        key={code}
                        onClick={() => setHistoryCurrencyFilter(code)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 ${
                          historyCurrencyFilter === code
                            ? 'bg-secondary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {code !== 'ALL' && <CountryFlag countryCode={code} className="w-3.5 h-3.5 shrink-0" />}
                        <span>{code === 'ALL' ? 'Todas' : code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {rateHistory.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-400">
                    <i className="fas fa-calendar-xmark text-2xl mb-2"></i>
                    <p className="text-xs font-bold text-gray-500">No hay tasas registradas en el histórico todavía</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Cada vez que actualices o guardes una tasa en la lambda, se creará un snapshot automático aquí.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs min-w-[540px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold text-[11px]">
                            <th className="p-3 whitespace-nowrap">Fecha y Hora</th>
                            <th className="p-3 whitespace-nowrap">Moneda</th>
                            <th className="p-3 whitespace-nowrap">Tasa Registrada</th>
                            <th className="p-3 whitespace-nowrap">Fuente</th>
                            <th className="p-3">Notas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rateHistory
                            .filter(h => historyCurrencyFilter === 'ALL' || (h.currency || h.currency_code) === historyCurrencyFilter)
                            .map((entry, idx) => {
                              const entryCurrency = entry.currency || entry.currency_code || 'USD';
                              const recordDate = entry.recorded_at || entry.timestamp || entry.date;
                              return (
                                <tr key={entry.id || idx} className="hover:bg-blue-50/30 transition">
                                  <td className="p-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                    {recordDate ? new Date(recordDate).toLocaleString('es-VE') : 'Hoy'}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                      <CountryFlag countryCode={entryCurrency} className="w-4 h-4 shrink-0" />
                                      <span>{entryCurrency}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <span className="font-extrabold font-mono text-sm text-secondary">
                                      {entry.rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-1">/ USD</span>
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {entry.source || 'BCV / Sistema'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-gray-600 text-[11px]">
                                    {entry.notes || '-'}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
