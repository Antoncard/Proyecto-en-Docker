import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal, Plus } from 'lucide-react';
import { movimientosApi, productosApi, getErrorMessage } from '../api/client';
import { formatDateTime } from '../utils/format';
import { useToast } from '../components/ToastContext';

const tipoBadge = {
  ENTRADA: {
    label: 'Entrada',
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    icon: ArrowDownLeft,
  },
  SALIDA: {
    label: 'Salida',
    cls: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    icon: ArrowUpRight,
  },
  AJUSTE: {
    label: 'Ajuste',
    cls: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    icon: SlidersHorizontal,
  },
};

export default function InventarioPage() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [filtroProductoId, setFiltroProductoId] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    productoId: '',
    tipo: 'ENTRADA',
    cantidad: '10',
    motivo: '',
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const cargarTodo = async (prodId = filtroProductoId) => {
    setLoading(true);
    try {
      const [listaProds, listaMovs] = await Promise.all([
        productosApi.listar(),
        prodId ? movimientosApi.porProducto(prodId) : movimientosApi.listar(),
      ]);
      setProductos(listaProds);
      setMovimientos(listaMovs);
      if (!form.productoId && listaProds.length > 0) {
        setForm((prev) => ({ ...prev, productoId: String(listaProds[0].id) }));
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo cargar el kardex de inventario'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo(filtroProductoId);
  }, [filtroProductoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productoId) {
      showToast('Selecciona un producto', 'error');
      return;
    }
    setSaving(true);
    try {
      await movimientosApi.registrar({
        productoId: Number(form.productoId),
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        motivo: form.motivo.trim(),
      });
      showToast('Movimiento registrado en el kardex');
      setForm((prev) => ({ ...prev, cantidad: '1', motivo: '' }));
      cargarTodo(filtroProductoId);
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo registrar el movimiento'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Inventario y Kardex de movimientos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Registra entradas de compra, salidas manuales o ajustes físicos y consulta la trazabilidad
          completa por producto.
        </p>
      </div>

      {/* Formulario de registro */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4"
      >
        <h2 className="text-base font-semibold text-slate-900">Registrar movimiento de stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="mov-prod" className="block text-sm font-medium text-slate-700 mb-1">
              Producto *
            </label>
            <select
              id="mov-prod"
              required
              value={form.productoId}
              onChange={(e) => setForm({ ...form, productoId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Stock: {p.stockActual})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mov-tipo" className="block text-sm font-medium text-slate-700 mb-1">
              Tipo *
            </label>
            <select
              id="mov-tipo"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ENTRADA">ENTRADA (suma stock)</option>
              <option value="SALIDA">SALIDA (descuenta stock)</option>
              <option value="AJUSTE">AJUSTE (fija stock exacto)</option>
            </select>
          </div>

          <div>
            <label htmlFor="mov-cant" className="block text-sm font-medium text-slate-700 mb-1">
              {form.tipo === 'AJUSTE' ? 'Nuevo stock exacto *' : 'Cantidad *'}
            </label>
            <input
              id="mov-cant"
              type="number"
              min={form.tipo === 'AJUSTE' ? 0 : 1}
              required
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm tabular-nums"
            />
          </div>

          <div>
            <label htmlFor="mov-motivo" className="block text-sm font-medium text-slate-700 mb-1">
              Motivo *
            </label>
            <input
              id="mov-motivo"
              type="text"
              required
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              placeholder="Ej. Compra a proveedor #42"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || productos.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </form>

      {/* Filtro y tabla Kardex */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Historial de movimientos</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-kardex" className="text-xs font-medium text-slate-500">
              Filtrar por producto:
            </label>
            <select
              id="filtro-kardex"
              value={filtroProductoId}
              onChange={(e) => setFiltroProductoId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm"
            >
              <option value="">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} · {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando movimientos...</div>
        ) : movimientos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No hay movimientos registrados para este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Fecha</th>
                  <th className="px-5 py-3.5 font-medium">Producto</th>
                  <th className="px-5 py-3.5 font-medium">Tipo</th>
                  <th className="px-5 py-3.5 font-medium text-right">Cant.</th>
                  <th className="px-5 py-3.5 font-medium text-right">Stock</th>
                  <th className="px-5 py-3.5 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.map((m) => {
                  const badge = tipoBadge[m.tipo] || tipoBadge.AJUSTE;
                  const Icon = badge.icon;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {formatDateTime(m.fecha)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{m.productoNombre}</p>
                        <p className="text-xs text-slate-500 font-mono">{m.productoSku}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.cls}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {m.cantidad}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-600 whitespace-nowrap">
                        {m.stockAnterior} →{' '}
                        <strong className="text-slate-900">{m.stockNuevo}</strong>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{m.motivo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
