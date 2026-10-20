// Generadores 2D de cada tipo de pieza plana (nombre, inicial, placa).
// Devuelven { multi, avisos, info } con el contorno final en mm (una sola pieza).

import {
  unir, restar, intersecar, cajaMulti, transformarMulti, textoAMulti, engrosar, conectar,
  circulo, elipse, rectRedondeado, corazon, estrella, corona, mariposa, argolla,
  extremoEnFranjaH, techoEnFranjaV, areaAnillo, trazo, cierre, resisteErosion, desplazar,
} from './geometria2d.js';
import { FUENTES } from './fuentes.js';

import { ARGOLLA as ARG } from './esquema.js';
export const ARGOLLA = { dInt: ARG.diametro_interior, pared: ARG.pared };
const ANCHO_PUENTE = 0.9;
const TAM_REF = 100; // tamaño de trabajo del texto antes de escalar a mm

function textoEscalado(fuente, clave, texto, alto) {
  const def = FUENTES[clave];
  const glifos = textoAMulti(fuente, texto, TAM_REF, { variacion: def.variacion, espaciado: def.espaciado * TAM_REF });
  if (!glifos.length) return { glifos: [], s: 1 };
  // Caja del conjunto sin unir (la unión aquí solo servía para medir).
  const c = cajaMulti(glifos.flat());
  const s = alto / (c.alto || 1);
  // Centramos en x; la línea base queda en y = 0.
  const dx = -(c.x0 + c.ancho / 2) * s;
  return { glifos: glifos.map((g) => transformarMulti(g, { s, dx })), s, caja: c };
}

function islas(mp) {
  return mp.filter((p) => Math.abs(areaAnillo(p[0])) >= 0.05).length;
}

// Coloca argollas pegadas al material: devuelve { anillos: [multi], huecos: [multi] }.
export function ubicarArgollas(mp, posiciones) {
  const { dInt, pared } = ARGOLLA;
  const ri = dInt / 2;
  const caja = cajaMulti(mp);
  const anillos = [], huecos = [], centros = [];
  const solape = 0.18; // cuánto se mete el agujero respecto al borde (pared efectiva de unión ≈ pared − solape)
  for (const pos of posiciones) {
    let cx, cy;
    if (pos === 'arriba_izq' || pos === 'arriba_der') {
      // Sobre el punto más alto de cada mitad (las puntas de una herradura).
      let mejor = null;
      const xa = pos === 'arriba_izq' ? caja.x0 : caja.x0 + caja.ancho / 2, xb = pos === 'arriba_izq' ? caja.x0 + caja.ancho / 2 : caja.x1;
      for (let x = xa + 0.4; x <= xb - 0.4; x += 0.25) {
        const t = techoEnFranjaV(mp, x, 0.35);
        if (t !== null && (!mejor || t > mejor.t + 0.02)) mejor = { x, t };
      }
      cx = mejor ? mejor.x : (xa + xb) / 2;
      cy = (mejor ? mejor.t : caja.y1) + ri + solape;
    } else if (pos === 'izquierda' || pos === 'derecha') {
      const lado = pos === 'izquierda' ? 'izq' : 'der';
      // Buscamos la altura donde la pieza llega más lejos hacia ese lado (el extremo real),
      // prefiriendo la mitad superior en caso de empate, para que la argolla quede en la punta.
      let x = null;
      const bandas = [0.45, 0.36, 0.55, 0.28, 0.62, 0.2, 0.7];  // media-baja: lejos de tildes y puntos
      const h = Math.max(0.6, caja.alto * 0.06);
      for (const f of bandas) {
        const y = caja.y0 + caja.alto * f;
        const xx = extremoEnFranjaH(mp, y, h, lado);
        if (xx === null) continue;
        const mejor = x === null || (lado === 'izq' ? xx < x - 0.4 : xx > x + 0.4);
        if (mejor) { x = xx; cy = y; }
      }
      if (x === null) { x = lado === 'izq' ? caja.x0 : caja.x1; cy = caja.y0 + caja.alto / 2; }
      cx = lado === 'izq' ? x - ri - solape : x + ri + solape;
    } else {
      // centro / arriba: sobre el techo de la pieza en el centro (o donde haya material).
      // Centro: si cae en un hueco (p. ej. el espacio entre dos palabras), buscamos la columna
      // con material más cercana al centro para que la argolla se apoye encima.
      const x0c = caja.x0 + caja.ancho / 2;
      let techo = null, xc = x0c;
      // Solo columnas cuyo techo esté cerca del tope de la pieza (astas, mayúsculas): si se apoya
      // sobre una minúscula, la argolla queda montada encima de las letras vecinas.
      for (let k = 0; k <= 80 && techo === null; k++) {
        for (const sgn of k ? [1, -1] : [1]) {
          const x = x0c + sgn * k * 0.5;
          const t = techoEnFranjaV(mp, x, 0.6);
          if (t !== null && t > caja.y0 + caja.alto * 0.82) { techo = t; xc = x; break; }
        }
      }
      cx = xc;
      cy = (techo ?? caja.y1) + ri + solape;
    }
    const a = argolla(cx, cy, dInt, pared);
    anillos.push(a.anillo);
    huecos.push(a.hueco);
    centros.push([cx, cy]);
  }
  return { anillos, huecos, centros };
}

