// Montaje del diseñador: validación/recorte y cotización (balines huecos + tejido). Sin dependencias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarMontaje, describirMontaje } from '../src/esquema-disenador.js';
import { pesoBalin, cotizarDiseno } from '../src/precios.js';

const AJUSTES = { precio_gramo_nacional: '352000', precio_gramo_italiano: '410000', hechura_gramo: '60000', tejido_valor: '25000' };

test('peso del balín hueco de 4 mm (pared 0,3 mm, 15,5 g/cm³)', () => {
  // 15.5/1000 × 4/3·π·(2³ − 1.7³) = 0.0155 × 4.18879 × 3.087 = 0.20043 g
  assert.ok(Math.abs(pesoBalin(4) - 0.200428) < 1e-5, String(pesoBalin(4)));
});

test('pulsera tejida + 6 balines de 4 mm, pieza 2,1 g nacional', () => {
  const m = normalizarMontaje({ soporte: 'tejido', tejido: { uso: 'pulsera', patron: 'macrame_plano', color: 'negro', largo_cm: 18 },
    balines: { cantidad: 6, diametro: 4, acabado: 'diamantado', distribucion: 'repartidos' } });
  const c = cotizarDiseno(2.1, 'nacional', AJUSTES, m);
  // oro = 2.1 + 6 × 0.200428 = 3.30257 → 3.30 g
  // precio = 3.30 × 352000 + 2.10 × 60000 + 25000 = 1161600 + 126000 + 25000 = 1312600
  assert.equal(c.peso_oro, 3.3);
  assert.equal(c.precio, 1312600);
  assert.equal(describirMontaje(m), 'Pulsera tejida en nylon · macramé plano · negro · 18 cm · 6 balines de 4 mm diamantados, repartidos');
});

test('montaje inválido se recorta a rangos', () => {
  const m = normalizarMontaje({ soporte: 'tejido', tejido: { uso: 'collar', patron: 'xx', color: 'morado', largo_cm: 99 },
    balines: { cantidad: 50, diametro: 9, acabado: 'oro', distribucion: 'loco' }, cadena: { estilo: 'rolo' } });
  assert.deepEqual(m, { soporte: 'tejido', tejido: { uso: 'collar', patron: 'macrame_plano', color: 'negro', largo_cm: 60 },
    balines: { cantidad: 20, diametro: 6, acabado: 'liso', distribucion: 'junto_al_dije' } });
});

test('sin soporte no hay balines; cadena no suma al precio', () => {
  assert.equal(normalizarMontaje({ soporte: 'ninguno', balines: { cantidad: 5 } }).balines.cantidad, 0);
  assert.equal(normalizarMontaje('basura').soporte, 'ninguno');
  const m = normalizarMontaje({ soporte: 'cadena', cadena: { estilo: 'lazo', largo_cm: 45 } });
  assert.equal(cotizarDiseno(2.1, 'nacional', AJUSTES, m).precio, 865200); // 2.1 × 412000
  assert.match(describirMontaje(m), /cadena: se cotiza aparte/);
});
