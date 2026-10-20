// Esquema de parámetros del diseñador (ARQUITECTURA §5). Valida y recorta a rangos.

const FUENTES = ['script1', 'script2', 'script3', 'serif', 'bloque'];
const PUNTOS = { t: 'enum', v: ['unir', 'corazon', 'diamante'], def: 'unir', alias: { unidos: 'unir' } };
const GRABADO_FUENTE = { t: 'enum', v: ['serif', 'script'], def: 'serif', alias: { clasica: 'serif' } };

export const MOTIVOS_MEDALLA = ['san_benito', 'virgen_milagrosa', 'guadalupe', 'divino_nino', 'sagrado_corazon', 'espiritu_santo', 'angel_guarda'];
export const SIGNOS = ['aries', 'tauro', 'geminis', 'cancer', 'leo', 'virgo', 'libra', 'escorpio', 'sagitario', 'capricornio', 'acuario', 'piscis'];
export const FIGURAS = ['corazon', 'infinito', 'arbol_vida', 'trebol', 'herradura', 'ojo_turco', 'mano_fatima', 'elefante',
  'luna_estrella', 'estrella', 'huella', 'mapa_colombia', 'paloma', 'angel', 'mama', ...SIGNOS.map((s) => `zodiaco_${s}`)];

export const ESQUEMA = {
  nombre: {
    texto: { t: 'texto', max: 14, def: 'Ana' },
    fuente: { t: 'enum', v: FUENTES, def: 'script1' },
    alto: { t: 'num', min: 8, max: 20, def: 12 },
    grosor: { t: 'num', min: 0.8, max: 2.0, def: 1.2 },
    base: { t: 'enum', v: ['ninguna', 'linea', 'doble'], def: 'ninguna' },
    adorno: { t: 'enum', v: ['ninguno', 'corazon', 'corona', 'estrella', 'mariposa'], def: 'ninguno' },
    argolla: { t: 'enum', v: ['izquierda', 'centro', 'derecha', 'dos'], def: 'izquierda' },
    puntos: PUNTOS,
  },
  inicial: {
    letra: { t: 'texto', max: 1, def: 'A', mayus: true },
    fuente: { t: 'enum', v: FUENTES, def: 'serif' },
    alto: { t: 'num', min: 10, max: 25, def: 15 },
    grosor: { t: 'num', min: 1.0, max: 2.0, def: 1.2 },
    marco: { t: 'enum', v: ['ninguno', 'circulo', 'ovalo', 'corazon'], def: 'ninguno' },
    argolla: { t: 'bool', def: true },
    puntos: PUNTOS,
  },
  placa: {
    forma: { t: 'enum', v: ['rectangular', 'militar', 'ovalada', 'circulo', 'corazon'], def: 'rectangular' },
    ancho: { t: 'num', min: 12, max: 35, def: 20 },
    alto: { t: 'num', min: 15, max: 45, def: 30 },
    grosor: { t: 'num', min: 0.8, max: 2.0, def: 1.0 },
    grabado_frente: { t: 'texto', max: 40, def: '' },
    grabado_reverso: { t: 'texto', max: 40, def: '' },
    grabado_fuente: GRABADO_FUENTE,
    argolla: { t: 'enum', v: ['arriba', 'lateral'], def: 'arriba' },
  },
  anillo: {
    talla: { t: 'num', min: 4, max: 14, def: 7, paso: 0.5 },
    ancho: { t: 'num', min: 2, max: 10, def: 4 },
    grosor: { t: 'num', min: 1.2, max: 2.5, def: 1.6 },
    perfil: { t: 'enum', v: ['plano', 'media_cana', 'comodo', 'facetado'], def: 'plano' },
    grabado_interior: { t: 'texto', max: 30, def: '' },
    grabado_fuente: GRABADO_FUENTE,
  },
  medalla: {
    motivo: { t: 'enum', v: MOTIVOS_MEDALLA, def: 'san_benito' },
    diametro: { t: 'num', min: 12, max: 25, def: 18, paso: 0.5 }, // atajos 12, 15, 18, 22
    forma: { t: 'enum', v: ['redonda', 'ovalada'], def: 'redonda' },
    borde: { t: 'enum', v: ['liso', 'cordon', 'puntos'], def: 'liso' },
    grosor: { t: 'num', min: 1.0, max: 2.0, def: 1.2 },
    reverso: { t: 'enum', v: ['liso', 'cruz_san_benito', 'grabado'], def: 'liso' },
    grabado_reverso: { t: 'texto', max: 40, def: '' },
    grabado_fuente: GRABADO_FUENTE,
    argolla: { t: 'enum', v: ['arriba'], def: 'arriba' },
  },
  cruz: {
    estilo: { t: 'enum', v: ['latina', 'griega', 'redondeada', 'con_borde', 'florenzada', 'tau'], def: 'latina' },
    alto: { t: 'num', min: 12, max: 40, def: 25 },
    brazo: { t: 'num', min: 1.5, max: 5, def: 3 },
    grosor: { t: 'num', min: 1.0, max: 2.5, def: 1.5 },
    punto_luz: { t: 'bool', def: false },
    cristo: { t: 'bool', def: false },
    argolla: { t: 'enum', v: ['arriba'], def: 'arriba' },
  },
  motivo: {
    figura: { t: 'enum', v: FIGURAS, def: 'corazon' },
    alto: { t: 'num', min: 10, max: 30, def: 15 },
    grosor: { t: 'num', min: 0.8, max: 2.0, def: 1.0 },
    calado: { t: 'bool', def: false },
    texto: { t: 'texto', max: 40, def: '' }, // 12 salvo en «mama» (nombres de los hijos)
    argolla: { t: 'enum', v: ['arriba', 'lateral'], def: 'arriba' },
  },
};

