// Mallas 3D: extrusión con bisel de piezas planas, anillo revolucionado, y verificaciones
// (volumen por tetraedros firmados, malla cerrada/manifold, componentes conectadas).
// Puro three.js (sin DOM): funciona en Worker y en Node.

import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { diametroInterior } from './esquema.js';
import { limpiarMulti } from './geometria2d.js';
import { contornosRejilla } from './relieve.js';

// ---------------------------------------------------------------------------------------------
// Extrusión
// ---------------------------------------------------------------------------------------------

const v2 = (an) => {
  const pts = an[0][0] === an[an.length - 1][0] && an[0][1] === an[an.length - 1][1] ? an.slice(0, -1) : an;
  return pts.map(([x, y]) => new THREE.Vector2(x, y));
};

export function multiAFormas(mp) {
  return mp.map((pol) => {
    const forma = new THREE.Shape(v2(pol[0]));
    for (let i = 1; i < pol.length; i++) forma.holes.push(new THREE.Path(v2(pol[i])));
    return forma;
  });
}

// Extrusión propia con canto redondeado «pulido de joyería»: cuarto de elipse de S segmentos arriba
// y abajo, de radio proporcional al grosor (≈ 26 %, tope 0,32 mm). La silueta exterior queda exacta; las
// caras planas se insinúan `bs` mm hacia dentro. Cada vértice del contorno se usa en tapas y paredes, así
// que la malla es cerrada (manifold) por construcción. Donde el trazo es angosto, el redondeo se reduce
// según el ancho local para que nunca se crucen los cantos de un lado y del otro.
//
// Devuelve la geometría indexada (para el STL y el volumen) y `render`: la misma malla sin indexar con
// normales ANALÍTICAS — tapas exactamente planas, canto con la normal verdadera de la elipse y paredes
// continuas a lo largo del contorno salvo en las esquinas intencionales (giro > 42°), que quedan nítidas.
// (Antes se usaban normales con pliegue: las tapas heredaban la inclinación del bisel y los triángulos
// largos de la tapa mostraban vetas y facetas, el aspecto «sin pulir».)
export function extruir(mp, grosor, opciones = {}) {
  const S = opciones.segmentos ?? 5;
  const bsMax = opciones.bs ?? Math.min(0.32, grosor * 0.27);
  const btMax = opciones.bt ?? Math.min(0.32, grosor * 0.27);
  const limpio = limpiarMulti(mp);
  const relieves = opciones.relieves || [];
  const normalesExtra = [];   // [indiceVertice, nx, ny, nz] de las rejillas (vista)
  const rangosRejilla = [];   // [triInicio, triFin) de los triángulos de cada rejilla
  const pos = [];
  const idx = [];
  const nr = [];   // normales por esquina de triángulo (render)
  const anadir = (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1; };
  const tri = (a, b, c, na, nb, nc) => { idx.push(a, b, c); nr.push(...na, ...nb, ...nc); };

  // Capas (ángulo a, z relativo, factor de inserción) de abajo hacia arriba. a=0 → tapa, a=π/2 → pared.
  const capas = [];
  for (let j = 0; j <= S; j++) { const a = (j / S) * Math.PI / 2; capas.push({ a, abajo: true, f: 1 - Math.sin(a), k: 1 - Math.cos(a) }); }
  for (let j = S; j >= 0; j--) { const a = (j / S) * Math.PI / 2; capas.push({ a, abajo: false, f: 1 - Math.sin(a), k: 1 - Math.cos(a) }); }
  // Normal de la elipse (radios bs horizontal, bt vertical) en el ángulo a: (sin a·bt, ±cos a·bs).
  const normalCapa = capas.map(({ a, abajo }) => {
    const h = Math.sin(a) * btMax, v = Math.cos(a) * bsMax * (abajo ? -1 : 1);
    const L = Math.hypot(h, v) || 1;
    return [h / L, v / L];
  });

  for (const pol of limpio) {
    // Orientación: exterior antihorario, agujeros horario → el material queda siempre a la izquierda.
    const anillos = pol.map((an, k) => {
      const pts = an[0][0] === an[an.length - 1][0] && an[0][1] === an[an.length - 1][1] ? an.slice(0, -1) : an.slice();
      const ar = areaAnillo2(pts);
      if ((k === 0 && ar < 0) || (k > 0 && ar > 0)) pts.reverse();
      // Micro-perturbación determinista (≤ 2·10⁻⁵ mm): el triangulador descarta vértices exactamente
      // colineales entre anillos distintos, lo que dejaría uniones en T y aristas abiertas.
      return pts.map(([x, y], i) => [x + ruido(k * 7919 + i) * 2e-5, y + ruido(k * 104729 + i * 3 + 1) * 2e-5]);
    });
    const limites = anchoLocal(anillos, bsMax);
    const datos = anillos.map((pts, k) => insertarAnillo(pts, limites[k]));
    // Tapas: triangulamos el contorno insertado.
    const tapa = (lista) => THREE.ShapeUtils.triangulateShape(
      lista[0].ins.map(([x, y]) => new THREE.Vector2(x, y)),
      lista.slice(1).map((h) => h.ins.map(([x, y]) => new THREE.Vector2(x, y))),
    );
    let usar = datos;
    let caras = tapa(usar);
    const total = usar.reduce((a, h) => a + h.ins.length, 0);
    if (caras.length !== total - 2 + 2 * (usar.length - 1)) {
      // Triangulación sospechosa: sin redondeo para este polígono.
      usar = anillos.map((pts) => insertarAnillo(pts, new Float64Array(pts.length)));
      caras = tapa(usar);
    }
    // Vértices por capa.
    const ids = usar.map(({ ins }) => capas.map(({ f, k, abajo }) => ins.map(([x, y, dx, dy, d]) => {
      const bt = btMax * Math.max(0.2, bsMax > 0 ? d / bsMax : 0);
      return anadir(x + dx * f, y + dy * f, abajo ? bt * k : grosor - bt * k);
    })));
    // Paredes y cantos.
    usar.forEach(({ nv, ne, esquina }, r) => {
      const capasAn = ids[r];
      const n = nv.length;
      for (let c = 0; c < capasAn.length - 1; c++) {
        const L = capasAn[c], U = capasAn[c + 1];
        const [hL, vL] = normalCapa[c], [hU, vU] = normalCapa[c + 1];
        for (let i = 0; i < n; i++) {
          const i2 = (i + 1) % n;
          const d1 = esquina[i] ? ne[i] : nv[i];
          const d2 = esquina[i2] ? ne[i] : nv[i2];
          const nL1 = [d1[0] * hL, d1[1] * hL, vL], nL2 = [d2[0] * hL, d2[1] * hL, vL];
          const nU1 = [d1[0] * hU, d1[1] * hU, vU], nU2 = [d2[0] * hU, d2[1] * hU, vU];
          tri(L[i], L[i2], U[i2], nL1, nL2, nU2);
          tri(L[i], U[i2], U[i], nL1, nU2, nU1);
        }
      }
    });
    // Tapas (abajo: capa 0, arriba: última capa). Si hay relieves dentro de este polígono, su contorno
    // entra como hueco de la tapa y la rejilla se cose con los mismos vértices.
    const plano = (capa) => ids.flatMap((capasAn) => capasAn[capa]);
    const abajo = plano(0), arriba = plano(capas.length - 1);
    const p2 = usar.flatMap((u) => u.ins);
    const NA = [0, 0, -1], NB = [0, 0, 1];
    const propios = relieves.filter((r) => dentroPoligono(r.centro, anillos));
    for (const cara of ['abajo', 'arriba']) {
      const rels = propios.filter((r) => r.cara === cara);
      const esArriba = cara === 'arriba';
      const base = esArriba ? arriba : abajo;
      const NN = esArriba ? NB : NA;
      let tris = caras, coords = p2, idv = base;
      if (rels.length) {
        const extra = rels.map((r) => coserRelieve(r, grosor, anadir, tri, () => idx.length / 3));
        const huecos = extra.flatMap((e) => e.lazos);
        tris = THREE.ShapeUtils.triangulateShape(
          usar[0].ins.map(([x, y]) => new THREE.Vector2(x, y)),
          [...usar.slice(1).map((h) => h.ins.map(([x, y]) => new THREE.Vector2(x, y))), ...huecos.map((l) => l.xy.map(([x, y]) => new THREE.Vector2(x, y)))],
        );
        coords = p2.concat(...huecos.map((l) => l.xy));
        idv = base.concat(...huecos.map((l) => l.ids));
        for (const e of extra) { for (const n of e.normales) normalesExtra.push(n); rangosRejilla.push(e.rango); }
      }
      for (const [a, b, c] of tris) {
        const ar = (coords[b][0] - coords[a][0]) * (coords[c][1] - coords[a][1]) - (coords[c][0] - coords[a][0]) * (coords[b][1] - coords[a][1]);
        const ccw = ar > 0;
        if (esArriba === ccw) tri(idv[a], idv[b], idv[c], NN, NN, NN); else tri(idv[a], idv[c], idv[b], NN, NN, NN);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  // Malla de vista: sin indexar, con las normales analíticas.
  const rp = new Float32Array(idx.length * 3);
  for (let t = 0; t < idx.length; t++) { const o = idx[t] * 3; rp[t * 3] = pos[o]; rp[t * 3 + 1] = pos[o + 1]; rp[t * 3 + 2] = pos[o + 2]; }
  const normales = new Float32Array(nr);
  if (normalesExtra.length) {
    // Las esquinas de triángulo que tocan vértices de una rejilla toman la normal de la superficie.
    const nv = new Map();
    for (const [v, x, y, z] of normalesExtra) nv.set(v, [x, y, z]);
    // Solo los triángulos de la rejilla: los de la tapa que tocan el contorno siguen planos (si no, los
    // triángulos largos de la tapa interpolaban una normal inclinada y se veían vetas).
    for (const [a, b] of rangosRejilla) for (let t = a * 3; t < b * 3; t++) {
      const n = nv.get(idx[t]);
      if (n) { normales[t * 3] = n[0]; normales[t * 3 + 1] = n[1]; normales[t * 3 + 2] = n[2]; }
    }
  }
  const render = new THREE.BufferGeometry();
  render.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  render.setAttribute('normal', new THREE.BufferAttribute(normales, 3));
  return { geo, render };
}

function dentroPoligono([x, y], anillos) {
  const dentro = (an) => {
    let c = false;
    for (let i = 0, j = an.length - 1; i < an.length; j = i++) {
      const [xi, yi] = an[i], [xj, yj] = an[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  return dentro(anillos[0]) && !anillos.slice(1).some(dentro);
}

// Cose una rejilla de relieve: crea sus vértices (z = grosor + h arriba, −h abajo), los triángulos de las
// celdas (diagonal más corta en 3D) y devuelve los lazos del contorno (coordenadas + ids) para la tapa.
function coserRelieve(r, grosor, anadir, tri, triCuenta) {
  const { nx, ny } = r;
  const { lazos, dentro, K } = contornosRejilla(r);
  const arriba = r.cara === 'arriba';
  const id = new Int32Array((nx + 1) * K).fill(-1);
  const P = new Float64Array((nx + 1) * K * 3);
  const vert = (i, j) => {
    const k = i * K + j;
    if (id[k] >= 0) return id[k];
    const [x, y] = r.pos(i, j);
    const h = r.altura(x, y) || 0;
    const z = arriba ? grosor + h : -h;
    P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z;
    id[k] = anadir(x, y, z);
    return id[k];
  };
  const usadoEn = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && dentro[i * ny + j] === 1;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (!dentro[i * ny + j]) continue;
    vert(i, j); vert(i + 1, j); vert(i + 1, j + 1); vert(i, j + 1);
  }
  const N = [0, 0, arriba ? 1 : -1];
  const triIni = triCuenta();
  const p3 = (i, j) => { const k = (i * K + j) * 3; return [P[k], P[k + 1], P[k + 2]]; };
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const triO = (A, B, C, ia, ib, ic) => {
    const ar = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
    if ((ar > 0) === arriba) tri(ia, ib, ic, N, N, N); else tri(ia, ic, ib, N, N, N);
  };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (!dentro[i * ny + j]) continue;
    const a = p3(i, j), b = p3(i + 1, j), c = p3(i + 1, j + 1), d = p3(i, j + 1);
    const ia = id[i * K + j], ib = id[(i + 1) * K + j], ic = id[(i + 1) * K + j + 1], idd = id[i * K + j + 1];
    if (d2(a, c) <= d2(b, d)) { triO(a, b, c, ia, ib, ic); triO(a, c, d, ia, ic, idd); }
    else { triO(a, b, d, ia, ib, idd); triO(b, c, d, ib, ic, idd); }
  }
  // Normales de la superficie (diferencias centrales en la rejilla).
  const normales = [];
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    const k = i * K + j;
    if (id[k] < 0) continue;
    const ok = (ii, jj) => ii >= 0 && jj >= 0 && ii <= nx && jj <= ny && id[ii * K + jj] >= 0;
    const ia = ok(i + 1, j) ? i + 1 : i, ib = ok(i - 1, j) ? i - 1 : i;
    const ja = ok(i, j + 1) ? j + 1 : j, jb = ok(i, j - 1) ? j - 1 : j;
    const A = p3(ia, j), B = p3(ib, j), C = p3(i, ja), D = p3(i, jb);
    const tx = [A[0] - B[0], A[1] - B[1], A[2] - B[2]], ty = [C[0] - D[0], C[1] - D[1], C[2] - D[2]];
    let n = [tx[1] * ty[2] - tx[2] * ty[1], tx[2] * ty[0] - tx[0] * ty[2], tx[0] * ty[1] - tx[1] * ty[0]];
    const L = Math.hypot(...n) || 1;
    n = n.map((v) => v / L);
    if ((n[2] < 0) === arriba) n = n.map((v) => -v);
    normales.push([id[k], ...n]);
  }
  void usadoEn;
  const triFin = triCuenta();
  return {
    rango: [triIni, triFin],
    lazos: lazos.map((l) => ({ xy: l.map((k) => [P[k * 3], P[k * 3 + 1]]), ids: l.map((k) => id[k]) })),
    normales,
  };
}

function ruido(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function areaAnillo2(pts) {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}

// Ancho local del trazo en cada vértice → tope del redondeo (40 % del ancho, como máximo bsMax).
// Se busca, con una rejilla, el segmento «del otro lado» más cercano: uno de cualquier otro anillo, o
// del mismo anillo cuando el camino por el contorno es bastante más largo que la distancia en línea recta.
function anchoLocal(anillos, bsMax) {
  const R = bsMax * 2.6;
  const celda = Math.max(R, 0.05);
  const rejilla = new Map();
  const clave = (cx, cy) => cx * 73856093 ^ cy * 19349663;
  const largos = anillos.map((pts) => {
    const s = new Float64Array(pts.length + 1);
    for (let i = 0; i < pts.length; i++) { const q = pts[(i + 1) % pts.length]; s[i + 1] = s[i] + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]); }
    return s;
  });
  anillos.forEach((pts, k) => pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const x0 = Math.floor(Math.min(p[0], q[0]) / celda), x1 = Math.floor(Math.max(p[0], q[0]) / celda);
    const y0 = Math.floor(Math.min(p[1], q[1]) / celda), y1 = Math.floor(Math.max(p[1], q[1]) / celda);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const c = clave(cx, cy);
      let l = rejilla.get(c); if (!l) rejilla.set(c, l = []);
      l.push(k, i);
    }
  }));
  // Ancho local = distancia, por la bisectriz hacia el material, hasta el primer contorno que se cruza
  // (rayo contra los segmentos de la rejilla). Da un ancho estable, sin los saltos de buscar «el punto
  // más cercano», que dejaba el canto ondulado en las puntas de las letras.
  return anillos.map((pts, k) => {
    const n = pts.length, s = largos[k];
    const lim = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], p = pts[i], b = pts[(i + 1) % n];
      let e1x = p[0] - a[0], e1y = p[1] - a[1]; const l1 = Math.hypot(e1x, e1y) || 1;
      let e2x = b[0] - p[0], e2y = b[1] - p[1]; const l2 = Math.hypot(e2x, e2y) || 1;
      let ix = -e1y / l1 - e2y / l2, iy = e1x / l1 + e2x / l2; // hacia el material (izquierda)
      const li = Math.hypot(ix, iy);
      if (li < 1e-9) { ix = -e2y / l2; iy = e2x / l2; } else { ix /= li; iy /= li; }
      const [px, py] = p;
      const ex = px + ix * R, ey = py + iy * R;
      let mejor = R;
      const cx0 = Math.floor(Math.min(px, ex) / celda), cx1 = Math.floor(Math.max(px, ex) / celda);
      const cy0 = Math.floor(Math.min(py, ey) / celda), cy1 = Math.floor(Math.max(py, ey) / celda);
      for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) {
        const l = rejilla.get(clave(cx, cy));
        if (!l) continue;
        for (let m = 0; m < l.length; m += 2) {
          const kk = l[m], j = l[m + 1];
          if (kk === k) { const dj = Math.min((j - i + n) % n, (i - j + n) % n); if (dj <= 1 || (j + 1) % n === i) continue; }
          const A = anillos[kk][j], B = anillos[kk][(j + 1) % anillos[kk].length];
          const sx = B[0] - A[0], sy = B[1] - A[1];
          const den = ix * sy - iy * sx;
          if (Math.abs(den) < 1e-12) continue;
          const wx = A[0] - px, wy = A[1] - py;
          const t = (wx * sy - wy * sx) / den, u = (wx * iy - wy * ix) / den;
          if (t > 1e-6 && t < mejor && u >= 0 && u <= 1) mejor = t;
        }
      }
      lim[i] = Math.min(bsMax, mejor * 0.38);
    }
    // Variación gradual a lo largo del contorno (pendiente ≤ 0,5), dos pasadas por la vuelta.
    for (let pasada = 0; pasada < 2; pasada++) {
      for (let i = 0; i < 2 * n; i++) {
        const a = i % n, b = (i + 1) % n;
        const L = s[a + 1] - s[a];
        if (lim[b] > lim[a] + 0.35 * L) lim[b] = lim[a] + 0.35 * L;
      }
      for (let i = 2 * n; i > 0; i--) {
        const a = i % n, b = (i - 1 + n) % n;
        const L = s[b + 1] - s[b];
        if (lim[b] > lim[a] + 0.35 * L) lim[b] = lim[a] + 0.35 * L;
      }
    }
    return lim;
  });
}

