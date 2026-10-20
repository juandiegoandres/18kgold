// Montaje en 3D: tejido en nylon (5 patrones), cadena de oro (5 estilos) y balines, a lo largo de un
// recorrido. Todo liviano: tubos simples + InstancedMesh para nudos y eslabones. Medidas en mm.

import * as THREE from 'three';
import { HILO } from './montaje.js';

// ---------------------------------------------------------------------------------------------
// Recorrido con marcos de referencia (T tangente, N «hacia fuera del cuerpo», B = T × N)
// ---------------------------------------------------------------------------------------------

export class Recorrido {
  constructor(puntos, { cerrado = false, eje = null, paso = 0.5 } = {}) {
    // Sin puntos repetidos (un tramo de largo cero deja la tangente indefinida).
    puntos = puntos.filter((q, i) => i === 0 || q.distanceTo(puntos[i - 1]) > 0.05);
    if (cerrado && puntos.length > 2 && puntos[0].distanceTo(puntos[puntos.length - 1]) < 0.05) puntos = puntos.slice(0, -1);
    const curva = new THREE.CatmullRomCurve3(puntos, cerrado, 'centripetal', 0.5);
    const L = curva.getLength();
    const n = Math.max(16, Math.ceil(L / paso));
    this.cerrado = cerrado;
    this.largo = L;
    this.n = n;
    this.p = []; this.T = []; this.N = []; this.B = [];
    const up = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = curva.getPointAt(cerrado ? u % 1 : u);
      const T = curva.getTangentAt(cerrado ? u % 1 : u).normalize();
      // «Fuera»: desde el eje del cuerpo (línea vertical) o hacia la cámara si no hay eje.
      let o;
      if (eje) { o = new THREE.Vector3(p.x - eje.x, 0, p.z - eje.z); if (o.lengthSq() < 1e-6) o.copy(up); }
      else o = up.clone();
      o.sub(T.clone().multiplyScalar(o.dot(T)));
      if (o.lengthSq() < 1e-8) o = new THREE.Vector3(0, 1, 0).sub(T.clone().multiplyScalar(T.y));
      o.normalize();
      // Continuidad: evitamos saltos bruscos del marco.
      if (i > 0 && o.dot(this.N[i - 1]) < 0.2) o.lerp(this.N[i - 1], 0.6).normalize();
      this.p.push(p); this.T.push(T); this.N.push(o); this.B.push(new THREE.Vector3().crossVectors(T, o).normalize());
    }
  }

  // Muestra en la longitud s (mm).
  en(s) {
    const L = this.largo;
    if (this.cerrado) s = ((s % L) + L) % L; else s = Math.min(L, Math.max(0, s));
    const f = (s / L) * this.n, i = Math.min(this.n - 1, Math.floor(f)), t = f - i;
    const lerp = (a) => a[i].clone().lerp(a[i + 1], t);
    const T = lerp(this.T).normalize(), N = lerp(this.N).normalize();
    return { p: lerp(this.p), T, N, B: new THREE.Vector3().crossVectors(T, N).normalize() };
  }

  // Desplazamiento en el marco: p + N·a + B·b
  punto(s, a = 0, b = 0) {
    const m = this.en(s);
    return m.p.add(m.N.multiplyScalar(a)).add(m.B.multiplyScalar(b));
  }
}

// Tubo a lo largo de una función s → punto, con radio que puede variar.
function tubo(fn, s0, s1, radio, { paso = 0.6, radial = 10 } = {}) {
  const n = Math.max(4, Math.ceil(Math.abs(s1 - s0) / paso));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(fn(s0 + ((s1 - s0) * i) / n));
  const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const g = new THREE.TubeGeometry(curva, n * 2, 1, radial, false);
  // Radio variable: escalamos cada anillo respecto a su centro.
  const pos = g.attributes.position, nr = g.attributes.normal;
  const v = new THREE.Vector3();
  for (let j = 0; j <= n * 2; j++) {
    const s = s0 + ((s1 - s0) * j) / (n * 2);
    const r = typeof radio === 'function' ? radio(s) : radio;
    const c = curva.getPointAt(j / (n * 2));
    for (let k = 0; k <= radial; k++) {
      const idx = j * (radial + 1) + k;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  void nr;
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

// Textura de fibra (relieve): estrías finas diagonales, sin color. Se usa como bumpMap.
let texFibra = null;
function texturaFibra() {
  if (texFibra) return texFibra;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 128, 128);
  for (let i = -128; i < 256; i += 4) {
    g.strokeStyle = i % 8 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)';
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 128); g.stroke();
  }
  texFibra = new THREE.CanvasTexture(c);
  texFibra.wrapS = texFibra.wrapT = THREE.RepeatWrapping;
  texFibra.repeat.set(6, 1);
  return texFibra;
}

