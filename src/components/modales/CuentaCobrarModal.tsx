import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface CuentaCobrarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: any;
}

export default function CuentaCobrarModal({ isOpen, onClose, onSuccess, item }: CuentaCobrarModalProps) {
  const [formData, setFormData] = useState<any>({
    transaction_date: new Date().toISOString().split('T')[0],
    debit: 0,
    credit: 0,
    balance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients");

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData(item);
      } else {
        setFormData({
          transaction_date: new Date().toISOString().split('T')[0],
          debit: 0,
          credit: 0,
          balance: 0
        });
      }
      setError(null);
    }
  }, [isOpen, item]);

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
      const payload = {
        ...formData,
        debit: parseFloat(formData.debit || 0),
        credit: parseFloat(formData.credit || 0),
        balance: parseFloat(formData.balance || 0),
      };

      if (item?.id) {
        await updateEntity("GestionTallerProd_accounts_receivable", item.id, payload);
      } else {
        await createEntity("GestionTallerProd_accounts_receivable", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la cuenta por cobrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-2xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-file-invoice-dollar text-primary"></i>
            {item ? "Editar Cuenta por Cobrar" : "Nueva Cuenta por Cobrar"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                <select
                  required
                  value={formData.clients_fk_id || ""}
                  onChange={e => handleFieldChange("clients_fk_id", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clientes?.map((c: any) => (
                    <option key={c.id || c.client_id} value={c.id || c.client_id}>
                      {c.client_name} ({c.tax_id})
                    </option>
                  ))}
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
                  placeholder="DEUDAS PENDIENTES / SERVICIO DE REPARACION" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Debe (Facturado / Cargos) ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.debit ?? 0} 
                  onChange={e => handleFieldChange("debit", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm text-green-700 font-semibold" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Haber (Abonos / Pagado) ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.credit ?? 0} 
                  onChange={e => handleFieldChange("credit", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm text-blue-700 font-semibold" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Saldo Pendiente ($)</label>
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
              {item ? "Guardar Cambios" : "Crear Registro CxC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
