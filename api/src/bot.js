// Bot de Telegram de Carlos: administra precios, productos, códigos, diseños y pedidos.
// Sin IA: entiende comandos y botones. /menu es la puerta de entrada; los pasos que piden un
// dato (peso, nombre, precio…) dejan una "espera" por chat y la siguiente respuesta la completa.
import { json, ahoraIso, dinero, escaparHtml as h, slugificar, dormir, fechaCorta, waLink, texto } from './util.js';
import { leerAjustes, fijarAjuste, preciosGramo, hechuraGramo, tejidoValor, calcularPrecio, actualizarPrecioGramo } from './precios.js';
import { buscarProducto, SELECT_PRODUCTO } from './catalogo.js';
import { crearCodigo, normalizarCodigo } from './codigos.js';
import { leerPie, gramos } from './pie.js';
import { guardar, borrar } from './r2.js';
import * as tg from './telegram.js';
import { describirDiseno } from './esquema-disenador.js';

/** Descripción legible de un diseño guardado en D1 (parametros es JSON ya validado). */
function describirGuardado(d) {
  try { return describirDiseno(d.tipo, JSON.parse(d.parametros || '{}')); } catch { return String(d.tipo); }
}

export const COMANDOS = [
  ['menu', 'Menú con botones'],
  ['oro', 'Ver o cambiar el precio del gramo'],
  ['productos', 'Buscar y editar joyas'],
  ['codigo', 'Crear código para un cliente'],
  ['codigos', 'Códigos vigentes'],
  ['anular', 'Anular un código'],
  ['disenos', 'Últimos diseños recibidos'],
  ['pedidos', 'Últimos pedidos'],
  ['peso', 'Cambiar el peso de una joya'],
  ['precio', 'Fijar precio por pieza'],
  ['ocultar', 'Ocultar una joya'],
  ['mostrar', 'Mostrar una joya'],
  ['hechura', 'Ver o cambiar la hechura por gramo'],
  ['tejido', 'Ver o cambiar el valor del tejido en nylon'],
  ['anuncio', 'Franja de anuncio de la web'],
  ['cancelar', 'Cancelar lo que estaba haciendo'],
  ['ayuda', 'Aprender a usar el bot, tema por tema'],
  ['comandos', 'Lista corta de comandos'],
];

const AYUDA = `<b>Comandos</b> · Lo más fácil es /menu; para aprender paso a paso, /ayuda.

<b>Precios</b>
/oro — ver precios del gramo
/oro nacional 352000 · /oro italiano 410000 (te pido confirmar)
/hechura 60000 — hechura por gramo de los diseños
/tejido 25000 — mano de obra del tejido en nylon de los diseños

<b>Joyas</b>
Mándame una foto (o un álbum) de una joya con un texto, p. ej. «Cadena lazo italiano 4,2 g», y te armo el borrador: el nombre, el peso, el oro (si no dices, nacional) y la categoría salen de tu texto. Lo que falte lo completas con los botones.
/productos [texto] — buscar; con «Editar» cambias nombre, descripción, categoría, oro, medidas, descuento y fotos
/peso KP-012 3.4 · /precio KP-012 250000
/ocultar KP-012 · /mostrar KP-012

<b>Clientes</b>
/codigo Ana Pérez [días] — código para diseñar (luego le puedes poner una nota)
/codigos — vigentes · /anular KP-XXXXX
/disenos — últimos diseños · /pedidos — últimos pedidos

<b>Web</b>
/anuncio Envíos gratis este fin de semana (vacío = quitar)

/cancelar — si me quedé esperando un dato que ya no quieres darme`;

// /ayuda: un tema por botón, explicado paso a paso para aprender usando el bot.
const AYUDA_TEMAS = {
  oro: ['Precio del oro', `<b>Cambiar el precio del oro</b>

El precio de cada joya se calcula solo: <i>peso × precio del gramo</i>. Si cambias el gramo, cambia toda la página.

<b>Paso a paso</b>
1. /menu → <b>Precio del oro</b>
2. Toca <b>Cambiar nacional</b> o <b>Cambiar italiano</b>
3. Escribe el precio del gramo en pesos, p. ej. <code>455000</code>
4. Te muestro cuánto sube o baja y cuántas joyas cambian. Toca <b>Sí, cambiar</b>

<b>Atajo:</b> <code>/oro nacional 455000</code> · <code>/oro italiano 560000</code>
<b>Ver precios:</b> /oro

También: <code>/hechura 60000</code> (hechura por gramo de los diseños) y <code>/tejido 25000</code> (tejido en nylon).`],
  subir: ['Subir una joya', `<b>Subir una joya nueva</b>

1. Toma la foto (o varias: se mandan juntas como álbum)
2. Mándamela con un texto escrito en la foto, así:
<code>Cadena lazo italiano 4,2 g 50 cm</code>
3. Del texto saco:
   • <b>nombre</b>: lo primero que escribas
   • <b>peso</b>: «4,2 g», «4.2gr» o «4,2 gramos»
   • <b>oro</b>: si dice «italiano»; si no, nacional
   • <b>categoría</b>: cadena, pulsera, aretes, anillo, dije, conjunto…
   • <b>medidas</b>: «50 cm», «12 mm»
4. Te muestro el borrador con el precio de hoy. Si falta algo, usa los botones <b>Cambiar peso / categoría / nombre</b>
5. Toca <b>Publicar</b> y ya sale en la página.

Las líneas que escribas después de la primera quedan como descripción.`],
  editar: ['Editar una joya', `<b>Buscar y editar una joya</b>

1. /menu → <b>Buscar y editar joya</b> y escribe una palabra (<code>rolo</code>, <code>topos</code>) o el código (<code>KP-012</code>)
   Atajo: <code>/productos rolo</code>
2. Debajo de cada joya tienes botones:
   • <b>Ocultar / Mostrar</b>: la quita de la página sin borrarla (por ejemplo si se vendió)
   • <b>Destacar</b>: sale primero en la página
   • <b>Peso</b>: el precio se recalcula con el oro del día
   • <b>Precio</b>: precio fijo por pieza (deja de seguir el oro)
   • <b>Borrar</b>: te pide confirmar
   • <b>Editar</b>: nombre, descripción, categoría, oro nacional/italiano, medidas, descuento y fotos

<b>Descuento:</b> escribe <code>10%</code>, un valor en pesos como <code>20000</code>, o <code>0</code> para quitarlo.
<b>Fotos:</b> te mando el álbum numerado y eliges <b>Agregar</b>, <b>Reemplazar todas</b> (la primera nueva es la portada) o <b>Quitar una</b>.`],
  codigos: ['Códigos para clientes', `<b>Códigos para que el cliente diseñe su joya</b>

Sin código el cliente puede jugar con el diseñador, pero no puede enviarte el diseño.

1. /menu → <b>Crear código</b> y escribe el nombre del cliente, p. ej. <code>Ana Pérez</code>
   (para más días: <code>Ana Pérez 30</code>; por defecto dura 15 y permite 5 diseños)
   Atajo: <code>/codigo Ana Pérez</code>
2. Te doy el código (KP-XXXXX) y el mensaje listo. Toca <b>Compartir por WhatsApp</b> y se lo mandas.
3. Toca <b>Agregar nota</b> para apuntar qué quiere el cliente («dije con nombre Sofía, presupuesto 1 millón»). Te la recuerdo cuando llegue su diseño.

<b>Ver códigos vigentes:</b> /codigos
<b>Cancelar uno:</b> <code>/anular KP-XXXXX</code>`],
  disenos: ['Diseños y archivo STL', `<b>Cuando un cliente te envía su diseño</b>

Te llegan tres cosas aquí:
1. La <b>foto</b> de cómo se ve puesta
2. El <b>resumen</b>: tipo de pieza, texto, medidas, peso en oro, montaje (cadena o tejido) y precio estimado
3. El archivo <b>.stl</b> (D-000123.stl): es la pieza a escala real en milímetros, lista para imprimir en resina y fundir. Reenvíaselo a quien te imprime.

El precio es un <b>estimado</b>: el final lo cuadras con el cliente por WhatsApp.
La cadena se cotiza aparte; el tejido en nylon sí va incluido.

<b>Ver los últimos:</b> /disenos`],
  pedidos: ['Pedidos de la tienda', `<b>Pedidos de la tienda</b>

Cuando alguien compra joyas del catálogo en la página:
1. Te llega aquí el aviso con el folio (P-000123), lo que pidió, el total y un enlace para escribirle por <b>WhatsApp</b>
2. Al cliente se le abre WhatsApp con el pedido para que te escriba
3. El pago y el envío los cuadras con él por WhatsApp (la página no cobra)

Los precios del pedido se recalculan con el oro del día, así nadie paga un precio viejo.

<b>Ver los últimos:</b> /pedidos`],
  web: ['Anuncio de la página', `<b>Franja de anuncio de la página</b>

Es la barra de arriba de la página (ahora: «Envíos a toda Colombia»).

1. /menu → <b>Anuncio de la web</b>
2. Escribe el texto nuevo, p. ej. <code>Envíos gratis este fin de semana</code>
3. Para quitarlo, toca <b>Quitar anuncio</b>

Atajo: <code>/anuncio Envíos gratis este fin de semana</code> · <code>/anuncio</code> solo = quitar`],
  trucos: ['Si me enredo', `<b>Si te enredas</b>

• Cuando te pido un dato (peso, nombre, precio…) espero tu respuesta 30 minutos. Si ya no quieres, escribe /cancelar
• /menu siempre te devuelve a los botones
• Los números se pueden escribir como quieras: <code>455000</code>, <code>455.000</code> o <code>$455.000</code>; el peso con coma o punto: <code>3,4</code> o <code>3.4</code>
• Nada se borra sin preguntarte, y el precio del oro te pide confirmar
• Si algo no funciona, cuéntale a Juan Diego`],
};

