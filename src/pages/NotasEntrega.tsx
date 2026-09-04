import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import NotaEntregaModal from "../components/modales/NotaEntregaModal";

export default function NotasEntrega() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, remove, refetch } = useGrqlList<any[]>("GestionTallerProd_delivery_notes", {
    pagination: { page, size: 10 }
  });
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
          <p className="text-gray-500 font-medium">Cargando notas de entrega...</p>
        </div>
      </div>
    );
  }

  const list = Array.isArray(data) ? data : [];
  const filteredData = list.filter((item: any) => {
    const client = item.clients?.[0];
    const clientStr = client ? `${client.client_name || ''} ${client.tax_id || ''}` : '';
    const vehicle = item.vehicles?.[0];
    const vehicleStr = vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.license_plate || ''}` : '';
    const searchable = `${Object.values(item).filter(v => typeof v !== 'object').join(" ")} ${clientStr} ${vehicleStr}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });

  const handleOpenNew = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Deseas eliminar esta nota de entrega?")) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-receipt text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Notas de Entrega</h1>
            <p className="text-sm text-gray-500 mt-0.5">Control de despachos y entrega de vehículos a clientes • <span className="font-semibold text-primary">{meta?.total ?? filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por cliente o placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nueva Nota
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6 text-left"># Nota</th>
                <th className="py-4 px-6 text-left">Fecha</th>
                <th className="py-4 px-6 text-left">Cliente</th>
                <th className="py-4 px-6 text-left">Vehículo / Placa</th>
                <th className="py-4 px-6 text-right">Total</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No se encontraron notas de entrega
                  </td>
                </tr>
              ) : (
                filteredData.map((row: any) => {
                  const client = row.clients?.[0];
                  const clientName = client?.client_name || row.client_name || row.owner_name;
                  const taxId = client?.tax_id || row.tax_id || "";

                  const vehicle = row.vehicles?.[0];
                  const plate = vehicle?.license_plate || row.license_plate;
                  const vehicleDesc = vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() : `${row.brand || ""} ${row.model || ""}`.trim();

                  return (
                    <tr key={row.id || row.delivery_note_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 text-primary font-bold font-mono">
                        {row.note_number || `ND-${String(row.id || '').slice(-4)}`}
                      </td>
                      <td className="py-4 px-6 text-gray-700 font-medium">
                        {row.note_date ? String(row.note_date).substring(0, 10) : '—'}
                      </td>
                      <td className="py-4 px-6">
                        {clientName ? (
                          <div>
                            <div className="font-semibold text-secondary">{clientName}</div>
                            {taxId && <div className="text-xs text-gray-400 font-mono">{taxId}</div>}
                          </div>
                        ) : row.clients_fk_id ? (
                          <span className="text-gray-400 font-mono text-xs">{String(row.clients_fk_id).substring(0, 8)}...</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {plate || vehicleDesc ? (
                          <div className="flex flex-col">
                            {plate && (
                              <span className="inline-block px-2 py-0.5 bg-gray-100 border border-gray-200 text-secondary rounded font-mono font-bold text-xs uppercase w-fit">
                                {plate}
                              </span>
                            )}
                            {vehicleDesc && (
                              <span className="text-xs text-gray-500 mt-0.5">{vehicleDesc}</span>
                            )}
                          </div>
                        ) : row.vehicles_fk_id ? (
                          <span className="text-gray-400 font-mono text-xs">{String(row.vehicles_fk_id).substring(0, 8)}...</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-secondary">
                        ${Number(row.total || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(row.id || row.delivery_note_id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
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

      <NotaEntregaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
        nota={selectedItem}
      />
    </div>
  );
}
