// Prueba del lector de descuentos del bot (sin dependencias).
// Correr:  node --test pruebas/*.test.mjs   (desde api/)   ·   o  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerDescuento } from '../src/bot.js';

test('quitar descuento', () => {
  for (const t of ['0', 'no', 'Quitar', 'ninguno']) assert.deepEqual(leerDescuento(t), { tipo: 'ninguno', valor: 0 });
});

test('porcentaje', () => {
  assert.deepEqual(leerDescuento('10%'), { tipo: 'porcentaje', valor: 10 });
  assert.deepEqual(leerDescuento('7,5 %'), { tipo: 'porcentaje', valor: 7.5 });
  assert.equal(leerDescuento('95%'), null);
  assert.equal(leerDescuento('0%'), null);
});

test('valor en pesos', () => {
  assert.deepEqual(leerDescuento('20000'), { tipo: 'valor', valor: 20000 });
  assert.deepEqual(leerDescuento('$20.000'), { tipo: 'valor', valor: 20000 });
  assert.equal(leerDescuento('500'), null);
  assert.equal(leerDescuento('mucho'), null);
});
