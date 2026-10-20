// Vista «Puesta»: siluetas grises mate (busto de joyería, mano, pierna) a ESCALA REAL en mm, y la
// colocación de la pieza y del recorrido de la cadena o el tejido sobre ellas.
// Ejes del mundo: Y arriba, Z hacia la cámara, X a la derecha de quien mira. Todo en milímetros.
// Las formas se construyen como barridos de superelipses (secciones interpoladas con Catmull-Rom), con
// normales suaves: se leen como maniquíes de vitrina, sin rasgos.

import * as THREE from 'three';

export const GRIS_SILUETA = 0xbdb8ae;

// ---------------------------------------------------------------------------------------------
// Barrido de superelipses a lo largo de Y
// ---------------------------------------------------------------------------------------------

const CLAVES = ['y', 'w', 'd', 'cx', 'cz', 'n'];

function interpolar(secs, sub) {
  const s = secs.map((q) => ({ cx: 0, cz: 0, n: 2.2, ...q }));
  const out = [];
  for (let i = 0; i < s.length - 1; i++) {
    const p0 = s[Math.max(0, i - 1)], p1 = s[i], p2 = s[i + 1], p3 = s[Math.min(s.length - 1, i + 2)];
    for (let k = 0; k < sub; k++) {
      const t = k / sub, t2 = t * t, t3 = t2 * t;
      const o = {};
      for (const c of CLAVES) {
        o[c] = 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3);
      }
      // Las y deben ser monótonas y los radios positivos.
      o.y = p1.y + (p2.y - p1.y) * t;
      o.w = Math.max(0, o.w); o.d = Math.max(0, o.d);
      if (p1.w === 0 && k === 0) { o.w = 0; o.d = 0; }
      out.push(o);
    }
  }
  out.push({ ...s[s.length - 1] });
  return out;
}

// Cúpula: añade secciones que cierran el extremo con un cuarto de elipse de alto h.
function cupula(sec, h, pasos = 7, arriba = true) {
  const out = [];
  for (let i = 1; i <= pasos; i++) {
    const a = (i / pasos) * Math.PI / 2;
    out.push({ ...sec, y: sec.y + (arriba ? 1 : -1) * h * Math.sin(a), w: i === pasos ? 0 : sec.w * Math.cos(a), d: i === pasos ? 0 : sec.d * Math.cos(a) });
  }
  return arriba ? out : out.reverse();
}

const se = (c, n) => Math.sign(c) * Math.abs(c) ** (2 / n);

export function barrido(secciones, { segs = 72, sub = 6 } = {}) {
  const anillos = interpolar(secciones, sub);
  const pos = [], idx = [];
  const ids = anillos.map((r) => {
    if (r.w < 1e-6 && r.d < 1e-6) { pos.push(r.cx, r.y, r.cz); return [pos.length / 3 - 1]; }
    const fila = [];
    for (let i = 0; i < segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      pos.push(r.cx + r.w * se(Math.cos(t), r.n), r.y, r.cz + r.d * se(Math.sin(t), r.n));
      fila.push(pos.length / 3 - 1);
    }
    return fila;
  });
  const asc = anillos[anillos.length - 1].y > anillos[0].y;
  for (let j = 0; j < ids.length - 1; j++) {
    const A = ids[j], B = ids[j + 1];
    for (let i = 0; i < segs; i++) {
      const i2 = (i + 1) % segs;
      const a = A[A.length === 1 ? 0 : i], a2 = A[A.length === 1 ? 0 : i2];
      const b = B[B.length === 1 ? 0 : i], b2 = B[B.length === 1 ? 0 : i2];
      // Recorrido antihorario visto desde fuera (θ crece de +X hacia +Z).
      const quad = asc ? [a, b, a2, a2, b, b2] : [a, a2, b, a2, b2, b];
      if (A.length === 1) { idx.push(...(asc ? [a, b, b2] : [a, b2, b])); continue; }
      if (B.length === 1) { idx.push(...(asc ? [a, b, a2] : [a, a2, b])); continue; }
      idx.push(...quad);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geo: g, anillos };
}

// Superficie del barrido: sección a la altura y (interpolación lineal sobre las secciones densas).
function seccionEn(anillos, y) {
  const asc = anillos[anillos.length - 1].y > anillos[0].y;
  const lista = asc ? anillos : [...anillos].reverse();
  if (y <= lista[0].y) return lista[0];
  for (let i = 0; i < lista.length - 1; i++) {
    const a = lista[i], b = lista[i + 1];
    if (y <= b.y) {
      const t = (y - a.y) / ((b.y - a.y) || 1);
      const o = {};
      for (const c of CLAVES) o[c] = a[c] + (b[c] - a[c]) * t;
      return o;
    }
  }
  return lista[lista.length - 1];
}

// z del frente de la superficie en (x, y); null si x queda fuera de la sección.
function frenteZ(anillos, x, y) {
  const s = seccionEn(anillos, y);
  if (s.w < 1e-6) return null;
  const u = Math.abs((x - s.cx) / s.w);
  if (u >= 1) return null;
  return s.cz + s.d * (1 - u ** s.n) ** (1 / s.n);
}

function perimetroSeccion(s, segs = 96) {
  let p = 0, prev = null;
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const q = [s.w * se(Math.cos(t), s.n), s.d * se(Math.sin(t), s.n)];
    if (prev) p += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    prev = q;
  }
  return p;
}

