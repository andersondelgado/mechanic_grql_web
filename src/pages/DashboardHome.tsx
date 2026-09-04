import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHome() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white rounded-2xl p-6 lg:p-10 shadow-strong">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold">Taller Integral 360 Garage</h2>
            <p className="text-blue-100 mt-2 text-lg">Urbaez Motors 2030 C.A. - Sistema de Gestión GRQL</p>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 min-w-[120px]">
              <i className="fas fa-chart-bar text-3xl mb-1"></i>
              <p className="text-2xl font-bold">Activo</p>
              <p className="text-xs text-blue-200">Estado del Sistema</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-primary group-hover:text-white transition">
              <i className="fas fa-users text-2xl"></i>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Clientes</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">53</p>
          <p className="text-sm text-gray-500">Clientes registrados</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition">
              <i className="fas fa-car text-2xl"></i>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Vehículos</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">89</p>
          <p className="text-sm text-gray-500">Vehículos registrados</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition">
              <i className="fas fa-tools text-2xl"></i>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">En Taller</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">12</p>
          <p className="text-sm text-gray-500">Vehículos en proceso</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
              <i className="fas fa-check-circle text-2xl"></i>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Terminados</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">156</p>
          <p className="text-sm text-gray-500">Reparaciones completadas</p>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Ingresos Mes</p>
              <p className="text-2xl font-bold text-green-600 mt-1">$24,500.00</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <i className="fas fa-arrow-up"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Egresos Mes</p>
              <p className="text-2xl font-bold text-red-500 mt-1">$11,200.00</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <i className="fas fa-arrow-down"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Balance en Caja</p>
              <p className="text-2xl font-bold text-primary mt-1">$13,300.00</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Cuentas por Cobrar</p>
              <p className="text-2xl font-bold text-accent mt-1">$4,200.00</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-accent">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links / Navigation Cards */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
          <i className="fas fa-bolt text-primary"></i> Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link to="/peritajes/nuevo" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-camera text-2xl mb-2"></i>
            <span className="text-xs font-semibold">Nuevo Peritaje</span>
          </Link>
          <Link to="/clientes" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-user-plus text-2xl mb-2"></i>
            <span className="text-xs font-semibold">Ver Clientes</span>
          </Link>
          <Link to="/vehiculos" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-car text-2xl mb-2"></i>
            <span className="text-xs font-semibold">Ver Vehículos</span>
          </Link>
          <Link to="/ordenes" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-clipboard-list text-2xl mb-2"></i>
            <span className="text-xs font-semibold">Ver Órdenes</span>
          </Link>
          <Link to="/cotizaciones" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-file-invoice text-2xl mb-2"></i>
            <span className="text-xs font-semibold">Cotizaciones</span>
          </Link>
          <Link to="/inventario" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-boxes-stacked text-2xl mb-2"></i>
            <span className="text-xs font-semibold">Inventario</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
