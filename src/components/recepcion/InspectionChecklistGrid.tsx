import React, { useState } from 'react';
import type { ChecklistItem } from '../../types/entities';

export interface ChecklistGroup {
  name: string;
  icon: string;
  items: string[];
}

export const EXTERNAL_GROUPS: ChecklistGroup[] = [
  {
    name: 'Carrocería y Cristales',
    icon: 'fa-car-side',
    items: [
      'Parachoque Delantero',
      'Frontal / Parrilla',
      'Capot',
      'Cristales Delanteros (Parabrisas)',
      'Cristales Traseros (Vidrio Trasero)',
      'Parachoque Trasero',
      'Puerta Maleta',
      'Techo',
      'Guardafango Del. Der.',
      'Guardafango Del. Izq.',
      'Guardafango Tras. Der.',
      'Guardafango Tras. Izq.',
      'Puerta Del. Der.',
      'Puerta Del. Izq.',
      'Puerta Tras. Der.',
      'Puerta Tras. Izq.',
      'Vidrios de Puertas',
      'Manillas de Puertas',
      'Espejo Lateral Der.',
      'Espejo Lateral Izq.',
      'Antena',
      'Tapa de Gasolina',
      'Limpiaparabrisas (Escobillas)',
      'Emblemas / Logos'
    ]
  },
  {
    name: 'Iluminación y Ópticas',
    icon: 'fa-lightbulb',
    items: [
      'Luces Delanteras Der.',
      'Luces Delanteras Izq.',
      'Luces de Cruce Der.',
      'Luces de Cruce Izq.',
      'Luces de Freno',
      'Luces de Navegación',
      'Micas Der.',
      'Micas Izq.',
      'Faros Antiniebla'
    ]
  },
  {
    name: 'Neumáticos y Ruedas',
    icon: 'fa-dharmachakra',
    items: [
      'Caucho Del. Der. (Marca y Estado)',
      'Caucho Del. Izq. (Marca y Estado)',
      'Caucho Tras. Der. (Marca y Estado)',
      'Caucho Tras. Izq. (Marca y Estado)',
      'Tuercas de Seguridad',
      'Dado de Tuerca de Seguridad'
    ]
  }
];

export const INTERNAL_GROUPS: ChecklistGroup[] = [
  {
    name: 'Habitáculo y Confort',
    icon: 'fa-couch',
    items: [
      'Tablero de Instrumentos',
      'Espejo Retrovisor Interno',
      'Radio / Reproductor',
      'Aire Acondicionado',
      'Calefacción / Ventilador',
      'Cenicero / Encendedor',
      'Palanca de Cambio',
      'Freno de Mano',
      'Asiento Delantero Der.',
      'Asiento Delantero Izq.',
      'Asientos Traseros',
      'Tapasol Der.',
      'Tapasol Izq.',
      'Pantalla de Control',
      'Alfombras Delanteras',
      'Alfombras Traseras'
    ]
  },
  {
    name: 'Mandos y Eléctrico',
    icon: 'fa-bolt',
    items: [
      'Botones Seguros Eléctricos',
      'Mandos Vidrios Delanteros',
      'Mandos Vidrios Traseros',
      'Bocina / Claxon',
      'Cinturones de Seguridad',
      'Batería (Marca y Amperaje)'
    ]
  },
  {
    name: 'Auxilio, Herramientas y Documentos',
    icon: 'fa-toolbox',
    items: [
      'Caucho de Repuesto',
      'Gato Hidráulico / Mecánico',
      'Llave de Cruz',
      'Triángulo de Seguridad',
      'Estuche de Herramientas',
      'Extintor (Vigencia)',
      'Carnet de Circulación',
      'Seguro RCV'
    ]
  }
];

interface InspectionChecklistGridProps {
  externalItems: ChecklistItem[];
  internalItems: ChecklistItem[];
  onExternalChange: (items: ChecklistItem[]) => void;
  onInternalChange: (items: ChecklistItem[]) => void;
}