const botonesAyuda = () => {
  const claves = Object.keys(AYUDA_TEMAS);
  const filas = [];
  for (let i = 0; i < claves.length; i += 2) filas.push(claves.slice(i, i + 2).map((k) => ({ text: AYUDA_TEMAS[k][0], callback_data: `a:${k}` })));
  return filas;
};
const TEXTO_AYUDA = '<b>Ayuda</b> · Toca un tema y te explico paso a paso. Para la lista corta de comandos: /comandos';

const MENU = [
  [{ text: 'Precio del oro', callback_data: 'm:oro' }, { text: 'Subir joya', callback_data: 'm:subir' }],
  [{ text: 'Buscar y editar joya', callback_data: 'm:buscar' }, { text: 'Crear código', callback_data: 'm:codigo' }],
  [{ text: 'Códigos', callback_data: 'm:codigos' }, { text: 'Pedidos', callback_data: 'm:pedidos' }, { text: 'Diseños', callback_data: 'm:disenos' }],
  [{ text: 'Anuncio de la web', callback_data: 'm:anuncio' }, { text: 'Ayuda', callback_data: 'm:ayuda' }],
];
const TEXTO_MENU = '<b>18gold KPrada</b> · ¿Qué hacemos?';

// ---------------------------------------------------------------- entrada del webhook

export async function webhookTelegram(request, env, ctx, ruta) {
  if (!env.TELEGRAM_RUTA_SECRETA || ruta !== env.TELEGRAM_RUTA_SECRETA) return json({ ok: false, error: 'No encontrado.' }, 404);
  if (!env.TELEGRAM_SECRETO || request.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_SECRETO) {
    return json({ ok: false, error: 'No autorizado.' }, 401);
  }
  let update;
  try { update = await request.json(); } catch { return json({ ok: false }, 400); }
  const origen = new URL(request.url).origin;
  // Telegram solo necesita un 200 rápido; el trabajo sigue en segundo plano.
  ctx.waitUntil(procesarUpdate(env, update, origen).catch((e) => console.log('[bot] error', e.stack || e.message)));
  return json({ ok: true });
}

export async function procesarUpdate(env, u, origen) {
  if (u.callback_query) return manejarBoton(env, u.callback_query, origen);
  const m = u.message;
  if (!m?.chat) return;
  const chat = String(m.chat.id);

  if (!tg.esAdmin(env, chat)) {
    console.log(`[bot] mensaje de chat no autorizado ${chat} (${m.from?.first_name || ''} @${m.from?.username || ''})`);
    // Modo configuración: sin admins aún, le decimos a quien escriba su chat_id.
    if (!tg.admins(env).length) await tg.sendMessage(env, chat, `Tu chat_id es <code>${chat}</code>. Ponlo en TELEGRAM_ADMINS.`);
    return;
  }

  if (m.photo?.length) return manejarFoto(env, m, chat, origen);

  const t = (m.text || '').trim();
  if (!t) return;
  if (t.startsWith('/')) {
    const [cmdBruto, ...resto] = t.split(/\s+/);
    const cmd = cmdBruto.slice(1).split('@')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const args = t.slice(cmdBruto.length).trim();
    console.log(`[bot] ${chat} /${cmd} ${args}`);
    await borrarEspera(env, chat);
    return ejecutarComando(env, chat, cmd, args, resto, origen);
  }
  return manejarRespuesta(env, chat, t, origen);
}

// ---------------------------------------------------------------- comandos

