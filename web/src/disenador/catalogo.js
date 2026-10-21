// Catálogo visual del diseñador: tipos de pieza, subcategorías, nombres legibles y parámetros de arranque.
// Lo usan la página /disena/ (galería del paso 1) y el inicio (categorías).

import { MOTIVOS_MEDALLA, FIGURAS_MOTIVO, SIGNOS_ZODIACO } from './esquema.js';

const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
export const miniatura = (clave) => `${base}miniaturas/${clave}.webp`;

export const NOMBRE_TIPO = {
  nombre: 'Dije con nombre', inicial: 'Inicial', placa: 'Placa', medalla: 'Medalla', cruz: 'Cruz', motivo: 'Dije clásico', anillo: 'Anillo',
};

const ZODIACO_NOMBRES = { aries: 'Aries', tauro: 'Tauro', geminis: 'Géminis', cancer: 'Cáncer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', escorpio: 'Escorpio', sagitario: 'Sagitario', capricornio: 'Capricornio', acuario: 'Acuario', piscis: 'Piscis' };

export const NOMBRES_OPCION = {
  motivo: { san_benito: 'San Benito', virgen_milagrosa: 'Virgen Milagrosa', guadalupe: 'Guadalupe', divino_nino: 'Divino Niño', sagrado_corazon: 'Sagrado Corazón', espiritu_santo: 'Espíritu Santo', angel_guarda: 'Ángel de la guarda' },
  estilo: { latina: 'Latina', griega: 'Griega', redondeada: 'Redondeada', con_borde: 'Con borde', florenzada: 'Florenzada', tau: 'Tau' },
  figura: {
    corazon: 'Corazón', infinito: 'Infinito', arbol_vida: 'Árbol de la vida', trebol: 'Trébol', herradura: 'Herradura', ojo_turco: 'Ojo turco',
    mano_fatima: 'Mano de Fátima', elefante: 'Elefante', luna_estrella: 'Luna y estrella', estrella: 'Estrella', huella: 'Huella',
    mapa_colombia: 'Mapa de Colombia', paloma: 'Paloma', angel: 'Ángel', mama: 'Mamá',
    ...Object.fromEntries(SIGNOS_ZODIACO.map((s) => [`zodiaco_${s}`, ZODIACO_NOMBRES[s]])),
  },
  base: { ninguna: 'Sin base', linea: 'Línea', doble: 'Doble' },
  adorno: { ninguno: 'Ninguno', corazon: 'Corazón', corona: 'Corona', estrella: 'Estrella', mariposa: 'Mariposa' },
  argolla: { izquierda: 'Izquierda', centro: 'Centro', derecha: 'Derecha', dos: 'Dos lados', arriba: 'Arriba', lateral: 'Lateral' },
  marco: { ninguno: 'Sin marco', circulo: 'Círculo', ovalo: 'Óvalo', corazon: 'Corazón' },
  forma: { rectangular: 'Rectangular', militar: 'Militar', ovalada: 'Ovalada', circulo: 'Círculo', corazon: 'Corazón', redonda: 'Redonda' },
  perfil: { plano: 'Plano', media_cana: 'Media caña', comodo: 'Cómodo', facetado: 'Facetado' },
  grabado_fuente: { serif: 'Clásica', script: 'Cursiva' },
  puntos: { unir: 'Unidos a la letra', corazon: 'Corazón', diamante: 'Diamante' },
  borde: { liso: 'Liso', cordon: 'Cordón', puntos: 'Perlado' },
  reverso: { liso: 'Liso', cruz_san_benito: 'Cruz de San Benito', grabado: 'Grabado' },
};

