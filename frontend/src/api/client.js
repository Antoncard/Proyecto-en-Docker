import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado') {
  const data = error?.response?.data;
  if (data?.details && typeof data.details === 'object') {
    const firstMsg = Object.values(data.details)[0];
    if (firstMsg) return String(firstMsg);
  }
  if (data?.message) return data.message;
  if (error?.message) return error.message;
  return fallback;
}

export const dashboardApi = {
  resumen: () => api.get('/dashboard/resumen').then((r) => r.data),
};

export const productosApi = {
  listar: (params = {}) => api.get('/productos', { params }).then((r) => r.data),
  crear: (payload) => api.post('/productos', payload).then((r) => r.data),
  actualizar: (id, payload) => api.put(`/productos/${id}`, payload).then((r) => r.data),
  eliminar: (id) => api.delete(`/productos/${id}`),
};

export const clientesApi = {
  listar: (params = {}) => api.get('/clientes', { params }).then((r) => r.data),
  crear: (payload) => api.post('/clientes', payload).then((r) => r.data),
  actualizar: (id, payload) => api.put(`/clientes/${id}`, payload).then((r) => r.data),
  eliminar: (id) => api.delete(`/clientes/${id}`),
};

export const ventasApi = {
  listar: () => api.get('/ventas').then((r) => r.data),
  obtener: (id) => api.get(`/ventas/${id}`).then((r) => r.data),
  registrar: (payload) => api.post('/ventas', payload).then((r) => r.data),
};

export const facturasApi = {
  listar: () => api.get('/facturas').then((r) => r.data),
  obtener: (id) => api.get(`/facturas/${id}`).then((r) => r.data),
};

export const movimientosApi = {
  listar: () => api.get('/movimientos').then((r) => r.data),
  porProducto: (productoId) => api.get(`/movimientos/producto/${productoId}`).then((r) => r.data),
  registrar: (payload) => api.post('/movimientos', payload).then((r) => r.data),
};

export default api;