// Une las argollas y suelda cada unión con un cierre LOCAL (rincón redondeado de 0,25 mm), sin
// reprocesar el resto de la pieza.
export function terminar(mp, argollas, avisos) {
  let m = unir(mp, ...argollas.anillos);
  const soldaduras = argollas.anillos.map((an) => {
    const c = cajaMulti(an), pad = 1.2;
    const caja = [[[[c.x0 - pad, c.y0 - pad], [c.x1 + pad, c.y0 - pad], [c.x1 + pad, c.y1 + pad], [c.x0 - pad, c.y1 + pad]]]];
    const zona = intersecar(m, caja);
    // Solo dentro de la caja (el cierre no debe crecer fuera de ella).
    return intersecar(cierre(zona, 0.25), caja);
  });
  m = unir(m, ...soldaduras);
  m = restar(m, ...argollas.huecos);
  const r = conectar(m, ANCHO_PUENTE);
  if (r.puentes) {
    avisos.push('La argolla no tocaba la pieza: se añadió un puente.');
    m = restar(r.multi, ...argollas.huecos);
  } else m = r.multi;
  return m;
}

// ---------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------
// Uniones de letras «como las hace el joyero»: las letras se tocan (tracking negativo por fuente +
// kerning real), lo que queda a menos de 2r se suelda con un cierre morfológico (uniones curvas,
// no palitos), los puntos y tildes bajan hasta tocar su letra (o se vuelven un corazón o un
// diamante), y las palabras se enlazan con un trazo curvo tipo script que nace del trazo final.
// ---------------------------------------------------------------------------------------------

// Separa en cada glifo el cuerpo de las «marcas» (punto de la i, tildes): piezas chicas por encima.
function separarMarcas(glifo) {
  if (glifo.length < 2) return { cuerpo: glifo, marcas: [] };
  const ord = [...glifo].sort((a, b) => Math.abs(areaAnillo(b[0])) - Math.abs(areaAnillo(a[0])));
  const mayor = ord[0];
  const am = Math.abs(areaAnillo(mayor[0]));
  const cm = cajaMulti([mayor]);
  const cuerpo = [mayor], marcas = [];
  for (const pol of ord.slice(1)) {
    const c = cajaMulti([pol]);
    // (La tilde de Damion mide ~40 % de su «ı»: con el umbral anterior de 30 % no se reconocía como
    // tilde y el cierre la fundía con el palo: «María» se leía «Marla».)
    const chica = Math.abs(areaAnillo(pol[0])) < am * 0.65;
    const arriba = c.y0 > cm.y0 + cm.alto * 0.5;
    (chica && arriba ? marcas : cuerpo).push(pol);
  }
  return { cuerpo, marcas };
}

function diamante(cx, cy, w, h) {
  return [[[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]]];
}