export const InspectionChecklistGrid: React.FC<InspectionChecklistGridProps> = ({
  externalItems = [],
  internalItems = [],
  onExternalChange,
  onInternalChange
}) => {
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external');
  const [searchFilter, setSearchFilter] = useState('');

  const currentGroups = activeTab === 'external' ? EXTERNAL_GROUPS : INTERNAL_GROUPS;
  const currentItems = activeTab === 'external' ? externalItems : internalItems;
  const onChange = activeTab === 'external' ? onExternalChange : onInternalChange;

  const getItemState = (itemName: string): ChecklistItem => {
    return (
      currentItems.find(i => i.name === itemName) || {
        id: itemName,
        name: itemName,
        status: 'ok'
      }
    );
  };

  const handleStatusChange = (itemName: string, status: 'ok' | 'bad' | 'na') => {
    const existingIndex = currentItems.findIndex(i => i.name === itemName);
    if (existingIndex >= 0) {
      const updated = [...currentItems];
      updated[existingIndex] = { ...updated[existingIndex], status };
      onChange(updated);
    } else {
      onChange([...currentItems, { id: itemName, name: itemName, status }]);
    }
  };

  const handleNoteChange = (itemName: string, notes: string) => {
    const existingIndex = currentItems.findIndex(i => i.name === itemName);
    if (existingIndex >= 0) {
      const updated = [...currentItems];
      updated[existingIndex] = { ...updated[existingIndex], notes };
      onChange(updated);
    } else {
      onChange([...currentItems, { id: itemName, name: itemName, status: 'ok', notes }]);
    }
  };

  const markAll = (status: 'ok' | 'na') => {
    const allItemNames = currentGroups.flatMap(g => g.items);
    const updated: ChecklistItem[] = allItemNames.map(name => {
      const existing = currentItems.find(i => i.name === name);
      return {
        id: name,
        name,
        status,
        notes: existing?.notes
      };
    });
    onChange(updated);
  };

  const stats = {
    ok: currentItems.filter(i => i.status === 'ok').length,
    bad: currentItems.filter(i => i.status === 'bad').length,
    na: currentItems.filter(i => i.status === 'na').length
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Sub-Header Tabs & Quick Actions */}
      <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'external'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <i className="fas fa-car-side"></i>
            Revisión Externa ({EXTERNAL_GROUPS.reduce((acc, g) => acc + g.items.length, 0)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'internal'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <i className="fas fa-couch"></i>
            Revisión Interna ({INTERNAL_GROUPS.reduce((acc, g) => acc + g.items.length, 0)})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => markAll('ok')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <i className="fas fa-check-double"></i> Todo Bueno (OK)
          </button>
          <button
            type="button"
            onClick={() => markAll('na')}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition"
          >
            Marcar N/A
          </button>
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar ítem..."
              className="w-full text-xs pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-primary"
            />
            <i className="fas fa-search absolute left-2.5 top-2 text-gray-400 text-xs"></i>
          </div>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="px-5 py-2.5 bg-gray-100/70 border-b border-gray-200 flex items-center gap-4 text-xs font-medium text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Bueno: <strong className="text-emerald-700">{stats.ok}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Malo / Falta: <strong className="text-rose-700">{stats.bad}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> N/A: <strong className="text-gray-700">{stats.na}</strong>
        </span>
      </div>

      {/* Accordion / Category Groups */}
      <div className="p-4 sm:p-6 space-y-6 max-h-[500px] overflow-y-auto">
        {currentGroups.map((group) => {
          const filteredItems = group.items.filter(i =>
            i.toLowerCase().includes(searchFilter.toLowerCase())
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.name} className="border border-gray-200/90 rounded-2xl p-4 bg-white shadow-soft">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center text-sm">
                  <i className={`fas ${group.icon}`}></i>
                </div>
                <h4 className="text-sm font-bold text-gray-800">{group.name}</h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 ml-auto">
                  {filteredItems.length} ítems
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map(itemName => {
                  const state = getItemState(itemName);
                  const isBad = state.status === 'bad';

                  return (
                    <div
                      key={itemName}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isBad
                          ? 'border-rose-300 bg-rose-50/50'
                          : state.status === 'ok'
                          ? 'border-gray-200 hover:border-emerald-200 bg-white'
                          : 'border-gray-200 bg-gray-50/70 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-800 leading-tight">
                          {itemName}
                        </span>

                        {/* Tri-state buttons */}
                        <div className="flex rounded-lg p-0.5 bg-gray-100 border border-gray-200 text-[11px] font-bold flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(itemName, 'ok')}
                            className={`px-2 py-1 rounded-md transition ${
                              state.status === 'ok'
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-emerald-600'
                            }`}
                            title="Bueno / Presente"
                          >
                            <i className="fas fa-check mr-0.5"></i> OK
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(itemName, 'bad')}
                            className={`px-2 py-1 rounded-md transition ${
                              state.status === 'bad'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-rose-600'
                            }`}
                            title="Malo / Faltante / Dañado"
                          >
                            <i className="fas fa-times mr-0.5"></i> MAL
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(itemName, 'na')}
                            className={`px-2 py-1 rounded-md transition ${
                              state.status === 'na'
                                ? 'bg-gray-400 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-700'
                            }`}
                            title="No Aplica"
                          >
                            N/A
                          </button>
                        </div>
                      </div>

                      {/* Observations / Notes for specific details or if marked BAD */}
                      {(isBad || state.notes) && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={state.notes || ''}
                            onChange={(e) => handleNoteChange(itemName, e.target.value)}
                            placeholder="Detalle o falla observada..."
                            className="w-full text-[11px] px-2.5 py-1 border border-rose-300 rounded-lg bg-white text-rose-900 focus:ring-1 focus:ring-rose-400 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default InspectionChecklistGrid;
