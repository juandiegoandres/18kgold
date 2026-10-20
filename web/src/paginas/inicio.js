import { montarLayout } from '../comun/layout.js';
import { revelar, refrescar, ScrollTrigger, sinMovimiento } from '../comun/movimiento.js';
import { tarjetaJoya, activarFotos, cabeceraSeccion, estadoVacio, fotoJoya } from '../comun/tarjeta.js';
import { esc, pesos, fechaLarga, ruta, enlaceWhatsApp } from '../comun/formato.js';
import { ico, icoCategoria } from '../comun/iconos.js';
import '../estilos/inicio.css';

const { main, datos } = montarLayout({ activa: 'inicio' });
const WA = '573178861724';

const PROCESO = [
  ['lapiz', 'Diseñas', 'Con tu código entras al diseñador: un nombre, una inicial, una placa o un anillo. Lo giras en 3D y ves el peso y el precio estimado.'],
  ['check', 'Carlos aprueba', 'Le llega tu diseño con la vista y las medidas. Lo revisa contigo por WhatsApp y te confirma el valor final.'],
  ['caja', 'Se imprime el molde', 'La pieza se imprime en resina de alta definición: ese es el molde exacto de tu joya.'],
  ['fuego', 'Se funde en oro 18k', 'El molde se funde en oro 18k ley 750, se pule a mano y, si lo pediste, se graba con láser.'],
  ['camion', 'Llega a tu casa', 'Sale con guía rastreable a cualquier ciudad de Colombia o al exterior.'],
];

const PASOS_COMPRA = [
  ['diamante', 'Elige tu joya', 'Cada precio ya está calculado con el gramo de hoy. Lo que ves es lo que pagas.'],
  ['whatsapp', 'Pide por WhatsApp', 'Confirmas tu bolsa y se abre WhatsApp con el pedido listo para Carlos.'],
  ['documento', 'Paga y manda el comprobante', 'Nequi, Bancolombia o Daviplata. Envías la foto del comprobante por el mismo chat.'],
  ['camion', 'Recibe con guía', 'Carlos despacha y te deja el número de guía para rastrear tu envío.'],
];

// Piezas que muestra el visor del inicio (las mismas del diseñador, en la silueta gris).
const VITRINA = [
  { tipo: 'medalla', parametros: { motivo: 'san_benito', diametro: 18, borde: 'cordon', reverso: 'cruz_san_benito' }, nombre: 'Medalla de San Benito', mini: 'medalla-san_benito', url: 'disena/?tipo=medalla&motivo=san_benito' },
  { tipo: 'nombre', parametros: { texto: 'Valentina', fuente: 'script2', alto: 11 }, nombre: 'Dije con nombre', mini: 'nombre', url: 'disena/?tipo=nombre' },
  { tipo: 'cruz', parametros: { estilo: 'latina', alto: 25, brazo: 3, punto_luz: true }, nombre: 'Cruz con punto de luz', mini: 'cruz-latina', url: 'disena/?tipo=cruz' },
  { tipo: 'motivo', parametros: { figura: 'arbol_vida', alto: 18 }, nombre: 'Árbol de la vida', mini: 'motivo-arbol_vida', url: 'disena/?tipo=motivo&figura=arbol_vida' },
];

