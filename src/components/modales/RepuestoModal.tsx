import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";

interface RepuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  repuesto?: any; // If provided, we are editing
}

export default function RepuestoModal({ isOpen, onClose, onSuccess, repuesto }: RepuestoModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch suppliers to populate the select dropdown
  const { data: proveedores, loading: loadingProveedores } = useGrqlList<any[]>("GestionTallerProd_suppliers");

  useEffect(() => {
    if (isOpen) {
      if (repuesto) {
        setFormData(repuesto);
      } else {
        setFormData({});
      }
      setError(null);
    }
  }, [isOpen, repuesto]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (repuesto?.id) {
        await updateEntity("GestionTallerProd_parts_catalog", repuesto.id, formData);
      } else {
        await createEntity("GestionTallerProd_parts_catalog", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el repuesto");
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-4xl w-full my-8 mx-2 sm:mx-0 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-box text-primary"></i>
            {repuesto ? "Editar Repuesto" : "Nuevo Repuesto"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-semibold border border-red-200">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código *</label>
                <input 
                  type="text" 
                  required
                  value={formData.part_number || ""} 
                  onChange={e => handleFieldChange("part_number", e.target.value)} 
                  placeholder="3EN1-520396" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                <input 
                  type="text" 
                  required
                  value={formData.description || ""} 
                  onChange={e => handleFieldChange("description", e.target.value)} 
                  placeholder="3-EN-1 TEC DESENGRASANTE" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                <input 
                  type="text" 
                  value={formData.brand || ""} 
                  onChange={e => handleFieldChange("brand", e.target.value)} 
                  placeholder="3-EN-1" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <input 
                  type="text" 
                  value={formData.category || ""} 
                  onChange={e => handleFieldChange("category", e.target.value)} 
                  placeholder="Líquidos, Motor, Suspensión..." 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio sin IVA</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.purchase_price || ""} 
                  onChange={e => handleFieldChange("purchase_price", parseFloat(e.target.value))} 
                  placeholder="30.73" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio con IVA (Venta)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.sale_price || ""} 
                  onChange={e => handleFieldChange("sale_price", parseFloat(e.target.value))} 
                  placeholder="35.65" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Disponible</label>
                <input 
                  type="number" 
                  value={formData.stock_quantity || ""} 
                  onChange={e => handleFieldChange("stock_quantity", parseInt(e.target.value, 10))} 
                  placeholder="3" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Mínimo</label>
                <input 
                  type="number" 
                  value={formData.minimum_stock || ""} 
                  onChange={e => handleFieldChange("minimum_stock", parseInt(e.target.value, 10))} 
                  placeholder="5" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
                <select 
                  value={formData.suppliers_fk_id || ""} 
                  onChange={e => handleFieldChange("suppliers_fk_id", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white"
                >
                  <option value="">Seleccionar proveedor (Opcional)...</option>
                  {loadingProveedores ? (
                    <option disabled>Cargando proveedores...</option>
                  ) : (
                    proveedores?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.supplier_name || p.contact_name}
                      </option>
                    ))
                  )}
                </select>
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
                  <i className="fas fa-save"></i> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
