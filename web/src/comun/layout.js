// Layout común de la tienda: franja de anuncio, cabecera negra con la marca animada,
// tira del precio del gramo, pie negro, menú móvil y el ÚNICO botón flotante (WhatsApp).
//
//   import { montarLayout } from '../comun/layout.js';
//   const { main, datos } = montarLayout({ activa: 'catalogo' });
//   // activa: 'inicio' | 'catalogo' | 'disena' | 'como-comprar' | 'carrito' | 'joya'
//   // suave: false desactiva Lenis (el diseñador 3D lo apaga para no pelear con la rueda del ratón).
//   // datos: Promise del catálogo (null si la API no respondió).
//
// La página debe tener <main id="contenido">; si no, se crea uno con el contenido del body.

import '../estilos/base.css';
import '../estilos/layout.css';
import '../estilos/componentes.css';
import { obtenerCatalogo } from './api.js';
import { cantidadBolsa, EVENTO } from './carrito.js';
import { esc, pesos, hoyCorto, ruta, enlaceWhatsApp } from './formato.js';
import { ico } from './iconos.js';
import { marcaSVG } from './marca.js';
import { iniciarScrollSuave, detenerScroll, revelar } from './movimiento.js';

// «Diseña tu joya» es la propuesta principal: va aparte, como botón de oro plano (ver cabecera()).
const NAV = [
  { id: 'inicio', texto: 'Inicio', href: '' },
  { id: 'catalogo', texto: 'Catálogo', href: 'catalogo/' },
  { id: 'como-comprar', texto: 'Cómo comprar', href: 'como-comprar/' },
];
const NAV_MOVIL = [{ id: 'disena', texto: 'Diseña tu joya', href: 'disena/' }, ...NAV];

const WA_DEFECTO = '573178861724';
const IG_DEFECTO = '18GOLDKPRADA';
const TT_DEFECTO = '18goldKprada';

function cabecera(activa) {
  const enlaces = NAV.map(
    (n) => `<a href="${ruta(n.href)}" class="nav-enlace${n.id === activa ? ' activa' : ''}"${n.id === activa ? ' aria-current="page"' : ''}>${n.texto}</a>`,
  ).join('');
  const cant = cantidadBolsa();
  return `
  <header class="cabecera" role="banner">
    <div class="contenedor cabecera-fila">
      <a class="cabecera-logo" href="${ruta('')}" aria-label="18gold KPrada, ir al inicio">
        ${marcaSVG({ tam: 36, etiqueta: '' })}
        <span class="cabecera-nombre"><b>18gold KPrada</b><small>¡Teje tu historia!</small></span>
      </a>
      <nav class="nav" aria-label="Principal">${enlaces}</nav>
      <a class="nav-cta${activa === 'disena' ? ' activa' : ''}" href="${ruta('disena/')}"${activa === 'disena' ? ' aria-current="page"' : ''}>
        <span class="nav-cta-largo">Diseña tu joya</span><span class="nav-cta-corto" aria-hidden="true">Diseña</span></a>
      <div class="cabecera-acciones">
        <a class="boton-bolsa${activa === 'carrito' ? ' activa' : ''}" href="${ruta('carrito/')}" aria-label="Bolsa de compras, ${cant} ${cant === 1 ? 'joya' : 'joyas'}" data-bolsa>
          ${ico('bolsa', { tam: 22 })}
          <span class="bolsa-contador" data-bolsa-contador${cant ? '' : ' hidden'}>${cant}</span>
        </a>
        <button class="boton-menu" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil" data-abrir-menu>
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>`;
}

function tiraPrecios() {
  return `
  <section class="tira-precios" aria-label="Precio del gramo de oro hoy">
    <div class="contenedor tira-fila">
      <p class="tira-titulo rotulo">Precio del gramo · hoy <time data-hoy>${hoyCorto()}</time></p>
      <div class="tira-precio">
        <span class="bandera" aria-hidden="true">🇨🇴</span>
        <span class="tira-dato"><span class="tira-rotulo"><span class="solo-ancho">Oro </span>nacional 18k</span><b data-gramo="nacional">—</b></span>
      </div>
      <div class="tira-precio">
        <span class="bandera" aria-hidden="true">🇮🇹</span>
        <span class="tira-dato"><span class="tira-rotulo"><span class="solo-ancho">Oro </span>italiano<span class="solo-ancho"> ley</span> 750</span><b data-gramo="italiano">—</b></span>
      </div>
    </div>
  </section>`;
}

