// Códigos de cliente KP-XXXXX y límite de peticiones por IP.
import { json, leerJson, texto, ahoraIso, ErrorHttp, ipCliente } from './util.js';

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const FORMATO_CODIGO = /^KP-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;

export const normalizarCodigo = (c) => String(c || '').trim().toUpperCase().replace(/\s+/g, '');

function codigoAleatorio() {
  const b = crypto.getRandomValues(new Uint8Array(5));
  // 256 no es múltiplo de 31: el sesgo es mínimo y aceptable para esto
  return 'KP-' + Array.from(b, (x) => ALFABETO[x % ALFABETO.length]).join('');
}

/**
 * Ventana fija por IP guardada en D1. Devuelve true si se permite.
 * max peticiones cada `segundos`.
 */
export async function limitar(env, uso, ip, max, segundos) {
  const clave = `${uso}:${ip}`;
  const ahora = Math.floor(Date.now() / 1000);
  const fila = await env.DB.prepare(
    `INSERT INTO limites (clave, inicio, conteo) VALUES (?1, ?2, 1)
     ON CONFLICT(clave) DO UPDATE SET
       conteo = CASE WHEN limites.inicio <= ?2 - ?3 THEN 1 ELSE limites.conteo + 1 END,
       inicio = CASE WHEN limites.inicio <= ?2 - ?3 THEN ?2 ELSE limites.inicio END
     RETURNING conteo`
  ).bind(clave, ahora, segundos).first();
  // limpieza ocasional de ventanas viejas
  if (Math.random() < 0.02) env.DB.prepare('DELETE FROM limites WHERE inicio < ?').bind(ahora - 86400).run().catch(() => {});
  return (fila?.conteo ?? 0) <= max;
}

export async function exigirLimite(request, env, uso, max, segundos) {
  if (!(await limitar(env, uso, ipCliente(request), max, segundos))) {
    throw new ErrorHttp(429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
  }
}

/** Devuelve la fila del código si está vigente (sin consumir cupo), o lanza error. */
export async function codigoVigente(env, codigo) {
  codigo = normalizarCodigo(codigo);
  if (!FORMATO_CODIGO.test(codigo)) throw new ErrorHttp(400, 'El código no tiene el formato KP-XXXXX.', { codigo_invalido: true });
  const f = await env.DB.prepare('SELECT * FROM codigos WHERE codigo = ?').bind(codigo).first();
  if (!f || f.anulado) throw new ErrorHttp(404, 'Ese código no existe o fue anulado. Pídele uno nuevo a Carlos.', { codigo_invalido: true });
  if (f.expira <= ahoraIso()) throw new ErrorHttp(410, 'Ese código ya venció. Pídele uno nuevo a Carlos.', { codigo_invalido: true });
  return f;
}

/** Consume un cupo de forma atómica. Devuelve la fila actualizada o lanza error. */
export async function consumirCupo(env, codigo) {
  const f = await codigoVigente(env, codigo);
  const r = await env.DB.prepare(
    'UPDATE codigos SET usados = usados + 1 WHERE id = ? AND anulado = 0 AND usados < max_disenos AND expira > ? RETURNING *'
  ).bind(f.id, ahoraIso()).first();
  if (!r) throw new ErrorHttp(409, 'Ya usaste todos los envíos de este código. Escríbele a Carlos para ampliarlo.');
  return r;
}

export async function devolverCupo(env, id) {
  await env.DB.prepare('UPDATE codigos SET usados = MAX(0, usados - 1) WHERE id = ?').bind(id).run();
}

export async function crearCodigo(env, cliente, dias = 15, maxDisenos = 5, creadoPor = '') {
  const expira = new Date(Date.now() + dias * 86400000).toISOString();
  for (let i = 0; i < 6; i++) {
    const codigo = codigoAleatorio();
    const r = await env.DB.prepare(
      'INSERT INTO codigos (codigo, cliente, max_disenos, expira, creado_por, creado) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(codigo) DO NOTHING RETURNING *'
    ).bind(codigo, cliente, maxDisenos, expira, String(creadoPor), ahoraIso()).first();
    if (r) return r;
  }
  throw new Error('No se pudo generar un código único.');
}

// POST /api/codigo
export async function postCodigo(request, env) {
  await exigirLimite(request, env, 'codigo', 10, 600); // 10 intentos cada 10 min por IP
  const d = await leerJson(request, 2048);
  try {
    const f = await codigoVigente(env, texto(d.codigo, 20));
    return json({ ok: true, cliente: f.cliente, expira: f.expira, restantes: Math.max(0, f.max_disenos - f.usados) });
  } catch (e) {
    if (e instanceof ErrorHttp) return json({ ok: false, error: e.message }, e.estado);
    throw e;
  }
}
