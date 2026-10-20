// Bot de Telegram de Carlos: administra precios, productos, códigos, diseños y pedidos.
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
  ['ayuda', 'Qué sé hacer'],
];

const AYUDA = `<b>Hola, Carlos.</b> Esto es lo que sé hacer:

<b>Precios</b>
/oro — ver precios del gramo
/oro nacional 352000 · /oro italiano 410000
/hechura 60000 — hechura por gramo de los diseños
/tejido 25000 — mano de obra del tejido en nylon de los diseños

<b>Joyas</b>
Mándame una foto (o un álbum) de una joya con un texto, p. ej. «Cadena lazo italiano 4,2 g», y te armo el borrador: el nombre, el peso, el oro (si no dices, nacional) y la categoría salen de tu texto. Lo que falte lo completas con los botones.
/productos [texto] — buscar y editar
/peso KP-012 3.4 · /precio KP-012 250000
/ocultar KP-012 · /mostrar KP-012

<b>Clientes</b>
/codigo Ana Pérez [días] — código para diseñar
/codigos — vigentes · /anular KP-XXXXX
/disenos — últimos diseños · /pedidos — últimos pedidos

<b>Web</b>
/anuncio Envíos gratis este fin de semana (vacío = quitar)`;

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
    case 'ayuda':
    case 'help':
      return responder(AYUDA);

    case 'oro': {
      if (!partes.length) return responder(await textoPrecios(env));
      const tipo = (partes[0] || '').toLowerCase();
      const valor = numeroPrecio(partes[1]);
      if (!['nacional', 'italiano'].includes(tipo) || !valor) return responder('Así: <code>/oro nacional 352000</code> o <code>/oro italiano 410000</code>');
      if (valor < 50000 || valor > 5000000) return responder(`¿Seguro? ${dinero(valor)} por gramo se sale de lo normal. Revísalo y vuelve a intentar.`);
      await actualizarPrecioGramo(env, tipo, valor);
      return responder(`Listo. Oro ${tipo}: <b>${dinero(valor)}</b> por gramo. La web ya muestra los precios nuevos.\n\n${await textoPrecios(env)}`);
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
      return responder(await aplicarValor(env, cmd, p.id, valorTxt));
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
        [[{ text: 'Compartir por WhatsApp', url: 'https://wa.me/?text=' + encodeURIComponent(mensaje) }]]
      );
    }

    case 'codigos': {
      const { results } = await env.DB.prepare(
        'SELECT * FROM codigos WHERE anulado = 0 AND expira > ? ORDER BY creado DESC LIMIT 30'
      ).bind(ahoraIso()).all();
      if (!results.length) return responder('No hay códigos vigentes. Crea uno con /codigo Nombre');
      return responder('<b>Códigos vigentes</b>\n\n' + results.map((c) =>
        `<code>${c.codigo}</code> ${h(c.cliente)} — ${c.usados}/${c.max_disenos} diseños · vence ${fechaCorta(c.expira)}`).join('\n'));
    }

    case 'anular': {
      const codigo = normalizarCodigo(args);
      const r = await env.DB.prepare('UPDATE codigos SET anulado = 1 WHERE codigo = ? AND anulado = 0 RETURNING cliente').bind(codigo).first();
      return responder(r ? `Anulé <code>${codigo}</code> de ${h(r.cliente)}.` : `No encontré un código vigente ${h(codigo || '(vacío)')}.`);
    }

    case 'disenos': {
      const { results } = await env.DB.prepare('SELECT * FROM disenos WHERE folio IS NOT NULL ORDER BY id DESC LIMIT 8').all();
      if (!results.length) return responder('Todavía no han llegado diseños.');
      return responder('<b>Últimos diseños</b>\n\n' + results.map((d) =>
        `<b>${d.folio}</b> · ${h(d.cliente)} · ${h(describirGuardado(d))} · ${Number(d.peso_estimado).toLocaleString('es-CO')} g · ${dinero(d.precio_estimado)}\n` +
        `${fechaCorta(d.creado)}${d.clave_png ? ` · <a href="${origen}/img/${d.clave_png}">vista</a>` : ''}`).join('\n\n'));
    }

    case 'pedidos': {
      const { results } = await env.DB.prepare('SELECT * FROM pedidos WHERE folio IS NOT NULL ORDER BY id DESC LIMIT 8').all();
      if (!results.length) return responder('Todavía no hay pedidos.');
      return responder('<b>Últimos pedidos</b>\n\n' + results.map((p) =>
        `<b>${p.folio}</b> · ${dinero(p.total)} · ${h(p.cliente_nombre)} (${h(p.ciudad)})\n${fechaCorta(p.creado)} · <a href="${waLink(p.cliente_whatsapp)}">WhatsApp</a>`).join('\n\n'));
    }

    default:
      return responder('No conozco ese comando. Mira /ayuda');
  }
}