// Lleva la marca (punto, tilde) hasta su propia letra bajándola EN VERTICAL hasta el primer contacto con
// el techo de SU letra (nunca hacia la vecina ni hacia el trazo de salida: en una «í» de Dancing Script
// el punto más cercano era la salida hacia la «a», y la tilde caída allí se leía como una «u»).
// El contacto es corto (un «cuello» de ≥ 0,5 mm), para que la tilde siga leyéndose como tilde.
function apoyarMarca(marca, cuerpo, { inclinar = false } = {}) {
  if (inclinar) marca = acostarTilde(marca);
  const cm = cajaMulti(marca);
  let caida = null;
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const x = cm.x0 + (cm.ancho * i) / n;
    const fondo = pisoEnFranjaV(marca, x, 0.06);
    if (fondo === null) continue;
    const techo = techoBajo(cuerpo, x, 0.06, fondo + 0.01);
    if (techo === null) continue;
    const g = fondo - techo;
    if (caida === null || g < caida) caida = g;
  }
  if (caida === null) return { marca, ok: false };
  // Se mete lo justo para que el cuello mida al menos 0,5 mm de ancho.
  let puesta = marca;
  for (let solape = 0.06; solape <= 0.7; solape += 0.06) {
    puesta = transformarMulti(marca, { dy: -(caida + solape) });
    const toque = intersecar(puesta, cuerpo);
    if (toque.length) {
      const c = cajaMulti(toque);
      if (Math.max(c.ancho, c.alto) >= 0.5 && Math.min(c.ancho, c.alto) >= 0.12) break;
    }
  }
  return { marca: puesta, ok: true };
}
// Una tilde aguda casi paralela al palo de la «i» (Damion) se confunde con una «l» al soldarla. Se acuesta
// a ~38° y se acorta un poco: sigue leyéndose como tilde aunque toque la letra.
function acostarTilde(marca) {
  const pts = marca.flatMap((pol) => pol[0]);
  if (pts.length < 6) return marca;
  let mx = 0, my = 0;
  for (const [x, y] of pts) { mx += x; my += y; }
  mx /= pts.length; my /= pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);           // eje principal
  const l1 = (sxx + syy) / 2 + Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2);
  const l2 = (sxx + syy) / 2 - Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2);
  if (l2 <= 0 || Math.sqrt(l1 / l2) < 2.2) return marca;        // punto o tilde corta: se deja
  const a = ((ang % Math.PI) + Math.PI) % Math.PI;               // 0..π
  if (a < 0.2 || a > Math.PI - 0.2) return marca;                // ya es horizontal (˜, ¨)
  const objetivo = a < Math.PI / 2 ? 0.66 : Math.PI - 0.66;     // ~38° (aguda) o ~142° (grave)
  if (Math.abs(a - objetivo) < 0.12) return marca;
  const centro = transformarMulti(marca, { dx: -mx, dy: -my });
  return transformarMulti(centro, { s: 0.88, rot: objetivo - a, dx: mx, dy: my });
}

// y más baja / más alta (por debajo de `tope`) del material en la franja vertical [x−w, x+w].
function pisoEnFranjaV(mp, x, w) {
  const r = intersecar(mp, [[[[x - w, -1e3], [x + w, -1e3], [x + w, 1e3], [x - w, 1e3]]]]);
  return r.length ? cajaMulti(r).y0 : null;
}
function techoBajo(mp, x, w, tope) {
  const r = intersecar(mp, [[[[x - w, -1e3], [x + w, -1e3], [x + w, tope], [x - w, tope]]]]);
  return r.length ? cajaMulti(r).y1 : null;
}

// Contraformas (huecos de a, o, e, d…) que deben sobrevivir: las de al menos ~0,35 mm de ancho.
function contraformas(mp) {
  const huecos = [];
  for (const pol of mp) for (let i = 1; i < pol.length; i++) {
    const h = [[pol[i].slice().reverse()]];
    if (Math.abs(areaAnillo(pol[i])) < 0.08) continue;
    if (!desplazar(h, -0.17).length) continue;
    huecos.push(h);
  }
  return huecos;
}

