// Piezas clásicas de joyería: medallas en relieve, cruces y dijes (motivos). ARQUITECTURA.md §5.
// Devuelven { multi, relieves, avisos, info } en mm. `relieves` son rejillas de alturas (relieve.js)
// que malla.extruir cose a la tapa; el resto es la misma extrusión con canto redondeado de siempre.

import {
  unir, restar, intersecar, cajaMulti, transformarMulti, circulo, elipse, rectRedondeado, corazon, estrella,
  areaAnillo, areaMulti, trazo, cierre, desplazar, engrosar, conectar, resisteErosion, svgAMulti, anillosParImpar,
} from './geometria2d.js';
import { ubicarArgollas, terminar, generarNombre } from './piezas.js';
import {
  lienzo, muestrear, pintar, capaVectorial, muestreoImagen, rejillaDisco, rejillaRectas, distanciaRectas,
  letra, textoEnArco, letrasEnArco, smooth, TAU,
} from './relieve.js';
import { ICONOS, ZODIACO, COLOMBIA } from './motivos-datos.js';

const lim = (v, a, b) => Math.min(b, Math.max(a, v));
const canto = (grosor) => Math.min(0.32, grosor * 0.27); // el mismo redondeo de malla.extruir

// ---------------------------------------------------------------------------------------------
// MEDALLA
// ---------------------------------------------------------------------------------------------
export const MOTIVOS_MEDALLA = {
  san_benito: { nombre: 'San Benito', imagen: 'san_benito', escala: 1.0 },
  virgen_milagrosa: { nombre: 'Virgen Milagrosa', imagen: 'virgen_milagrosa', escala: 1.0, leyenda: 'OH MARÍA SIN PECADO CONCEBIDA, RUEGA POR NOSOTROS QUE RECURRIMOS A TI' },
  guadalupe: { nombre: 'Virgen de Guadalupe', imagen: 'guadalupe', escala: 1.0 },
  divino_nino: { nombre: 'Divino Niño', imagen: 'divino_nino', escala: 0.98 },
  sagrado_corazon: { nombre: 'Sagrado Corazón', imagen: 'sagrado_corazon', escala: 1.0 },
  espiritu_santo: { nombre: 'Espíritu Santo', imagen: 'espiritu_santo', escala: 0.96 },
  angel_guarda: { nombre: 'Ángel de la guarda', imagen: 'angel_guarda', escala: 1.0 },
};

// Borde de la medalla en el lienzo: liso, cordón (torzal) o puntos (perlado).
function pintarBorde(L, { rx, ry, ancho, alto, tipo }) {
  const rm = (rx + ry) / 2;
  const nCordon = Math.max(24, Math.round((TAU * (rm - ancho / 2)) / 0.75));
  const rc = ancho * 0.5;                       // centro de los puntos (desde el borde)
  const nPuntos = Math.max(18, Math.round((TAU * (rm - rc)) / (ancho * 0.9)));
  const rb = ancho * 0.36;
  pintar(L, (x, y, v) => {
    const rn = Math.hypot(x / rx, y / ry);
    if (rn >= 1) return v;
    const e = (1 - rn) * rm;                    // distancia aproximada al borde de la rejilla
    if (e > ancho + 0.05) return v;
    const sube = smooth(0, 0.16, e), baja = 1 - smooth(ancho - 0.22, ancho, e);
    let h;
    if (tipo === 'cordon') {
      const th = Math.atan2(y / ry, x / rx);
      let s = (nCordon * th) / TAU + (1.5 * e) / ancho;
      s -= Math.floor(s);
      h = alto * (0.38 + 0.62 * Math.pow(Math.sin(Math.PI * s), 0.7)) * sube * baja;
    } else if (tipo === 'puntos') {
      const th = Math.atan2(y / ry, x / rx);
      const k = Math.round((th / TAU) * nPuntos);
      const dth = th - (k * TAU) / nPuntos;
      const d = Math.hypot(e - rc, dth * (rm - rc));
      const perla = d < rb ? Math.sqrt(1 - (d / rb) ** 2) : 0;
      const filo = e < 0.24 ? 0.5 * sube * (1 - smooth(0.16, 0.24, e)) : 0;
      h = alto * Math.max(perla, filo);
    } else {
      // Liso: banda con lomo suave.
      const t = lim((e - 0.08) / (ancho - 0.1), 0, 1);
      h = alto * (0.82 + 0.18 * Math.sin(Math.PI * t)) * sube * baja;
    }
    return Math.max(v, h);
  });
}

