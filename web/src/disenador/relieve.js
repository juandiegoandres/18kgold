// Relieves: campos de alturas sobre una región de la tapa (frente de medalla, Cristo de la cruz, asiento de
// piedra). Módulo puro (sin DOM): se usa en el Worker y en la prueba de Node.
//
// Un «relieve» es una REJILLA estructurada (i, j) → (x, y) con una máscara de celdas y una función de
// altura. malla.extruir() la cose a la tapa: el contorno de la rejilla entra como un hueco más en la
// triangulación de la tapa y comparte sus vértices con las celdas, así que la malla sigue cerrada.
//   { cara: 'arriba'|'abajo', nx, ny, pos(i,j) → [x,y], celda(i,j) → bool, altura(x,y) → mm, centro:[x,y] }
// La altura es hacia afuera de la cara (en 'abajo' se resta en z).

import { aplanarComandos, glifoAMulti, transformarMulti, cajaMulti, desplazar } from './geometria2d.js';

const TAU = Math.PI * 2;
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------------------------
// Lienzo de alturas (raster en mm) con muestreo bilineal
// ---------------------------------------------------------------------------------------------
export function lienzo(x0, y0, x1, y1, res = 0.03) {
  const w = Math.max(2, Math.ceil((x1 - x0) / res) + 1), h = Math.max(2, Math.ceil((y1 - y0) / res) + 1);
  return { x0, y0, res, w, h, datos: new Float32Array(w * h) };
}
export function muestrear(L, x, y) {
  const fx = (x - L.x0) / L.res, fy = (y - L.y0) / L.res;
  if (fx < 0 || fy < 0 || fx > L.w - 1 || fy > L.h - 1) return 0;
  const i = Math.min(L.w - 2, Math.floor(fx)), j = Math.min(L.h - 2, Math.floor(fy));
  const u = fx - i, v = fy - j, d = L.datos, w = L.w;
  const a = d[j * w + i], b = d[j * w + i + 1], c = d[(j + 1) * w + i], e = d[(j + 1) * w + i + 1];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
}
// Aplica f(x, y, valorActual) → nuevo valor a cada píxel.
export function pintar(L, f) {
  const { w, h, datos, x0, y0, res } = L;
  for (let j = 0; j < h; j++) { const y = y0 + j * res; for (let i = 0; i < w; i++) { const k = j * w + i; datos[k] = f(x0 + i * res, y, datos[k]); } }
}

// Relleno par-impar de un multipolígono en una máscara (Float32 0/1) del tamaño del lienzo.
export function rasterizar(mp, L) {
  const { w, h, x0, y0, res } = L;
  const m = new Float32Array(w * h);
  const aristas = [];
  for (const pol of mp) for (const an of pol) for (let i = 0, n = an.length; i < n; i++) {
    const a = an[i], b = an[(i + 1) % n];
    if (a[1] !== b[1]) aristas.push(a[1] < b[1] ? [a[0], a[1], b[0], b[1]] : [b[0], b[1], a[0], a[1]]);
  }
  aristas.sort((p, q) => p[1] - q[1]);
  const xs = [];
  for (let j = 0; j < h; j++) {
    const y = y0 + j * res;
    xs.length = 0;
    for (const [ax, ay, bx, by] of aristas) {
      if (ay > y) break;
      if (by <= y) continue;
      xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - x0) / res)), i1 = Math.min(w - 1, Math.floor((xs[k + 1] - x0) / res));
      for (let i = i0; i <= i1; i++) m[j * w + i] = 1;
    }
  }
  return m;
}

// Desenfoque de caja separable (n pasadas ≈ gaussiano). Da el «hombro» redondeado del relieve.
export function desenfocar(arr, w, h, r, pasadas = 2) {
  if (r < 1) return arr;
  let a = arr, b = new Float32Array(arr.length);
  const R = Math.round(r), k = 1 / (2 * R + 1);
  for (let p = 0; p < pasadas; p++) {
    for (let j = 0; j < h; j++) {
      let s = 0; const o = j * w;
      for (let i = -R; i <= R; i++) s += a[o + Math.min(w - 1, Math.max(0, i))];
      for (let i = 0; i < w; i++) { b[o + i] = s * k; s += a[o + Math.min(w - 1, i + R + 1)] - a[o + Math.max(0, i - R)]; }
    }
    [a, b] = [b, a];
    for (let i = 0; i < w; i++) {
      let s = 0;
      for (let j = -R; j <= R; j++) s += a[Math.min(h - 1, Math.max(0, j)) * w + i];
      for (let j = 0; j < h; j++) { b[j * w + i] = s * k; s += a[Math.min(h - 1, j + R + 1) * w + i] - a[Math.max(0, j - R) * w + i]; }
    }
    [a, b] = [b, a];
  }
  return a;
}

