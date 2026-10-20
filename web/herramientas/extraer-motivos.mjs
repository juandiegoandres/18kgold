// SOLO DESARROLLO. Extrae los contornos de terceros que usa el diseñador y escribe
// src/disenador/motivos-datos.js (caminos SVG + mapa de Colombia simplificado).
//   node herramientas/extraer-motivos.mjs <carpeta-descargas>
// Fuentes y licencias: ver public/relieves/LICENCIAS.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
const salida = path.resolve(aqui, '../src/disenador/motivos-datos.js');

// Icono SVG → el camino relleno (se descarta el cuadrado de fondo de game-icons).
function caminoSvg(archivo) {
  const txt = fs.readFileSync(path.join(dir, archivo), 'utf8');
  const vb = txt.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const ds = [...txt.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]).filter((d) => !/^M0 0h512v512H0z$/.test(d.trim()));
  return { d: ds.join(' '), vb };
}

const iconos = {
  mano_fatima: caminoSvg('fa-hamsa.svg'),
  paloma: caminoSvg('gi-delapouite-peace-dove.svg'),
  elefante: caminoSvg('gi-delapouite-elephant.svg'),
  angel: caminoSvg('gi-lorc-angel-wings.svg'),
  herradura: caminoSvg('gi-delapouite-horseshoe.svg'),
  trebol: caminoSvg('gi-lorc-clover.svg'),
  huella: caminoSvg('fa-paw.svg'),
};

// Signos del zodiaco (Noto Sans Symbols, OFL): glifos U+2648–U+2653, en unidades de 1000/em, y hacia abajo.
const b = fs.readFileSync(path.join(dir, 'NotoSansSymbols.ttf'));
const fuente = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
const SIGNOS = ['aries', 'tauro', 'geminis', 'cancer', 'leo', 'virgo', 'libra', 'escorpio', 'sagitario', 'capricornio', 'acuario', 'piscis'];
const zodiaco = {};
SIGNOS.forEach((s, i) => {
  const g = fuente.charToGlyph(String.fromCodePoint(0x2648 + i));
  const p = g.getPath(0, 0, 1000, { variation: { wght: 600 } }, fuente);
  const bb = p.getBoundingBox();
  zodiaco[s] = { d: p.toPathData(2), vb: [bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1] };
});

// Colombia continental (Natural Earth 1:50m, dominio público), simplificada (Douglas-Peucker).
const ne = JSON.parse(fs.readFileSync(path.join(dir, 'ne_50m.geojson'), 'utf8'));
const col = ne.features.find((f) => f.properties.ADMIN === 'Colombia').geometry;
const anillo = col.coordinates.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  let dmax = 0, k = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / L;
    if (d > dmax) { dmax = d; k = i; }
  }
  if (dmax <= tol) return [pts[0], pts[pts.length - 1]];
  return dp(pts.slice(0, k + 1), tol).slice(0, -1).concat(dp(pts.slice(k), tol));
}
// Proyección equirectangular con corrección de latitud media (~4° N).
const k = Math.cos((4 * Math.PI) / 180);
const proyectado = anillo.map(([lon, lat]) => [lon * k, lat]);
const mitad = Math.floor(proyectado.length / 2);
const simple = dp(proyectado.slice(0, mitad + 1), 0.045).slice(0, -1).concat(dp(proyectado.slice(mitad, -1), 0.045)).map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);

const js = `// GENERADO por herramientas/extraer-motivos.mjs — no editar a mano.
// Contornos de terceros con licencia libre (ver public/relieves/LICENCIAS.md):
//  · mano_fatima, huella: Font Awesome Free 6 (CC BY 4.0, Fonticons, Inc.)
//  · paloma, elefante, herradura: game-icons.net, Delapouite (CC BY 3.0)
//  · angel (angel-wings), trebol (clover): game-icons.net, Lorc (CC BY 3.0)
//  · zodiaco: Noto Sans Symbols (SIL Open Font License 1.1, Google)
//  · colombia: Natural Earth 1:50m (dominio público), simplificado
export const ICONOS = ${JSON.stringify(iconos)};
export const ZODIACO = ${JSON.stringify(zodiaco)};
export const COLOMBIA = ${JSON.stringify(simple)};
`;
fs.writeFileSync(salida, js);
console.log('ok', salida, 'colombia', simple.length, 'puntos', (js.length / 1024).toFixed(1), 'KB');
