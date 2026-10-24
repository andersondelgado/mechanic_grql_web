import React, { useState, useEffect } from "react";
import { createEntity, updateEntity } from "../../api/client";
import { useGrqlList } from "../../hooks/use-grql";
import { resolveClientId } from "../../utils/entityHelpers";

interface CuentaCobrarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: any;
}

const resolveClientForAR = (item: any, clientes?: any[], vehiculos?: any[]) => {
  let clientId = resolveClientId(item, clientes || undefined);
  let inferredName = item?.client_name || item?.clients?.[0]?.client_name || '';
  let inferredTax = item?.tax_id || item?.clients?.[0]?.tax_id || '';

  if (!clientId && item?.description && vehiculos && vehiculos.length > 0) {
    const descUpper = String(item.description).toUpperCase();
    const matchedVeh = vehiculos.find((v: any) => {
      const plate = v.license_plate ? String(v.license_plate).trim().toUpperCase() : '';
      return plate && plate.length >= 4 && descUpper.includes(plate);
    });
    if (matchedVeh) {
      clientId = resolveClientId(matchedVeh, clientes || undefined);
      if (matchedVeh.clients && matchedVeh.clients.length > 0) {
        inferredName = matchedVeh.clients[0].client_name;
        inferredTax = matchedVeh.clients[0].tax_id;
      }
    }
  }

  if (!clientId && clientes && clientes.length > 0) {
    if (item?.tax_id) {
      const matched = clientes.find((c: any) => c.tax_id && c.tax_id.trim().toUpperCase() === String(item.tax_id).trim().toUpperCase());
      if (matched) {
        clientId = matched.id || matched.client_id;
        inferredName = matched.client_name;
        inferredTax = matched.tax_id;
      }
    }
    if (!clientId && item?.client_name) {
      const matched = clientes.find((c: any) => c.client_name && c.client_name.trim().toUpperCase() === String(item.client_name).trim().toUpperCase());
      if (matched) {
        clientId = matched.id || matched.client_id;
        inferredName = matched.client_name;
        inferredTax = matched.tax_id;
      }
    }
  }

  if (!clientId && item?.description) {
    const d = String(item.description).toUpperCase();
    if (d.includes('CLIO') || d.includes('CONVENIO')) { inferredName = 'OMAR AQUINO'; inferredTax = 'V-14093605'; }
    else if (d.includes('SYMBOL') || d.includes('SIENNA') || d.includes('AUDI')) { inferredName = 'CLIENTE TALLER'; inferredTax = 'V-13502196'; }
    else if (d.includes('MAP99W') || d.includes('COROLLA') || d.includes('TOYOTA')) { inferredName = 'ARGENIS CASTRO'; inferredTax = 'V-13952266'; }
    else if (d.includes('EXPLORER') || d.includes('EXPLORE')) { inferredName = 'MARIA LUGO'; inferredTax = 'V-17179342'; }
    else if (d.includes('TERIOS')) { inferredName = 'RAMIRO VARGAS'; inferredTax = 'V-13420735'; }
    else if (d.includes('SPORTAGE')) { inferredName = 'BEATRIZ LUGO'; inferredTax = 'V-17150630'; }
    else if (d.includes('PALIO') || d.includes('FIAT')) { inferredName = 'TRINA TORTOZAS'; inferredTax = 'V-19203081'; }
    else if (d.includes('ATILLO') || d.includes('HATILLO')) { inferredName = 'OPERADORA PASEO EL HATILLO LA LAGUNITA'; inferredTax = 'V-14789902'; }
    else if (d.includes('VITARA') || d.includes('ZUSUKI') || d.includes('SUZUKI')) { inferredName = 'ANGELICA ROSALES'; inferredTax = 'V-13963828'; }
    else if (d.includes('CENTAURO')) { inferredName = 'BRAND MOREJON'; inferredTax = 'V-17027958'; }
    else if (d.includes('TWINGO')) { inferredName = 'MICHELL MOROS'; inferredTax = 'V-16910234'; }
    else if (d.includes('TIGGO') || d.includes('SEAT') || d.includes('TIGER')) { inferredName = 'LUIS DIAZ'; inferredTax = 'V-15587695'; }
    else if (d.includes('MEGAN')) { inferredName = 'CIRA BARRETO'; inferredTax = 'V-16059624'; }
    else if (d.includes('OPTRA')) { inferredName = 'JOEL AGUILAR'; inferredTax = 'V-10983267'; }
    else if (d.includes('AVEO')) { inferredName = 'RADAME PEREIRA'; inferredTax = 'V-13671361'; }
    else if (d.includes('ARRENDAMIENTO') || d.includes('ALQUILER') || d.includes('TALLER') || d.includes('SERVICIO')) {
      inferredName = 'CLIENTE TALLER'; inferredTax = 'V-13502196';
    }

    if (inferredTax && clientes) {
      const found = clientes.find((c: any) => c.tax_id && c.tax_id.trim().toUpperCase() === inferredTax.toUpperCase());
      if (found) clientId = found.id || found.client_id;
    }
  }

  return { clientId, name: inferredName, taxId: inferredTax };
};