// Capa vectorial: multipolígono → altura con hombro redondeado (combina por máximo).
export function capaVectorial(L, mp, altura, { hombro = 0.06 } = {}) {
  if (!mp.length) return;
  let m = rasterizar(mp, L);
  m = desenfocar(m, L.w, L.h, hombro / L.res, 2);
  const d = L.datos;
  for (let k = 0; k < d.length; k++) {
    const v = smooth(0.12, 0.88, m[k]) * altura;
    if (v > d[k]) d[k] = v;
  }
}

// Mapa de alturas de imagen ({ ancho, alto, datos: Uint8Array gris }) → muestreo en u, v ∈ [0, 1] (v hacia abajo).
export function muestreoImagen(img) {
  const { ancho: w, alto: h, datos } = img;
  return (u, v) => {
    if (u <= 0 || v <= 0 || u >= 1 || v >= 1) return 0;
    const fx = u * (w - 1), fy = v * (h - 1);
    const i = Math.min(w - 2, Math.floor(fx)), j = Math.min(h - 2, Math.floor(fy));
    const a = fx - i, b = fy - j;
    const p = (ii, jj) => datos[jj * w + ii];
    return ((p(i, j) * (1 - a) + p(i + 1, j) * a) * (1 - b) + (p(i, j + 1) * (1 - a) + p(i + 1, j + 1) * a) * b) / 255;
  };
}

// ---------------------------------------------------------------------------------------------
// Rejillas
// ---------------------------------------------------------------------------------------------

// Disco (o elipse) con el mapeo concéntrico de Shirley–Chiu: cuadrado n×n → disco, celdas casi
// uniformes, sin polo en el centro. El contorno de la rejilla es una elipse con 4n vértices.
export function rejillaDisco({ cx = 0, cy = 0, rx, ry = rx, paso = 0.085, cara = 'arriba', altura }) {
  const n = Math.max(24, Math.min(300, Math.round((2 * Math.max(rx, ry)) / paso)));
  const pos = (i, j) => {
    const a = -1 + (2 * i) / n, b = -1 + (2 * j) / n;
    let r, f;
    if (a === 0 && b === 0) return [cx, cy];
    if (a * a > b * b) { r = a; f = (Math.PI / 4) * (b / a); } else { r = b; f = Math.PI / 2 - (Math.PI / 4) * (a / b); }
    return [cx + rx * r * Math.cos(f), cy + ry * r * Math.sin(f)];
  };
  return { cara, nx: n, ny: n, pos, celda: () => true, altura, centro: [cx, cy] };
}

// Rejilla rectilínea: unión de rectángulos alineados [x0, y0, x1, y1] (p. ej. los brazos de la cruz).
// Las líneas de la rejilla pasan por todos los bordes, así que el contorno es exacto.
export function rejillaRectas({ rects, paso = 0.06, cara = 'arriba', altura }) {
  const cortes = (vals) => {
    const v = [...new Set(vals.map((x) => Math.round(x * 1e6) / 1e6))].sort((a, b) => a - b);
    const out = [v[0]];
    for (let k = 1; k < v.length; k++) {
      const n = Math.max(1, Math.ceil((v[k] - v[k - 1]) / paso));
      for (let s = 1; s <= n; s++) out.push(v[k - 1] + ((v[k] - v[k - 1]) * s) / n);
    }
    return out;
  };
  const xs = cortes(rects.flatMap((r) => [r[0], r[2]]));
  const ys = cortes(rects.flatMap((r) => [r[1], r[3]]));
  const celda = (i, j) => {
    const x = (xs[i] + xs[i + 1]) / 2, y = (ys[j] + ys[j + 1]) / 2;
    return rects.some(([a, b, c, d]) => x > a && x < c && y > b && y < d);
  };
  const r0 = rects[0];
  return { cara, nx: xs.length - 1, ny: ys.length - 1, pos: (i, j) => [xs[i], ys[j]], celda, altura, centro: [(r0[0] + r0[2]) / 2, (r0[1] + r0[3]) / 2] };
}
// Distancia (hacia adentro) al borde de una unión de rectángulos: 0 en el borde, crece hacia el centro.
export function distanciaRectas(rects, x, y) {
  let d = -Infinity;
  for (const [a, b, c, e] of rects) d = Math.max(d, Math.min(x - a, c - x, y - b, e - y));
  return d;
}

export function trasladarRelieve(r, dx, dy) {
  return {
    ...r,
    pos: (i, j) => { const [x, y] = r.pos(i, j); return [x + dx, y + dy]; },
    altura: (x, y) => r.altura(x - dx, y - dy),
    centro: [r.centro[0] + dx, r.centro[1] + dy],
  };
}

