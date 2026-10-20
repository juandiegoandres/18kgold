// Esquema de parámetros del diseñador (contrato de ARQUITECTURA.md §5).
// `normalizar(tipo, p)` completa con valores por defecto y recorta a los rangos válidos.

import { CLAVES_FUENTE } from './fuentes.js';

export const TIPOS = ['nombre', 'inicial', 'placa', 'medalla', 'cruz', 'motivo', 'anillo'];

export const MOTIVOS_MEDALLA = ['san_benito', 'virgen_milagrosa', 'guadalupe', 'divino_nino', 'sagrado_corazon', 'espiritu_santo', 'angel_guarda'];
export const SIGNOS_ZODIACO = ['aries', 'tauro', 'geminis', 'cancer', 'leo', 'virgo', 'libra', 'escorpio', 'sagitario', 'capricornio', 'acuario', 'piscis'];
export const FIGURAS_MOTIVO = [
  'corazon', 'infinito', 'arbol_vida', 'trebol', 'herradura', 'ojo_turco', 'mano_fatima', 'elefante',
  'luna_estrella', 'estrella', 'huella', 'mapa_colombia', 'paloma', 'angel', 'mama', ...SIGNOS_ZODIACO.map((s) => `zodiaco_${s}`),
];

// Argolla por donde pasa la cadena o el tejido (mm). Interior chico para cadenas finas de oro;
// pared ≥ 0,8 mm (regla de fundición).
export const ARGOLLA = { diametro_interior: 1.7, pared: 0.85 };

export const ESQUEMA = {
  nombre: {
    texto: { tipo: 'texto', defecto: 'Sofía', max: 14 },
    fuente: { tipo: 'opcion', opciones: CLAVES_FUENTE, defecto: 'script1' },
    alto: { tipo: 'numero', min: 8, max: 20, paso: 0.5, defecto: 12 },
    grosor: { tipo: 'numero', min: 0.8, max: 2.0, paso: 0.1, defecto: 1.2 },
    base: { tipo: 'opcion', opciones: ['ninguna', 'linea', 'doble'], defecto: 'ninguna' },
    adorno: { tipo: 'opcion', opciones: ['ninguno', 'corazon', 'corona', 'estrella', 'mariposa'], defecto: 'ninguno' },
    argolla: { tipo: 'opcion', opciones: ['izquierda', 'centro', 'derecha', 'dos'], defecto: 'dos' },
    puntos: { tipo: 'opcion', opciones: ['unir', 'corazon', 'diamante'], defecto: 'unir' },
  },
  inicial: {
    letra: { tipo: 'texto', defecto: 'S', max: 1 },
    fuente: { tipo: 'opcion', opciones: CLAVES_FUENTE, defecto: 'serif' },
    alto: { tipo: 'numero', min: 10, max: 25, paso: 0.5, defecto: 16 },
    grosor: { tipo: 'numero', min: 1.0, max: 2.0, paso: 0.1, defecto: 1.4 },
    marco: { tipo: 'opcion', opciones: ['ninguno', 'circulo', 'ovalo', 'corazon'], defecto: 'circulo' },
    argolla: { tipo: 'booleano', defecto: true },
  },
  placa: {
    forma: { tipo: 'opcion', opciones: ['rectangular', 'militar', 'ovalada', 'circulo', 'corazon'], defecto: 'militar' },
    ancho: { tipo: 'numero', min: 12, max: 35, paso: 0.5, defecto: 18 },
    alto: { tipo: 'numero', min: 15, max: 45, paso: 0.5, defecto: 28 },
    grosor: { tipo: 'numero', min: 0.8, max: 2.0, paso: 0.1, defecto: 1.0 },
    grabado_frente: { tipo: 'texto', defecto: '', max: 40 },
    grabado_reverso: { tipo: 'texto', defecto: '', max: 60 },
    grabado_fuente: { tipo: 'opcion', opciones: ['serif', 'script'], defecto: 'serif' },
    argolla: { tipo: 'opcion', opciones: ['arriba', 'lateral'], defecto: 'arriba' },
  },
  medalla: {
    motivo: { tipo: 'opcion', opciones: MOTIVOS_MEDALLA, defecto: 'san_benito' },
    diametro: { tipo: 'numero', min: 12, max: 25, paso: 0.5, defecto: 18 },
    forma: { tipo: 'opcion', opciones: ['redonda', 'ovalada'], defecto: 'redonda' },
    borde: { tipo: 'opcion', opciones: ['liso', 'cordon', 'puntos'], defecto: 'cordon' },
    grosor: { tipo: 'numero', min: 1.0, max: 2.0, paso: 0.1, defecto: 1.1 },
    reverso: { tipo: 'opcion', opciones: ['liso', 'cruz_san_benito', 'grabado'], defecto: 'cruz_san_benito' },
    grabado_reverso: { tipo: 'texto', defecto: '', max: 60 },
    grabado_fuente: { tipo: 'opcion', opciones: ['serif', 'script'], defecto: 'serif' },
    argolla: { tipo: 'opcion', opciones: ['arriba'], defecto: 'arriba' },
  },
  cruz: {
    estilo: { tipo: 'opcion', opciones: ['latina', 'griega', 'redondeada', 'con_borde', 'florenzada', 'tau'], defecto: 'latina' },
    alto: { tipo: 'numero', min: 12, max: 40, paso: 0.5, defecto: 25 },
    brazo: { tipo: 'numero', min: 1.5, max: 5, paso: 0.1, defecto: 3.0 },
    grosor: { tipo: 'numero', min: 1.0, max: 2.5, paso: 0.1, defecto: 1.4 },
    punto_luz: { tipo: 'booleano', defecto: false },
    cristo: { tipo: 'booleano', defecto: false },
    argolla: { tipo: 'opcion', opciones: ['arriba'], defecto: 'arriba' },
  },
  motivo: {
    figura: { tipo: 'opcion', opciones: FIGURAS_MOTIVO, defecto: 'corazon' },
    alto: { tipo: 'numero', min: 10, max: 30, paso: 0.5, defecto: 16 },
    grosor: { tipo: 'numero', min: 0.8, max: 2.0, paso: 0.1, defecto: 1.2 },
    calado: { tipo: 'booleano', defecto: false },
    texto: { tipo: 'texto', defecto: '', max: 40 },
    argolla: { tipo: 'opcion', opciones: ['arriba', 'lateral'], defecto: 'arriba' },
  },
  anillo: {
    talla: { tipo: 'numero', min: 4, max: 14, paso: 0.5, defecto: 7 },
    ancho: { tipo: 'numero', min: 2, max: 10, paso: 0.5, defecto: 4 },
    grosor: { tipo: 'numero', min: 1.2, max: 2.5, paso: 0.1, defecto: 1.6 },
    perfil: { tipo: 'opcion', opciones: ['plano', 'media_cana', 'comodo', 'facetado'], defecto: 'comodo' },
    grabado_interior: { tipo: 'texto', defecto: '', max: 30 },
    grabado_fuente: { tipo: 'opcion', opciones: ['serif', 'script'], defecto: 'serif' },
  },
};