function frenteMedalla(p, imgs, fuentes, geo) {
  const { rgx, rgy, ancho, altoBorde, D } = geo;
  const L = lienzo(-rgx - 0.05, -rgy - 0.05, rgx + 0.05, rgy + 0.05, 0.03);
  pintarBorde(L, { rx: rgx, ry: rgy, ancho, alto: altoBorde, tipo: p.borde });
  const def = MOTIVOS_MEDALLA[p.motivo];
  let rfx = rgx - ancho - 0.2, rfy = rgy - ancho - 0.2;
  const avisos = [];
  // Leyenda perimetral (Milagrosa) solo si se lee: desde 18 mm, con mayúsculas de ≥ 0,8 mm.
  if (def.leyenda && D >= 18 && fuentes?.serif) {
    // La leyenda corre por el borde dejando libre la parte de abajo; si no cabe con mayúsculas de al
    // menos 0,78 mm, se omite (a menos de eso no se lee en el oro fundido).
    let alto = lim(D * 0.045, 0.8, 1.1);
    let r = Math.min(rfx, rfy) - 0.08 - alto;
    let t = textoEnArco(fuentes.serif, def.leyenda, { r, alto, centro: Math.PI / 2, espaciado: 0.04 });
    const tope = TAU * 0.9;
    if (t.angulo > tope) {
      alto *= tope / t.angulo;
      r = Math.min(rfx, rfy) - 0.08 - alto;
      t = textoEnArco(fuentes.serif, def.leyenda, { r, alto, centro: Math.PI / 2, espaciado: 0.04 });
    }
    if (alto >= 0.78 && t.angulo <= tope * 1.02) {
      capaVectorial(L, desplazar(t.mp, 0.02), 0.3 * lim(D / 18, 0.8, 1.2), { hombro: 0.05 });
      rfx -= alto + 0.3; rfy -= alto + 0.3;
    }
    // Si no cabe con letra legible se omite en silencio: «Oh María sin pecado concebida…» necesita
    // ~1,3 vueltas a 0,8 mm de mayúscula; en una medalla de hasta 25 mm no se leería fundida.
  }
  const img = imgs?.[def.imagen];
  if (img) {
    const muestra = muestreoImagen(img);
    const S = 2 * Math.max(rfx, rfy) * def.escala;
    const alto = lim(D * 0.027, 0.32, 0.62);
    pintar(L, (x, y, v) => {
      const rn = Math.hypot(x / rfx, y / rfy);
      if (rn >= 1) return v;
      const f = smooth(0, 0.3, (1 - rn) * Math.min(rfx, rfy));
      const h = muestra(x / S + 0.5, 0.5 - y / S) * alto * f;
      return Math.max(v, h);
    });
  } else avisos.push('No se pudo cargar el relieve de la figura.');
  return { L, avisos };
}

// Reverso de San Benito: cruz con C·S·S·M·L (vertical) y N·D·S·M·D (horizontal) que comparten la S
// del centro, C·S·P·B en los cuadrantes, PAX arriba y V·R·S·N·S·M·V·S·M·Q·L·I·V·B alrededor.
export const SAN_BENITO = {
  vertical: ['C', 'S', 'S', 'M', 'L'],
  horizontal: ['N', 'D', 'S', 'M', 'D'],
  cuadrantes: ['C', 'S', 'P', 'B'],
  arriba: 'PAX',
  leyenda: ['V', 'R', 'S', 'N', 'S', 'M', 'V', 'S', 'M', 'Q', 'L', 'I', 'V', 'B'],
};
function reversoSanBenito(fuente, geo) {
  const { rgx, rgy, ancho, altoBorde, D } = geo;
  const L = lienzo(-rgx - 0.05, -rgy - 0.05, rgx + 0.05, rgy + 0.05, 0.028);
  pintarBorde(L, { rx: rgx, ry: rgy, ancho, alto: altoBorde, tipo: geo.borde });
  const k = lim(D / 18, 0.75, 1.3);
  const Rin = Math.min(rgx, rgy) - ancho - 0.12;
  const th = lim(D * 0.058, 0.8, 1.45);
  const rTxt = Rin - th - 0.06;
  const grueso = (mp) => desplazar(mp, 0.022);
  // PAX arriba y la leyenda alrededor (de pie hacia afuera, en sentido horario).
  const pax = textoEnArco(fuente, SAN_BENITO.arriba, { r: rTxt, alto: th, centro: Math.PI / 2, espaciado: 0.18 });
  const hueco = 0.16;
  const desde = Math.PI / 2 - pax.angulo / 2 - hueco;
  const hasta = desde - (TAU - pax.angulo - 2 * hueco);
  const leyenda = letrasEnArco(fuente, SAN_BENITO.leyenda, { r: rTxt, alto: th, desde, hasta });
  capaVectorial(L, grueso([...pax.mp, ...leyenda]), 0.3 * k, { hombro: 0.045 });
  // Cruz.
  const Rf = rTxt - 0.32;
  const a = Rf * 0.9, bw = Rf * 0.34;
  const cruz = unir([[rectRedondeado(0, 0, bw, 2 * a, bw * 0.12, 6)]], [[rectRedondeado(0, 0, 2 * a, bw, bw * 0.12, 6)]]);
  capaVectorial(L, cruz, 0.2 * k, { hombro: 0.07 });
  // Letras sobre la cruz.
  const ch = bw * 0.6;
  const paso = (2 * a - bw * 0.25) / 5;
  const pos = (i) => a - bw * 0.125 - paso * (i + 0.5);
  const sobre = [];
  SAN_BENITO.vertical.forEach((c, i) => sobre.push(...letra(fuente, c, 0, pos(i), ch)));
  SAN_BENITO.horizontal.forEach((c, i) => { if (i !== 2) sobre.push(...letra(fuente, c, -pos(i), 0, ch)); });
  capaVectorial(L, grueso(sobre), 0.4 * k, { hombro: 0.04 });
  // Cuadrantes: C (arriba izq.), S (arriba der.), P (abajo izq.), B (abajo der.).
  const q = Rf * 0.5, qh = Rf * 0.27;
  const [c1, c2, c3, c4] = SAN_BENITO.cuadrantes;
  const cuad = [...letra(fuente, c1, -q, q, qh), ...letra(fuente, c2, q, q, qh), ...letra(fuente, c3, -q, -q, qh), ...letra(fuente, c4, q, -q, qh)];
  capaVectorial(L, grueso(cuad), 0.34 * k, { hombro: 0.045 });
  return L;
}

