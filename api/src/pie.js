// Borrador de producto a partir del PIE de foto que escribe Carlos (sin IA, ARQUITECTURA §4).
// Módulo puro: sin dependencias, se prueba con Node (api/pruebas/pie.test.mjs).
//
//   leerPie('Cadena lazo italiano 4,2 g', categorias)
//   → { nombre: 'Cadena lazo', categoria: 'cadenas', peso_gramos: 4.2, tipo_oro: 'italiano', medidas: '', descripcion: '' }
//
// - peso: «4,2 g», «4.2gr», «4,2 gramos», «3 grs», «peso: 5,6» (0 < g ≤ 500, 2 decimales)
// - tipo de oro: «italiano/italiana» → italiano; si no, nacional
// - categoría: palabras clave contra las categorías de la BD; gana la que aparece PRIMERO en el texto
// - medidas: «45 cm», «3 mm» (se sacan del nombre)
// - nombre: primera línea sin peso, tipo de oro ni medidas (o «Joya nueva»); el resto de líneas → descripción

/** Sin tildes y en minúsculas (para comparar). */
const plano = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
// unidad de peso seguida de algo que no sea letra (así «4 gold» o «3 granos» no cuentan)
const RX_PESO = new RegExp(String.raw`${NUM}\s*(?:gramos?|grms?|grs?|gms?|g)(?![a-zÀ-ɏ])\.?`, 'i');
const RX_PESO_ETIQUETA = new RegExp(String.raw`\bpeso\s*[:=]?\s*${NUM}(?:\s*(?:gramos?|grms?|grs?|gms?|g)(?![a-zÀ-ɏ])\.?)?`, 'i');
const RX_MEDIDA = new RegExp(String.raw`${NUM}\s*(cm|mm)(?![a-z])\.?`, 'gi');
const RX_ORO = /\b(?:(?:en\s+)?oro\s+)?(?:italian[oa]s?|nacional(?:es)?)\b/gi;

/** Palabras clave por categoría conocida (slug de la BD). Las desconocidas usan su slug y nombre. */
const CLAVES = {
  cadenas: ['cadena', 'cadenas', 'cadenita', 'cadenitas', 'gargantilla', 'gargantillas', 'collar', 'collares', 'choker'],
  pulseras: ['pulsera', 'pulseras', 'pulserita', 'brazalete', 'brazaletes', 'esclava', 'esclavas', 'manilla', 'manillas', 'tobillera', 'tobilleras'],
  aretes: ['arete', 'aretes', 'topo', 'topos', 'candonga', 'candongas', 'argolla', 'argollas', 'zarcillo', 'zarcillos',
    'pendiente', 'pendientes', 'earcuff', 'ear cuff', 'huggie', 'huggies'],
  anillos: ['anillo', 'anillos', 'sortija', 'sortijas', 'alianza', 'alianzas', 'solitario',
    'argolla de matrimonio', 'argollas de matrimonio', 'argollas matrimoniales', 'argolla matrimonial', 'argollas de compromiso', 'argolla de compromiso'],
  dijes: ['dije', 'dijes', 'dijecito', 'colgante', 'colgantes', 'medalla', 'medallas', 'escapulario', 'cruz', 'crucifijo'],
  conjuntos: ['conjunto', 'conjuntos', 'juego', 'set', 'combo', 'parure'],
};

const escaparRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Gramos «4,2» → 4.2 (null si no cuadra). */
export function gramos(s) {
  const n = Number(String(s ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n <= 500 ? Math.round(n * 100) / 100 : null;
}

/** Categoría (slug) por palabra clave; gana la primera que aparece en el texto. */
export function categoriaPorTexto(textoPie, categorias = []) {
  const t = ' ' + plano(textoPie).replace(/[^a-z0-9ñ]+/g, ' ') + ' ';
  let mejor = null;
  for (const c of categorias) {
    const slug = typeof c === 'string' ? c : c.slug;
    const nombre = typeof c === 'string' ? '' : c.nombre;
    const claves = new Set([...(CLAVES[slug] || []), plano(slug).replace(/-/g, ' '), plano(nombre)].filter(Boolean));
    // singular simple de categorías nuevas («llaveros» → «llavero»)
    for (const k of [...claves]) if (k.endsWith('s')) claves.add(k.replace(/(es|s)$/, '')).add(k.slice(0, -1));
    for (const k of claves) {
      if (k.length < 3) continue;
      const m = t.match(new RegExp(`\\s${escaparRx(k)}\\s`));
      if (!m) continue;
      // a igual posición gana la frase más larga («argollas de matrimonio» le gana a «argollas»)
      if (!mejor || m.index < mejor.pos || (m.index === mejor.pos && k.length > mejor.largo)) mejor = { slug, pos: m.index, largo: k.length };
    }
  }
  return mejor?.slug ?? null;
}

const limpiarNombre = (s) => s
  .replace(/\s*[(\[]\s*[)\]]\s*/g, ' ')        // paréntesis que quedaron vacíos
  .replace(/\s+([,.;:])/g, '$1')
  .replace(/\s{2,}/g, ' ')
  .replace(/^[\s\-–—·|,.;:/]+|[\s\-–—·|,.;:/]+$/g, '')
  .replace(/\s+(?:de|en|con|y|a)$/i, '')        // conector colgando al final («Topos de»)
  .trim();

/** Pie de foto → propuesta de borrador. `categorias` = [{slug, nombre}] o lista de slugs. */
export function leerPie(pie, categorias = []) {
  const crudo = String(pie ?? '').replace(/\r/g, '').trim();
  const t = plano(crudo);

  const mPeso = crudo.match(RX_PESO) || crudo.match(RX_PESO_ETIQUETA);
  const peso_gramos = mPeso ? gramos(mPeso[1]) : null;
  const tipo_oro = /\bitalian[oa]s?\b/.test(t) ? 'italiano' : 'nacional';
  const categoria = categoriaPorTexto(crudo, categorias);

  const lineas = crudo.split('\n').map((l) => l.trim()).filter(Boolean);
  const primera = lineas[0] || '';
  const medidas = [...primera.matchAll(RX_MEDIDA)].map((m) => `${m[1]} ${m[2].toLowerCase()}`).join(' · ');

  let nombre = primera
    .replace(RX_PESO_ETIQUETA, ' ')
    .replace(RX_PESO, ' ')
    .replace(RX_MEDIDA, ' ')
    .replace(RX_ORO, ' ');
  nombre = limpiarNombre(nombre).slice(0, 80);
  if (nombre) nombre = nombre[0].toLocaleUpperCase('es') + nombre.slice(1);

  return {
    nombre: nombre || 'Joya nueva',
    categoria,
    peso_gramos,
    tipo_oro,
    medidas,
    descripcion: lineas.slice(1).join('\n').slice(0, 1500),
  };
}