export function materialHilo(color, satinado = false) {
  const hex = HILO[color]?.hex || HILO.negro.hex;
  const claro = new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.35);
  return new THREE.MeshPhysicalMaterial({
    color: hex, roughness: satinado ? 0.42 : 0.7, metalness: 0,
    sheen: satinado ? 0.5 : 0.85, sheenRoughness: satinado ? 0.3 : 0.55, sheenColor: claro,
    bumpMap: texturaFibra(), bumpScale: satinado ? 0.6 : 1.4, envMapIntensity: 0.7,
  });
}

// ---------------------------------------------------------------------------------------------
// Instancias a lo largo del recorrido
// ---------------------------------------------------------------------------------------------

function instancias(geo, mat, lista) {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, lista.length));
  im.count = lista.length;
  lista.forEach((m, i) => im.setMatrixAt(i, m));
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = true;
  return im;
}

// Matriz con ejes locales (x, y, z) = combinaciones del marco y escala.
// Siempre base directa (z = x × y): una base invertida daría vuelta los triángulos.
function matriz(p, ex, ey, ez, sx = 1, sy = 1, sz = 1) {
  const x = ex.clone().normalize();
  const y = ey.clone().sub(x.clone().multiplyScalar(ey.dot(x))).normalize();
  const z = new THREE.Vector3().crossVectors(x, y);
  void ez;
  const m = new THREE.Matrix4().makeBasis(x.multiplyScalar(sx), y.multiplyScalar(sy), z.multiplyScalar(sz));
  m.setPosition(p);
  return m;
}

const rotar = (v, eje, a) => v.clone().applyAxisAngle(eje, a);

// Tramos libres de balines (los nudos no se dibujan donde va un balín).
function libre(s, huecos) {
  for (const [a, b] of huecos) if (s > a && s < b) return false;
  return true;
}
// Factor 0..1 de «estrechamiento» cerca de un balín (los hilos entran por la perforación).
function estrechar(s, huecos, margen = 1.6) {
  let f = 1;
  for (const [a, b] of huecos) {
    if (s >= a && s <= b) return 0.18;
    const d = s < a ? a - s : s - b;
    if (d < margen) f = Math.min(f, 0.18 + 0.82 * (d / margen) ** 0.8);
  }
  return f;
}

// ---------------------------------------------------------------------------------------------
// Tejidos
// ---------------------------------------------------------------------------------------------

export const RADIO_TEJIDO = { macrame_plano: 1.9, espiral: 1.9, trenza: 1.7, cola_raton: 1.25, serpiente: 2.0 };