export function generarMedalla(p, fuentes = {}, imgs = {}) {
  const avisos = [];
  const D = p.diametro;
  const rx = D / 2, ry = p.forma === 'ovalada' ? (D / 2) * 1.3 : D / 2;
  const contorno = [[p.forma === 'ovalada' ? elipse(0, 0, rx, ry, 260) : circulo(0, 0, rx, Math.max(160, Math.round(D * 14)))]];
  const arg = ubicarArgollas(contorno, ['centro']);
  const multi = terminar(contorno, arg, avisos);
  const bs = canto(p.grosor);
  const geo = {
    D, rgx: rx - bs - 0.1, rgy: ry - bs - 0.1, borde: p.borde,
    ancho: lim(D * 0.055, 0.75, 1.3), altoBorde: lim(D * 0.022, 0.3, 0.48),
  };
  const paso = lim(D / 230, 0.06, 0.1);
  const f = frenteMedalla(p, imgs, fuentes, geo);
  avisos.push(...f.avisos);
  const relieves = [rejillaDisco({ rx: geo.rgx, ry: geo.rgy, paso, cara: 'arriba', altura: (x, y) => muestrear(f.L, x, y) })];
  const zonas = [];
  if (p.reverso === 'cruz_san_benito') {
    if (fuentes.serif) {
      const Lb = reversoSanBenito(fuentes.serif, geo);
      // Visto desde atrás, x queda en espejo: se muestrea con −x para que las letras se lean derechas.
      relieves.push(rejillaDisco({ rx: geo.rgx, ry: geo.rgy, paso: paso * 0.9, cara: 'abajo', altura: (x, y) => muestrear(Lb, -x, y) }));
    } else avisos.push('Falta la tipografía del reverso.');
  } else if (p.reverso === 'grabado' && p.grabado_reverso?.trim()) {
    const R = Math.min(rx, ry);
    zonas.push({ cara: 'reverso', cx: 0, cy: 0, w: R * 1.3, h: R * 0.95, texto: p.grabado_reverso, lineas: 4 });
  }
  return { multi, relieves, avisos, info: { argollas: arg.centros, zonas_grabado: zonas } };
}

// ---------------------------------------------------------------------------------------------
// CRUZ
// ---------------------------------------------------------------------------------------------
function brazosCruz(estilo, H, b) {
  let yc, w;
  if (estilo === 'griega') { yc = H / 2; w = H; }
  else if (estilo === 'tau') { yc = H - b / 2; w = H * 0.72; }
  else { yc = H * 0.69; w = H * 0.62; }
  return { yc, w, V: [-b / 2, 0, b / 2, H], Hz: [-w / 2, yc - b / 2, w / 2, yc + b / 2] };
}

