import React from 'react';

interface FuelGaugeSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

const FUEL_LEVELS = [
  { id: 'Reserva', label: 'Reserva (E)', angle: -65, color: '#ef4444', percent: '0-10%' },
  { id: '1/4', label: '1/4 Tanque', angle: -32.5, color: '#f59e0b', percent: '25%' },
  { id: '1/2', label: '1/2 Tanque', angle: 0, color: '#10b981', percent: '50%' },
  { id: '3/4', label: '3/4 Tanque', angle: 32.5, color: '#10b981', percent: '75%' },
  { id: 'Lleno', label: 'Lleno (F)', angle: 65, color: '#3b82f6', percent: '100%' }
];

export const FuelGaugeSelector: React.FC<FuelGaugeSelectorProps> = ({ value, onChange }) => {
  const current = FUEL_LEVELS.find(l => l.id === value) || FUEL_LEVELS[2]; // default 1/2
  const needleAngle = current.angle;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <i className="fas fa-gas-pump text-amber-400"></i> Nivel de Combustible
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-white border border-slate-700">
          Selección: <strong style={{ color: current.color }}>{current.id}</strong> ({current.percent})
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* SVG Gauge */}
        <div className="relative w-48 h-28 flex items-center justify-center">
          <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
            {/* Background Arc */}
            <path
              d="M 25 100 A 75 75 0 0 1 175 100"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Red Zone Arc (Reserve) */}
            <path
              d="M 25 100 A 75 75 0 0 1 45 65"
              fill="none"
              stroke="#ef4444"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Green / Normal Zone Arc */}
            <path
              d="M 55 52 A 75 75 0 0 1 175 100"
              fill="none"
              stroke="#10b981"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />

            {/* Dial Tick Labels */}
            <text x="18" y="112" fill="#ef4444" fontSize="12" fontWeight="bold" textAnchor="middle">E</text>
            <text x="56" y="44" fill="#94a3b8" fontSize="10" textAnchor="middle">1/4</text>
            <text x="100" y="22" fill="#94a3b8" fontSize="11" fontWeight="600" textAnchor="middle">1/2</text>
            <text x="144" y="44" fill="#94a3b8" fontSize="10" textAnchor="middle">3/4</text>
            <text x="182" y="112" fill="#3b82f6" fontSize="12" fontWeight="bold" textAnchor="middle">F</text>

            {/* Central Gas Pump Icon in SVG */}
            <circle cx="100" cy="85" r="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <path d="M 98 81 h 4 v 8 h -4 z" fill="#f59e0b" />

            {/* Needle Pivot & Needle */}
            <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-500 ease-out">
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="34"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="drop-shadow(0 0 4px rgba(244,63,94,0.6))"
              />
              <circle cx="100" cy="100" r="6" fill="#f43f5e" />
              <circle cx="100" cy="100" r="2.5" fill="#ffffff" />
            </g>
          </svg>
        </div>

        {/* Level Buttons for fast tablet/mobile selection */}
        <div className="grid grid-cols-5 sm:grid-cols-1 sm:w-48 gap-1.5 w-full">
          {FUEL_LEVELS.map((item) => {
            const isSelected = value === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-between gap-1 text-center ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md transform scale-[1.02]'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  {item.id}
                </span>
                <span className="hidden sm:inline text-[11px] opacity-75">{item.percent}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default FuelGaugeSelector;
