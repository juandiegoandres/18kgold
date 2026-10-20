// Esquema nuevo del diseñador (ARQUITECTURA §5): medalla, cruz, motivo, puntos y grabado_fuente. Sin dependencias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS, ESQUEMA, normalizarParametros, describirDiseno } from '../src/esquema-disenador.js';
import { resumenParametros } from '../src/disenos.js';

const COMUN_DEF = { tipo_oro: 'nacional', acabado: 'brillante', contraccion: 0 };
const desc = (tipo, p) => describirDiseno(tipo, normalizarParametros(tipo, p));

test('tipos admitidos', () => {
  assert.deepEqual(TIPOS, ['nombre', 'inicial', 'placa', 'anillo', 'medalla', 'cruz', 'motivo']);
  assert.equal(ESQUEMA.motivo.figura.v.length, 15 + 12);
});

// ---------------------------------------------------------------- medalla
test('medalla válida se conserva', () => {
  const p = normalizarParametros('medalla', { motivo: 'san_benito', diametro: 18, forma: 'redonda', borde: 'cordon', grosor: 1.4,
    reverso: 'cruz_san_benito', grabado_fuente: 'script', argolla: 'arriba', tipo_oro: 'italiano' });
  assert.deepEqual(p, { motivo: 'san_benito', diametro: 18, forma: 'redonda', borde: 'cordon', grosor: 1.4, reverso: 'cruz_san_benito',
    grabado_reverso: '', grabado_fuente: 'script', argolla: 'arriba', tipo_oro: 'italiano', acabado: 'brillante', contraccion: 0 });
});

test('medalla inválida se recorta a rangos y defectos', () => {
  const p = normalizarParametros('medalla', { motivo: 'san pedro', diametro: 40, forma: 'cuadrada', borde: 'Cordón', grosor: 0.2,
    reverso: 'Grabado', grabado_reverso: '  <b>Te   amo</b>\u0000 mamá, siempre conmigo hasta el fin del mundo y más ', grabado_fuente: 'gótica',
    argolla: 'lateral', extra: 'x' });
  assert.deepEqual(p, { motivo: 'san_benito', diametro: 25, forma: 'redonda', borde: 'cordon', grosor: 1, reverso: 'grabado',
    grabado_reverso: 'b Te amo /b mamá, siempre conmigo hasta', grabado_fuente: 'serif', argolla: 'arriba', ...COMUN_DEF });
  assert.equal(Array.from(p.grabado_reverso).length <= 40, true);
  assert.equal(normalizarParametros('medalla', { diametro: 'nada' }).diametro, 18);
  assert.equal(normalizarParametros('medalla', { diametro: '15,2' }).diametro, 15);
});

test('medalla: el grabado del reverso se borra si el reverso no es «grabado»', () => {
  assert.equal(normalizarParametros('medalla', { reverso: 'liso', grabado_reverso: 'Hola' }).grabado_reverso, '');
});

test('medalla: descripción legible', () => {
  assert.equal(desc('medalla', { motivo: 'san_benito', diametro: 18, borde: 'cordon', reverso: 'cruz_san_benito' }),
    'Medalla de San Benito · 18 mm · borde cordón · reverso cruz de San Benito');
  assert.equal(desc('medalla', { motivo: 'divino_nino', diametro: 22.5, forma: 'ovalada', borde: 'puntos', reverso: 'grabado',
    grabado_reverso: 'Sofía 2026', grabado_fuente: 'script' }),
    'Medalla del Divino Niño ovalada · 22,5 mm · borde de puntos · reverso grabado «Sofía 2026» (letra script)');
  assert.equal(desc('medalla', { motivo: 'guadalupe' }), 'Medalla de la Virgen de Guadalupe · 18 mm · borde liso · reverso liso');
});

// ---------------------------------------------------------------- cruz
test('cruz válida se conserva', () => {
  const p = normalizarParametros('cruz', { estilo: 'florenzada', alto: 30, brazo: 2.5, grosor: 2, punto_luz: true, cristo: true, argolla: 'arriba' });
  assert.deepEqual(p, { estilo: 'florenzada', alto: 30, brazo: 2.5, grosor: 2, punto_luz: true, cristo: true, argolla: 'arriba', ...COMUN_DEF });
});

test('cruz inválida se recorta a rangos y defectos', () => {
  const p = normalizarParametros('cruz', { estilo: 'celta', alto: 5, brazo: 9, grosor: 3, punto_luz: 'si', cristo: 'quizá', argolla: 'abajo' });
  assert.deepEqual(p, { estilo: 'latina', alto: 12, brazo: 5, grosor: 2.5, punto_luz: true, cristo: false, argolla: 'arriba', ...COMUN_DEF });
  assert.equal(normalizarParametros('cruz', { estilo: 'Con borde' }).estilo, 'con_borde');
});

test('cruz: descripción legible', () => {
  assert.equal(desc('cruz', { estilo: 'latina', alto: 25, punto_luz: true }), 'Cruz latina 25 mm con punto de luz');
  assert.equal(desc('cruz', { estilo: 'tau', alto: 20 }), 'Cruz tau 20 mm');
  assert.equal(desc('cruz', { estilo: 'con_borde', alto: 18, cristo: true, punto_luz: true }), 'Cruz con borde 18 mm con Cristo en relieve y punto de luz');
});

