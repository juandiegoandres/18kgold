// Orquestación pura: parámetros → malla + medidas + verificación. La usan el Worker y la prueba de Node.

import { normalizar, diametroInterior, ARGOLLA } from './esquema.js';
import { generarNombre, generarInicial, generarPlaca } from './piezas.js';
import { generarMedalla, generarCruz, generarMotivo } from './clasicas.js';
import { trasladarRelieve } from './relieve.js';
import { extruir, mallaAnillo, volumen, soldar, verificarManifold, contarComponentes, caja3D, normalesRender } from './malla.js';
import { cajaMulti, pulirContorno } from './geometria2d.js';

export const DENSIDAD_ORO_18K = 15.5; // g/cm³

// Caché del contorno 2D: al mover solo el grosor (o el oro / acabado) no se rehace la tipografía,
// las uniones ni el pulido; solo la extrusión.
const cache2D = new Map();
const CLAVES_3D = new Set(['grosor', 'tipo_oro', 'acabado', 'grabado_frente', 'grabado_reverso', 'grabado_fuente']);
function clave2D(tipo, p) {
  return tipo + JSON.stringify(Object.keys(p).sort().filter((k) => !CLAVES_3D.has(k)).map((k) => [k, p[k]]));
}

// `imagenes`: mapas de alturas ya decodificados ({ ancho, alto, datos }) para medallas y Cristo.
export function generar(tipo, parametros, fuentes, imagenes = {}) {
  const p = normalizar(tipo, parametros);
  let geo, render = null, avisos = [], info = {};
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (tipo === 'anillo') {
    geo = mallaAnillo(p);
    const di = diametroInterior(p.talla);
    info = { diametro_interior: di, diametro_exterior: di + 2 * p.grosor };
  } else {
    const k = clave2D(tipo, p);
    let r = cache2D.get(k);
    if (!r) {
      if (tipo === 'nombre') r = generarNombre(p, fuentes);
      else if (tipo === 'inicial') r = generarInicial(p, fuentes);
      else if (tipo === 'medalla') r = generarMedalla(p, fuentes, imagenes);
      else if (tipo === 'cruz') r = generarCruz(p, fuentes, imagenes);
      else if (tipo === 'motivo') r = generarMotivo(p, fuentes);
      else r = generarPlaca(p);
      // Pulido del contorno: rincones redondeados (r 0,2 mm) en uniones y sin dientes ni picos.
      // (Nombres e iniciales ya salen soldados de piezas.js; aquí solo se limpian micro-segmentos.)
      const pulido = tipo === 'placa' || tipo === 'medalla' ? pulirContorno(r.multi, { cierre: 0.35 }) : pulirContorno(r.multi, { cierre: 0 });
      r = { ...r, multi: pulido.length === r.multi.length ? pulido : r.multi };
      cache2D.set(k, r);
      if (cache2D.size > 12) cache2D.delete(cache2D.keys().next().value);
    }
    avisos = [...r.avisos]; info = { ...(r.info || {}) };
    // El texto del grabado no cambia la malla (está fuera de la clave de caché): se toma del parámetro actual.
    if (tipo === 'medalla') info.zonas_grabado = p.reverso === 'grabado' && p.grabado_reverso?.trim()
      ? [{ cara: 'reverso', cx: 0, cy: 0, w: Math.min(p.diametro, p.forma === 'ovalada' ? p.diametro * 1.3 : p.diametro) * 0.62, h: p.diametro * 0.46, texto: p.grabado_reverso, lineas: 4, centrar: true }]
      : [];
    const multi = r.multi;
    const c = cajaMulti(multi);
    // Centro de la silueta en el origen (la argolla queda dentro de la caja).
    const ox = c.x0 + c.ancho / 2, oy = c.y0 + c.alto / 2;
    const mp = multi.map((pol) => pol.map((an) => an.map(([x, y]) => [x - ox, y - oy])));
    const relieves = (r.relieves || []).map((rl) => trasladarRelieve(rl, -ox, -oy));
    ({ geo, render } = extruir(mp, p.grosor, { relieves }));
    // Centros de las argollas (para colgar cadena o tejido), piedras, esmaltes y zonas de grabado, en las
    // mismas coordenadas de la malla.
    info.argollas = (info.argollas || []).map(([x, y]) => [x - ox, y - oy]);
    if (info.piedras) info.piedras = info.piedras.map((q) => ({ ...q, x: q.x - ox, y: q.y - oy }));
    if (info.esmaltes) info.esmaltes = info.esmaltes.map((q) => ({ ...q, x: q.x - ox, y: q.y - oy }));
    if (info.zonas_grabado) info.zonas_grabado = info.zonas_grabado.map((q) => ({ ...q, cx: q.cx - ox, cy: q.cy - oy }));
    info.argolla_ri = ARGOLLA.diametro_interior / 2;
    info.piezas_2d = multi.length;
  }
  const soldada = soldar(geo);
  const vol = volumen(soldada);
  const top = verificarManifold(soldada);
  const componentes = contarComponentes(soldada);
  const caja = caja3D(geo);
  if (!top.manifold) avisos.push('La malla tiene aristas abiertas; Carlos revisará el archivo antes de fundir.');
  if (componentes > 1) avisos.push(`La malla quedó en ${componentes} partes separadas.`);
  const volumen_cm3 = Math.abs(vol) / 1000;
  if (!render) render = normalesRender(geo, p.perfil !== 'facetado' ? 60 : 32);
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return {
    tipo, parametros: p, geo, render,
    volumen_mm3: Math.abs(vol), volumen_cm3,
    peso_g: volumen_cm3 * DENSIDAD_ORO_18K,
    medidas: tipo === 'anillo'
      ? { ancho: p.ancho, alto: caja.y, grosor: p.grosor, diametro_interior: info.diametro_interior }
      : { ancho: caja.x, alto: caja.y, grosor: caja.z },
    verificacion: { ...top, componentes },
    avisos, info, ms: Math.round(t1 - t0),
  };
}