function menuMovil(activa) {
  const enlaces = NAV_MOVIL.map(
    (n, i) => `<a href="${ruta(n.href)}" class="menu-enlace${n.id === activa ? ' activa' : ''}"><span class="menu-num">0${i + 1}</span>${n.texto}</a>`,
  ).join('');
  return `
  <div class="menu-movil" id="menu-movil" role="dialog" aria-modal="true" aria-label="Menú" hidden>
    <div class="contenedor menu-cabeza">
      <span class="rotulo">Menú</span>
      <button type="button" class="boton-cerrar" aria-label="Cerrar menú" data-cerrar-menu>${ico('x', { tam: 24 })}</button>
    </div>
    <nav class="contenedor menu-lista" aria-label="Principal">
      ${enlaces}
      <a href="${ruta('carrito/')}" class="menu-enlace${activa === 'carrito' ? ' activa' : ''}"><span class="menu-num">05</span>Tu bolsa</a>
    </nav>
    <div class="contenedor menu-redes">
      <a href="https://instagram.com/${IG_DEFECTO}" target="_blank" rel="noopener" data-red="instagram">${ico('instagram', { tam: 18 })}<span>Instagram</span></a>
      <a href="https://www.tiktok.com/@${TT_DEFECTO}" target="_blank" rel="noopener" data-red="tiktok">${ico('tiktok', { tam: 18 })}<span>TikTok Live</span></a>
      <a href="${enlaceWhatsApp(WA_DEFECTO)}" target="_blank" rel="noopener" data-red="whatsapp">${ico('whatsapp', { tam: 18 })}<span>WhatsApp</span></a>
    </div>
  </div>`;
}

function pie() {
  const anio = new Date().getFullYear();
  return `
  <footer class="pie" role="contentinfo">
    <div class="contenedor">
      <div class="pie-rejilla">
        <div class="pie-marca">
          <a href="${ruta('')}" class="pie-logo" aria-label="18gold KPrada, ir al inicio">
            <img src="${ruta('img/logo.jpg')}" alt="" width="72" height="108" loading="lazy" decoding="async">
            <span><b>18gold KPrada</b><small>¡Teje tu historia!</small></span>
          </a>
          <p>Joyería en oro 18k nacional e italiano ley 750. Piezas reales, fotos reales y atención directa de Carlos por WhatsApp.</p>
        </div>
        <div class="pie-col">
          <h2 class="pie-titulo">Tienda</h2>
          <ul data-pie-categorias>
            <li><a href="${ruta('catalogo/')}">Todo el catálogo</a></li>
          </ul>
        </div>
        <div class="pie-col">
          <h2 class="pie-titulo">Ayuda</h2>
          <ul>
            <li><a href="${ruta('disena/')}">Diseña tu joya</a></li>
            <li><a href="${ruta('como-comprar/')}">Cómo comprar</a></li>
            <li><a href="${ruta('carrito/')}">Tu bolsa</a></li>
          </ul>
        </div>
        <div class="pie-col">
          <h2 class="pie-titulo">Contacto</h2>
          <ul>
            <li><a href="${enlaceWhatsApp(WA_DEFECTO)}" target="_blank" rel="noopener" data-red="whatsapp">${ico('whatsapp', { tam: 16 })}<span data-wa-numero>317 886 1724</span></a></li>
            <li><a href="https://instagram.com/${IG_DEFECTO}" target="_blank" rel="noopener" data-red="instagram">${ico('instagram', { tam: 16 })}<span>@${IG_DEFECTO}</span></a></li>
            <li><a href="https://www.tiktok.com/@${TT_DEFECTO}" target="_blank" rel="noopener" data-red="tiktok">${ico('tiktok', { tam: 16 })}<span>@${TT_DEFECTO}</span></a></li>
          </ul>
          <div class="pie-gramo">
            <span class="rotulo">Gramo hoy</span>
            <p><b data-gramo="nacional">—</b> <small>nacional</small></p>
            <p><b data-gramo="italiano">—</b> <small>italiano 750</small></p>
          </div>
        </div>
      </div>
      <div class="pie-base">
        <span>© ${anio} 18gold KPrada · ¡Teje tu historia!</span>
        <span>Envíos a toda Colombia y al exterior</span>
        <span class="pie-creditos">Diseñador: iconos de Font Awesome (CC BY 4.0) y game-icons.net de Delapouite y Lorc (CC BY 3.0) · mapa de Natural Earth</span>
      </div>
    </div>
  </footer>
  <a class="wa-flotante" href="${enlaceWhatsApp(WA_DEFECTO, 'Hola, vengo de la página de 18gold KPrada. Quiero información sobre una joya.')}" target="_blank" rel="noopener" aria-label="Escribir a Carlos por WhatsApp" data-wa-flotante>
    ${ico('whatsapp', { tam: 24 })}
  </a>`;
}

function formatearNumeroWa(n) {
  const local = String(n).replace(/\D/g, '').replace(/^57/, '');
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : local;
}