// ---------------------------------------------------------------- motivo
test('motivo válido se conserva', () => {
  const p = normalizarParametros('motivo', { figura: 'zodiaco_leo', alto: 14, grosor: 1.2, calado: true, texto: 'Ana', argolla: 'lateral' });
  assert.deepEqual(p, { figura: 'zodiaco_leo', alto: 14, grosor: 1.2, calado: true, texto: 'Ana', argolla: 'lateral', ...COMUN_DEF });
});

test('motivo inválido se recorta a rangos y defectos', () => {
  const p = normalizarParametros('motivo', { figura: 'zodiaco_ofiuco', alto: 100, grosor: 0, calado: 'no', texto: 'Texto demasiado largo<script>', argolla: 'x' });
  assert.deepEqual(p, { figura: 'corazon', alto: 30, grosor: 0.8, calado: false, texto: 'Texto demasi', argolla: 'arriba', ...COMUN_DEF });
  assert.equal(normalizarParametros('motivo', { figura: 'Ojo turco' }).figura, 'ojo_turco');
  assert.equal(normalizarParametros('motivo', { figura: 'Árbol vida' }).figura, 'arbol_vida');
});

test('motivo Mamá: nombres separados por coma, saneados y recortados a 40', () => {
  assert.equal(normalizarParametros('motivo', { figura: 'mama', texto: ' Sofía ,Juan ' }).texto, 'Sofía, Juan');
  assert.equal(normalizarParametros('motivo', { figura: 'mama', texto: 'Sofía,,Juan,Pedro,' }).texto, 'Sofía, Juan, Pedro'); // sin coma colgando
  assert.equal(normalizarParametros('motivo', { figura: 'corazon', texto: 'Valentina Gómez' }).texto, 'Valentina Gó'); // otros motivos: 12
  assert.ok(Array.from(normalizarParametros('motivo', { figura: 'mama', texto: 'Valentina, Santiago, Mariana, Sebastián, Isabella' }).texto).length <= 40);
});

test('motivo: descripción legible', () => {
  assert.equal(desc('motivo', { figura: 'ojo_turco', alto: 14, calado: true }), 'Dije ojo turco 14 mm calado');
  assert.equal(desc('motivo', { figura: 'zodiaco_leo', alto: 14 }), 'Signo de Leo');
  assert.equal(desc('motivo', { figura: 'mama', texto: 'Sofía, Juan' }), 'Dije Mamá: Sofía, Juan');
  assert.equal(desc('motivo', { figura: 'mapa_colombia', alto: 20, texto: 'Te amo' }), 'Dije mapa de Colombia 20 mm · texto «Te amo»');
});

// ---------------------------------------------------------------- parámetros nuevos en tipos viejos
test('nombre e inicial: puntos (válido y por defecto)', () => {
  assert.equal(normalizarParametros('nombre', { texto: 'Lucía', puntos: 'corazon' }).puntos, 'corazon');
  assert.equal(normalizarParametros('nombre', { texto: 'Lucía', puntos: 'estrella' }).puntos, 'unir');
  assert.equal(normalizarParametros('inicial', { letra: 'j', puntos: 'Diamante' }).puntos, 'diamante');
  assert.equal(normalizarParametros('inicial', { letra: 'j' }).puntos, 'unir');
  assert.equal(desc('nombre', { texto: 'Lucía', fuente: 'script2', alto: 12, puntos: 'corazon' }), 'Nombre «Lucía» en script 2 (Pacifico) · 12 mm · puntos corazón');
});

test('placa y anillo: grabado_fuente (válido y por defecto)', () => {
  assert.equal(normalizarParametros('placa', { grabado_fuente: 'script' }).grabado_fuente, 'script');
  assert.equal(normalizarParametros('placa', { grabado_fuente: 'comic' }).grabado_fuente, 'serif');
  assert.equal(normalizarParametros('anillo', { grabado_fuente: 'Clásica' }).grabado_fuente, 'serif'); // alias viejo
  assert.equal(desc('anillo', { talla: 7.5, ancho: 4, perfil: 'media_cana', grabado_interior: 'Por siempre', grabado_fuente: 'script' }),
    'Anillo talla 7,5 · 4 mm de ancho · perfil media caña · grabado interior «Por siempre» (letra script)');
});

test('resumen de parámetros con nombres en español', () => {
  const r = resumenParametros('cruz', normalizarParametros('cruz', { estilo: 'con_borde', alto: 25, brazo: 2.5, punto_luz: true }));
  assert.equal(r, 'Estilo: con borde\nAlto (mm): 25\nBrazo (mm): 2,5\nGrosor (mm): 1,5\nPunto de luz: sí\nCristo en relieve: no\nArgolla: arriba\nAcabado: brillante');
  const m = resumenParametros('medalla', normalizarParametros('medalla', { motivo: 'angel_guarda', borde: 'cordon' }));
  assert.match(m, /^Motivo: Ángel de la Guarda\nDiámetro \(mm\): 18\n/);
  assert.doesNotMatch(m, /Letra del grabado/); // sin grabado no se menciona la letra
});