export const COMUN = {
  tipo_oro: { tipo: 'opcion', opciones: ['nacional', 'italiano'], defecto: 'nacional' },
  acabado: { tipo: 'opcion', opciones: ['brillante', 'mate', 'rose'], defecto: 'brillante' },
};

export function diametroInterior(talla) {
  return 11.63 + 0.8128 * talla;
}

function normalizarCampo(def, v) {
  if (def.tipo === 'numero') {
    const n = Number(v);
    if (!Number.isFinite(n)) return def.defecto;
    return Math.min(def.max, Math.max(def.min, n));
  }
  if (def.tipo === 'opcion') return def.opciones.includes(v) ? v : def.defecto;
  if (def.tipo === 'booleano') return v === undefined ? def.defecto : Boolean(v);
  if (def.tipo === 'texto') {
    if (v === undefined || v === null) return def.defecto;
    return String(v).replace(/[\r\n\t]+/g, ' ').slice(0, def.max);
  }
  return v;
}

export function normalizar(tipo, p = {}) {
  const esq = ESQUEMA[tipo];
  if (!esq) throw new Error(`Tipo de diseño desconocido: ${tipo}`);
  const out = {};
  for (const [k, def] of Object.entries(esq)) out[k] = normalizarCampo(def, p[k]);
  for (const [k, def] of Object.entries(COMUN)) out[k] = normalizarCampo(def, p[k]);
  if (tipo === 'nombre' && !out.texto.trim()) out.texto = ESQUEMA.nombre.texto.defecto;
  // Texto corto del motivo: 12 caracteres; en «mama» son los nombres de los hijos (hasta 40).
  if (tipo === 'motivo' && out.figura !== 'mama') out.texto = out.texto.slice(0, 12);
  if (tipo === 'inicial') {
    const l = (out.letra || '').trim();
    out.letra = l ? l[0].toUpperCase() : 'S';
  }
  return out;
}

export function porDefecto(tipo) {
  return normalizar(tipo, {});
}
