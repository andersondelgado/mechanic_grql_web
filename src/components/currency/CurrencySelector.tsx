import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { Link } from 'react-router-dom';

export default function CurrencySelector() {
  const { currencies, currentCurrency, setCurrencyCode } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-xs transition text-xs font-semibold text-gray-700"
        title="Cambiar moneda de visualización"
      >
        <span className="text-base">{currentCurrency.flag}</span>
        <span className="font-bold text-gray-800">{currentCurrency.code}</span>
        {currentCurrency.code !== 'USD' && (
          <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
            ({currentCurrency.rate} {currentCurrency.symbol})
          </span>
        )}
        <i className={`fas fa-chevron-down text-[10px] text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-fadeIn text-xs">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-gray-800">Moneda del Sistema</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">Base: USD</span>
          </div>

          <div className="py-1 space-y-1">
            {currencies.map(curr => {
              const isSelected = curr.code === currentCurrency.code;
              return (
                <button
                  key={curr.code}
                  onClick={() => {
                    setCurrencyCode(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                    isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{curr.flag}</span>
                    <div className="text-left">
                      <div className="font-bold leading-tight">{curr.code} - {curr.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {curr.code === 'USD' ? 'Moneda base ($)' : `1 USD = ${curr.rate} ${curr.symbol}`}
                      </div>
                    </div>
                  </div>
                  {isSelected && <i className="fas fa-check text-primary text-xs"></i>}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 mt-1">
            <Link
              to="/metodos-pago"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-center text-[11px] font-bold text-primary hover:text-blue-700 transition"
            >
              <i className="fas fa-sliders-h text-[10px]"></i>
              <span>Gestionar Tasas y Pagos</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
