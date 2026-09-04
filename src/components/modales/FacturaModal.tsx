import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";

interface FacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  factura?: any;
}

export default function FacturaModal({ isOpen, onClose, onSuccess, factura }: FacturaModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (factura) {
        setFormData(factura);
      } else {
        setFormData({});
      }
      setError(null);
    }
  }, [isOpen, factura]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    // Auto-calculate balance
    const debit = parseFloat(newData.debit) || 0;
    const credit = parseFloat(newData.credit) || 0;
    newData.balance = debit - credit;
    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (factura?.id) {
        await updateEntity("GestionTallerProd_customer_account_statements", factura.id, formData);
      } else {
        await createEntity("GestionTallerProd_customer_account_statements", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el estado de cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-lg w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-file-invoice-dollar text-primary"></i>
            {factura ? "Editar Estado de Cuenta" : "Nuevo Estado de Cuenta"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-semibold border border-red-200">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente ID *</label>
                <input 
                  type="text" 
                  required
                  value={formData.clients_fk_id || ""} 
                  onChange={e => handleFieldChange("clients_fk_id", e.target.value)} 
                  placeholder="ID del cliente" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm font-mono" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Transacción *</label>
                <input 
                  type="date" 
                  required
                  value={formData.transaction_date ? String(formData.transaction_date).split('T')[0] : ""} 
                  onChange={e => handleFieldChange("transaction_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <input 
                  type="text"
                  value={formData.description || ""} 
                  onChange={e => handleFieldChange("description", e.target.value)} 
                  placeholder="Descripción de la factura o pago" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Débito (Cobrar) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.debit || ""} 
                    onChange={e => handleFieldChange("debit", parseFloat(e.target.value))} 
                    placeholder="0.00" 
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition outline-none text-sm text-red-600 font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Crédito (Abonado) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.credit || ""} 
                    onChange={e => handleFieldChange("credit", parseFloat(e.target.value))} 
                    placeholder="0.00" 
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 transition outline-none text-sm text-green-600 font-bold" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Balance Calculado</label>
                <div className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-500">
                  ${Number(formData.balance || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-3xl">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition font-bold text-sm bg-white">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-soft font-bold text-sm">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Guardar Registro
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