function hero() {
  const chips = VITRINA.map((v, i) => `
    <li><button type="button" class="hero-pieza" data-vitrina="${i}" aria-pressed="${i === 0}">
      <img src="${ruta(`miniaturas/${v.mini}.webp`)}" alt="" width="64" height="64" loading="lazy"><span>${v.nombre}</span></button></li>`).join('');
  return `
  <section class="hero hero-disena" aria-labelledby="t-hero">
    <div class="contenedor hero-rejilla">
      <div class="hero-texto">
        <p class="hero-kicker rotulo rotulo-oro"><span class="linea" data-linea></span>Diseñador 3D · Oro 18k ley 750</p>
        <h1 class="titulo-xl hero-titulo" id="t-hero" data-titular>Diseña tu joya <em>en oro 18k</em></h1>
        <p class="hero-intro" data-aparecer>Tu nombre, la medalla de San Benito, una cruz con punto de luz o un dije clásico. La giras en 3D, la ves puesta a escala real y sabes el peso y el precio al instante. Carlos la funde para ti.</p>
        <div class="hero-acciones" data-aparecer>
          <a class="boton boton-grande" href="${ruta('disena/')}" data-hero-cta>Diseña tu joya ${ico('flecha-der', { tam: 20, clase: 'ico-flecha' })}</a>
          <a class="enlace-linea" href="${ruta('catalogo/')}">o mira el catálogo ${ico('flecha-der', { tam: 16 })}</a>
        </div>
        <ul class="hero-piezas" aria-label="Piezas que puedes diseñar" data-aparecer="hijos">${chips}</ul>
      </div>
      <figure class="hero-visual">
        <a class="hero-lienzo hero-visor" href="${ruta(VITRINA[0].url)}" data-hero-visor aria-label="Abrir el diseñador con la ${VITRINA[0].nombre}">
          <img class="hero-portada" src="${ruta('miniaturas/portada-san-benito.webp')}" alt="Medalla de San Benito en oro 18k puesta en una silueta gris, diseñada en 3D" width="1000" height="1000" fetchpriority="high">
          <span class="hero-escena" data-hero-escena aria-hidden="true"></span>
          <span class="hero-abrir rotulo">Abrir en el diseñador ${ico('flecha-der', { tam: 14 })}</span>
        </a>
        <figcaption class="hero-pie">
          <span class="rotulo" data-hero-nombre>${VITRINA[0].nombre}</span><span class="linea" data-linea></span><span class="rotulo" data-hero-dato>Puesta a escala real</span>
        </figcaption>
      </figure>
    </div>
    <div class="contenedor">
      <ul class="hero-sellos" data-aparecer="hijos">
        <li>${ico('medalla', { tam: 22 })}<span><b>Oro 18k garantizado</b>Nacional e italiano ley 750</span></li>
        <li>${ico('lapiz', { tam: 22 })}<span><b>La diseñas tú, en 3D</b>Peso y precio estimado al instante</span></li>
        <li>${ico('camion', { tam: 22 })}<span><b>Envío con guía rastreable</b>A toda Colombia y al exterior</span></li>
      </ul>
    </div>
  </section>`;
}

// Categorías del diseñador: cada tarjeta abre /disena/ con esa pieza lista para personalizar.
const CATEGORIAS_DISENO = [
  { href: 'disena/?tipo=nombre', mini: 'nombre', titulo: 'Nombre', desc: 'En cursiva o de molde, con tildes bien puestas.' },
  { href: 'disena/?tipo=medalla&motivo=san_benito', mini: 'medalla-san_benito', titulo: 'Medalla San Benito', desc: 'En relieve, con la cruz de San Benito al reverso.', destacada: true },
  { href: 'disena/?tipo=cruz', mini: 'cruz-florenzada', titulo: 'Cruces', desc: 'Latina, florenzada, tau… con Cristo o punto de luz.' },
  { href: 'disena/?tipo=motivo', mini: 'motivo-ojo_turco', titulo: 'Dijes clásicos', desc: 'Corazón, ojo turco, árbol de la vida, zodiaco.' },
  { href: 'disena/?tipo=anillo', mini: 'anillo', titulo: 'Anillos', desc: 'Argollas con grabado interior, en tu talla.' },
];
const MAS_DISENOS = [
  ['disena/?tipo=medalla&motivo=virgen_milagrosa', 'Virgen Milagrosa'], ['disena/?tipo=medalla&motivo=guadalupe', 'Guadalupe'],
  ['disena/?tipo=medalla&motivo=divino_nino', 'Divino Niño'], ['disena/?tipo=motivo&figura=mama', 'Mamá con nombres'],
  ['disena/?tipo=motivo&figura=mapa_colombia', 'Mapa de Colombia'], ['disena/?tipo=motivo&figura=zodiaco_leo', 'Signos del zodiaco'],
  ['disena/?tipo=placa', 'Placas grabadas'], ['disena/?tipo=inicial', 'Iniciales'],
];