function siluetaCruz(estilo, H, b, br) {
  const { yc, w } = br;
  const rect = ([x0, y0, x1, y1], r) => [[rectRedondeado((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, r, 8)]];
  const rEsq = Math.min(0.35, b * 0.15);
  if (estilo === 'redondeada') return unir(rect(br.V, b / 2), rect(br.Hz, b / 2));
  if (estilo === 'tau') {
    const barra = [[[[-w / 2, H], [-w / 2, H - b * 1.32], [-b * 0.2, H - b * 0.98], [b * 0.2, H - b * 0.98], [w / 2, H - b * 1.32], [w / 2, H]]]];
    const palo = [[[[-b * 0.72, 0], [b * 0.72, 0], [b / 2, H - b / 2], [-b / 2, H - b / 2]]]];
    return cierre(unir(barra, palo), Math.min(0.3, b * 0.12));
  }
  if (estilo === 'florenzada') {
    // Extremos trebolados: un lóbulo en la punta y dos a los lados, con el brazo un poco más corto.
    const L1 = b * 0.95;
    const partes = [rect([-b / 2, L1, b / 2, H - L1], rEsq), rect([-w / 2 + L1, yc - b / 2, w / 2 - L1, yc + b / 2], rEsq)];
    const extremos = [[[0, H], [0, 1]], [[0, 0], [0, -1]], [[-w / 2, yc], [-1, 0]], [[w / 2, yc], [1, 0]]];
    for (const [[ex, ey], [ux, uy]] of extremos) {
      const vx = -uy, vy = ux;
      const rp = b * 0.52, rl = b * 0.42;
      partes.push([[circulo(ex - ux * rp, ey - uy * rp, rp)]]);
      partes.push([[circulo(ex - ux * (L1 * 0.9) + vx * b * 0.58, ey - uy * (L1 * 0.9) + vy * b * 0.58, rl)]]);
      partes.push([[circulo(ex - ux * (L1 * 0.9) - vx * b * 0.58, ey - uy * (L1 * 0.9) - vy * b * 0.58, rl)]]);
      // Cuello entre el brazo y el lóbulo de la punta (termina en el centro del lóbulo: la punta queda redonda).
      const a0 = ux ? ex - ux * rp : ey - uy * rp, a1 = ux ? ex - ux * (L1 + 0.6) : ey - uy * (L1 + 0.6);
      partes.push(rect(ux ? [Math.min(a0, a1), ey - b * 0.42, Math.max(a0, a1), ey + b * 0.42] : [ex - b * 0.42, Math.min(a0, a1), ex + b * 0.42, Math.max(a0, a1)], 0.2));
    }
    // Sin huecos sueltos entre lóbulos y brazo (la florenzada es maciza).
    return cierre(unir(...partes), Math.min(0.35, b * 0.14)).map((pol) => [pol[0], ...pol.slice(1).filter((h) => Math.abs(areaAnillo(h)) > 0.6)]);
  }
  return unir(rect(br.V, rEsq), rect(br.Hz, rEsq));
}

export function generarCruz(p, fuentes = {}, imgs = {}) {
  const avisos = [];
  const H = p.alto, b = p.brazo, est = p.estilo;
  const br = brazosCruz(est, H, b);
  let m = siluetaCruz(est, H, b, br);
  const bs = canto(p.grosor);
  const relieves = [];
  const piedras = [];
  // Punto de luz: asiento cónico con bisel (pared ≥ 0,5 mm) en el cruce, o arriba si lleva Cristo.
  let piedra = null;
  if (p.punto_luz) {
    const d = lim(b * 0.7 + 0.5, 1.5, 3.0);
    const rb = d / 2 + 0.6;
    let py = br.yc;
    if (p.cristo) py = est === 'tau' ? H * 0.2 : br.yc + b / 2 + (H - br.yc - b / 2) * 0.52;
    piedra = { x: 0, y: py, d, rb };
    m = unir(m, [[circulo(0, py, rb)]]);
    const rr = rb - bs - 0.08;
    const prof = 0.45;
    relieves.push(rejillaDisco({
      cx: 0, cy: py, rx: rr, paso: 0.05, cara: 'arriba',
      altura: (x, y) => {
        const r = Math.hypot(x, y - py);
        if (r < d / 2) return -prof * (1 - r / (d / 2)) - 0.02;
        return 0.26 * Math.sin((Math.PI * (r - d / 2)) / (rr - d / 2));
      },
    }));
    piedras.push({ x: 0, y: py, d, z: p.grosor });
    if (b < d + 1.0) avisos.push('El punto de luz va en un botón redondo un poco más ancho que el brazo.');
  }
  // Panel con borde y/o Cristo en relieve: rejilla sobre los brazos, metida `mg` del canto.
  if (est === 'con_borde' || p.cristo) {
    const mg = Math.max(0.42, bs + 0.14);
    const { yc, w } = br;
    const acorte = est === 'florenzada' ? b * 1.25 : 0;
    let rects;
    const top = est === 'tau' ? H - b * 0.98 - mg : H - mg - acorte;
    if (est === 'tau') {
      rects = [[-b / 2 + mg, mg, b / 2 - mg, H - b * 0.98 + 0.01], [-w / 2 + mg + 0.3, H - b * 0.98, w / 2 - mg - 0.3, H - mg]];
    } else {
      rects = [[-b / 2 + mg, mg + acorte, b / 2 - mg, top], [-w / 2 + mg + acorte, yc - b / 2 + mg, w / 2 - mg - acorte, yc + b / 2 - mg]];
    }
    if (piedra) {
      // La rejilla no puede pisar el asiento de la piedra: se parte alrededor del botón.
      const s = piedra.rb + 0.18;
      const nuevos = [];
      for (const r of rects) {
        const [x0, y0, x1, y1] = r;
        const toca = x0 < piedra.x + s && x1 > piedra.x - s && y0 < piedra.y + s && y1 > piedra.y - s;
        if (!toca) { nuevos.push(r); continue; }
        if (y1 - y0 > x1 - x0) { // vertical: arriba y abajo del botón
          if (piedra.y - s - y0 > 0.4) nuevos.push([x0, y0, x1, piedra.y - s]);
          if (y1 - (piedra.y + s) > 0.4) nuevos.push([x0, piedra.y + s, x1, y1]);
        } else {
          if (piedra.x - s - x0 > 0.4) nuevos.push([x0, y0, piedra.x - s, y1]);
          if (x1 - (piedra.x + s) > 0.4) nuevos.push([piedra.x + s, y0, x1, y1]);
        }
      }
      rects = nuevos;
    }
    const hundido = est === 'con_borde' ? 0.22 : 0;
    let cristo = null;
    if (p.cristo && imgs?.cristo) {
      const muestra = muestreoImagen(imgs.cristo);
      const fa = 0.075; // fila de los brazos en la imagen (desde arriba)
      const inferior = est === 'tau' ? mg : mg;
      const S = Math.min(w - 2 * mg - 0.2, ((est === 'tau' ? H - b / 2 : yc) - inferior) / (1 - fa) * 0.97);
      const arriba = (est === 'tau' ? H - b / 2 : yc) + fa * S;
      const alto = lim(b * 0.13, 0.3, 0.55);
      cristo = (x, y) => muestra(x / S + 0.5, (arriba - y) / S) * alto;
    } else if (p.cristo) avisos.push('No se pudo cargar el relieve del Cristo.');
    if (rects.length) {
      relieves.push(rejillaRectas({
        rects, paso: 0.05, cara: 'arriba',
        altura: (x, y) => {
          const d = distanciaRectas(rects, x, y);
          let h = -hundido * smooth(0, 0.16, d);
          if (cristo) h += cristo(x, y) * smooth(0, 0.14, d);
          return h;
        },
      }));
    }
  }
  const arg = ubicarArgollas(m, ['centro']);
  m = terminar(m, arg, avisos);
  return { multi: m, relieves, avisos, info: { argollas: arg.centros, piedras } };
}

// ---------------------------------------------------------------------------------------------
// MOTIVOS (dijes clásicos)
// ---------------------------------------------------------------------------------------------
export const SIGNOS = ['aries', 'tauro', 'geminis', 'cancer', 'leo', 'virgo', 'libra', 'escorpio', 'sagitario', 'capricornio', 'acuario', 'piscis'];
export const FIGURAS = [
  'corazon', 'infinito', 'arbol_vida', 'trebol', 'herradura', 'ojo_turco', 'mano_fatima', 'elefante',
  'luna_estrella', 'estrella', 'huella', 'mapa_colombia', 'paloma', 'angel', 'mama', ...SIGNOS.map((s) => `zodiaco_${s}`),
];
// Figuras que ya son de línea (el calado no aplica).
const DE_LINEA = new Set(['infinito', 'arbol_vida', 'herradura', 'mama', 'huella', ...SIGNOS.map((s) => `zodiaco_${s}`)]);
export const sinCalado = (f) => DE_LINEA.has(f);

function escalarA(mp, tam) {
  const c = cajaMulti(mp);
  const s = tam / Math.max(c.ancho, c.alto);
  return transformarMulti(mp, { s, dx: -(c.x0 + c.ancho / 2) * s, dy: -(c.y0 + c.alto / 2) * s });
}

function infinito(A) {
  const t = lim(A * 0.085, 1.0, 2.0);
  const a = A / 2 - t / 2;
  const pts = [];
  for (let i = 0; i <= 240; i++) {
    const u = (i / 240) * TAU, d = 1 + Math.sin(u) ** 2;
    pts.push([(a * Math.cos(u)) / d, (a * Math.sin(u) * Math.cos(u) * 1.05) / d]);
  }
  return trazo(pts, t);
}

function arbolVida(A) {
  const R = A / 2;
  const tr = lim(A * 0.05, 0.85, 1.3);
  const wb = lim(R * 0.075, 0.72, 1.4);
  const partes = [restar([[circulo(0, 0, R)]], [[circulo(0, 0, R - tr)]])];
  const yTop = R * 0.02, yBot = -R * 0.46;
  partes.push([[[[-R * 0.12, yBot], [R * 0.12, yBot], [R * 0.065, yTop], [-R * 0.065, yTop]]]]);
  const bez = (A0, C, B, n = 28) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * A0[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A0[1] + 2 * u * t * C[1] + t * t * B[1]]); } return o; };
  const enAro = (ang) => [(R - tr * 0.5) * Math.cos(ang), (R - tr * 0.5) * Math.sin(ang)];
  const hojas = [];
  const rama = (desde, ang, curva, ancho) => {
    const B = enAro(ang);
    const C = [desde[0] + (B[0] - desde[0]) * 0.25 + curva * Math.cos(ang), desde[1] + (B[1] - desde[1]) * 0.75];
    const pts = bez(desde, C, B);
    partes.push(trazo(pts, ancho));
    return pts;
  };
  const deg = Math.PI / 180;
  for (const [ang, c] of [[28, 0.3], [58, 0.18], [82, 0.05], [98, -0.05], [122, -0.18], [152, -0.3]]) {
    const pts = rama([0, yTop], ang * deg, c * R, wb);
    // Ramita secundaria hacia el aro y dos hojas redondas.
    const mid = pts[14];
    const lado = ang < 90 ? -1 : 1;
    rama(mid, (ang + lado * 16) * deg, 0, wb * 0.82);
    const hp = pts[21];
    hojas.push([[circulo(hp[0] + lado * wb * 0.9, hp[1] - wb * 0.2, wb * 0.78)]]);
  }
  for (const [ang, c] of [[208, 0.25], [238, 0.12], [270, 0], [302, -0.12], [332, -0.25]]) {
    rama([0, yBot + R * 0.04], ang * deg, c * R * 0.6, wb * 0.92);
  }
  let m = unir(...partes, ...hojas);
  m = intersecar(m, [[circulo(0, 0, R)]]);
  return cierre(m, 0.22);
}

