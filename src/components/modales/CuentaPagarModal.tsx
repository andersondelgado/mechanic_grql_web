import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";
import { resolveSupplierId } from "../../utils/entityHelpers";

interface CuentaPagarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: any;
}

const resolveSupplierForAP = (item: any, proveedores?: any[], empleados?: any[]) => {
  let supplierId = resolveSupplierId(item, proveedores || undefined);
  let inferredName = item?.supplier_name || item?.suppliers?.[0]?.supplier_name || '';

  // 1. Si no tiene ID pero coincide con nombre de proveedor
  if (!supplierId && proveedores && proveedores.length > 0) {
    if (item?.supplier_name) {
      const matched = proveedores.find((p: any) =>
        p.supplier_name && p.supplier_name.trim().toUpperCase() === String(item.supplier_name).trim().toUpperCase()
      );
      if (matched) {
        supplierId = matched.id || matched.supplier_id;
        inferredName = matched.supplier_name;
      }
    }
  }

  // 2. Si no tiene ID de proveedor, chequear si es un empleado por clave foránea o nombre
  if (!supplierId && empleados && empleados.length > 0) {
    if (item?.employees_fk_id) {
      const e = empleados.find((emp: any) => (emp.id || emp.employee_id) === item.employees_fk_id);
      if (e) {
        supplierId = e.id || e.employee_id;
        inferredName = e.employee_name;
      }
    }
    if (!supplierId && item?.supplier_name) {
      const e = empleados.find((emp: any) =>
        emp.employee_name && emp.employee_name.trim().toUpperCase() === String(item.supplier_name).trim().toUpperCase()
      );
      if (e) {
        supplierId = e.id || e.employee_id;
        inferredName = e.employee_name;
      }
    }
  }

  // 3. Fallback inteligente por descripción
  if (!supplierId && item?.description) {
    const d = String(item.description).toUpperCase();
    if (d.includes('WILLIANS') || d.includes('WILLIAN')) inferredName = 'WILLIANS ORTEGA';
    else if (d.includes('YEISON') || d.includes('JEISON')) inferredName = 'YEISON TORRES';
    else if (d.includes('ERIK') || d.includes('MUÑOZ') || d.includes('MUÑOIZ')) inferredName = 'ERIK MUÑOZ';
    else if (d.includes('SAMIR')) inferredName = 'SAMIR EL SOUKI';
    else if (d.includes('MERWIN') || d.includes('MARWIN')) inferredName = 'MARWIN DIAZ';
    else if (d.includes('ASIA')) inferredName = 'REPUESTO ASIA PARTS';
    else if (d.includes('RHINO')) inferredName = 'REPUESTO RHINO';
    else if (d.includes('TOYOMEN')) inferredName = 'TOYOMEN';
    else if (d.includes('FUTUR')) inferredName = 'FUTURE·S CARS';
    else if (d.includes('CABA')) inferredName = 'COMERCIALIZADORA  CABA';
    else if (d.includes('ARBOLEDA') || d.includes('CILICA') || d.includes('VITARA')) inferredName = 'AUTO REPUESTO LA ARBOLEDA';
    else if (d.includes('CREOLE') || d.includes('FERRETERIA')) inferredName = 'FERRETERIA CREOLE 2011';
    else if (d.includes('INTERNET') || d.includes('AGUA') || d.includes('ALQUILER')) inferredName = 'SERVICIOS GENERALES';
    else if (d.includes('REPUESTO') || d.includes('SERVICIO') || d.includes('SILICON') || d.includes('PICOS') || d.includes('AA') || d.includes('ACEITE') || d.includes('COMPRA')) {
      inferredName = 'REPUESTO ASIA PARTS';
    }

    if (inferredName && proveedores) {
      const found = proveedores.find((p: any) =>
        p.supplier_name && p.supplier_name.trim().toUpperCase() === inferredName.toUpperCase()
      );
      if (found) {
        supplierId = found.id || found.supplier_id;
        inferredName = found.supplier_name;
      }
    }

    if (!supplierId && inferredName && empleados) {
      const found = empleados.find((e: any) =>
        e.employee_name && e.employee_name.trim().toUpperCase() === inferredName.toUpperCase()
      );
      if (found) {
        supplierId = found.id || found.employee_id;
        inferredName = found.employee_name;
      }
    }
  }

  return { supplierId, name: inferredName };
};

