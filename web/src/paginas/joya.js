import { montarLayout } from '../comun/layout.js';
import { revelar, refrescar } from '../comun/movimiento.js';
import { obtenerProducto } from '../comun/api.js';
import { agregar } from '../comun/carrito.js';
import { tarjetaJoya, activarFotos, estadoVacio, fotoJoya, etiquetaDescuento, cabeceraSeccion } from '../comun/tarjeta.js';
import { esc, pesos, gramos, nombreOro, ruta, enlaceWhatsApp, sinEmojis } from '../comun/formato.js';
import { ico } from '../comun/iconos.js';
import '../estilos/joya.css';

const { main, datos } = montarLayout({ activa: 'joya' });
const slug = new URLSearchParams(location.search).get('p') || '';

main.innerHTML = `<div class="contenedor"><div class="joya-cargando" aria-busy="true">
  <div class="esqueleto"><div class="marco-foto"></div></div>
  <div><div class="esqueleto-linea"></div><div class="esqueleto-linea corta"></div></div>
</div></div>`;

/** Descripción: párrafos y viñetas «• …» como lista. */
function descripcionHTML(texto) {
  const limpio = sinEmojis(texto);
  if (!limpio) return '';
  return limpio.split(/\n{2,}/).map((bloque) => {
    const lineas = bloque.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lineas.every((l) => /^[•\-*]/.test(l))) return `<ul class="joya-lista">${lineas.map((l) => `<li>${esc(l.replace(/^[•\-*]\s*/, ''))}</li>`).join('')}</ul>`;
    return `<p>${lineas.map(esc).join('<br>')}</p>`;
  }).join('');
}

function galeria(p) {
  const fotos = p.imagenes?.length ? p.imagenes : [''];
  const miniaturas = fotos.length > 1
    ? `<div class="galeria-minis" role="tablist" aria-label="Fotos">${fotos.map((f, i) => `
        <button type="button" class="galeria-mini" role="tab" aria-selected="${i === 0}" aria-label="Foto ${i + 1}" data-foto="${esc(f)}">
          ${fotoJoya(f, '')}
        </button>`).join('')}</div>`
    : '';
  return `<div class="galeria">
    <div class="galeria-principal" data-descubrir>${fotoJoya(fotos[0], p.nombre, { prioridad: true })}</div>
    ${miniaturas}
  </div>`;
}

function ficha(p, gramo) {
  const filas = [
    ['Material', nombreOro(p.tipo_oro)],
    p.tipo_precio === 'gramo' ? ['Peso', gramos(p.peso_gramos)] : null,
    p.medidas ? ['Medidas', p.medidas] : null,
    ['Cobro', p.tipo_precio === 'gramo' ? 'Por gramo' : 'Precio por joya'],
    p.sku ? ['Referencia', p.sku] : null,
  ].filter(Boolean);
  return `<dl class="ficha">${filas.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>`;
}