function lunaEstrella(A) {
  const R = A / 2;
  const luna = restar([[circulo(0, 0, R)]], [[circulo(R * 0.38, R * 0.14, R * 0.82)]]);
  const est = [[estrella(R * 0.3, R * 0.04, R * 0.36, 5, 0.46, Math.PI / 2 + 0.25)]];
  return redondear(unir(luna, est), 0.18);
}

function ojoTurcoSilueta(A, calado) {
  const R = A / 2;
  if (!calado) return [[circulo(0, 0, R)]];
  const anillo = restar([[circulo(0, 0, R)]], [[circulo(0, 0, R - lim(R * 0.14, 0.9, 1.4))]]);
  const centro = [[circulo(0, 0, R * 0.62)]];
  const rayos = [];
  for (let k = 0; k < 8; k++) {
    const t = (k / 8) * TAU + TAU / 16;
    rayos.push(trazo([[R * 0.5 * Math.cos(t), R * 0.5 * Math.sin(t)], [(R - 0.3) * Math.cos(t), (R - 0.3) * Math.sin(t)]], lim(R * 0.09, 0.7, 1.0)));
  }
  return cierre(unir(anillo, centro, ...rayos), 0.2);
}

// Ángel: aureola, cabeza, túnica acampanada y alas de plumas en abanico.
function angelito(A) {
  const s = A;
  const partes = [];
  partes.push([[circulo(0, s * 0.22, s * 0.095)]]);                                       // cabeza
  const ha = lim(s * 0.045, 0.75, 1.0);
  partes.push(restar([[elipse(0, s * 0.37, s * 0.13, s * 0.045, 64)]], [[elipse(0, s * 0.37, s * 0.13 - ha, Math.max(0.2, s * 0.045 - ha * 0.7), 64)]])); // aureola
  partes.push(trazo([[0, s * 0.30], [0, s * 0.34]], ha));                                 // une aureola y cabeza
  const tunica = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; tunica.push([-s * (0.09 + 0.17 * t ** 1.3), s * (0.13 - 0.6 * t)]); }
  for (let i = 0; i <= 16; i++) { const t = i / 16; tunica.push([-s * 0.26 + s * 0.52 * t, -s * 0.47 - s * 0.025 * Math.sin(Math.PI * t * 3)]); }
  for (let i = 20; i >= 0; i--) { const t = i / 20; tunica.push([s * (0.09 + 0.17 * t ** 1.3), s * (0.13 - 0.6 * t)]); }
  partes.push([[tunica]]);
  for (const lado of [-1, 1]) {
    const hombro = [lado * s * 0.08, s * 0.08];
    [[0.5, 0.95, 0.12], [0.42, 0.65, 0.105], [0.34, 0.38, 0.09], [0.26, 0.12, 0.08]].forEach(([largo, ang, ancho]) => {
      const a = lado > 0 ? ang : Math.PI - ang;
      const cx = hombro[0] + Math.cos(a) * s * largo * 0.5, cy = hombro[1] + Math.sin(a) * s * largo * 0.5;
      partes.push(transformarMulti([[elipse(0, 0, s * largo * 0.5, s * ancho * 0.5, 48)]], { rot: a, dx: cx, dy: cy }));
    });
  }
  let m = unir(...partes);
  // Líneas de plumas: rendijas finas que separan las plumas de cada ala.
  return cierre(m, 0.2);
}

