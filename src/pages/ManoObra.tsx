import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import ManoObraModal from "../components/modales/ManoObraModal";

export default function ManoObra() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, remove, refetch } = useGrqlList<any[]>("GestionTallerProd_work_contracts", {
    pagination: { page, size: 10 }
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManoObra, setSelectedManoObra] = useState<any>(null);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
          <p className="text-gray-500 font-medium">Cargando registros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-150 p-6 rounded-2xl max-w-2xl mx-auto my-8 shadow-soft">
        <div className="flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500 text-2xl"></i>
          <div>
            <p className="text-red-800 font-bold">Error de sincronización</p>
            <p className="text-red-600 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const list = Array.isArray(data) ? data : [];
  const filteredData = list.filter((item: any) => {
    const emp = item.employees?.[0];
    const empStr = emp ? `${emp.first_name || ''} ${emp.last_name || ''} ${emp.id_card || ''} ${emp.job_title || ''}` : '';
    const searchable = `${Object.values(item).filter(v => typeof v !== 'object').join(" ")} ${empStr}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });

  const handleOpenNew = () => {
    setSelectedManoObra(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (manoObra: any) => {
    setSelectedManoObra(manoObra);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Action and Title Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-hard-hat text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Mano de Obra y Contratos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Asignación de costos por labor • <span className="font-semibold text-primary">{meta?.total ?? filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por empleado, contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nuevo Registro
          </button>
        </div>
      </div>

      {/* Grid / Table Container */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-6 text-left">ID</th>
                  <th className="py-4 px-6 text-left">Empleado</th>
                  <th className="py-4 px-6 text-left">Fecha Inicio</th>
                  <th className="py-4 px-6 text-left">Tipo Contrato</th>
                  <th className="py-4 px-6 text-left">Salario Base</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400">
                      <i className="fas fa-folder-open text-5xl mb-3 opacity-30"></i>
                      <p className="font-semibold text-gray-500">No se encontraron registros</p>
                      <p className="text-xs text-gray-400 mt-1">Pruebe ajustando los filtros de búsqueda</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item: any) => {
                    const emp = item.employees?.[0];
                    const empName = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : (item.employee_name || item.assigned_mechanic || item.first_name);
                    const empIdCard = emp?.id_card || item.id_card || emp?.tax_id || "";
                    const empJob = emp?.job_title || item.job_title || "";

                    return (
                      <tr key={item.id} className="table-row-hover hover:bg-blue-50/5 transition-colors">
                        <td className="py-4 px-6 text-gray-600 font-mono text-xs">{String(item.id).substring(0,8)}...</td>
                        <td className="py-4 px-6">
                          {empName ? (
                            <div>
                              <div className="font-semibold text-secondary">{empName}</div>
                              {(empIdCard || empJob) && (
                                <div className="text-xs text-gray-400">
                                  {empIdCard && <span className="font-mono">{empIdCard} </span>}
                                  {empJob && <span>• {empJob}</span>}
                                </div>
                              )}
                            </div>
                          ) : item.employees_fk_id ? (
                            <span className="text-gray-400 font-mono text-xs">{String(item.employees_fk_id).substring(0,8)}...</span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-600">{item.start_date ? String(item.start_date).substring(0, 10) : '—'}</td>
                        <td className="py-4 px-6 text-gray-500 uppercase">{item.contract_type}</td>
                        <td className="py-4 px-6 font-bold text-secondary">
                          {item.salary ? `$${Number(item.salary).toFixed(2)}` : '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                              title="Editar Registro"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("¿Está seguro de eliminar este registro?")) {
                                  remove(item.id);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar Registro"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
      </div>
      
      <ManoObraModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => refetch()} 
        manoObra={selectedManoObra} 
      />
    </div>
  );
}