export const COMUN = {
  tipo_oro: { t: 'enum', v: ['nacional', 'italiano'], def: 'nacional' },
  acabado: { t: 'enum', v: ['brillante', 'mate', 'rose'], def: 'brillante' },
  contraccion: { t: 'num', min: 0, max: 5, def: 0 },
};

export const TIPOS = Object.keys(ESQUEMA);

function normalizarCampo(def, valor) {
  if (valor === undefined || valor === null || valor === '') return def.def;
  switch (def.t) {
    case 'num': {
      let n = Number(String(valor).replace(',', '.'));
      if (!Number.isFinite(n)) return def.def;
      n = Math.min(def.max, Math.max(def.min, n));
      const paso = def.paso || 0.1;
      return Number((Math.round(n / paso) * paso).toFixed(2));
    }
    case 'enum': {
      const v = String(valor).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s-]+/g, '_');
      const w = def.alias?.[v] ?? v; // nombres viejos del contrato
      return def.v.includes(w) ? w : def.def;
    }
    case 'bool':
      return typeof valor === 'boolean' ? valor : ['true', '1', 'si', 'sí'].includes(String(valor).toLowerCase());
    case 'texto': {
      let s = String(valor).normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff<>]/g, ' ')
        .replace(/\s+/g, ' ').trim();
      s = Array.from(s).slice(0, def.max).join('').trim();
      return def.mayus ? s.toUpperCase() : s;
    }
  }
  return def.def;
}

/** Devuelve parámetros limpios: solo campos conocidos, recortados a rango, con defectos. */
export function normalizarParametros(tipo, p = {}) {
  if (!ESQUEMA[tipo]) throw new Error('tipo inválido');
  p = p && typeof p === 'object' ? p : {};
  const fuente = typeof p.comun === 'object' && p.comun ? { ...p.comun, ...p } : p;
  const out = {};
  for (const [k, def] of Object.entries({ ...ESQUEMA[tipo], ...COMUN })) out[k] = normalizarCampo(def, fuente[k]);
  // Medalla: el grabado del reverso solo existe si el reverso es «grabado» (si no, el láser no tiene nada que hacer).
  if (tipo === 'medalla' && out.reverso !== 'grabado') out.grabado_reverso = '';
  // Dije Mamá: nombres de los hijos separados por coma → «Sofía, Juan» (hasta 40). Otros motivos: hasta 12.
  if (tipo === 'motivo' && out.figura === 'mama' && out.texto) {
    const t = out.texto.split(/\s*,\s*/).filter(Boolean).join(', ');
    out.texto = Array.from(t).slice(0, ESQUEMA.motivo.texto.max).join('').replace(/[,\s]+$/, '');
  } else if (tipo === 'motivo') out.texto = Array.from(out.texto).slice(0, 12).join('').trim();
  return out;
}

