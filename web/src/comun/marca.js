// Marca 18gold KPrada — pirámide 3D alámbrica (isométrica) + diamante + hilo con aguja.
// Portado de legado-php/app/views/partials/marca.php. Trazo fino, sin relleno, se dibuja sola
// (cada trazo usa pathLength="1" y la animación vive en layout.css → .marca).
// Las aristas ocultas (punteadas) no se «dibujan»: aparecen con opacidad para conservar el punteado.

export function marcaSVG({ tam = 44, clase = '', etiqueta = '18gold KPrada' } = {}) {
  const alto = Math.round(tam * 1.15);
  return `<svg class="marca ${clase}" width="${tam}" height="${alto}" viewBox="0 0 64 74" fill="none"
    xmlns="http://www.w3.org/2000/svg" ${etiqueta ? `role="img" aria-label="${etiqueta}"` : 'aria-hidden="true"'}>
  <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <g class="mk-diamante" stroke-width="1.3">
      <path pathLength="1" d="M32 3 39 9.5 32 19 25 9.5 32 3Z"/>
      <path pathLength="1" d="M25 9.5h14" stroke-width=".85"/>
      <path pathLength="1" d="M28.4 6.1 30.2 9.5 32 19M35.6 6.1 33.8 9.5 32 19" stroke-width=".7" opacity=".8"/>
    </g>
    <g class="mk-piramide">
      <path pathLength="1" d="M32 24 6 54" stroke-width="1.5"/>
      <path pathLength="1" d="M32 24 32 68" stroke-width="1.5"/>
      <path pathLength="1" d="M32 24 58 54" stroke-width="1.5"/>
      <path pathLength="1" d="M6 54 32 68 58 54" stroke-width="1.4"/>
      <path pathLength="1" d="M14.7 44 32 53.3 49.3 44" stroke-width=".9"/>
      <path pathLength="1" d="M23.3 34 32 38.7 40.7 34" stroke-width=".9"/>
    </g>
    <g class="mk-ocultas">
      <path d="M32 24 32 42" stroke-width=".9" stroke-dasharray="2.5 2.5" opacity=".55"/>
      <path d="M6 54 32 42 58 54" stroke-width=".9" stroke-dasharray="2.5 2.5" opacity=".55"/>
      <path d="M14.7 44 32 36 49.3 44M23.3 34 32 30 40.7 34" stroke-width=".65" stroke-dasharray="2 2" opacity=".4"/>
    </g>
    <g class="mk-hilo" stroke-width="1.15">
      <path pathLength="1" d="M2 70c7.5 0 7.5-4.6 15-4.6s7.5 4.6 15 4.6 7.5-4.6 15-4.6 7.5 4.6 15 4.6"/>
    </g>
    <g class="mk-aguja" stroke-width="1.25">
      <path pathLength="1" d="M52 62.5 59 55.5"/>
      <path pathLength="1" d="M51.2 63.3a1.5 1.5 0 1 0 1.5-1.5" stroke-width="1"/>
    </g>
  </g>
</svg>`;
}
