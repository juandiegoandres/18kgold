// Prueba del lector de pies de foto del bot (sin dependencias).
// Correr:  node --test pruebas/*.test.mjs   (desde api/)   ·   o  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerPie } from '../src/pie.js';

// Las categorías reales de la BD (semilla.sql)
const CATS = [
  { slug: 'cadenas', nombre: 'Cadenas' }, { slug: 'pulseras', nombre: 'Pulseras' }, { slug: 'anillos', nombre: 'Anillos' },
  { slug: 'dijes', nombre: 'Dijes' }, { slug: 'aretes', nombre: 'Aretes' }, { slug: 'conjuntos', nombre: 'Conjuntos' },
];

const CASOS = [
  ['Cadena lazo italiano 4,2 g', { nombre: 'Cadena lazo', categoria: 'cadenas', peso_gramos: 4.2, tipo_oro: 'italiano' }],
  ['Pulsera tejida en nylon con balines 1.8gr', { nombre: 'Pulsera tejida en nylon con balines', categoria: 'pulseras', peso_gramos: 1.8, tipo_oro: 'nacional' }],
  ['Topos corazón 0,9 gramos', { nombre: 'Topos corazón', categoria: 'aretes', peso_gramos: 0.9, tipo_oro: 'nacional' }],
  ['Anillo solitario 2,35g oro nacional', { nombre: 'Anillo solitario', categoria: 'anillos', peso_gramos: 2.35, tipo_oro: 'nacional' }],
  ['Dije San Benito 3 gr italiana', { nombre: 'Dije San Benito', categoria: 'dijes', peso_gramos: 3, tipo_oro: 'italiano' }],
  ['Argollas de matrimonio 6,1 g', { nombre: 'Argollas de matrimonio', categoria: 'anillos', peso_gramos: 6.1 }],
  ['Candongas 2.4 grs\nTejido torzal, cierre de presión', { nombre: 'Candongas', categoria: 'aretes', peso_gramos: 2.4, descripcion: 'Tejido torzal, cierre de presión' }],
  ['', { nombre: 'Joya nueva', categoria: null, peso_gramos: null, tipo_oro: 'nacional', medidas: '' }],
  ['Conjunto cadena y aretes 7,5 gramos italiano', { nombre: 'Conjunto cadena y aretes', categoria: 'conjuntos', peso_gramos: 7.5, tipo_oro: 'italiano' }],
  ['Gargantilla rolo 45 cm peso: 5,6', { nombre: 'Gargantilla rolo', categoria: 'cadenas', peso_gramos: 5.6, medidas: '45 cm' }],
  ['Esclava 18k 10,25 G', { nombre: 'Esclava 18k', categoria: 'pulseras', peso_gramos: 10.25 }],
  ['cadena cartier 50cm 12.4gr ITALIANO', { nombre: 'Cadena cartier', categoria: 'cadenas', peso_gramos: 12.4, tipo_oro: 'italiano', medidas: '50 cm' }],
  ['Pulsera con dije de corazón', { nombre: 'Pulsera con dije de corazón', categoria: 'pulseras', peso_gramos: null }],
];

for (const [pie, esperado] of CASOS) {
  test(`pie «${pie.replace(/\n/g, ' / ') || '(vacío)'}»`, () => {
    const r = leerPie(pie, CATS);
    for (const [k, v] of Object.entries(esperado)) assert.deepEqual(r[k], v, `${k}: ${JSON.stringify(r)}`);
  });
}

test('acepta la lista de categorías como slugs', () => {
  assert.equal(leerPie('Anillo 2 g', ['anillos', 'dijes']).categoria, 'anillos');
});

test('peso fuera de rango se ignora', () => {
  assert.equal(leerPie('Cadena 900 g', CATS).peso_gramos, null);
});