async function ejecutarComando(env, chat, cmd, args, partes, origen) {
  const responder = (txt, botones) => tg.sendMessage(env, chat, txt, botones);
  switch (cmd) {
    case 'start':
    case 'menu':
      return responder(TEXTO_MENU, MENU);

    case 'ayuda':
    case 'help':
      return responder(TEXTO_AYUDA, botonesAyuda());

    case 'comandos':
      return responder(AYUDA);

    case 'cancelar':
      return responder('Listo, no estoy esperando nada.', MENU);

    case 'oro': {
      if (!partes.length) return responder(await textoPrecios(env), botonesOro());
      const tipo = (partes[0] || '').toLowerCase();
      if (!['nacional', 'italiano'].includes(tipo)) return responder('Así: <code>/oro nacional 352000</code> o <code>/oro italiano 410000</code>');
      return proponerOro(env, chat, tipo, partes[1]);
    }

    case 'hechura': {
      if (!partes.length) return responder(`Hechura de diseños: <b>${dinero(hechuraGramo(await leerAjustes(env)))}</b> por gramo.\nCambiar: <code>/hechura 60000</code>`);
      const valor = numeroPrecio(partes[0]);
      if (!valor || valor > 1000000) return responder('Así: <code>/hechura 60000</code>');
      await actualizarPrecioGramo(env, 'hechura', valor);
      return responder(`Listo. Hechura: <b>${dinero(valor)}</b> por gramo.`);
    }

    case 'tejido': {
      if (!partes.length) return responder(`Tejido en nylon de los diseños: <b>${dinero(tejidoValor(await leerAjustes(env)))}</b>.\nCambiar: <code>/tejido 25000</code>`);
      const limpio = String(partes[0]).replace(/[^\d]/g, '');
      const valor = limpio === '' ? NaN : Number(limpio);
      if (!Number.isFinite(valor) || valor > 1000000) return responder('Así: <code>/tejido 25000</code> (pesos; 0 = sin cobro)');
      await actualizarPrecioGramo(env, 'tejido', valor);
      return responder(`Listo. Tejido en nylon: <b>${dinero(valor)}</b> por diseño tejido.`);
    }

    case 'anuncio':
      await fijarAjuste(env, 'anuncio', texto(args, 160));
      return responder(args ? `Anuncio publicado: «${h(texto(args, 160))}»` : 'Listo, quité el anuncio de la web.');

    case 'productos':
      return listarProductos(env, chat, args);

    case 'peso':
    case 'precio': {
      const valorTxt = partes[partes.length - 1];
      const ref = partes.slice(0, -1).join(' ');
      if (partes.length < 2) return responder(cmd === 'peso' ? 'Así: <code>/peso KP-012 3.4</code>' : 'Así: <code>/precio KP-012 250000</code>');
      const p = await buscarProducto(env, ref);
      if (!p) return responder(`No encontré «${h(ref)}». Prueba con /productos ${h(ref)}`);
      return responderProducto(env, chat, p.id, await aplicarValor(env, cmd, p.id, valorTxt));
    }

    case 'ocultar':
    case 'mostrar': {
      if (!args) return responder(`Así: <code>/${cmd} KP-012</code>`);
      const p = await buscarProducto(env, args);
      if (!p) return responder(`No encontré «${h(args)}».`);
      await env.DB.prepare('UPDATE productos SET activo = ? WHERE id = ?').bind(cmd === 'mostrar' ? 1 : 0, p.id).run();
      return responder(`${h(p.nombre)} ${cmd === 'mostrar' ? 'ya se ve en la web' : 'quedó oculta'}.`);
    }

    case 'codigo': {
      let dias = 15;
      const p = [...partes];
      if (p.length > 1 && /^\d{1,3}$/.test(p[p.length - 1])) dias = Math.min(365, Math.max(1, Number(p.pop())));
      const cliente = texto(p.join(' '), 80);
      if (!cliente) return responder('Así: <code>/codigo Ana Pérez</code> o <code>/codigo Ana Pérez 30</code> (días)');
      const c = await crearCodigo(env, cliente, dias, 5, chat);
      const enlace = `${(env.SITIO_URL || '').replace(/\/$/, '')}/disena/?c=${c.codigo}`;
      const mensaje = `Hola ${cliente}, este es tu código para diseñar tu joya en 18gold KPrada: ${c.codigo}\nEntra aquí y crea tu diseño: ${enlace}`;
      return responder(
        `Código para <b>${h(cliente)}</b>: <code>${c.codigo}</code>\nVence: ${fechaCorta(c.expira)} · hasta ${c.max_disenos} diseños\n\n<b>Para reenviar:</b>\n${h(mensaje)}`,
        [
          [{ text: 'Compartir por WhatsApp', url: 'https://wa.me/?text=' + encodeURIComponent(mensaje) }],
          [{ text: 'Agregar nota (qué quiere el cliente)', callback_data: `c:nota:${c.id}` }],
        ]
      );
    }

    case 'codigos': {
      const { results } = await env.DB.prepare(
        'SELECT * FROM codigos WHERE anulado = 0 AND expira > ? ORDER BY creado DESC LIMIT 30'
      ).bind(ahoraIso()).all();
      if (!results.length) return responder('No hay códigos vigentes. Crea uno con /codigo Nombre');
      return responder('<b>Códigos vigentes</b>\n\n' + results.map((c) =>
        `<code>${c.codigo}</code> ${h(c.cliente)} — ${c.usados}/${c.max_disenos} diseños · vence ${fechaCorta(c.expira)}` +
        (c.nota ? `\n   <i>${h(c.nota)}</i>` : '')).join('\n'));
    }

    case 'anular': {
      const codigo = normalizarCodigo(args);
      const r = await env.DB.prepare('UPDATE codigos SET anulado = 1 WHERE codigo = ? AND anulado = 0 RETURNING cliente').bind(codigo).first();
      return responder(r ? `Anulé <code>${codigo}</code> de ${h(r.cliente)}.` : `No encontré un código vigente ${h(codigo || '(vacío)')}.`);
    }

    case 'disenos': {
      const { results } = await env.DB.prepare('SELECT * FROM disenos WHERE folio IS NOT NULL ORDER BY id DESC LIMIT 8').all();
      if (!results.length) return responder('Todavía no han llegado diseños.');
      await responder('<b>Últimos diseños</b> · con el botón te vuelvo a mandar la foto y el STL');
      for (const d of results) {
        await responder(
          `<b>${d.folio}</b> · ${h(d.cliente)} (${h(d.codigo || '')})\n${h(describirGuardado(d))} · ${Number(d.peso_estimado).toLocaleString('es-CO')} g · ${dinero(d.precio_estimado)}\n${fechaCorta(d.creado)}`,
          [[{ text: `Mandarme foto y STL de ${d.folio}`, callback_data: `d:env:${d.id}` }]]);
      }
      return;
    }

    case 'pedidos': {
      const { results } = await env.DB.prepare('SELECT * FROM pedidos WHERE folio IS NOT NULL ORDER BY id DESC LIMIT 8').all();
      if (!results.length) return responder('Todavía no hay pedidos.');
      return responder('<b>Últimos pedidos</b>\n\n' + results.map((p) =>
        `<b>${p.folio}</b> · ${dinero(p.total)} · ${h(p.cliente_nombre)} (${h(p.ciudad)})\n${fechaCorta(p.creado)} · <a href="${waLink(p.cliente_whatsapp)}">WhatsApp</a>`).join('\n\n'));
    }

    default:
      return responder('No conozco ese comando. Toca /menu o mira /ayuda');
  }
}

async function textoPrecios(env) {
  const a = await leerAjustes(env);
  const p = preciosGramo(a);
  const r = await env.DB.prepare("SELECT MAX(creado) f FROM precios_historial WHERE tipo IN ('nacional','italiano')").first();
  return `<b>Precio del gramo</b>\nNacional: ${dinero(p.nacional)}\nItaliano: ${dinero(p.italiano)}\nHechura diseños: ${dinero(hechuraGramo(a))}/g\nTejido en nylon: ${dinero(tejidoValor(a))}` +
    (r?.f ? `\n\nÚltimo cambio: ${fechaCorta(r.f)}` : '');
}

const botonesOro = () => [[
  { text: 'Cambiar nacional', callback_data: 'o:pide:nacional' },
  { text: 'Cambiar italiano', callback_data: 'o:pide:italiano' },
]];

/** Muestra el cambio del gramo con lo que afecta y pide confirmar: un dedo mal puesto mueve toda la tienda. */
async function proponerOro(env, chat, tipo, valorTxt) {
  const valor = numeroPrecio(valorTxt);
  if (!valor) return tg.sendMessage(env, chat, `Escríbeme el precio del gramo ${tipo} en pesos, p. ej. <code>/oro ${tipo} 455000</code>`);
  if (valor < 50000 || valor > 5000000) return tg.sendMessage(env, chat, `¿Seguro? ${dinero(valor)} por gramo se sale de lo normal. Revísalo y vuelve a intentar.`);
  const actual = preciosGramo(await leerAjustes(env))[tipo];
  if (valor === actual) return tg.sendMessage(env, chat, `El oro ${tipo} ya está en ${dinero(valor)}. No cambié nada.`);
  const n = (await env.DB.prepare(
    "SELECT COUNT(*) n FROM productos WHERE activo = 1 AND tipo_precio = 'gramo' AND tipo_oro = ?"
  ).bind(tipo).first())?.n ?? 0;
  const pct = actual ? ((valor - actual) / actual) * 100 : 0;
  return tg.sendMessage(env, chat,
    `<b>Oro ${tipo}</b>: ${dinero(actual)} → <b>${dinero(valor)}</b> por gramo` +
    (actual ? ` (${pct > 0 ? '+' : ''}${pct.toFixed(1).replace('.', ',')} %)` : '') +
    `\nCambia el precio de ${n} joya${n === 1 ? '' : 's'} visible${n === 1 ? '' : 's'} y de los diseños en oro ${tipo}.\n\n¿Confirmas?`,
    [[{ text: 'Sí, cambiar', callback_data: `o:ok:${tipo}:${valor}` }, { text: 'No', callback_data: 'o:no' }]]);
}

