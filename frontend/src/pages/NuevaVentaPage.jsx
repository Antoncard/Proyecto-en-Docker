import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Search } from 'lucide-react';
import { clientesApi, productosApi, ventasApi, getErrorMessage } from '../api/client';
import { formatCOP } from '../utils/format';
import StockBadge from '../components/StockBadge';
import { useToast } from '../components/ToastContext';

export default function NuevaVentaPage() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [clienteId, setClienteId] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [procesando, setProcesando] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [listaClientes, listaProductos] = await Promise.all([
          clientesApi.listar(),
          productosApi.listar(),
        ]);
        setClientes(listaClientes);
        setProductos(listaProductos);
        if (listaClientes.length > 0) {
          setClienteId(String(listaClientes[0].id));
        }
      } catch (err) {
        showToast(getErrorMessage(err, 'No se pudieron cargar los datos de venta'), 'error');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const productosFiltrados = useMemo(() => {
    const q = filtroProducto.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
    );
  }, [productos, filtroProducto]);

  const agregarAlCarrito = (producto) => {
    if (producto.stockActual <= 0) {
      showToast('Este producto no tiene stock disponible', 'error');
      return;
    }
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stockActual) {
          showToast(`Stock máximo alcanzado (${producto.stockActual} uds.)`, 'error');
          return prev;
        }
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (productoId, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.producto.id !== productoId) return item;
          const nueva = item.cantidad + delta;
          if (nueva > item.producto.stockActual) {
            showToast(`Solo hay ${item.producto.stockActual} unidades disponibles`, 'error');
            return item;
          }
          return { ...item, cantidad: nueva };
        })
        .filter((item) => item.cantidad > 0)
    );
  };

  const quitarItem = (productoId) => {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const totales = useMemo(() => {
    const subtotal = carrito.reduce(
      (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
      0
    );
    const iva = subtotal * 0.19;
    return { subtotal, iva, total: subtotal + iva };
  }, [carrito]);

  const confirmarVenta = async () => {
    if (!clienteId) {
      showToast('Selecciona un cliente para registrar la venta', 'error');
      return;
    }
    if (carrito.length === 0) {
      showToast('Agrega al menos un producto al carrito', 'error');
      return;
    }
    setProcesando(true);
    try {
      const venta = await ventasApi.registrar({
        clienteId: Number(clienteId),
        items: carrito.map((i) => ({
          productoId: i.producto.id,
          cantidad: i.cantidad,
        })),
      });
      showToast(`Venta confirmada · Factura ${venta.facturaNumero} generada`);
      navigate('/facturas', { state: { facturaId: venta.facturaId } });
    } catch (err) {
      showToast(getErrorMessage(err, 'No se pudo registrar la venta'), 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva venta</h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecciona el cliente y añade productos; al confirmar se descuenta el stock y se genera la
          factura con IVA 19 %.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo de productos */}
        <section className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              placeholder="Filtrar productos por nombre o SKU..."
              aria-label="Filtrar productos disponibles"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Cargando catálogo...</div>
            ) : productosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No hay productos que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {productosFiltrados.map((p) => {
                  const enCarrito = carrito.find((i) => i.producto.id === p.id)?.cantidad || 0;
                  const sinStock = p.stockActual <= 0 || enCarrito >= p.stockActual;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900 truncate">{p.nombre}</p>
                          <StockBadge stockActual={p.stockActual} stockMinimo={p.stockMinimo} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          {p.sku} · Stock disponible: <strong>{p.stockActual}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatCOP(p.precio)}
                        </span>
                        <button
                          type="button"
                          disabled={sinStock}
                          onClick={() => agregarAlCarrito(p)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Resumen / Carrito */}
        <aside className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-5 lg:sticky lg:top-6">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Resumen de venta</h2>
              <p className="text-xs text-slate-500">{carrito.length} línea(s) seleccionadas</p>
            </div>
          </div>

          <div>
            <label htmlFor="venta-cliente" className="block text-sm font-medium text-slate-700 mb-1.5">
              Cliente *
            </label>
            <select
              id="venta-cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.documento})
                </option>
              ))}
            </select>
          </div>

          {carrito.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 px-4 text-center text-sm text-slate-500">
              Añade productos desde el catálogo para calcular el total.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {carrito.map(({ producto, cantidad }) => (
                <div key={producto.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{producto.nombre}</p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {formatCOP(producto.precio)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(producto.id, -1)}
                      aria-label={`Disminuir cantidad de ${producto.nombre}`}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">
                      {cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(producto.id, 1)}
                      aria-label={`Aumentar cantidad de ${producto.nombre}`}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => quitarItem(producto.id)}
                      aria-label={`Quitar ${producto.nombre}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 ml-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium">{formatCOP(totales.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (19 %)</span>
              <span className="tabular-nums font-medium">{formatCOP(totales.iva)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total a pagar</span>
              <span className="tabular-nums text-blue-700">{formatCOP(totales.total)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={procesando || carrito.length === 0 || !clienteId}
            onClick={confirmarVenta}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            {procesando ? 'Procesando venta...' : 'Confirmar venta y facturar'}
          </button>
        </aside>
      </div>
    </div>
  );
}
