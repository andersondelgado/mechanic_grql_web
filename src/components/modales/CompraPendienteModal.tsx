import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface CompraPendienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  compra?: any;
}

export default function CompraPendienteModal({ isOpen, onClose, onSuccess, compra }: CompraPendienteModalProps) {
  const [formData, setFormData] = useState<any>({
    info_date: new Date().toISOString().split('T')[0],
    purchased: false,
    quantity: 1,
    unit_price: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: proveedores } = useGrqlList<any[]>("GestionTallerProd_suppliers");

  useEffect(() => {
    if (isOpen) {
      if (compra) {
        let supplierId = compra.suppliers_fk_id;
        if (Array.isArray(supplierId) && supplierId.length > 0) {
          supplierId = typeof supplierId[0] === 'object' ? (supplierId[0].id || supplierId[0].supplier_id) : supplierId[0];
        } else if (!supplierId && Array.isArray(compra.suppliers) && compra.suppliers.length > 0) {
          supplierId = compra.suppliers[0]?.id || compra.suppliers[0]?.supplier_id;
        }

        const rawDate = compra.info_date || compra.created_at || '';
        const infoDate = rawDate ? String(rawDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        setFormData({
          ...compra,
          suppliers_fk_id: supplierId || '',
          info_date: infoDate,
          purchased: Boolean(compra.purchased),
          quantity: Number(compra.quantity || 1),
          unit_price: Number(compra.unit_price || 0)
        });
      } else {
        setFormData({
          info_date: new Date().toISOString().split('T')[0],
          purchased: false,
          quantity: 1,
          unit_price: 0
        });
      }
      setError(null);
    }
  }, [isOpen, compra]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = proveedores?.find((s: any) => s.id === supplierId || s.supplier_id === supplierId);
    setFormData((prev: any) => ({
      ...prev,
      suppliers_fk_id: supplierId,
      supplier_name: supplier?.supplier_name || prev.supplier_name || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity || 0),
        unit_price: parseFloat(formData.unit_price || 0),
        purchased: Boolean(formData.purchased),
      };

      if (compra?.id) {
        await updateEntity("GestionTallerProd_pending_purchases", compra.id, payload);
      } else {
        await createEntity("GestionTallerProd_pending_purchases", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la compra pendiente");
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
            <i className="fas fa-box-open text-primary"></i>
            {compra ? "Editar Compra Pendiente" : "Nueva Compra Pendiente"}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Info *</label>
                <input 
                  type="date" 
                  required
                  value={formData.info_date || ""} 
                  onChange={e => handleFieldChange("info_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Compra</label>
                <input 
                  type="date" 
                  value={formData.purchase_date || ""} 
                  onChange={e => handleFieldChange("purchase_date", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Producto o Repuesto *</label>
                <input 
                  type="text" 
                  required
                  value={formData.product_name || ""} 
                  onChange={e => handleFieldChange("product_name", e.target.value.toUpperCase())} 
                  placeholder="SILICON / LAMPARAS / FILTRO DE ACEITE" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
                <select
                  value={formData.suppliers_fk_id || ""}
                  onChange={e => handleSupplierSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                >
                  <option value="">Seleccionar Proveedor...</option>
                  {proveedores?.map((s: any) => (
                    <option key={s.id || s.supplier_id} value={s.id || s.supplier_id}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.quantity ?? 1} 
                  onChange={e => handleFieldChange("quantity", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Unitario Estimado ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.unit_price ?? 0} 
                  onChange={e => handleFieldChange("unit_price", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input 
                  type="checkbox" 
                  id="purchased_checkbox"
                  checked={Boolean(formData.purchased)} 
                  onChange={e => handleFieldChange("purchased", e.target.checked)} 
                  className="w-5 h-5 text-primary rounded focus:ring-primary" 
                />
                <label htmlFor="purchased_checkbox" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  ¿Ya ha sido comprado?
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones / Notas</label>
                <textarea 
                  rows={2}
                  value={formData.notes || ""} 
                  onChange={e => handleFieldChange("notes", e.target.value)} 
                  placeholder="Detalles sobre urgencia, destino o cotizaciones obtenidas..." 
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
              {compra ? "Guardar Cambios" : "Registrar Compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
