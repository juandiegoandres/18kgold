// Web Worker: genera la geometría fuera del hilo principal para que la interfaz no se trabe.
// Mensaje de entrada: { id, tipo, parametros, baseFuentes }.
// Respuesta: { id, ok, posicion, normal, volumen_cm3, peso_g, medidas, verificacion, avisos, ms } o { id, ok:false, error }.

import opentype from 'opentype.js';
import { generar } from './generar.js';
import { FUENTES } from './fuentes.js';
import { recursosDe, cargarImagenGris } from './recursos.js';

const cache = new Map();
const imagenes = new Map();

async function cargarFuente(base, clave) {
  if (cache.has(clave)) return cache.get(clave);
  const def = FUENTES[clave];
  const p = fetch(new URL(def.archivo, base))
    .then((r) => { if (!r.ok) throw new Error(`No se pudo cargar la fuente ${def.nombre}`); return r.arrayBuffer(); })
    .then((b) => opentype.parse(b));
  cache.set(clave, p);
  try { return await p; } catch (e) { cache.delete(clave); throw e; }
}

function imagen(base, nombre) {
  if (!imagenes.has(nombre)) {
    const p = cargarImagenGris(new URL(`../relieves/${nombre}.png`, base).href);
    imagenes.set(nombre, p);
    p.catch(() => imagenes.delete(nombre));
  }
  return imagenes.get(nombre);
}
self.onmessage = async (e) => {
  const { id, tipo, parametros, baseFuentes } = e.data;
  try {
    const fuentes = {}, imgs = {};
    const rec = recursosDe(tipo, parametros);
    await Promise.all([
      ...rec.fuentes.map(async (k) => { fuentes[k] = await cargarFuente(baseFuentes, k); }),
      ...rec.imgs.map(async (k) => { try { imgs[k] = await imagen(baseFuentes, k); } catch { /* sin relieve: aviso */ } }),
    ]);
    const r = generar(tipo, parametros, fuentes, imgs);
    const posicion = r.render.attributes.position.array;
    const normal = r.render.attributes.normal.array;
    self.postMessage({
      id, ok: true, tipo, parametros: r.parametros,
      posicion, normal,
      volumen_cm3: r.volumen_cm3, peso_g: r.peso_g, medidas: r.medidas,
      verificacion: r.verificacion, avisos: r.avisos, info: r.info, ms: r.ms,
    }, [posicion.buffer, normal.buffer]);
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message || err) });
  }
};