// Por vértice: ins = [x, y, dx, dy, d] (punto del contorno, vector de inserción hacia el material y su
// magnitud), nv = normal exterior suavizada, ne = normal exterior de la arista (i, i+1), esquina = giro > 42°.
function insertarAnillo(pts, limite) {
  const n = pts.length;
  const d = Float64Array.from(limite);
  const dir = [], nv = [], ne = [], esquina = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = pts[i], b = pts[(i + 1) % n];
    let ex = b[0] - p[0], ey = b[1] - p[1]; const l = Math.hypot(ex, ey) || 1; ex /= l; ey /= l;
    ne.push([ey, -ex]); // exterior = a la derecha del recorrido
  }
  const cosEsquina = Math.cos((42 * Math.PI) / 180);
  for (let i = 0; i < n; i++) {
    const n1 = ne[(i - 1 + n) % n], n2 = ne[i];
    let nx = n1[0] + n2[0], ny = n1[1] + n2[1];
    const ln = Math.hypot(nx, ny);
    if (ln < 1e-9) { nx = n2[0]; ny = n2[1]; } else { nx /= ln; ny /= ln; }
    nv.push([nx, ny]);
    if (n1[0] * n2[0] + n1[1] * n2[1] < cosEsquina) esquina[i] = 1;
    const cosm = Math.max(0.5, nx * n2[0] + ny * n2[1]); // limita el inglete a 2×
    dir.push([-nx / cosm, -ny / cosm]);
  }
  // Reducimos el redondeo donde una arista insertada se invierte o se cruza con sus vecinas.
  const q = (i) => [pts[i][0] + dir[i][0] * d[i], pts[i][1] + dir[i][1] * d[i]];
  for (let iter = 0; iter < 10; iter++) {
    let malos = 0;
    for (let i = 0; i < n; i++) {
      if (!d[i] && !d[(i + 1) % n]) continue;
      const i2 = (i + 1) % n;
      const ex = pts[i2][0] - pts[i][0], ey = pts[i2][1] - pts[i][1];
      const [ax, ay] = q(i), [bx, by] = q(i2);
      let mal = (bx - ax) * ex + (by - ay) * ey <= 0;
      if (!mal) {
        for (let k = 2; k <= 6 && !mal; k++) {
          const j = (i + k) % n, j2 = (j + 1) % n;
          if (j === i || j2 === i) continue;
          mal = cruzan([ax, ay], [bx, by], q(j), q(j2));
        }
      }
      if (mal) { malos++; d[i] *= 0.5; d[i2] *= 0.5; if (iter >= 8) { d[i] = 0; d[i2] = 0; } }
    }
    if (!malos) break;
  }
  return { ins: pts.map((p, i) => [p[0], p[1], dir[i][0] * d[i], dir[i][1] * d[i], d[i]]), nv, ne, esquina };
}