export function construirTejido(rec, { patron, color }, huecos = [], tramo = null) {
  const g = new THREE.Group();
  const mat = materialHilo(color, patron === 'cola_raton');
  const s0 = tramo ? tramo[0] : 0, s1 = tramo ? tramo[1] : rec.largo;
  const L = s1 - s0;
  const add = (geo, m = mat) => { const x = new THREE.Mesh(geo, m); x.castShadow = true; x.receiveShadow = true; g.add(x); return x; };

  if (patron === 'macrame_plano') {
    // Nudo cuadrado (plano): alma de dos hilos y nudos alternados que asoman como «perlas» a cada lado.
    add(tubo((s) => rec.punto(s, 0, 0.55), s0, s1, (s) => 0.55 * Math.max(0.5, estrechar(s, huecos))));
    add(tubo((s) => rec.punto(s, 0, -0.55), s0, s1, (s) => 0.55 * Math.max(0.5, estrechar(s, huecos))));
    const barra = new THREE.CapsuleGeometry(1.0, 3.3, 4, 12);   // eje Y
    const lobulo = new THREE.SphereGeometry(1, 16, 12);
    const P = 1.9, mats = [], lob = [];
    let k = 0;
    for (let s = s0 + P / 2; s < s1; s += P, k++) {
      if (!libre(s, huecos.map(([a, b]) => [a - 1.4, b + 1.4]))) continue;
      const m = rec.en(s);
      const lado = k % 2 ? 1 : -1;
      // Barra cruzada (a lo ancho de la banda), algo inclinada según el lado.
      const ey = rotar(m.B, m.N, lado * 0.22), ez = m.N, ex = new THREE.Vector3().crossVectors(ey, ez);
      mats.push(matriz(m.p.clone().add(m.N.clone().multiplyScalar(0.3)).add(m.B.clone().multiplyScalar(lado * 0.25)), ex, ey, ez, 0.95, 1, 0.7));
      // Lóbulo del lado que cierra el nudo: la vuelta del hilo exterior, alargada a lo largo.
      lob.push(matriz(m.p.clone().add(m.B.clone().multiplyScalar(lado * 2.35)), m.T, m.B, m.N, 1.55, 1.05, 0.95));
    }
    g.add(instancias(barra, mat, mats), instancias(lobulo, mat, lob));
  } else if (patron === 'espiral') {
    // Media vuelta repetida: las cabezas de los nudos giran alrededor del cordón formando una hélice.
    add(tubo((s) => rec.punto(s), s0, s1, (s) => 1.4 * Math.max(0.55, estrechar(s, huecos))));
    const geo = new THREE.CapsuleGeometry(0.78, 2.0, 4, 10);
    const lista = [];
    const P = 0.62;
    let k = 0;
    for (let s = s0; s < s1; s += P, k++) {
      if (!libre(s, huecos.map(([a, b]) => [a - 1.2, b + 1.2]))) continue;
      const m = rec.en(s);
      const a = k * 0.3;
      const r = rotar(m.N, m.T, a);
      const t = new THREE.Vector3().crossVectors(m.T, r);
      // Cabeza del nudo: alargada en la dirección tangente a la hélice.
      const ey = t.clone().multiplyScalar(0.85).add(m.T.clone().multiplyScalar(0.53)).normalize();
      const ex = new THREE.Vector3().crossVectors(ey, r).normalize();
      lista.push(matriz(m.p.clone().add(r.clone().multiplyScalar(1.3)), ex, ey, r, 1, 1, 0.85));
    }
    g.add(instancias(geo, mat, lista));
  } else if (patron === 'trenza') {
    // Trenza de tres cabos: cada cabo zigzaguea de lado a lado y sube/baja sobre los otros.
    const Pt = 5.4, A = 1.55, h = 0.55;
    for (let c = 0; c < 3; c++) {
      const fase = (c * 2 * Math.PI) / 3;
      add(tubo((s) => {
        const w = (2 * Math.PI * s) / Pt + fase;
        const f = estrechar(s, huecos, 2.2);
        return rec.punto(s, h * Math.sin(2 * w) * f, A * Math.sin(w) * f);
      }, s0, s1, 0.95, { paso: 0.35, radial: 10 }));
    }
  } else if (patron === 'cola_raton') {
    // Cola de ratón: cordón satinado redondo, liso y brillante, con torsión apenas visible.
    add(tubo((s) => rec.punto(s), s0, s1, (s) => 1.25 * Math.max(0.55, estrechar(s, huecos)), { paso: 0.8, radial: 14 }));
    const geo = new THREE.TorusGeometry(1.26, 0.07, 4, 24);
    const lista = [];
    for (let s = s0 + 1; s < s1; s += 1.8) {
      if (!libre(s, huecos.map(([a, b]) => [a - 1, b + 1]))) continue;
      const m = rec.en(s);
      const ez = m.T.clone().add(m.B.clone().multiplyScalar(0.45)).normalize();
      const ex = new THREE.Vector3().crossVectors(m.N, ez).normalize();
      const ey = new THREE.Vector3().crossVectors(ez, ex);
      lista.push(matriz(m.p, ex, ey, ez));
    }
    g.add(instancias(geo, materialHilo(color, false), lista));
  } else {
    // Serpiente: nudos en S encadenados — crestas diagonales que alternan de dirección.
    add(tubo((s) => rec.punto(s), s0, s1, (s) => 1.25 * Math.max(0.6, estrechar(s, huecos))));
    const geo = new THREE.CapsuleGeometry(0.95, 3.0, 4, 12);
    const lista = [];
    const P = 1.85;
    let k = 0;
    for (let s = s0; s < s1; s += P, k++) {
      if (!libre(s, huecos.map(([a, b]) => [a - 1.5, b + 1.5]))) continue;
      const m = rec.en(s);
      const lado = k % 2 ? 1 : -1;
      // Cresta sobre el frente, cruzada en diagonal (±42°), y otra por detrás desfasada.
      for (const [cara, sg] of [[1, lado], [-1, -lado]]) {
        const n = m.N.clone().multiplyScalar(cara);
        const ey = rotar(m.B, n, sg * 0.73);
        const ex = new THREE.Vector3().crossVectors(ey, n);
        lista.push(matriz(m.p.clone().add(n.clone().multiplyScalar(0.95)), ex, ey, n, 1, 1, 0.7));
      }
    }
    g.add(instancias(geo, mat, lista));
  }
  void L;
  return g;
}