// "360.000" / "$360000" → 360000
const numeroPrecio = (s) => { const n = Number(String(s || '').replace(/[^\d]/g, '')); return n > 0 ? n : 0; };
// "3,2" / "3.2g" → 3.2
const numeroGramos = (s) => gramos(String(s || '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;

/**
 * Texto de descuento → {tipo, valor} o null si no se entiende.
 * «0», «quitar», «no», «ninguno» → sin descuento · «10%» → porcentaje · «20000» / «$20.000» → valor en pesos.
 */
export function leerDescuento(t) {
  const s = String(t || '').trim().toLowerCase();
  if (/^(0|no|quitar|ninguno|sin descuento)$/.test(s)) return { tipo: 'ninguno', valor: 0 };
  const pct = s.match(/^(\d{1,2}(?:[.,]\d+)?)\s*%$/);
  if (pct) {
    const v = Number(pct[1].replace(',', '.'));
    return v > 0 && v <= 90 ? { tipo: 'porcentaje', valor: v } : null;
  }
  if (/%/.test(s)) return null;
  const v = numeroPrecio(s);
  return v >= 1000 ? { tipo: 'valor', valor: v } : null;
}

/** Aplica peso o precio a un producto y devuelve el texto de respuesta. */
async function aplicarValor(env, accion, id, valorTxt) {
  if (accion === 'peso') {
    const g = numeroGramos(valorTxt);
    if (!g || g > 500) return 'Ese peso no me cuadra. Escríbelo en gramos, p. ej. <code>3,4</code>';
    await env.DB.prepare("UPDATE productos SET peso_gramos = ?, tipo_precio = 'gramo', verificado = 1 WHERE id = ?").bind(g, id).run();
  } else {
    const v = numeroPrecio(valorTxt);
    if (!v || v < 1000) return 'Ese precio no me cuadra. Escríbelo en pesos, p. ej. <code>250000</code>';
    await env.DB.prepare("UPDATE productos SET precio_pieza = ?, tipo_precio = 'pieza', verificado = 1 WHERE id = ?").bind(v, id).run();
  }
  return 'Listo.';
}

// ---------------------------------------------------------------- productos

async function tarjetaProducto(env, p, precios) {
  precios ||= preciosGramo(await leerAjustes(env));
  const { final, base, ahorro } = calcularPrecio(p, precios);
  const cobro = p.tipo_precio === 'pieza' ? 'precio por pieza' : `${Number(p.peso_gramos).toLocaleString('es-CO')} g`;
  const dto = p.descuento_tipo === 'porcentaje' ? `${Number(p.descuento_val).toLocaleString('es-CO')} %`
    : p.descuento_tipo === 'valor' ? dinero(p.descuento_val) : '';
  return `<b>${h(p.sku || '#' + p.id)}</b> ${h(p.nombre)}\n` +
    `${h(p.categoria_nombre || 'sin categoría')} · oro ${p.tipo_oro} · ${cobro}` + (p.medidas ? ` · ${h(p.medidas)}` : '') + '\n' +
    `<b>${dinero(final)}</b>${ahorro ? ` (antes ${dinero(base)}, descuento ${dto})` : ''}\n` +
    `${p.activo ? 'Visible' : 'Oculta'}${p.destacado ? ' · Destacada' : ''}` +
    (p.descripcion ? `\n<i>${h(String(p.descripcion).slice(0, 300))}</i>` : '');
}

const botonesProducto = (p) => [
  [{ text: 'Editar', callback_data: `p:edit:${p.id}` }, { text: p.activo ? 'Ocultar' : 'Mostrar', callback_data: `p:vis:${p.id}` }, { text: p.destacado ? 'Quitar destacado' : 'Destacar', callback_data: `p:dest:${p.id}` }],
  [{ text: 'Peso', callback_data: `p:peso:${p.id}` }, { text: 'Precio', callback_data: `p:prec:${p.id}` }, { text: 'Borrar', callback_data: `p:bor:${p.id}` }],
];

const botonesEditar = (p, nFotos) => [
  [{ text: 'Nombre', callback_data: `p:nom:${p.id}` }, { text: 'Descripción', callback_data: `p:desc:${p.id}` }],
  [{ text: 'Categoría', callback_data: `p:cat:${p.id}` }, { text: `Oro: pasar a ${p.tipo_oro === 'italiano' ? 'nacional' : 'italiano'}`, callback_data: `p:oro:${p.id}` }],
  [{ text: 'Medidas', callback_data: `p:med:${p.id}` }, { text: 'Descuento', callback_data: `p:dto:${p.id}` }],
  [{ text: `Fotos (${nFotos})`, callback_data: `p:fotos:${p.id}` }],
  [{ text: 'Volver', callback_data: `p:cancel:${p.id}` }],
];

const leerProducto = (env, id) => env.DB.prepare(`${SELECT_PRODUCTO} WHERE p.id = ?`).bind(id).first();
const contarFotos = async (env, id) => (await env.DB.prepare('SELECT COUNT(*) n FROM producto_imagenes WHERE producto_id = ?').bind(id).first())?.n ?? 0;

/** Manda la tarjeta actualizada de una joya con sus botones, precedida de un aviso. */
async function responderProducto(env, chat, id, aviso = 'Listo.') {
  const p = await leerProducto(env, id);
  if (!p) return tg.sendMessage(env, chat, 'Esa joya ya no existe.');
  return tg.sendMessage(env, chat, `${aviso}\n\n${await tarjetaProducto(env, p)}`, botonesProducto(p));
}

async function listarProductos(env, chat, q) {
  q = texto(q, 60);
  const like = `%${q}%`;
  const { results } = await env.DB.prepare(
    `${SELECT_PRODUCTO} WHERE (?1 = '' OR p.nombre LIKE ?2 OR p.sku LIKE ?2 OR p.slug LIKE ?2 OR c.nombre LIKE ?2)
     ORDER BY p.id DESC LIMIT 8`
  ).bind(q, like).all();
  if (!results.length) return tg.sendMessage(env, chat, `No encontré joyas con «${h(q)}».`);
  const precios = preciosGramo(await leerAjustes(env));
  await tg.sendMessage(env, chat, `${results.length === 8 ? 'Las 8 más recientes' : results.length + ' resultado(s)'}${q ? ` para «${h(q)}»` : ''}:`);
  for (const p of results) await tg.sendMessage(env, chat, await tarjetaProducto(env, p, precios), botonesProducto(p));
}

// ---------------------------------------------------------------- "esperando respuesta"

const claveEspera = (chat) => `bot_espera:${chat}`;
async function fijarEspera(env, chat, accion, id, extra = {}) {
  await fijarAjuste(env, claveEspera(chat), JSON.stringify({ ...extra, accion, id, t: Date.now() }));
}
async function borrarEspera(env, chat) { await env.DB.prepare('DELETE FROM ajustes WHERE clave = ?').bind(claveEspera(chat)).run(); }
async function leerEspera(env, chat) {
  const r = await env.DB.prepare('SELECT valor FROM ajustes WHERE clave = ?').bind(claveEspera(chat)).first();
  if (!r) return null;
  const e = JSON.parse(r.valor);
  return Date.now() - e.t < 30 * 60000 ? e : null; // vence en 30 min
}

/** Pide un dato y deja la espera; `ejemplo` va en <code>. */
async function pedir(env, chat, accion, id, pregunta, extra) {
  await fijarEspera(env, chat, accion, id, extra);
  return tg.sendMessage(env, chat, `${pregunta}\n<i>(o /cancelar)</i>`);
}

async function manejarRespuesta(env, chat, t, origen) {
  const e = await leerEspera(env, chat);
  if (!e) return tg.sendMessage(env, chat, 'No te entendí. Toca /menu o mándame una foto de una joya.');
  await borrarEspera(env, chat);
  const reintentar = async (msg) => { await fijarEspera(env, chat, e.accion, e.id, e); return tg.sendMessage(env, chat, msg); };

  switch (e.accion) {
    // --- borrador de joya nueva
    case 'bpeso': {
      const g = numeroGramos(t);
      if (!g || g > 500) return reintentar('Escríbeme solo el peso en gramos, p. ej. <code>3,2</code>');
      const b = await leerBorrador(env, e.id, chat);
      if (!b) return;
      b.propuesta.peso_gramos = g;
      await guardarPropuesta(env, b);
      return mostrarBorrador(env, chat, b, true);
    }
    case 'bnombre': {
      const nombre = texto(t, 80);
      if (nombre.length < 2) return reintentar('Escríbeme el nombre de la joya, p. ej. <code>Cadena lazo 50 cm</code>');
      const b = await leerBorrador(env, e.id, chat);
      if (!b) return;
      b.propuesta.nombre = nombre;
      await guardarPropuesta(env, b);
      return mostrarBorrador(env, chat, b, true);
    }

    // --- joya publicada
    case 'peso':
    case 'precio': {
      const r = await aplicarValor(env, e.accion, e.id, t);
      return r === 'Listo.' ? responderProducto(env, chat, e.id) : reintentar(r);
    }
    case 'pnom': {
      const nombre = texto(t, 80);
      if (nombre.length < 2) return reintentar('Escríbeme el nombre nuevo, p. ej. <code>Cadena lazo 50 cm</code>');
      await env.DB.prepare('UPDATE productos SET nombre = ? WHERE id = ?').bind(nombre, e.id).run();
      return responderProducto(env, chat, e.id);
    }
    case 'pdesc': {
      const d = /^(-|quitar|borrar|ninguna)$/i.test(t) ? '' : texto(t, 1000);
      await env.DB.prepare('UPDATE productos SET descripcion = ? WHERE id = ?').bind(d, e.id).run();
      return responderProducto(env, chat, e.id, d ? 'Listo, descripción cambiada.' : 'Listo, quité la descripción.');
    }
    case 'pmed': {
      const d = /^(-|quitar|borrar|ninguna)$/i.test(t) ? '' : texto(t, 60);
      await env.DB.prepare('UPDATE productos SET medidas = ? WHERE id = ?').bind(d, e.id).run();
      return responderProducto(env, chat, e.id);
    }
    case 'pdto': {
      const d = leerDescuento(t);
      if (!d) return reintentar('No te entendí. Escribe <code>10%</code>, <code>20000</code> (pesos) o <code>0</code> para quitarlo.');
      await env.DB.prepare('UPDATE productos SET descuento_tipo = ?, descuento_val = ? WHERE id = ?').bind(d.tipo, d.valor, e.id).run();
      return responderProducto(env, chat, e.id, d.tipo === 'ninguno' ? 'Listo, sin descuento.' : 'Listo, descuento aplicado.');
    }

    // --- menú
    case 'oro':
      return proponerOro(env, chat, e.tipo, t);
    case 'buscar':
      return listarProductos(env, chat, t);
    case 'codigo':
      return ejecutarComando(env, chat, 'codigo', t, t.split(/\s+/), origen);
    case 'cnota': {
      const nota = /^(-|quitar|borrar|ninguna)$/i.test(t) ? '' : texto(t, 300);
      const c = await env.DB.prepare('UPDATE codigos SET nota = ? WHERE id = ? RETURNING codigo, cliente').bind(nota, e.id).first();
      if (!c) return tg.sendMessage(env, chat, 'Ese código ya no existe.');
      return tg.sendMessage(env, chat, nota
        ? `Nota guardada en <code>${c.codigo}</code> (${h(c.cliente)}). Te la recuerdo cuando llegue su diseño.`
        : `Quité la nota de <code>${c.codigo}</code>.`);
    }
    case 'anuncio': {
      const a = /^(-|quitar|borrar|ninguno)$/i.test(t) ? '' : texto(t, 160);
      await fijarAjuste(env, 'anuncio', a);
      return tg.sendMessage(env, chat, a ? `Anuncio publicado: «${h(a)}»` : 'Listo, quité el anuncio de la web.');
    }
  }
  return tg.sendMessage(env, chat, 'No te entendí. Toca /menu.');
}

// ---------------------------------------------------------------- fotos → borrador de producto

async function manejarFoto(env, m, chat, origen) {
  const e = await leerEspera(env, chat);
  if (e && (e.accion === 'pfadd' || e.accion === 'pfrep')) return fotosAProducto(env, m, chat, e);

  const fileId = m.photo[m.photo.length - 1].file_id; // la de mayor resolución
  const grupo = m.media_group_id ? String(m.media_group_id) : `u${m.message_id}`;
  const ahora = ahoraIso();
  // Cada foto del álbum llega como un update aparte: se acumulan en la misma fila.
  const fila = await env.DB.prepare(
    `INSERT INTO borradores_bot (chat_id, grupo, fotos, texto, creado, actualizado) VALUES (?1, ?2, json_array(?3), ?4, ?5, ?5)
     ON CONFLICT(chat_id, grupo) DO UPDATE SET
       fotos = json_insert(borradores_bot.fotos, '$[#]', ?3),
       texto = CASE WHEN ?4 <> '' THEN ?4 ELSE borradores_bot.texto END,
       actualizado = ?5
     RETURNING id, json_array_length(fotos) AS n`
  ).bind(chat, grupo, fileId, texto(m.caption, 500), ahora).first();
  if (fila.n > 1) return; // solo la primera foto del álbum dispara el proceso

  if (m.media_group_id) await dormir(4000); // espera a que lleguen las demás fotos del álbum
  const b = await leerBorrador(env, fila.id, chat);
  const fotos = JSON.parse(b.fotos);
  await tg.sendMessage(env, chat, `Recibí ${fotos.length} foto${fotos.length > 1 ? 's' : ''}. Armando el borrador con tu texto…`);

  // Descargar a R2 (quedan en productos/ para no copiar al publicar)
  const claves = [];
  for (let i = 0; i < Math.min(fotos.length, 8); i++) {
    const bytes = await tg.descargarArchivo(env, fotos[i]);
    if (!bytes) continue;
    const clave = `productos/bot-${b.id}-${i + 1}-${crypto.randomUUID().slice(0, 6)}.jpg`;
    await guardar(env, clave, bytes, 'image/jpeg');
    claves.push(clave);
  }

  // Sin IA: todo sale del pie de foto (src/pie.js); lo que falte se completa con los botones.
  const cats = (await env.DB.prepare('SELECT slug, nombre FROM categorias ORDER BY orden').all()).results;
  const propuesta = leerPie(b.texto || '', cats);
  let aviso = b.texto ? '' : 'Sin texto en la foto: ponle nombre, peso y categoría con los botones.';
  if (!claves.length) aviso += '\n(No pude descargar las fotos de Telegram.)';

  b.propuesta = propuesta;
  b.claves = claves;
  await env.DB.prepare("UPDATE borradores_bot SET propuesta = ?, claves = ?, estado = 'listo', actualizado = ? WHERE id = ?")
    .bind(JSON.stringify(propuesta), JSON.stringify(claves), ahoraIso(), b.id).run();
  await mostrarBorrador(env, chat, b, false, aviso);
}

/**
 * Fotos para una joya ya publicada (botones «Agregar fotos» / «Reemplazar todas»).
 * Cada foto de un álbum llega en un update aparte: todas se guardan, y solo la primera del
 * álbum (la que gana el registro `bot_grupo:`) espera a las demás, reemplaza si toca y responde.
 */
async function fotosAProducto(env, m, chat, e) {
  const bytes = await tg.descargarArchivo(env, m.photo[m.photo.length - 1].file_id);
  if (!bytes) return tg.sendMessage(env, chat, 'No pude descargar esa foto de Telegram. Mándala otra vez.');
  const clave = `productos/bot-p${e.id}-${crypto.randomUUID().slice(0, 8)}.jpg`;
  await guardar(env, clave, bytes, 'image/jpeg');
  await env.DB.prepare(
    'INSERT INTO producto_imagenes (producto_id, clave, orden) VALUES (?1, ?2, (SELECT COALESCE(MAX(orden), -1) + 1 FROM producto_imagenes WHERE producto_id = ?1))'
  ).bind(e.id, clave).run();

  if (m.media_group_id) {
    const marca = `bot_grupo:${m.media_group_id}`;
    const primero = await env.DB.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO NOTHING RETURNING clave')
      .bind(marca, ahoraIso()).first();
    if (!primero) return;
    await dormir(4000);
    await env.DB.prepare('DELETE FROM ajustes WHERE clave = ?').bind(marca).run();
  }
  await borrarEspera(env, chat);
  let aviso = 'Listo, agregué las fotos.';
  if (e.accion === 'pfrep') {
    const viejas = (await env.DB.prepare('SELECT clave FROM producto_imagenes WHERE producto_id = ? AND id <= ?').bind(e.id, e.marca).all()).results.map((r) => r.clave);
    await env.DB.prepare('DELETE FROM producto_imagenes WHERE producto_id = ? AND id <= ?').bind(e.id, e.marca).run();
    await borrar(env, viejas).catch(() => {});
    aviso = `Listo, cambié las fotos (quité ${viejas.length}).`;
  }
  return responderProducto(env, chat, e.id, `${aviso} Ahora tiene ${await contarFotos(env, e.id)}.`);
}

async function leerBorrador(env, id, chat) {
  const b = await env.DB.prepare('SELECT * FROM borradores_bot WHERE id = ? AND chat_id = ?').bind(id, String(chat)).first();
  if (!b) return null;
  b.propuesta = JSON.parse(b.propuesta || '{}');
  b.claves = JSON.parse(b.claves || '[]');
  return b;
}

const guardarPropuesta = (env, b) =>
  env.DB.prepare('UPDATE borradores_bot SET propuesta = ?, actualizado = ? WHERE id = ?').bind(JSON.stringify(b.propuesta), ahoraIso(), b.id).run();

async function textoBorrador(env, b) {
  const p = b.propuesta;
  const precios = preciosGramo(await leerAjustes(env));
  const cat = p.categoria ? (await env.DB.prepare('SELECT nombre FROM categorias WHERE slug = ?').bind(p.categoria).first())?.nombre : null;
  const precio = p.peso_gramos ? calcularPrecio({ tipo_precio: 'gramo', tipo_oro: p.tipo_oro, peso_gramos: p.peso_gramos }, precios).final : null;
  return `<b>Borrador de joya</b> · ${b.claves.length} foto(s)\n\n` +
    `<b>${h(p.nombre)}</b>\n` +
    `Categoría: ${cat ? h(cat) : '<i>falta</i>'}\n` +
    `Oro: ${p.tipo_oro}\n` +
    `Peso: ${p.peso_gramos ? `${p.peso_gramos.toLocaleString('es-CO')} g` : '<i>falta</i>'}\n` +
    (p.medidas ? `Medidas: ${h(p.medidas)}\n` : '') +
    (precio ? `Precio con el gramo de hoy: <b>${dinero(precio)}</b>\n` : '') +
    (p.descripcion ? `\n${h(p.descripcion.slice(0, 900))}` : '');
}

const botonesBorrador = (id) => [
  [{ text: 'Publicar', callback_data: `b:pub:${id}` }],
  [{ text: 'Cambiar peso', callback_data: `b:peso:${id}` }, { text: 'Cambiar categoría', callback_data: `b:cat:${id}` }],
  [{ text: 'Cambiar nombre', callback_data: `b:nom:${id}` }, { text: 'Descartar', callback_data: `b:des:${id}` }],
];

async function mostrarBorrador(env, chat, b, editar, extra = '') {
  const txt = (await textoBorrador(env, b)) + (extra ? `\n<i>${h(extra.trim())}</i>` : '');
  if (editar && b.mensaje_id) {
    const r = await tg.editMessageText(env, chat, b.mensaje_id, txt, botonesBorrador(b.id));
    if (r.ok) return;
  }
  const r = await tg.sendMessage(env, chat, txt, botonesBorrador(b.id));
  if (r.ok) await env.DB.prepare('UPDATE borradores_bot SET mensaje_id = ? WHERE id = ?').bind(r.result.message_id, b.id).run();
}

async function publicarBorrador(env, b) {
  const p = b.propuesta;
  const cat = await env.DB.prepare('SELECT id FROM categorias WHERE slug = ?').bind(p.categoria).first();
  const sig = await env.DB.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(sku, 4) AS INTEGER)), 0) + 1 AS n FROM productos WHERE sku LIKE 'KP-%'").first();
  const sku = `KP-${String(sig.n).padStart(3, '0')}`;
  let slug = `${slugificar(p.nombre)}-${sig.n}`;
  if (await env.DB.prepare('SELECT 1 FROM productos WHERE slug = ?').bind(slug).first()) slug += '-' + crypto.randomUUID().slice(0, 4);
  const prod = await env.DB.prepare(
    `INSERT INTO productos (sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, medidas, activo, verificado, creado)
     VALUES (?, ?, ?, ?, ?, 'gramo', ?, ?, ?, 1, 1, ?) RETURNING id`
  ).bind(sku, p.nombre, slug, p.descripcion || '', cat?.id ?? null, p.tipo_oro, p.peso_gramos, p.medidas || '', ahoraIso()).first();
  await env.DB.batch([
    ...b.claves.map((c, i) => env.DB.prepare('INSERT INTO producto_imagenes (producto_id, clave, orden) VALUES (?, ?, ?)').bind(prod.id, c, i)),
    env.DB.prepare("UPDATE borradores_bot SET estado = 'publicado', producto_id = ?, actualizado = ? WHERE id = ?").bind(prod.id, ahoraIso(), b.id),
  ]);
  return { id: prod.id, sku, slug };
}