function seccionDisenables() {
  const tarjetas = CATEGORIAS_DISENO.map((c) => `
    <a class="dis-tarjeta${c.destacada ? ' destacada' : ''}" href="${ruta(c.href)}" data-aparecer>
      <span class="dis-foto"><img src="${ruta(`miniaturas/g-${c.mini}.webp`)}" alt="" width="720" height="720" loading="lazy"></span>
      <span class="dis-texto"><b>${c.titulo}</b><small>${c.desc}</small><span class="dis-ir rotulo">Diseñar ${ico('flecha-der', { tam: 14 })}</span></span>
    </a>`).join('');
  return `
  <section class="seccion contenedor" aria-labelledby="t-disenables">
    ${cabeceraSeccion({ num: '01', rotulo: 'Diseñador 3D', titulo: '<span id="t-disenables">¿Qué quieres <em>diseñar?</em></span>', extra: `<a class="enlace-linea" href="${ruta('disena/')}">Abrir el diseñador ${ico('flecha-der', { tam: 16 })}</a>` })}
    <div class="dis-rejilla">${tarjetas}</div>
    <p class="dis-mas"><span class="rotulo">También</span>${MAS_DISENOS.map(([h, t]) => `<a href="${ruta(h)}">${t}</a>`).join('')}</p>
  </section>`;
}

function seccionGramo() {
  return `
  <section class="seccion contenedor gramo" aria-labelledby="t-gramo">
    ${cabeceraSeccion({ num: '02', rotulo: 'Precio del gramo', titulo: '<span id="t-gramo">El oro de <em>hoy</em></span>', extra: '<p class="rotulo gramo-fecha" data-gramo-fecha>Actualizado hoy</p>' })}
    <div class="gramo-rejilla">
      <article class="gramo-bloque" data-aparecer>
        <p class="rotulo"><span class="solo-ancho">Oro </span>nacional 18k</p>
        <p class="gramo-valor" data-valor-gramo="nacional">—</p>
        <p class="tenue">por gramo</p>
      </article>
      <article class="gramo-bloque" data-aparecer>
        <p class="rotulo"><span class="solo-ancho">Oro </span>italiano<span class="solo-ancho"> ley</span> 750</p>
        <p class="gramo-valor" data-valor-gramo="italiano">—</p>
        <p class="tenue">por gramo</p>
      </article>
      <form class="calculadora" data-aparecer onsubmit="return false" aria-labelledby="t-calc">
        <h3 id="t-calc" class="calc-titulo">¿Cuánto vale lo que quieres?</h3>
        <div class="calc-campos">
          <div class="campo">
            <label for="calc-gramos">Gramos</label>
            <input class="entrada" id="calc-gramos" type="number" inputmode="decimal" min="0.1" max="500" step="0.1" value="5">
          </div>
          <div class="campo">
            <label for="calc-oro">Tipo de oro</label>
            <select class="entrada" id="calc-oro">
              <option value="nacional">Nacional 18k</option>
              <option value="italiano">Italiano 750</option>
            </select>
          </div>
        </div>
        <p class="calc-resultado"><span class="rotulo">Valor del oro</span><output for="calc-gramos calc-oro" id="calc-total">—</output></p>
        <p class="calc-nota tenue">Solo el oro: la hechura depende de la pieza. Carlos te cotiza exacto por WhatsApp.</p>
      </form>
    </div>
  </section>`;
}

function seccionDestacados() {
  const esqueleto = Array.from({ length: 4 }, () => '<div class="esqueleto" aria-hidden="true"><div class="marco-foto"></div><div class="esqueleto-linea"></div><div class="esqueleto-linea corta"></div></div>').join('');
  return `
  <section class="seccion contenedor" aria-labelledby="t-destacadas">
    ${cabeceraSeccion({ num: '04', rotulo: 'Catálogo', titulo: '<span id="t-destacadas">Joyas <em>destacadas</em></span>', extra: `<a class="enlace-linea" href="${ruta('catalogo/')}">Todo el catálogo ${ico('flecha-der', { tam: 16 })}</a>` })}
    <div class="rejilla-joyas" data-destacadas aria-busy="true">${esqueleto}</div>
  </section>`;
}

function seccionCategorias() {
  return `
  <section class="seccion contenedor" aria-labelledby="t-categorias">
    ${cabeceraSeccion({ num: '05', rotulo: 'Categorías del catálogo', titulo: '<span id="t-categorias">¿Qué estás <em>buscando?</em></span>' })}
    <div class="categorias" data-categorias></div>
  </section>`;
}