// ---------------------------------------------------------------- montaje (§5)
// Cómo se lleva la pieza. El STL es SOLO la pieza de oro; el montaje cambia peso y precio.

export const MONTAJE = {
  soporte: { t: 'enum', v: ['ninguno', 'cadena', 'tejido'], def: 'ninguno' },
  cadena: {
    estilo: { t: 'enum', v: ['rolo', 'cartier', 'lazo', 'veneciana', 'singapur'], def: 'rolo' },
    largo_cm: { t: 'num', min: 40, max: 60, def: 45, paso: 1 },
  },
  tejido: {
    uso: { t: 'enum', v: ['pulsera', 'tobillera', 'collar'], def: 'pulsera' },
    patron: { t: 'enum', v: ['macrame_plano', 'espiral', 'trenza', 'cola_raton', 'serpiente'], def: 'macrame_plano' },
    color: { t: 'enum', v: ['negro', 'rojo', 'blanco', 'azul', 'cafe', 'verde', 'rosado', 'beige'], def: 'negro' },
    largo_cm: { t: 'num', min: 14, max: 24, def: 18, paso: 0.5 }, // collar: 38–60 (ver LARGO_COLLAR)
  },
  balines: {
    cantidad: { t: 'num', min: 0, max: 20, def: 0, paso: 1 },
    diametro: { t: 'enum', v: ['3', '4', '5', '6'], def: '4' }, // número 3|4|5|6 (se redondea y recorta)
    acabado: { t: 'enum', v: ['liso', 'diamantado'], def: 'liso' },
    distribucion: { t: 'enum', v: ['junto_al_dije', 'repartidos', 'extremos'], def: 'junto_al_dije' },
  },
};
const LARGO_COLLAR = { t: 'num', min: 38, max: 60, def: 45, paso: 0.5 };
const LARGO_TOBILLERA_DEF = 23;

const normalizarGrupo = (esq, v) => {
  v = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const out = {};
  for (const [k, def] of Object.entries(esq)) out[k] = normalizarCampo(def, v[k]);
  return out;
};

/**
 * Montaje limpio y recortado a rangos. Solo trae el sub-objeto del soporte elegido.
 * Sin soporte (ninguno) no hay dónde ensartar balines: cantidad = 0.
 */
export function normalizarMontaje(m) {
  m = m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  const soporte = normalizarCampo(MONTAJE.soporte, m.soporte);
  const out = { soporte };
  if (soporte === 'cadena') out.cadena = normalizarGrupo(MONTAJE.cadena, m.cadena);
  if (soporte === 'tejido') {
    const uso = normalizarCampo(MONTAJE.tejido.uso, m.tejido?.uso);
    const largo = uso === 'collar' ? LARGO_COLLAR
      : uso === 'tobillera' ? { ...MONTAJE.tejido.largo_cm, def: LARGO_TOBILLERA_DEF } : MONTAJE.tejido.largo_cm;
    out.tejido = normalizarGrupo({ ...MONTAJE.tejido, largo_cm: largo }, m.tejido);
  }
  const b = normalizarGrupo(MONTAJE.balines, m.balines);
  const d = Number(String(m.balines?.diametro ?? '').replace(',', '.'));
  b.diametro = Number.isFinite(d) && d > 0 ? Math.min(6, Math.max(3, Math.round(d))) : 4; // 3|4|5|6 mm
  b.cantidad = soporte === 'ninguno' ? 0 : Math.round(b.cantidad);
  out.balines = b;
  return out;
}

const NOMBRE = {
  macrame_plano: 'macramé plano', cola_raton: 'cola de ratón', cafe: 'café', junto_al_dije: 'junto al dije',
  repartidos: 'repartidos', extremos: 'en los extremos',
};
const legible = (v) => NOMBRE[v] || String(v).replace(/_/g, ' ');