function redondear(m, r) {
  // Apertura (quita picos) + cierre (rincones): esquinas redondeadas «de joyero».
  const a = desplazar(desplazar(m, -r), r);
  return cierre(a.length ? a : m, r * 0.8);
}

// Acerca cada isla suelta a la pieza mayor hasta tocarla (deditos de la huella, aureola del ángel,
// estrella de la luna), en vez de unirlas con un palito.
function acercarIslas(mp) {
  let m = mp.filter((p) => Math.abs(areaAnillo(p[0])) > 0.05);
  for (let guardia = 0; m.length > 1 && guardia < 12; guardia++) {
    m.sort((a, b) => Math.abs(areaAnillo(b[0])) - Math.abs(areaAnillo(a[0])));
    const principal = [m[0]];
    const isla = [m[m.length - 1]];
    let mejor = null;
    for (const [ax, ay] of isla[0][0]) for (const [bx, by] of principal[0][0]) {
      const d = (ax - bx) ** 2 + (ay - by) ** 2;
      if (!mejor || d < mejor.d) mejor = { d, dx: bx - ax, dy: by - ay };
    }
    const L = Math.sqrt(mejor.d) || 1;
    if (L > 4) break; // muy lejos: que la una el puente
    const f = (L + 0.35) / L;
    const movida = transformarMulti(isla, { dx: mejor.dx * f, dy: mejor.dy * f });
    m = cierre(unir(m.slice(0, -1), movida), 0.15).filter((p) => Math.abs(areaAnillo(p[0])) > 0.05);
  }
  return m;
}

