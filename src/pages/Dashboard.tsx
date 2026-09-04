import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Dashboard",
    items: [
      { name: "Dashboard", path: "/", icon: "fas fa-tachometer-alt" }
    ]
  },
  {
    label: "Taller",
    items: [
      { name: "Clientes", path: "/clientes", icon: "fas fa-users" },
      { name: "Proveedores", path: "/proveedores", icon: "fas fa-building" },
      { name: "Vehículos", path: "/vehiculos", icon: "fas fa-car" },
      { name: "Fichas de Recepción", path: "/recepciones", icon: "fas fa-clipboard-list" },
      { name: "Historial Cliente", path: "/historial", icon: "fas fa-history" },
      { name: "Presupuestos", path: "/cotizaciones", icon: "fas fa-file-invoice" },
      { name: "Repuestos", path: "/repuestos", icon: "fas fa-cog" },
      { name: "Notas de Entrega", path: "/notas-entrega", icon: "fas fa-receipt" },
      { name: "Tarjetas de Revisión", path: "/tarjetas-revision", icon: "fas fa-clipboard-check" },
      { name: "Compras Pendientes", path: "/compras-pendientes", icon: "fas fa-box-open" },
    ]
  },
  {
    label: "Finanzas",
    items: [
      { name: "Ingresos & Gastos", path: "/transacciones", icon: "fas fa-chart-line" },
      { name: "Cuentas por Cobrar", path: "/cuentas-cobrar", icon: "fas fa-file-invoice-dollar" },
      { name: "Cuentas por Pagar", path: "/cuentas-pagar", icon: "fas fa-file-export" },
    ]
  },
  {
    label: "Latonería",
    items: [
      { name: "Materiales", path: "/materiales", icon: "fas fa-paint-roller" },
      { name: "Órdenes de Latonería", path: "/ordenes", icon: "fas fa-wrench" },
    ]
  },
  {
    label: "Peritajes",
    items: [
      { name: "Listado de Peritajes", path: "/peritajes", icon: "fas fa-search-dollar" },
    ]
  },
  {
    label: "RRHH",
    items: [
      { name: "Empleados", path: "/empleados", icon: "fas fa-id-badge" },
      { name: "Contratos de Trabajo", path: "/contratos", icon: "fas fa-file-contract" },
      { name: "Comunicaciones", path: "/comunicaciones", icon: "fas fa-bullhorn" },
    ]
  },
  {
    label: "Reportes",
    items: [
      { name: "Reportes", path: "/reportes", icon: "fas fa-chart-bar" },
      { name: "Backup", path: "/backup", icon: "fas fa-download" },
    ]
  },
  {
    label: "Seguridad",
    items: [
      { name: "Usuarios", path: "/usuarios", icon: "fas fa-user-shield" }
    ]
  }
];

const routeInfo: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Resumen de operaciones en tiempo real" },
  "/clientes": { title: "Clientes", subtitle: "Gestión de clientes registrados" },
  "/proveedores": { title: "Proveedores", subtitle: "Proveedores y distribuidores" },
  "/vehiculos": { title: "Vehículos", subtitle: "Parque automotriz registrado" },
  "/recepciones": { title: "Fichas de Recepción", subtitle: "Fichas de ingreso de vehículos" },
  "/historial": { title: "Historial del Cliente", subtitle: "Historial de reparaciones realizadas" },
  "/cotizaciones": { title: "Presupuestos", subtitle: "Presupuestos y cotizaciones" },
  "/repuestos": { title: "Catálogo de Repuestos", subtitle: "Catálogo de repuestos y refacciones" },
  "/notas-entrega": { title: "Notas de Entrega", subtitle: "Notas de entrega de vehículos" },
  "/tarjetas-revision": { title: "Tarjetas de Revisión", subtitle: "Tarjetas de revisión técnica" },
  "/compras-pendientes": { title: "Compras Pendientes", subtitle: "Órdenes de compra pendientes" },
  "/transacciones": { title: "Ingresos & Gastos", subtitle: "Ingresos y gastos mensuales" },
  "/cuentas-cobrar": { title: "Cuentas por Cobrar", subtitle: "Cuentas por cobrar del sistema" },
  "/cuentas-pagar": { title: "Cuentas por Pagar", subtitle: "Cuentas por pagar del sistema" },
  "/materiales": { title: "Materiales - Latonería y Pintura", subtitle: "Materiales para latonería y pintura" },
  "/ordenes": { title: "Órdenes de Latonería", subtitle: "Seguimiento y órdenes de trabajo" },
  "/peritajes": { title: "Peritajes de Vehículos", subtitle: "Inspección y evaluación de vehículos con IA" },
  "/peritajes/nuevo": { title: "Nuevo Peritaje", subtitle: "Grabación y análisis multimodal de video" },
  "/empleados": { title: "Empleados / RRHH", subtitle: "Personal y recursos humanos" },
  "/contratos": { title: "Contratos de Trabajo", subtitle: "Contratos y acuerdos laborales" },
  "/comunicaciones": { title: "Comunicaciones Internas", subtitle: "Memorandos y circulares de personal" },
  "/reportes": { title: "Reportes", subtitle: "Reportes y estadísticas" },
  "/backup": { title: "Backup y Restauración", subtitle: "Gestión de copias de seguridad" },
  "/usuarios": { title: "Control de Acceso", subtitle: "Gestión de usuarios y seguridad del sistema" },
};

