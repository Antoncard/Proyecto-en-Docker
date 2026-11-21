import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { dashboardApi, getErrorMessage } from '../api/client';
import { formatCOP, formatDateTime } from '../utils/format';
import StockBadge from '../components/StockBadge';
import { useToast } from '../components/ToastContext';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const cargarResumen = async () => {
    setLoading(true);
    try {
      const resumen = await dashboardApi.resumen();
      setData(resumen);
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo cargar el resumen del dashboard'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const kpis = data
    ? [
        {
          label: 'Productos activos',
          value: data.totalProductos,
          sub: `${data.totalClientes} clientes registrados`,
          icon: Package,
          tone: 'bg-blue-50 text-blue-700',
        },
        {
          label: 'Ventas de hoy',
          value: data.ventasHoy,
          sub: 'Transacciones completadas',
          icon: ShoppingBag,
          tone: 'bg-indigo-50 text-indigo-700',
        },
        {
          label: 'Ingresos de hoy',
          value: formatCOP(data.ingresosHoy),
          sub: 'Incluye IVA 19 %',
          icon: DollarSign,
          tone: 'bg-emerald-50 text-emerald-700',
        },
        {
          label: 'Alertas de stock bajo',
          value: data.cantidadStockBajo,
          sub: data.cantidadStockBajo > 0 ? 'Requieren reposición' : 'Inventario saludable',
          icon: AlertTriangle,
          tone: data.cantidadStockBajo > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Resumen operativo del inventario, alertas de reposición y ventas recientes.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={cargarResumen}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <Link
            to="/ventas/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-8 w-24 rounded bg-slate-200 mt-4" />
              <div className="h-3 w-36 rounded bg-slate-100 mt-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dos columnas: Stock bajo + Últimas ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Productos con stock bajo</h2>
              <p className="text-xs text-slate-500">Stock actual menor o igual al mínimo definido</p>
            </div>
            <Link
              to="/inventario"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Reponer
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {!loading && (!data?.productosStockBajo || data.productosStockBajo.length === 0) ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Todos los productos tienen stock por encima del mínimo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Producto</th>
                    <th className="px-5 py-3 font-medium text-right">Stock</th>
                    <th className="px-5 py-3 font-medium text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.productosStockBajo || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{p.nombre}</p>
                        <p className="text-xs text-slate-500 tabular-nums">{p.sku}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        <span className="font-semibold text-slate-900">{p.stockActual}</span>
                        <span className="text-slate-400"> / mín. {p.stockMinimo}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <StockBadge stockActual={p.stockActual} stockMinimo={p.stockMinimo} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Últimas ventas</h2>
              <p className="text-xs text-slate-500">Facturas emitidas recientemente</p>
            </div>
            <Link
              to="/facturas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver historial
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {!loading && (!data?.ultimasVentas || data.ultimasVentas.length === 0) ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Aún no se han registrado ventas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Factura</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.ultimasVentas || []).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-blue-700 tabular-nums">{v.facturaNumero}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(v.fecha)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{v.clienteNombre}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                        {formatCOP(v.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