function figuraBase(f, A, fuentes, p) {
  if (f === 'corazon') return [[corazon(0, 0, A, A * 0.9)]];
  if (f === 'infinito') return infinito(A);
  if (f === 'arbol_vida') return arbolVida(A);
  if (f === 'luna_estrella') return lunaEstrella(A);
  if (f === 'estrella') return redondear([[estrella(0, 0, A / 2, 5, 0.43)]], lim(A * 0.02, 0.2, 0.5));
  if (f === 'ojo_turco') return ojoTurcoSilueta(A, p.calado);
  if (f === 'mapa_colombia') return escalarA(cierre([[COLOMBIA.map(([x, y]) => [x, y])]], 0.02), A);
  if (f.startsWith('zodiaco_')) {
    const z = ZODIACO[f.slice(8)];
    const m = escalarA(svgAMulti(z.d, 4), A);
    return engrosar(m, lim(A * 0.012, 0.12, 0.3));
  }
  if (f === 'angel') return angelito(A);
  if (f === 'huella') {
    // Huella calada en un corazón: los cojinetes quedan como ventanas y la pieza es una sola.
    const pata = escalarA(svgAMulti(ICONOS.huella.d, 1.5), A * 0.46);
    const cor = [[corazon(0, 0, A, A * 0.9)]];
    return restar(cor, transformarMulti(pata, { dy: A * 0.035 }));
  }
  const ic = ICONOS[f];
  if (ic) {
    let m = escalarA(svgAMulti(ic.d, 1.5), A);
    // La herradura del icono abre hacia abajo; la de la suerte se lleva abierta hacia arriba.
    if (f === 'herradura') m = transformarMulti(m, { rot: Math.PI });
    // El trébol cuelga de una hoja (no del hueco entre dos): se gira 45°.
    if (f === 'trebol') m = escalarA(transformarMulti(m, { rot: -Math.PI / 4 }), A);
    // Rendijas de los iconos más finas que 0,5 mm se cierran (no se pueden fundir).
    m = cierre(m, 0.2);
    return m;
  }
  return [[circulo(0, 0, A / 2)]];
}