export default function Dashboard() {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const currentPath = location.pathname;
  const isPeritajeForm = currentPath.startsWith("/peritajes/");
  const infoKey = isPeritajeForm && currentPath !== "/peritajes" ? "/peritajes/nuevo" : currentPath;
  const currentInfo = routeInfo[infoKey] || { title: "Taller 360 Garage", subtitle: "Sistema Integral gRQL" };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-secondary text-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-5 border-b border-gray-700">
              <i className="fas fa-car-side text-2xl text-primary"></i>
              <div>
                <h2 className="font-bold text-xl">Taller 360</h2>
                <p className="text-xs text-gray-400">Menú</p>
              </div>
            </div>
            <nav className="p-2 space-y-1">
              {menuGroups.map((group) => (
                <div key={group.label} className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase px-3 py-1">{group.label}</p>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 mx-1 my-0.5 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive ? "bg-primary/20 text-primary font-medium" : "text-gray-300 hover:bg-gray-800"
                        }`}
                      >
                        <i className={`${item.icon} w-5 text-center`}></i>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 bg-secondary text-white lg:overflow-y-auto border-r border-gray-800">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-700">
          <i className="fas fa-car-side text-2xl text-primary"></i>
          <div>
            <h1 className="font-bold text-lg leading-tight">Taller Integral 360</h1>
            <p className="text-xs text-gray-400">Urbaez Motors 2030 C.A.</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase px-4 py-2">{group.label}</p>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== "/" && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 mx-2 my-1 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive ? "bg-primary/20 text-primary font-semibold" : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <i className={`${item.icon} w-5 text-center text-sm`}></i>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 text-sm p-2 hover:bg-gray-800 rounded-xl transition">
            <i className="fas fa-user-circle text-2xl text-primary"></i>
            <div className="truncate">
              <p className="font-medium text-white truncate">{user?.username || "Administrador"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || "admin@taller360.com"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col h-full overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white shadow-soft border-b border-gray-100 px-4 py-3.5 lg:px-8 flex items-center justify-between flex-wrap gap-3 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl transition"
            >
              <i className="fas fa-bars text-gray-600"></i>
            </button>
            <div>
              <h2 className="text-xl font-bold text-secondary">{currentInfo.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{currentInfo.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition text-gray-600" 
              title="Cambiar Tema"
            >
              <i className={darkMode ? "fas fa-sun text-yellow-500" : "fas fa-moon"}></i>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "AD"}
                </div>
                <span className="hidden md:block font-medium text-sm text-secondary">{user?.username || "Admin"}</span>
                <i className="fas fa-chevron-down text-xs text-gray-400"></i>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-strong z-20 py-2 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold uppercase">Cuenta</p>
                    <p className="text-sm font-bold text-secondary truncate">{user?.username || "Admin"}</p>
                  </div>
                  <Link 
                    to="/usuarios" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <i className="fas fa-user text-primary text-xs"></i> Perfil & Accesos
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-semibold"
                  >
                    <i className="fas fa-sign-out-alt text-xs"></i> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