// Anillo (curva cerrada) alrededor de una sección, inflado δ hacia fuera; θ=π/2 es el frente (+Z).
function aroAlrededor(s, delta, n = 160, inclinacion = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t), si = Math.sin(t);
    const x = s.w * se(c, s.n), z = s.d * se(si, s.n);
    // Normal aproximada de la superelipse.
    let nx = Math.sign(c) * Math.abs(c) ** (2 - 2 / s.n) / s.w, nz = Math.sign(si) * Math.abs(si) ** (2 - 2 / s.n) / s.d;
    const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
    const X = s.cx + x + nx * delta, Z = s.cz + z + nz * delta;
    pts.push(new THREE.Vector3(X, s.y - inclinacion * (Z - s.cz), Z));
  }
  return pts;
}

function largoPolilinea(pts, cerrada = false) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]);
  if (cerrada) L += pts[0].distanceTo(pts[pts.length - 1]);
  return L;
}

function material() {
  return new THREE.MeshStandardMaterial({ color: GRIS_SILUETA, roughness: 0.92, metalness: 0, envMapIntensity: 0.55 });
}

function malla(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  m.castShadow = false;
  return m;
}

// Base de la pieza: z local hacia la normal n, y local hacia «arriba» proyectado.
function base(n, arriba = new THREE.Vector3(0, 1, 0)) {
  const z = n.clone().normalize();
  const y = arriba.clone().sub(z.clone().multiplyScalar(arriba.dot(z))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Matrix4().makeBasis(x, y, z);
}

// Punto de cuelgue y extremos de la cadena en coordenadas locales de la pieza.
function enganches(pieza) {
  const a = pieza.argollas || [];
  const ri = pieza.ri || 1.4;
  if (a.length >= 2) {
    const [p, q] = a[0][0] < a[1][0] ? [a[0], a[1]] : [a[1], a[0]];
    return { dos: true, izq: new THREE.Vector3(p[0] - ri * 0.2, p[1] + ri * 0.1, 0), der: new THREE.Vector3(q[0] + ri * 0.2, q[1] + ri * 0.1, 0) };
  }
  const c = a[0] || [0, (pieza.caja?.y1 ?? 5) - ri];
  return { dos: false, punto: new THREE.Vector3(c[0], c[1] + ri * 0.55, 0) };
}

// ---------------------------------------------------------------------------------------------
// Busto (cuello y escote) — cadena o collar tejido
// ---------------------------------------------------------------------------------------------

function busto() {
  const secs = [
    { y: -262, w: 138, d: 108, cz: 8, n: 2.5 },
    { y: -230, w: 146, d: 118, cz: 8, n: 2.5 },
    { y: -170, w: 156, d: 120, cz: 6, n: 2.6 },
    { y: -112, w: 168, d: 110, cz: 2, n: 2.8 },
    { y: -76, w: 177, d: 98, cz: -1, n: 2.9 },
    { y: -58, w: 172, d: 92, cz: -3, n: 2.7 },
    { y: -42, w: 152, d: 86, cz: -5, n: 2.5 },
    { y: -26, w: 118, d: 76, cz: -7, n: 2.3 },
    { y: -12, w: 82, d: 64, cz: -9, n: 2.15 },
    { y: 0, w: 62, d: 54, cz: -10, n: 2.05 },
    { y: 22, w: 54, d: 49, cz: -10, n: 2.0 },
    { y: 70, w: 51, d: 47, cz: -9, n: 2.0 },
    { y: 100, w: 50, d: 46.5, cz: -9, n: 2.0 },
  ];
  const top = secs[secs.length - 1];
  const todo = [...cupula(secs[0], 4, 4, false), ...secs, ...cupula({ ...top, y: top.y }, 9, 7, true)];
  return barrido(todo, { segs: 96, sub: 6 });
}

function colocarCuello(pieza, largo, radioCordon) {
  const { geo, anillos } = busto();
  const grupo = new THREE.Group();
  grupo.add(malla(geo, material()));
  const yb = -2;                      // la cadena descansa en la base del cuello
  const sb = seccionEn(anillos, yb);
  const holgura = radioCordon + 0.7;
  const wb = sb.w + holgura + 3, db = sb.d + holgura + 2;
  // Mitad de atrás: elipse alrededor del cuello, de +X a −X pasando por detrás.
  const atras = [];
  for (let i = 0; i <= 48; i++) {
    const t = -(i / 48) * Math.PI; // 0 → −π (por detrás, z negativa)
    atras.push(new THREE.Vector3(wb * Math.cos(t), yb + 3 * Math.sin(-t) * 0, sb.cz + db * Math.sin(t)));
  }
  const engan = enganches(pieza);
  const g2 = pieza.grosor / 2;

  // Coloca la pieza con su centro a la altura yc sobre el pecho y devuelve el recorrido completo.
  const armar = (yc) => {
    const z0 = (frenteZ(anillos, 0, yc) ?? 100);
    const dz = ((frenteZ(anillos, 0, yc + 1) ?? z0) - (frenteZ(anillos, 0, yc - 1) ?? z0)) / 2;
    const n = new THREE.Vector3(0, -dz, 1).normalize();
    const M = base(n);
    M.setPosition(new THREE.Vector3(0, yc, z0).add(n.clone().multiplyScalar(g2 + 0.6)));
    const extremo = (p) => p.clone().applyMatrix4(M);
    const E1 = engan.dos ? extremo(engan.izq) : extremo(engan.punto);
    const E2 = engan.dos ? extremo(engan.der) : E1;
    const caida = (S, E) => {
      const pts = [];
      const D = Math.max(10, S.y - E.y);
      const P0 = [S.x, S.y], P1 = [S.x * 0.9, S.y - 0.42 * D], P2 = [E.x + (S.x - E.x) * 0.42, E.y + 0.3 * D], P3 = [E.x, E.y];
      const N = 64;
      for (let i = 0; i <= N; i++) {
        const t = i / N, u = 1 - t;
        const x = u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0];
        const y = u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1];
        const zs = frenteZ(anillos, x, y);
        let z = zs === null ? sb.cz : zs + holgura;
        // Cerca del extremo, la cadena entra a la argolla (que está algo separada de la piel).
        const k = Math.max(0, (t - 0.82) / 0.18);
        z = z * (1 - k * k) + E.z * k * k;
        pts.push(new THREE.Vector3(x, y, Math.max(z, sb.cz)));
      }
      pts[pts.length - 1].copy(E);
      return pts;
    };
    const Sder = atras[0], Sizq = atras[atras.length - 1];
    const cDer = caida(Sder, E2);          // de la nuca (der.) hasta el extremo derecho
    const cIzq = caida(Sizq, E1);
    // Recorrido: extremo izq. → sube → por detrás → baja → extremo der.
    const puntos = [...[...cIzq].reverse(), ...[...atras].reverse().slice(1, -1), ...cDer];
    const L = largoPolilinea(puntos) + (engan.dos ? 0 : 0);
    return { M, puntos, L, E1, E2 };
  };
  // Bisección: la altura del dije hace que el largo coincida con el de la cadena.
  let lo = -260, hi = -14, r = null;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    r = armar(mid);
    if (r.L > largo) lo = mid; else hi = mid;
  }
  r = armar((lo + hi) / 2);
  const yTop = 12, yBot = Math.min(r.E1.y, r.E2.y) - (pieza.caja ? (pieza.caja.y1 - pieza.caja.y0) : 30) - 20;
  return {
    silueta: grupo,
    camino: { puntos: r.puntos, cerrado: !engan.dos },
    matriz: r.M,
    anclas: { izq: r.E1, der: r.E2, dos: engan.dos },
    encuadre: { centro: new THREE.Vector3(0, (yTop + yBot) / 2 - 4, 40), alto: Math.max(150, yTop - yBot + 16), dir: new THREE.Vector3(0, 0.16, 1) },
    cierre: 0.5, // fracción del recorrido donde va el broche (en la nuca)
  };
}

