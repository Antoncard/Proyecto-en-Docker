import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { clientesApi, getErrorMessage } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastContext';

const emptyForm = {
  nombre: '',
  documento: '',
  email: '',
  telefono: '',
  direccion: '',
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { showToast } = useToast();

  const cargarClientes = async (q = busqueda) => {
    setLoading(true);
    try {
      const lista = await clientesApi.listar(q.trim() ? { q: q.trim() } : {});
      setClientes(lista);
    } catch (err) {
      showToast(getErrorMessage(err, 'Error al cargar clientes'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => cargarClientes(busqueda), 200);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const abrirEditar = (c) => {
    setEditando(c);
    setForm({
      nombre: c.nombre,
      documento: c.documento,
      email: c.email,
      telefono: c.telefono || '',
      direccion: c.direccion || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        documento: form.documento.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
      };
      if (editando) {
        await clientesApi.actualizar(editando.id, payload);
        showToast('Cliente actualizado correctamente');
      } else {
        await clientesApi.crear(payload);
        showToast('Cliente registrado correctamente');
      }
      setModalOpen(false);
      cargarClientes();
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo guardar el cliente'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminarConfirmado = async () => {
    if (!confirmDelete) return;
    try {
      await clientesApi.eliminar(confirmDelete.id);
      showToast(`Cliente "${confirmDelete.nombre}" desactivado`);
      setConfirmDelete(null);
      cargarClientes();
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo eliminar el cliente'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Directorio de clientes para facturación y seguimiento de ventas.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, documento o correo..."
          aria-label="Buscar clientes"
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">No se encontraron clientes</p>
            <p className="text-xs text-slate-500 mt-1">Registra tu primer cliente para emitir ventas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Cliente</th>
                  <th className="px-5 py-3.5 font-medium">Documento</th>
                  <th className="px-5 py-3.5 font-medium">Contacto</th>
                  <th className="px-5 py-3.5 font-medium">Dirección</th>
                  <th className="px-5 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{c.nombre}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{c.documento}</td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {c.email}
                      </p>
                      {c.telefono && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {c.telefono}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {c.direccion ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {c.direccion}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditar(c)}
                          aria-label={`Editar ${c.nombre}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(c)}
                          aria-label={`Eliminar ${c.nombre}`}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar cliente' : 'Nuevo cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cli-nombre" className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo o razón social *
            </label>
            <input
              id="cli-nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cli-doc" className="block text-sm font-medium text-slate-700 mb-1">
                Documento / NIT *
              </label>
              <input
                id="cli-doc"
                type="text"
                required
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="cli-tel" className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                id="cli-tel"
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cli-email" className="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico *
            </label>
            <input
              id="cli-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="cli-dir" className="block text-sm font-medium text-slate-700 mb-1">
              Dirección
            </label>
            <input
              id="cli-dir"
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
            />
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
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Desactivar cliente"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-slate-600">
          ¿Seguro que deseas desactivar a{' '}
          <span className="font-semibold text-slate-900">{confirmDelete?.nombre}</span>? Sus
          facturas emitidas seguirán disponibles en el historial.
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
