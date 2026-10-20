// Geometría 2D del diseñador: contornos de glifos, figuras paramétricas, uniones booleanas,
// engrosado mínimo de trazo, puentes entre islas y argollas. Todo en milímetros, eje Y hacia arriba.
// Formato de polygon-clipping: Poligono = [anillo exterior, ...agujeros]; Multipoligono = [Poligono, ...].
// Módulo puro (sin DOM): se usa en el Worker, en el hilo principal y en la prueba de Node.

import pc from 'polygon-clipping';
import ClipperLib from 'clipper-lib';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// Utilidades básicas
// ---------------------------------------------------------------------------------------------

export function areaAnillo(anillo) {
  let a = 0;
  for (let i = 0, n = anillo.length; i < n; i++) {
    const [x1, y1] = anillo[i];
    const [x2, y2] = anillo[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

export function areaMulti(mp) {
  let a = 0;
  for (const pol of mp) {
    a += Math.abs(areaAnillo(pol[0]));
    for (let i = 1; i < pol.length; i++) a -= Math.abs(areaAnillo(pol[i]));
  }
  return a;
}

export function cajaMulti(mp) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const pol of mp) for (const [x, y] of pol[0]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1, ancho: x1 - x0, alto: y1 - y0 };
}

export function transformarMulti(mp, { s = 1, sx = s, sy = s, dx = 0, dy = 0, rot = 0 } = {}) {
  const c = Math.cos(rot), si = Math.sin(rot);
  return mp.map((pol) => pol.map((an) => an.map(([x, y]) => {
    const X = x * sx, Y = y * sy;
    return [X * c - Y * si + dx, X * si + Y * c + dy];
  })));
}

const cerrar = (anillo) => {
  const a = anillo[0], b = anillo[anillo.length - 1];
  return a[0] === b[0] && a[1] === b[1] ? anillo.slice(0, -1) : anillo;
};

// Douglas-Peucker sobre un anillo cerrado (quita puntos casi colineales).
export function simplificarAnillo(anillo, tol) {
  const pts = cerrar(anillo);
  if (pts.length < 8) return pts;
  const n = pts.length;
  // Partimos el anillo por el punto más lejano al primero.
  let k = 0, dmax = -1;
  for (let i = 1; i < n; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
    if (d > dmax) { dmax = d; k = i; }
  }
  const tramo = (a, b) => {
    const seg = [];
    for (let i = a; i !== b; i = (i + 1) % n) seg.push(pts[i]);
    seg.push(pts[b]);
    return dp(seg, tol);
  };
  const s1 = tramo(0, k), s2 = tramo(k, 0);
  const res = s1.slice(0, -1).concat(s2.slice(0, -1));
  return res.length >= 3 ? res : pts;
}

function dp(pts, tol) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const pila = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (pila.length) {
    const [a, b] = pila.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy;
    let dmax = -1, im = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (L === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        const cr = vx * (py - ay) - vy * (px - ax);
        d = (cr * cr) / L;
      }
      if (d > dmax) { dmax = d; im = i; }
    }
    if (dmax > t2) { keep[im] = 1; pila.push([a, im], [im, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

export function simplificarMulti(mp, tol) {
  const res = [];
  for (const pol of mp) {
    const ext = simplificarAnillo(pol[0], tol);
    if (ext.length < 3 || Math.abs(areaAnillo(ext)) < 1e-4) continue;
    const ag = [];
    for (let i = 1; i < pol.length; i++) {
      const h = simplificarAnillo(pol[i], tol);
      if (h.length >= 3 && Math.abs(areaAnillo(h)) > 1e-4) ag.push(h);
    }
    res.push([ext, ...ag]);
  }
  return res;
}

// Booleanas tolerantes: polygon-clipping lanza en casos degenerados raros; reintentamos
// redondeando coordenadas a una rejilla de 1e-6 mm.
const redondear = (g) => g.map((pol) => pol.map((an) => an.map(([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6])));
function seguro(fn, args) {
  try { return fn(...args); } catch (e) {
    return fn(...args.map(redondear));
  }
}
export const unir = (...gs) => {
  const v = gs.filter((g) => g && g.length);
  if (!v.length) return [];
  if (v.length === 1) return seguro(pc.union, [v[0]]);
  return seguro(pc.union, v);
};
export const restar = (a, ...b) => {
  const v = b.filter((g) => g && g.length);
  if (!a.length) return [];
  return v.length ? seguro(pc.difference, [a, ...v]) : a;
};
export const intersecar = (a, b) => (a.length && b.length ? seguro(pc.intersection, [a, b]) : []);

// ---------------------------------------------------------------------------------------------
// Glifos (opentype.js) → multipolígono
// ---------------------------------------------------------------------------------------------

// Aplana los comandos de un path de opentype (y hacia abajo) a anillos (y hacia arriba).
export function aplanarComandos(comandos, tol = 0.01) {
  const anillos = [];
  let act = null, x = 0, y = 0;
  const pasos = (len) => Math.max(2, Math.min(64, Math.ceil(Math.sqrt(len / tol) * 0.5)));
  for (const c of comandos) {
    if (c.type === 'M') {
      if (act && act.length > 2) anillos.push(act);
      act = [[c.x, -c.y]]; x = c.x; y = c.y;
    } else if (c.type === 'L') {
      act.push([c.x, -c.y]); x = c.x; y = c.y;
    } else if (c.type === 'Q') {
      const len = Math.hypot(c.x1 - x, c.y1 - y) + Math.hypot(c.x - c.x1, c.y - c.y1);
      const n = pasos(len);
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        act.push([u * u * x + 2 * u * t * c.x1 + t * t * c.x, -(u * u * y + 2 * u * t * c.y1 + t * t * c.y)]);
      }
      x = c.x; y = c.y;
    } else if (c.type === 'C') {
      const len = Math.hypot(c.x1 - x, c.y1 - y) + Math.hypot(c.x2 - c.x1, c.y2 - c.y1) + Math.hypot(c.x - c.x2, c.y - c.y2);
      const n = pasos(len);
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        act.push([
          u * u * u * x + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          -(u * u * u * y + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y),
        ]);
      }
      x = c.x; y = c.y;
    } else if (c.type === 'Z') {
      if (act && act.length > 2) anillos.push(act);
      act = null;
    }
  }
  if (act && act.length > 2) anillos.push(act);
  return anillos.map(cerrar).filter((a) => a.length >= 3);
}

// Convierte los anillos de UN glifo a multipolígono con la regla de relleno no-cero:
// los contornos con la orientación del contorno mayor rellenan; los opuestos son contraformas.
export function glifoAMulti(anillos) {
  if (!anillos.length) return [];
  let mayor = anillos[0], amax = 0;
  for (const a of anillos) { const ar = Math.abs(areaAnillo(a)); if (ar > amax) { amax = ar; mayor = a; } }
  const signo = Math.sign(areaAnillo(mayor));
  const llenos = [], huecos = [];
  const opuestos = [];
  for (const a of anillos) {
    if (Math.abs(areaAnillo(a)) < 1e-6) continue;
    if (Math.sign(areaAnillo(a)) === signo) llenos.push([[a]]); else opuestos.push(a);
  }
  // Un contorno con el sentido contrario solo es contraforma si está DENTRO de un relleno; si no,
  // es una pieza más (p. ej. la tilde de un glifo compuesto dibujada al revés en algunas fuentes).
  const dentro = ([x, y], an) => {
    let c = false;
    for (let i = 0, j = an.length - 1; i < an.length; j = i++) {
      const [xi, yi] = an[i], [xj, yj] = an[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  for (const a of opuestos) {
    const enRelleno = llenos.some(([[l]]) => dentro(a[0], l));
    (enRelleno ? huecos : llenos).push([[a]]);
  }
  const u = unir(...llenos);
  return huecos.length ? restar(u, unir(...huecos)) : u;
}

// Maquetación propia (carácter → glifo + avance + kerning) para fuentes cuyas tablas GSUB
// no soporta opentype.js todavía.
function maquetarSimple(fuente, texto, tam, variacion) {
  const esc = tam / fuente.unitsPerEm;
  const glifos = Array.from(texto).map((ch) => fuente.charToGlyph(ch));
  const caminos = [];
  let x = 0;
  glifos.forEach((g, i) => {
    const op = variacion ? { variation: variacion } : undefined;
    caminos.push(g.getPath(x, 0, tam, op, fuente));
    x += (g.advanceWidth || 0) * esc;
    if (glifos[i + 1]) {
      try { x += fuente.getKerningValue(g, glifos[i + 1]) * esc; } catch { /* sin kerning */ }
    }
  });
  return caminos;
}

// Texto → multipolígono por glifo (para que la contraforma de una letra no corte a la vecina).
export function textoAMulti(fuente, texto, tam, opciones = {}) {
  const { variacion, espaciado = 0 } = opciones;
  const op = { kerning: true, features: { liga: true, rlig: true, calt: true } };
  if (variacion) op.variation = variacion;
  let caminos;
  try { caminos = fuente.getPaths(texto, 0, 0, tam, op); }
  catch { caminos = maquetarSimple(fuente, texto, tam, variacion); }
  const glifos = [];
  let i = 0;
  for (const camino of caminos) {
    const anillos = aplanarComandos(camino.commands, tam * 0.0006);
    const mp = glifoAMulti(anillos);
    if (mp.length) glifos.push(espaciado ? transformarMulti(mp, { dx: espaciado * i }) : mp);
    i++;
  }
  return glifos;
}

// ---------------------------------------------------------------------------------------------
// Figuras paramétricas (todas centradas en el origen salvo que se indique)
// ---------------------------------------------------------------------------------------------

export function circulo(cx, cy, r, n = 0) {
  const lados = n || Math.max(24, Math.min(160, Math.ceil(TAU * r / 0.12)));
  const a = [];
  for (let i = 0; i < lados; i++) {
    const t = (i / lados) * TAU;
    a.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return a;
}

export function elipse(cx, cy, rx, ry, n = 120) {
  const a = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    a.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return a;
}

export function rectRedondeado(cx, cy, w, h, r, nEsq = 10) {
  r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3);
  const a = [];
  const esq = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 0.25], [-w / 2 + r, -h / 2 + r, 0.5], [w / 2 - r, -h / 2 + r, 0.75]];
  for (const [ex, ey, t0] of esq) {
    for (let i = 0; i <= nEsq; i++) {
      const t = (t0 + (i / nEsq) * 0.25) * TAU;
      a.push([cx + ex + r * Math.cos(t), cy + ey + r * Math.sin(t)]);
    }
  }
  return a;
}

// Corazón clásico (curva paramétrica), escalado a ancho w y alto h, centrado en su caja.
export function corazon(cx, cy, w, h, n = 160) {
  const raw = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    raw.push([x, y]);
  }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of raw) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return raw.map(([x, y]) => [cx + ((x - (x0 + x1) / 2) / (x1 - x0)) * w, cy + ((y - (y0 + y1) / 2) / (y1 - y0)) * h]);
}

export function estrella(cx, cy, rExt, puntas = 5, relInt = 0.45, rot = Math.PI / 2) {
  const a = [];
  for (let i = 0; i < puntas * 2; i++) {
    const r = i % 2 ? rExt * relInt : rExt;
    const t = rot + (i / (puntas * 2)) * TAU;
    a.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return a;
}

// Corona de tres puntas con bolitas, base en y=cy, ancho w, alto h.
export function corona(cx, cy, w, h) {
  const base = h * 0.28;
  const puntas = [
    [-w / 2, cy + h * 0.78], [-w * 0.27, cy + base + h * 0.12],
    [0, cy + h * 0.92], [w * 0.27, cy + base + h * 0.12], [w / 2, cy + h * 0.78],
  ];
  const cuerpo = [
    [cx - w * 0.44, cy], [cx + w * 0.44, cy],
    [cx + puntas[4][0], puntas[4][1]], [cx + puntas[3][0], puntas[3][1]],
    [cx + puntas[2][0], puntas[2][1]], [cx + puntas[1][0], puntas[1][1]],
    [cx + puntas[0][0], puntas[0][1]],
  ];
  const rb = w * 0.075;
  const partes = [[cuerpo]];
  for (const i of [0, 2, 4]) partes.push([circulo(cx + puntas[i][0] * (i === 2 ? 1 : 0.94), puntas[i][1] + rb * 0.6, rb, 24)]);
  return unir(...partes);
}

// Mariposa: cuatro alas (elipses rotadas) + cuerpo, ancho w.
export function mariposa(cx, cy, w) {
  const s = w / 2;
  const ala = (dx, dy, rx, ry, rot) => {
    const a = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * TAU;
      const x = rx * Math.cos(t), y = ry * Math.sin(t);
      a.push([cx + dx + x * Math.cos(rot) - y * Math.sin(rot), cy + dy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return [[a]];
  };
  const alas = unir(
    ala(-s * 0.48, s * 0.28, s * 0.5, s * 0.34, 0.55),
    ala(s * 0.48, s * 0.28, s * 0.5, s * 0.34, -0.55),
    ala(-s * 0.36, -s * 0.34, s * 0.34, s * 0.24, -0.6),
    ala(s * 0.36, -s * 0.34, s * 0.34, s * 0.24, 0.6),
    [[elipse(cx, cy, s * 0.11, s * 0.62, 32)]],
  );
  // Calado decorativo en las alas grandes (contraformas que dejan pared ≥ 0,8 mm si caben).
  const hueco = (dx, dy, r) => [[circulo(cx + dx, cy + dy, r, 28)]];
  const rh = s * 0.15;
  if (rh > 0.45 && s * 0.5 - rh > 0.9) {
    return restar(alas, hueco(-s * 0.55, s * 0.33, rh), hueco(s * 0.55, s * 0.33, rh));
  }
  return alas;
}

// ---------------------------------------------------------------------------------------------
// Engrosado (suma de Minkowski con un disco) — asegura trazo mínimo y une letras casi tocándose.
// ---------------------------------------------------------------------------------------------

function capsula(a, b, r, nCap = 4) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  if (L < 1e-9) return circulo(a[0], a[1], r, 12);
  const ang = Math.atan2(dy, dx);
  const pts = [];
  for (let i = 0; i <= nCap; i++) {
    const t = ang - Math.PI / 2 + (i / nCap) * Math.PI;
    pts.push([b[0] + r * Math.cos(t), b[1] + r * Math.sin(t)]);
  }
  for (let i = 0; i <= nCap; i++) {
    const t = ang + Math.PI / 2 + (i / nCap) * Math.PI;
    pts.push([a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)]);
  }
  return pts;
}

// Desplazamiento (offset) con uniones redondas — Clipper trabaja en enteros: 1 unidad = 10 nm.
// Es exacto (arcos verdaderos, sin los dientes que dejaba la unión de miles de cápsulas) y ~20× más rápido.
const ESC = 1e5;
function aCaminos(mp) {
  const caminos = [];
  for (const pol of mp) for (const an of pol) {
    const c = cerrar(an).map(([x, y]) => ({ X: Math.round(x * ESC), Y: Math.round(y * ESC) }));
    if (c.length >= 3) caminos.push(c);
  }
  return caminos;
}
function deArbol(arbol) {
  const ex = ClipperLib.JS.PolyTreeToExPolygons(arbol);
  const out = [];
  for (const e of ex) {
    const ext = e.outer.map((p) => [p.X / ESC, p.Y / ESC]);
    if (ext.length < 3) continue;
    if (areaAnillo(ext) < 0) ext.reverse();
    const ag = e.holes.filter((h) => h.length >= 3).map((h) => {
      const a = h.map((p) => [p.X / ESC, p.Y / ESC]);
      if (areaAnillo(a) > 0) a.reverse();
      return a;
    });
    out.push([ext, ...ag]);
  }
  return out;
}
// tolArco y tolSimp en mm: 8 µm es invisible a esta escala y mantiene a Clipper liviano.
export function desplazar(mp, delta, tolArco = 0.008, tolSimp = 0.005) {
  if (!mp.length || !delta) return mp;
  const co = new ClipperLib.ClipperOffset(2, Math.max(1, tolArco * ESC));
  // Douglas-Peucker fino antes de desplazar: menos vértices = mucho menos trabajo para Clipper.
  co.AddPaths(aCaminos(simplificarMulti(mp, tolSimp)), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  const arbol = new ClipperLib.PolyTree();
  co.Execute(arbol, delta * ESC);
  return deArbol(arbol);
}

// Trazo abierto de ancho constante con puntas redondas (para enlaces curvos tipo script).
export function trazo(puntos, ancho, tolArco = 0.004) {
  const co = new ClipperLib.ClipperOffset(2, Math.max(1, tolArco * ESC));
  co.AddPath(puntos.map(([x, y]) => ({ X: Math.round(x * ESC), Y: Math.round(y * ESC) })), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenRound);
  const arbol = new ClipperLib.PolyTree();
  co.Execute(arbol, (ancho / 2) * ESC);
  return deArbol(arbol);
}

// Cierre morfológico (+r, −r): suelda partes separadas por menos de 2r con uniones curvas, como
// soldadas a mano, y rellena huecos de menos de 2r.
export function cierre(mp, r) {
  if (!(r > 0) || !mp.length) return mp;
  return desplazar(desplazar(mp, r), -r);
}

// Erosión de prueba: ¿la pieza sigue de una pieza al quitarle r por cada lado? (trazo mínimo ≥ 2r)
export function resisteErosion(mp, r) {
  // Solo importa la conectividad: basta una versión gruesa (tolerancias de 20 µm).
  const e = desplazar(mp, -r, 0.02, 0.015).filter((p) => Math.abs(areaAnillo(p[0])) > 0.01);
  return e.length <= 1;
}

// Engrosado de trazo (suma de Minkowski con un disco de radio r).
export function engrosar(mp, r) {
  if (!(r > 0) || !mp.length) return mp;
  return desplazar(mp, r);
}

// Pulido del contorno (morfología): el cierre (+f, −f) redondea los rincones cóncavos —uniones
// de la argolla, puentes, cruces de letras— con radio f, y rellena rendijas < 2f que no se pueden
// fundir; la apertura (−g, +g) quita picos y dientes de menos de 2g en los cantos convexos.
// Luego Douglas-Peucker fino para no cargar la malla con puntos colineales.
export function pulirContorno(mp, { cierre = 0.2, apertura = 0, tolerancia = 0.0035 } = {}) {
  if (!mp.length) return mp;
  let m = mp;
  if (cierre > 0) m = desplazar(desplazar(m, cierre), -cierre);
  if (apertura > 0) {
    const a = desplazar(desplazar(m, -apertura), apertura);
    // Si la apertura borra una parte (trazo muy fino), conservamos la versión sin abrir.
    if (a.length === m.length) m = a;
  }
  return simplificarMulti(m, tolerancia);
}

// Puente redondeado (cápsula) entre dos puntos.
export function puente(a, b, ancho) {
  return [[capsula(a, b, ancho / 2, 6)]];
}

// ---------------------------------------------------------------------------------------------
// Conectividad: unir islas a la pieza mayor con puentes finos
// ---------------------------------------------------------------------------------------------

function puntoMasCercano(pa, pb) {
  // Pares de vértices más cercanos entre dos polígonos (submuestreando si son muy densos).
  const A = pa[0], B = pb[0];
  const pasoA = Math.max(1, Math.floor(A.length / 400)), pasoB = Math.max(1, Math.floor(B.length / 400));
  let best = Infinity, ia = 0, ib = 0;
  for (let i = 0; i < A.length; i += pasoA) for (let j = 0; j < B.length; j += pasoB) {
    const d = (A[i][0] - B[j][0]) ** 2 + (A[i][1] - B[j][1]) ** 2;
    if (d < best) { best = d; ia = i; ib = j; }
  }
  // Refinamos alrededor del mejor par.
  const ref = (R, c, paso) => { const out = []; for (let k = -paso; k <= paso; k++) out.push(R[(c + k + R.length) % R.length]); return out; };
  let pA = A[ia], pB = B[ib];
  for (const a of ref(A, ia, pasoA)) for (const b of ref(B, ib, pasoB)) {
    const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    if (d <= best) { best = d; pA = a; pB = b; }
  }
  return { a: pA, b: pB, d: Math.sqrt(best) };
}

// Garantiza una sola pieza. Las islas diminutas (< areaMin mm²) se descartan.
// Devuelve { multi, puentes: n, descartadas: n }.
export function conectar(mp, anchoPuente = 0.9, areaMin = 0.05) {
  let piezas = mp.filter((p) => Math.abs(areaAnillo(p[0])) >= areaMin);
  const descartadas = mp.length - piezas.length;
  let puentes = 0;
  let guardia = 0;
  while (piezas.length > 1 && guardia++ < 40) {
    // Pieza principal = la de mayor área; conectamos la isla más cercana a ella.
    piezas.sort((p, q) => Math.abs(areaAnillo(q[0])) - Math.abs(areaAnillo(p[0])));
    const principal = piezas[0];
    let mejor = null, im = -1;
    for (let i = 1; i < piezas.length; i++) {
      const c = puntoMasCercano(principal, piezas[i]);
      if (!mejor || c.d < mejor.d) { mejor = c; im = i; }
    }
    // Penetramos un poco en ambos lados para que la unión sea sólida.
    const dx = mejor.b[0] - mejor.a[0], dy = mejor.b[1] - mejor.a[1];
    const L = Math.hypot(dx, dy) || 1;
    const ext = anchoPuente * 0.5;
    const a = [mejor.a[0] - (dx / L) * ext, mejor.a[1] - (dy / L) * ext];
    const b = [mejor.b[0] + (dx / L) * ext, mejor.b[1] + (dy / L) * ext];
    piezas = unir(piezas, puente(a, b, anchoPuente)).filter((p) => Math.abs(areaAnillo(p[0])) >= areaMin);
    puentes++;
  }
  return { multi: piezas, puentes, descartadas };
}

// ---------------------------------------------------------------------------------------------
// Perfiles de la pieza para ubicar argollas
// ---------------------------------------------------------------------------------------------

// Mínimo (o máximo) x del material en la franja horizontal [yc-h, yc+h]. El extremo de la región
// recortada siempre cae sobre el contorno, así que basta recortar cada arista a la franja (sin booleanas).
export function extremoEnFranjaH(mp, yc, h, lado = 'izq') {
  const y0 = yc - h, y1 = yc + h;
  let mejor = null;
  for (const pol of mp) for (const an of pol) {
    for (let i = 0, n = an.length; i < n; i++) {
      const [ax, ay] = an[i], [bx, by] = an[(i + 1) % n];
      const lo = Math.max(y0, Math.min(ay, by)), hi = Math.min(y1, Math.max(ay, by));
      if (lo > hi) continue;
      const xs = ay === by ? [ax, bx] : [lo, hi].map((y) => ax + ((y - ay) / (by - ay)) * (bx - ax));
      for (const x of xs) if (mejor === null || (lado === 'izq' ? x < mejor : x > mejor)) mejor = x;
    }
  }
  return mejor;
}

// Máximo y del material en la franja vertical [xc-w, xc+w].
export function techoEnFranjaV(mp, xc, w) {
  const x0 = xc - w, x1 = xc + w;
  let mejor = null;
  for (const pol of mp) for (const an of pol) {
    for (let i = 0, n = an.length; i < n; i++) {
      const [ax, ay] = an[i], [bx, by] = an[(i + 1) % n];
      const lo = Math.max(x0, Math.min(ax, bx)), hi = Math.min(x1, Math.max(ax, bx));
      if (lo > hi) continue;
      const ys = ax === bx ? [ay, by] : [lo, hi].map((x) => ay + ((x - ax) / (bx - ax)) * (by - ay));
      for (const y of ys) if (mejor === null || y > mejor) mejor = y;
    }
  }
  return mejor;
}

// Argolla (anillo) — devuelve { anillo: multipolígono, hueco: multipolígono del agujero }.
export function argolla(cx, cy, dInt = 2.8, pared = 0.95) {
  const ri = dInt / 2, re = ri + pared;
  return {
    anillo: [[circulo(cx, cy, re), circulo(cx, cy, ri).reverse()]],
    hueco: [[circulo(cx, cy, ri)]],
    re, ri,
  };
}

// Limpia anillos antes de triangular: quita puntos duplicados (< dmin) y casi colineales
// (desvío < tolCol). Evita que el triangulador descarte vértices que las paredes sí usan
// (uniones en T → aristas abiertas en el STL).
export function limpiarAnillo(anillo, dmin = 0.004, tolCol = 0.0004) {
  let pts = cerrar(anillo).slice();
  let cambio = true, guardia = 0;
  while (cambio && pts.length > 3 && guardia++ < 20) {
    cambio = false;
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = out.length ? out[out.length - 1] : pts[(i - 1 + n) % n];
      const p = pts[i], next = pts[(i + 1) % n];
      const dx = next[0] - prev[0], dy = next[1] - prev[1];
      const L = Math.hypot(dx, dy);
      const dPrev = Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      const desv = L > 1e-12 ? Math.abs(dx * (p[1] - prev[1]) - dy * (p[0] - prev[0])) / L : dPrev;
      if (dPrev < dmin || desv < tolCol) { cambio = true; continue; }
      out.push(p);
    }
    pts = out;
  }
  return pts;
}

export function limpiarMulti(mp) {
  const res = [];
  for (const pol of mp) {
    const ext = limpiarAnillo(pol[0]);
    if (ext.length < 3 || Math.abs(areaAnillo(ext)) < 1e-3) continue;
    const ag = [];
    for (let i = 1; i < pol.length; i++) {
      const h = limpiarAnillo(pol[i]);
      if (h.length >= 3 && Math.abs(areaAnillo(h)) > 1e-3) ag.push(h);
    }
    res.push([ext, ...ag]);
  }
  // Re-normalizamos con una unión (resuelve cualquier toque que la limpieza haya creado) y
  // limpiamos otra vez: la unión puede reinsertar vértices colineales al partir aristas.
  return unir(res).map((pol) => pol.map((an) => limpiarAnillo(an))).filter((pol) => pol[0].length >= 3)
    .map((pol) => pol.filter((an, i) => i === 0 || an.length >= 3));
}

// ---------------------------------------------------------------------------------------------
// Caminos SVG (iconos con licencia libre) → multipolígono. y hacia arriba (se invierte la del SVG).
// Relleno par-impar por anidamiento: profundidad par = material, impar = hueco.
// ---------------------------------------------------------------------------------------------
export function svgAAnillos(d, tol = 0.6) {
  const tok = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  let i = 0, cmd = null;
  const num = () => Number(tok[i++]);
  const esNum = () => i < tok.length && !/^[a-zA-Z]$/.test(tok[i]);
  const anillos = [];
  let act = null, x = 0, y = 0, x0 = 0, y0 = 0, cx2 = 0, cy2 = 0, qx = 0, qy = 0, ult = '';
  const pasos = (L) => Math.max(2, Math.min(48, Math.ceil(L / tol)));
  const linea = (nx, ny) => { act.push([nx, ny]); x = nx; y = ny; };
  const cubica = (x1, y1, x2, y2, ex, ey) => {
    const n = pasos(Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(ex - x2, ey - y2));
    const sx = x, sy = y;
    for (let k = 1; k <= n; k++) {
      const t = k / n, u = 1 - t;
      act.push([u * u * u * sx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex, u * u * u * sy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey]);
    }
    cx2 = x2; cy2 = y2; x = ex; y = ey;
  };
  const cuadratica = (x1, y1, ex, ey) => {
    const n = pasos(Math.hypot(x1 - x, y1 - y) + Math.hypot(ex - x1, ey - y1));
    const sx = x, sy = y;
    for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; act.push([u * u * sx + 2 * u * t * x1 + t * t * ex, u * u * sy + 2 * u * t * y1 + t * t * ey]); }
    qx = x1; qy = y1; x = ex; y = ey;
  };
  const arcoSvg = (rx, ry, rot, grande, barrido, ex, ey) => {
    if (!rx || !ry) return linea(ex, ey);
    rx = Math.abs(rx); ry = Math.abs(ry);
    const fi = (rot * Math.PI) / 180, c = Math.cos(fi), s = Math.sin(fi);
    const dx = (x - ex) / 2, dy = (y - ey) / 2;
    const x1 = c * dx + s * dy, y1 = -s * dx + c * dy;
    const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const sg = grande === barrido ? -1 : 1;
    const num2 = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
    const co = sg * Math.sqrt(Math.max(0, num2 / (rx * rx * y1 * y1 + ry * ry * x1 * x1)));
    const cxp = (co * rx * y1) / ry, cyp = (-co * ry * x1) / rx;
    const ccx = c * cxp - s * cyp + (x + ex) / 2, ccy = s * cxp + c * cyp + (y + ey) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const t1 = ang(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
    let dt = ang((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
    if (!barrido && dt > 0) dt -= 2 * Math.PI; else if (barrido && dt < 0) dt += 2 * Math.PI;
    const n = pasos(Math.abs(dt) * Math.max(rx, ry));
    for (let k = 1; k <= n; k++) {
      const t = t1 + (dt * k) / n;
      act.push([ccx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, ccy + rx * Math.cos(t) * s + ry * Math.sin(t) * c]);
    }
    x = ex; y = ey;
  };
  const cerrarAct = () => { if (act && act.length > 2) anillos.push(act); act = null; };
  while (i < tok.length) {
    if (!esNum()) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { cerrarAct(); x = x0; y = y0; ult = 'Z'; continue; }
    if (C === 'M') {
      cerrarAct();
      x = num() + ox; y = num() + oy; x0 = x; y0 = y; act = [[x, y]];
      cmd = rel ? 'l' : 'L'; ult = 'M'; continue;
    }
    if (!act) act = [[x, y]];
    if (C === 'L') linea(num() + ox, num() + oy);
    else if (C === 'H') linea(num() + ox, y);
    else if (C === 'V') linea(x, num() + oy);
    else if (C === 'C') { const a = num() + ox, b = num() + oy, c2 = num() + ox, d2 = num() + oy, e = num() + ox, f = num() + oy; cubica(a, b, c2, d2, e, f); }
    else if (C === 'S') {
      const rx1 = ult === 'C' || ult === 'S' ? 2 * x - cx2 : x, ry1 = ult === 'C' || ult === 'S' ? 2 * y - cy2 : y;
      const c2 = num() + ox, d2 = num() + oy, e = num() + ox, f = num() + oy; cubica(rx1, ry1, c2, d2, e, f);
    } else if (C === 'Q') { const a = num() + ox, b = num() + oy, e = num() + ox, f = num() + oy; cuadratica(a, b, e, f); }
    else if (C === 'T') {
      const a = ult === 'Q' || ult === 'T' ? 2 * x - qx : x, b = ult === 'Q' || ult === 'T' ? 2 * y - qy : y;
      cuadratica(a, b, num() + ox, num() + oy);
    } else if (C === 'A') {
      const rx = num(), ry = num(), rot = num(), g = num(), b = num(), e = num() + ox, f = num() + oy;
      arcoSvg(rx, ry, rot, g, b, e, f);
    } else { i++; }
    ult = C;
  }
  cerrarAct();
  return anillos.map((a) => a.map(([px, py]) => [px, -py]));
}

export function anillosParImpar(anillos) {
  const dentro = ([x, y], an) => {
    let c = false;
    for (let i = 0, j = an.length - 1; i < an.length; j = i++) {
      const [xi, yi] = an[i], [xj, yj] = an[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const lista = anillos.filter((a) => a.length >= 3 && Math.abs(areaAnillo(a)) > 1e-6)
    .map((a) => ({ a, area: Math.abs(areaAnillo(a)) })).sort((p, q) => q.area - p.area);
  for (const r of lista) {
    // Punto de prueba: el centro de una arista (los vértices pueden tocar a otro anillo).
    const p = [(r.a[0][0] + r.a[1][0]) / 2, (r.a[0][1] + r.a[1][1]) / 2];
    r.padres = lista.filter((o) => o !== r && o.area > r.area && dentro(p, o.a));
    r.prof = r.padres.length;
  }
  const llenos = lista.filter((r) => r.prof % 2 === 0);
  const polis = llenos.map((r) => [[r.a]]);
  let m = unir(...polis);
  const huecos = lista.filter((r) => r.prof % 2 === 1).map((r) => [[r.a]]);
  if (huecos.length) {
    // Los huecos de profundidad impar se restan, pero las islas que tienen dentro (profundidad par) vuelven.
    m = restar(m, ...huecos);
    const islas = llenos.filter((r) => r.prof > 0).map((r) => [[r.a]]);
    if (islas.length) m = unir(m, ...islas);
  }
  return m;
}

export function svgAMulti(d, tol = 0.6) {
  return anillosParImpar(svgAAnillos(d, tol));
}
