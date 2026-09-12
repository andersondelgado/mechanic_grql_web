import React, { useState, useEffect } from 'react';
import { createEntity, updateEntity } from '../../api/client';
import { useGrqlList } from '../../hooks/use-grql';
import type { VehicleReceipt, ChecklistItem, DamagePoint } from '../../types/entities';
import FuelGaugeSelector from './FuelGaugeSelector';
import VehicleDamageCanvas from './VehicleDamageCanvas';
import InspectionChecklistGrid, { EXTERNAL_GROUPS, INTERNAL_GROUPS } from './InspectionChecklistGrid';
import SignaturePad from './SignaturePadModal';
import PrintableReceiptSheet from './PrintableReceiptSheet';

interface RecepcionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recepcion?: any;
}

export const RecepcionWizardModal: React.FC<RecepcionWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  recepcion
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedReceiptData, setSavedReceiptData] = useState<VehicleReceipt | null>(null);

  // Entities lists
  const { data: vehiculos } = useGrqlList<any[]>('GestionTallerProd_vehicles');
  const { data: empleados } = useGrqlList<any[]>('GestionTallerProd_employees');
  const { data: clientes } = useGrqlList<any[]>('GestionTallerProd_clients');

  // Form State
  const [formData, setFormData] = useState<VehicleReceipt>({
    entry_date: new Date().toISOString().split('T')[0],
    license_plate: '',
    brand: '',
    model: '',
    color: '',
    mileage: '',
    owner_name: '',
    owner_tax_id: '',
    phone: '',
    address: '',
    fuel_level: '1/2',
    status: 'proceso',
    reason_for_entry: '',
    observations: '',
    authorized_services: '',
    received_by: '',
    receiving_technician: '',
    delivered_by: '',
    assigned_technician: '',
    checklist_external: [],
    checklist_internal: [],
    damage_points: [],
    client_signature: '',
    mechanic_signature: ''
  });

  // Initialize or Populate Form
  useEffect(() => {
    if (isOpen) {
      if (recepcion) {
        // Parse JSON fields if stored as strings
        let extList: ChecklistItem[] = [];
        if (recepcion.checklist_external) {
          extList = typeof recepcion.checklist_external === 'string'
            ? JSON.parse(recepcion.checklist_external)
            : recepcion.checklist_external;
        }

        let intList: ChecklistItem[] = [];
        if (recepcion.checklist_internal) {
          intList = typeof recepcion.checklist_internal === 'string'
            ? JSON.parse(recepcion.checklist_internal)
            : recepcion.checklist_internal;
        }

        let dmgPoints: DamagePoint[] = [];
        if (recepcion.damage_points) {
          dmgPoints = typeof recepcion.damage_points === 'string'
            ? JSON.parse(recepcion.damage_points)
            : recepcion.damage_points;
        }

        const rawDate = recepcion.entry_date || recepcion.created_at || '';
        const entryDate = rawDate ? String(rawDate).split('T')[0] : new Date().toISOString().split('T')[0];

        const vehicle = recepcion.vehicles?.[0];
        const client = recepcion.clients?.[0] || vehicle?.clients?.[0];

        let vId = recepcion.vehicles_fk_id;
        if (Array.isArray(vId) && vId.length > 0) {
          vId = typeof vId[0] === 'object' ? (vId[0].id || vId[0].vehicle_id) : vId[0];
        } else if (!vId) {
          vId = vehicle?.id || vehicle?.vehicle_id || '';
        }

        setFormData({
          ...recepcion,
          vehicles_fk_id: vId || '',
          entry_date: entryDate,
          license_plate: recepcion.license_plate || vehicle?.license_plate || '',
          brand: recepcion.brand || vehicle?.brand || '',
          model: recepcion.model || vehicle?.model || '',
          color: recepcion.color || vehicle?.color || '',
          mileage: recepcion.mileage || vehicle?.mileage || '',
          owner_name: recepcion.owner_name || client?.client_name || '',
          owner_tax_id: recepcion.owner_tax_id || client?.tax_id || '',
          phone: recepcion.phone || recepcion.owner_phone || client?.cell_phone || '',
          address: recepcion.address || client?.address || '',
          fuel_level: recepcion.fuel_level || '1/2',
          status: recepcion.status || 'proceso',
          reason_for_entry: recepcion.reason_for_entry || recepcion.observations || '',
          observations: recepcion.observations || '',
          authorized_services: recepcion.authorized_services || recepcion.work_performed || '',
          checklist_external: extList,
          checklist_internal: intList,
          damage_points: dmgPoints,
          client_signature: recepcion.client_signature || '',
          mechanic_signature: recepcion.mechanic_signature || ''
        });
      } else {
        // Brand new reception: pre-populate defaults
        const defaultExt: ChecklistItem[] = EXTERNAL_GROUPS.flatMap(g => g.items).map(name => ({
          id: name,
          name,
          status: 'ok'
        }));
        const defaultInt: ChecklistItem[] = INTERNAL_GROUPS.flatMap(g => g.items).map(name => ({
          id: name,
          name,
          status: 'ok'
        }));

        setFormData({
          entry_date: new Date().toISOString().split('T')[0],
          license_plate: '',
          brand: '',
          model: '',
          color: '',
          mileage: '',
          owner_name: '',
          owner_tax_id: '',
          phone: '',
          address: '',
          fuel_level: '1/2',
          status: 'proceso',
          reason_for_entry: '',
          observations: '',
          authorized_services: '',
          received_by: '',
          receiving_technician: '',
          delivered_by: '',
          assigned_technician: '',
          checklist_external: defaultExt,
          checklist_internal: defaultInt,
          damage_points: [],
          client_signature: '',
          mechanic_signature: ''
        });
      }
      setCurrentStep(1);
      setError(null);
      setShowPrintModal(false);
    }
  }, [isOpen, recepcion]);

  if (!isOpen) return null;

  // Handle Vehicle Selection and Auto-filling
  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVeh = vehiculos?.find((v: any) => (v.id === vehicleId || v.vehicle_id === vehicleId));
    if (!selectedVeh) {
      setFormData(prev => ({ ...prev, vehicles_fk_id: vehicleId }));
      return;
    }

    const client = selectedVeh.clients?.[0];
    const clientFound = clientes?.find((c: any) => c.id === selectedVeh.clients_fk_id || c.client_id === selectedVeh.clients_fk_id);
    const activeClient = client || clientFound;

    setFormData(prev => ({
      ...prev,
      vehicles_fk_id: vehicleId,
      license_plate: selectedVeh.license_plate || prev.license_plate,
      brand: selectedVeh.brand || prev.brand,
      model: selectedVeh.model || prev.model,
      color: selectedVeh.color || prev.color,
      mileage: selectedVeh.mileage || prev.mileage,
      clients_fk_id: activeClient?.id || prev.clients_fk_id,
      owner_name: activeClient?.client_name || selectedVeh.client_name || prev.owner_name,
      owner_tax_id: activeClient?.tax_id || prev.owner_tax_id,
      phone: activeClient?.cell_phone || activeClient?.phone || selectedVeh.phone || prev.phone,
      address: activeClient?.address || prev.address,
      delivered_by: activeClient?.client_name || prev.delivered_by || prev.owner_name
    }));
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.license_plate && !formData.vehicles_fk_id) {
        setError('Debe seleccionar un vehículo o ingresar la placa.');
        return false;
      }
      if (!formData.owner_name) {
        setError('Debe indicar el nombre del cliente o propietario.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.entry_date) {
        setError('Debe indicar la fecha de entrada.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(4, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Save to Backend (Entity or Lambda)
  const handleSave = async (andPrint = false) => {
    if (!validateCurrentStep()) return;
    setLoading(true);
    setError(null);

    const payload: any = {
      ...formData,
      checklist_external: JSON.stringify(formData.checklist_external || []),
      checklist_internal: JSON.stringify(formData.checklist_internal || []),
      damage_points: JSON.stringify(formData.damage_points || [])
    };

    try {
      let result;
      if (recepcion?.id) {
        result = await updateEntity('GestionTallerProd_vehicle_receipts', recepcion.id, payload);
      } else {
        result = await createEntity('GestionTallerProd_vehicle_receipts', payload);
      }

      const finalSavedData: VehicleReceipt = {
        ...formData,
        id: result?.id || recepcion?.id || `REC-${Date.now()}`
      };

      setSavedReceiptData(finalSavedData);
      onSuccess();

      if (andPrint) {
        setShowPrintModal(true);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Error al guardar recepción:', err);
      setError(err.message || 'Error al persistir la ficha de recepción.');
    } finally {
      setLoading(false);
    }
  };

  const stepsConfig = [
    { num: 1, title: 'Cliente & Vehículo', icon: 'fa-car' },
    { num: 2, title: 'Detalles de Ingreso', icon: 'fa-clipboard-list' },
    { num: 3, title: 'Inspección & Daños', icon: 'fa-search-plus' },
    { num: 4, title: 'Resumen & Firmas', icon: 'fa-signature' }
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-4 mx-auto flex flex-col max-h-[92vh] overflow-hidden animate-fadeIn border border-gray-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header & Stepper */}
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
                  <i className="fas fa-warehouse text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold leading-tight flex items-center gap-2">
                    {recepcion ? 'Editar Ficha de Recepción' : 'Ficha de Recepción de Vehículo'}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Formato Oficial
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Paso {currentStep} de 4: {stepsConfig[currentStep - 1].title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Stepper Navigation Bar */}
            <div className="grid grid-cols-4 gap-2">
              {stepsConfig.map((s) => {
                const isActive = currentStep === s.num;
                const isCompleted = currentStep > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (s.num < currentStep || validateCurrentStep()) {
                        setCurrentStep(s.num);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : isCompleted
                        ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-700'
                        : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                        isActive
                          ? 'bg-white text-blue-600'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isCompleted ? <i className="fas fa-check"></i> : s.num}
                    </div>
                    <span className="hidden sm:inline truncate">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fadeIn">
                <i className="fas fa-exclamation-triangle text-red-500 text-lg flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            {/* ================= STEP 1: CLIENTE & VEHÍCULO ================= */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Vehicle Selection Box */}
                <div className="bg-blue-50/50 border border-blue-150 rounded-2xl p-4 sm:p-5">
                  <h4 className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
                    <i className="fas fa-car text-primary"></i> Identificación del Vehículo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Seleccionar de la Flota Registrada (Opcional)
                      </label>
                      <select
                        value={formData.vehicles_fk_id || ''}
                        onChange={(e) => handleVehicleSelect(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      >
                        <option value="">-- Buscar o seleccionar vehículo registrado --</option>
                        {vehiculos?.map((v: any) => {
                          const pl = v.license_plate || v.plate || 'S/P';
                          const desc = `${v.brand || ''} ${v.model || ''}`.trim();
                          return (
                            <option key={v.id || v.vehicle_id} value={v.id || v.vehicle_id}>
                              [{pl}] {desc} {v.client_name ? `• ${v.client_name}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Placa / Matrícula *</label>
                      <input
                        type="text"
                        required
                        value={formData.license_plate}
                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                        placeholder="Ej: ABC123"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Marca</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Ej: Toyota"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Modelo</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="Ej: Corolla"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Color</label>
                      <input
                        type="text"
                        value={formData.color || ''}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="Ej: Blanco"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Kilometraje Inicial (Km)</label>
                      <input
                        type="text"
                        value={formData.mileage || ''}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        placeholder="Ej: 145000"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Estado en Taller</label>
                      <select
                        value={formData.status || 'proceso'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      >
                        <option value="proceso">En Proceso / Taller</option>
                        <option value="espera_repuestos">Espera de Repuestos</option>
                        <option value="listo">Listo para Entrega</option>
                        <option value="entregado">Entregado al Cliente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Client / Owner Information Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <h4 className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
                    <i className="fas fa-user text-primary"></i> Datos del Propietario / Cliente
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo / Razón Social *</label>
                      <input
                        type="text"
                        required
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        placeholder="Nombre y Apellido o Empresa"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">C.I. / RIF / Pasaporte</label>
                      <input
                        type="text"
                        value={formData.owner_tax_id || ''}
                        onChange={(e) => setFormData({ ...formData, owner_tax_id: e.target.value })}
                        placeholder="V-12345678"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono Móvil / Contacto</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0414-XXXXXXX"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Dirección de Habitación / Entrega</label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Ciudad, sector, residencia..."
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Custody and Personnel Assigned */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5">
                  <h4 className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
                    <i className="fas fa-user-shield text-primary"></i> Custodia y Personal Asignado
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Recibido por (Taller)</label>
                      <select
                        value={formData.receiving_technician || formData.received_by || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            receiving_technician: e.target.value,
                            received_by: e.target.value
                          })
                        }
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      >
                        <option value="">-- Seleccionar personal --</option>
                        {empleados?.map((emp: any) => (
                          <option key={emp.id || emp.employee_id} value={emp.employee_name}>
                            {emp.employee_name} ({emp.position || 'Receptor'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Entregado por (Cliente/Chofer)</label>
                      <input
                        type="text"
                        value={formData.delivered_by || formData.owner_name || ''}
                        onChange={(e) => setFormData({ ...formData, delivered_by: e.target.value })}
                        placeholder="Nombre de quien entrega la llave"
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Técnico Mecánico Asignado</label>
                      <select
                        value={formData.assigned_technician || ''}
                        onChange={(e) => setFormData({ ...formData, assigned_technician: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      >
                        <option value="">-- Asignar mecánico --</option>
                        {empleados?.map((emp: any) => (
                          <option key={emp.id || emp.employee_id} value={emp.employee_name}>
                            {emp.employee_name} ({emp.position || 'Mecánico'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: DETALLES DE INGRESO ================= */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Entrada *</label>
                    <input
                      type="date"
                      required
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Estimada de Entrega</label>
                    <input
                      type="date"
                      value={formData.exit_date || ''}
                      onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Fuel Gauge Selector */}
                <FuelGaugeSelector
                  value={formData.fuel_level || '1/2'}
                  onChange={(val) => setFormData({ ...formData, fuel_level: val })}
                />

                {/* Reason for Visit & Observations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      <i className="fas fa-tools text-primary mr-1"></i> Motivo de Ingreso / Fallas Reportadas
                    </label>
                    <textarea
                      rows={4}
                      value={formData.reason_for_entry || ''}
                      onChange={(e) => setFormData({ ...formData, reason_for_entry: e.target.value })}
                      placeholder="Describa el problema, ruidos o mantenimiento solicitado por el cliente..."
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      <i className="fas fa-box-open text-amber-500 mr-1"></i> Pertenencias a Bordo / Objetos de Valor
                    </label>
                    <textarea
                      rows={4}
                      value={formData.observations || ''}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder="Lentes, cargador, documentos, herramientas personales, etc..."
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: INSPECCIÓN & DAÑOS ================= */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Vehicle Visual Damage Canvas */}
                <VehicleDamageCanvas
                  damagePoints={formData.damage_points || []}
                  onChange={(points) => setFormData({ ...formData, damage_points: points })}
                />

                {/* 77 Items Inspection Checklist */}
                <InspectionChecklistGrid
                  externalItems={formData.checklist_external as ChecklistItem[] || []}
                  internalItems={formData.checklist_internal as ChecklistItem[] || []}
                  onExternalChange={(items) => setFormData({ ...formData, checklist_external: items })}
                  onInternalChange={(items) => setFormData({ ...formData, checklist_internal: items })}
                />
              </div>
            )}

            {/* ================= STEP 4: RESUMEN & FIRMAS ================= */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Executive Summary Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Resumen de Recepción</span>
                      <h4 className="text-lg font-black text-white">
                        {formData.brand} {formData.model} • <span className="font-mono text-amber-400">[{formData.license_plate}]</span>
                      </h4>
                    </div>
                    <div className="text-right sm:text-right text-xs text-slate-400">
                      <p>Fecha: <strong className="text-white">{formData.entry_date}</strong></p>
                      <p>Combustible: <strong className="text-white">{formData.fuel_level}</strong> • Odómetro: <strong className="text-white">{formData.mileage || '-'} km</strong></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                    <div>
                      <span className="text-slate-400">Propietario / Cliente:</span>
                      <p className="font-bold text-white mt-0.5">{formData.owner_name}</p>
                      <p className="text-slate-400">{formData.phone || 'Sin teléfono'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Daños en Carrocería:</span>
                      <p className="font-bold text-white mt-0.5">
                        {formData.damage_points && formData.damage_points.length > 0 ? (
                          <span className="text-rose-400">{formData.damage_points.length} puntos marcados</span>
                        ) : (
                          <span className="text-emerald-400">Carrocería sin daños</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Custodia / Recepción:</span>
                      <p className="font-bold text-white mt-0.5">{formData.receiving_technician || formData.received_by || 'Técnico de Taller'}</p>
                      <p className="text-slate-400">Mecánico: {formData.assigned_technician || 'Por Asignar'}</p>
                    </div>
                  </div>
                </div>

                {/* Authorized Services Text Area */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    <i className="fas fa-check-circle text-emerald-600 mr-1"></i> Servicios y Reparaciones Autorizadas a Realizar
                  </label>
                  <textarea
                    rows={3}
                    value={formData.authorized_services || ''}
                    onChange={(e) => setFormData({ ...formData, authorized_services: e.target.value })}
                    placeholder="Detalle los trabajos aprobados por el cliente (ej: cambio de aceite, revisión de frenos, entonación mayor)..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                  />
                </div>

                {/* Digital Signature Pads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SignaturePad
                    label="Firma Digital del Cliente / Propietario"
                    signerName={formData.owner_name}
                    signerId={formData.owner_tax_id}
                    signatureData={formData.client_signature}
                    onChange={(sig) => setFormData({ ...formData, client_signature: sig })}
                  />

                  <SignaturePad
                    label="Firma Digital del Técnico Receptor (Taller)"
                    signerName={formData.receiving_technician || formData.received_by || 'Técnico de Recepción'}
                    signatureData={formData.mechanic_signature}
                    onChange={(sig) => setFormData({ ...formData, mechanic_signature: sig })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-3xl">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-100 transition font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-arrow-left"></i> Anterior
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition font-semibold text-xs sm:text-sm"
              >
                Cancelar
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 shadow-soft transition"
                >
                  Siguiente <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={loading}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Solo Guardar
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={loading}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 shadow-soft transition"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Procesando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-print"></i> Guardar e Imprimir
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet Modal */}
      {showPrintModal && savedReceiptData && (
        <PrintableReceiptSheet
          receipt={savedReceiptData}
          onClose={() => {
            setShowPrintModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};
export default RecepcionWizardModal;
