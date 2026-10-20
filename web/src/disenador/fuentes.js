// Catálogo de tipografías del diseñador (todas OFL, archivos en /public/fuentes/).
// `refuerzo` = radio (mm) del engrosado de trazo: las cursivas tienen perfiles muy finos que no
// sobrevivirían la fundición; con el engrosado el trazo más delgado queda alrededor de 0,5–0,7 mm.
// `espaciado` = ajuste de tracking (fracción del tamaño) para que las letras encadenen.

// `union` = radio (mm, para letra de 12 mm) del cierre morfológico que suelda lo que casi se toca.
// Cursivas elegidas tras comparar 8 en nombres reales (Sofía, María José, Valentina, Juan José,
// Isabella) a 12 mm: quedan las que se leen limpias y encadenan sin enredarse. Se descartaron Great
// Vibes y Allura (trazos finos que se enredan al soldar), Yellowtail y Kaushan (manchas de pincel)
// y Satisfy (tildes y trazos bajo 0,5 mm).
export const FUENTES = {
  script1: { nombre: 'Damion', archivo: 'Damion-Regular.ttf', familiaCss: 'KP Damion', refuerzo: 0.04, espaciado: -0.025, union: 0.32, cursiva: true },
  script2: { nombre: 'Pacifico', archivo: 'Pacifico-Regular.ttf', familiaCss: 'KP Pacifico', refuerzo: 0, espaciado: -0.02, union: 0.3, cursiva: true },
  // Dancing Script se OCULTA del selector (ronda 3): a 8–10 mm su «í» y su «a» se empastan («Sofía» se leía
  // «Sofua») aun con el cierre a escala. Se conserva para abrir diseños viejos.
  script3: { nombre: 'Dancing Script', archivo: 'DancingScript.ttf', familiaCss: 'KP Dancing Script', refuerzo: 0.07, espaciado: -0.03, union: 0.35, variacion: { wght: 700 }, cursiva: true, oculta: true },
  serif: { nombre: 'Cormorant Garamond', archivo: 'CormorantGaramond-Bold.ttf', familiaCss: 'KP Cormorant', refuerzo: 0.06, espaciado: 0.02, union: 0.25, cursiva: false },
  bloque: { nombre: 'Bebas Neue', archivo: 'BebasNeue-Regular.ttf', familiaCss: 'KP Bebas', refuerzo: 0, espaciado: 0.03, union: 0.25, cursiva: false },
};

// Solo para la vista previa del grabado láser (no se funde): letra cursiva fina.
export const FUENTES_GRABADO_CSS = {
  grabado_script: { nombre: 'Great Vibes', archivo: 'GreatVibes-Regular.ttf', familiaCss: 'KP Great Vibes' },
};

export const CLAVES_FUENTE = Object.keys(FUENTES);
