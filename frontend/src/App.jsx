import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProductosPage from './pages/ProductosPage';
import ClientesPage from './pages/ClientesPage';
import NuevaVentaPage from './pages/NuevaVentaPage';
import FacturasPage from './pages/FacturasPage';
import InventarioPage from './pages/InventarioPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="ventas/nueva" element={<NuevaVentaPage />} />
        <Route path="facturas" element={<FacturasPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
