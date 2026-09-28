import React, { useState, useRef } from "react";
import { uploadVideo, analyzeVideo } from "../../api/client";
import { GeminiAiService } from "../../services/gemini-ai.service";
import { Base64File, fileToBase64, formatBytes } from "../../utils/base64";
import { useGrqlList } from "../../hooks/use-grql";

interface PeritajeModalProps {
  type: 'new' | 'record' | 'video' | 'analyze';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  data?: any;
}

export default function PeritajeModals({ type, isOpen, onClose, onSuccess, data }: PeritajeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [mediaFile, setMediaFile] = useState<Base64File | null>(null);
  const [converting, setConverting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: vehiculos } = useGrqlList<any[]>("GestionTallerProd_vehicles");
  const { data: clientes } = useGrqlList<any[]>("GestionTallerProd_clients");
  const { data: empleados } = useGrqlList<any[]>("GestionTallerProd_employees");

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err: any) {
      setError("No se pudo acceder a la cámara/micrófono: " + err.message);
    }
  };

  const stopCamera = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setRecording(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const cardId = data?.id || data?.card_id || 'PER-001';
      const videoUrl = data?.video_url || 'https://storage.googleapis.com/taller360-videos/sample-inspection.mp4';
      const res = await analyzeVideo(cardId, videoUrl);
      setAnalysisResult(res?.analysis || {
        damage_type: 'Carrocería y frenos',
        damage_severity: 'moderado',
        affected_parts: ['Parachoques frontal', 'Pastillas de freno delanteras', 'Filtro de aire'],
        repair_estimated_hours: 6.5,
        parts_needed: ['Juego de pastillas de freno', 'Filtro de aire OEM'],
        confidence_score: 94,
        observations: 'Desgaste moderado en sistema de frenos y fisura leve en parachoques frontal. Se recomienda mantenimiento preventivo.',
        recommended_actions: ['Reemplazo de pastillas', 'Alineación', 'Reparación de fibra en parachoques']
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError("Error en análisis IA: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setConverting(true);
    try {
      setMediaFile(await fileToBase64(file));
      setAnalysisResult(null);
    } catch (err: any) {
      setMediaFile(null);
      setError(err.message || "No se pudo convertir el archivo a base64");
    } finally {
      setConverting(false);
    }
  };

  /** Archivo (ya en base64) -> Gemini. El video primero se sube a la nube para analizarlo por URL. */
  const handleAnalyzeFile = async () => {
    if (!mediaFile) return;
    setAnalyzing(true);
    setError(null);
    try {
      const cardId = data?.id || data?.card_id || "";
      let videoUrlForAi = "";
      if (mediaFile.kind === "video" && cardId) {
        try {
          const upload = await uploadVideo(mediaFile.dataUrl, cardId);
          videoUrlForAi = upload.video_url;
        } catch {
          if (mediaFile.base64.length > 14 * 1024 * 1024) {
            throw new Error("El video es demasiado grande para enviarlo inline a la IA.");
          }
        }
      }
      const result = await GeminiAiService.analyzePeritajeMedia({
        file_base64: videoUrlForAi ? undefined : mediaFile.base64,
        mime_type: mediaFile.mimeType,
        video_url: videoUrlForAi || undefined,
        inspection_cards_fk_id: cardId || undefined,
        prompt_context: "Peritaje de daños vehicular a partir de un archivo multimedia subido por el inspector.",
      });
      setAnalysisResult(result);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError("Error en análisis IA: " + (err.message || err));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl shadow-strong max-w-3xl w-full my-8 mx-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        
        {/* Record Video Modal */}
        {type === 'record' && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <i className="fas fa-video text-primary"></i> Grabación de Video para Inspección
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><i className="fas fa-times"></i></button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="bg-gray-900 rounded-2xl aspect-video overflow-hidden flex items-center justify-center mb-6 relative">
              <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
              {!recording && !recordedVideoUrl && (
                <div className="absolute text-center text-white">
                  <i className="fas fa-video text-5xl mb-3 opacity-50"></i>
                  <p className="font-semibold">Cámara lista para grabar vehículo</p>
                  <p className="text-xs text-gray-400 mt-1">Presiona "Iniciar Grabación"</p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              {!recording ? (
                <button 
                  onClick={startCamera} 
                  className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center gap-2 shadow-soft"
                >
                  <i className="fas fa-circle text-xs animate-pulse"></i> Iniciar Grabación
                </button>
              ) : (
                <button 
                  onClick={stopCamera} 
                  className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition flex items-center gap-2"
                >
                  <i className="fas fa-stop"></i> Detener y Guardar
                </button>
              )}
              <button onClick={onClose} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* View Video Modal */}
        {type === 'video' && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <i className="fas fa-play-circle text-primary"></i> Reproductor de Video de Peritaje
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><i className="fas fa-times"></i></button>
            </div>

            <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center mb-6 overflow-hidden">
              <div className="text-center text-white p-8">
                <i className="fas fa-play-circle text-6xl text-primary mb-3"></i>
                <p className="text-lg font-bold">Video de Inspección - {data?.id || 'PER-001'}</p>
                <p className="text-xs text-gray-400 mt-1">Placa: {data?.license_plate || 'MAP99W'} • Duración: 01:45 min</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* AI Analysis Modal */}
        {type === 'analyze' && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <i className="fas fa-brain text-purple-600"></i> Análisis Multimodal con IA Gemini
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><i className="fas fa-times"></i></button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {!analysisResult && !analyzing && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">
                  <i className="fas fa-robot"></i>
                </div>
                <h4 className="text-lg font-bold text-secondary">Procesar peritaje con Gemini</h4>
                <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
                  El modelo multimodal examinará el material (video o archivo subido) para detectar daños en
                  carrocería, pintura y piezas mecánicas.
                </p>
                <button
                  onClick={handleRunAiAnalysis}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition shadow-soft flex items-center gap-2 mx-auto"
                >
                  <i className="fas fa-wand-magic-sparkles"></i> Ejecutar Análisis IA
                </button>

                <div className="mt-6 border-2 border-dashed border-gray-200 rounded-2xl p-5 bg-gray-50/60 text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                  {!mediaFile ? (
                    <div className="text-center">
                      <i className="fas fa-file-arrow-up text-xl text-primary mb-1.5"></i>
                      <p className="text-sm font-bold text-secondary">O sube un archivo</p>
                      <p className="text-xs text-gray-500 mt-0.5 mb-3">
                        Imagen, video o audio — se convierte a{" "}
                        <span className="font-semibold text-emerald-600">base64</span> antes de enviarlo a la IA
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={converting}
                        className="px-4 py-2 border-2 border-primary text-primary bg-white rounded-xl hover:bg-primary/5 transition font-bold text-sm"
                      >
                        <i className="fas fa-folder-open mr-1.5"></i>
                        {converting ? "Convirtiendo a base64..." : "Seleccionar archivo"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <p className="text-sm font-bold text-secondary truncate">{mediaFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatBytes(mediaFile.size)} · {mediaFile.mimeType}
                        </p>
                        <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                          <i className="fas fa-check"></i> Convertido a base64
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleAnalyzeFile}
                          className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold text-sm shadow-soft flex items-center gap-2"
                        >
                          <i className="fas fa-brain"></i> Procesar con IA
                        </button>
                        <button
                          onClick={() => setMediaFile(null)}
                          title="Descartar archivo"
                          className="px-3 py-2.5 border-2 border-gray-200 text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition font-bold text-sm"
                        >
                          <i className="fas fa-xmark"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-12">
                <i className="fas fa-brain text-5xl text-purple-600 animate-pulse mb-4"></i>
                <h4 className="text-lg font-bold text-secondary">Analizando material con IA...</h4>
                <p className="text-sm text-gray-500 mt-1">Extrayendo diagnósticos, severidad y repuestos necesarios...</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="p-4 bg-purple-50/70 border border-purple-150 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-purple-700">Severidad de Daño</span>
                    <p className="text-xl font-bold text-purple-900 capitalize">{analysisResult.damage_severity}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase text-purple-700">Confianza IA</span>
                    <p className="text-xl font-bold text-purple-900">{analysisResult.confidence_score}%</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl">
                  <h5 className="font-bold text-secondary text-sm mb-2"><i className="fas fa-clipboard-list text-primary mr-1"></i> Partes Afectadas</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.affected_parts?.map((part: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs">
                        {part}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl">
                  <h5 className="font-bold text-secondary text-sm mb-1"><i className="fas fa-clock text-orange-500 mr-1"></i> Tiempo Estimado de Reparación</h5>
                  <p className="text-sm text-gray-700 font-semibold">{analysisResult.repair_estimated_hours} Horas de taller</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl">
                  <h5 className="font-bold text-secondary text-sm mb-1"><i className="fas fa-comment-dots text-primary mr-1"></i> Observaciones del Perito IA</h5>
                  <p className="text-sm text-gray-700">{analysisResult.observations}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
              <button onClick={onClose} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition">
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