/** «Pulsera tejida en nylon · macramé plano · negro · 18 cm · 6 balines de 4 mm diamantados, repartidos» */
export function describirMontaje(m) {
  if (!m) return 'Sin montaje (solo la pieza)';
  const partes = [];
  if (m.soporte === 'tejido' && m.tejido) {
    const uso = { pulsera: 'Pulsera tejida', tobillera: 'Tobillera tejida', collar: 'Collar tejido' }[m.tejido.uso];
    partes.push(`${uso} en nylon`, legible(m.tejido.patron), legible(m.tejido.color), `${String(m.tejido.largo_cm).replace('.', ',')} cm`);
  } else if (m.soporte === 'cadena' && m.cadena) {
    partes.push(`En cadena ${legible(m.cadena.estilo)} de ${m.cadena.largo_cm} cm`);
  } else {
    partes.push('Sin montaje (solo la pieza)');
  }
  const b = m.balines;
  if (b?.cantidad > 0) {
    const acabado = b.acabado === 'diamantado' ? (b.cantidad > 1 ? 'diamantados' : 'diamantado') : (b.cantidad > 1 ? 'lisos' : 'liso');
    partes.push(`${b.cantidad} ${b.cantidad > 1 ? 'balines' : 'balín'} de ${b.diametro} mm ${acabado}, ${legible(b.distribucion)}`);
  }
  if (m.soporte === 'cadena') partes.push('cadena: se cotiza aparte');
  return partes.join(' · ');
}

// ---------------------------------------------------------------- descripción legible (aviso a Carlos)

const SIGNO_NOMBRE = {
  aries: 'Aries', tauro: 'Tauro', geminis: 'Géminis', cancer: 'Cáncer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra',
  escorpio: 'Escorpio', sagitario: 'Sagitario', capricornio: 'Capricornio', acuario: 'Acuario', piscis: 'Piscis',
};

/** Nombre bonito de cada valor de lista (lo que no está aquí se muestra con los «_» como espacios). */
export const VALOR_LEGIBLE = {
  // fuentes
  script1: 'script 1 (Damion)', script2: 'script 2 (Pacifico)', script3: 'script 3 (Dancing Script)', serif: 'serif', bloque: 'bloque',
  script: 'script',
  // nombre / inicial / placa / anillo
  linea: 'línea', corazon: 'corazón', circulo: 'círculo', ovalo: 'óvalo', media_cana: 'media caña', comodo: 'cómodo',
  unir: 'unidos', diamante: 'diamante',
  // medalla
  san_benito: 'San Benito', virgen_milagrosa: 'Virgen Milagrosa', guadalupe: 'Virgen de Guadalupe', divino_nino: 'Divino Niño',
  sagrado_corazon: 'Sagrado Corazón', espiritu_santo: 'Espíritu Santo', angel_guarda: 'Ángel de la Guarda',
  cordon: 'cordón', cruz_san_benito: 'cruz de San Benito',
  // cruz
  con_borde: 'con borde',
  // motivo
  arbol_vida: 'árbol de la vida', trebol: 'trébol', ojo_turco: 'ojo turco', mano_fatima: 'mano de Fátima',
  luna_estrella: 'luna y estrella', mapa_colombia: 'mapa de Colombia', angel: 'ángel', mama: 'Mamá',
  ...Object.fromEntries(Object.entries(SIGNO_NOMBRE).map(([k, v]) => [`zodiaco_${k}`, `signo de ${v}`])),
};
export const valorLegible = (v) => (typeof v === 'boolean' ? (v ? 'sí' : 'no') : VALOR_LEGIBLE[v] || String(v).replace(/_/g, ' '));

const mm = (n) => `${String(n).replace('.', ',')} mm`;
const comillas = (t) => `«${t}»`;

const MEDALLA_DE = {
  san_benito: 'de San Benito', virgen_milagrosa: 'de la Virgen Milagrosa', guadalupe: 'de la Virgen de Guadalupe',
  divino_nino: 'del Divino Niño', sagrado_corazon: 'del Sagrado Corazón', espiritu_santo: 'del Espíritu Santo',
  angel_guarda: 'del Ángel de la Guarda',
};