function cruzan(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// ---------------------------------------------------------------------------------------------
// Anillo: perfil cerrado (r, z) revolucionado alrededor del eje Z
// ---------------------------------------------------------------------------------------------

function arco(cx, cz, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(t), cz + r * Math.sin(t)]);
  }
  return out;
}

// Devuelve el perfil como lista de puntos { r, z, ext } recorrido en sentido antihorario en el plano (r, z).
export function perfilAnillo(p) {
  const ri = diametroInterior(p.talla) / 2;
  const g = p.grosor, w = p.ancho, hw = w / 2;
  const pts = [];
  const add = (lista, ext) => lista.forEach(([r, z]) => pts.push({ r, z, ext }));
  const N = 28;
  if (p.perfil === 'plano' || p.perfil === 'facetado') {
    const c = Math.min(0.3, g * 0.18, hw * 0.3);      // redondeo de cantos
    const ch = p.perfil === 'facetado' ? Math.min(g * 0.3, hw * 0.35) : 0; // chaflán exterior
    // interior (r = ri) de abajo hacia arriba se recorre al final; empezamos abajo-interior.
    add(arco(ri + c, -hw + c, c, Math.PI, Math.PI * 1.5, 5), false);           // canto inferior interno
    if (ch) {
      add([[ri + g - ch, -hw], [ri + g, -hw + ch]], true);
      add([[ri + g, hw - ch], [ri + g - ch, hw]], true);
    } else {
      add(arco(ri + g - c, -hw + c, c, -Math.PI / 2, 0, 5), true);
      add(arco(ri + g - c, hw - c, c, 0, Math.PI / 2, 5), true);
    }
    add(arco(ri + c, hw - c, c, Math.PI / 2, Math.PI, 5), false);
  } else if (p.perfil === 'media_cana') {
    const e = g * 0.32, c = Math.min(0.2, e * 0.4);
    add(arco(ri + c, -hw + c, c, Math.PI, Math.PI * 1.5, 4), false);
    for (let i = 0; i <= N; i++) {
      const z = -hw + (w * i) / N;
      const u = Math.min(1, Math.abs(z / hw));
      add([[ri + e + (g - e) * Math.sqrt(Math.max(0, 1 - u * u)), z]], true);
    }
    add(arco(ri + c, hw - c, c, Math.PI / 2, Math.PI, 4), false);
  } else { // cómodo: interior y exterior abombados
    const b = g * 0.22, d = g * 0.3;
    const filo = g - b - d;                 // espesor en el canto
    const c = Math.min(filo * 0.45, 0.3);
    // canto inferior redondo
    add(arco(ri + b + c, -hw + c, c, Math.PI, Math.PI * 1.5, 5), false);
    add(arco(ri + b + filo - c, -hw + c, c, -Math.PI / 2, 0, 5), true);
    for (let i = 1; i < N; i++) {
      const z = -hw + c + ((w - 2 * c) * i) / N;
      const u = z / hw;
      add([[ri + g - d * u * u, z]], true);
    }
    add(arco(ri + b + filo - c, hw - c, c, 0, Math.PI / 2, 5), true);
    add(arco(ri + b + c, hw - c, c, Math.PI / 2, Math.PI, 5), false);
    for (let i = N - 1; i >= 1; i--) {
      const z = -hw + c + ((w - 2 * c) * i) / N;
      const u = z / hw;
      add([[ri + b * u * u, z]], false);
    }
    return limpiarPerfil(pts);
  }
  return limpiarPerfil(pts);
}

