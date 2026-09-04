import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import CotizacionModal from "../components/modales/CotizacionModal";

export default function Cotizaciones() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, remove, refetch } = useGrqlList<any[]>("GestionTallerProd_quotes", {
    pagination: { page, size: 10 }
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<any>(null);

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
    const vehicle = item.vehicles?.[0];
    const plate = vehicle?.license_plate || item.license_plate || '';
    const brandModel = vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}` : `${item.brand || ''} ${item.model || ''}`;
    const quoteNum = item.quote_number || '';
    const term = searchTerm.toLowerCase();

    return (
      quoteNum.toLowerCase().includes(term) ||
      clientName.toLowerCase().includes(term) ||
      taxId.toLowerCase().includes(term) ||
      plate.toLowerCase().includes(term) ||
      brandModel.toLowerCase().includes(term) ||
      Object.values(item).some(
        (val) => val && typeof val === "string" && val.toLowerCase().includes(term)
      )
    );
  }) ?? [];

  const handleOpenNew = () => {
    setSelectedCotizacion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cotizacion: any) => {
    setSelectedCotizacion(cotizacion);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Action and Title Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-file-invoice-dollar text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Cotizaciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">Presupuestos para clientes • <span className="font-semibold text-primary">{meta?.total ?? filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por cliente, placa o # cotización..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nueva Cotización
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
                  <th className="py-4 px-6 text-left"># Cotización</th>
                  <th className="py-4 px-6 text-left">Cliente</th>
                  <th className="py-4 px-6 text-left">Vehículo</th>
                  <th className="py-4 px-6 text-left">Fecha Emisión</th>
                  <th className="py-4 px-6 text-left">Válido Hasta</th>
                  <th className="py-4 px-6 text-right">Total</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      <i className="fas fa-folder-open text-5xl mb-3 opacity-30"></i>
                      <p className="font-semibold text-gray-500">No se encontraron registros</p>
                      <p className="text-xs text-gray-400 mt-1">Pruebe ajustando los filtros de búsqueda</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item: any) => {
                    const client = item.clients?.[0];
                    const clientName = client?.client_name || item.client_name || item.owner_name || "-";
                    const taxId = client?.tax_id || item.tax_id || "";
                    const vehicle = item.vehicles?.[0];
                    const plate = vehicle?.license_plate || item.license_plate;
                    const vehicleDesc = vehicle
                      ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
                      : `${item.brand || ""} ${item.model || ""}`.trim();
                    const totalVal = item.total ?? item.total_amount ?? item.subtotal ?? 0;
                    const displayDate = item.quote_date
                      ? (item.quote_date.includes("T") ? item.quote_date.split("T")[0] : item.quote_date.split(" ")[0])
                      : "-";

                    return (
                      <tr key={item.id} className="table-row-hover hover:bg-blue-50/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-primary font-mono">
                          {item.quote_number || `COT-${String(item.id).substring(0, 6)}`}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-secondary">{clientName}</p>
                          {taxId && <p className="text-xs text-gray-400 font-mono">{taxId}</p>}
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {plate ? (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                                {plate}
                              </span>
                              {vehicleDesc && <p className="text-xs text-gray-500 mt-0.5">{vehicleDesc}</p>}
                            </div>
                          ) : (
                            vehicleDesc || "-"
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-600">{displayDate}</td>
                        <td className="py-4 px-6 text-gray-500">{item.valid_until || "-"}</td>
                        <td className="py-4 px-6 text-right font-bold text-secondary">
                          ${Number(totalVal).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                            String(item.status).toLowerCase() === 'aprobado' ? 'bg-green-100 text-green-800' :
                            String(item.status).toLowerCase() === 'rechazado' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status || 'pendiente'}
                          </span>
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
      
      <CotizacionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => refetch()} 
        cotizacion={selectedCotizacion} 
      />
    </div>
  );
}
