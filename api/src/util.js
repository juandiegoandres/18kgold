// Utilidades comunes: respuestas JSON, errores, fechas, formato.

export class ErrorHttp extends Error {
  constructor(estado, mensaje, extra = {}) {
    super(mensaje);
    this.estado = estado;
    this.extra = extra;
  }
}

export function json(datos, estado = 200, cabeceras = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cabeceras },
  });
}

/** Lee el cuerpo JSON con límite de tamaño (bytes). */
export async function leerJson(request, limite = 64 * 1024) {
  const largo = Number(request.headers.get('content-length') || 0);
  if (largo > limite) throw new ErrorHttp(413, 'El envío es demasiado grande.');
  const texto = await request.text();
  if (texto.length > limite) throw new ErrorHttp(413, 'El envío es demasiado grande.');
  try {
    const d = JSON.parse(texto || '{}');
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error();
    return d;
  } catch {
    throw new ErrorHttp(400, 'El cuerpo debe ser JSON válido.');
  }
}

export const ahoraIso = () => new Date().toISOString();

export const texto = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

/** $1.234.567 (formato colombiano, sin decimales) */
export function dinero(n) {
  return '$' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Números guardados como "15.000" o "15000" → 15000 */
export function numeroAjuste(v, defecto = 0) {
  if (v === null || v === undefined || v === '') return defecto;
  const n = Number(String(v).replace(/[^\d,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : defecto;
}

export function slugificar(t) {
  const s = String(t || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 120) || 'joya';
}

export function waNormalizar(tel) {
  let t = String(tel || '').replace(/\D+/g, '');
  if (t.length === 10) t = '57' + t; // Colombia
  return t;
}

export function waLink(numero, mensaje = '') {
  return 'https://wa.me/' + waNormalizar(numero) + (mensaje ? '?text=' + encodeURIComponent(mensaje) : '');
}

export const escaparHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const folio = (prefijo, id) => `${prefijo}-${String(id).padStart(6, '0')}`;

export const ipCliente = (request) =>
  request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

/** Base64 (con o sin prefijo dataURL) → Uint8Array */
export function base64ABytes(b64) {
  const limpio = String(b64).replace(/^data:[^;,]+;base64,/, '').replace(/\s+/g, '');
  const bin = atob(limpio);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function bytesABase64(bytes) {
  let bin = '';
  const paso = 0x8000;
  for (let i = 0; i < bytes.length; i += paso) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + paso));
  return btoa(bin);
}

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fecha corta legible para el bot (hora de Colombia). */
export function fechaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return iso;
  return d.toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
