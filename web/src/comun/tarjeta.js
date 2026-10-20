// Tarjeta de joya (4:5 recortada), fotos con carga diferida + fundido, y estados vacíos.

import { esc, gramos, pesos, ruta, enlaceWhatsApp } from './formato.js';
import { ico } from './iconos.js';

export function urlJoya(slug) {
  return ruta(`joya/?p=${encodeURIComponent(slug)}`);
}

export function etiquetaDescuento(p) {
  if (!p.precio_antes || p.precio_antes <= p.precio) return '';
  return `−${Math.round((1 - p.precio / p.precio_antes) * 100)}%`;
}

/** <figure> con foto 4:5. `prioridad` = carga inmediata (primer pliegue). */
export function fotoJoya(src, alt, { prioridad = false, clase = '' } = {}) {
  if (!src) return `<div class="marco-foto sin-foto ${clase}" role="img" aria-label="${esc(alt)}, sin foto"></div>`;
  return `<div class="marco-foto ${clase}">
    <img class="foto" src="${esc(src)}" alt="${esc(alt)}" ${prioridad ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  </div>`;
}

export function tarjetaJoya(p, { prioridad = false } = {}) {
  const desc = etiquetaDescuento(p);
  const meta = p.tipo_precio === 'gramo' ? gramos(p.peso_gramos) : 'Precio por joya';
  return `<article class="tarjeta">
    <a class="tarjeta-enlace" href="${urlJoya(p.slug)}">
      <div class="tarjeta-foto">
        ${fotoJoya(p.imagenes?.[0], p.nombre, { prioridad })}
        ${desc ? `<span class="sello sello-oferta">${desc}</span>` : ''}
      </div>
      <div class="tarjeta-cuerpo">
        <span class="tarjeta-meta">${esc(p.categoria_nombre || 'Joyería')}<i aria-hidden="true"></i>${p.tipo_oro === 'italiano' ? 'Italiano 750' : 'Nacional 18k'}</span>
        <h3 class="tarjeta-nombre">${esc(p.nombre)}</h3>
        <div class="tarjeta-pie">
          <span class="tarjeta-precio"><b>${pesos(p.precio)}</b>${p.precio_antes ? `<s><span class="solo-lectores">Antes </span>${pesos(p.precio_antes)}</s>` : ''}</span>
          <span class="tarjeta-peso">${meta}</span>
        </div>
      </div>
    </a>
  </article>`;
}

/** Fundido de las fotos al cargar; si fallan, marco hueso con la marca (sin espacios en blanco). */
export function activarFotos(raiz = document) {
  raiz.querySelectorAll('img.foto:not([data-vista])').forEach((img) => {
    img.dataset.vista = '1';
    const listo = () => img.classList.add('cargada');
    const fallo = () => {
      const marco = img.closest('.marco-foto');
      if (marco) {
        marco.classList.add('sin-foto');
        marco.setAttribute('role', 'img');
        marco.setAttribute('aria-label', img.alt ? `${img.alt}, sin foto` : 'Sin foto');
      }
      img.remove();
    };
    if (img.complete) img.naturalWidth ? listo() : fallo();
    else {
      img.addEventListener('load', listo, { once: true });
      img.addEventListener('error', fallo, { once: true });
    }
  });
}

/** Estado vacío digno (sin pantallas rotas). */
export function estadoVacio({ titulo, texto, accion = '', whatsapp = '573178861724' }) {
  return `<div class="vacio">
    <span class="vacio-ico" aria-hidden="true">${ico('diamante', { tam: 28 })}</span>
    <h2 class="titulo-m">${titulo}</h2>
    <p class="tenue">${texto}</p>
    <div class="vacio-acciones">
      ${accion}
      <a class="boton boton-linea" href="${enlaceWhatsApp(whatsapp, 'Hola, quiero ver el catálogo de 18gold KPrada.')}" target="_blank" rel="noopener">${ico('whatsapp', { tam: 18 })}Escribir a Carlos</a>
    </div>
  </div>`;
}

/** Cabecera de sección: índice + línea que se dibuja + titular por líneas. */
export function cabeceraSeccion({ num, rotulo, titulo, extra = '' }) {
  return `<header class="seccion-cabeza">
    <div class="seccion-indice"><span class="rotulo">${num}</span><span class="linea" data-linea></span><span class="rotulo">${rotulo}</span></div>
    <div class="seccion-titulo-fila">
      <h2 class="titulo-l" data-titular>${titulo}</h2>
      ${extra}
    </div>
  </header>`;
}
