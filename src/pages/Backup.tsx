import React, { useState } from "react";

export default function Backup() {
  const [selectedDb, setSelectedDb] = useState("GestionTallerProd");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartBackup = () => {
    setLoading(true);
    setBackupStatus(null);
    setTimeout(() => {
      setLoading(false);
      setBackupStatus(`Copia de seguridad de '${selectedDb}' generada con éxito. Archivo comprimido listo.`);
    }, 1500);
  };

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBackupStatus(`Base de datos restaurada correctamente desde el archivo seleccionado.`);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 lg:p-8">
      {/* Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-download text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Backup y Restauración</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de copias de seguridad de las bases de datos gRQL</p>
          </div>
        </div>
      </div>

      {backupStatus && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <i className="fas fa-check-circle text-lg text-green-600"></i>
          <span>{backupStatus}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-secondary flex items-center gap-2 mb-2">
              <i className="fas fa-database text-primary"></i> Backup de Base de Datos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Crear una copia de seguridad completa e instantánea de la base de datos seleccionada.
            </p>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Seleccionar Esquema</label>
            <select
              value={selectedDb}
              onChange={(e) => setSelectedDb(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm mb-6"
            >
              <option value="GestionTallerProd">GestionTallerProd (Taller General)</option>
              <option value="GestionTallerProd-latoneria">GestionTallerProd-latoneria (Latonería)</option>
              <option value="GestionTallerProd-finanzas">GestionTallerProd-finanzas (Finanzas)</option>
              <option value="GestionTallerProd-rrhh">GestionTallerProd-rrhh (Personal y RRHH)</option>
            </select>
          </div>
          <button
            onClick={handleStartBackup}
            disabled={loading}
            className="w-full px-5 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2 shadow-soft text-sm"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            <span>Iniciar Backup ZIP</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col justify-between">
          <form onSubmit={handleRestore} className="h-full flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-secondary flex items-center gap-2 mb-2">
                <i className="fas fa-undo-alt text-primary"></i> Restaurar Copia de Seguridad
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Cargar un archivo ZIP de respaldo para restaurar registros históricos.
              </p>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Archivo de Respaldo</label>
              <input
                type="file"
                accept=".zip,.json"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 border-2 border-gray-200 rounded-xl p-2 mb-6 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 bg-secondary text-white font-bold rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-soft text-sm"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
              <span>Restaurar Base de Datos</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