function pintar(p, d) {
  const gramo = d?.precios?.[p.tipo_oro] || 0;
  const wa = d?.ajustes?.whatsapp;
  const desc = etiquetaDescuento(p);
  document.title = `${p.nombre} en oro 18k — 18gold KPrada`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${p.nombre}. ${nombreOro(p.tipo_oro)}${p.tipo_precio === 'gramo' ? `, ${gramos(p.peso_gramos)}` : ''}. ${pesos(p.precio)} según el gramo de hoy.`);
  const textoWa = `Hola Carlos, me interesa *${p.nombre}*${p.sku ? ` (${p.sku})` : ''} — ${pesos(p.precio)} en la página. ¿Está disponible?`;

  main.innerHTML = `
  <div class="contenedor">
    <nav class="migas" aria-label="Ruta">
      <a href="${ruta('')}">Inicio</a><span aria-hidden="true">/</span>
      <a href="${ruta('catalogo/')}">Catálogo</a><span aria-hidden="true">/</span>
      ${p.categoria ? `<a href="${ruta(`catalogo/?cat=${encodeURIComponent(p.categoria)}`)}">${esc(p.categoria_nombre)}</a>` : ''}
    </nav>
    <article class="joya">
      ${galeria(p)}
      <div class="joya-datos">
        <p class="rotulo rotulo-oro">${esc(p.categoria_nombre || 'Joyería')} · ${p.tipo_oro === 'italiano' ? 'Italiano ley 750' : 'Nacional 18k'}</p>
        <h1 class="titulo-l joya-titulo" data-titular>${esc(p.nombre)}</h1>
        <div class="joya-precio">
          <p class="joya-valor">${pesos(p.precio)}</p>
          ${p.precio_antes ? `<p class="joya-antes"><s><span class="solo-lectores">Antes </span>${pesos(p.precio_antes)}</s> <span class="sello-linea">${desc}</span></p>` : ''}
        </div>
        <p class="joya-calculo tenue">${p.tipo_precio === 'gramo' && gramo
          ? `Precio según el gramo de hoy: ${gramos(p.peso_gramos)} × ${pesos(gramo)} (${p.tipo_oro === 'italiano' ? 'italiano' : 'nacional'}). Se recalcula cuando cambia el oro.`
          : 'Precio fijo por la joya completa.'}</p>
        <span class="linea" data-linea></span>
        ${ficha(p, gramo)}
        <div class="joya-acciones">
          <div class="cantidad" role="group" aria-label="Cantidad">
            <button type="button" aria-label="Quitar una" data-menos>−</button>
            <output data-cant aria-live="polite">1</output>
            <button type="button" aria-label="Agregar una" data-mas>+</button>
          </div>
          <button type="button" class="boton joya-agregar" data-agregar>${ico('bolsa', { tam: 18 })}<span>Agregar a la bolsa</span></button>
        </div>
        <p class="joya-aviso" data-aviso role="status" hidden></p>
        <a class="boton boton-linea boton-bloque" href="${enlaceWhatsApp(wa, textoWa)}" target="_blank" rel="noopener">${ico('whatsapp', { tam: 18 })}Pedir directo por WhatsApp</a>
        <ul class="garantias">
          <li>${ico('medalla', { tam: 20 })}<span><b>Oro 18k garantizado</b>Garantía escrita del material.</span></li>
          <li>${ico('camara', { tam: 20 })}<span><b>La ves antes de pagar</b>Carlos te manda foto y video de esta pieza.</span></li>
          <li>${ico('camion', { tam: 20 })}<span><b>Envío con guía rastreable</b>A toda Colombia y al exterior.</span></li>
        </ul>
        ${p.descripcion ? `<section class="joya-descripcion" aria-label="Sobre esta joya"><h2 class="rotulo">Sobre esta joya</h2>${descripcionHTML(p.descripcion)}</section>` : ''}
      </div>
    </article>
    ${p.relacionados?.length ? `<section class="seccion" aria-labelledby="t-rel">
      ${cabeceraSeccion({ num: 'Más', rotulo: 'También te puede gustar', titulo: '<span id="t-rel">Joyas <em>relacionadas</em></span>' })}
      <div class="rejilla-joyas" data-aparecer="hijos">${p.relacionados.slice(0, 4).map((r) => tarjetaJoya(r)).join('')}</div>
    </section>` : ''}
  </div>`;

  // Galería sin sticky: cambiar la foto principal
  const principal = main.querySelector('.galeria-principal');
  main.querySelectorAll('[data-foto]').forEach((b) => b.addEventListener('click', () => {
    main.querySelectorAll('[data-foto]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    principal.innerHTML = fotoJoya(b.dataset.foto, p.nombre, { prioridad: true });
    activarFotos(principal);
  }));

  // Cantidad y bolsa
  let cant = 1;
  const out = main.querySelector('[data-cant]');
  main.querySelector('[data-menos]').onclick = () => { cant = Math.max(1, cant - 1); out.textContent = cant; };
  main.querySelector('[data-mas]').onclick = () => { cant = Math.min(20, cant + 1); out.textContent = cant; };
  const aviso = main.querySelector('[data-aviso]');
  main.querySelector('[data-agregar]').onclick = () => {
    agregar(p, cant);
    aviso.hidden = false;
    aviso.innerHTML = `${ico('check', { tam: 18 })}<span>${cant === 1 ? 'Agregada' : `${cant} agregadas`} a tu bolsa.</span> <a class="enlace-linea" href="${ruta('carrito/')}">Ver la bolsa</a>`;
    const c = document.querySelector('[data-bolsa-contador]');
    c?.classList.remove('salto'); void c?.offsetWidth; c?.classList.add('salto');
  };

  activarFotos(main);
  revelar(main);
  refrescar();
}

(async () => {
  let p = null;
  let fallo = false;
  try {
    p = await obtenerProducto(slug);
  } catch {
    fallo = true;
  }
  const d = await datos;
  if (!p) {
    document.title = 'Joya no encontrada — 18gold KPrada';
    main.innerHTML = `<div class="contenedor joya-vacia">${estadoVacio({
      titulo: fallo ? 'No pudimos cargar esta joya' : 'Esta joya ya no está en vitrina',
      texto: fallo ? 'Revisa tu conexión e inténtalo de nuevo, o pregúntale a Carlos por WhatsApp.' : 'Puede que se haya vendido o que el enlace esté incompleto. Mira el catálogo: hay piezas parecidas.',
      accion: `<a class="boton" href="${ruta('catalogo/')}">Ver el catálogo</a>`,
      whatsapp: d?.ajustes?.whatsapp,
    })}</div>`;
    return;
  }
  pintar(p, d);
})();