// ---------------------------------------------------------------------------------------------
// Mano (muñeca para pulsera; dedo para anillo). Mano izquierda, dorso hacia la cámara, dedos arriba.
// ---------------------------------------------------------------------------------------------

function dedo(base0, dir, largo, r0, r1) {
  // Cilindro ahusado con nudillos leves y yema redonda, construido sobre +Y y luego orientado.
  const secs = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const nudillo = 1 + 0.05 * Math.exp(-(((t - 0.38) / 0.07) ** 2)) + 0.035 * Math.exp(-(((t - 0.7) / 0.06) ** 2));
    const r = (r0 + (r1 - r0) * t) * nudillo;
    secs.push({ y: t * largo, w: r, d: r * 0.92, n: 2 });
  }
  const tope = secs[secs.length - 1];
  const todo = [...cupula(secs[0], r0 * 0.6, 4, false), ...secs, ...cupula(tope, tope.w * 0.95, 7, true)];
  const { geo } = barrido(todo, { segs: 40, sub: 3 });
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  geo.applyQuaternion(q);
  geo.translate(base0.x, base0.y, base0.z);
  return geo;
}

function mano(radioAnular = null) {
  const grupo = new THREE.Group();
  const mat = material();
  const secs = [
    { y: -230, w: 36, d: 28, n: 2.1 },
    { y: -160, w: 34, d: 26.5, n: 2.1 },
    { y: -100, w: 31.5, d: 23.5, n: 2.15 },
    { y: -45, w: 29, d: 20.5, n: 2.2 },
    { y: -8, w: 27.5, d: 19, n: 2.25 },
    { y: 14, w: 31, d: 17.5, n: 2.35, cz: -0.5 },
    { y: 40, w: 39, d: 15.5, n: 2.6, cz: -1 },
    { y: 66, w: 42, d: 14, n: 2.7, cz: -1.5 },
    { y: 84, w: 40, d: 13.2, n: 2.4, cz: -2 },
  ];
  const palma = [...cupula(secs[0], 4, 3, false), ...secs, ...cupula(secs[secs.length - 1], 24, 4, true)];
  const { geo, anillos } = barrido(palma, { segs: 88, sub: 6 });
  grupo.add(malla(geo, mat));
  // Dedos (izq. a der. vistos desde el dorso de una mano izquierda): meñique, anular, medio, índice.
  const dedos = {
    menique: { x: -29, y: 92, ang: -0.16, largo: 58, r0: 7.6, r1: 6.2 },
    anular: { x: -10.5, y: 99, ang: -0.05, largo: 74, r0: radioAnular ?? 8.5, r1: (radioAnular ?? 8.5) * 0.8 },
    medio: { x: 9, y: 101, ang: 0.03, largo: 80, r0: 9.0, r1: 7.2 },
    indice: { x: 28, y: 96, ang: 0.12, largo: 71, r0: 8.6, r1: 6.9 },
  };
  const ejes = {};
  for (const [k, f] of Object.entries(dedos)) {
    const dir = new THREE.Vector3(Math.sin(f.ang), Math.cos(f.ang), -0.1).normalize();
    const b0 = new THREE.Vector3(f.x, f.y - 22, -2.5);
    grupo.add(malla(dedo(b0, dir, f.largo + 22, f.r0 * 1.08, f.r1), mat));
    ejes[k] = { base: b0, dir, largo: f.largo + 22, r0: f.r0 };
  }
  // Pulgar: sale del costado inferior, hacia fuera y adelante.
  const dirP = new THREE.Vector3(0.5, 0.84, 0.22).normalize();
  grupo.add(malla(dedo(new THREE.Vector3(22, 4, -7), dirP, 80, 13.5, 8.4), mat));
  return { grupo, anillos, ejes };
}