// Enlace curvo entre dos islas vecinas (izquierda → derecha), a ras de la línea base.
function enlaceScript(izq, der, alto, ancho) {
  const ci = cajaMulti(izq), cd = cajaMulti(der);
  const franja = alto * 0.42;
  // Punto de salida: el más a la derecha de la isla izquierda en la franja baja; llegada: el más a la izquierda.
  const xa = extremoEnFranjaH(izq, ci.y0 + franja / 2, franja / 2, 'der') ?? ci.x1;
  const xb = extremoEnFranjaH(der, cd.y0 + franja / 2, franja / 2, 'izq') ?? cd.x0;
  const ya = baseEn(izq, xa, ci.y0, franja), yb = baseEn(der, xb, cd.y0, franja);
  const gap = Math.max(0.4, xb - xa);
  const A = [xa - ancho * 0.9, ya + ancho * 0.25], B = [xb + ancho * 0.9, yb + ancho * 0.25];
  // Curva suave en «sonrisa» que baja un poco entre las palabras (como el remate de una cursiva).
  const C = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - Math.min(alto * 0.12, gap * 0.22)];
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    pts.push([u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]);
  }
  return trazo(pts, ancho);
}
function baseEn(mp, x, y0, franja) {
  // y más baja del material cerca de x (dentro de la franja baja).
  const c = cajaMulti(mp);
  const inter = intersecar(mp, [[[[x - 0.8, y0 - 1], [x + 0.8, y0 - 1], [x + 0.8, y0 + franja], [x - 0.8, y0 + franja]]]]);
  if (!inter.length) return c.y0 + 0.4;
  return cajaMulti(inter).y0 + 0.35;
}

// Une todas las islas: cada isla con su vecina de la derecha, con enlace script; todos los enlaces se
// sueldan de una vez (un solo cierre para toda la pieza). Lo que aún quede suelto, por cercanía.
function enlazarIslas(mp, alto, ancho, radioCierre) {
  let m = mp.filter((p) => Math.abs(areaAnillo(p[0])) >= 0.05);
  if (m.length <= 1) return { multi: m, enlaces: 0 };
  const islas = m.map((pol) => ({ pol: [pol], c: cajaMulti([pol]) })).sort((a, b) => (a.c.x0 + a.c.x1) - (b.c.x0 + b.c.x1));
  const puentes = [];
  for (let i = 0; i < islas.length - 1; i++) {
    const a = islas[i], b = islas[i + 1];
    const solapeY = Math.min(a.c.y1, b.c.y1) - Math.max(a.c.y0, b.c.y0);
    if (solapeY > 0 && b.c.x0 - a.c.x1 > -alto * 0.3) puentes.push(enlaceScript(a.pol, b.pol, alto, ancho));
  }
  let enlaces = puentes.length;
  if (puentes.length) m = cierre(unir(m, ...puentes), radioCierre).filter((p) => Math.abs(areaAnillo(p[0])) >= 0.05);
  if (m.length > 1) {
    const r = conectar(m, ancho);
    m = cierre(r.multi, radioCierre);
    enlaces += r.puentes;
  }
  return { multi: m, enlaces };
}

