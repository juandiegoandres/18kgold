// Vista previa del grabado láser (no se talla en el STL): texto dibujado en canvas y aplicado
// como calcomanía sobre la cara de la placa o el interior del anillo.

import * as THREE from 'three';
import { diametroInterior } from './esquema.js';

const TINTA = 'rgba(78, 52, 12, 0.86)';
// Fuentes de grabado: serif (Cormorant cursiva) o script (Great Vibes).
export const FUENTES_GRABADO = {
  serif: { familia: 'Cormorant Garamond', peso: 500, cursiva: true, escala: 1 },
  script: { familia: 'KP Great Vibes', peso: 400, cursiva: false, escala: 1.25 },
};

function lienzoTexto(texto, anchoPx, altoPx, { fuente = 'Cormorant Garamond', peso = 500, cursiva = true, lineas = 3, espejo = false, voltear = false, escala = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = anchoPx; c.height = altoPx;
  const g = c.getContext('2d');
  g.clearRect(0, 0, anchoPx, altoPx);
  if (espejo) { g.translate(anchoPx, 0); g.scale(-1, 1); }
  if (voltear) { g.translate(0, altoPx); g.scale(1, -1); }
  g.fillStyle = TINTA;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // Partimos el texto en líneas que quepan.
  const palabras = texto.trim().split(/[ \t]+/);
  const forzadas = texto.includes('\n') ? texto.split('\n').map((l) => l.trim()).filter(Boolean) : null;
  if (forzadas) lineas = Math.max(lineas, forzadas.length);
  let tam = Math.floor((altoPx / (lineas + 0.6)) * escala);
  let filas;
  for (; tam > 10; tam -= 2) {
    g.font = `${cursiva ? 'italic ' : ''}${peso} ${tam}px "${fuente}", Georgia, serif`;
    if (forzadas) {
      filas = forzadas;
      const anchoMax = Math.max(...filas.map((f) => g.measureText(f).width));
      if (anchoMax <= anchoPx * 0.94 && filas.length * tam * 1.15 <= altoPx * 0.95) break;
      continue;
    }
    filas = [];
    let act = '';
    for (const p of palabras) {
      const prueba = act ? act + ' ' + p : p;
      if (g.measureText(prueba).width > anchoPx * 0.92 && act) { filas.push(act); act = p; } else act = prueba;
    }
    if (act) filas.push(act);
    const anchoMax = Math.max(...filas.map((f) => g.measureText(f).width));
    if (filas.length <= lineas && anchoMax <= anchoPx * 0.94 && filas.length * tam * 1.15 <= altoPx * 0.95) break;
  }
  const alto = filas.length * tam * 1.15;
  // Bajo relieve visual del láser: borde claro abajo-derecha (luz que entra al surco) y trazo oscuro.
  const y0 = (i) => altoPx / 2 - alto / 2 + tam * 0.575 + i * tam * 1.15;
  const off = Math.max(1, tam * 0.035);
  g.fillStyle = 'rgba(255, 236, 190, 0.55)';
  filas.forEach((f, i) => g.fillText(f, anchoPx / 2 + off, y0(i) + off));
  g.fillStyle = TINTA;
  filas.forEach((f, i) => g.fillText(f, anchoPx / 2, y0(i)));
  return c;
}

function materialDe(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({
    map: t, transparent: true, depthWrite: false, metalness: 0.6, roughness: 0.6,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
}

// Placa: calcomanías frente (z = grosor) y reverso (z = 0). `forma` ajusta la zona útil.
export function grabadosPlaca(p, caja) {
  const out = [];
  const factor = { rectangular: [0.8, 0.62], militar: [0.74, 0.58], ovalada: [0.66, 0.5], circulo: [0.66, 0.5], corazon: [0.6, 0.42] }[p.forma] || [0.7, 0.5];
  const ancho = p.ancho;
  const alto = p.forma === 'circulo' ? p.ancho : p.alto;
  const w = ancho * factor[0], h = alto * factor[1];
  const dy = p.forma === 'corazon' ? alto * 0.06 : 0;
  // Centro de la placa (sin argolla) en coordenadas de la malla.
  const cy = p.argolla === 'arriba' ? caja.y0 + alto / 2 : (caja.y0 + caja.y1) / 2;
  const cx = p.argolla === 'lateral' ? caja.x1 - ancho / 2 : (caja.x0 + caja.x1) / 2;
  const escala = 40; // px por mm
  for (const [texto, frente] of [[p.grabado_frente, true], [p.grabado_reverso, false]]) {
    if (!texto || !texto.trim()) continue;
    const fg = FUENTES_GRABADO[p.grabado_fuente] || FUENTES_GRABADO.serif;
    const c = lienzoTexto(texto, Math.round(w * escala), Math.round(h * escala), { lineas: frente ? 3 : 4, fuente: fg.familia, peso: fg.peso, cursiva: fg.cursiva, escala: fg.escala });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), materialDe(c));
    if (frente) m.position.set(cx, cy + dy, caja.z1 + 0.004);
    else { m.position.set(cx, cy + dy, caja.z0 - 0.004); m.rotation.y = Math.PI; }
    m.renderOrder = 2;
    out.push(m);
  }
  return out;
}

// Anillo: banda de texto en la cara interior.
export function grabadoAnillo(p) {
  if (!p.grabado_interior || !p.grabado_interior.trim()) return [];
  const ri = diametroInterior(p.talla) / 2 - 0.006;
  const h = Math.min(p.ancho * 0.55, 3);
  const arco = Math.PI * 1.1; // el texto ocupa ~200° del interior
  const largo = ri * arco;
  const escala = 48;
  const fg = FUENTES_GRABADO[p.grabado_fuente] || FUENTES_GRABADO.serif;
  const c = lienzoTexto(p.grabado_interior, Math.round(largo * escala), Math.round(h * escala), { lineas: 1, voltear: true, fuente: fg.familia, peso: fg.peso, cursiva: fg.cursiva, escala: fg.escala });
  // Centrado en la parte de abajo del anillo (−Y local): es la que queda a la vista en «Ver grabado».
  const geo = new THREE.CylinderGeometry(ri, ri, h, 128, 1, true, -arco / 2, arco);
  geo.rotateX(Math.PI / 2);
  const mat = materialDe(c);
  mat.side = THREE.BackSide;
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 2;
  return [m];
}

// Zonas de grabado de las piezas clásicas (reverso de la medalla, texto del motivo, nombres en la «Mamá»).
// `zonas` = [{ cara: 'frente'|'reverso', cx, cy, w, h, texto, lineas }] en coordenadas de la malla.
export function grabadosZonas(zonas = [], p = {}, grosor = 1) {
  const out = [];
  const fg = FUENTES_GRABADO[p.grabado_fuente] || FUENTES_GRABADO.serif;
  const escala = 40;
  for (const z of zonas) {
    if (!z.texto || !String(z.texto).trim()) continue;
    const c = lienzoTexto(String(z.texto), Math.round(z.w * escala), Math.round(z.h * escala), { lineas: z.lineas || 2, fuente: fg.familia, peso: fg.peso, cursiva: fg.cursiva, escala: fg.escala });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(z.w, z.h), materialDe(c));
    if (z.cara === 'reverso') { m.position.set(z.cx, z.cy, -0.004); m.rotation.y = Math.PI; }
    else m.position.set(z.cx, z.cy, grosor + 0.004);
    m.renderOrder = 2;
    out.push(m);
  }
  return out;
}
