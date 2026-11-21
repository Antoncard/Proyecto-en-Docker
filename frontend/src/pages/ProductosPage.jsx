import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { productosApi, getErrorMessage } from '../api/client';
import { formatCOP } from '../utils/format';
import Modal from '../components/Modal';
import StockBadge from '../components/StockBadge';
import { useToast } from '../components/ToastContext';

const emptyForm = {
  sku: '',
  nombre: '',
  categoria: 'Periféricos',
  descripcion: '',
  precio: '',
  stockActual: '0',
  stockMinimo: '5',
};

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { showToast } = useToast();

  const cargarProductos = async (q = busqueda, bajo = soloStockBajo) => {
    setLoading(true);
    try {
      const params = {};
      if (bajo) params.soloStockBajo = true;
      else if (q.trim()) params.q = q.trim();
      const lista = await productosApi.listar(params);
      setProductos(lista);
    } catch (err) {
      showToast(getErrorMessage(err, 'Error al cargar productos'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarProductos(busqueda, soloStockBajo);
    }, 200);
    return () => clearTimeout(timer);
  }, [busqueda, soloStockBajo]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      descripcion: p.descripcion || '',
      precio: String(p.precio),
      stockActual: String(p.stockActual),
      stockMinimo: String(p.stockMinimo),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        sku: form.sku.trim(),
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        stockActual: Number(form.stockActual),
        stockMinimo: Number(form.stockMinimo),
      };

      if (editando) {
        await productosApi.actualizar(editando.id, payload);
        showToast('Producto actualizado correctamente');
      } else {
        await productosApi.crear(payload);
        showToast('Producto creado correctamente');
      }
      setModalOpen(false);
      cargarProductos();
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo guardar el producto'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminarConfirmado = async () => {
    if (!confirmDelete) return;
    try {
      await productosApi.eliminar(confirmDelete.id);
      showToast(`Producto "${confirmDelete.nombre}" desactivado`);
      setConfirmDelete(null);
      cargarProductos();
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo eliminar el producto'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Catálogo de inventario con control de SKU, precios y stock mínimo.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setSoloStockBajo(false);
              setBusqueda(e.target.value);
            }}
            placeholder="Buscar por nombre, SKU o categoría..."
            aria-label="Buscar productos"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setSoloStockBajo((prev) => !prev)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            soloStockBajo
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Solo stock bajo
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando productos...</div>
        ) : productos.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">No se encontraron productos</p>
            <p className="text-xs text-slate-500 mt-1">
              Ajusta el filtro o crea un nuevo producto para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">SKU</th>
                  <th className="px-5 py-3.5 font-medium">Producto</th>
                  <th className="px-5 py-3.5 font-medium">Categoría</th>
                  <th className="px-5 py-3.5 font-medium text-right">Precio</th>
                  <th className="px-5 py-3.5 font-medium text-right">Stock</th>
                  <th className="px-5 py-3.5 font-medium">Estado</th>
                  <th className="px-5 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">
                      {p.sku}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{p.nombre}</p>
                      {p.descripcion && (
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{p.descripcion}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.categoria}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCOP(p.precio)}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      <span className="font-semibold text-slate-900">{p.stockActual}</span>
                      <span className="text-xs text-slate-400"> (mín. {p.stockMinimo})</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StockBadge stockActual={p.stockActual} stockMinimo={p.stockMinimo} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditar(p)}
                          aria-label={`Editar ${p.nombre}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(p)}
                          aria-label={`Eliminar ${p.nombre}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar producto' : 'Nuevo producto'}
        subtitle="Todos los campos marcados con * son obligatorios."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-sku" className="block text-sm font-medium text-slate-700 mb-1">
                SKU *
              </label>
              <input
                id="prod-sku"
                type="text"
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="Ej. TEC-008"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm uppercase"
              />
            </div>
            <div>
              <label htmlFor="prod-cat" className="block text-sm font-medium text-slate-700 mb-1">
                Categoría *
              </label>
              <input
                id="prod-cat"
                type="text"
                required
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Ej. Periféricos"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-nombre" className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del producto *
            </label>
            <input
              id="prod-nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Teclado Mecánico Inalámbrico"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prod-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              id="prod-desc"
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalles técnicos o especificaciones..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prod-precio" className="block text-sm font-medium text-slate-700 mb-1">
                Precio (COP) *
              </label>
              <input
                id="prod-precio"
                type="number"
                min="1"
                step="0.01"
                required
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="prod-stock" className="block text-sm font-medium text-slate-700 mb-1">
                Stock actual *
              </label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                required
                value={form.stockActual}
                onChange={(e) => setForm({ ...form, stockActual: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="prod-min" className="block text-sm font-medium text-slate-700 mb-1">
                Stock mínimo *
              </label>
              <input
                id="prod-min"
                type="number"
                min="0"
                required
                value={form.stockMinimo}
                onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar eliminación */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Desactivar producto"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-slate-600">
          ¿Seguro que deseas desactivar{' '}
          <span className="font-semibold text-slate-900">{confirmDelete?.nombre}</span>? Sus ventas
          y movimientos históricos se conservarán intactos.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setConfirmDelete(null)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={eliminarConfirmado}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Sí, desactivar
          </button>
        </div>
      </Modal>
    </div>
  );
}
