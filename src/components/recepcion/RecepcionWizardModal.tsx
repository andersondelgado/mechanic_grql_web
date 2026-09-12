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

  // Search and auto-registration state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewVehicle, setIsNewVehicle] = useState(false);

  // Entities lists
  const { data: vehiculos, refetch: refreshVehiculos } = useGrqlList<any[]>('GestionTallerProd_vehicles');
  const { data: empleados } = useGrqlList<any[]>('GestionTallerProd_employees');
  const { data: clientes, refetch: refreshClientes } = useGrqlList<any[]>('GestionTallerProd_clients');

  // Form State
  const [formData, setFormData] = useState<VehicleReceipt>({
    entry_date: new Date().toISOString().split('T')[0],
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    mileage: '',
    owner_name: '',
    owner_tax_id: '',
    phone: '',
    email: '',
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

        let cId = recepcion.clients_fk_id;
        if (Array.isArray(cId) && cId.length > 0) {
          cId = typeof cId[0] === 'object' ? (cId[0].id || cId[0].client_id) : cId[0];
        } else if (!cId) {
          cId = client?.id || client?.client_id || '';
        }

        setFormData({
          ...recepcion,
          vehicles_fk_id: vId || '',
          clients_fk_id: cId || '',
          entry_date: entryDate,
          license_plate: recepcion.license_plate || vehicle?.license_plate || '',
          brand: recepcion.brand || vehicle?.brand || '',
          model: recepcion.model || vehicle?.model || '',
          year: recepcion.year || vehicle?.year || '',
          color: recepcion.color || vehicle?.color || '',
          mileage: recepcion.mileage || vehicle?.mileage || '',
          owner_name: recepcion.owner_name || client?.client_name || '',
          owner_tax_id: recepcion.owner_tax_id || client?.tax_id || '',
          phone: recepcion.phone || recepcion.owner_phone || client?.cell_phone || '',
          email: recepcion.email || client?.email || '',
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
        setIsNewClient(false);
        setIsNewVehicle(false);
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
          year: new Date().getFullYear(),
          color: '',
          mileage: '',
          owner_name: '',
          owner_tax_id: '',
          phone: '',
          email: '',
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
        setIsNewClient(false);
        setIsNewVehicle(false);
      }
      setCurrentStep(1);
      setError(null);
      setShowPrintModal(false);
      setSearchQuery('');
      setIsSearchDropdownOpen(false);
    }
  }, [isOpen, recepcion]);

  if (!isOpen) return null;

  // Handle Client Selection
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clientes?.find((c: any) => (c.id === clientId || c.client_id === clientId));
    if (!selectedClient) {
      setFormData(prev => ({ ...prev, clients_fk_id: clientId }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      clients_fk_id: clientId,
      owner_name: selectedClient.client_name || prev.owner_name,
      owner_tax_id: selectedClient.tax_id || prev.owner_tax_id,
      phone: selectedClient.cell_phone || selectedClient.home_phone || prev.phone,
      email: selectedClient.email || prev.email,
      address: selectedClient.address || prev.address,
      delivered_by: selectedClient.client_name || prev.delivered_by
    }));
    setIsNewClient(false);
    setIsSearchDropdownOpen(false);
  };

  // Handle Vehicle Selection and Auto-filling
  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVeh = vehiculos?.find((v: any) => (v.id === vehicleId || v.vehicle_id === vehicleId));
    if (!selectedVeh) {
      setFormData(prev => ({ ...prev, vehicles_fk_id: vehicleId }));
      return;
    }

    const client = selectedVeh.clients?.[0];
    const clientFound = clientes?.find((c: any) => (c.id === selectedVeh.clients_fk_id || c.client_id === selectedVeh.clients_fk_id));
    const activeClient = client || clientFound;

    setFormData(prev => ({
      ...prev,
      vehicles_fk_id: vehicleId,
      license_plate: selectedVeh.license_plate || prev.license_plate,
      brand: selectedVeh.brand || prev.brand,
      model: selectedVeh.model || prev.model,
      year: selectedVeh.year || prev.year,
      color: selectedVeh.color || prev.color,
      mileage: selectedVeh.mileage || prev.mileage,
      clients_fk_id: activeClient?.id || selectedVeh.clients_fk_id || prev.clients_fk_id,
      owner_name: activeClient?.client_name || selectedVeh.client_name || prev.owner_name,
      owner_tax_id: activeClient?.tax_id || prev.owner_tax_id,
      phone: activeClient?.cell_phone || activeClient?.phone || selectedVeh.phone || prev.phone,
      email: activeClient?.email || prev.email,
      address: activeClient?.address || prev.address,
      delivered_by: activeClient?.client_name || prev.delivered_by || prev.owner_name
    }));
    setIsNewVehicle(false);
    if (activeClient) {
      setIsNewClient(false);
    }
    setIsSearchDropdownOpen(false);
  };

  // Reset Vehicle Association
  const handleUnlinkVehicle = () => {
    setFormData(prev => ({ ...prev, vehicles_fk_id: undefined }));
    setIsNewVehicle(true);
  };

  // Reset Client Association
  const handleUnlinkClient = () => {
    setFormData(prev => ({ ...prev, clients_fk_id: undefined }));
    setIsNewClient(true);
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.license_plate?.trim()) {
        setError('Debe indicar la placa del vehículo.');
        return false;
      }
      if (!formData.owner_name?.trim()) {
        setError('Debe indicar el nombre completo o razón social del cliente.');
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

  // Save to Backend with Automatic Registration & Referential Integrity
  const handleSave = async (andPrint = false) => {
    if (!validateCurrentStep()) return;
    setLoading(true);
    setError(null);

    try {
      let resolvedClientId: string | undefined = undefined;

      // Extract existing clientId if already present
      if (formData.clients_fk_id) {
        resolvedClientId = Array.isArray(formData.clients_fk_id)
          ? formData.clients_fk_id[0]
          : formData.clients_fk_id;
      }

      // Check if client exists in DB by tax_id or name if not already linked
      if (!resolvedClientId) {
        const cleanTaxId = formData.owner_tax_id?.trim().toLowerCase();
        const cleanName = formData.owner_name?.trim().toLowerCase();

        const existingClient = clientes?.find((c: any) => {
          if (cleanTaxId && c.tax_id && c.tax_id.trim().toLowerCase() === cleanTaxId) return true;
          if (cleanName && c.client_name && c.client_name.trim().toLowerCase() === cleanName) return true;
          return false;
        });

        if (existingClient) {
          resolvedClientId = existingClient.id || existingClient.client_id;
        } else {
          // Auto-create new Client in DB
          const newClientPayload = {
            client_name: formData.owner_name?.trim() || '',
            tax_id: formData.owner_tax_id?.trim() || '',
            cell_phone: formData.phone?.trim() || '',
            email: formData.email?.trim() || '',
            address: formData.address?.trim() || '',
            registration_date: new Date().toISOString().split('T')[0]
          };
          const createdClient: any = await createEntity('GestionTallerProd_clients', newClientPayload);
          resolvedClientId = createdClient?.id || createdClient?.client_id || (createdClient?.data && (createdClient.data.id || createdClient.data.client_id));
          if (refreshClientes) refreshClientes();
        }
      }

      // Check Vehicle registration
      let resolvedVehicleId: string | undefined = undefined;
      if (formData.vehicles_fk_id) {
        resolvedVehicleId = Array.isArray(formData.vehicles_fk_id)
          ? formData.vehicles_fk_id[0]
          : formData.vehicles_fk_id;
      }

      if (!resolvedVehicleId) {
        const cleanPlate = formData.license_plate?.trim().toUpperCase();
        const existingVehicle = vehiculos?.find((v: any) =>
          v.license_plate && v.license_plate.trim().toUpperCase() === cleanPlate
        );

        if (existingVehicle) {
          resolvedVehicleId = existingVehicle.id || existingVehicle.vehicle_id;
        } else {
          // Auto-create new Vehicle in DB and link to resolvedClientId
          const newVehiclePayload = {
            license_plate: cleanPlate,
            brand: formData.brand?.trim() || '',
            model: formData.model?.trim() || '',
            color: formData.color?.trim() || '',
            mileage: formData.mileage ? String(formData.mileage).trim() : '',
            year: formData.year ? Number(formData.year) || new Date().getFullYear() : new Date().getFullYear(),
            clients_fk_id: resolvedClientId ? [resolvedClientId] : []
          };
          const createdVehicle: any = await createEntity('GestionTallerProd_vehicles', newVehiclePayload);
          resolvedVehicleId = createdVehicle?.id || createdVehicle?.vehicle_id || (createdVehicle?.data && (createdVehicle.data.id || createdVehicle.data.vehicle_id));
          if (refreshVehiculos) refreshVehiculos();
        }
      }

      // Construct Receipt payload with guaranteed relational links
      const payload: any = {
        ...formData,
        clients_fk_id: resolvedClientId ? [resolvedClientId] : (formData.clients_fk_id ? [formData.clients_fk_id] : []),
        vehicles_fk_id: resolvedVehicleId ? [resolvedVehicleId] : (formData.vehicles_fk_id ? [formData.vehicles_fk_id] : []),
        checklist_external: JSON.stringify(formData.checklist_external || []),
        checklist_internal: JSON.stringify(formData.checklist_internal || []),
        damage_points: JSON.stringify(formData.damage_points || [])
      };

      let result;
      if (recepcion?.id) {
        result = await updateEntity('GestionTallerProd_vehicle_receipts', recepcion.id, payload);
      } else {
        result = await createEntity('GestionTallerProd_vehicle_receipts', payload);
      }

      const finalSavedData: VehicleReceipt = {
        ...formData,
        clients_fk_id: resolvedClientId,
        vehicles_fk_id: resolvedVehicleId,
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
        className="no-print fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
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
                {/* Unified Search & Quick Autocomplete Bar */}
                <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                      <i className="fas fa-search text-blue-600"></i> Búsqueda Rápida / Autocompletado (Placa, Cédula/RIF o Nombre)
                    </label>
                    <span className="text-[11px] text-slate-500 italic">
                      Escriba para autocompletar datos de la flota o clientes
                    </span>
                  </div>

                  <div className="relative">
                    <div className="relative flex items-center">
                      <input
                        id="input-wizard-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsSearchDropdownOpen(true);
                        }}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        placeholder="Ej: ABC123, V-18456123, o Toyota..."
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition"
                      />
                      <i className="fas fa-search absolute left-3.5 text-slate-400 text-sm"></i>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setIsSearchDropdownOpen(false);
                          }}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                        {/* Matching Vehicles */}
                        {(() => {
                          const term = searchQuery.toLowerCase().trim();
                          const matchedVehs = vehiculos?.filter((v: any) =>
                            (v.license_plate && v.license_plate.toLowerCase().includes(term)) ||
                            (v.brand && v.brand.toLowerCase().includes(term)) ||
                            (v.model && v.model.toLowerCase().includes(term))
                          ) || [];

                          const matchedClients = clientes?.filter((c: any) =>
                            (c.tax_id && c.tax_id.toLowerCase().includes(term)) ||
                            (c.client_name && c.client_name.toLowerCase().includes(term)) ||
                            (c.cell_phone && c.cell_phone.includes(term))
                          ) || [];

                          const hasResults = matchedVehs.length > 0 || matchedClients.length > 0;

                          return (
                            <>
                              {matchedVehs.length > 0 && (
                                <div className="p-2">
                                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                                    <i className="fas fa-car"></i> Vehículos Registrados
                                  </div>
                                  {matchedVehs.slice(0, 5).map((v: any) => (
                                    <button
                                      key={v.id || v.vehicle_id}
                                      type="button"
                                      onClick={() => handleVehicleSelect(v.id || v.vehicle_id)}
                                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 transition flex items-center justify-between group"
                                    >
                                      <div>
                                        <div className="font-bold text-sm text-slate-800 font-mono flex items-center gap-2">
                                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">
                                            {v.license_plate || 'S/P'}
                                          </span>
                                          <span>{v.brand} {v.model}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                          {v.client_name ? `Propietario: ${v.client_name}` : 'Sin propietario asignado'}
                                        </div>
                                      </div>
                                      <span className="text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition">
                                        Seleccionar <i className="fas fa-arrow-right text-[10px]"></i>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {matchedClients.length > 0 && (
                                <div className="p-2">
                                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                                    <i className="fas fa-user"></i> Clientes Registrados
                                  </div>
                                  {matchedClients.slice(0, 5).map((c: any) => (
                                    <button
                                      key={c.id || c.client_id}
                                      type="button"
                                      onClick={() => handleClientSelect(c.id || c.client_id)}
                                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 transition flex items-center justify-between group"
                                    >
                                      <div>
                                        <div className="font-bold text-sm text-slate-800">
                                          {c.client_name}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                          {c.tax_id ? `C.I./RIF: ${c.tax_id}` : ''} {c.cell_phone ? `• Tel: ${c.cell_phone}` : ''}
                                        </div>
                                      </div>
                                      <span className="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition">
                                        Cargar Cliente <i className="fas fa-arrow-right text-[10px]"></i>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Quick Action to Register as New Vehicle */}
                              <div className="p-2 bg-slate-50/80 rounded-b-2xl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      license_plate: searchQuery.toUpperCase().trim(),
                                      vehicles_fk_id: undefined
                                    }));
                                    setIsNewVehicle(true);
                                    setIsSearchDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-bold flex items-center justify-between shadow-sm"
                                >
                                  <span className="flex items-center gap-2">
                                    <i className="fas fa-plus-circle"></i>
                                    Registrar como nuevo vehículo con la placa "{searchQuery.toUpperCase().trim()}"
                                  </span>
                                  <i className="fas fa-chevron-right text-[10px]"></i>
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Information Box */}
                <div className="bg-blue-50/40 border border-blue-200/60 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i className="fas fa-car text-blue-600"></i> Identificación del Vehículo
                    </h4>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {formData.vehicles_fk_id ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                            <i className="fas fa-check-circle text-emerald-600"></i> Vehículo Registrado en Flota
                          </span>
                          <button
                            type="button"
                            onClick={handleUnlinkVehicle}
                            className="text-xs text-slate-500 hover:text-red-600 underline font-medium transition"
                            title="Desvincular para registrar como nuevo vehículo"
                          >
                            Desvincular
                          </button>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-sm">
                          <i className="fas fa-sparkles text-amber-600"></i> Nuevo Vehículo (Se dará de alta en BD)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Placa / Matrícula *</label>
                      <input
                        id="input-wizard-plate"
                        type="text"
                        required
                        value={formData.license_plate}
                        onChange={(e) => {
                          setFormData({ ...formData, license_plate: e.target.value.toUpperCase() });
                          if (formData.vehicles_fk_id) setIsNewVehicle(true);
                        }}
                        placeholder="Ej: ABC123"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Marca</label>
                      <input
                        id="input-wizard-brand"
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
                        id="input-wizard-model"
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="Ej: Corolla"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Año</label>
                      <input
                        id="input-wizard-year"
                        type="number"
                        min="1970"
                        max={new Date().getFullYear() + 1}
                        value={formData.year || ''}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        placeholder="Ej: 2022"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Color</label>
                      <input
                        id="input-wizard-color"
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
                        id="input-wizard-mileage"
                        type="text"
                        value={formData.mileage || ''}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        placeholder="Ej: 145000"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Estado en Taller</label>
                      <select
                        id="select-wizard-status"
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
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i className="fas fa-user text-blue-600"></i> Datos del Propietario / Cliente
                    </h4>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {formData.clients_fk_id ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                            <i className="fas fa-check-circle text-emerald-600"></i> Cliente Registrado en Sistema
                          </span>
                          <button
                            type="button"
                            onClick={handleUnlinkClient}
                            className="text-xs text-slate-500 hover:text-red-600 underline font-medium transition"
                            title="Desvincular para registrar como nuevo cliente"
                          >
                            Desvincular
                          </button>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1.5 shadow-sm">
                          <i className="fas fa-user-plus text-indigo-600"></i> Nuevo Cliente (Se creará en BD)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo / Razón Social *</label>
                      <input
                        id="input-wizard-owner-name"
                        type="text"
                        required
                        value={formData.owner_name}
                        onChange={(e) => {
                          setFormData({ ...formData, owner_name: e.target.value });
                          if (formData.clients_fk_id) setIsNewClient(true);
                        }}
                        placeholder="Nombre y Apellido o Empresa"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">C.I. / RIF / Pasaporte</label>
                      <input
                        id="input-wizard-tax-id"
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
                        id="input-wizard-phone"
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0414-XXXXXXX"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico (Opcional)</label>
                      <input
                        id="input-wizard-email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="cliente@ejemplo.com"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Dirección de Habitación / Entrega</label>
                      <input
                        id="input-wizard-address"
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
                  id="btn-wizard-prev"
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
                id="btn-wizard-cancel"
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition font-semibold text-xs sm:text-sm"
              >
                Cancelar
              </button>

              {currentStep < 4 ? (
                <button
                  id="btn-wizard-next"
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 shadow-soft transition"
                >
                  Siguiente <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="btn-wizard-save"
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
                    id="btn-wizard-save-print"
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