// Cierre corredizo: un nudo plano corto (manguito) donde se cruzan los dos extremos, y dos colitas
// con su nudito final.
export function construirCorredizo(rec, s, { color }) {
  const g = new THREE.Group();
  const mat = materialHilo(color);
  const m = rec.en(s);
  const largo = 11;
  const manga = new THREE.CapsuleGeometry(2.6, largo, 6, 16);
  const ey = m.T, ez = m.N, ex = new THREE.Vector3().crossVectors(ey, ez);
  const k = new THREE.Mesh(manga, mat);
  k.applyMatrix4(matriz(m.p, ex, ey, ez, 1.2, 1, 0.8));
  k.castShadow = true;
  g.add(k);
  // Anillos del nudo sobre el manguito.
  const aro = new THREE.TorusGeometry(2.7, 0.7, 8, 22);
  const lista = [];
  for (let i = -2; i <= 2; i++) {
    const p = m.p.clone().add(m.T.clone().multiplyScalar(i * 2.4));
    lista.push(matriz(p, ex, ez, ey, 1.2, 0.85, 1));
  }
  g.add(instancias(aro, mat, lista));
  // Colitas que cuelgan (hacia abajo y fuera del cuerpo).
  for (const sg of [-1, 1]) {
    const base = m.p.clone().add(m.T.clone().multiplyScalar(sg * (largo / 2 + 1.5)));
    const fin = base.clone().add(new THREE.Vector3(0, -22, 0)).add(m.N.clone().multiplyScalar(4)).add(m.T.clone().multiplyScalar(sg * 4));
    const c = new THREE.CatmullRomCurve3([base, base.clone().lerp(fin, 0.5).add(m.N.clone().multiplyScalar(2)), fin]);
    const t = new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.9, 8, false), mat);
    t.castShadow = true;
    g.add(t);
    const nudo = new THREE.Mesh(new THREE.SphereGeometry(1.7, 14, 10), mat);
    nudo.position.copy(fin);
    g.add(nudo);
  }
  return g;
}

// ---------------------------------------------------------------------------------------------
// Cadenas de oro
// ---------------------------------------------------------------------------------------------

export const RADIO_CADENA = { rolo: 1.1, cartier: 1.0, lazo: 1.15, veneciana: 0.9, singapur: 0.9 };