function seccionDisena() {
  const pasos = PROCESO.map(([i, t, d], n) => `
    <li class="proceso-paso">
      <span class="proceso-num" aria-hidden="true">0${n + 1}</span>
      <span class="proceso-ico">${ico(i, { tam: 30 })}</span>
      <h3 class="proceso-titulo">${t}</h3>
      <p>${d}</p>
    </li>`).join('');
  return `
  <section class="seccion disena" aria-labelledby="t-disena">
    <div class="contenedor">
      ${cabeceraSeccion({ num: '03', rotulo: 'Cómo funciona', titulo: '<span id="t-disena">Del diseño <em>a tu mano</em></span>' })}
      <div class="disena-rejilla">
        <div class="disena-texto" data-aparecer>
          <p class="parrafo">Entras al diseñador y en tres pasos eliges la pieza, la personalizas y decides cómo llevarla: en cadena de oro o en tejido. La ves en 3D y <b>puesta a escala real</b> mientras la ajustas.</p>
          <p class="parrafo">El diseñador te muestra el <b>peso y el precio estimado</b> en oro 18k con el gramo de hoy. Para enviársela a Carlos usas el <b>código personal</b> que él te da por WhatsApp: se imprime el molde y se funde.</p>
          <div class="disena-acciones">
            <a class="boton" href="${ruta('disena/')}">Abrir el diseñador ${ico('flecha-der', { tam: 18, clase: 'ico-flecha' })}</a>
            <a class="boton boton-linea" href="${enlaceWhatsApp(WA, 'Hola Carlos, quiero un código para diseñar mi joya.')}" target="_blank" rel="noopener" data-wa-codigo>Pedir mi código</a>
          </div>
          <p class="disena-nota tenue">Sin código también puedes jugar con el diseñador; el código solo hace falta para enviar tu diseño.</p>
        </div>
        <div class="codigo-tarjeta" data-aparecer aria-label="Ejemplo de código de cliente">
          <p class="rotulo">Código de cliente</p>
          <p class="codigo-valor" aria-hidden="true">KP-7H3QM</p>
          <dl class="codigo-datos">
            <div><dt>Para</dt><dd>Tu nombre</dd></div>
            <div><dt>Vigencia</dt><dd>15 días</dd></div>
            <div><dt>Diseños</dt><dd>Hasta 5</dd></div>
          </dl>
          <span class="codigo-pie rotulo">Ejemplo de código</span>
        </div>
      </div>
    </div>
    <div class="proceso" data-proceso>
      <div class="proceso-marco">
        <div class="contenedor proceso-cabeza">
          <p class="rotulo">Del diseño a tu mano</p>
          <div class="proceso-barra" aria-hidden="true"><span data-proceso-barra></span></div>
        </div>
        <ol class="proceso-pista contenedor" data-proceso-pista>${pasos}</ol>
      </div>
    </div>
  </section>`;
}

function seccionComprar() {
  const pasos = PASOS_COMPRA.map(([i, t, d], n) => `
    <li class="compra-paso" data-aparecer>
      <span class="linea" data-linea></span>
      <span class="compra-num rotulo">Paso ${n + 1}</span>
      ${ico(i, { tam: 24 })}
      <h3>${t}</h3>
      <p class="tenue">${d}</p>
    </li>`).join('');
  return `
  <section class="seccion contenedor" aria-labelledby="t-comprar">
    ${cabeceraSeccion({ num: '06', rotulo: 'Cómo comprar', titulo: '<span id="t-comprar">Sin pasarelas, <em>de persona a persona</em></span>', extra: `<a class="enlace-linea" href="${ruta('como-comprar/')}">Preguntas frecuentes ${ico('flecha-der', { tam: 16 })}</a>` })}
    <ol class="compra-pasos">${pasos}</ol>
  </section>`;
}

