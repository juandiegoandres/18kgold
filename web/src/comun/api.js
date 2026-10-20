// Cliente de la API del Worker (ARQUITECTURA §2).
//
// Base: import.meta.env.VITE_API (p. ej. https://api.18goldkprada.com). Sin barra final.
// Mock: con VITE_MOCK=1 o VITE_API vacío se lee /mock/catalogo.json (generado con
// `python3 web/herramientas/generar-mock.py`). Si la API falla también se intenta el mock;
// en producción el mock no existe (el workflow borra dist/mock) y se muestra un estado vacío.

import { pesos, ruta } from './formato.js';

const API = String(import.meta.env.VITE_API || '').replace(/\/$/, '');
export const MODO_MOCK = import.meta.env.VITE_MOCK === '1' || !API;

const CLAVE_SESION = 'kp:catalogo:v1';
const VIDA_SESION = 5 * 60 * 1000; // 5 minutos: el gramo cambia en el día
let enMemoria = null;

export class ErrorApi extends Error {}

async function pedirJSON(url, opciones = {}, espera = 9000) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), espera);
  try {
    const r = await fetch(url, { ...opciones, signal: control.signal });
    if (!r.ok) throw new ErrorApi(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(reloj);
  }
}

/** Las rutas «/mock/…» del mock respetan la base de Vite. */
function urlImagen(u) {
  if (typeof u !== 'string' || !u) return '';
  if (/^(https?:)?\/\//.test(u) || u.startsWith('data:')) return u;
  if (u.startsWith('/img/') && API) return API + u; // imágenes servidas por el Worker (R2)
  return ruta(u);
}

function normalizar(datos, origen) {
  const productos = (datos.productos || []).map((p) => ({
    ...p,
    imagenes: (p.imagenes || []).map(urlImagen).filter(Boolean),
    peso_gramos: Number(p.peso_gramos) || 0,
    precio: Number(p.precio) || 0,
    precio_antes: p.precio_antes ? Number(p.precio_antes) : null,
    destacado: Boolean(Number(p.destacado) || p.destacado === true),
  }));
  const a = datos.ajustes || {};
  return {
    marca: typeof datos.marca === 'string' ? datos.marca : datos.marca?.nombre || '18gold KPrada',
    precios: {
      nacional: Number(datos.precios?.nacional) || 0,
      italiano: Number(datos.precios?.italiano) || 0,
      actualizado: datos.precios?.actualizado || null,
    },
    ajustes: {
      whatsapp: a.whatsapp || '573178861724',
      instagram: a.instagram || '18GOLDKPRADA',
      tiktok: a.tiktok || '18goldKprada',
      anuncio: a.anuncio || '',
      hechura_gramo: Number(a.hechura_gramo) || 60000,
      envio_valor: Number(String(a.envio_valor ?? 15000).replace(/\./g, '')) || 0,
      envio_gratis_desde: Number(String(a.envio_gratis_desde ?? 0).replace(/\./g, '')) || 0,
    },
    categorias: [...(datos.categorias || [])].sort((x, y) => (x.orden ?? 0) - (y.orden ?? 0)),
    productos,
    origen,
  };
}

function leerSesion() {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION);
    if (!crudo) return null;
    const { t, datos } = JSON.parse(crudo);
    return Date.now() - t < VIDA_SESION ? datos : null;
  } catch {
    return null;
  }
}

function guardarSesion(datos) {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ t: Date.now(), datos }));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

async function cargarMock() {
  const datos = await pedirJSON(ruta('mock/catalogo.json'));
  return normalizar(datos, 'mock');
}

/**
 * Catálogo completo: { marca, precios, ajustes, categorias, productos, origen }.
 * Caché en memoria (por página) + sessionStorage corto. Lanza ErrorApi si no hay datos.
 */
export function obtenerCatalogo() {
  if (enMemoria) return enMemoria;
  enMemoria = (async () => {
    const guardado = leerSesion();
    if (guardado) return guardado;
    let datos = null;
    if (!MODO_MOCK) {
      try {
        datos = normalizar(await pedirJSON(`${API}/api/catalogo`), 'api');
      } catch (e) {
        console.warn('[api] catálogo no disponible, se intenta el mock', e.message);
      }
    }
    if (!datos) {
      try {
        datos = await cargarMock();
      } catch {
        throw new ErrorApi('No se pudo cargar el catálogo');
      }
    }
    guardarSesion(datos);
    return datos;
  })();
  enMemoria.catch(() => {
    enMemoria = null; // permite reintentar
  });
  return enMemoria;
}

function relacionadosLocales(catalogo, producto) {
  const misma = catalogo.productos.filter((p) => p.slug !== producto.slug && p.categoria === producto.categoria);
  const otras = catalogo.productos.filter((p) => p.slug !== producto.slug && p.categoria !== producto.categoria && p.destacado);
  return [...misma, ...otras].slice(0, 4);
}

/** Producto + relacionados. Devuelve null si no existe. */
export async function obtenerProducto(slug) {
  if (!slug) return null;
  if (!MODO_MOCK) {
    try {
      const p = await pedirJSON(`${API}/api/producto/${encodeURIComponent(slug)}`);
      const [norm] = normalizar({ productos: [p] }, 'api').productos;
      norm.relacionados = normalizar({ productos: p.relacionados || [] }, 'api').productos;
      return norm;
    } catch (e) {
      if (String(e.message).includes('404')) return null;
      console.warn('[api] producto no disponible, se busca en el catálogo', e.message);
    }
  }
  const catalogo = await obtenerCatalogo();
  const p = catalogo.productos.find((x) => x.slug === slug);
  if (!p) return null;
  return { ...p, relacionados: relacionadosLocales(catalogo, p) };
}

/** Texto de WhatsApp del pedido (lo usa el mock y el plan B si la API falla). */
export function textoPedidoLocal({ folio, cliente, lineas, subtotal, envio, total, nota }) {
  const filas = lineas.map((l) => `• ${l.cantidad} × ${l.nombre} — ${pesos(l.precio * l.cantidad)}`).join('\n');
  return [
    `Hola, quiero hacer este pedido${folio ? ` (${folio})` : ''}:`,
    '',
    filas,
    '',
    `Subtotal: ${pesos(subtotal)}`,
    `Envío: ${envio ? pesos(envio) : 'gratis'}`,
    `Total: ${pesos(total)}`,
    '',
    `Nombre: ${cliente.nombre}`,
    `WhatsApp: ${cliente.whatsapp}`,
    `Ciudad: ${cliente.ciudad}`,
    cliente.direccion ? `Dirección: ${cliente.direccion}` : '',
    nota ? `Nota: ${nota}` : '',
  ].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n').trim();
}

/**
 * POST /api/pedidos → { ok, folio, total, wa_texto }.
 * `resumen` (líneas con nombre y precio) solo se usa para armar el texto en modo mock.
 */
export async function crearPedido({ cliente, items, nota = '' }, resumen = null) {
  if (MODO_MOCK) {
    const folio = 'KP-' + Date.now().toString(36).slice(-6).toUpperCase();
    const r = resumen || { lineas: [], subtotal: 0, envio: 0, total: 0 };
    return { ok: true, folio, total: r.total, wa_texto: textoPedidoLocal({ folio, cliente, nota, ...r }), mock: true };
  }
  const datos = await pedirJSON(
    `${API}/api/pedidos`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente, items, nota }) },
    15000,
  );
  if (!datos?.ok) throw new ErrorApi(datos?.error || 'No se pudo registrar el pedido');
  return datos;
}
