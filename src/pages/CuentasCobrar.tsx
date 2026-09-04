import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import CuentaCobrarModal from "../components/modales/CuentaCobrarModal";

export default function CuentasCobrar() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, remove, refetch } = useGrqlList<any[]>("GestionTallerProd_accounts_receivable", {
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
          <p className="text-gray-500 font-medium">Cargando cuentas por cobrar...</p>
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

  const handleOpenNew = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Deseas eliminar este registro de CxC?")) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-file-invoice-dollar text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Cuentas por Cobrar</h1>
            <p className="text-sm text-gray-500 mt-0.5">Control de saldos pendientes, créditos y abonos de clientes • <span className="font-semibold text-primary">{meta?.total ?? filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nuevo Movimiento CxC
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6 text-left">Fecha</th>
                <th className="py-4 px-6 text-left">Descripción</th>
                <th className="py-4 px-6 text-right">Debe ($)</th>
                <th className="py-4 px-6 text-right">Haber ($)</th>
                <th className="py-4 px-6 text-right">Saldo ($)</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No se encontraron cuentas por cobrar
                  </td>
                </tr>
              ) : (
                filteredData.map((row: any) => (
                  <tr key={row.id || row.ar_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-6 text-gray-700 font-medium">
                      {row.transaction_date ? new Date(row.transaction_date).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-secondary">
                      {row.description || 'Cuenta por Cobrar'}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-green-600">
                      ${Number(row.debit || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-blue-600">
                      ${Number(row.credit || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-secondary">
                      ${Number(row.balance || 0).toFixed(2)}
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
                          onClick={() => handleDelete(row.id || row.ar_id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
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

      <CuentaCobrarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
        item={selectedItem}
      />
    </div>
  );
}
