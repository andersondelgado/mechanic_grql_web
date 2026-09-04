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
import Ordenes from "./pages/Ordenes";
import Cotizaciones from "./pages/Cotizaciones";
import Repuestos from "./pages/Repuestos";
import Materiales from "./pages/Materiales";
import Facturas from "./pages/Facturas";
import Pagos from "./pages/Pagos";
import Inventario from "./pages/Inventario";
import ManoObra from "./pages/ManoObra";
import Peritajes from "./pages/Peritajes";
import PeritajeForm from "./pages/PeritajeForm";
import Recepciones from "./pages/Recepciones";
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
            <Route path="clientes" element={<Clientes />} />
            <Route path="vehiculos" element={<Vehiculos />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="empleados" element={<Empleados />} />
            <Route path="ordenes" element={<Ordenes />} />
            <Route path="cotizaciones" element={<Cotizaciones />} />
            <Route path="repuestos" element={<Repuestos />} />
            <Route path="materiales" element={<Materiales />} />
            <Route path="facturas" element={<Facturas />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="mano-obra" element={<ManoObra />} />
            <Route path="peritajes" element={<Peritajes />} />
            <Route path="peritajes/nuevo" element={<PeritajeForm />} />
            <Route path="peritajes/:id" element={<PeritajeForm />} />
            <Route path="recepciones" element={<Recepciones />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