const filasCategorias = (cats, prefijo, volver) => {
  const filas = [];
  for (let i = 0; i < cats.length; i += 3) filas.push(cats.slice(i, i + 3).map((c) => ({ text: c.nombre, callback_data: `${prefijo}:${c.slug}` })));
  filas.push([{ text: 'Volver', callback_data: volver }]);
  return filas;
};

// ---------------------------------------------------------------- botones (callback_query)

async function manejarBoton(env, cq, origen) {
  const chat = String(cq.message?.chat?.id ?? cq.from?.id);
  const msgId = cq.message?.message_id;
  if (!tg.esAdmin(env, chat) && !tg.esAdmin(env, cq.from?.id)) return tg.answerCallbackQuery(env, cq.id);
  const [grupo, accion, idTxt, extra] = String(cq.data || '').split(':');
  const id = Number(idTxt);
  console.log(`[bot] ${chat} botón ${cq.data}`);
  let aviso = '';

  if (grupo === 'm') {
    await borrarEspera(env, chat);
    if (accion === 'menu') await tg.sendMessage(env, chat, TEXTO_MENU, MENU);
    else if (accion === 'oro') await tg.sendMessage(env, chat, await textoPrecios(env), botonesOro());
    else if (accion === 'subir') {
      await tg.sendMessage(env, chat, 'Mándame la foto de la joya (o varias como álbum) con un texto como:\n<code>Cadena lazo italiano 4,2 g 50 cm</code>\n\nDel texto saco el nombre, el peso, el oro (si no dices, nacional), la categoría y las medidas. Lo que falte lo completas con botones antes de publicar.');
    } else if (accion === 'buscar') await pedir(env, chat, 'buscar', 0, '¿Qué joya buscas? Escribe una palabra (<code>rolo</code>, <code>topos</code>) o el código (<code>KP-012</code>).');
    else if (accion === 'codigo') await pedir(env, chat, 'codigo', 0, '¿Para quién es el código? Escribe el nombre del cliente (y si quieres los días, p. ej. <code>Ana Pérez 30</code>; por defecto 15).');
    else if (accion === 'anuncio') {
      const actual = (await leerAjustes(env)).anuncio || '';
      await fijarEspera(env, chat, 'anuncio', 0);
      await tg.sendMessage(env, chat,
        (actual ? `Anuncio actual: «${h(actual)}»\n\n` : 'Ahora no hay anuncio.\n\n') + 'Escribe el anuncio nuevo para la franja de arriba de la web.\n<i>(o /cancelar)</i>',
        actual ? [[{ text: 'Quitar anuncio', callback_data: 'm:sinanuncio' }]] : undefined);
    } else if (accion === 'sinanuncio') {
      await fijarAjuste(env, 'anuncio', '');
      await tg.editMessageText(env, chat, msgId, 'Listo, quité el anuncio de la web.');
    } else if (accion === 'ayuda') await tg.sendMessage(env, chat, TEXTO_AYUDA, botonesAyuda());
    else if (['codigos', 'pedidos', 'disenos'].includes(accion)) await ejecutarComando(env, chat, accion, '', [], origen);
  } else if (grupo === 'd') {
    // Reenvía la vista y el STL de un diseño guardado (p. ej. uno que llegó antes de que el chat fuera admin).
    const d = await env.DB.prepare('SELECT * FROM disenos WHERE id = ?').bind(id).first();
    const leer = async (clave) => (clave ? (await env.ARCHIVOS.get(clave))?.arrayBuffer() : null);
    const [png, stl] = d ? await Promise.all([leer(d.clave_png), leer(d.clave_stl)]) : [];
    if (!d || !stl) aviso = 'No encontré el archivo de ese diseño.';
    else {
      const pie = `<b>${d.folio}</b> · ${h(d.cliente)} (${h(d.codigo || '')})\n${h(describirGuardado(d))}\nPrecio estimado: <b>${dinero(d.precio_estimado)}</b>` +
        (d.nota ? `\nNota del cliente: ${h(d.nota)}` : '');
      if (png) await tg.sendPhoto(env, chat, new Uint8Array(png), pie, null, `${d.folio}.png`);
      await tg.sendDocument(env, chat, new Uint8Array(stl), `${d.folio}.stl`, 'model/stl', png ? '' : pie);
      aviso = 'Enviado.';
    }
  } else if (grupo === 'a') {
    const tema = AYUDA_TEMAS[accion];
    if (tema) await tg.sendMessage(env, chat, tema[1], [[{ text: 'Otros temas', callback_data: 'a:_' }, { text: 'Menú', callback_data: 'm:menu' }]]);
    else await tg.sendMessage(env, chat, TEXTO_AYUDA, botonesAyuda());
  } else if (grupo === 'o') {
    if (accion === 'pide') {
      await pedir(env, chat, 'oro', 0, `¿Nuevo precio del gramo <b>${idTxt}</b>? En pesos, p. ej. <code>455000</code>`, { tipo: idTxt });
    } else if (accion === 'ok' && ['nacional', 'italiano'].includes(idTxt)) {
      const valor = Number(extra);
      await actualizarPrecioGramo(env, idTxt, valor);
      await tg.editMessageText(env, chat, msgId, `Listo. Oro ${idTxt}: <b>${dinero(valor)}</b> por gramo. La web ya muestra los precios nuevos.\n\n${await textoPrecios(env)}`);
      aviso = 'Precio cambiado.';
    } else if (accion === 'no') {
      await tg.editMessageText(env, chat, msgId, 'No cambié nada.');
    }
  } else if (grupo === 'c') {
    if (accion === 'nota') {
      const c = await env.DB.prepare('SELECT codigo, cliente, nota FROM codigos WHERE id = ?').bind(id).first();
      if (c) await pedir(env, chat, 'cnota', id,
        `Nota para <code>${c.codigo}</code> (${h(c.cliente)}): qué quiere, presupuesto, lo que hablaron.` + (c.nota ? `\nAhora: «${h(c.nota)}»` : ''));
    }
  } else if (grupo === 'b') {
    const b = await leerBorrador(env, id, chat);
    if (!b || ['publicado', 'descartado'].includes(b.estado)) {
      await tg.answerCallbackQuery(env, cq.id, 'Ese borrador ya no está activo.');
      return;
    }
    b.mensaje_id = msgId || b.mensaje_id;
    if (accion === 'pub') {
      if (!b.propuesta.peso_gramos) aviso = 'Falta el peso: toca «Cambiar peso».';
      else if (!b.propuesta.categoria) aviso = 'Falta la categoría.';
      else {
        const r = await publicarBorrador(env, b);
        const enlace = `${(env.SITIO_URL || '').replace(/\/$/, '')}/joya/?p=${r.slug}`;
        await tg.editMessageText(env, chat, msgId, `<b>Publicada</b> como ${r.sku}: ${h(b.propuesta.nombre)}\n${enlace}`, botonesProducto({ id: r.id, activo: 1, destacado: 0 }));
        aviso = 'Publicada.';
      }
    } else if (accion === 'peso') {
      await fijarEspera(env, chat, 'bpeso', b.id);
      await tg.sendMessage(env, chat, '¿Cuánto pesa? Escríbeme los gramos, p. ej. <code>3,2</code>');
    } else if (accion === 'nom') {
      await fijarEspera(env, chat, 'bnombre', b.id);
      await tg.sendMessage(env, chat, `¿Cómo se llama la joya? Ahora: «${h(b.propuesta.nombre)}». Escríbeme el nombre nuevo.`);
    } else if (accion === 'cat') {
      const cats = (await env.DB.prepare('SELECT slug, nombre FROM categorias ORDER BY orden').all()).results;
      await tg.editMessageReplyMarkup(env, chat, msgId, filasCategorias(cats, `b:cs:${b.id}`, `b:ver:${b.id}`));
    } else if (accion === 'cs') {
      b.propuesta.categoria = extra;
      await guardarPropuesta(env, b);
      await mostrarBorrador(env, chat, b, true);
    } else if (accion === 'ver') {
      await mostrarBorrador(env, chat, b, true);
    } else if (accion === 'des') {
      await borrar(env, b.claves).catch(() => {});
      await env.DB.prepare("UPDATE borradores_bot SET estado = 'descartado', actualizado = ? WHERE id = ?").bind(ahoraIso(), b.id).run();
      await tg.editMessageText(env, chat, msgId, `Descarté el borrador «${h(b.propuesta.nombre)}».`);
    }
  } else if (grupo === 'p') {
    const p = await leerProducto(env, id);
    if (!p) { await tg.answerCallbackQuery(env, cq.id, 'Esa joya ya no existe.'); return; }
    const refrescar = async (botones) => {
      const q = await leerProducto(env, id);
      await tg.editMessageText(env, chat, msgId, await tarjetaProducto(env, q), botones ? botones(q) : botonesProducto(q));
    };
    const modoEditar = async () => { const n = await contarFotos(env, id); await refrescar((q) => botonesEditar(q, n)); };
    const ref = h(p.sku || p.nombre);

    if (accion === 'vis') {
      await env.DB.prepare('UPDATE productos SET activo = 1 - activo WHERE id = ?').bind(id).run();
      await refrescar();
      aviso = p.activo ? 'Oculta.' : 'Visible.';
    } else if (accion === 'dest') {
      await env.DB.prepare('UPDATE productos SET destacado = 1 - destacado WHERE id = ?').bind(id).run();
      await refrescar();
    } else if (accion === 'peso' || accion === 'prec') {
      await pedir(env, chat, accion === 'peso' ? 'peso' : 'precio', id, accion === 'peso'
        ? `Peso nuevo para ${ref} en gramos (p. ej. <code>3,4</code>):`
        : `Precio por pieza para ${ref} en pesos (p. ej. <code>250000</code>). Ojo: deja de seguir el precio del oro.`);
    } else if (accion === 'edit') {
      await modoEditar();
    } else if (accion === 'nom') {
      await pedir(env, chat, 'pnom', id, `Nombre nuevo para ${ref}. Ahora: «${h(p.nombre)}»`);
    } else if (accion === 'desc') {
      await pedir(env, chat, 'pdesc', id, `Descripción para ${ref} (lo que se lee en la página de la joya). Escribe <code>-</code> para dejarla vacía.` +
        (p.descripcion ? `\nAhora: «${h(String(p.descripcion).slice(0, 300))}»` : ''));
    } else if (accion === 'med') {
      await pedir(env, chat, 'pmed', id, `Medidas de ${ref}, p. ej. <code>50 cm</code> o <code>12 mm</code>. Escribe <code>-</code> para quitarlas.` +
        (p.medidas ? `\nAhora: «${h(p.medidas)}»` : ''));
    } else if (accion === 'dto') {
      await pedir(env, chat, 'pdto', id, `Descuento para ${ref}: <code>10%</code>, un valor en pesos como <code>20000</code>, o <code>0</code> para quitarlo.`);
    } else if (accion === 'oro') {
      await env.DB.prepare("UPDATE productos SET tipo_oro = CASE tipo_oro WHEN 'italiano' THEN 'nacional' ELSE 'italiano' END WHERE id = ?").bind(id).run();
      await modoEditar();
      aviso = `Ahora es oro ${p.tipo_oro === 'italiano' ? 'nacional' : 'italiano'}.`;
    } else if (accion === 'cat') {
      const cats = (await env.DB.prepare('SELECT slug, nombre FROM categorias ORDER BY orden').all()).results;
      await tg.editMessageReplyMarkup(env, chat, msgId, filasCategorias(cats, `p:cs:${id}`, `p:edit:${id}`));
    } else if (accion === 'cs') {
      await env.DB.prepare('UPDATE productos SET categoria_id = (SELECT id FROM categorias WHERE slug = ?) WHERE id = ?').bind(extra, id).run();
      await modoEditar();
      aviso = 'Categoría cambiada.';
    } else if (accion === 'fotos') {
      const imgs = (await env.DB.prepare('SELECT id, clave FROM producto_imagenes WHERE producto_id = ? ORDER BY orden, id').bind(id).all()).results;
      if (imgs.length) {
        await tg.sendMediaGroup(env, chat, imgs.slice(0, 10).map((f, i) => ({ type: 'photo', media: `${origen}/img/${f.clave}`, caption: `Foto ${i + 1}${i === 0 ? ' (portada)' : ''}` })));
      }
      await tg.sendMessage(env, chat, `${ref} tiene ${imgs.length} foto${imgs.length === 1 ? '' : 's'}. La primera es la portada.`, [
        [{ text: 'Agregar fotos', callback_data: `p:fadd:${id}` }, { text: 'Reemplazar todas', callback_data: `p:frep:${id}` }],
        ...(imgs.length > 1 ? [[{ text: 'Quitar una', callback_data: `p:fqui:${id}` }]] : []),
      ]);
    } else if (accion === 'fadd') {
      await pedir(env, chat, 'pfadd', id, `Mándame las fotos nuevas de ${ref} (una o un álbum). Se agregan después de las que ya tiene.`);
    } else if (accion === 'frep') {
      const marca = (await env.DB.prepare('SELECT COALESCE(MAX(id), 0) m FROM producto_imagenes WHERE producto_id = ?').bind(id).first()).m;
      await pedir(env, chat, 'pfrep', id, `Mándame las fotos nuevas de ${ref} (una o un álbum). Cuando lleguen, borro las anteriores; la primera que mandes queda de portada.`, { marca });
    } else if (accion === 'fqui') {
      const imgs = (await env.DB.prepare('SELECT id FROM producto_imagenes WHERE producto_id = ? ORDER BY orden, id').bind(id).all()).results;
      const filas = [];
      for (let i = 0; i < imgs.length; i += 4) filas.push(imgs.slice(i, i + 4).map((f, j) => ({ text: `Foto ${i + j + 1}`, callback_data: `p:fq:${id}:${f.id}` })));
      await tg.editMessageText(env, chat, msgId, `¿Cuál foto de ${ref} quito? (los números son los de las fotos que te mandé)`, filas);
    } else if (accion === 'fq') {
      const n = await contarFotos(env, id);
      if (n <= 1) aviso = 'Tiene que quedar al menos una foto.';
      else {
        const f = await env.DB.prepare('DELETE FROM producto_imagenes WHERE id = ? AND producto_id = ? RETURNING clave').bind(Number(extra), id).first();
        if (f) await borrar(env, [f.clave]).catch(() => {});
        await tg.editMessageText(env, chat, msgId, f ? `Quité la foto. ${ref} tiene ${n - 1}.` : 'Esa foto ya no estaba.');
        aviso = 'Foto quitada.';
      }
    } else if (accion === 'bor') {
      await tg.editMessageReplyMarkup(env, chat, msgId, [[{ text: 'Sí, borrar', callback_data: `p:borok:${id}` }, { text: 'Cancelar', callback_data: `p:cancel:${id}` }]]);
    } else if (accion === 'cancel') {
      await refrescar();
    } else if (accion === 'borok') {
      const imgs = (await env.DB.prepare('SELECT clave FROM producto_imagenes WHERE producto_id = ?').bind(id).all()).results.map((r) => r.clave);
      await env.DB.batch([
        env.DB.prepare('DELETE FROM producto_imagenes WHERE producto_id = ?').bind(id),
        env.DB.prepare('DELETE FROM productos WHERE id = ?').bind(id),
      ]);
      await borrar(env, imgs).catch(() => {});
      await tg.editMessageText(env, chat, msgId, `Borré ${h(p.sku || '')} ${h(p.nombre)}.`);
      aviso = 'Borrada.';
    }
  }
  await tg.answerCallbackQuery(env, cq.id, aviso);
  if (aviso && aviso.startsWith('Falta')) await tg.sendMessage(env, chat, aviso);
}
