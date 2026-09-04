import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";

interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedor?: any; // Si se pasa, estamos editando
}

export default function ProveedorModal({ isOpen, onClose, onSuccess, proveedor }: ProveedorModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (proveedor) {
        setFormData(proveedor);
      } else {
        setFormData({});
      }
      setError(null);
    }
  }, [isOpen, proveedor]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (proveedor?.id) {
        await updateEntity("GestionTallerProd_suppliers", proveedor.id, formData);
      } else {
        await createEntity("GestionTallerProd_suppliers", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el proveedor");
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
      <div className="bg-white rounded-3xl shadow-strong max-w-2xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
            <i className="fas fa-truck-field text-primary"></i>
            {proveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Empresa o Proveedor *</label>
                <input 
                  type="text" 
                  required
                  value={formData.supplier_name || ""} 
                  onChange={e => handleFieldChange("supplier_name", e.target.value)} 
                  placeholder="Ej: Distribuidora AutoParts C.A." 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Persona de Contacto</label>
                <input 
                  type="text" 
                  value={formData.contact_person || ""} 
                  onChange={e => handleFieldChange("contact_person", e.target.value)} 
                  placeholder="Nombre del vendedor o representante" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono / Celular</label>
                <input 
                  type="tel" 
                  value={formData.cell_phone || ""} 
                  onChange={e => handleFieldChange("cell_phone", e.target.value)} 
                  placeholder="0414-XXXXXXX" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.email || ""} 
                  onChange={e => handleFieldChange("email", e.target.value)} 
                  placeholder="contacto@empresa.com" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">¿Qué distribuye?</label>
                <input 
                  type="text" 
                  value={formData.distributes_parts || ""} 
                  onChange={e => handleFieldChange("distributes_parts", e.target.value)} 
                  placeholder="Ej: Filtros, Aceites, Frenos Toyota" 
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm" 
                />
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