export const GRUPOS_FIGURA = [
  { id: 'clasicos', titulo: 'Clásicos', opciones: ['corazon', 'infinito', 'arbol_vida', 'trebol', 'estrella', 'luna_estrella', 'herradura'] },
  { id: 'proteccion', titulo: 'Protección y fe', opciones: ['ojo_turco', 'mano_fatima', 'paloma', 'angel', 'elefante'] },
  { id: 'historia', titulo: 'Con historia', opciones: ['mama', 'huella', 'mapa_colombia'] },
  { id: 'zodiaco', titulo: 'Signos del zodiaco', opciones: SIGNOS_ZODIACO.map((s) => `zodiaco_${s}`) },
];
void FIGURAS_MOTIVO;

export const PIEZAS = [
  { tipo: 'nombre', nombre: 'Nombre', desc: 'Tu nombre en cursiva o de molde', mini: 'nombre', destacada: true },
  {
    tipo: 'medalla', nombre: 'Medalla', desc: 'San Benito, vírgenes y santos en relieve', mini: 'medalla-san_benito',
    sub: { clave: 'motivo', titulo: 'Elige la medalla', opciones: MOTIVOS_MEDALLA },
  },
  {
    tipo: 'cruz', nombre: 'Cruz', desc: 'Latina, griega, florenzada… con punto de luz o Cristo', mini: 'cruz-latina',
    sub: { clave: 'estilo', titulo: 'Elige el estilo de la cruz', opciones: ['latina', 'griega', 'redondeada', 'con_borde', 'florenzada', 'tau'] },
  },
  {
    tipo: 'motivo', nombre: 'Dijes clásicos', desc: 'Corazón, árbol de la vida, ojo turco, zodiaco…', mini: 'motivo-arbol_vida',
    sub: { clave: 'figura', titulo: 'Elige el dije', grupos: GRUPOS_FIGURA },
  },
  { tipo: 'inicial', nombre: 'Inicial', desc: 'Una letra, con o sin marco', mini: 'inicial' },
  { tipo: 'placa', nombre: 'Placa', desc: 'Militar, corazón, ovalada… con grabado', mini: 'placa' },
  { tipo: 'anillo', nombre: 'Anillo', desc: 'Argolla con grabado interior', mini: 'anillo' },
];

// Lo primero que se ve al elegir cada tipo.
export const PARAMETROS_INICIALES = {
  nombre: { texto: 'Sofía', fuente: 'script1' },
  medalla: { motivo: 'san_benito', diametro: 18, borde: 'cordon', reverso: 'cruz_san_benito' },
  cruz: { estilo: 'latina', alto: 25, punto_luz: true },
  motivo: { figura: 'corazon', alto: 16 },
};

export function nombreDiseno(tipo, p = {}) {
  if (tipo === 'nombre') return `Dije con nombre «${p.texto || ''}»`;
  if (tipo === 'inicial') return `Inicial ${p.letra || ''}`;
  if (tipo === 'placa') return `Placa ${NOMBRES_OPCION.forma[p.forma] || ''}`.trim();
  if (tipo === 'medalla') return `Medalla ${NOMBRES_OPCION.motivo[p.motivo] || ''} de ${String(p.diametro).replace('.', ',')} mm${p.reverso === 'cruz_san_benito' ? ' con cruz de San Benito al reverso' : ''}`;
  if (tipo === 'cruz') return `Cruz ${(NOMBRES_OPCION.estilo[p.estilo] || '').toLowerCase()} de ${String(p.alto).replace('.', ',')} mm${p.cristo ? ' con Cristo' : ''}${p.punto_luz ? ' y punto de luz' : ''}`;
  if (tipo === 'motivo') {
    const n = NOMBRES_OPCION.figura[p.figura] || 'Dije';
    if (p.figura === 'mama') return `Dije Mamá${p.texto ? ` (${p.texto})` : ''}`;
    if (String(p.figura).startsWith('zodiaco_')) return `Dije signo ${n}`;
    return `Dije ${n.toLowerCase()}${p.calado ? ' calado' : ''}`;
  }
  if (tipo === 'anillo') return `Anillo talla ${String(p.talla).replace('.', ',')}`;
  return NOMBRE_TIPO[tipo] || 'Joya';
}
