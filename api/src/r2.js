// Acceso a R2: guardar y servir archivos.
import { json } from './util.js';

const TIPOS = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  stl: 'model/stl',
};

export const tipoPorClave = (clave) => TIPOS[clave.split('.').pop().toLowerCase()] || 'application/octet-stream';

export async function guardar(env, clave, datos, tipo) {
  await env.ARCHIVOS.put(clave, datos, { httpMetadata: { contentType: tipo || tipoPorClave(clave) } });
  return clave;
}

export async function borrar(env, claves) {
  const lista = (Array.isArray(claves) ? claves : [claves]).filter(Boolean);
  if (lista.length) await env.ARCHIVOS.delete(lista);
}

/**
 * GET /img/:clave+ — solo se sirven fotos de productos y vistas PNG de diseños.
 * Los STL NUNCA se sirven (le llegan a Carlos por Telegram). Las vistas solo con su sufijo
 * aleatorio (disenos/D-000123-<16 hex>.png): el folio secuencial no basta para adivinarlas.
 */
export async function servirImagen(request, env, clave) {
  clave = decodeURIComponent(clave);
  const permitido = /^productos\/[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(clave) || /^disenos\/D-\d{6}-[0-9a-f]{16}\.png$/.test(clave);
  if (!permitido || clave.includes('..')) return json({ ok: false, error: 'No encontrado.' }, 404);

  const obj = await env.ARCHIVOS.get(clave, { onlyIf: request.headers });
  if (!obj) return json({ ok: false, error: 'No encontrado.' }, 404);

  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('etag', obj.httpEtag);
  h.set('cache-control', 'public, max-age=31536000, immutable');
  if (!h.get('content-type')) h.set('content-type', tipoPorClave(clave));
  // onlyIf: si el navegador ya la tiene, R2 devuelve el objeto sin cuerpo
  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers: h });
  return new Response(obj.body, { headers: h });
}