export function generarNombre(p, fuentes, { sinArgolla = false } = {}) {
  const avisos = [];
  const fuente = fuentes[p.fuente];
  const def = FUENTES[p.fuente];
  const texto = p.texto.trim().replace(/\s+/g, ' ');
  const { glifos } = textoEscalado(fuente, p.fuente, texto, p.alto);
  // Escala de las uniones según el tamaño de la letra.
  // El radio de soldadura escala con la letra: en un nombre de 8 mm, un radio pensado para 12 mm
  // empastaba las letras chicas (la «a» se cerraba, la tilde se volvía parte del trazo).
  const k = p.alto / 12;
  const rUnion = (def.union ?? 0.3) * Math.max(0.6, Math.min(1.4, k));

  // 1. Puntos y tildes: bajan hasta tocar su letra, o se cambian por un adorno.
  const cuerpos = [], marcas = [];
  for (const g of glifos) {
    const { cuerpo, marcas: mk } = separarMarcas(g);
    cuerpos.push(cuerpo);
    for (const mm of mk) marcas.push({ marca: [mm], cuerpo });
  }
  let letras = unir(...cuerpos);
  const extras = [];
  const rMarca = Math.min(0.12, rUnion * 0.35);
  for (const { marca, cuerpo } of marcas) {
    let mk = marca;
    if (p.puntos !== 'unir') {
      const c = cajaMulti(marca);
      const t = Math.max(1.5, Math.max(c.ancho, c.alto) * 1.35, p.alto * 0.13);
      mk = p.puntos === 'corazon' ? [[corazon(c.x0 + c.ancho / 2, c.y0 + t * 0.45, t, t * 0.92)]] : diamante(c.x0 + c.ancho / 2, c.y0 + t * 0.6, t * 0.82, t * 1.2);
    }
    if (def.refuerzo) mk = engrosar(mk, def.refuerzo);
    const base = cuerpo.length ? desplazar(cuerpo, def.refuerzo || 0) : letras;
    const { marca: puesta, ok } = apoyarMarca(mk, base, { inclinar: p.puntos === 'unir' && def.cursiva });
    if (!ok) continue; // sin letra debajo: se omite (nunca una tilde suelta)
    // Soldadura local (marca + su letra): barata y no toca el resto del nombre.
    extras.push(cierre(unir(puesta, base), rMarca));
  }
  // 2. Engrosado de trazo + soldadura orgánica de lo que casi se toca, en dos desplazamientos:
  //    +(refuerzo + r) y luego −r (equivale a engrosar y después cerrar). Las marcas se sueldan
  //    aparte con un cierre chico, para que la tilde siga leyéndose como tilde.
  const contra = contraformas(def.refuerzo ? desplazar(letras, def.refuerzo) : letras);
  letras = desplazar(desplazar(letras, (def.refuerzo || 0) + rUnion), -rUnion);
  if (contra.length) letras = restar(letras, ...contra);
  if (extras.length) letras = unir(letras, ...extras);
  const islasLetras = islas(letras);

  let m = letras;
  let caja = cajaMulti(m);

  // Letras de molde (serif, bloque): no se tocan entre sí. En vez de enlaces curvos bajo cada letra (se
  // veían forzados) van sobre un riel recto y fino a ras de la línea base, como en las placas de nombre.
  if (!def.cursiva && p.base === 'ninguna' && islasLetras > 1) {
    const g = Math.max(0.8, p.alto * 0.065);
    const x0 = caja.x0 + p.alto * 0.04, x1 = caja.x1 - p.alto * 0.04;
    m = unir(m, [[rectRedondeado((x0 + x1) / 2, 0.28 - g / 2, x1 - x0, g, g / 2, 8)]]);
    m = cierre(m, Math.min(0.2, rUnion * 0.6));
    if (contra.length) m = restar(m, ...contra);
    caja = cajaMulti(m);
    avisos.push('Las letras van sobre un riel recto y fino que las une en una sola pieza.');
  }

  // Base (línea bajo el nombre, atraviesa el pie de las letras): también une las palabras.
  if (p.base !== 'ninguna') {
    const g = Math.max(0.85, p.alto * 0.07);
    const x0 = caja.x0 + p.alto * 0.12, x1 = caja.x1 - p.alto * 0.08;
    const linea = (y, gg) => [[rectRedondeado((x0 + x1) / 2, y, x1 - x0, gg, gg / 2, 8)]];
    const y1 = -g * 0.35;
    const partes = [linea(y1, g)];
    if (p.base === 'doble') {
      const g2 = Math.max(0.8, g * 0.8);
      const y2 = y1 - g / 2 - 0.7 - g2 / 2;
      partes.push(linea(y2, g2));
      const rr = (g / 2 + 0.7 + g2 / 2) / 2 + 0.45;
      partes.push([[circulo(x0, (y1 + y2) / 2, rr)]], [[circulo(x1, (y1 + y2) / 2, rr)]]);
    }
    m = cierre(unir(m, ...partes), rUnion * 0.8);
    if (contra.length) m = restar(m, ...contra);
    caja = cajaMulti(m);
  }

  // Adorno.
  if (p.adorno !== 'ninguno') {
    const a = p.alto;
    let fig;
    if (p.adorno === 'corona') {
      const primero = cajaMulti(glifos[0] || m);
      const w = Math.min(a * 0.55, Math.max(a * 0.38, primero.ancho * 0.9));
      const h = w * 0.62;
      fig = corona(primero.x0 + primero.ancho * 0.55, primero.y1 - h * 0.22, w, h);
    } else {
      const ultimo = cajaMulti(glifos[glifos.length - 1] || m);
      const yc = Math.max(caja.y0, 0) + a * 0.38;
      if (p.adorno === 'corazon') {
        const w = a * 0.5;
        fig = [[corazon(ultimo.x1 + w * 0.36, yc, w, w * 0.9)]];
      } else if (p.adorno === 'estrella') {
        const r = a * 0.3;
        fig = [[estrella(ultimo.x1 + r * 0.62, yc + a * 0.05, r, 5, 0.48)]];
      } else {
        const w = a * 0.62;
        fig = transformarMulti(mariposa(0, 0, w), { rot: -0.25, dx: ultimo.x1 + w * 0.38, dy: yc + a * 0.08 });
      }
    }
    m = cierre(unir(m, fig), rUnion);
    if (contra.length) m = restar(m, ...contra);
    caja = cajaMulti(m);
  }

  // 3. Lo que siga separado (palabras, letras sueltas): enlace curvo tipo script, nunca un palito.
  const anchoEnlace = Math.max(0.8, p.alto * 0.075);
  const en = enlazarIslas(m, p.alto, anchoEnlace, rUnion);
  m = en.multi;
  if (en.enlaces && contra.length) m = restar(m, ...contra);
  if (en.enlaces) avisos.push(en.enlaces === 1 ? 'Las palabras se unen con un trazo curvo a ras de la base.' : `Se añadieron ${en.enlaces} trazos curvos de enlace para que el nombre quede en una sola pieza.`);

  // 4. Trazo mínimo para fundir (≥ 0,5 mm): si al erosionar 0,25 mm la pieza se parte, engrosamos.
  let extra = 0;
  while (!resisteErosion(m, 0.25) && extra < 0.18) { m = engrosar(m, 0.06); extra += 0.06; }
  if (extra) avisos.push(`Se engrosó el trazo ${String(extra.toFixed(2)).replace('.', ',')} mm para que la parte más delgada mida al menos 0,5 mm.`);
  if (!resisteErosion(m, 0.25)) avisos.push('Hay un tramo de menos de 0,5 mm de grosor: sube el alto o elige otra letra para fundirlo con seguridad.');

  if (sinArgolla) return { multi: m, avisos, info: { islas_iniciales: islasLetras, enlaces: en.enlaces } };
  const sinPuentes = m;
  const pos = p.argolla === 'dos' ? ['izquierda', 'derecha'] : [p.argolla];
  const arg = ubicarArgollas(sinPuentes, pos);
  m = terminar(m, arg, avisos);
  return { multi: m, avisos, info: { islas_iniciales: islasLetras, enlaces: en.enlaces, engrosado_extra: extra, argollas: arg.centros } };
}