export function generarMotivo(p, fuentes = {}) {
  const avisos = [];
  const A = p.alto, f = p.figura;
  let m;
  const zonas = [];
  const esmaltes = [];
  const relieves = [];
  if (f === 'mama') {
    // «Mamá» en cursiva grande + placa debajo con los nombres de los hijos grabados en láser.
    const alto = A * 0.46;
    const r = generarNombre({ texto: 'Mamá', fuente: 'script1', alto, grosor: p.grosor, base: 'ninguna', adorno: 'ninguno', argolla: 'centro', puntos: 'unir' }, fuentes, { sinArgolla: true });
    let letras = r.multi;
    const c = cajaMulti(letras);
    const nombres = String(p.texto || '').split(',').map((s) => s.trim()).filter(Boolean);
    const filas = nombres.length > 2 ? 2 : 1;
    const hp = A * (filas === 2 ? 0.44 : 0.34);
    const wp = Math.max(c.ancho * 0.92, A * 0.9);
    const cy = c.y0 + 0.75 - hp / 2;
    const placa = [[rectRedondeado(c.x0 + c.ancho / 2, cy, wp, hp, Math.min(hp * 0.28, 2.2), 12)]];
    m = cierre(unir(letras, placa), 0.25);
    // En dos filas se reparten los nombres (sin un «·» colgando al final de la línea).
    const mitad = Math.ceil(nombres.length / 2);
    const texto = filas === 2 ? `${nombres.slice(0, mitad).join(' · ')}\n${nombres.slice(mitad).join(' · ')}` : nombres.join(' · ');
    if (nombres.length) zonas.push({ cara: 'frente', cx: c.x0 + c.ancho / 2, cy, w: wp * 0.86, h: hp * 0.74, texto, lineas: filas, sinPartir: false });
    else avisos.push('Escribe los nombres de los hijos separados por coma: se graban en la placa.');
  } else {
    m = figuraBase(f, A, fuentes, p);
    if (p.calado && f !== 'ojo_turco') {
      if (sinCalado(f)) avisos.push('Esta figura ya es de línea: el calado no cambia nada.');
      else {
        const pared = lim(A * 0.065, 0.9, 1.4);
        const dentro = desplazar(m, -pared).filter((q) => Math.abs(areaAnillo(q[0])) > 0.6);
        if (dentro.length) m = restar(m, dentro);
      }
    }
  }
  m = acercarIslas(m);
  const con = conectar(m, 0.9);
  m = con.multi;
  if (con.puentes) avisos.push('Se unieron partes sueltas con un puente fino.');
  let extra = 0;
  while (!resisteErosion(m, 0.25) && extra < 0.24) { m = engrosar(m, 0.06); extra += 0.06; }
  if (extra) avisos.push(`Se engrosó el trazo ${extra.toFixed(2).replace('.', ',')} mm para que la parte más fina mida al menos 0,5 mm.`);
  // Ojo turco: zonas hundidas para el esmalte (solo vista) separadas por paredes de oro.
  if (f === 'ojo_turco') {
    const R = A / 2;
    const bs = canto(p.grosor);
    const rr = (p.calado ? R * 0.62 : R) - bs - 0.1;
    const prof = 0.25;
    const zonasE = p.calado
      ? [[0, R * 0.16, '#111a2b'], [R * 0.22, R * 0.36, '#5aa6d6'], [R * 0.42, rr - 0.42, '#f3f1ea']]
      : [[0, R * 0.16, '#111a2b'], [R * 0.22, R * 0.36, '#5aa6d6'], [R * 0.42, R * 0.6, '#f3f1ea'], [R * 0.66, rr - 0.55, '#1d3f8f']];
    relieves.push(rejillaDisco({
      rx: rr, paso: 0.06, cara: 'arriba',
      altura: (x, y) => {
        const r = Math.hypot(x, y);
        let h = 0;
        for (const [a, b] of zonasE) {
          const dentro = (a === 0 ? 1 : smooth(a, a + 0.07, r)) * (1 - smooth(b - 0.07, b, r));
          h = Math.min(h, -prof * dentro);
        }
        return h;
      },
    }));
    for (const [a, b, color] of zonasE) esmaltes.push({ x: 0, y: 0, ri: a, ro: b, color, z: p.grosor - 0.03 });
    avisos.push('El esmalte de colores se aplica aparte, después de fundir; el 3D lo muestra como referencia.');
  }
  // Texto corto: grabado láser en el frente (en la mamá ya son los nombres).
  if (f !== 'mama' && String(p.texto || '').trim()) {
    const c = cajaMulti(m);
    if (p.calado && !sinCalado(f)) avisos.push('En una pieza calada no hay cara para grabar el texto: va en el reverso.');
    zonas.push({ cara: p.calado && !sinCalado(f) ? 'reverso' : 'frente', cx: c.x0 + c.ancho / 2, cy: c.y0 + c.alto * 0.45, w: c.ancho * 0.6, h: c.alto * 0.26, texto: p.texto, lineas: 1 });
  }
  // Argolla: herradura con la abertura hacia arriba → una argolla en la punta de cada brazo.
  let pos = p.argolla === 'lateral' ? ['izquierda'] : ['centro'];
  if (f === 'herradura' && p.argolla !== 'lateral') pos = ['arriba_izq', 'arriba_der'];
  const arg = ubicarArgollas(m, pos);
  m = terminar(m, arg, avisos);
  void areaMulti; void anillosParImpar;
  return { multi: m, relieves, avisos, info: { argollas: arg.centros, zonas_grabado: zonas, esmaltes } };
}
