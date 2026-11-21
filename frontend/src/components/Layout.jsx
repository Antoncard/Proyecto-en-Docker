import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  ArrowLeftRight,
  Menu,
  X,
  Boxes,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/ventas/nueva', label: 'Nueva Venta', icon: ShoppingCart },
  { to: '/facturas', label: 'Facturas', icon: FileText },
  { to: '/inventario', label: 'Kardex', icon: ArrowLeftRight },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderLinks = (onNavigate) => (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegación principal">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar escritorio */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Inventario Pro</p>
            <p className="text-xs text-slate-500">UCaldas · Grupo 1</p>
          </div>
        </div>
        {renderLinks(undefined)}
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Entorno Docker</p>
            <p className="mt-0.5">React · Spring Boot · Postgres</p>
          </div>
        </div>
      </aside>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Boxes className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-slate-900">Inventario Pro</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderLinks(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú de navegación"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-bold text-slate-900">Inventario Pro</span>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
