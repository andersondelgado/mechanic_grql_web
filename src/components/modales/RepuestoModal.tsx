import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";

interface RepuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  repuesto?: any;
}

export default function RepuestoModal({ isOpen, onClose, onSuccess, repuesto }: RepuestoModalProps) {
  const [formData, setFormData] = useState<any>({
    stock_main: 0,
    stock_caracas: 0,
    price_without_tax: 0,
    discount_1: 0,
    discounted_price_1: 0,
    final_discounted_price: 0,
    category: 'General'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (repuesto) {
        setFormData(repuesto);
      } else {
        setFormData({
          stock_main: 0,
          stock_caracas: 0,
          price_without_tax: 0,
          discount_1: 0,
          discounted_price_1: 0,
          final_discounted_price: 0,
          category: 'General'
        });
      }
      setError(null);
    }
  }, [isOpen, repuesto]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };
      if (field === 'price_without_tax' || field === 'discount_1') {
        const price = parseFloat(field === 'price_without_tax' ? value : updated.price_without_tax) || 0;
        const discount = parseFloat(field === 'discount_1' ? value : updated.discount_1) || 0;
        const discounted = price * (1 - discount / 100);
        updated.discounted_price_1 = parseFloat(discounted.toFixed(2));
        updated.final_discounted_price = parseFloat((discounted * 1.16).toFixed(2));
      }
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
        stock_main: parseInt(formData.stock_main || 0, 10),
        stock_caracas: parseInt(formData.stock_caracas || 0, 10),
        price_without_tax: parseFloat(formData.price_without_tax || 0),
        discount_1: parseFloat(formData.discount_1 || 0),
        discounted_price_1: parseFloat(formData.discounted_price_1 || 0),
        discount_2: parseFloat(formData.discount_2 || 0),
        final_discounted_price: parseFloat(formData.final_discounted_price || 0),
        final_discount: parseFloat(formData.final_discount || 0),
        price_by_rubro: parseFloat(formData.price_by_rubro || 0),
        bs_to_uro: parseFloat(formData.bs_to_uro || 0),
      };

      if (repuesto?.id) {
        await updateEntity("GestionTallerProd_parts_catalog", repuesto.id, payload);
      } else {
        await createEntity("GestionTallerProd_parts_catalog", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el repuesto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-4xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-gears text-primary"></i>
            {repuesto ? "Editar Repuesto" : "Nuevo Repuesto en Catálogo"}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código de Parte *</label>
                <input 
                  type="text" 
                  required
                  value={formData.part_code || ""} 
                  onChange={e => handleFieldChange("part_code", e.target.value.toUpperCase())} 
                  placeholder="3EN1-520396" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm font-mono uppercase" 
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción del Repuesto *</label>
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
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <input 
                  type="text" 
                  value={formData.category || ""} 
                  onChange={e => handleFieldChange("category", e.target.value)} 
                  placeholder="Químicos / Suspensión / Motor" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio sin IVA ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.price_without_tax ?? 0} 
                  onChange={e => handleFieldChange("price_without_tax", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descuento (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.discount_1 ?? 0} 
                  onChange={e => handleFieldChange("discount_1", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Final con IVA ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.final_discounted_price ?? 0} 
                  onChange={e => handleFieldChange("final_discounted_price", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-primary/40 bg-primary/5 rounded-xl font-bold text-sm text-secondary" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Principal</label>
                <input 
                  type="number" 
                  value={formData.stock_main ?? 0} 
                  onChange={e => handleFieldChange("stock_main", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Caracas</label>
                <input 
                  type="number" 
                  value={formData.stock_caracas ?? 0} 
                  onChange={e => handleFieldChange("stock_caracas", e.target.value)} 
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
              {repuesto ? "Guardar Cambios" : "Agregar al Catálogo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