function aroColgado(anillos, pieza, largo, radioCordon, { yMin, yMax, inclinacion = 0.06, superficieY = null }) {
  // Altura donde el contorno (más el cordón) da el largo: el aro baja hasta donde «encaja».
  const objetivo = largo;
  let y = yMax, s = seccionEn(anillos, y);
  for (let yy = yMax; yy >= yMin; yy -= 1) {
    const ss = seccionEn(anillos, yy);
    if (perimetroSeccion(ss) + 2 * Math.PI * (radioCordon + 0.6) >= objetivo) { y = yy; s = ss; break; }
    y = yy; s = ss;
  }
  const P = perimetroSeccion(s);
  const delta = Math.max(radioCordon + 0.6, (objetivo - P) / (2 * Math.PI));
  const aro = aroAlrededor({ ...s, y }, delta, 200, inclinacion);
  const engan = enganches(pieza);
  const g2 = pieza.grosor / 2;
  let frente = aro[50]; // θ = π/2
  let M, puntos, cerrado, E1, E2;
  if (engan.dos) {
    // La pieza ocupa el frente del aro; el cordón va de una argolla a la otra por detrás.
    const n = new THREE.Vector3(0, inclinacion * 0.6, 1).normalize();
    M = base(n);
    M.setPosition(frente.clone().add(new THREE.Vector3(0, -0.5, g2 * 0.4)));
    E1 = engan.izq.clone().applyMatrix4(M);
    E2 = engan.der.clone().applyMatrix4(M);
    const n0 = aro.length;
    const ang = (i) => (i / n0) * Math.PI * 2;
    const resto = [];
    // de θ pequeño (derecha, delante) bajando por detrás hasta el lado izquierdo-delante
    for (let i = 0; i < n0; i++) {
      const k = (50 - i + n0) % n0; // empezamos en el frente y giramos hacia la derecha (θ decrece)
      const p = aro[k];
      const t = ang(k);
      const xr = p.x;
      if (i === 0) continue;
      if (Math.sin(t) > 0 && xr < E2.x + 2 && xr > E1.x - 2) continue; // tapado por la pieza
      resto.push(p);
    }
    puntos = [E2, ...resto, E1];
    cerrado = false;
  } else {
    // Dije que cuelga del aro, apoyado sobre la piel.
    const H = engan.punto;
    const n = new THREE.Vector3(0, 0.12, 1).normalize();
    M = base(n);
    const pos = frente.clone().sub(H.clone().applyMatrix4(new THREE.Matrix4().extractRotation(M)));
    M.setPosition(pos);
    // Si la piel queda por delante de la pieza, la inclinamos hacia fuera.
    const yc = pos.y;
    const zs = superficieY ? superficieY(yc) : null;
    if (zs !== null && zs + g2 + 0.4 > pos.z) {
      const ang = Math.atan2(zs + g2 + 0.4 - pos.z, Math.max(5, frente.y - yc));
      const R = new THREE.Matrix4().makeRotationX(-ang);
      const Mr = base(new THREE.Vector3(0, Math.sin(ang) + 0.12, Math.cos(ang)).normalize());
      M = Mr;
      M.setPosition(frente.clone().sub(H.clone().applyMatrix4(new THREE.Matrix4().extractRotation(Mr))));
      void R;
    }
    E1 = E2 = frente.clone();
    puntos = [...aro.slice(50), ...aro.slice(0, 50)];
    cerrado = true;
  }
  return { M, puntos, cerrado, E1, E2, y, aro };
}

