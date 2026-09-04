import React from "react";
import { Link } from "react-router-dom";

export default function Reportes() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Banner */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-50/70 text-primary rounded-2xl">
            <i className="fas fa-chart-bar text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary leading-tight">Módulo de Reportes y Estadísticas</h1>
            <p className="text-sm text-gray-500 mt-0.5">Métricas operativas, financieras y de productividad del taller</p>
          </div>
        </div>
      </div>

      {/* Grid of Report Cards matching Wireframe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition">
              <i className="fas fa-car text-xl"></i>
            </div>
            <h3 className="font-bold text-secondary text-lg">Vehículos en Taller</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Listado y estado en tiempo real de vehículos actualmente en proceso de diagnóstico o reparación.</p>
          <Link to="/recepciones" className="text-primary text-sm font-semibold hover:text-primary-dark transition flex items-center gap-1">
            Ver detalles <i className="fas fa-arrow-right text-xs"></i>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition">
              <i className="fas fa-chart-pie text-xl"></i>
            </div>
            <h3 className="font-bold text-secondary text-lg">Ingresos vs Gastos</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Comparativa mensual entre ingresos brutos por mano de obra y egresos operativos.</p>
          <Link to="/transacciones" className="text-primary text-sm font-semibold hover:text-primary-dark transition flex items-center gap-1">
            Ver detalles <i className="fas fa-arrow-right text-xs"></i>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
              <i className="fas fa-gears text-xl"></i>
            </div>
            <h3 className="font-bold text-secondary text-lg">Repuestos Más Usados</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Top 10 repuestos con mayor rotación e historial de consumo en órdenes de reparación.</p>
          <Link to="/repuestos" className="text-primary text-sm font-semibold hover:text-primary-dark transition flex items-center gap-1">
            Ver detalles <i className="fas fa-arrow-right text-xs"></i>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:bg-yellow-600 group-hover:text-white transition">
              <i className="fas fa-file-invoice-dollar text-xl"></i>
            </div>
            <h3 className="font-bold text-secondary text-lg">Cuentas por Cobrar</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Reporte de antigüedad de saldos y créditos pendientes por cliente.</p>
          <Link to="/cuentas-cobrar" className="text-primary text-sm font-semibold hover:text-primary-dark transition flex items-center gap-1">
            Ver detalles <i className="fas fa-arrow-right text-xs"></i>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition">
              <i className="fas fa-box-open text-xl"></i>
            </div>
            <h3 className="font-bold text-secondary text-lg">Stock Bajo / Crítico</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Piezas del catálogo que se encuentran por debajo del umbral mínimo de inventario.</p>
          <Link to="/compras-pendientes" className="text-primary text-sm font-semibold hover:text-primary-dark transition flex items-center gap-1">
            Ver detalles <i className="fas fa-arrow-right text-xs"></i>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <i className="fas fa-id-badge text-xl"></i>
            </div>
            <h3 className="font-bold text-secondary text-lg">Comisiones por Mecánico</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Resumen acumulado de trabajos completados y comisiones asignadas al personal técnico.</p>
          <Link to="/empleados" className="text-primary text-sm font-semibold hover:text-primary-dark transition flex items-center gap-1">
            Ver detalles <i className="fas fa-arrow-right text-xs"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