/**
 * Una línea en español para el aviso de Telegram, a partir de parámetros YA normalizados.
 * «Medalla de San Benito · 18 mm · borde cordón · reverso cruz de San Benito», «Cruz latina 25 mm con punto de luz»,
 * «Dije ojo turco 14 mm calado», «Signo de Leo», «Dije Mamá: Sofía, Juan».
 */
export function describirDiseno(tipo, p = {}) {
  switch (tipo) {
    case 'nombre': {
      const partes = [`Nombre ${comillas(p.texto)} en ${valorLegible(p.fuente)}`, mm(p.alto)];
      if (p.puntos && p.puntos !== 'unir') partes.push(`puntos ${valorLegible(p.puntos)}`);
      if (p.adorno && p.adorno !== 'ninguno') partes.push(`adorno ${valorLegible(p.adorno)}`);
      if (p.base && p.base !== 'ninguna') partes.push(`base ${valorLegible(p.base)}`);
      return partes.join(' · ');
    }
    case 'inicial': {
      const partes = [`Inicial ${p.letra} en ${valorLegible(p.fuente)}`, mm(p.alto)];
      if (p.marco && p.marco !== 'ninguno') partes.push(`marco ${valorLegible(p.marco)}`);
      if (p.puntos && p.puntos !== 'unir') partes.push(`puntos ${valorLegible(p.puntos)}`);
      return partes.join(' · ');
    }
    case 'placa': {
      const partes = [`Placa ${valorLegible(p.forma)} ${String(p.ancho).replace('.', ',')} × ${mm(p.alto)}`];
      if (p.grabado_frente) partes.push(`frente ${comillas(p.grabado_frente)}`);
      if (p.grabado_reverso) partes.push(`reverso ${comillas(p.grabado_reverso)}`);
      if (p.grabado_frente || p.grabado_reverso) partes.push(`letra ${valorLegible(p.grabado_fuente)}`);
      return partes.join(' · ');
    }
    case 'anillo': {
      const partes = [`Anillo talla ${String(p.talla).replace('.', ',')}`, `${mm(p.ancho)} de ancho`, `perfil ${valorLegible(p.perfil)}`];
      if (p.grabado_interior) partes.push(`grabado interior ${comillas(p.grabado_interior)} (letra ${valorLegible(p.grabado_fuente)})`);
      return partes.join(' · ');
    }
    case 'medalla': {
      const partes = [`Medalla ${MEDALLA_DE[p.motivo] || valorLegible(p.motivo)}${p.forma === 'ovalada' ? ' ovalada' : ''}`, mm(p.diametro),
        p.borde === 'puntos' ? 'borde de puntos' : `borde ${valorLegible(p.borde)}`];
      if (p.reverso === 'grabado') {
        partes.push(p.grabado_reverso ? `reverso grabado ${comillas(p.grabado_reverso)} (letra ${valorLegible(p.grabado_fuente)})` : 'reverso grabado (sin texto)');
      } else {
        partes.push(`reverso ${valorLegible(p.reverso)}`);
      }
      return partes.join(' · ');
    }
    case 'cruz': {
      const extras = [p.cristo && 'Cristo en relieve', p.punto_luz && 'punto de luz'].filter(Boolean);
      return `Cruz ${valorLegible(p.estilo)} ${mm(p.alto)}${extras.length ? ` con ${extras.join(' y ')}` : ''}`;
    }
    case 'motivo': {
      const calado = p.calado ? ' calado' : '';
      let base;
      if (String(p.figura).startsWith('zodiaco_')) base = `Signo de ${SIGNO_NOMBRE[p.figura.slice(8)] || p.figura.slice(8)}${calado}`;
      else if (p.figura === 'mama') return `Dije Mamá${p.texto ? `: ${p.texto}` : ''}${calado}`;
      else base = `Dije ${valorLegible(p.figura)} ${mm(p.alto)}${calado}`;
      return p.texto ? `${base} · texto ${comillas(p.texto)}` : base;
    }
  }
  return String(tipo);
}