export function generarInicial(p, fuentes) {
  const avisos = [];
  const fuente = fuentes[p.fuente];
  const def = FUENTES[p.fuente];
  const pared = 1.0;
  let m;
  if (p.marco === 'ninguno') {
    const { glifos } = textoEscalado(fuente, p.fuente, p.letra, p.alto);
    m = unir(...glifos);
    if (def.refuerzo) m = engrosar(m, def.refuerzo * 1.1);
  } else {
    const H = p.alto;
    let exterior, interior, altoLetra;
    if (p.marco === 'circulo') {
      exterior = [[circulo(0, 0, H / 2)]];
      interior = [[circulo(0, 0, H / 2 - pared)]];
      altoLetra = H * 0.7;
    } else if (p.marco === 'ovalo') {
      const rx = H * 0.39;
      exterior = [[elipse(0, 0, rx, H / 2, 140)]];
      interior = [[elipse(0, 0, rx - pared, H / 2 - pared, 140)]];
      altoLetra = H * 0.68;
    } else {
      const W = H * 1.08;
      exterior = [[corazon(0, 0, W, H)]];
      interior = [[corazon(0, pared * 0.35, W - pared * 2.6, H - pared * 2.6)]];
      altoLetra = H * 0.56;
    }
    const marco = restar(exterior, interior);
    let { glifos } = textoEscalado(fuente, p.fuente, p.letra, altoLetra);
    let letra = unir(...glifos);
    if (def.refuerzo) letra = engrosar(letra, def.refuerzo * 1.1);
    // Centramos la letra en el hueco del marco.
    const cl = cajaMulti(letra), ci = cajaMulti(interior);
    const cx = ci.x0 + ci.ancho / 2, cy = ci.y0 + ci.alto / 2 - (p.marco === 'corazon' ? H * 0.04 : 0);
    letra = transformarMulti(letra, { dx: -(cl.x0 + cl.ancho / 2), dy: -(cl.y0 + cl.alto / 2) });
    // Como en el taller: la letra crece hasta apoyarse en el marco (se suelda, sin puentes).
    let colocada = null;
    for (let esc = 1; esc <= 1.45 && !colocada; esc += 0.04) {
      const prueba = transformarMulti(letra, { s: esc, dx: cx, dy: cy });
      const toque = intersecar(prueba, marco);
      if (toque.length && toque.reduce((a, q) => a + Math.abs(areaAnillo(q[0])), 0) > 0.12) colocada = prueba;
    }
    letra = colocada || transformarMulti(letra, { dx: cx, dy: cy });
    // La letra se recorta al contorno exterior para que nada sobresalga.
    letra = intersecar(letra, exterior);
    m = cierre(unir(marco, letra), 0.3);
  }
  if (p.marco === 'ninguno') m = cierre(m, (def.union ?? 0.3));
  // Lo que aún quede suelto se enlaza con un trazo curvo corto (nunca un palito recto).
  const en = enlazarIslas(m, p.alto, Math.max(0.8, p.alto * 0.06), 0.3);
  m = en.multi;
  const con = { puentes: en.enlaces };
  if (con.puentes) avisos.push(`La letra no tocaba ${p.marco === 'ninguno' ? 'sus partes' : 'el marco'}: se añadió un enlace curvo.`);
  const arg = ubicarArgollas(m, ['centro']);
  m = terminar(m, arg, avisos);
  return { multi: m, avisos, info: { puentes: con.puentes, argollas: arg.centros } };
}

export function generarPlaca(p) {
  const avisos = [];
  const w = p.ancho;
  let h = p.alto;
  let contorno;
  switch (p.forma) {
    case 'rectangular': contorno = [[rectRedondeado(0, 0, w, h, Math.min(1.4, w * 0.08), 8)]]; break;
    case 'militar': contorno = [[rectRedondeado(0, 0, w, h, Math.min(w, h) * 0.3, 16)]]; break;
    case 'ovalada': contorno = [[elipse(0, 0, w / 2, h / 2, 160)]]; break;
    case 'circulo': h = w; contorno = [[circulo(0, 0, w / 2)]]; avisos.push('En la placa circular el alto es igual al ancho (diámetro).'); break;
    case 'corazon': contorno = [[corazon(0, 0, w, h)]]; break;
    default: contorno = [[rectRedondeado(0, 0, w, h, 1.2)]];
  }
  const pos = p.argolla === 'lateral' ? ['izquierda'] : ['centro'];
  const arg = ubicarArgollas(contorno, pos);
  const m = terminar(contorno, arg, avisos);
  return { multi: m, avisos, info: { ancho: w, alto: h, argollas: arg.centros } };
}
