import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./hooks/use-auth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import Clientes from "./pages/Clientes";
import Vehiculos from "./pages/Vehiculos";
import Proveedores from "./pages/Proveedores";
import Empleados from "./pages/Empleados";
import Recepciones from "./pages/Recepciones";
import HistorialCliente from "./pages/HistorialCliente";
import Cotizaciones from "./pages/Cotizaciones";
import Repuestos from "./pages/Repuestos";
import NotasEntrega from "./pages/NotasEntrega";
import TarjetasRevision from "./pages/TarjetasRevision";
import ComprasPendientes from "./pages/ComprasPendientes";
import Transacciones from "./pages/Transacciones";
import CuentasCobrar from "./pages/CuentasCobrar";
import CuentasPagar from "./pages/CuentasPagar";
import Materiales from "./pages/Materiales";
import Ordenes from "./pages/Ordenes";
import Peritajes from "./pages/Peritajes";
import PeritajeForm from "./pages/PeritajeForm";
import ContratosTrabajo from "./pages/ContratosTrabajo";
import Comunicaciones from "./pages/Comunicaciones";
import Reportes from "./pages/Reportes";
import Backup from "./pages/Backup";
import Usuarios from "./pages/Usuarios";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardHome />} />
            
            {/* Taller */}
            <Route path="clientes" element={<Clientes />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="vehiculos" element={<Vehiculos />} />
            <Route path="recepciones" element={<Recepciones />} />
            <Route path="historial" element={<HistorialCliente />} />
            <Route path="cotizaciones" element={<Cotizaciones />} />
            <Route path="repuestos" element={<Repuestos />} />
            <Route path="notas-entrega" element={<NotasEntrega />} />
            <Route path="tarjetas-revision" element={<TarjetasRevision />} />
            <Route path="compras-pendientes" element={<ComprasPendientes />} />

            {/* Finanzas */}
            <Route path="transacciones" element={<Transacciones />} />
            <Route path="cuentas-cobrar" element={<CuentasCobrar />} />
            <Route path="cuentas-pagar" element={<CuentasPagar />} />

            {/* Latonería */}
            <Route path="materiales" element={<Materiales />} />
            <Route path="ordenes" element={<Ordenes />} />

            {/* Peritajes */}
            <Route path="peritajes" element={<Peritajes />} />
            <Route path="peritajes/nuevo" element={<PeritajeForm />} />
            <Route path="peritajes/:id" element={<PeritajeForm />} />

            {/* RRHH */}
            <Route path="empleados" element={<Empleados />} />
            <Route path="contratos" element={<ContratosTrabajo />} />
            <Route path="comunicaciones" element={<Comunicaciones />} />

            {/* Reportes & Backup */}
            <Route path="reportes" element={<Reportes />} />
            <Route path="backup" element={<Backup />} />

            {/* Seguridad */}
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
