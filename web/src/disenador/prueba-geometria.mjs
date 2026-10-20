// Prueba de geometría sin navegador:  node src/disenador/prueba-geometria.mjs  (desde web/)
// Para cada tipo genera varias configuraciones, exporta STL binario, verifica malla cerrada
// (cada arista en 2 caras), una sola componente conectada y peso razonable.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { generar } from './generar.js';
import { FUENTES } from './fuentes.js';
import { calcularPrecio, PRECIOS_REFERENCIA } from './precio.js';
import { leerPNGGris } from './png-node.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dirFuentes = path.resolve(aqui, '../../public/fuentes');
const salida = process.argv[2] || null; // carpeta opcional para guardar los STL

const fuentes = {};
for (const [k, d] of Object.entries(FUENTES)) {
  const b = fs.readFileSync(path.join(dirFuentes, d.archivo));
  fuentes[k] = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

const dirRelieves = path.resolve(aqui, '../../public/relieves');
const imagenes = {};
for (const f of fs.readdirSync(dirRelieves).filter((n) => n.endsWith('.png'))) imagenes[f.slice(0, -4)] = leerPNGGris(fs.readFileSync(path.join(dirRelieves, f)));
const soloNuevos = process.argv.includes('--clasicas');

const casos = [
  ['nombre', { texto: 'Sofía', fuente: 'script1', alto: 12, grosor: 1.2, base: 'ninguna', adorno: 'ninguno', argolla: 'dos' }],
  ['nombre', { texto: 'Valentina', fuente: 'script2', alto: 10, grosor: 1.2, base: 'linea', adorno: 'corazon', argolla: 'dos' }],
  ['nombre', { texto: 'Juan José', fuente: 'script3', alto: 10, grosor: 1.2, base: 'ninguna', adorno: 'corona', argolla: 'centro' }],
  ['nombre', { texto: 'Ana', fuente: 'serif', alto: 14, grosor: 1.5, base: 'doble', adorno: 'estrella', argolla: 'izquierda' }],
  ['nombre', { texto: 'Mia', fuente: 'bloque', alto: 12, grosor: 1.2, base: 'linea', adorno: 'mariposa', argolla: 'derecha' }],
  ['inicial', { letra: 'S', fuente: 'serif', alto: 16, grosor: 1.4, marco: 'circulo' }],
  ['inicial', { letra: 'M', fuente: 'script1', alto: 18, grosor: 1.2, marco: 'corazon' }],
  ['inicial', { letra: 'J', fuente: 'bloque', alto: 14, grosor: 1.5, marco: 'ninguno' }],
  ['placa', { forma: 'militar', ancho: 18, alto: 28, grosor: 1.0, argolla: 'arriba' }],
  ['placa', { forma: 'corazon', ancho: 20, alto: 18, grosor: 1.2, argolla: 'lateral' }],
  ['placa', { forma: 'circulo', ancho: 16, alto: 16, grosor: 0.8, argolla: 'arriba' }],
  ['anillo', { talla: 7, ancho: 4, grosor: 1.6, perfil: 'plano' }],
  ['anillo', { talla: 7, ancho: 4, grosor: 1.6, perfil: 'comodo' }],
  ['anillo', { talla: 10, ancho: 6, grosor: 2.0, perfil: 'media_cana' }],
  ['anillo', { talla: 5, ancho: 3, grosor: 1.4, perfil: 'facetado' }],
  // Piezas clásicas (ronda 3)
  ['medalla', { motivo: 'san_benito', diametro: 18, borde: 'cordon', reverso: 'cruz_san_benito', grosor: 1.1 }],
  ['medalla', { motivo: 'virgen_milagrosa', diametro: 15, borde: 'puntos', reverso: 'liso', grosor: 1.0 }],
  ['medalla', { motivo: 'guadalupe', diametro: 22, forma: 'ovalada', borde: 'liso', reverso: 'grabado', grabado_reverso: 'Mi niña', grosor: 1.2 }],
  ['cruz', { estilo: 'latina', alto: 25, brazo: 3, grosor: 1.4, punto_luz: true }],
  ['cruz', { estilo: 'latina', alto: 30, brazo: 3.6, grosor: 1.5, cristo: true }],
  ['cruz', { estilo: 'florenzada', alto: 24, brazo: 2.6, grosor: 1.3, cristo: true, punto_luz: true }],
  ['cruz', { estilo: 'con_borde', alto: 22, brazo: 3.2, grosor: 1.4, punto_luz: true }],
  ['cruz', { estilo: 'tau', alto: 20, brazo: 3, grosor: 1.3 }],
  ['motivo', { figura: 'ojo_turco', alto: 14, calado: true, grosor: 1.2 }],
  ['motivo', { figura: 'arbol_vida', alto: 20, grosor: 1.2 }],
  ['motivo', { figura: 'mapa_colombia', alto: 24, grosor: 1.2 }],
  ['motivo', { figura: 'mama', alto: 20, texto: 'Sofía, Tomás', grosor: 1.2 }],
  ['motivo', { figura: 'zodiaco_leo', alto: 16, grosor: 1.2 }],
];

const exportador = new STLExporter();
let fallos = 0;
console.log('tipo     | configuración                         | ancho×alto×grosor mm | vol mm³ | peso g | precio est. | manifold | comp | triáng. | ms');
const t00 = Date.now();
for (const [tipo, p] of casos) {
  if (soloNuevos && !['medalla', 'cruz', 'motivo'].includes(tipo)) continue;
  const r = generar(tipo, p, fuentes, imagenes);
  const malla = new THREE.Mesh(r.geo);
  const stl = exportador.parse(malla, { binary: true });
  const bytes = stl.byteLength ?? stl.buffer.byteLength;
  // El STL binario tiene 84 + 50·n bytes.
  const ntri = (bytes - 84) / 50;
  const desc = tipo === 'anillo' ? `talla ${p.talla} ${p.ancho}mm ${p.grosor}mm ${p.perfil}`
    : tipo === 'placa' ? `${p.forma} ${p.ancho}×${p.alto}`
    : tipo === 'medalla' ? `${p.motivo} ${p.diametro}mm ${p.borde} rev:${p.reverso}`
    : tipo === 'cruz' ? `${p.estilo} ${p.alto}mm b${p.brazo}${p.punto_luz ? ' luz' : ''}${p.cristo ? ' cristo' : ''}`
    : tipo === 'motivo' ? `${p.figura} ${p.alto}mm${p.calado ? ' calado' : ''}${p.texto ? ' «' + p.texto + '»' : ''}`
      : `${p.texto || p.letra} ${p.fuente} ${p.alto}mm ${p.base || p.marco} ${p.adorno || ''}`;
  const m = r.medidas;
  const precio = calcularPrecio(r.peso_g, 'nacional', PRECIOS_REFERENCIA);
  const ok = r.verificacion.manifold && r.verificacion.componentes === 1;
  if (!ok) fallos++;
  console.log(
    `${tipo.padEnd(8)} | ${desc.padEnd(37)} | ${m.ancho.toFixed(1)}×${m.alto.toFixed(1)}×${m.grosor.toFixed(2)}`.padEnd(73) +
    ` | ${r.volumen_mm3.toFixed(1).padStart(7)} | ${r.peso_g.toFixed(2).padStart(6)} | ${precio.toLocaleString('es-CO').padStart(11)} | ${String(r.verificacion.manifold).padEnd(8)} | ${String(r.verificacion.componentes).padStart(4)} | ${String(r.verificacion.triangulos).padStart(7)} | ${r.ms}`,
  );
  if (!r.verificacion.manifold) console.log('   topología:', JSON.stringify(r.verificacion));
  if (r.avisos.length) console.log('   avisos:', r.avisos.join(' / '));
  if (ntri !== r.verificacion.triangulos) console.log(`   STL: ${ntri} triángulos (malla soldada ${r.verificacion.triangulos})`);
  if (salida) {
    fs.mkdirSync(salida, { recursive: true });
    fs.writeFileSync(path.join(salida, `${tipo}-${desc.replace(/[^\w]+/g, '_')}.stl`), Buffer.from(stl.buffer ?? stl));
  }
}
console.log(`\nTiempo total ${((Date.now() - t00) / 1000).toFixed(1)} s`);
console.log(fallos ? `\n${fallos} caso(s) con problemas` : '\nTodos los casos: malla cerrada y una sola pieza.');
process.exit(fallos ? 1 : 0);
