import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, Printer, FileText } from 'lucide-react';
import { facturasApi, getErrorMessage } from '../api/client';
import { formatCOP, formatDateTime } from '../utils/format';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastContext';

export default function FacturasPage() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const lista = await facturasApi.listar();
        setFacturas(lista);
        const autoOpenId = location.state?.facturaId;
        if (autoOpenId) {
          const found = lista.find((f) => f.id === autoOpenId);
          if (found) setSeleccionada(found);
        }
      } catch (err) {
        showToast(getErrorMessage(err, 'No se pudo cargar el historial de facturas'), 'error');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [location.state?.facturaId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Facturas e historial de ventas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Consulta cada factura emitida con su desglose de productos e IVA (19 %).
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando facturas...</div>
        ) : facturas.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700 mt-2">Aún no hay facturas emitidas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">N.º Factura</th>
                  <th className="px-5 py-3.5 font-medium">Fecha</th>
                  <th className="px-5 py-3.5 font-medium">Cliente</th>
                  <th className="px-5 py-3.5 font-medium text-right">Subtotal</th>
                  <th className="px-5 py-3.5 font-medium text-right">IVA 19 %</th>
                  <th className="px-5 py-3.5 font-medium text-right">Total</th>
                  <th className="px-5 py-3.5 font-medium text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-semibold text-blue-700 tabular-nums">
                      {f.numero}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{formatDateTime(f.fechaEmision)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{f.clienteNombre}</p>
                      <p className="text-xs text-slate-500 tabular-nums">{f.clienteDocumento}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">
                      {formatCOP(f.subtotal)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">
                      {formatCOP(f.iva)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCOP(f.total)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSeleccionada(f)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle de Factura */}
      <Modal
        open={Boolean(seleccionada)}
        onClose={() => setSeleccionada(null)}
        title={`Factura ${seleccionada?.numero || ''}`}
        subtitle={seleccionada ? `Emitida el ${formatDateTime(seleccionada.fechaEmision)}` : ''}
        maxWidth="max-w-2xl"
      >
        {seleccionada && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cliente
                </p>
                <p className="font-semibold text-slate-900 mt-1">{seleccionada.clienteNombre}</p>
                <p className="text-xs text-slate-600 tabular-nums">
                  Doc: {seleccionada.clienteDocumento}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Contacto
                </p>
                <p className="text-slate-700 mt-1">{seleccionada.clienteEmail}</p>
                {seleccionada.clienteDireccion && (
                  <p className="text-xs text-slate-600">{seleccionada.clienteDireccion}</p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Producto</th>
                    <th className="px-4 py-2.5 font-medium text-right">Cant.</th>
                    <th className="px-4 py-2.5 font-medium text-right">P. Unitario</th>
                    <th className="px-4 py-2.5 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seleccionada.detalles.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{d.productoNombre}</p>
                        <p className="text-xs text-slate-500 font-mono">{d.productoSku}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{d.cantidad}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCOP(d.precioUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatCOP(d.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end space-y-1.5 text-sm">
              <div className="flex justify-between w-60 text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCOP(seleccionada.subtotal)}</span>
              </div>
              <div className="flex justify-between w-60 text-slate-600">
                <span>IVA (19 %)</span>
                <span className="tabular-nums">{formatCOP(seleccionada.iva)}</span>
              </div>
              <div className="flex justify-between w-60 border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Total</span>
                <span className="tabular-nums text-blue-700">{formatCOP(seleccionada.total)}</span>
              </div>
            </div>

            <div className="no-print flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
              <button
                type="button"
                onClick={() => setSeleccionada(null)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
