import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePeritaje, usePeritajeVideos } from "../hooks/use-peritajes";
import { createEntity, uploadVideo, analyzeVideo, callLambda, getEntity } from "../api/client";
import Autocomplete from "../components/ui/Autocomplete";
import { InspectionCard, InspectionAnalysis } from "../types/entities";
import { useGrqlList } from "../hooks/use-grql";

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: peritaje, refetch: refetchPeritaje } = isEdit
    ? usePeritaje(id!)
    : { data: null, refetch: () => {} };

  const { data: videos } = usePeritajeVideos();
  const { data: analysisList } = useGrqlList<any[]>("peritaje_analysis");

  useEffect(() => {
    if (peritaje) {
      setFormData(peritaje);
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
  }, [peritaje, videos, analysisList]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
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

  const savePeritaje = async () => {
    if (!formData.vehicles_fk_id || !formData.clients_fk_id) {
      setError("Por favor, selecciona un vehículo y un cliente");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEdit) {
        await callLambda({
          table: "GestionTallerProd_inspection_cards",
          method: "UPDATE",
          id: id,
          data: formData,
        });
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
          disabled={!formData.id || !uploadedVideoUrl}
          className={`pb-3 transition-colors ${
            activeTab === "analysis"
              ? "border-b-2 border-primary text-primary"
              : !formData.id || !uploadedVideoUrl
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
                onChange={(val) => handleFieldChange("vehicles_fk_id", val)}
                fetchData={() => getEntity("GestionTallerProd_vehicles")}
                displayField={(item) => `${item.license_plate} - ${item.brand} ${item.model || ''}`}
                searchFields={['license_plate', 'brand', 'model', 'id']}
              />
            </div>
            <div>
              <Autocomplete
                label="ID Cliente *"
                placeholder="Buscar por nombre o documento..."
                value={formData.clients_fk_id || ""}
                onChange={(val) => handleFieldChange("clients_fk_id", val)}
                fetchData={() => getEntity("GestionTallerProd_clients")}
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
            <p className="text-sm text-gray-500 mt-1">Sube o graba un video para inspeccionar daños con Gemini AI</p>
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

      {/* Tab content: Analysis */}
      {activeTab === "analysis" && analysisResult && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-6">
          <div className="border-b pb-4 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
              <i className="fas fa-brain text-purple-600"></i> Resultados del Análisis Gemini 2.5 Pro
            </h3>
            <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-bold text-xs border border-purple-200 flex items-center gap-1.5">
              <i className="fas fa-circle-check"></i> Confianza: {Math.round(analysisResult.confidence_score * 100)}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold uppercase">Tipo de Daño</span>
              <p className="text-base font-bold text-secondary capitalize mt-1">
                {analysisResult.damage_type.replace(/_/g, " ")}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold uppercase">Gravedad / Severidad</span>
              <p className="text-base font-bold text-secondary mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  analysisResult.damage_severity === "alto" || analysisResult.damage_severity === "high" ? "bg-red-100 text-red-800" :
                  analysisResult.damage_severity === "medio" || analysisResult.damage_severity === "medium" ? "bg-amber-100 text-amber-800" :
                  "bg-green-100 text-green-800"
                }`}>
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
                    {p}
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
                      {p.repuesto_id}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                      x{p.quantity}
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
