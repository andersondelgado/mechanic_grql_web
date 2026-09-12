import React, { useState, useRef } from 'react';
import type { DamagePoint } from '../../types/entities';

interface VehicleDamageCanvasProps {
  damagePoints: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
}

type CarView = 'top' | 'left' | 'right' | 'front' | 'back';

const DAMAGE_TYPES = [
  { id: 'scratch', label: 'Rayón / Arañazo', code: 'R', color: '#eab308', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'dent', label: 'Golpe / Abolladura', code: 'G', color: '#ef4444', bg: 'bg-red-100 text-red-800 border-red-300' },
  { id: 'broken', label: 'Quebrado / Roto', code: 'Q', color: '#a855f7', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'missing', label: 'Falta Pieza / Suelto', code: 'F', color: '#3b82f6', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
] as const;

export const VehicleDamageCanvas: React.FC<VehicleDamageCanvasProps> = ({ damagePoints = [], onChange }) => {
  const [activeView, setActiveView] = useState<CarView>('top');
  const [selectedDamageType, setSelectedDamageType] = useState<DamagePoint['type']>('scratch');
  const [tempNote, setTempNote] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPoint: DamagePoint = {
      id: `dmg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      view: activeView,
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
      type: selectedDamageType,
      notes: tempNote.trim() || undefined
    };

    onChange([...damagePoints, newPoint]);
    setTempNote('');
  };

  const handleRemovePoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(damagePoints.filter(p => p.id !== id));
  };

  const handleUpdateNote = (id: string, notes: string) => {
    onChange(damagePoints.map(p => p.id === id ? { ...p, notes } : p));
  };

  const currentViewPoints = damagePoints.filter(p => p.view === activeView);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
        <div>
          <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-car-crash text-rose-500"></i> Diagrama Visual de Daños y Carrocería
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Selecciona el tipo de daño y haz clic directamente sobre la carrocería para marcar la ubicación exacta.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl">
          {(['top', 'left', 'right', 'front', 'back'] as CarView[]).map(view => {
            const count = damagePoints.filter(p => p.view === view).length;
            const labels: Record<CarView, string> = {
              top: 'Superior / Techo',
              left: 'Lateral Izq.',
              right: 'Lateral Der.',
              front: 'Frente',
              back: 'Trasera'
            };
            return (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === view
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                {labels[view]}
                {count > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Palette: Damage Type Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
        <span className="text-xs font-bold text-gray-600 mr-2">Herramienta:</span>
        {DAMAGE_TYPES.map(type => (
          <button
            key={type.id}
            type="button"
            onClick={() => setSelectedDamageType(type.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${
              selectedDamageType === type.id
                ? `${type.bg} ring-2 ring-offset-1 ring-primary shadow-sm scale-105`
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-black"
              style={{ backgroundColor: type.color }}
            >
              {type.code}
            </span>
            {type.label}
          </button>
        ))}

        <div className="flex-1 min-w-[200px] ml-auto">
          <input
            type="text"
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            placeholder="Nota del siguiente punto (opcional)..."
            className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
          />
        </div>
      </div>

      {/* Interactive Silhouette Canvas */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-4 bg-slate-50 flex items-center justify-center min-h-[300px] select-none">
        <div
          ref={containerRef}
          onClick={handleCanvasClick}
          className="relative w-full max-w-xl h-64 sm:h-72 cursor-crosshair flex items-center justify-center"
        >
          {/* SVG Silhouette depending on activeView */}
          {activeView === 'top' && (
            <svg viewBox="0 0 400 200" className="w-full h-full text-slate-400 drop-shadow-md pointer-events-none">
              {/* Top View Car */}
              <rect x="50" y="25" width="300" height="150" rx="35" fill="#f1f5f9" stroke="#64748b" strokeWidth="2.5" />
              {/* Windshield front */}
              <path d="M 120 40 Q 140 70 140 100 Q 140 130 120 160 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              {/* Rear glass */}
              <path d="M 280 45 Q 265 70 265 100 Q 265 130 280 155 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              {/* Roof */}
              <rect x="145" y="45" width="115" height="110" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Hood line */}
              <path d="M 50 100 H 120" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Trunk line */}
              <path d="M 280 100 H 350" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Wheels */}
              <rect x="90" y="10" width="45" height="15" rx="3" fill="#334155" />
              <rect x="265" y="10" width="45" height="15" rx="3" fill="#334155" />
              <rect x="90" y="175" width="45" height="15" rx="3" fill="#334155" />
              <rect x="265" y="175" width="45" height="15" rx="3" fill="#334155" />
              {/* Direction text */}
              <text x="70" y="105" fill="#64748b" fontSize="12" fontWeight="bold" textAnchor="middle">FRENTE</text>
              <text x="320" y="105" fill="#64748b" fontSize="12" fontWeight="bold" textAnchor="middle">MALETA</text>
            </svg>
          )}

          {activeView === 'left' && (
            <svg viewBox="0 0 500 180" className="w-full h-full text-slate-400 drop-shadow-md pointer-events-none">
              {/* Left Side Profile */}
              <path
                d="M 30 120 L 70 115 L 120 85 L 180 50 L 320 50 L 390 85 L 470 95 L 480 125 L 460 135 L 420 135 A 35 35 0 0 0 350 135 L 190 135 A 35 35 0 0 0 120 135 L 50 135 Z"
                fill="#f1f5f9"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              {/* Windows */}
              <path d="M 185 58 L 245 58 L 245 88 L 138 88 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              <path d="M 255 58 L 315 58 L 375 88 L 255 88 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              {/* Wheels */}
              <circle cx="155" cy="135" r="26" fill="#334155" />
              <circle cx="155" cy="135" r="14" fill="#94a3b8" />
              <circle cx="385" cy="135" r="26" fill="#334155" />
              <circle cx="385" cy="135" r="14" fill="#94a3b8" />
              {/* Doors line */}
              <line x1="250" y1="58" x2="250" y2="135" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="60" y="105" fill="#64748b" fontSize="11" fontWeight="bold">FRENTE</text>
              <text x="440" y="105" fill="#64748b" fontSize="11" fontWeight="bold">ATRÁS</text>
            </svg>
          )}

          {activeView === 'right' && (
            <svg viewBox="0 0 500 180" className="w-full h-full text-slate-400 drop-shadow-md pointer-events-none">
              {/* Right Side Profile (Inverted) */}
              <path
                d="M 470 120 L 430 115 L 380 85 L 320 50 L 180 50 L 110 85 L 30 95 L 20 125 L 40 135 L 80 135 A 35 35 0 0 1 150 135 L 310 135 A 35 35 0 0 1 380 135 L 450 135 Z"
                fill="#f1f5f9"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              {/* Windows */}
              <path d="M 315 58 L 255 58 L 255 88 L 362 88 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              <path d="M 245 58 L 185 58 L 125 88 L 245 88 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              {/* Wheels */}
              <circle cx="345" cy="135" r="26" fill="#334155" />
              <circle cx="345" cy="135" r="14" fill="#94a3b8" />
              <circle cx="115" cy="135" r="26" fill="#334155" />
              <circle cx="115" cy="135" r="14" fill="#94a3b8" />
              <line x1="250" y1="58" x2="250" y2="135" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="430" y="105" fill="#64748b" fontSize="11" fontWeight="bold">FRENTE</text>
              <text x="40" y="105" fill="#64748b" fontSize="11" fontWeight="bold">ATRÁS</text>
            </svg>
          )}

          {activeView === 'front' && (
            <svg viewBox="0 0 300 200" className="w-full h-full text-slate-400 drop-shadow-md pointer-events-none">
              {/* Front Silhouette */}
              <path
                d="M 50 160 L 50 130 L 70 85 L 110 50 L 190 50 L 230 85 L 250 130 L 250 160 Z"
                fill="#f1f5f9"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              {/* Windshield */}
              <polygon points="115,55 185,55 220,85 80,85" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              {/* Headlights */}
              <circle cx="75" cy="115" r="14" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="225" cy="115" r="14" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
              {/* Grille */}
              <rect x="110" y="115" width="80" height="24" rx="4" fill="#475569" stroke="#334155" strokeWidth="1.5" />
              {/* Bumper */}
              <rect x="55" y="145" width="190" height="15" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
              {/* Wheels peek */}
              <rect x="42" y="140" width="12" height="30" rx="3" fill="#334155" />
              <rect x="246" y="140" width="12" height="30" rx="3" fill="#334155" />
            </svg>
          )}

          {activeView === 'back' && (
            <svg viewBox="0 0 300 200" className="w-full h-full text-slate-400 drop-shadow-md pointer-events-none">
              {/* Rear Silhouette */}
              <path
                d="M 50 160 L 50 130 L 70 85 L 110 50 L 190 50 L 230 85 L 250 130 L 250 160 Z"
                fill="#f1f5f9"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              {/* Rear Glass */}
              <polygon points="115,55 185,55 220,85 80,85" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
              {/* Taillights */}
              <rect x="60" y="105" width="28" height="18" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
              <rect x="212" y="105" width="28" height="18" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
              {/* License Plate Area */}
              <rect x="120" y="118" width="60" height="20" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Bumper */}
              <rect x="55" y="145" width="190" height="15" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
              <rect x="42" y="140" width="12" height="30" rx="3" fill="#334155" />
              <rect x="246" y="140" width="12" height="30" rx="3" fill="#334155" />
            </svg>
          )}

          {/* Interactive Markers Placed by User */}
          {currentViewPoints.map((pt, idx) => {
            const typeConfig = DAMAGE_TYPES.find(t => t.id === pt.type) || DAMAGE_TYPES[0];
            return (
              <div
                key={pt.id}
                style={{ left: `${pt.x}%`, top: `${pt.y}%`, backgroundColor: typeConfig.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePoint(pt.id);
                }}
                title={`${typeConfig.label}: ${pt.notes || 'Sin nota'} (Clic para eliminar)`}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg cursor-pointer transform hover:scale-125 transition-transform ring-2 ring-white"
              >
                {typeConfig.code}
              </div>
            );
          })}
        </div>

        {/* Tip Badge */}
        <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md border border-gray-200">
          <i className="fas fa-info-circle text-primary mr-1"></i> Clic en el diagrama para añadir • Clic en marcador para borrar
        </div>
      </div>

      {/* List of Registered Damage Points */}
      {damagePoints.length > 0 ? (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Daños Registrados ({damagePoints.length})
            </h5>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Limpiar todos
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
            {damagePoints.map((pt, i) => {
              const typeCfg = DAMAGE_TYPES.find(t => t.id === pt.type) || DAMAGE_TYPES[0];
              const viewLabels: Record<CarView, string> = {
                top: 'Techo',
                left: 'Lat. Izq',
                right: 'Lat. Der',
                front: 'Frente',
                back: 'Atrás'
              };
              return (
                <div
                  key={pt.id}
                  className="bg-gray-50 rounded-xl p-2.5 border border-gray-200 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black"
                      style={{ backgroundColor: typeCfg.color }}
                    >
                      {typeCfg.code}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {typeCfg.label} ({viewLabels[pt.view]})
                      </p>
                      <input
                        type="text"
                        value={pt.notes || ''}
                        onChange={(e) => handleUpdateNote(pt.id, e.target.value)}
                        placeholder="Agregar detalle..."
                        className="w-full text-[11px] bg-white border border-gray-200 rounded px-1.5 py-0.5 mt-1 focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(pt.id)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded"
                    title="Eliminar marcador"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-gray-400 mt-3 italic">
          No hay marcas de daños registradas. La carrocería se asume en buen estado.
        </p>
      )}
    </div>
  );
};
export default VehicleDamageCanvas;
