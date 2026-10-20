import { montarLayout } from '../comun/layout.js';
import { revelar, refrescar } from '../comun/movimiento.js';
import { crearPedido, textoPedidoLocal } from '../comun/api.js';
import { obtenerBolsa, fijarCantidad, quitar, vaciar, sincronizar, EVENTO } from '../comun/carrito.js';
import { fotoJoya, activarFotos, urlJoya } from '../comun/tarjeta.js';
import { esc, pesos, ruta, enlaceWhatsApp } from '../comun/formato.js';
import { ico } from '../comun/iconos.js';
import '../estilos/carrito.css';

const { main, datos } = montarLayout({ activa: 'carrito' });
let ajustes = { whatsapp: '573178861724', envio_valor: 15000, envio_gratis_desde: 500000 };
let catalogoListo = false;

const CLAVE_CLIENTE = 'kp:cliente:v1';
function clienteGuardado() {
  try { return JSON.parse(localStorage.getItem(CLAVE_CLIENTE) || '{}'); } catch { return {}; }
}
function guardarCliente(c) {
  try { localStorage.setItem(CLAVE_CLIENTE, JSON.stringify(c)); } catch { /* sin almacenamiento */ }
}

function totales(lineas) {
  const subtotal = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const gratis = ajustes.envio_gratis_desde && subtotal >= ajustes.envio_gratis_desde;
  const envio = !lineas.length || gratis ? 0 : ajustes.envio_valor;
  return { subtotal, envio, total: subtotal + envio, gratis };
}

function vacia() {
  main.innerHTML = `<div class="contenedor">
    <header class="bolsa-cabeza"><p class="rotulo rotulo-oro">Tu bolsa</p><h1 class="titulo-l" data-titular>Tu bolsa está <em>vacía</em></h1></header>
    <div class="bolsa-vacia">
      <p class="tenue">Cuando agregues una joya aparecerá aquí. Los precios se calculan con el gramo de hoy.</p>
      <div class="bolsa-vacia-acciones">
        <a class="boton" href="${ruta('catalogo/')}">Ver el catálogo ${ico('flecha-der', { tam: 18, clase: 'ico-flecha' })}</a>
        <a class="boton boton-linea" href="${ruta('disena/')}">Diseña tu joya</a>
      </div>
    </div>
  </div>`;
  revelar(main);
}

function filaLinea(l) {
  return `<li class="linea-bolsa" data-slug="${esc(l.slug)}">
    <a class="linea-foto" href="${urlJoya(l.slug)}" tabindex="-1" aria-hidden="true">${fotoJoya(l.imagen, '')}</a>
    <div class="linea-info">
      <a class="linea-nombre" href="${urlJoya(l.slug)}">${esc(l.nombre)}</a>
      <span class="tenue linea-unidad">${pesos(l.precio)} c/u</span>
      <div class="linea-controles">
        <div class="cantidad" role="group" aria-label="Cantidad de ${esc(l.nombre)}">
          <button type="button" data-accion="menos" aria-label="Quitar una">−</button>
          <output>${l.cantidad}</output>
          <button type="button" data-accion="mas" aria-label="Agregar una">+</button>
        </div>
        <button type="button" class="linea-quitar" data-accion="quitar">${ico('basura', { tam: 16 })}<span>Quitar</span></button>
      </div>
    </div>
    <b class="linea-total">${pesos(l.precio * l.cantidad)}</b>
  </li>`;
}

function pintarResumen() {
  const lineas = obtenerBolsa();
  if (!lineas.length) return vacia();
  const t = totales(lineas);
  main.querySelector('[data-lineas]').innerHTML = lineas.map(filaLinea).join('');
  activarFotos(main.querySelector('[data-lineas]'));
  const falta = ajustes.envio_gratis_desde - t.subtotal;
  main.querySelector('[data-resumen]').innerHTML = `
    <div><dt>Subtotal</dt><dd>${pesos(t.subtotal)}</dd></div>
    <div><dt>Envío</dt><dd>${t.envio ? pesos(t.envio) : 'Gratis'}</dd></div>
    <div class="resumen-total"><dt>Total</dt><dd>${pesos(t.total)}</dd></div>`;
  main.querySelector('[data-envio-nota]').textContent = t.gratis
    ? 'Tu pedido tiene envío gratis.'
    : ajustes.envio_gratis_desde && falta > 0
      ? `Te faltan ${pesos(falta)} para el envío gratis.`
      : '';
  main.querySelector('[data-cuenta]').textContent = `${lineas.reduce((s, l) => s + l.cantidad, 0)} ${lineas.length === 1 && lineas[0].cantidad === 1 ? 'joya' : 'joyas'}`;
  refrescar();
}