export function construirCadena(rec, estilo, matOro, huecos = []) {
  const g = new THREE.Group();
  const L = rec.largo;
  if (estilo === 'lazo') {
    // Cadena lazo (soga): cuatro hilos torcidos en hélice.
    for (let c = 0; c < 4; c++) {
      const f = (c * Math.PI) / 2;
      const m = new THREE.Mesh(tubo((s) => {
        const a = (2 * Math.PI * s) / 3.6 + f;
        return rec.punto(s, 0.55 * Math.cos(a), 0.55 * Math.sin(a));
      }, 0, L, 0.42, { paso: 0.3, radial: 8 }), matOro);
      m.castShadow = true;
      g.add(m);
    }
    return g;
  }
  let geo, paso, giro = Math.PI / 2, esc = [1, 1, 1], torsion = 0;
  if (estilo === 'rolo') { geo = new THREE.TorusGeometry(1.15, 0.3, 10, 24); paso = 1.75; }
  else if (estilo === 'cartier') { geo = new THREE.TorusGeometry(1.0, 0.27, 10, 28); esc = [1, 1.85, 1]; paso = 2.95; }
  else if (estilo === 'veneciana') { geo = new THREE.TorusGeometry(1.05, 0.32, 6, 4); geo.rotateZ(Math.PI / 4); paso = 1.62; giro = Math.PI / 2; }
  else { geo = new THREE.TorusGeometry(0.95, 0.26, 8, 20); esc = [1, 1.45, 0.55]; paso = 1.05; giro = 0.55; torsion = 0.55; }
  const lista = [];
  let k = 0;
  for (let s = paso / 2; s < L; s += paso, k++) {
    if (!libre(s, huecos)) continue;
    const m = rec.en(s);
    const a = (k % 2) * giro + k * torsion;
    const ex = rotar(m.N, m.T, a), ey = m.T, ez = new THREE.Vector3().crossVectors(ex, ey);
    lista.push(matriz(m.p, ex, ey, ez, esc[0], esc[1], esc[2]));
  }
  g.add(instancias(geo, matOro, lista));
  return g;
}

// ---------------------------------------------------------------------------------------------
// Balines
// ---------------------------------------------------------------------------------------------

let geoBalin = {};
export function geometriaBalin(acabado) {
  if (geoBalin[acabado]) return geoBalin[acabado];
  let g;
  if (acabado === 'diamantado') {
    // Diamantado: facetas planas pequeñas (corte a máquina), muchas caras que destellan.
    g = new THREE.IcosahedronGeometry(1, 2).toNonIndexed();
    g.computeVertexNormals();
  } else g = new THREE.SphereGeometry(1, 40, 28);
  geoBalin[acabado] = g;
  return g;
}

// Posiciones (longitud s sobre el recorrido) de los balines.
// zona: { inicio, fin } tramo visible/útil; dije: { sA, sB } donde está la pieza (para «junto al dije»).
export function posicionesBalines({ cantidad, diametro, distribucion }, rec, { dije, extremos }) {
  if (!cantidad) return [];
  const paso = diametro + 0.35;
  const out = [];
  if (distribucion === 'junto_al_dije') {
    // Alternando a cada lado del dije, pegados.
    for (let i = 0; i < cantidad; i++) {
      const lado = i % 2 ? -1 : 1, k = Math.floor(i / 2);
      out.push(lado > 0 ? dije.sB + 1.2 + diametro / 2 + k * paso : dije.sA - 1.2 - diametro / 2 - k * paso);
    }
  } else if (distribucion === 'extremos') {
    for (let i = 0; i < cantidad; i++) {
      const lado = i % 2 ? -1 : 1, k = Math.floor(i / 2);
      out.push(lado > 0 ? extremos.sB - diametro / 2 - k * paso : extremos.sA + diametro / 2 + k * paso);
    }
  } else {
    // Repartidos a lo largo del tramo visible, en pares simétricos respecto al dije.
    const izq = Math.ceil(cantidad / 2), der = Math.floor(cantidad / 2);
    const tramoI = dije.sA - 4 - extremos.sA, tramoD = extremos.sB - dije.sB - 4;
    for (let i = 1; i <= izq; i++) out.push(dije.sA - 4 - (tramoI * i) / (izq + 1));
    for (let i = 1; i <= der; i++) out.push(dije.sB + 4 + (tramoD * i) / (der + 1));
  }
  return out.map((s) => (rec.cerrado ? s : Math.min(rec.largo - diametro, Math.max(diametro, s))));
}

export function construirBalines(rec, lista, { diametro, acabado }, matOro) {
  const geo = geometriaBalin(acabado);
  const r = diametro / 2;
  const mats = lista.map((s) => {
    const m = rec.en(s);
    return matriz(m.p, m.N, m.T, m.B, r, r, r);
  });
  const im = instancias(geo, matOro, mats);
  return im;
}
