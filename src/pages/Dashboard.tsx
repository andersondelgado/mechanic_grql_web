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
    label: "Tablero",
    items: [
      { name: "Tablero", path: "/", icon: "fas fa-chart-line" }
    ]
  },
  {
    label: "Mantenimiento",
    items: [
      { name: "Clientes", path: "/clientes", icon: "fas fa-users" },
      { name: "Vehículos", path: "/vehiculos", icon: "fas fa-car" },
      { name: "Peritajes", path: "/peritajes", icon: "fas fa-camera" },
      { name: "Recepciones", path: "/recepciones", icon: "fas fa-warehouse" },
      { name: "Órdenes", path: "/ordenes", icon: "fas fa-clipboard-list" },
      { name: "Cotizaciones", path: "/cotizaciones", icon: "fas fa-file-invoice" }
    ]
  },
  {
    label: "Inventario",
    items: [
      { name: "Repuestos", path: "/repuestos", icon: "fas fa-gears" },
      { name: "Materiales", path: "/materiales", icon: "fas fa-paint-roller" },
      { name: "Mano de Obra", path: "/mano-obra", icon: "fas fa-wrench" },
      { name: "Inventario", path: "/inventario", icon: "fas fa-boxes-stacked" }
    ]
  },
  {
    label: "Finanzas",
    items: [
      { name: "Facturas", path: "/facturas", icon: "fas fa-file-invoice-dollar" },
      { name: "Pagos", path: "/pagos", icon: "fas fa-credit-card" }
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
  "/": { title: "Tablero de Control", subtitle: "Resumen operativo y estadísticas generales" },
  "/clientes": { title: "Gestión de Clientes", subtitle: "Listado y registro de clientes del taller" },
  "/vehiculos": { title: "Gestión de Vehículos", subtitle: "Listado y especificaciones de vehículos" },
  "/proveedores": { title: "Proveedores", subtitle: "Catálogo de proveedores de repuestos y servicios" },
  "/empleados": { title: "Personal y Empleados", subtitle: "Gestión de mecánicos y personal del taller" },
  "/ordenes": { title: "Órdenes de Trabajo", subtitle: "Seguimiento de reparaciones y estados" },
  "/cotizaciones": { title: "Presupuestos y Cotizaciones", subtitle: "Detalle de cotizaciones y costos estimativos" },
  "/repuestos": { title: "Catálogo de Repuestos", subtitle: "Stock y precios de piezas de repuesto" },
  "/materiales": { title: "Latonería y Pintura", subtitle: "Control de materiales y consumos por pieza" },
  "/facturas": { title: "Cuentas por Cobrar", subtitle: "Registro de facturas emitidas" },
  "/pagos": { title: "Transacciones Financieras", subtitle: "Flujo de caja y pagos registrados" },
  "/inventario": { title: "Inventario de Repuestos", subtitle: "Pendientes por comprar y stock mínimo" },
  "/mano-obra": { title: "Contratos de Trabajo", subtitle: "Personalización de mano de obra por pieza" },
  "/peritajes": { title: "Peritajes e Inspecciones", subtitle: "Grabación de video y análisis con Inteligencia Artificial" },
  "/peritajes/nuevo": { title: "Nueva Inspección", subtitle: "Registro e inicio del análisis de video" },
  "/recepciones": { title: "Fichas de Recepción", subtitle: "Registro de entrada de vehículos al taller" },
  "/usuarios": { title: "Control de Acceso", subtitle: "Gestión de usuarios y seguridad del sistema" },
};

export default function Dashboard() {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Get current screen info
  const currentPath = location.pathname;
  // Handle dynamic subpaths like /peritajes/123
  const isPeritajeForm = currentPath.startsWith("/peritajes/");
  const infoKey = isPeritajeForm && currentPath !== "/peritajes" ? "/peritajes/nuevo" : currentPath;
  const currentInfo = routeInfo[infoKey] || { title: "Sistema Taller 360", subtitle: "Gestión Integral" };

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
                <p className="text-xs text-gray-400">Menú de Navegación</p>
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
                      isActive ? "bg-primary/20 text-primary font-medium shadow-sm" : "text-gray-300 hover:bg-gray-800"
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
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm p-2 hover:bg-gray-800 rounded-xl transition group">
            <div className="flex items-center gap-3">
              <i className="fas fa-user-circle text-2xl text-primary"></i>
              <div>
                <p className="font-medium text-gray-200 truncate max-w-[120px]">{user?.email?.split('@')[0] || "Usuario"}</p>
                <p className="text-xs text-gray-400 truncate max-w-[120px]">{user?.email || "taller360"}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-700 transition"
              title="Cerrar Sesión"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-soft border-b px-4 py-3 lg:px-8 flex items-center justify-between flex-wrap gap-3 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl transition border"
            >
              <i className="fas fa-bars text-gray-600"></i>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-secondary leading-tight">{currentInfo.title}</h2>
              <p className="text-sm text-gray-500">{currentInfo.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode toggle mock */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition border text-gray-600"
            >
              <i className={darkMode ? "fas fa-sun text-yellow-500" : "fas fa-moon text-gray-500"}></i>
            </button>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition border"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden md:block font-medium text-sm text-gray-700 pr-1">
                  {user?.email?.split('@')[0] || "Admin"}
                </span>
                <i className="fas fa-chevron-down text-[10px] text-gray-400 pr-1"></i>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-strong z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b text-xs">
                      <p className="font-semibold text-secondary">Conectado como</p>
                      <p className="text-gray-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      <i className="fas fa-user text-primary w-4 text-center"></i>
                      <span>Mi Perfil</span>
                    </a>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      <i className="fas fa-cog text-gray-500 w-4 text-center"></i>
                      <span>Configuración</span>
                    </a>
                    <hr className="border-gray-100" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors text-left font-medium"
                    >
                      <i className="fas fa-sign-out-alt w-4 text-center"></i>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
