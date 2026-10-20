// POST /api/pedidos — recalcula en el servidor, guarda y arma el mensaje de WhatsApp para Carlos.
import { json, leerJson, texto, ErrorHttp, ahoraIso, folio, dinero, waNormalizar, waLink, escaparHtml, numeroAjuste } from './util.js';
import { leerAjustes, preciosGramo, calcularPrecio } from './precios.js';
import { exigirLimite } from './codigos.js';
import { avisarAdmins, sendMessage, telegramActivo, admins } from './telegram.js';

export async function postPedido(request, env, ctx) {
  await exigirLimite(request, env, 'pedidos', 20, 3600);
  const d = await leerJson(request, 32 * 1024);
  const c = d.cliente || {};
  const nombre = texto(c.nombre, 120);
  const whatsapp = waNormalizar(c.whatsapp);
  const ciudad = texto(c.ciudad, 80);
  const direccion = texto(c.direccion, 200);
  const nota = texto(d.nota, 600);
  if (nombre.length < 2) throw new ErrorHttp(400, 'Escribe tu nombre.');
  if (whatsapp.length < 10 || whatsapp.length > 15) throw new ErrorHttp(400, 'Revisa tu número de WhatsApp.');
  if (!ciudad) throw new ErrorHttp(400, 'Escribe tu ciudad.');

  // Agrupa por slug y valida cantidades
  if (!Array.isArray(d.items) || !d.items.length) throw new ErrorHttp(400, 'El carrito está vacío.');
  const cantidades = new Map();
  for (const it of d.items.slice(0, 50)) {
    const slug = texto(it?.slug, 180);
    const n = Math.floor(Number(it?.cantidad) || 0);
    if (!slug || n < 1) continue;
    cantidades.set(slug, Math.min(20, (cantidades.get(slug) || 0) + n));
  }
  if (!cantidades.size) throw new ErrorHttp(400, 'El carrito está vacío.');

  const slugs = [...cantidades.keys()];
  const { results } = await env.DB.prepare(
    `SELECT * FROM productos WHERE activo = 1 AND slug IN (${slugs.map(() => '?').join(',')})`
  ).bind(...slugs).all();
  const porSlug = Object.fromEntries(results.map((p) => [p.slug, p]));
  const faltan = slugs.filter((s) => !porSlug[s]);
  if (faltan.length === slugs.length) throw new ErrorHttp(409, 'Las joyas del carrito ya no están disponibles.');

  const ajustes = await leerAjustes(env);
  const precios = preciosGramo(ajustes);
  const items = slugs.filter((s) => porSlug[s]).map((s) => {
    const p = porSlug[s];
    const { final } = calcularPrecio(p, precios);
    const cantidad = cantidades.get(s);
    const detalle = p.tipo_precio === 'gramo'
      ? `${Number(p.peso_gramos).toLocaleString('es-CO')} g · oro ${p.tipo_oro}`
      : `precio por joya · oro ${p.tipo_oro}`;
    return { producto_id: p.id, slug: s, sku: p.sku, nombre: p.nombre, detalle, precio_unit: final, cantidad, subtotal: final * cantidad };
  });

  // Envío: igual que carrito_total() del PHP
  const subtotal = items.reduce((a, i) => a + i.subtotal, 0);
  const gratis = numeroAjuste(ajustes.envio_gratis_desde);
  const envio = subtotal > 0 && gratis > 0 && subtotal >= gratis ? 0 : numeroAjuste(ajustes.envio_valor);
  const total = subtotal + envio;

  const fila = await env.DB.prepare(
    `INSERT INTO pedidos (cliente_nombre, cliente_whatsapp, ciudad, direccion, subtotal, envio, total, nota, creado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(nombre, whatsapp, ciudad, direccion, subtotal, envio, total, nota, ahoraIso()).first();
  const fol = folio('P', fila.id);
  await env.DB.batch([
    env.DB.prepare('UPDATE pedidos SET folio = ? WHERE id = ?').bind(fol, fila.id),
    ...items.map((i) => env.DB.prepare(
      'INSERT INTO pedido_items (pedido_id, producto_id, slug, nombre, detalle, precio_unit, cantidad, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(fila.id, i.producto_id, i.slug, i.nombre, i.detalle, i.precio_unit, i.cantidad, i.subtotal)),
  ]);

  // Mensaje que el cliente le manda a Carlos
  const lineas = items.map((i) => `• ${i.cantidad} × ${i.nombre}${i.sku ? ` (${i.sku})` : ''} — ${dinero(i.subtotal)}`);
  const wa_texto = [
    `Hola Carlos, soy ${nombre}. Quiero hacer el pedido ${fol}:`,
    '',
    ...lineas,
    '',
    `Subtotal: ${dinero(subtotal)}`,
    `Envío: ${envio ? dinero(envio) : 'gratis'}`,
    `Total: ${dinero(total)}`,
    '',
    `Ciudad: ${ciudad}${direccion ? ` · ${direccion}` : ''}`,
    ...(nota ? [`Nota: ${nota}`] : []),
  ].join('\n');
  const numeroTienda = ajustes.whatsapp || '573178861724';

  let aviso;
  if (!telegramActivo(env) || !admins(env).length) {
    aviso = 'Pedido guardado. Telegram no está configurado: Carlos no recibió el aviso automático.';
  } else {
    const msg =
      `<b>Pedido nuevo ${fol}</b> — ${dinero(total)}\n` +
      `${escaparHtml(nombre)} · ${escaparHtml(ciudad)}${direccion ? ' · ' + escaparHtml(direccion) : ''}\n\n` +
      escaparHtml(lineas.join('\n')) +
      `\n\nEnvío: ${envio ? dinero(envio) : 'gratis'}` + (nota ? `\nNota: ${escaparHtml(nota)}` : '');
    ctx.waitUntil(avisarAdmins(env, async (chat) =>
      (await sendMessage(env, chat, msg, [[{ text: 'Escribirle por WhatsApp', url: waLink(whatsapp, `Hola ${nombre}, te escribo de 18gold KPrada por tu pedido ${fol}.`) }]])).ok));
  }

  return json({
    ok: true, folio: fol, subtotal, envio, total,
    items: items.map(({ slug, nombre: n, precio_unit, cantidad, subtotal: s }) => ({ slug, nombre: n, precio_unit, cantidad, subtotal: s })),
    no_disponibles: faltan,
    wa_texto,
    wa_url: waLink(numeroTienda, wa_texto),
    ...(aviso ? { aviso } : {}),
  });
}