function colocarMuneca(pieza, largo, radioCordon) {
  const { grupo, anillos } = mano();
  const r = aroColgado(anillos, pieza, largo, radioCordon, {
    yMin: -150, yMax: -6, inclinacion: 0.07,
    superficieY: (y) => frenteZ(anillos, 0, y),
  });
  return {
    silueta: grupo,
    camino: { puntos: r.puntos, cerrado: r.cerrado },
    matriz: r.M,
    anclas: { izq: r.E1, der: r.E2, dos: !r.cerrado },
    encuadre: { centro: new THREE.Vector3(4, r.y + 14, 10), alto: 180, dir: new THREE.Vector3(0.18, 0.22, 1) },
    cierre: 0.5,
  };
}

export function colocarAnillo(pieza) {
  const ri = (pieza.ri || 8.5);
  const { grupo, ejes } = mano(ri - 0.15);
  const e = ejes.anular;
  const centro = e.base.clone().add(e.dir.clone().multiplyScalar(22 + 19));
  // El anillo se revolucionó alrededor de Z: su eje pasa a ser el del dedo.
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), e.dir);
  const M = new THREE.Matrix4().compose(centro, q, new THREE.Vector3(1, 1, 1));
  return {
    silueta: grupo,
    camino: null,
    matriz: M,
    anclas: null,
    encuadre: { centro: new THREE.Vector3(-2, 112, 6), alto: 165, dir: new THREE.Vector3(-0.08, 0.06, 1) },
  };
}

