import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import VehiculoModal from "../components/modales/VehiculoModal";

export default function Vehiculos() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, remove, refetch } = useGrqlList<any[]>("GestionTallerProd_vehicles", {
    pagination: { page, size: 10 }
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<any>(null);

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
    const client = item.clients?.[0];
    const clientName = client?.client_name || item.client_name || item.owner_name || '';
    const taxId = client?.tax_id || item.tax_id || '';
    const term = searchTerm.toLowerCase();

    return (
      (item.license_plate && String(item.license_plate).toLowerCase().includes(term)) ||
      (item.brand && String(item.brand).toLowerCase().includes(term)) ||
      (item.model && String(item.model).toLowerCase().includes(term)) ||
      (item.color && String(item.color).toLowerCase().includes(term)) ||
      (item.year && String(item.year).toLowerCase().includes(term)) ||
      clientName.toLowerCase().includes(term) ||
      taxId.toLowerCase().includes(term) ||
      Object.values(item).some(
        (val) => val && typeof val === "string" && val.toLowerCase().includes(term)
      )
    );
  }) ?? [];

  const handleOpenNew = () => {
    setSelectedVehiculo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehiculo: any) => {
    setSelectedVehiculo(vehiculo);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Action and Title Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-car text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Vehículos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Registro de vehículos del taller • <span className="font-semibold text-primary">{meta?.total ?? filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por placa, modelo o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nuevo Vehículo
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
                  <th className="py-4 px-6 text-left">Placa</th>
                  <th className="py-4 px-6 text-left">Marca / Modelo</th>
                  <th className="py-4 px-6 text-left">Año</th>
                  <th className="py-4 px-6 text-left">Color</th>
                  <th className="py-4 px-6 text-left">Cliente</th>
                  <th className="py-4 px-6 text-left">Cédula</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      <i className="fas fa-car text-5xl mb-3 opacity-30"></i>
                      <p className="font-semibold text-gray-500">No se encontraron vehículos</p>
                      <p className="text-xs text-gray-400 mt-1">Pruebe ajustando los filtros de búsqueda</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item: any) => {
                    const client = item.clients?.[0];
                    const clientName = client?.client_name || item.client_name || item.owner_name || "-";
                    const taxId = client?.tax_id || item.tax_id || "-";

                    return (
                      <tr key={item.id} className="table-row-hover hover:bg-blue-50/5 transition-colors">
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                            {item.license_plate || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-secondary">{item.brand} {item.model}</td>
                        <td className="py-4 px-6 text-gray-600">{item.year || '-'}</td>
                        <td className="py-4 px-6 text-gray-600">
                          <span className="inline-block w-3 h-3 rounded-full mr-1.5 border border-gray-300 align-middle" style={{ backgroundColor: item.color?.toLowerCase() }}></span>
                          {item.color || '-'}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-800">{clientName}</td>
                        <td className="py-4 px-6 text-gray-500 text-xs font-mono">{taxId}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                              title="Editar Vehículo"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("¿Está seguro de eliminar este vehículo?")) {
                                  remove(item.id);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar Vehículo"
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
      
      <VehiculoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => refetch()} 
        vehiculo={selectedVehiculo} 
      />
    </div>
  );
}
