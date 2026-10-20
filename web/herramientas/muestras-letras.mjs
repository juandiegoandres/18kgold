// SOLO DESARROLLO. Hoja de muestras de nombres (contorno 2D final, el que se funde) por tipografía.
//   node herramientas/muestras-letras.mjs salida.html [alto_mm]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { generarNombre } from '../src/disenador/piezas.js';
import { FUENTES } from '../src/disenador/fuentes.js';
import { normalizar } from '../src/disenador/esquema.js';
import { pulirContorno } from '../src/disenador/geometria2d.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const fuentes = {};
for (const [k, d] of Object.entries(FUENTES)) {
  const b = fs.readFileSync(path.resolve(aqui, '../public/fuentes', d.archivo));
  fuentes[k] = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const salida = process.argv[2] || 'muestras.html';
const alto = Number(process.argv[3] || 12);
const nombres = (process.env.NOMBRES || 'Sofía,María José,Valentina,Juan José,Isabella,Lucía,Ángela').split(',');
const S = Number(process.env.ESCALA || 9); // px por mm
let html = '<html><body style="margin:0;background:#f4f0e6;font:12px sans-serif">';
for (const f of Object.keys(FUENTES)) {
  html += `<div style="display:flex;align-items:center;gap:14px;border-bottom:1px solid #ccc;padding:6px"><b style="width:90px">${FUENTES[f].nombre}</b>`;
  for (const n of nombres) {
    const p = normalizar('nombre', { texto: n, fuente: f, alto, argolla: 'dos' });
    const t0 = Date.now();
    const r = generarNombre(p, fuentes);
    const multi = pulirContorno(r.multi, { cierre: 0 });
    const ms = Date.now() - t0;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const pol of multi) for (const [x, y] of pol[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const d = multi.map((pol) => pol.map((an) => 'M' + an.map(([x, y]) => `${x.toFixed(3)},${(-y).toFixed(3)}`).join('L') + 'Z').join('')).join('');
    html += `<div><svg width="${((x1 - x0) * S).toFixed(0)}" height="${((y1 - y0) * S).toFixed(0)}" viewBox="${x0} ${-y1} ${x1 - x0} ${y1 - y0}"><path d="${d}" fill="#9d7c2f" fill-rule="evenodd"/></svg>
      <div style="font-size:10px;color:#555">${multi.length}p · ${ms} ms · ${r.avisos.map((a) => a.slice(0, 40)).join(' | ')}</div></div>`;
  }
  html += '</div>';
}
fs.writeFileSync(salida, html + '</body></html>');
console.log('ok', salida);