function seccionRedes() {
  return `
  <section class="seccion contenedor" aria-labelledby="t-redes">
    ${cabeceraSeccion({ num: '07', rotulo: 'Redes', titulo: '<span id="t-redes">Míralas <em>en vivo</em></span>' })}
    <ul class="redes-lista">
      <li><a class="red-fila" href="https://instagram.com/18GOLDKPRADA" target="_blank" rel="noopener" data-red="instagram">
        ${ico('instagram', { tam: 28 })}<span class="red-nombre">Instagram</span><span class="red-desc tenue">Fotos y videos de cada pieza</span><span>@18GOLDKPRADA</span>${ico('externo', { tam: 20 })}</a></li>
      <li><a class="red-fila" href="https://www.tiktok.com/@18goldKprada" target="_blank" rel="noopener" data-red="tiktok">
        ${ico('tiktok', { tam: 28 })}<span class="red-nombre">TikTok Live</span><span class="red-desc tenue">Carlos muestra las joyas en directo</span><span>@18goldKprada</span>${ico('externo', { tam: 20 })}</a></li>
      <li><a class="red-fila" href="${enlaceWhatsApp(WA)}" target="_blank" rel="noopener" data-red="whatsapp">
        ${ico('whatsapp', { tam: 28 })}<span class="red-nombre">WhatsApp</span><span class="red-desc tenue">Atención directa, sin bots</span><span data-wa-numero>317 886 1724</span>${ico('externo', { tam: 20 })}</a></li>
    </ul>
  </section>`;
}

main.innerHTML = hero() + seccionDisenables() + seccionGramo() + seccionDisena() + seccionDestacados() + seccionCategorias() + seccionComprar() + seccionRedes();

revelar(main);
activarCalculadora({ nacional: 0, italiano: 0 });
activarVitrina();

// Vitrina del hero: el mismo diseñador (carga diferida) con la pieza puesta en la silueta gris. Mientras
// carga se ve la portada; si el navegador no puede con WebGL, la portada se queda.
function activarVitrina() {
  const visor = main.querySelector('[data-hero-visor]');
  const escena = main.querySelector('[data-hero-escena]');
  const nombre = main.querySelector('[data-hero-nombre]');
  const dato = main.querySelector('[data-hero-dato]');
  const botones = [...main.querySelectorAll('[data-vitrina]')];
  let d = null, actual = 0, reloj = null, manual = false, visible = true;
  let tarifas = null;
  const mostrar = async (i) => {
    actual = i;
    const v = VITRINA[i];
    botones.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    visor.href = ruta(v.url);
    visor.setAttribute('aria-label', `Abrir el diseñador con: ${v.nombre}`);
    nombre.textContent = v.nombre;
    main.querySelector('[data-hero-cta]').href = ruta(v.url);
    if (!d) return;
    escena.classList.add('cambiando');
    await d.fijar(v.tipo, v.parametros, { inmediato: true }).catch(() => {});
    d.vista('puesta');
    escena.classList.remove('cambiando');
    pintarDato();
  };
  const pintarDato = () => {
    if (!d) return;
    const o = d.obtener();
    if (!o.peso_g) return;
    const precio = tarifas ? calcular(o.peso_g, 'nacional', tarifas, o.montaje) : null;
    dato.textContent = `${o.peso_g.toFixed(2).replace('.', ',')} g${precio ? ` · estimado ${pesos(precio)}` : ''}`;
  };
  let calcular = null;
  const ciclo = () => {
    clearInterval(reloj);
    if (manual || sinMovimiento()) return;
    reloj = setInterval(() => { if (visible && !document.hidden) mostrar((actual + 1) % VITRINA.length); }, 6500);
  };
  botones.forEach((b, i) => b.addEventListener('click', () => { manual = true; clearInterval(reloj); mostrar(i); }));
  try {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(visor);
  } catch { /* sin observador */ }
  const arrancar = async () => {
    try {
      const m = await import('../disenador/index.js');
      calcular = m.calcularPrecio;
      d = await m.crearDisenador(escena, {
        montaje: { soporte: 'cadena', cadena: { estilo: 'rolo', largo_cm: 45 } },
        tipo: VITRINA[0].tipo, parametros: VITRINA[0].parametros, interactivo: false, acercarPuesta: 0.62,
      });
      d.giro(false);
      d.vista('puesta');
      window.vitrina = d; // soporte y capturas
      visor.classList.add('hero-listo');
      pintarDato();
      if (actual !== 0) mostrar(actual);
      ciclo();
    } catch (e) {
      console.warn('[inicio] vitrina 3D no disponible:', e.message);
    }
  };
  datos.then((x) => { if (x?.precios) { tarifas = { nacional: x.precios.nacional, italiano: x.precios.italiano, hechura_gramo: x.ajustes?.hechura_gramo, tejido_valor: x.ajustes?.tejido_valor }; pintarDato(); } });
  // Después del primer pintado (no compite con el contenido de arriba).
  const luego = window.requestIdleCallback || ((f) => setTimeout(f, 600));
  luego(arrancar, { timeout: 1500 });
}

