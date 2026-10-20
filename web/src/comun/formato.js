// Formatos para Colombia. Pesos sin decimales: «$ 1.234.500».

const decimales = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/** 1234500 → «$ 1.234.500» (agrupación manual: Intl no agrupa 4 cifras en es-CO). */
export function pesos(valor) {
  const n = Math.round(Number(valor) || 0);
  const txt = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '−' : ''}$ ${txt}`;
}

/** 0.7 → «0,7 g» */
export function gramos(valor) {
  return `${decimales.format(Number(valor) || 0)} g`;
}

/** «2026-07-28 01:16:48» → «28 de julio de 2026» */
export function fechaLarga(valor) {
  const f = valor ? new Date(String(valor).replace(' ', 'T')) : new Date();
  if (Number.isNaN(f.getTime())) return '';
  return f.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Hoy en formato corto: «17/10/2026» */
export function hoyCorto() {
  return new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function nombreOro(tipo) {
  return tipo === 'italiano' ? 'Oro italiano ley 750' : 'Oro nacional 18k';
}

/** Escapa texto para insertar en plantillas HTML. */
export function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Quita emojis de textos que vienen de la base (regla: sin emojis en la interfaz). */
export function sinEmojis(texto) {
  return String(texto ?? '').replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/[ \t]+\n/g, '\n').trim();
}

/** Ruta interna respetando la base de Vite (GitHub Pages puede servir bajo /repo/). */
export function ruta(camino = '') {
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/$/, '') + '/' + String(camino).replace(/^\//, '');
}

/** Enlace wa.me con texto. */
export function enlaceWhatsApp(numero, texto = '') {
  const n = String(numero || '573178861724').replace(/\D/g, '');
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}
