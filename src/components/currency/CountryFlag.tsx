import React from 'react';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
  showFallbackText?: boolean;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode,
  className = 'w-5 h-5',
}) => {
  const code = (countryCode || '').toUpperCase().trim();

  // Venezuela (VE / VES)
  if (code === 'VE' || code === 'VES') {
    return (
      <span className={`inline-flex items-center justify-center rounded-full overflow-hidden shadow-xs ring-1 ring-black/10 shrink-0 ${className}`}>
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#ffcc00" d="M0 0h640v160H0z" />
          <path fill="#00247d" d="M0 160h640v160H0z" />
          <path fill="#cf142b" d="M0 320h640v160H0z" />
          <g fill="#fff">
            <circle cx="320" cy="235" r="5" />
            <circle cx="285" cy="242" r="5" />
            <circle cx="355" cy="242" r="5" />
            <circle cx="255" cy="260" r="5" />
            <circle cx="385" cy="260" r="5" />
            <circle cx="235" cy="285" r="5" />
            <circle cx="405" cy="285" r="5" />
            <circle cx="225" cy="315" r="5" />
          </g>
        </svg>
      </span>
    );
  }

  // Colombia (CO / COP)
  if (code === 'CO' || code === 'COP') {
    return (
      <span className={`inline-flex items-center justify-center rounded-full overflow-hidden shadow-xs ring-1 ring-black/10 shrink-0 ${className}`}>
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#ffd100" d="M0 0h640v240H0z" />
          <path fill="#003893" d="M0 240h640v120H0z" />
          <path fill="#ce1126" d="M0 360h640v120H0z" />
        </svg>
      </span>
    );
  }

  // Estados Unidos (US / USD)
  if (code === 'US' || code === 'USD') {
    return (
      <span className={`inline-flex items-center justify-center rounded-full overflow-hidden shadow-xs ring-1 ring-black/10 shrink-0 ${className}`}>
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#bd3d44" d="M0 0h640v480H0z" />
          <path stroke="#fff" strokeWidth="37" d="M0 55h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640" />
          <path fill="#192f5d" d="M0 0h260v260H0z" />
          <g fill="#fff">
            <circle cx="40" cy="40" r="8" />
            <circle cx="100" cy="40" r="8" />
            <circle cx="160" cy="40" r="8" />
            <circle cx="220" cy="40" r="8" />
            <circle cx="70" cy="90" r="8" />
            <circle cx="130" cy="90" r="8" />
            <circle cx="190" cy="90" r="8" />
            <circle cx="40" cy="140" r="8" />
            <circle cx="100" cy="140" r="8" />
            <circle cx="160" cy="140" r="8" />
            <circle cx="220" cy="140" r="8" />
          </g>
        </svg>
      </span>
    );
  }

  // España / Europa (ES / EUR / EU)
  if (code === 'ES' || code === 'EUR' || code === 'EU') {
    return (
      <span className={`inline-flex items-center justify-center rounded-full overflow-hidden shadow-xs ring-1 ring-black/10 shrink-0 ${className}`}>
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#c60b1e" d="M0 0h640v120H0zm0 360h640v120H0z" />
          <path fill="#ffc400" d="M0 120h640v240H0z" />
          <circle cx="200" cy="240" r="45" fill="#c60b1e" opacity="0.8" />
        </svg>
      </span>
    );
  }

  // Internacional / Global
  if (code === 'GLOBAL') {
    return (
      <span className={`inline-flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs shrink-0 p-0.5 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-current" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8" />
          <path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18z" />
        </svg>
      </span>
    );
  }

  // Binance USDT / Cripto
  if (code === 'USDT' || code === 'CRYPTO') {
    return (
      <span className={`inline-flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs shrink-0 p-0.5 ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1.2 5.3v1.4h3.6v1.9h-3.6v1.2c2.8.2 4.9.8 4.9 1.6s-2.1 1.4-4.9 1.6v3.7h-2.4v-3.7c-2.8-.2-4.9-.8-4.9-1.6s2.1-1.4 4.9-1.6v-1.2H7.2V8.7h3.6V7.3h2.4z" />
        </svg>
      </span>
    );
  }

  // Fallback genérico
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px] shrink-0 ${className}`}>
      {code.slice(0, 2)}
    </span>
  );
};