function pintarDatos(datos) {
  const { precios, ajustes, categorias, productos } = datos;
  document.querySelectorAll('[data-gramo]').forEach((el) => {
    const v = precios[el.dataset.gramo];
    if (v) el.textContent = pesos(v);
  });

  if (ajustes.anuncio && !document.querySelector('.anuncio')) {
    const franja = document.createElement('div');
    franja.className = 'anuncio';
    franja.setAttribute('role', 'note');
    franja.innerHTML = `<div class="contenedor"><p>${esc(ajustes.anuncio)}</p></div>`;
    document.querySelector('.cabecera')?.before(franja);
  }

  const wa = ajustes.whatsapp;
  document.querySelectorAll('a[data-red="whatsapp"]').forEach((a) => (a.href = enlaceWhatsApp(wa)));
  const flot = document.querySelector('[data-wa-flotante]');
  if (flot) flot.href = enlaceWhatsApp(wa, 'Hola, vengo de la página de 18gold KPrada. Quiero información sobre una joya.');
  document.querySelectorAll('[data-wa-numero]').forEach((el) => (el.textContent = formatearNumeroWa(wa)));
  document.querySelectorAll('a[data-red="instagram"]').forEach((a) => {
    a.href = `https://instagram.com/${ajustes.instagram}`;
    const s = a.querySelector('span');
    if (s && s.textContent.startsWith('@')) s.textContent = `@${ajustes.instagram}`;
  });
  document.querySelectorAll('a[data-red="tiktok"]').forEach((a) => {
    a.href = `https://www.tiktok.com/@${ajustes.tiktok}`;
    const s = a.querySelector('span');
    if (s && s.textContent.startsWith('@')) s.textContent = `@${ajustes.tiktok}`;
  });

  const lista = document.querySelector('[data-pie-categorias]');
  if (lista) {
    const conJoyas = categorias.filter((c) => productos.some((p) => p.categoria === c.slug));
    lista.insertAdjacentHTML(
      'beforeend',
      conJoyas.map((c) => `<li><a href="${ruta(`catalogo/?cat=${encodeURIComponent(c.slug)}`)}">${esc(c.nombre)}</a></li>`).join(''),
    );
  }
}

function actualizarBolsa() {
  const cant = cantidadBolsa();
  document.querySelectorAll('[data-bolsa-contador]').forEach((el) => {
    el.textContent = cant;
    el.hidden = !cant;
  });
  document.querySelectorAll('[data-bolsa]').forEach((a) => a.setAttribute('aria-label', `Bolsa de compras, ${cant} ${cant === 1 ? 'joya' : 'joyas'}`));
}

function activarMenu() {
  const menu = document.getElementById('menu-movil');
  const abrir = document.querySelector('[data-abrir-menu]');
  const cerrar = menu.querySelector('[data-cerrar-menu]');
  let ultimoFoco = null;
  const fijar = (abierto) => {
    menu.hidden = !abierto;
    abrir.setAttribute('aria-expanded', String(abierto));
    document.body.classList.toggle('menu-abierto', abierto);
    detenerScroll(abierto);
    if (abierto) {
      ultimoFoco = document.activeElement;
      cerrar.focus();
    } else ultimoFoco?.focus();
  };
  abrir.addEventListener('click', () => fijar(true));
  cerrar.addEventListener('click', () => fijar(false));
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fijar(false);
    if (e.key === 'Tab') {
      const focos = [...menu.querySelectorAll('a, button')];
      const [primero, ultimo] = [focos[0], focos[focos.length - 1]];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => e.matches && !menu.hidden && fijar(false));
}

export function montarLayout({ activa = '', suave = true } = {}) {
  document.documentElement.classList.add('js');
  if (activa) document.body.dataset.pagina = activa;
  let main = document.querySelector('main');
  if (!main) {
    main = document.createElement('main');
    while (document.body.firstChild) main.appendChild(document.body.firstChild);
    document.body.appendChild(main);
  }
  if (!main.id) main.id = 'contenido';
  main.tabIndex = -1;

  main.insertAdjacentHTML('beforebegin', `<a class="saltar" href="#${main.id}">Saltar al contenido</a>${cabecera(activa)}${tiraPrecios()}`);
  main.insertAdjacentHTML('afterend', pie());
  document.body.insertAdjacentHTML('beforeend', menuMovil(activa));

  activarMenu();
  actualizarBolsa();
  window.addEventListener(EVENTO, actualizarBolsa);

  if (suave) iniciarScrollSuave();

  const datos = obtenerCatalogo()
    .then((d) => {
      pintarDatos(d);
      return d;
    })
    .catch((e) => {
      console.warn('[layout] sin datos del catálogo:', e.message);
      document.querySelectorAll('[data-gramo]').forEach((el) => (el.textContent = 'Consultar'));
      return null;
    });

  // revelados del layout (líneas del pie, etc.)
  requestAnimationFrame(() => revelar(document.querySelector('.pie') || document));
  return { main, datos };
}
