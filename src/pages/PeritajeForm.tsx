import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePeritaje, usePeritajeVideos } from "../hooks/use-peritajes";
import { createEntity, updateEntity, uploadVideo, analyzeVideo, callLambda, getEntity } from "../api/client";
import { GeminiAiService } from "../services/gemini-ai.service";
import { InspectionService } from "../services/inspection.service";
import { SelectedMediaFile, createSelectedMediaFile, formatBytes } from "../utils/base64";
import Autocomplete from "../components/ui/Autocomplete";
import { InspectionCard, InspectionAnalysis } from "../types/entities";
import { useGrqlList } from "../hooks/use-grql";
import { useVehiculos, useClientes } from "../hooks/use-clientes";
import { findClientForVehicle, getVehiclesForClient } from "../utils/entityHelpers";

export default function PeritajeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [activeTab, setActiveTab] = useState<"form" | "video" | "analysis">("form");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<InspectionCard>>({
    status: "pendiente",
    observations: "",
  });

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<InspectionAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Archivo seleccionado manualmente para subida directa al bucket y análisis con Gemini
  const [mediaFile, setMediaFile] = useState<SelectedMediaFile | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: peritaje, refetch: refetchPeritaje } = isEdit
    ? usePeritaje(id!)
    : { data: null, refetch: () => {} };

  const { data: videos } = usePeritajeVideos();
  const { data: analysisList } = useGrqlList<any[]>("GestionTallerProd_inspection_analysis");
  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles", { pagination: { page: 1, size: 500 } });
  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients", { pagination: { page: 1, size: 500 } });

  const [selectedClientObj, setSelectedClientObj] = useState<any>(null);
  const [selectedVehicleObj, setSelectedVehicleObj] = useState<any>(null);

  useEffect(() => {
    if (peritaje) {
      setFormData((prev: any) => {
        const updated = { ...prev, ...peritaje };

        // Si el peritaje ya tiene vehículo pero no cliente, resolverlo de inmediato
        const currentVehId = updated.vehicles_fk_id;
        if (currentVehId && !updated.clients_fk_id && vehiculos && vehiculos.length > 0) {
          const matchedVeh = vehiculos.find(
            (v: any) => (v.id || v.vehicle_id || v._id) === currentVehId
          );
          if (matchedVeh) {
            setSelectedVehicleObj(matchedVeh);
            const directClient = matchedVeh.clients?.[0];
            const associatedClient = findClientForVehicle(matchedVeh, clientes || undefined) || directClient;
            const resolvedClientId = associatedClient
              ? (associatedClient.id || associatedClient.client_id || associatedClient._id)
              : (matchedVeh.clients_fk_id || "");
            if (resolvedClientId) {
              updated.clients_fk_id = resolvedClientId;
              setSelectedClientObj(associatedClient || directClient || null);
            }
          }
        }
        return updated;
      });

      // Look for already uploaded video and analysis
      if (videos) {
        const match = videos.find((v: any) => v.inspection_cards_fk_id === peritaje.id);
        if (match) {
          setUploadedVideoUrl(match.video_url);
          setVideoUrl(match.video_url);
        }
      }
      if (analysisList) {
        const match = analysisList.find((a: any) => a.inspection_cards_fk_id === peritaje.id);
        if (match) {
          setAnalysisResult(match);
        }
      }
    }
  }, [peritaje, videos, analysisList, vehiculos, clientes]);

  // Si los vehículos o clientes cargan después del peritaje, auto-resolver el cliente del vehículo
  useEffect(() => {
    if (formData.vehicles_fk_id && !formData.clients_fk_id && vehiculos && vehiculos.length > 0) {
      const matchedVeh = vehiculos.find(
        (v: any) => (v.id || v.vehicle_id || v._id) === formData.vehicles_fk_id
      );
      if (matchedVeh) {
        setSelectedVehicleObj(matchedVeh);
        const directClient = matchedVeh.clients?.[0];
        const associatedClient = findClientForVehicle(matchedVeh, clientes || undefined) || directClient;
        const resolvedClientId = associatedClient
          ? (associatedClient.id || associatedClient.client_id || associatedClient._id)
          : (matchedVeh.clients_fk_id || "");
        if (resolvedClientId) {
          setSelectedClientObj(associatedClient || directClient || null);
          setFormData((prev: any) => ({ ...prev, clients_fk_id: resolvedClientId }));
        }
      }
    }
  }, [formData.vehicles_fk_id, formData.clients_fk_id, vehiculos, clientes]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleVehicleSelect = (vehicleId: string, vehicleItem?: any) => {
    const selectedVeh = vehicleItem || vehiculos?.find((v: any) =>
      (v.id || v.vehicle_id || v._id) === vehicleId
    );
    setSelectedVehicleObj(selectedVeh || null);

    setFormData((prev: any) => {
      const updated = { ...prev, vehicles_fk_id: vehicleId };

      if (selectedVeh) {
        const directClient = selectedVeh.clients?.[0];
        const associatedClient = findClientForVehicle(selectedVeh, clientes || undefined) || directClient;
        const resolvedClientId = associatedClient
          ? (associatedClient.id || associatedClient.client_id || associatedClient._id)
          : (selectedVeh.clients_fk_id || "");

        if (resolvedClientId) {
          updated.clients_fk_id = resolvedClientId;
          setSelectedClientObj(associatedClient || directClient || null);
        }
      } else {
        setSelectedClientObj(null);
      }
      return updated;
    });
  };

  const handleClientSelect = (clientId: string, clientItem?: any) => {
    const selectedClient = clientItem || clientes?.find((c: any) =>
      (c.id || c.client_id || c._id) === clientId
    );
    setSelectedClientObj(selectedClient || null);

    setFormData((prev: any) => {
      const updated = { ...prev, clients_fk_id: clientId };
      if (clientId && (clientes || selectedClient) && vehiculos) {
        const client = selectedClient || clientes?.find((c: any) => (c.id || c.client_id || c._id) === clientId);
        const clientVehicles = getVehiclesForClient(client, vehiculos, clientes || undefined);
        const currentBelongsToClient = clientVehicles.some(
          (v: any) => (v.id || v.vehicle_id || v._id) === prev.vehicles_fk_id
        );
        if (!currentBelongsToClient && clientVehicles.length > 0) {
          const firstVeh = clientVehicles[0];
          const firstVehId = firstVeh.id || firstVeh.vehicle_id || firstVeh._id;
          if (firstVehId) {
            updated.vehicles_fk_id = firstVehId;
            setSelectedVehicleObj(firstVeh);
          }
        }
      }
      return updated;
    });
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const chunks: BlobPart[] = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setRecordedBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError("No se pudo acceder a la cámara del dispositivo");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    setVideoUrl(null);
    setUploadedVideoUrl(null);
    setAnalysisResult(null);
  };

  const uploadVideoHandler = async () => {
    if (!recordedBlob || !formData.id) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(recordedBlob);
      });

      const uploadResult = await uploadVideo(base64, formData.id);
      setUploadedVideoUrl(uploadResult.video_url);
      setVideoUrl(uploadResult.video_url);
    } catch (err: any) {
      setError(err.message || "Error al subir el video a la nube");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!formData.id || !uploadedVideoUrl) return;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeVideo(formData.id, uploadedVideoUrl);
      setAnalysisResult(result);
      await refetchPeritaje();
    } catch (err: any) {
      setError(err.message || "Error en el análisis del video");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      if (mediaFile?.previewUrl) {
        URL.revokeObjectURL(mediaFile.previewUrl);
      }
      setMediaFile(createSelectedMediaFile(file));
      setAnalysisResult(null);
    } catch (err: any) {
      setMediaFile(null);
      setError(err.message || "No se pudo preparar el archivo");
    }
  };

  const discardMediaFile = () => {
    if (mediaFile?.previewUrl) {
      URL.revokeObjectURL(mediaFile.previewUrl);
    }
    setMediaFile(null);
    setAnalysisResult(null);
  };

  /**
   * Envía el archivo original (binario) a la IA generativa (Gemini).
   * Sube en multipart al bucket: la petición JSON queda liviana (sin base64 gigante)
   * y la lambda analiza el archivo desde el almacenamiento.
   */
  const processFileWithAi = async () => {
    if (!mediaFile?.file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await GeminiAiService.analyzePeritajeMediaFile(mediaFile.file, {
        mime_type: mediaFile.mimeType,
        inspection_cards_fk_id: formData.id,
        prompt_context:
          "Peritaje de daños vehicular a partir de un archivo multimedia subido por el inspector.",
        vehicle_context: {
          vehicles_fk_id: formData.vehicles_fk_id || "",
          inspection_type: formData.inspection_type || "",
          inspection_date: formData.inspection_date || "",
        },
        observations: formData.observations || undefined,
      });

      // Asegurar que quede guardado en inspection_analysis
      if (!result.analysis_id && formData.id) {
        try {
          const storePayload: any = {
            inspection_cards_fk_id: formData.id,
            damage_type: result.damage_type || "otros",
            damage_severity: result.damage_severity || "moderado",
            affected_parts: result.affected_parts || [],
            repair_estimated_hours: Number(result.repair_estimated_hours || 0),
            parts_needed: result.parts_needed || [],
            confidence_score: Number(result.confidence_score || 0),
            observations: result.observations || "",
            recommended_actions: result.recommended_actions || [],
            status: "completado",
            obj_fk: [{ inspection_cards: [formData.id] }],
          };
          const saved = await InspectionService.createAnalysis(storePayload);
          if (saved && (saved as any).id) {
            result.analysis_id = (saved as any).id;
          }
          await InspectionService.update(formData.id, { status: "completado" });
        } catch (saveErr) {
          console.warn("Persistencia de respaldo de análisis en formulario:", saveErr);
        }
      }

      setAnalysisResult(result as unknown as InspectionAnalysis);
      setActiveTab("analysis");
      await refetchPeritaje();
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo con la IA");
    } finally {
      setAnalyzing(false);
    }
  };

  const savePeritaje = async () => {
    if (!formData.vehicles_fk_id || !formData.clients_fk_id) {
      setError("Por favor, selecciona un vehículo y un cliente");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEdit) {
        await updateEntity("GestionTallerProd_inspection_cards", id!, formData);
      } else {
        const result = await createEntity("GestionTallerProd_inspection_cards", formData);
        setFormData(result as any);
        setActiveTab("video");
        return; // Stay on video tab to continue
      }
      navigate("/peritajes");
    } catch (err: any) {
      setError(err.message || "Error al guardar la ficha de inspección");
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = (() => {
    const raw = Number(analysisResult?.confidence_score ?? 0);
    const pct = raw <= 1 ? raw * 100 : raw;
    return Math.round(pct);
  })();

  const severityClass = (() => {
    const severity = String(analysisResult?.damage_severity || "").toLowerCase();
    if (["severo", "alto", "high"].includes(severity)) return "bg-red-100 text-red-800";
    if (["moderado", "medio", "medium"].includes(severity)) return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  })();

  const partLabel = (p: any) => (typeof p === "string" ? p : p?.repuesto_id || p?.description || p?.code || "—");

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-8">
      {/* Title Card */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-camera text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary">{isEdit ? "Editar Peritaje" : "Nuevo Peritaje"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Control de peritaje inicial, grabación y análisis inteligente</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/peritajes")}
          className="px-4 py-2 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm self-start sm:self-center"
        >
          <i className="fas fa-arrow-left mr-1.5"></i> Volver al Listado
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("form")}
          className={`pb-3 transition-colors ${
            activeTab === "form" ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <i className="fas fa-file-lines mr-1.5"></i> Ficha de Detalles
        </button>
        <button
          onClick={() => setActiveTab("video")}
          disabled={!formData.id}
          className={`pb-3 transition-colors ${
            activeTab === "video"
              ? "border-b-2 border-primary text-primary"
              : !formData.id
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <i className="fas fa-video mr-1.5"></i> Grabación de Video
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          disabled={!formData.id || (!uploadedVideoUrl && !analysisResult)}
          className={`pb-3 transition-colors ${
            activeTab === "analysis"
              ? "border-b-2 border-primary text-primary"
              : !formData.id || (!uploadedVideoUrl && !analysisResult)
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <i className="fas fa-brain mr-1.5"></i> Análisis de IA
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-150 p-4 rounded-xl flex items-center gap-3">
          <i className="fas fa-circle-exclamation text-red-500 text-lg"></i>
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tab content: Form */}
      {activeTab === "form" && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-bold text-secondary border-b pb-3 flex items-center gap-2">
            <i className="fas fa-clipboard text-primary"></i> Información del Peritaje
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Autocomplete
                label="ID Vehículo *"
                placeholder="Buscar por placa o marca..."
                value={formData.vehicles_fk_id || ""}
                onChange={(val) => handleVehicleSelect(val)}
                onSelectItem={(item) => handleVehicleSelect(item?.id || item?.vehicle_id || "", item)}
                data={vehiculos || undefined}
                selectedItemFallback={selectedVehicleObj}
                fetchData={() => getEntity("GestionTallerProd_vehicles", { pagination: { page: 1, size: 500 } })}
                displayField={(item) => `${item.license_plate} - ${item.brand} ${item.model || ''}`}
                searchFields={['license_plate', 'brand', 'model', 'id']}
              />
            </div>
            <div>
              <Autocomplete
                label="ID Cliente *"
                placeholder="Buscar por nombre o documento..."
                value={formData.clients_fk_id || ""}
                onChange={(val) => handleClientSelect(val)}
                onSelectItem={(item) => handleClientSelect(item?.id || item?.client_id || "", item)}
                data={clientes || undefined}
                selectedItemFallback={selectedClientObj}
                fetchData={() => getEntity("GestionTallerProd_clients", { pagination: { page: 1, size: 500 } })}
                displayField={(item) => `${item.client_name} - ${item.tax_id || ''}`}
                searchFields={['client_name', 'tax_id', 'id']}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Inspección</label>
              <input
                type="text"
                value={formData.inspection_type || ""}
                onChange={(e) => handleFieldChange("inspection_type", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                placeholder="Revisión mecánica, latonería, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Inspección</label>
              <input
                type="date"
                value={formData.inspection_date ? formData.inspection_date.split("T")[0] : ""}
                onChange={(e) => handleFieldChange("inspection_date", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
              <textarea
                value={formData.observations || ""}
                onChange={(e) => handleFieldChange("observations", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                rows={3}
                placeholder="Escribe aquí las notas generales del vehículo..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del Peritaje</label>
              <select
                value={formData.status || "pendiente"}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm bg-white"
              >
                <option value="pendiente">Pendiente</option>
                <option value="grabando">Grabando</option>
                <option value="completado">Completado</option>
                <option value="analizado">Analizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Costo Estimado ($)</label>
              <input
                type="number"
                value={formData.cost_estimate || ""}
                onChange={(e) => handleFieldChange("cost_estimate", e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex gap-3 border-t pt-4">
            <button
              onClick={savePeritaje}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-sm shadow-soft"
            >
              {loading ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear y Continuar"}
            </button>
            <button
              onClick={() => navigate("/peritajes")}
              className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-bold text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tab content: Video */}
      {activeTab === "video" && formData.id && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-3">
              <i className="fas fa-video text-2xl"></i>
            </div>
            <h4 className="text-lg font-bold text-secondary">Grabación de Multimedia</h4>
            <p className="text-sm text-gray-500 mt-1">
              Graba un video o sube un archivo: se convierte a base64 y Gemini AI inspecciona los daños
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl aspect-video overflow-hidden flex items-center justify-center relative shadow-inner">
            {recording ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-white p-6">
                <i className="fas fa-video-slash text-4xl mb-3 opacity-40"></i>
                <p className="text-gray-300 font-medium">Cámara desactivada</p>
                <p className="text-xs text-gray-500 mt-1">Presiona "Grabar video" para iniciar la cámara en vivo</p>
              </div>
            )}
            {recording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-2.5 h-2.5 bg-white rounded-full"></span> GRABANDO
              </div>
            )}
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 bg-gray-50/60">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleFileSelected}
            />
            {!mediaFile ? (
              <div className="text-center">
                <i className="fas fa-file-arrow-up text-2xl text-primary mb-1.5"></i>
                <p className="text-sm font-bold text-secondary">O sube un archivo (imagen, video o audio)</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">
                  Subida directa al bucket para procesamiento con{" "}
                  <span className="font-semibold text-purple-600">Gemini AI</span>
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border-2 border-primary text-primary bg-white rounded-xl hover:bg-primary/5 transition font-bold text-sm"
                >
                  <i className="fas fa-folder-open mr-1.5"></i>
                  Seleccionar archivo
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-20 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  {mediaFile.kind === "image" ? (
                    <img src={mediaFile.previewUrl} alt={mediaFile.name} className="w-full h-full object-cover" />
                  ) : mediaFile.kind === "video" ? (
                    <video src={mediaFile.previewUrl} controls className="w-full h-full object-contain" />
                  ) : mediaFile.kind === "audio" ? (
                    <audio src={mediaFile.previewUrl} controls className="w-24" />
                  ) : (
                    <i className="fas fa-file text-white text-2xl"></i>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <p className="text-sm font-bold text-secondary truncate">{mediaFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(mediaFile.size)} · {mediaFile.mimeType}
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold">
                    <i className="fas fa-file-shield"></i> Archivo listo para análisis
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={processFileWithAi}
                    disabled={analyzing}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold text-sm shadow-soft flex items-center gap-2"
                  >
                    <i className={`fas fa-brain ${analyzing ? "animate-pulse" : ""}`}></i>
                    {analyzing ? "Procesando..." : "Procesar con IA"}
                  </button>
                  <button
                    onClick={discardMediaFile}
                    disabled={analyzing}
                    title="Descartar archivo"
                    className="px-3 py-2.5 border-2 border-gray-200 text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition font-bold text-sm"
                  >
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {!uploadedVideoUrl ? (
              <>
                {!videoUrl ? (
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`px-5 py-3 text-white rounded-xl transition font-bold text-sm shadow-soft flex items-center gap-2 ${
                      recording ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary-dark"
                    }`}
                  >
                    <i className={recording ? "fas fa-stop-circle" : "fas fa-circle-play"}></i>
                    {recording ? "Detener Grabación" : "Iniciar Cámara"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={uploadVideoHandler}
                      disabled={loading}
                      className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-sm shadow-soft flex items-center gap-2"
                    >
                      <i className="fas fa-cloud-arrow-up"></i>
                      {loading ? "Subiendo..." : "Subir Video"}
                    </button>
                    <button
                      onClick={deleteRecording}
                      className="px-5 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-bold text-sm shadow-soft flex items-center gap-2"
                    >
                      <i className="fas fa-trash-can"></i>
                      Descartar Video
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-sm border border-green-200">
                  <i className="fas fa-circle-check"></i> Video guardado y listo para análisis
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold text-sm shadow-soft flex items-center gap-2"
                  >
                    <i className="fas fa-brain animate-pulse"></i>
                    {analyzing ? "Ejecutando Inteligencia Artificial..." : "Iniciar Análisis con IA"}
                  </button>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className="px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-bold text-sm"
                  >
                    Ver Resultados
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab content: Analysis (sin resultados aún) */}
      {activeTab === "analysis" && !analysisResult && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 text-center">
          <i className="fas fa-brain text-3xl text-purple-300 mb-3"></i>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Todavía no hay análisis. Graba un video o sube un archivo (imagen, video o audio) en la pestaña
            anterior y ejecuta el análisis con IA generativa.
          </p>
        </div>
      )}

      {/* Tab content: Analysis */}
      {activeTab === "analysis" && analysisResult && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-6">
          <div className="border-b pb-4 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
              <i className="fas fa-brain text-purple-600"></i> Resultados del Análisis Gemini AI
            </h3>
            <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-bold text-xs border border-purple-200 flex items-center gap-1.5">
              <i className="fas fa-circle-check"></i> Confianza: {confidencePct}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold uppercase">Tipo de Daño</span>
              <p className="text-base font-bold text-secondary capitalize mt-1">
                {(analysisResult.damage_type ?? "").replace(/_/g, " ")}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold uppercase">Gravedad / Severidad</span>
              <p className="text-base font-bold text-secondary mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${severityClass}`}>
                  {analysisResult.damage_severity}
                </span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold uppercase">Horas Estimadas</span>
              <p className="text-base font-bold text-secondary mt-1">
                {analysisResult.repair_estimated_hours} horas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-secondary flex items-center gap-2 text-sm uppercase text-gray-500">
                <i className="fas fa-list-check text-primary"></i> Partes Afectadas
              </h4>
              <ul className="space-y-2">
                {analysisResult.affected_parts?.map((p: any, i: any) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700 bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100">
                    <i className="fas fa-circle-exclamation text-amber-500"></i>
                    {partLabel(p)}
                  </li>
                )) || <p className="text-gray-500 text-sm">Ninguna parte afectada detectada</p>}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-secondary flex items-center gap-2 text-sm uppercase text-gray-500">
                <i className="fas fa-gears text-primary"></i> Repuestos Recomendados
              </h4>
              <ul className="space-y-2">
                {analysisResult.parts_needed?.map((p: any, i: any) => (
                  <li key={i} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100">
                    <span className="flex items-center gap-2.5 font-semibold">
                      <i className="fas fa-screwdriver-wrench text-gray-400"></i>
                      {partLabel(p)}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                      x{typeof p === "string" ? 1 : p?.quantity ?? 1}
                    </span>
                  </li>
                )) || <p className="text-gray-500 text-sm">No se requieren repuestos adicionales</p>}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-secondary flex items-center gap-2 text-sm uppercase text-gray-500">
              <i className="fas fa-comment-dots text-primary"></i> Observaciones de IA
            </h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed">
              {analysisResult.observations}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-secondary flex items-center gap-2 text-sm uppercase text-gray-500">
              <i className="fas fa-clipboard-check text-primary"></i> Acciones Recomendadas
            </h4>
            <ol className="space-y-2">
              {analysisResult.recommended_actions?.map((a: any, i: any) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 leading-normal">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5 shrink-0">
                    {i + 1}
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
