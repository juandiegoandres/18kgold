// 18gold KPrada — Worker: router mínimo + CORS.
import { json, ErrorHttp } from './util.js';
import { getCatalogo, getProducto } from './catalogo.js';
import { postCodigo } from './codigos.js';
import { postDiseno } from './disenos.js';
import { postPedido } from './pedidos.js';
import { servirImagen } from './r2.js';
import { webhookTelegram } from './bot.js';

const RUTAS = [
  ['GET', /^\/api\/catalogo\/?$/, getCatalogo],
  ['GET', /^\/api\/producto\/([\w-]+)\/?$/, (r, e, c, slug) => getProducto(r, e, slug)],
  ['POST', /^\/api\/codigo\/?$/, postCodigo],
  ['POST', /^\/api\/disenos\/?$/, postDiseno],
  ['POST', /^\/api\/pedidos\/?$/, postPedido],
  ['GET', /^\/img\/(.+)$/, (r, e, c, clave) => servirImagen(r, e, clave)],
  ['POST', /^\/telegram\/([\w-]+)$/, (r, e, c, ruta) => webhookTelegram(r, e, c, ruta)],
];

function cabecerasCors(request, env) {
  const origen = request.headers.get('origin');
  const permitidos = String(env.ORIGENES || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origen || !permitidos.includes(origen)) return {};
  return {
    'access-control-allow-origin': origen,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

async function enrutar(request, env, ctx) {
  const { pathname } = new URL(request.url);
  const metodo = request.method === 'HEAD' ? 'GET' : request.method;
  let rutaExiste = false;
  for (const [m, rx, fn] of RUTAS) {
    const k = pathname.match(rx);
    if (!k) continue;
    rutaExiste = true;
    if (m === metodo) return fn(request, env, ctx, ...k.slice(1));
  }
  return rutaExiste ? json({ ok: false, error: 'Método no permitido.' }, 405) : json({ ok: false, error: 'No encontrado.' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const cors = cabecerasCors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let resp;
    try {
      resp = await enrutar(request, env, ctx);
    } catch (e) {
      if (e instanceof ErrorHttp) resp = json({ ok: false, error: e.message, ...e.extra }, e.estado);
      else {
        console.log('[api] error', e.stack || e.message);
        resp = json({ ok: false, error: 'Algo falló de nuestro lado. Intenta de nuevo en un momento.' }, 500);
      }
    }
    // Las respuestas de R2 pueden traer cabeceras inmutables: se copian.
    const r = new Response(resp.body, resp);
    for (const [k, v] of Object.entries(cors)) r.headers.set(k, v);
    return r;
  },
};
