import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import { Link } from "react-router-dom";
import PeritajeModals from "../components/modales/PeritajeModals";

export default function Peritajes() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, remove, refetch } = useGrqlList<any[]>("GestionTallerProd_inspection_cards", {
    pagination: { page, size: 10 }
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'new' | 'record' | 'video' | 'analyze';
    item: any;
  }>({
    isOpen: false,
    type: 'record',
    item: null
  });

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
          <p className="text-gray-500 font-medium">Cargando peritajes...</p>
        </div>
      </div>
    );
  }

  const list = Array.isArray(data) ? data : [];
  const filteredData = list.filter((item: any) => {
    return Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const openActionModal = (type: 'record' | 'video' | 'analyze', item: any) => {
    setModalState({
      isOpen: true,
      type,
      item
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Action and Title Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-search-dollar text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Peritajes e Inspecciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">Grabación de video, diagnósticos y análisis con Inteligencia Artificial Gemini • <span className="font-semibold text-primary">{meta?.total ?? filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por placa, tipo o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <Link
            to="/peritajes/nuevo"
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nuevo Peritaje
          </Link>
        </div>
      </div>

      {/* Grid / Table Container */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6 text-left"># Peritaje</th>
                <th className="py-4 px-6 text-left">Fecha</th>
                <th className="py-4 px-6 text-left">Tipo de Inspección</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-center">Video</th>
                <th className="py-4 px-6 text-center">Análisis IA</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <i className="fas fa-folder-open text-5xl mb-3 opacity-30"></i>
                    <p className="font-semibold text-gray-500">No se encontraron peritajes registrados</p>
                    <p className="text-xs text-gray-400 mt-1">Haga clic en "Nuevo Peritaje" para iniciar</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item: any) => (
                  <tr key={item.id} className="table-row-hover hover:bg-blue-50/5 transition-colors">
                    <td className="py-4 px-6 text-primary font-bold font-mono text-xs">
                      PER-{String(item.id).slice(-4).toUpperCase()}
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-medium">
                      {item.inspection_date ? new Date(item.inspection_date).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-secondary">
                      {item.inspection_type || 'Revisión General'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                        item.status === 'completado' ? 'bg-green-100 text-green-800' :
                        item.status === 'en_proceso' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status || 'En Proceso'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openActionModal('video', item)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition"
                        title="Ver Video Grabado"
                      >
                        <i className="fas fa-play-circle text-xl"></i>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openActionModal('analyze', item)}
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 mx-auto border border-purple-200"
                        title="Ejecutar análisis IA"
                      >
                        <i className="fas fa-brain text-purple-600"></i>
                        <span>Analizar IA</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openActionModal('record', item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Grabar Video"
                        >
                          <i className="fas fa-video"></i>
                        </button>
                        <Link
                          to={`/peritajes/${item.id}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                          title="Ver Formulario Detallado"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm("¿Está seguro de eliminar este peritaje?")) {
                              remove(item.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar Peritaje"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {meta && (meta.totalElement > 0 || meta.total > 0) && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando página <span className="font-bold text-gray-700">{meta.current_page || page}</span> de <span className="font-bold text-gray-700">{meta.totalElement || 1}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                <i className="fas fa-chevron-left mr-1"></i> Anterior
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= (meta.totalElement || 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Siguiente <i className="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      <PeritajeModals
        type={modalState.type}
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onSuccess={refetch}
        data={modalState.item}
      />
    </div>
  );
}
