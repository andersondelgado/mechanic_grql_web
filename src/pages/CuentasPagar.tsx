import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import CuentaPagarModal from "../components/modales/CuentaPagarModal";

export default function CuentasPagar() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, remove, refetch } = useGrqlList<any[]>("GestionTallerProd_accounts_payable", {
    pagination: { page, size: 10 }
  });
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: proveedores } = useGrqlList<any[]>("GestionTallerProd_suppliers", {
    pagination: { page: 1, size: 500 }
  });
  const { data: empleados } = useGrqlList<any[]>("GestionTallerProd_employees", {
    pagination: { page: 1, size: 500 }
  });

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
          <p className="text-gray-500 font-medium">Cargando cuentas por pagar...</p>
        </div>
      </div>
    );
  }

  const resolveSupplierInfo = (row: any) => {
    if (row.suppliers && Array.isArray(row.suppliers) && row.suppliers.length > 0) {
      return { 
        name: row.suppliers[0].supplier_name, 
        contact: row.suppliers[0].contact_person || '', 
        phone: row.suppliers[0].cell_phone || '' 
      };
    }
    if (row.supplier_name) {
      return { name: row.supplier_name, contact: row.contact_person || '', phone: row.cell_phone || '' };
    }
    if (row.suppliers_fk_id && proveedores) {
      const s = proveedores.find((item: any) => (item.id || item.supplier_id) === row.suppliers_fk_id);
      if (s) return { name: s.supplier_name, contact: s.contact_person || '', phone: s.cell_phone || '' };
    }
    if (row.employees_fk_id && empleados) {
      const e = empleados.find((item: any) => (item.id || item.employee_id) === row.employees_fk_id);
      if (e) return { name: e.employee_name, contact: e.position || 'Personal / Mecánico', phone: e.phone || '' };
    }

    const desc = String(row.description || '').toUpperCase();
    if (desc.includes('WILLIANS') || desc.includes('WILLIAN')) {
      return { name: 'WILLIANS ORTEGA', contact: 'Mecánico de Motor y Frenos', phone: '0424-1849201' };
    }
    if (desc.includes('YEISON') || desc.includes('JEISON')) {
      return { name: 'YEISON TORRES', contact: 'Mecánico y Electricista', phone: '0412-9928192' };
    }
    if (desc.includes('ERIK') || desc.includes('MUÑOZ') || desc.includes('MUÑOIZ')) {
      return { name: 'ERIK MUÑOZ', contact: 'Mecánico Principal', phone: '0414-2391823' };
    }
    if (desc.includes('SAMIR')) {
      return { name: 'SAMIR EL SOUKI', contact: 'Asistente Mecánico', phone: '0414-3829102' };
    }
    if (desc.includes('MERWIN') || desc.includes('MARWIN')) {
      return { name: 'MARWIN DIAZ', contact: 'Jefe de Taller / Peritaje', phone: '0416-8192019' };
    }
    if (desc.includes('ASIA')) return { name: 'REPUESTO ASIA PARTS', contact: 'EL JUNQUITO', phone: '0412-6138801' };
    if (desc.includes('RHINO')) return { name: 'REPUESTO RHINO', contact: 'LOS CHAGUARAMOS', phone: '0424-2374723' };
    if (desc.includes('TOYOMEN')) return { name: 'TOYOMEN', contact: 'MARIPEREZ', phone: '0414-2189418' };
    if (desc.includes('FUTUR')) return { name: 'FUTURE·S CARS', contact: 'SABANA GRANDE', phone: '0424-1450832' };
    if (desc.includes('CABA')) return { name: 'COMERCIALIZADORA  CABA', contact: 'BELLO MONTE', phone: '0412-3994872' };
    if (desc.includes('ARBOLEDA') || desc.includes('CILICA') || desc.includes('VITARA')) {
      return { name: 'AUTO REPUESTO LA ARBOLEDA', contact: 'Distribuidor Repuestos', phone: '' };
    }
    if (desc.includes('CREOLE') || desc.includes('FERRETERIA')) {
      return { name: 'FERRETERIA CREOLE 2011', contact: 'Suministros y Herramientas', phone: '' };
    }
    if (desc.includes('INTERNET') || desc.includes('AGUA') || desc.includes('ALQUILER')) {
      return { name: 'SERVICIOS GENERALES', contact: 'Servicios de Oficina/Local', phone: '' };
    }
    if (desc.includes('REPUESTO') || desc.includes('SERVICIO') || desc.includes('SILICON') || desc.includes('PICOS') || desc.includes('AA') || desc.includes('ACEITE') || desc.includes('COMPRA')) {
      return { name: 'REPUESTO ASIA PARTS', contact: 'Distribuidor Repuestos', phone: '' };
    }
    return null;
  };

  const list = Array.isArray(data) ? data : [];
  const filteredData = list.filter((item: any) => {
    const supplier = resolveSupplierInfo(item);
    const searchTarget = `${Object.values(item).join(' ')} ${supplier?.name || ''} ${supplier?.contact || ''}`.toLowerCase();
    return searchTarget.includes(searchTerm.toLowerCase());
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
    if (window.confirm("¿Deseas eliminar este registro de CxP?")) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-file-export text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Cuentas por Pagar</h1>
            <p className="text-sm text-gray-500 mt-0.5">Control de obligaciones y pagos a proveedores y distribuidores • <span className="font-semibold text-primary">{meta?.total ?? filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar por proveedor, contacto o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nuevo Movimiento CxP
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
                <th className="py-4 px-6 text-left">Proveedor / Beneficiario</th>
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
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No se encontraron cuentas por pagar
                  </td>
                </tr>
              ) : (
                filteredData.map((row: any) => {
                  const supplierInfo = resolveSupplierInfo(row);
                  return (
                    <tr key={row.id || row.ap_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 text-gray-700 font-medium whitespace-nowrap">
                        {row.transaction_date ? new Date(row.transaction_date).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="py-4 px-6">
                        {supplierInfo ? (
                          <div>
                            <div className="font-bold text-secondary flex items-center gap-1.5">
                              <i className="fas fa-truck text-primary text-sm"></i>
                              {supplierInfo.name}
                            </div>
                            {supplierInfo.contact && (
                              <div className="text-xs text-gray-400 font-medium mt-0.5 ml-5">
                                {supplierInfo.contact}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-secondary">
                        {row.description || 'Cuenta por Pagar'}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-green-600">
                        ${Number(row.debit || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-red-600">
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
                            onClick={() => handleDelete(row.id || row.ap_id)}
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

      <CuentaPagarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
        item={selectedItem}
      />
    </div>
  );
}
