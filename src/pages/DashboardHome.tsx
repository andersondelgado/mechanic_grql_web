import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatsService } from "../services/stats.service";
import type { DashboardStats } from "../types/entities";

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await StatsService.getDashboardStats();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val?: number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const monthlyList = stats?.monthly_breakdown || [];
  const maxVal = Math.max(
    ...monthlyList.map((m) => Math.max(m.income || 0, m.expenses || 0)),
    100
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 lg:p-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white rounded-2xl p-6 lg:p-10 shadow-strong relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
          <i className="fas fa-car-crash text-9xl text-white"></i>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-3 backdrop-blur-sm">
              <i className="fas fa-shield-alt"></i> Taller Integral 360 v2.0
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold">Taller Integral 360 Garage</h2>
            <p className="text-blue-100 mt-2 text-lg">Urbaez Motors 2030 C.A. - Sistema de Gestión GRQL</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white px-4 py-3 rounded-xl backdrop-blur font-medium text-sm shadow-sm"
              title="Actualizar datos en tiempo real"
            >
              <i className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`}></i>
              <span>{refreshing ? "Sincronizando..." : "Actualizar"}</span>
            </button>
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 min-w-[120px] text-center">
              <i className="fas fa-chart-line text-2xl mb-1 text-green-300"></i>
              <p className="text-xl font-bold">Activo</p>
              <p className="text-xs text-blue-200">Servidor gRQL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-primary group-hover:text-white transition">
              <i className="fas fa-users text-2xl"></i>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">Clientes</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">
            {loading ? "..." : (stats?.total_clients ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Clientes registrados</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition">
              <i className="fas fa-car text-2xl"></i>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">Vehículos</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">
            {loading ? "..." : (stats?.total_vehicles ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Vehículos en base de datos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <i className="fas fa-tools text-2xl"></i>
            </div>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">En Proceso</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">
            {loading ? "..." : (stats?.vehicles_in_shop ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Vehículos en taller</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
              <i className="fas fa-check-circle text-2xl"></i>
            </div>
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium">Histórico</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">
            {loading ? "..." : (stats?.completed_repairs ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Reparaciones concluidas</p>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {loading ? "..." : formatCurrency(stats?.total_income_month)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 text-lg shadow-sm">
              <i className="fas fa-arrow-trend-up"></i>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <i className="fas fa-chart-pie text-green-500"></i> Total histórico: {formatCurrency(stats?.total_income_all)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Egresos del Mes</p>
              <p className="text-2xl font-bold text-red-500 mt-1">
                {loading ? "..." : formatCurrency(stats?.total_expenses_month)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 text-lg shadow-sm">
              <i className="fas fa-arrow-trend-down"></i>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <i className="fas fa-receipt text-red-400"></i> Total histórico: {formatCurrency(stats?.total_expenses_all)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Balance en Caja</p>
              <p className={`text-2xl font-bold mt-1 ${(stats?.balance_month || 0) >= 0 ? "text-primary" : "text-red-600"}`}>
                {loading ? "..." : formatCurrency(stats?.balance_month)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary text-lg shadow-sm">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <i className="fas fa-scale-balanced text-blue-500"></i> Balance global: {formatCurrency(stats?.total_balance_all)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-strong transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Cuentas por Cobrar</p>
              <p className="text-2xl font-bold text-accent mt-1">
                {loading ? "..." : formatCurrency(stats?.accounts_receivable_total)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-accent text-lg shadow-sm">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <i className="fas fa-hand-holding-dollar text-amber-500"></i> Por pagar: {formatCurrency(stats?.accounts_payable_total)}
          </p>
        </div>
      </div>

      {/* Monthly Financial Breakdown Chart */}
      {monthlyList.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                <i className="fas fa-chart-column text-primary"></i> Evolución Financiera Mensual
              </h3>
              <p className="text-xs text-gray-500">Comparativa de Ingresos vs Egresos por período</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-green-500 inline-block"></span>
                <span className="text-gray-600">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-400 inline-block"></span>
                <span className="text-gray-600">Egresos</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {monthlyList.slice(-4).map((m, idx) => {
              const incPct = maxVal > 0 ? Math.min(100, Math.round((m.income / maxVal) * 100)) : 0;
              const expPct = maxVal > 0 ? Math.min(100, Math.round((m.expenses / maxVal) * 100)) : 0;
              return (
                <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-secondary uppercase">{m.month || "Período"}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.balance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {formatCurrency(m.balance)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Ingresos</span>
                        <span className="font-medium text-green-600">{formatCurrency(m.income)}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${incPct}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Egresos</span>
                        <span className="font-medium text-red-500">{formatCurrency(m.expenses)}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-400 h-full rounded-full transition-all duration-500" style={{ width: `${expPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links / Navigation Cards */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
          <i className="fas fa-bolt text-primary"></i> Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link to="/peritajes/nuevo" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-camera text-2xl mb-2 text-primary"></i>
            <span className="text-xs font-semibold">Nuevo Peritaje</span>
          </Link>
          <Link to="/clientes" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-user-plus text-2xl mb-2 text-blue-600"></i>
            <span className="text-xs font-semibold">Ver Clientes</span>
          </Link>
          <Link to="/vehiculos" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-car text-2xl mb-2 text-green-600"></i>
            <span className="text-xs font-semibold">Ver Vehículos</span>
          </Link>
          <Link to="/ordenes" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-clipboard-list text-2xl mb-2 text-amber-600"></i>
            <span className="text-xs font-semibold">Ver Órdenes</span>
          </Link>
          <Link to="/cotizaciones" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-file-invoice text-2xl mb-2 text-purple-600"></i>
            <span className="text-xs font-semibold">Presupuestos</span>
          </Link>
          <Link to="/transacciones" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-center">
            <i className="fas fa-chart-line text-2xl mb-2 text-emerald-600"></i>
            <span className="text-xs font-semibold">Transacciones</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