function maqueta() {
  const c = clienteGuardado();
  main.innerHTML = `<div class="contenedor">
    <header class="bolsa-cabeza">
      <p class="rotulo rotulo-oro">Tu bolsa · <span data-cuenta></span></p>
      <h1 class="titulo-l" data-titular>Confirma tu <em>pedido</em></h1>
      <p class="tenue">Al confirmar se abre WhatsApp con el pedido listo para Carlos. Ahí te pasa los datos de pago.</p>
    </header>
    <div class="bolsa">
      <section aria-label="Joyas en la bolsa">
        <ul class="lineas" data-lineas></ul>
        <dl class="resumen" data-resumen></dl>
        <p class="envio-nota tenue" data-envio-nota></p>
      </section>
      <form class="pedido" novalidate data-form>
        <h2 class="titulo-m">Tus datos</h2>
        <p class="tenue pedido-intro">Solo lo necesario para el envío. Sin cuentas ni contraseñas.</p>
        <div class="campo"><label for="c-nombre">Nombre completo</label><input class="entrada" id="c-nombre" name="nombre" autocomplete="name" required value="${esc(c.nombre || '')}"></div>
        <div class="campo"><label for="c-wa">WhatsApp</label><input class="entrada" id="c-wa" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="300 123 4567" required value="${esc(c.whatsapp || '')}"></div>
        <div class="campo"><label for="c-ciudad">Ciudad</label><input class="entrada" id="c-ciudad" name="ciudad" autocomplete="address-level2" required value="${esc(c.ciudad || '')}"></div>
        <div class="campo"><label for="c-dir">Dirección de envío</label><input class="entrada" id="c-dir" name="direccion" autocomplete="street-address" required value="${esc(c.direccion || '')}"></div>
        <div class="campo"><label for="c-nota">Nota (opcional)</label><textarea class="entrada" id="c-nota" name="nota" rows="3" placeholder="Talla, grabado, horario de entrega…"></textarea></div>
        <p class="error-campo" data-error role="alert" hidden></p>
        <button class="boton boton-bloque" type="submit" data-enviar>${ico('whatsapp', { tam: 18 })}<span>Confirmar por WhatsApp</span></button>
        <p class="pedido-legal tenue">No cobramos nada en la página. Pagas a Carlos por Nequi, Bancolombia o Daviplata y le mandas el comprobante por el mismo chat.</p>
      </form>
    </div>
  </div>`;

  main.querySelector('[data-lineas]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const slug = b.closest('[data-slug]').dataset.slug;
    const l = obtenerBolsa().find((x) => x.slug === slug);
    if (!l) return;
    if (b.dataset.accion === 'mas') fijarCantidad(slug, l.cantidad + 1);
    if (b.dataset.accion === 'menos') fijarCantidad(slug, l.cantidad - 1);
    if (b.dataset.accion === 'quitar') quitar(slug);
  });
  main.querySelector('[data-form]').addEventListener('submit', enviar);
  window.addEventListener(EVENTO, () => main.querySelector('[data-lineas]') && pintarResumen());
  revelar(main);
}

function validar(form) {
  const campos = { nombre: 'Escribe tu nombre.', whatsapp: 'Escribe un WhatsApp válido (10 dígitos).', ciudad: 'Escribe tu ciudad.', direccion: 'Escribe la dirección de envío.' };
  let primero = null;
  for (const [n, msg] of Object.entries(campos)) {
    const el = form.elements[n];
    const v = el.value.trim();
    const mal = !v || (n === 'whatsapp' && v.replace(/\D/g, '').length < 10);
    el.setAttribute('aria-invalid', String(mal));
    if (mal && !primero) primero = { el, msg };
  }
  return primero;
}

