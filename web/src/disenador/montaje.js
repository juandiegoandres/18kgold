// Montaje: cómo se lleva la pieza (ARQUITECTURA.md §5). El STL es SOLO la pieza de oro a fundir;
// el soporte (cadena o tejido en nylon) y los balines se dibujan y se cotizan, pero no se exportan.

export const SOPORTES = ['ninguno', 'cadena', 'tejido'];
export const ESTILOS_CADENA = ['rolo', 'cartier', 'lazo', 'veneciana', 'singapur'];
export const USOS_TEJIDO = ['pulsera', 'tobillera', 'collar'];
export const PATRONES = ['macrame_plano', 'espiral', 'trenza', 'cola_raton', 'serpiente'];
export const COLORES_HILO = ['negro', 'rojo', 'blanco', 'azul', 'cafe', 'verde', 'rosado', 'beige'];
export const DIAMETROS_BALIN = [3, 4, 5, 6];
export const ACABADOS_BALIN = ['liso', 'diamantado'];
export const DISTRIBUCIONES = ['junto_al_dije', 'repartidos', 'extremos'];

// Colores de hilo de nylon trenzado (tipo S-Lon / cola de ratón): tonos reales, no saturados de pantalla.
export const HILO = {
  negro: { nombre: 'Negro', hex: '#1d1c1b' },
  rojo: { nombre: 'Rojo', hex: '#9c1b22' },
  blanco: { nombre: 'Blanco', hex: '#e9e6dd' },
  azul: { nombre: 'Azul', hex: '#22386b' },
  cafe: { nombre: 'Café', hex: '#5b3a26' },
  verde: { nombre: 'Verde', hex: '#24553a' },
  rosado: { nombre: 'Rosado', hex: '#dc9aa9' },
  beige: { nombre: 'Beige', hex: '#c9b08a' },
};

export const NOMBRES = {
  soporte: { ninguno: 'Sin soporte', cadena: 'Cadena de oro', tejido: 'Tejido en nylon' },
  estilo: { rolo: 'Rolo', cartier: 'Cartier', lazo: 'Lazo', veneciana: 'Veneciana', singapur: 'Singapur' },
  uso: { pulsera: 'Pulsera', tobillera: 'Tobillera', collar: 'Collar' },
  patron: { macrame_plano: 'Macramé plano', espiral: 'Espiral', trenza: 'Trenza', cola_raton: 'Cola de ratón', serpiente: 'Serpiente' },
  acabado: { liso: 'Liso', diamantado: 'Diamantado' },
  distribucion: { junto_al_dije: 'Junto al dije', repartidos: 'Repartidos', extremos: 'En los extremos' },
};

export const LARGOS = {
  cadena: { min: 40, max: 60, defecto: 45 },
  pulsera: { min: 14, max: 24, defecto: 17 },
  tobillera: { min: 14, max: 24, defecto: 23 },
  collar: { min: 38, max: 60, defecto: 45 },
};

export const MONTAJE_DEFECTO = {
  soporte: 'ninguno',
  cadena: { estilo: 'rolo', largo_cm: 45 },
  tejido: { uso: 'pulsera', patron: 'macrame_plano', color: 'negro', largo_cm: 17 },
  balines: { cantidad: 0, diametro: 4, acabado: 'liso', distribucion: 'repartidos' },
};

const opcion = (v, lista, d) => (lista.includes(v) ? v : d);
const numero = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };

export function normalizarMontaje(m = {}, tipo = 'nombre') {
  const D = MONTAJE_DEFECTO;
  const c = m.cadena || {}, t = m.tejido || {}, b = m.balines || {};
  let soporte = opcion(m.soporte, SOPORTES, D.soporte);
  if (tipo === 'anillo') soporte = 'ninguno';
  const uso = opcion(t.uso, USOS_TEJIDO, D.tejido.uso);
  const lt = LARGOS[uso];
  const out = {
    soporte,
    cadena: {
      estilo: opcion(c.estilo, ESTILOS_CADENA, D.cadena.estilo),
      largo_cm: Math.round(numero(c.largo_cm, LARGOS.cadena.min, LARGOS.cadena.max, LARGOS.cadena.defecto)),
    },
    tejido: {
      uso,
      patron: opcion(t.patron, PATRONES, D.tejido.patron),
      color: opcion(t.color, COLORES_HILO, D.tejido.color),
      largo_cm: Math.round(numero(t.largo_cm, lt.min, lt.max, lt.defecto)),
    },
    balines: {
      cantidad: Math.round(numero(b.cantidad, 0, 20, 0)),
      diametro: DIAMETROS_BALIN.includes(Number(b.diametro)) ? Number(b.diametro) : D.balines.diametro,
      acabado: opcion(b.acabado, ACABADOS_BALIN, D.balines.acabado),
      distribucion: opcion(b.distribucion, DISTRIBUCIONES, D.balines.distribucion),
    },
  };
  // Sin soporte no hay dónde ensartar balines (el servidor también los pone en 0).
  if (soporte === 'ninguno') out.balines.cantidad = 0;
  return out;
}

// Balín = esfera HUECA de oro 18k, pared 0,3 mm (la perforación se ignora).
export function pesoBalin(diametro) {
  const r = diametro / 2, ri = Math.max(0, r - 0.3);
  return (15.5 / 1000) * (4 / 3) * Math.PI * (r ** 3 - ri ** 3);
}

// Largo de la cadena o del tejido en mm, y si el montaje se ve en el cuello, la muñeca o el tobillo.
export function lugarDe(m) {
  if (m.soporte === 'cadena') return 'cuello';
  if (m.soporte === 'tejido') return m.tejido.uso === 'collar' ? 'cuello' : m.tejido.uso === 'pulsera' ? 'muneca' : 'tobillo';
  return null;
}
export function largoMm(m) {
  return (m.soporte === 'cadena' ? m.cadena.largo_cm : m.tejido.largo_cm) * 10;
}