function limpiarPerfil(pts) {
  const out = [];
  for (const q of pts) {
    const u = out[out.length - 1];
    if (!u || Math.hypot(u.r - q.r, u.z - q.z) > 1e-5) out.push(q);
  }
  if (out.length > 2 && Math.hypot(out[0].r - out[out.length - 1].r, out[0].z - out[out.length - 1].z) < 1e-5) out.pop();
  return out;
}

export function mallaAnillo(p) {
  const perfil = perfilAnillo(p);
  const facetas = p.perfil === 'facetado' ? 16 : 0;
  const seg = facetas ? facetas * 8 : 192;
  const n = perfil.length;
  const pos = new Float32Array(seg * n * 3);
  for (let j = 0; j < seg; j++) {
    const t = (j / seg) * Math.PI * 2;
    let k = 1;
    if (facetas) {
      const a = (Math.PI * 2) / facetas;
      const phi = ((t % a) + a) % a - a / 2;
      k = Math.cos(a / 2) / Math.cos(phi); // puntos sobre la cara plana de la faceta
    }
    const c = Math.cos(t), s = Math.sin(t);
    for (let i = 0; i < n; i++) {
      const q = perfil[i];
      const r = q.ext && facetas ? q.r * k : q.r;
      const o = (j * n + i) * 3;
      pos[o] = r * c; pos[o + 1] = r * s; pos[o + 2] = q.z;
    }
  }
  const idx = [];
  for (let j = 0; j < seg; j++) {
    const j2 = (j + 1) % seg;
    for (let i = 0; i < n; i++) {
      const i2 = (i + 1) % n;
      const a = j * n + i, b = j * n + i2, c = j2 * n + i, d = j2 * n + i2;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  if (volumen(geo) < 0) invertir(geo);
  return geo;
}

function invertir(geo) {
  const ix = geo.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  geo.index.needsUpdate = true;
}

// ---------------------------------------------------------------------------------------------
// Verificaciones
// ---------------------------------------------------------------------------------------------

function triangulos(geo, fn) {
  const p = geo.attributes.position.array;
  const ix = geo.index ? geo.index.array : null;
  const nt = ix ? ix.length / 3 : p.length / 9;
  for (let t = 0; t < nt; t++) {
    const a = ix ? ix[t * 3] : t * 3, b = ix ? ix[t * 3 + 1] : t * 3 + 1, c = ix ? ix[t * 3 + 2] : t * 3 + 2;
    fn(a, b, c, p);
  }
  return nt;
}

// Volumen en mm³ por suma de tetraedros firmados (origen, a, b, c).
export function volumen(geo) {
  let v = 0;
  triangulos(geo, (a, b, c, p) => {
    const ax = p[a * 3], ay = p[a * 3 + 1], az = p[a * 3 + 2];
    const bx = p[b * 3], by = p[b * 3 + 1], bz = p[b * 3 + 2];
    const cx = p[c * 3], cy = p[c * 3 + 1], cz = p[c * 3 + 2];
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  });
  return v / 6;
}

// Malla indexada soldada por posición (rejilla de 0,1 µm, como un laminador al leer el STL).
// Propia y numérica: mergeVertices de three arma claves de texto y costaba ~1 s en nombres largos.
export function soldar(geo) {
  const p = geo.attributes.position.array;
  const nv = p.length / 3;
  const remap = new Uint32Array(nv);
  const tabla = new Map();
  const nuevas = [];
  const q = 1e4;
  for (let i = 0; i < nv; i++) {
    const x = Math.round(p[i * 3] * q), y = Math.round(p[i * 3 + 1] * q), z = Math.round(p[i * 3 + 2] * q);
    const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) | 0;
    let l = tabla.get(h), id = -1;
    if (l) { for (const k of l) if (nuevas[k * 3] === x && nuevas[k * 3 + 1] === y && nuevas[k * 3 + 2] === z) { id = k; break; } }
    if (id < 0) {
      id = nuevas.length / 3;
      nuevas.push(x, y, z);
      if (l) l.push(id); else tabla.set(h, [id]);
    }
    remap[i] = id;
  }
  const ix = geo.index ? geo.index.array : null;
  const nIdx = ix ? ix.length : nv;
  const idx = new Uint32Array(nIdx);
  for (let t = 0; t < nIdx; t++) idx[t] = remap[ix ? ix[t] : t];
  const pos = new Float32Array(nuevas.length);
  for (let i = 0; i < nuevas.length; i++) pos[i] = nuevas[i] / q;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// Cada arista debe estar en exactamente 2 triángulos y con orientación opuesta.
// Valor por arista codificado como n·64 + (suma de sentidos + 32).
export function verificarManifold(geoSoldada) {
  const aristas = new Map();
  let degenerados = 0;
  const arista = (u, v) => {
    const k = u < v ? u * 4294967296 + v : v * 4294967296 + u;
    const e = aristas.get(k);
    aristas.set(k, (e ?? 32) + 64 + (u < v ? 1 : -1));
  };
  const nt = triangulos(geoSoldada, (a, b, c) => {
    if (a === b || b === c || a === c) { degenerados++; return; }
    arista(a, b); arista(b, c); arista(c, a);
  });
  let abiertas = 0, multiples = 0, malOrientadas = 0;
  for (const e of aristas.values()) {
    const n = Math.floor(e / 64), s = (e % 64) - 32;
    if (n === 1) abiertas++;
    else if (n > 2) multiples++;
    else if (s !== 0) malOrientadas++;
  }
  return {
    manifold: abiertas === 0 && multiples === 0 && malOrientadas === 0 && degenerados === 0,
    triangulos: nt, aristas: aristas.size, abiertas, multiples, malOrientadas, degenerados,
  };
}

export function contarComponentes(geoSoldada) {
  const nv = geoSoldada.attributes.position.count;
  const padre = new Int32Array(nv).map((_, i) => i);
  const raiz = (x) => { while (padre[x] !== x) { padre[x] = padre[padre[x]]; x = padre[x]; } return x; };
  const une = (a, b) => { a = raiz(a); b = raiz(b); if (a !== b) padre[a] = b; };
  const usado = new Uint8Array(nv);
  triangulos(geoSoldada, (a, b, c) => { une(a, b); une(b, c); usado[a] = usado[b] = usado[c] = 1; });
  const s = new Set();
  for (let i = 0; i < nv; i++) if (usado[i]) s.add(raiz(i));
  return s.size;
}

export function caja3D(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  return { x: b.max.x - b.min.x, y: b.max.y - b.min.y, z: b.max.z - b.min.z };
}

// Normales con pliegue: suaves en curvas, nítidas en los cantos.
export function normalesRender(geo, angulo = 32) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  return toCreasedNormals(g, (angulo * Math.PI) / 180);
}