async function enviar(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const error = main.querySelector('[data-error]');
  const malo = validar(form);
  if (malo) {
    error.hidden = false;
    error.textContent = malo.msg;
    malo.el.focus();
    return;
  }
  error.hidden = true;
  const cliente = {
    nombre: form.elements.nombre.value.trim(),
    whatsapp: form.elements.whatsapp.value.trim(),
    ciudad: form.elements.ciudad.value.trim(),
    direccion: form.elements.direccion.value.trim(),
  };
  const nota = form.elements.nota.value.trim();
  guardarCliente(cliente);
  const lineas = obtenerBolsa();
  const t = totales(lineas);
  const boton = main.querySelector('[data-enviar]');
  boton.disabled = true;
  boton.querySelector('span').textContent = 'Registrando tu pedido…';

  // ventana abierta en el gesto del usuario para que el navegador no la bloquee
  const ventana = window.open('', '_blank');
  let resultado;
  try {
    resultado = await crearPedido({ cliente, items: lineas.map((l) => ({ slug: l.slug, cantidad: l.cantidad })), nota }, { lineas, ...t });
  } catch (err) {
    console.warn('[pedido]', err.message);
    resultado = { ok: false, wa_texto: textoPedidoLocal({ cliente, nota, lineas, ...t }) };
  }
  const url = enlaceWhatsApp(ajustes.whatsapp, resultado.wa_texto);
  if (ventana) ventana.location.href = url;
  if (resultado.ok) vaciar();
  confirmacion(resultado, url, Boolean(ventana));
}

function confirmacion(r, url, abierta) {
  main.innerHTML = `<div class="contenedor">
    <header class="bolsa-cabeza">
      <p class="rotulo rotulo-oro">${r.ok ? `Pedido ${esc(r.folio || '')}` : 'Casi listo'}</p>
      <h1 class="titulo-l" data-titular>${r.ok ? '¡Gracias! Tu pedido <em>quedó registrado</em>' : 'Envía tu pedido <em>por WhatsApp</em>'}</h1>
    </header>
    <div class="confirmacion">
      <p class="parrafo">${r.ok
        ? `${abierta ? 'Abrimos WhatsApp con el resumen.' : 'Abre WhatsApp con el botón para mandar el resumen.'} Carlos te responde con los datos de pago y foto o video de tus joyas antes de despacharlas.`
        : 'No pudimos registrar el pedido en la página, pero no se pierde nada: el mensaje ya está armado con tus joyas y tus datos. Solo envíalo.'}</p>
      <ol class="confirmacion-pasos">
        <li><span class="rotulo">01</span>Envía el mensaje por WhatsApp.</li>
        <li><span class="rotulo">02</span>Paga y manda la foto del comprobante por el mismo chat.</li>
        <li><span class="rotulo">03</span>Carlos despacha y te deja la guía para rastrear el envío.</li>
      </ol>
      <div class="confirmacion-acciones">
        <a class="boton" href="${url}" target="_blank" rel="noopener">${ico('whatsapp', { tam: 18 })}Abrir WhatsApp</a>
        <a class="boton boton-linea" href="${ruta('catalogo/')}">Seguir viendo joyas</a>
      </div>
      ${r.mock ? '<p class="tenue confirmacion-nota">Modo de prueba: el pedido no se guardó en el servidor.</p>' : ''}
    </div>
  </div>`;
  revelar(main);
  window.scrollTo(0, 0);
}

if (!obtenerBolsa().length) vacia();
else {
  maqueta();
  pintarResumen();
}

datos.then((d) => {
  if (!d) return;
  ajustes = { ...ajustes, ...d.ajustes };
  catalogoListo = true;
  const { lineas, retirados } = sincronizar(d.productos);
  if (!lineas.length) return vacia();
  if (main.querySelector('[data-lineas]')) {
    pintarResumen();
    if (retirados) main.querySelector('[data-envio-nota]').textContent = `Quitamos ${retirados} ${retirados === 1 ? 'joya que ya no está' : 'joyas que ya no están'} en vitrina.`;
  }
});