async function textoPrecios(env) {
  const a = await leerAjustes(env);
  const p = preciosGramo(a);
  const r = await env.DB.prepare("SELECT MAX(creado) f FROM precios_historial WHERE tipo IN ('nacional','italiano')").first();
  return `<b>Precio del gramo</b>\nNacional: ${dinero(p.nacional)}\nItaliano: ${dinero(p.italiano)}\nHechura diseños: ${dinero(hechuraGramo(a))}/g\nTejido en nylon: ${dinero(tejidoValor(a))}` +
    (r?.f ? `\n\nÚltimo cambio: ${fechaCorta(r.f)}` : '');
}

// "360.000" / "$360000" → 360000
const numeroPrecio = (s) => { const n = Number(String(s || '').replace(/[^\d]/g, '')); return n > 0 ? n : 0; };
// "3,2" / "3.2g" → 3.2
const numeroGramos = (s) => gramos(String(s || '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;

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
  const p = await env.DB.prepare(`${SELECT_PRODUCTO} WHERE p.id = ?`).bind(id).first();
  return 'Listo.\n' + await tarjetaProducto(env, p);
}

// ---------------------------------------------------------------- productos

async function tarjetaProducto(env, p, precios) {
  precios ||= preciosGramo(await leerAjustes(env));
  const { final, base, ahorro } = calcularPrecio(p, precios);
  const cobro = p.tipo_precio === 'pieza' ? 'precio por pieza' : `${Number(p.peso_gramos).toLocaleString('es-CO')} g`;
  return `<b>${h(p.sku || '#' + p.id)}</b> ${h(p.nombre)}\n` +
    `${h(p.categoria_nombre || 'sin categoría')} · oro ${p.tipo_oro} · ${cobro}\n` +
    `<b>${dinero(final)}</b>${ahorro ? ` (antes ${dinero(base)})` : ''}\n` +
    `${p.activo ? 'Visible' : 'Oculta'}${p.destacado ? ' · Destacada' : ''}`;
}

const botonesProducto = (p) => [
  [{ text: p.activo ? 'Ocultar' : 'Mostrar', callback_data: `p:vis:${p.id}` }, { text: p.destacado ? 'Quitar destacado' : 'Destacar', callback_data: `p:dest:${p.id}` }],
  [{ text: 'Peso', callback_data: `p:peso:${p.id}` }, { text: 'Precio', callback_data: `p:prec:${p.id}` }, { text: 'Borrar', callback_data: `p:bor:${p.id}` }],
];

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

// ---------------------------------------------------------------- "esperando respuesta" (peso/precio)

const claveEspera = (chat) => `bot_espera:${chat}`;
async function fijarEspera(env, chat, accion, id) { await fijarAjuste(env, claveEspera(chat), JSON.stringify({ accion, id, t: Date.now() })); }
async function borrarEspera(env, chat) { await env.DB.prepare('DELETE FROM ajustes WHERE clave = ?').bind(claveEspera(chat)).run(); }
async function leerEspera(env, chat) {
  const r = await env.DB.prepare('SELECT valor FROM ajustes WHERE clave = ?').bind(claveEspera(chat)).first();
  if (!r) return null;
  const e = JSON.parse(r.valor);
  return Date.now() - e.t < 30 * 60000 ? e : null; // vence en 30 min
}

async function manejarRespuesta(env, chat, t, origen) {
  const e = await leerEspera(env, chat);
  if (!e) return tg.sendMessage(env, chat, 'No te entendí. Mira /ayuda o mándame una foto de una joya.');
  await borrarEspera(env, chat);
  if (e.accion === 'bpeso') {
    const g = numeroGramos(t);
    if (!g || g > 500) { await fijarEspera(env, chat, e.accion, e.id); return tg.sendMessage(env, chat, 'Escríbeme solo el peso en gramos, p. ej. <code>3,2</code>'); }
    const b = await leerBorrador(env, e.id, chat);
    if (!b) return;
    b.propuesta.peso_gramos = g;
    await guardarPropuesta(env, b);
    return mostrarBorrador(env, chat, b, true);
  }
  if (e.accion === 'bnombre') {
    const nombre = texto(t, 80);
    if (nombre.length < 2) { await fijarEspera(env, chat, e.accion, e.id); return tg.sendMessage(env, chat, 'Escríbeme el nombre de la joya, p. ej. <code>Cadena lazo 50 cm</code>'); }
    const b = await leerBorrador(env, e.id, chat);
    if (!b) return;
    b.propuesta.nombre = nombre;
    await guardarPropuesta(env, b);
    return mostrarBorrador(env, chat, b, true);
  }
  return tg.sendMessage(env, chat, await aplicarValor(env, e.accion === 'precio' ? 'precio' : 'peso', e.id, t));
}

// ---------------------------------------------------------------- fotos → borrador de producto

async function manejarFoto(env, m, chat, origen) {
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

// ---------------------------------------------------------------- botones (callback_query)

async function manejarBoton(env, cq, origen) {
  const chat = String(cq.message?.chat?.id ?? cq.from?.id);
  const msgId = cq.message?.message_id;
  if (!tg.esAdmin(env, chat) && !tg.esAdmin(env, cq.from?.id)) return tg.answerCallbackQuery(env, cq.id);
  const [grupo, accion, idTxt, extra] = String(cq.data || '').split(':');
  const id = Number(idTxt);
  console.log(`[bot] ${chat} botón ${cq.data}`);
  let aviso = '';

  if (grupo === 'b') {
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
      const filas = [];
      for (let i = 0; i < cats.length; i += 3) filas.push(cats.slice(i, i + 3).map((c) => ({ text: c.nombre, callback_data: `b:cs:${b.id}:${c.slug}` })));
      filas.push([{ text: 'Volver', callback_data: `b:ver:${b.id}` }]);
      await tg.editMessageReplyMarkup(env, chat, msgId, filas);
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
    const p = await env.DB.prepare(`${SELECT_PRODUCTO} WHERE p.id = ?`).bind(id).first();
    if (!p) { await tg.answerCallbackQuery(env, cq.id, 'Esa joya ya no existe.'); return; }
    const refrescar = async () => {
      const q = await env.DB.prepare(`${SELECT_PRODUCTO} WHERE p.id = ?`).bind(id).first();
      await tg.editMessageText(env, chat, msgId, await tarjetaProducto(env, q), botonesProducto(q));
    };
    if (accion === 'vis') {
      await env.DB.prepare('UPDATE productos SET activo = 1 - activo WHERE id = ?').bind(id).run();
      await refrescar();
      aviso = p.activo ? 'Oculta.' : 'Visible.';
    } else if (accion === 'dest') {
      await env.DB.prepare('UPDATE productos SET destacado = 1 - destacado WHERE id = ?').bind(id).run();
      await refrescar();
    } else if (accion === 'peso' || accion === 'prec') {
      await fijarEspera(env, chat, accion === 'peso' ? 'peso' : 'precio', id);
      await tg.sendMessage(env, chat, accion === 'peso'
        ? `Peso nuevo para ${h(p.sku || p.nombre)} en gramos (p. ej. <code>3,4</code>):`
        : `Precio por pieza para ${h(p.sku || p.nombre)} en pesos (p. ej. <code>250000</code>):`);
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
  if (aviso && grupo === 'b' && aviso.startsWith('Falta')) await tg.sendMessage(env, chat, aviso);
}