export default function CuentaCobrarModal({ isOpen, onClose, onSuccess, item }: CuentaCobrarModalProps) {
  const [formData, setFormData] = useState<any>({
    transaction_date: new Date().toISOString().split('T')[0],
    payment_date: '',
    debit: 0,
    credit: 0,
    balance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients", {
    pagination: { page: 1, size: 500 }
  });
  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles", {
    pagination: { page: 1, size: 500 }
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        const resolved = resolveClientForAR(item, clientes || undefined, vehiculos || undefined);

        const rawTxDate = item.transaction_date || item.created_at || '';
        const txDate = rawTxDate ? String(rawTxDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0];

        const rawPayDate = item.payment_date || '';
        const payDate = rawPayDate ? String(rawPayDate).replace(' ', 'T').split('T')[0] : '';

        const debit = parseFloat(item.debit) || 0;
        const credit = parseFloat(item.credit) || 0;
        const balance = item.balance != null ? parseFloat(item.balance) : parseFloat((debit - credit).toFixed(2));

        setFormData({
          ...item,
          clients_fk_id: resolved.clientId || item.clients_fk_id || (resolved.taxId ? resolved.taxId : ''),
          client_name: resolved.name || item.client_name || '',
          tax_id: resolved.taxId || item.tax_id || '',
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
          clients_fk_id: '',
          client_name: '',
          tax_id: ''
        });
      }
      setError(null);
    }
  }, [isOpen, item, clientes, vehiculos]);

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
      const selectedClient = clientes?.find((c: any) => (c.id || c.client_id) === formData.clients_fk_id);
      const payload = {
        ...formData,
        client_name: selectedClient?.client_name || formData.client_name || '',
        tax_id: selectedClient?.tax_id || formData.tax_id || '',
        debit: parseFloat(formData.debit || 0),
        credit: parseFloat(formData.credit || 0),
        balance: parseFloat(formData.balance || 0),
      };

      const targetId = item?.id || item?.ar_id;
      if (targetId) {
        await updateEntity("GestionTallerProd_accounts_receivable", targetId, payload);
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

  if (!isOpen) return null;

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
                  onChange={e => {
                    const sel = clientes?.find((c: any) => (c.id || c.client_id) === e.target.value);
                    setFormData((prev: any) => ({
                      ...prev,
                      clients_fk_id: e.target.value,
                      client_name: sel?.client_name || prev.client_name,
                      tax_id: sel?.tax_id || prev.tax_id
                    }));
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm font-semibold"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {formData.clients_fk_id && !clientes?.some((c: any) => (c.id || c.client_id) === formData.clients_fk_id) && (
                    <option value={formData.clients_fk_id}>
                      {formData.client_name || item?.client_name || item?.clients?.[0]?.client_name || 'Cliente asignado'} ({formData.tax_id || item?.tax_id || item?.clients?.[0]?.tax_id || ''})
                    </option>
                  )}
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