// ---------------------------------------------------------------------------------------------
// Pierna y pie (tobillera)
// ---------------------------------------------------------------------------------------------

function pierna() {
  const grupo = new THREE.Group();
  const mat = material();
  // Pierna: tobillo fino, tendón de Aquiles atrás (cz negativo) y pantorrilla.
  const secs = [
    { y: 22, w: 31, d: 40, cz: 2, n: 2.3 },
    { y: 44, w: 31, d: 34, cz: -3, n: 2.2 },
    { y: 64, w: 30, d: 30, cz: -5, n: 2.1 },
    { y: 92, w: 28.5, d: 27.5, cz: -6, n: 2.0 },
    { y: 130, w: 31, d: 31, cz: -7, n: 2.0 },
    { y: 190, w: 38, d: 38, cz: -9, n: 2.0 },
    { y: 260, w: 46, d: 46, cz: -11, n: 2.0 },
    { y: 320, w: 49, d: 49, cz: -11, n: 2.0 },
  ];
  const todo = [...secs, ...cupula(secs[secs.length - 1], 5, 4, true)];
  const { geo, anillos } = barrido(todo, { segs: 88, sub: 6 });
  grupo.add(malla(geo, mat));
  // Pie: barrido a lo largo de +Z (se arma sobre «y» y se gira); cz es la altura del centro de la sección
  // y d su semialto. Talón redondo, empeine que baja suave y dedos como un extremo redondeado.
  const pie = [
    { y: -44, w: 25, d: 24, cz: 30, n: 2.1 },
    { y: -28, w: 29, d: 30, cz: 33, n: 2.2 },
    { y: 0, w: 31, d: 30, cz: 32, n: 2.3 },
    { y: 35, w: 36, d: 25, cz: 26, n: 2.5 },
    { y: 80, w: 42, d: 19, cz: 19, n: 2.7 },
    { y: 125, w: 45, d: 14.5, cz: 14.5, n: 2.8 },
    { y: 160, w: 43, d: 11.5, cz: 11.5, n: 2.6 },
  ];
  const pieTodo = [...cupula(pie[0], 12, 6, false), ...pie, ...cupula(pie[pie.length - 1], 20, 7, true)];
  const { geo: gp } = barrido(pieTodo, { segs: 80, sub: 5 });
  // (x, y, z) → (x, z, y): el eje del barrido pasa a ser +Z (hacia delante), cz pasa a ser la altura.
  const p = gp.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) { const y = p[i + 1], z = p[i + 2]; p[i + 1] = z; p[i + 2] = y; }
  // El cambio de ejes invierte la orientación de los triángulos.
  const ix = gp.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  gp.computeVertexNormals();
  grupo.add(malla(gp, mat));
  return { grupo, anillos };
}

function colocarTobillo(pieza, largo, radioCordon) {
  const { grupo, anillos } = pierna();
  const r = aroColgado(anillos, pieza, largo, radioCordon, {
    yMin: 84, yMax: 104, inclinacion: 0.14,
    superficieY: (y) => frenteZ(anillos, 0, Math.max(60, y)),
  });
  return {
    silueta: grupo,
    camino: { puntos: r.puntos, cerrado: r.cerrado },
    matriz: r.M,
    anclas: { izq: r.E1, der: r.E2, dos: !r.cerrado },
    encuadre: { centro: new THREE.Vector3(0, r.y - 14, 26), alto: 175, dir: new THREE.Vector3(0.55, 0.38, 1) },
    cierre: 0.5,
  };
}

// ---------------------------------------------------------------------------------------------

// lugar: 'cuello' | 'muneca' | 'tobillo'. pieza: { argollas, ri, grosor, caja }. largo en mm.
export function colocar(lugar, pieza, largo, radioCordon = 1) {
  if (lugar === 'cuello') return colocarCuello(pieza, largo, radioCordon);
  if (lugar === 'muneca') return colocarMuneca(pieza, largo, radioCordon);
  if (lugar === 'tobillo') return colocarTobillo(pieza, largo, radioCordon);
  return null;
}
