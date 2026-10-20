import { montarLayout } from '../comun/layout.js';
import { revelar } from '../comun/movimiento.js';
import { cabeceraSeccion } from '../comun/tarjeta.js';
import { ruta, enlaceWhatsApp, pesos } from '../comun/formato.js';
import { ico } from '../comun/iconos.js';
import '../estilos/como-comprar.css';

const { main, datos } = montarLayout({ activa: 'como-comprar' });

const PASOS = [
  ['Elige tu joya', 'Navega el catálogo. Cada precio ya está calculado con el gramo de oro de hoy, así que lo que ves es lo que pagas.'],
  ['Agrégala a la bolsa o escribe directo', 'Puedes confirmar el pedido en la página o preguntarle a Carlos por WhatsApp desde la ficha de cada joya.'],
  ['Confirma con tus datos', 'Nombre, WhatsApp, ciudad y dirección. Sin cuentas, sin contraseñas y sin datos de tarjeta.'],
  ['Recibe los datos de pago', 'Se abre WhatsApp con tu pedido. Carlos te responde con los datos de Nequi, Bancolombia o Daviplata y foto o video de la pieza.'],
  ['Manda el comprobante', 'Pagas y envías la foto del comprobante por el mismo chat. Carlos lo verifica.'],
  ['Recibe con guía rastreable', 'Empaca, despacha y te deja el número de guía para que sigas tu envío hasta tu casa.'],
];

const FAQ = [
  ['¿El oro es de verdad 18k?', 'Sí. Trabajamos oro nacional 18k y oro italiano ley 750 (18k). Cada pieza sale con su garantía de material.'],
  ['¿Por qué cambia el precio?', 'Porque el oro cambia día a día. Carlos actualiza el precio del gramo y todo el catálogo se recalcula solo.'],
  ['¿Cobran por gramo o por joya?', 'Depende de la pieza. Las cadenas y pulseras suelen ir por gramo; las piezas con trabajo especial van con precio por joya. Cada ficha lo dice.'],
  ['¿Puedo diseñar mi propia joya?', 'Sí. Pídele a Carlos tu código, entra a «Diseña tu joya» y arma tu dije, inicial, placa o anillo en 3D. Verás el peso y el precio estimado; Carlos lo confirma antes de fabricar.'],
  ['¿Hacen envíos?', 'A toda Colombia por transportadora con número de guía, y también al exterior. El costo y el tiempo dependen del destino.'],
  ['¿Puedo pagar contra entrega?', 'En Bucaramanga sí, coordinando con Carlos. Para otras ciudades se paga antes del despacho.'],
  ['¿Y si no me queda o no me gusta?', 'Tienes 5 días para cambio, siempre que la joya esté sin uso y con su empaque.'],
];

main.innerHTML = `<div class="contenedor">
  <header class="cc-cabeza">
    <p class="rotulo rotulo-oro">Guía rápida</p>
    <h1 class="titulo-xl" data-titular>Cómo <em>comprar</em></h1>
    <p class="parrafo cc-intro" data-aparecer>No hay pasarela de pagos: pides en la página y cierras el trato directamente con Carlos por WhatsApp. Así de simple, de persona a persona.</p>
  </header>

  <section class="seccion cc-seccion" aria-labelledby="t-pasos">
    ${cabeceraSeccion({ num: '01', rotulo: 'Paso a paso', titulo: '<span id="t-pasos">Seis pasos, <em>cero letra pequeña</em></span>' })}
    <ol class="cc-pasos">${PASOS.map(([t, d], i) => `
      <li class="cc-paso" data-aparecer>
        <span class="cc-num" aria-hidden="true">0${i + 1}</span>
        <div><h3>${t}</h3><p class="tenue">${d}</p></div>
      </li>`).join('')}</ol>
  </section>

  <section class="seccion cc-seccion" aria-labelledby="t-envio">
    ${cabeceraSeccion({ num: '02', rotulo: 'Envíos y pagos', titulo: '<span id="t-envio">Lo que debes <em>saber</em></span>' })}
    <ul class="cc-datos" data-aparecer="hijos">
      <li>${ico('moneda', { tam: 24 })}<b>Pagos</b><span class="tenue">Nequi, Bancolombia o Daviplata. Los datos te los da Carlos por WhatsApp.</span></li>
      <li>${ico('camion', { tam: 24 })}<b>Envío</b><span class="tenue" data-envio>Con guía rastreable a toda Colombia.</span></li>
      <li>${ico('globo', { tam: 24 })}<b>Exterior</b><span class="tenue">También enviamos fuera de Colombia; se cotiza según el país.</span></li>
      <li>${ico('refrescar', { tam: 24 })}<b>Cambios</b><span class="tenue">5 días para cambio, sin uso y con su empaque.</span></li>
    </ul>
  </section>

  <section class="seccion cc-seccion" aria-labelledby="t-faq">
    ${cabeceraSeccion({ num: '03', rotulo: 'Preguntas frecuentes', titulo: '<span id="t-faq">Preguntas <em>frecuentes</em></span>' })}
    <div class="faq">${FAQ.map(([q, r]) => `
      <details class="faq-item">
        <summary><span>${q}</span><span class="faq-signo" aria-hidden="true"></span></summary>
        <p class="tenue">${r}</p>
      </details>`).join('')}</div>
  </section>

  <section class="seccion" aria-labelledby="t-dudas">
    <div class="cc-cta" data-aparecer>
      <div>
        <h2 class="titulo-l" id="t-dudas">¿Dudas? <em>Escribe directo</em></h2>
        <p class="tenue">Carlos responde personalmente. Sin bots.</p>
      </div>
      <div class="cc-cta-acciones">
        <a class="boton boton-claro" href="${enlaceWhatsApp('573178861724', 'Hola Carlos, tengo una duda antes de comprar.')}" target="_blank" rel="noopener" data-wa-dudas>${ico('whatsapp', { tam: 18 })}Hablar por WhatsApp</a>
        <a class="boton cc-boton-oscuro" href="${ruta('catalogo/')}">Ver el catálogo</a>
      </div>
    </div>
  </section>
</div>`;

revelar(main);

datos.then((d) => {
  if (!d) return;
  const a = d.ajustes;
  main.querySelector('[data-wa-dudas]').href = enlaceWhatsApp(a.whatsapp, 'Hola Carlos, tengo una duda antes de comprar.');
  if (a.envio_valor) {
    main.querySelector('[data-envio]').textContent = `Con guía rastreable a toda Colombia: ${pesos(a.envio_valor)}${a.envio_gratis_desde ? `, gratis en pedidos desde ${pesos(a.envio_gratis_desde)}` : ''}.`;
  }
});
