import React, { useState } from "react";
import { useGrqlList } from "../hooks/use-grql";
import { Link } from "react-router-dom";

export default function Usuarios() {
  const { data, loading, error, remove } = useGrqlList<any[]>("usuarios");
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
          <p className="text-gray-500 font-medium">Cargando registros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-150 p-6 rounded-2xl max-w-2xl mx-auto my-8 shadow-soft">
        <div className="flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500 text-2xl"></i>
          <div>
            <p className="text-red-800 font-bold">Error de sincronización</p>
            <p className="text-red-600 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const list = Array.isArray(data) ? data : [];
  const filteredData = list.filter((item: any) => {
    return Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Action and Title Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-user-shield text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Control de Acceso</h1>
            <p className="text-sm text-gray-500 mt-0.5">Usuarios del sistema y roles • <span className="font-semibold text-primary">{filteredData.length} en total</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </span>
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition outline-none text-sm"
            />
          </div>
          <Link
            to="/usuarios/nuevo"
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-soft font-bold text-sm"
          >
            <i className="fas fa-plus"></i> Nuevo Registro
          </Link>
        </div>
      </div>

      {/* Grid / Table Container */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6 text-left">ID</th>
                <th className="py-4 px-6 text-left">Nombre</th>
                <th className="py-4 px-6 text-left">Email</th>
                <th className="py-4 px-6 text-left">Rol</th>
                <th className="py-4 px-6 text-left">Owner BD</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <i className="fas fa-folder-open text-5xl mb-3 opacity-30"></i>
                    <p className="font-semibold text-gray-500">No se encontraron registros</p>
                    <p className="text-xs text-gray-400 mt-1">Pruebe ajustando los filtros de búsqueda</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item: any) => (
                  <tr key={item.id} className="table-row-hover hover:bg-blue-50/5 transition-colors">
                    <td className="py-4 px-6 text-gray-600 font-mono text-xs">{item.id}</td>
                    <td className="py-4 px-6 font-semibold text-secondary">{item.nombre}</td>
                    <td className="py-4 px-6 text-primary font-medium">{item.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase bg-purple-50 text-purple-700`}>
                        {item.rol}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 font-mono text-xs">{item.owner || '-'}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          to={`/usuarios/${item.id}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                          title="Editar Registro"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm("¿Está seguro de eliminar este registro?")) {
                              remove(item.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar Registro"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