// Contornos de la máscara de celdas en el espacio de índices (lazos de claves i·(ny+1)+j), recorridos
// con el material a la izquierda en el espacio (i, j). En un pellizco diagonal se gira a la izquierda.
export function contornosRejilla(r) {
  const { nx, ny, celda } = r;
  const K = ny + 1;
  const dentro = new Uint8Array(nx * ny);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) dentro[i * ny + j] = celda(i, j) ? 1 : 0;
  const en = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && dentro[i * ny + j] === 1;
  const sal = new Map();
  const poner = (a, b) => { let l = sal.get(a); if (!l) sal.set(a, l = []); l.push(b); };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (!en(i, j)) continue;
    const v00 = i * K + j, v10 = (i + 1) * K + j, v11 = (i + 1) * K + j + 1, v01 = i * K + j + 1;
    if (!en(i, j - 1)) poner(v00, v10);
    if (!en(i + 1, j)) poner(v10, v11);
    if (!en(i, j + 1)) poner(v11, v01);
    if (!en(i - 1, j)) poner(v01, v00);
  }
  const lazos = [];
  const dir = (a, b) => [Math.floor(b / K) - Math.floor(a / K), (b % K) - (a % K)];
  for (const [ini, lista] of sal) {
    while (lista.length) {
      const lazo = [ini];
      let prev = ini, act = lista.pop();
      let guardia = 0;
      while (act !== ini && guardia++ < 1e7) {
        lazo.push(act);
        const op = sal.get(act);
        let k = 0;
        if (op.length > 1) {
          const [dx, dy] = dir(prev, act);
          let mejor = -Infinity;
          op.forEach((b, q) => { const [ex, ey] = dir(act, b); const giro = dx * ey - dy * ex; if (giro > mejor) { mejor = giro; k = q; } });
        }
        prev = act;
        act = op.splice(k, 1)[0];
      }
      lazos.push(lazo);
    }
  }
  return { lazos, dentro, K };
}

// ---------------------------------------------------------------------------------------------
// Texto vectorial para relieves (letras sueltas y leyendas en arco)
// ---------------------------------------------------------------------------------------------
function glifoMulti(fuente, ch, tam) {
  const g = fuente.charToGlyph(ch);
  const p = g.getPath(0, 0, tam, undefined, fuente);
  return { mp: glifoAMulti(aplanarComandos(p.commands, tam * 0.002)), avance: (g.advanceWidth || 0) * (tam / fuente.unitsPerEm) };
}
// Mayúscula centrada en (cx, cy) con alto de caja `alto` mm, rotada `rot`.
export function letra(fuente, ch, cx, cy, alto, rot = 0) {
  const { mp } = glifoMulti(fuente, ch, 100);
  if (!mp.length) return [];
  const c = cajaMulti(mp);
  const s = alto / (c.alto || 1);
  const centrado = transformarMulti(mp, { dx: -(c.x0 + c.ancho / 2), dy: -(c.y0 + c.alto / 2) });
  return transformarMulti(centrado, { s, rot, dx: cx, dy: cy });
}
// Leyenda en arco, letras de pie hacia afuera, en sentido horario, centrada en el ángulo `centro` (rad).
// `alto` = alto de mayúscula; la base de las letras queda en el radio `r`.
export function textoEnArco(fuente, texto, { cx = 0, cy = 0, r, alto, centro = Math.PI / 2, espaciado = 0.12 }) {
  const tam = 100;
  const capas = Array.from(texto).map((ch) => (ch === ' ' ? { mp: [], avance: tam * 0.28 } : glifoMulti(fuente, ch, tam)));
  const ref = glifoMulti(fuente, 'H', tam).mp;
  const s = alto / (cajaMulti(ref).alto || 1);
  const avances = capas.map((c) => (c.avance + espaciado * tam) * s);
  const total = avances.reduce((a, b) => a + b, 0) - espaciado * tam * s;
  let a = centro + total / 2 / r;
  const out = [];
  capas.forEach((c, k) => {
    const w = avances[k];
    const th = a - (c.avance * s) / 2 / r;
    if (c.mp.length) {
      const loc = transformarMulti(c.mp, { s, dx: -(c.avance * s) / 2 });
      for (const pol of loc) out.push(pol.map((an) => an.map(([x, y]) => [
        cx + (r + y) * Math.cos(th) + x * Math.sin(th),
        cy + (r + y) * Math.sin(th) - x * Math.cos(th),
      ])));
    }
    a -= w / r;
  });
  return { mp: out, angulo: total / r };
}
// Letras repartidas a ángulos fijos (leyenda de San Benito: una letra por posición).
export function letrasEnArco(fuente, letras, { cx = 0, cy = 0, r, alto, desde, hasta }) {
  const out = [];
  const n = letras.length;
  letras.forEach((ch, k) => {
    if (ch === ' ') return;
    const th = desde + ((hasta - desde) * (k + 0.5)) / n;
    const g = letra(fuente, ch, 0, 0, alto);
    const ctr = transformarMulti(g, { dy: alto / 2 });
    for (const pol of ctr) out.push(pol.map((an) => an.map(([x, y]) => [
      cx + (r + y) * Math.cos(th) + x * Math.sin(th),
      cy + (r + y) * Math.sin(th) - x * Math.cos(th),
    ])));
  });
  return out;
}

export function espejoX(mp) {
  return mp.map((pol) => pol.map((an) => an.map(([x, y]) => [-x, y]).reverse()));
}
export { desplazar, TAU };
