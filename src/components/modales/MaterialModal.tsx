import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material?: any;
}

export default function MaterialModal({ isOpen, onClose, onSuccess, material }: MaterialModalProps) {
  const [formData, setFormData] = useState<any>({
    material_usage_qty: 1,
    labor_cost: 0,
    paint_amount: 0,
    sandpaper: 0,
    total_cost_per_piece: 0,
    labor_and_cost_profit: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (material) {
        setFormData(material);
      } else {
        setFormData({
          material_usage_qty: 1,
          labor_cost: 0,
          paint_amount: 0,
          sandpaper: 0,
          total_cost_per_piece: 0,
          labor_and_cost_profit: 0,
        });
      }
      setError(null);
    }
  }, [isOpen, material]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };
      const labor = parseFloat(field === 'labor_cost' ? value : updated.labor_cost) || 0;
      const paint = parseFloat(field === 'paint_price' ? value : updated.paint_price) || 0;
      const mat = parseFloat(field === 'material_cost' ? value : updated.material_cost) || 0;
      const total = labor + paint + mat;
      updated.total_cost_per_piece = parseFloat(total.toFixed(2));
      updated.labor_and_cost_profit = parseFloat((total * 0.25).toFixed(2));
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
        material_usage_qty: parseFloat(formData.material_usage_qty || 0),
        labor_cost: parseFloat(formData.labor_cost || 0),
        paint_amount: parseFloat(formData.paint_amount || 0),
        sandpaper: parseFloat(formData.sandpaper || 0),
        protective_paper: parseFloat(formData.protective_paper || 0),
        wire: parseFloat(formData.wire || 0),
        material_cost: parseFloat(formData.material_cost || 0),
        paint_price: parseFloat(formData.paint_price || 0),
        total_cost_per_piece: parseFloat(formData.total_cost_per_piece || 0),
        labor_and_cost_profit: parseFloat(formData.labor_and_cost_profit || 0),
      };

      if (material?.id) {
        await updateEntity("GestionTallerProd_body_shop_materials", material.id, payload);
      } else {
        await createEntity("GestionTallerProd_body_shop_materials", payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el material de latonería");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-3xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-paint-roller text-primary"></i>
            {material ? "Editar Material de Latonería" : "Nuevo Material / Pieza de Latonería"}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de Pieza *</label>
                <input 
                  type="text" 
                  required
                  value={formData.piece_name || ""} 
                  onChange={e => handleFieldChange("piece_name", e.target.value.toUpperCase())} 
                  placeholder="PUERTAS CARRO / CAPÓ / TECHO" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm uppercase" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad de Uso</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.material_usage_qty ?? 1} 
                  onChange={e => handleFieldChange("material_usage_qty", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mano de Obra ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.labor_cost ?? 0} 
                  onChange={e => handleFieldChange("labor_cost", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pintura (L / Cant)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.paint_amount ?? 0} 
                  onChange={e => handleFieldChange("paint_amount", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Pintura ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.paint_price ?? 0} 
                  onChange={e => handleFieldChange("paint_price", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lijas (Unidades)</label>
                <input 
                  type="number" 
                  value={formData.sandpaper ?? 0} 
                  onChange={e => handleFieldChange("sandpaper", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Costos Adicionales ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.material_cost ?? 0} 
                  onChange={e => handleFieldChange("material_cost", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Costo Total ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.total_cost_per_piece ?? 0} 
                  onChange={e => handleFieldChange("total_cost_per_piece", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-50 font-bold text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ganancia Estimada ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.labor_and_cost_profit ?? 0} 
                  onChange={e => handleFieldChange("labor_and_cost_profit", e.target.value)} 
                  className="w-full px-4 py-2.5 border-2 border-green-300 bg-green-50 text-green-700 font-bold text-sm rounded-xl" 
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
              {material ? "Guardar Cambios" : "Registrar Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