function activarCalculadora(precios) {
  const g = main.querySelector('#calc-gramos');
  const t = main.querySelector('#calc-oro');
  const out = main.querySelector('#calc-total');
  const calcular = () => {
    const v = Math.max(0, Number(String(g.value).replace(',', '.')) || 0);
    const p = precios[t.value];
    out.textContent = p ? pesos(Math.round((v * p) / 100) * 100) : '—';
  };
  g.oninput = calcular;
  t.onchange = calcular;
  calcular();
}

// (El recorrido horizontal con «pin» se quitó: nada flota con el scroll — ARQUITECTURA §6.)

datos.then((d) => {
  const cont = main.querySelector('[data-destacadas]');
  cont.removeAttribute('aria-busy');
  if (!d || !d.productos.length) {
    cont.outerHTML = estadoVacio({
      titulo: 'El catálogo se está actualizando',
      texto: 'No pudimos traer las joyas en este momento. Vuelve a intentarlo en un rato o pídele a Carlos las fotos por WhatsApp.',
      accion: `<a class="boton" href="${ruta('catalogo/')}">Reintentar</a>`,
    });
    main.querySelector('[data-categorias]').closest('section').remove();
    refrescar();
    return;
  }

  // precios del gramo
  main.querySelectorAll('[data-valor-gramo]').forEach((el) => {
    const v = d.precios[el.dataset.valorGramo];
    el.textContent = pesos(v);
    el.dataset.contador = v;
  });
  if (d.precios.actualizado) main.querySelector('[data-gramo-fecha]').textContent = `Actualizado el ${fechaLarga(d.precios.actualizado)}`;
  activarCalculadora(d.precios);
  main.querySelector('[data-wa-codigo]').href = enlaceWhatsApp(d.ajustes.whatsapp, 'Hola Carlos, quiero un código para diseñar mi joya.');

  // destacadas: primero las marcadas, luego las más nuevas
  const destacadas = d.productos.filter((p) => p.destacado);
  const resto = d.productos.filter((p) => !p.destacado).sort((a, b) => String(b.creado).localeCompare(String(a.creado)) || b.id - a.id);
  const lista = [...destacadas, ...resto].slice(0, 8);
  cont.innerHTML = lista.map((p) => tarjetaJoya(p)).join('');
  cont.dataset.aparecer = 'hijos';
  activarFotos(cont);

  // categorías con joyas + oro italiano
  const filas = d.categorias
    .map((c) => ({ ...c, joyas: d.productos.filter((p) => p.categoria === c.slug) }))
    .filter((c) => c.joyas.length)
    .map((c) => ({ href: ruta(`catalogo/?cat=${encodeURIComponent(c.slug)}`), nombre: c.nombre, n: c.joyas.length, foto: (c.joyas.find((p) => p.destacado) || c.joyas[0]).imagenes?.[0], ico: icoCategoria(c.slug, { tam: 22 }) }));
  const italianas = d.productos.filter((p) => p.tipo_oro === 'italiano');
  if (italianas.length) filas.push({ href: ruta('catalogo/?oro=italiano'), nombre: 'Oro italiano ley 750', n: italianas.length, foto: italianas[0].imagenes?.[0], ico: ico('estrella', { tam: 22 }) });
  main.querySelector('[data-categorias]').innerHTML = filas
    .map((f, i) => `
      <a class="cat-fila" href="${f.href}" data-aparecer>
        <span class="cat-num rotulo">${String(i + 1).padStart(2, '0')}</span>
        <span class="cat-nombre">${esc(f.nombre)}</span>
        <span class="cat-cuenta tenue">${f.n} ${f.n === 1 ? 'joya' : 'joyas'}</span>
        <span class="cat-foto" aria-hidden="true">${fotoJoya(f.foto, '')}</span>
        <span class="cat-flecha">${ico('flecha-der', { tam: 22 })}</span>
      </a>`)
    .join('');
  activarFotos(main.querySelector('[data-categorias]'));

  revelar(main);
  refrescar();
});

// Si la página termina de cargar fuentes/imágenes, recalcula disparadores
window.addEventListener('load', () => !sinMovimiento() && ScrollTrigger.refresh());