export default function CuentaPagarModal({ isOpen, onClose, onSuccess, item }: CuentaPagarModalProps) {
  const [formData, setFormData] = useState<any>({
    transaction_date: new Date().toISOString().split('T')[0],
    payment_date: '',
    debit: 0,
    credit: 0,
    balance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: proveedores } = useGrqlList<any[]>("GestionTallerProd_suppliers", {
    pagination: { page: 1, size: 500 }
  });
  const { data: empleados } = useGrqlList<any[]>("GestionTallerProd_employees", {
    pagination: { page: 1, size: 500 }
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        const resolved = resolveSupplierForAP(item, proveedores || undefined, empleados || undefined);

        const rawTxDate = item.transaction_date || item.created_at || '';
        const txDate = rawTxDate ? String(rawTxDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        const rawPayDate = item.payment_date || '';
        const payDate = rawPayDate ? String(rawPayDate).replace(' ', 'T').split('T')[0] : '';

        const debit = parseFloat(item.debit) || 0;
        const credit = parseFloat(item.credit) || 0;
        const balance = item.balance != null ? parseFloat(item.balance) : parseFloat((debit - credit).toFixed(2));

        setFormData({
          ...item,
          suppliers_fk_id: resolved.supplierId || item.suppliers_fk_id || (resolved.name ? resolved.name : ''),
          supplier_name: resolved.name || item.supplier_name || '',
          transaction_date: txDate,
          payment_date: payDate,
          description: item.description || '',
          debit: debit,
          credit: credit,
          balance: balance
        });
      } else {
        setFormData({
          transaction_date: new Date().toISOString().split('T')[0],
          payment_date: '',
          debit: 0,
          credit: 0,
          balance: 0,
          description: '',
          suppliers_fk_id: '',
          supplier_name: ''
        });
      }
      setError(null);
    }
  }, [isOpen, item, proveedores, empleados]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };
      const debit = parseFloat(field === 'debit' ? value : updated.debit) || 0;
      const credit = parseFloat(field === 'credit' ? value : updated.credit) || 0;
      updated.balance = parseFloat((debit - credit).toFixed(2));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const selectedProv = proveedores?.find((s: any) => (s.id || s.supplier_id) === formData.suppliers_fk_id);
      const selectedEmp = empleados?.find((emp: any) => (emp.id || emp.employee_id) === formData.suppliers_fk_id);

      const payload = {
        ...formData,
        supplier_name: selectedProv?.supplier_name || selectedEmp?.employee_name || formData.supplier_name || '',
        debit: parseFloat(formData.debit || 0),
        credit: parseFloat(formData.credit || 0),
        balance: parseFloat(formData.balance || 0),
      };

      const targetId = item?.id || item?.ap_id;
      if (targetId) {
        await updateEntity("GestionTallerProd_accounts_payable", targetId, payload);
      } else {
        await createEntity("GestionTallerProd_accounts_payable", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la cuenta por pagar");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-2xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-file-export text-primary"></i>
            {item ? "Editar Cuenta por Pagar" : "Nueva Cuenta por Pagar"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-semibold border border-red-200">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor / Beneficiario *</label>
                <select
                  required
                  value={formData.suppliers_fk_id || ""}
                  onChange={e => {
                    const selId = e.target.value;
                    const selProv = proveedores?.find((s: any) => (s.id || s.supplier_id) === selId);
                    const selEmp = empleados?.find((emp: any) => (emp.id || emp.employee_id) === selId);
                    setFormData((prev: any) => ({
                      ...prev,
                      suppliers_fk_id: selId,
                      supplier_name: selProv?.supplier_name || selEmp?.employee_name || prev.supplier_name
                    }));
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm font-semibold"
                >
                  <option value="">Seleccionar Proveedor / Beneficiario...</option>

                  {formData.suppliers_fk_id && 
                   !proveedores?.some((s: any) => (s.id || s.supplier_id) === formData.suppliers_fk_id) && 
                   !empleados?.some((emp: any) => (emp.id || emp.employee_id) === formData.suppliers_fk_id) && (
                    <option value={formData.suppliers_fk_id}>
                      {formData.supplier_name || item?.supplier_name || 'Proveedor seleccionado'} ({formData.suppliers_fk_id})
                    </option>
                  )}

                  <optgroup label="Proveedores de Repuestos y Servicios">
                    {proveedores?.map((s: any) => (
                      <option key={s.id || s.supplier_id} value={s.id || s.supplier_id}>
                        {s.supplier_name} {s.contact_person ? `(${s.contact_person})` : ''}
                      </option>
                    ))}
                  </optgroup>

                  {empleados && empleados.length > 0 && (
                    <optgroup label="Personal / Pagos y Comisiones Internas">
                      {empleados?.map((emp: any) => (
                        <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                          {emp.employee_name} ({emp.position || 'Mecánico'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Transacción *</label>
                <input 
                  type="date" 
                  required
                  value={formData.transaction_date || ""} 
                  onChange={e => handleFieldChange("transaction_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                <input 
                  type="text" 
                  required
                  value={formData.description || ""} 
                  onChange={e => handleFieldChange("description", e.target.value)} 
                  placeholder="COMPRA DE REPUESTOS / FACTURA SUMINISTROS" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Debe (Pagos Realizados) ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.debit ?? 0} 
                  onChange={e => handleFieldChange("debit", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm text-green-700 font-semibold" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Haber (Monto por Pagar) ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.credit ?? 0} 
                  onChange={e => handleFieldChange("credit", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm text-red-700 font-semibold" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Saldo ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.balance ?? 0} 
                  onChange={e => handleFieldChange("balance", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50 font-bold text-sm text-secondary" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Estimada de Pago</label>
                <input 
                  type="date" 
                  value={formData.payment_date || ""} 
                  onChange={e => handleFieldChange("payment_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition font-semibold text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all shadow-soft font-bold text-sm flex items-center gap-2"
            >
              {loading && <i className="fas fa-spinner fa-spin"></i>}
              {item ? "Guardar Cambios" : "Crear Registro CxP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
