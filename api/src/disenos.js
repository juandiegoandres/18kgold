// POST /api/disenos — recibe un diseño del cliente, lo guarda en R2/D1 y avisa a Carlos.
import { json, leerJson, texto, ErrorHttp, ahoraIso, folio, base64ABytes, dinero, escaparHtml } from './util.js';
import { consumirCupo, devolverCupo, exigirLimite } from './codigos.js';
import { TIPOS, normalizarParametros, normalizarMontaje, describirMontaje, describirDiseno, valorLegible } from './esquema-disenador.js';
import { leerAjustes, cotizarDiseno, DENSIDAD_ORO_18K } from './precios.js';
import { guardar, borrar } from './r2.js';
import { avisarAdmins, cargarAdmins, sendPhoto, sendDocument, sendMessage, telegramActivo, admins } from './telegram.js';

const MAX_STL = 25 * 1024 * 1024; // 25 MB (medallas en relieve de 22–25 mm pasan de 10 MB)
const MAX_PNG = 3 * 1024 * 1024;  // 3 MB
const MAX_CUERPO = Math.ceil((MAX_STL + MAX_PNG) * 1.37) + 64 * 1024; // base64 + JSON

/** Comprobación ligera de que el binario parece un STL. */
function pareceStl(b) {
  if (b.length < 84) return false;
  const ascii = new TextDecoder().decode(b.subarray(0, 5)).toLowerCase() === 'solid';
  const n = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(80, true);
  return b.length === 84 + n * 50 || ascii;
}

const sufijoAleatorio = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
const gramosTxt = (g, dec = 2) => Number(g).toLocaleString('es-CO', { maximumFractionDigits: dec });

const pareceePng = (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

export function resumenParametros(tipo, p) {
  const nombres = {
    texto: 'Texto', letra: 'Letra', figura: 'Figura', motivo: 'Motivo', estilo: 'Estilo', fuente: 'Fuente',
    alto: 'Alto (mm)', ancho: 'Ancho (mm)', diametro: 'Diámetro (mm)', brazo: 'Brazo (mm)', grosor: 'Grosor (mm)',
    base: 'Base', adorno: 'Adorno', puntos: 'Puntos de la i/j', marco: 'Marco', forma: 'Forma', borde: 'Borde',
    reverso: 'Reverso', calado: 'Calado', punto_luz: 'Punto de luz', cristo: 'Cristo en relieve', argolla: 'Argolla',
    grabado_frente: 'Grabado frente', grabado_reverso: 'Grabado reverso', grabado_interior: 'Grabado interior',
    grabado_fuente: 'Letra del grabado', talla: 'Talla', perfil: 'Perfil', acabado: 'Acabado',
  };
  const hayGrabado = p.grabado_frente || p.grabado_reverso || p.grabado_interior;
  return Object.entries(p)
    .filter(([k, v]) => nombres[k] && v !== '' && v !== null && v !== undefined)
    .filter(([k]) => k !== 'grabado_fuente' || hayGrabado) // la letra del grabado solo importa si hay grabado
    .map(([k, v]) => `${nombres[k]}: ${typeof v === 'number' ? String(v).replace('.', ',') : valorLegible(v)}`)
    .join('\n');
}

export async function postDiseno(request, env, ctx) {
  await exigirLimite(request, env, 'disenos', 15, 3600);
  const d = await leerJson(request, MAX_CUERPO);

  const tipo = String(d.tipo || '');
  if (!TIPOS.includes(tipo)) throw new ErrorHttp(400, 'Tipo de diseño no válido.');
  const parametros = normalizarParametros(tipo, { ...(d.parametros || {}), tipo_oro: d.tipo_oro ?? d.parametros?.tipo_oro });
  const tipoOro = parametros.tipo_oro;
  // montaje: en la raíz (contrato §2) o, por tolerancia, dentro de parametros
  const montaje = normalizarMontaje(d.montaje ?? d.parametros?.montaje);

  const peso = Number(d.peso_estimado);
  if (!Number.isFinite(peso) || peso <= 0 || peso > 200) throw new ErrorHttp(400, 'El peso estimado no es válido.');

  if (typeof d.stl_base64 !== 'string' || !d.stl_base64) throw new ErrorHttp(400, 'Falta el archivo STL del diseño.');
  if (d.stl_base64.length > MAX_STL * 1.37) throw new ErrorHttp(413, 'El STL supera 15 MB.');
  let stl, png = null;
  try { stl = base64ABytes(d.stl_base64); } catch { throw new ErrorHttp(400, 'El STL no viene en base64 válido.'); }
  if (stl.length > MAX_STL) throw new ErrorHttp(413, 'El STL supera 15 MB.');
  if (!pareceStl(stl)) throw new ErrorHttp(400, 'El archivo no parece un STL válido.');

  if (d.vista_png) {
    if (typeof d.vista_png !== 'string' || !/^data:image\/png;base64,/.test(d.vista_png)) throw new ErrorHttp(400, 'La vista debe ser un PNG (dataURL).');
    try { png = base64ABytes(d.vista_png); } catch { throw new ErrorHttp(400, 'La vista PNG no es válida.'); }
    if (png.length > MAX_PNG || !pareceePng(png)) throw new ErrorHttp(400, 'La vista PNG no es válida o pesa más de 3 MB.');
  }

  // Cupo atómico (valida vigencia). Si algo falla después, se devuelve.
  const cod = await consumirCupo(env, d.codigo);
  const ajustes = await leerAjustes(env);
  const cot = cotizarDiseno(peso, tipoOro, ajustes, montaje);
  const pesoR = cot.peso_pieza;
  const precio = cot.precio;
  const nota = texto(d.nota, 600);

  let id, fol, claveStl, clavePng = '';
  try {
    const fila = await env.DB.prepare(
      `INSERT INTO disenos (codigo_id, codigo, cliente, tipo, parametros, montaje, tipo_oro, peso_estimado, peso_oro, precio_estimado, precio_cliente, nota, creado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
    ).bind(cod.id, cod.codigo, cod.cliente, tipo, JSON.stringify(parametros), JSON.stringify(montaje), tipoOro, pesoR, cot.peso_oro, precio,
      Number(d.precio_estimado) || 0, nota, ahoraIso()).first();
    id = fila.id;
    fol = folio('D', id);
    claveStl = `disenos/${fol}.stl`;
    await guardar(env, claveStl, stl, 'model/stl');
    // La vista lleva un sufijo aleatorio: /img/ la sirve, pero el folio secuencial solo no basta para adivinarla.
    if (png) { clavePng = `disenos/${fol}-${sufijoAleatorio()}.png`; await guardar(env, clavePng, png, 'image/png'); }
    await env.DB.prepare('UPDATE disenos SET folio = ?, clave_stl = ?, clave_png = ? WHERE id = ?').bind(fol, claveStl, clavePng, id).run();
  } catch (e) {
    await devolverCupo(env, cod.id);
    if (id) {
      await env.DB.prepare('DELETE FROM disenos WHERE id = ?').bind(id).run().catch(() => {});
      await borrar(env, [claveStl, clavePng]).catch(() => {});
    }
    throw e;
  }

  const restantes = Math.max(0, cod.max_disenos - cod.usados);
  const cabecera =
    `<b>Diseño nuevo ${fol}</b>\n` +
    `Cliente: ${escaparHtml(cod.cliente)} (${cod.codigo}, le quedan ${restantes})\n` +
    (cod.nota ? `Tu nota: <i>${escaparHtml(cod.nota)}</i>\n` : '') +
    `Diseño: ${escaparHtml(describirDiseno(tipo, parametros))} · oro ${tipoOro}\n` +
    `Montaje: ${escaparHtml(describirMontaje(montaje))}\n` +
    `Pieza: ${gramosTxt(pesoR)} g (volumen ≈ ${(pesoR / DENSIDAD_ORO_18K).toFixed(3)} cm³)\n` +
    (cot.peso_balines ? `Balines: ${montaje.balines.cantidad} × ${gramosTxt(cot.peso_balin, 4)} g = ${gramosTxt(cot.peso_balines)} g\n` : '') +
    `Oro total: <b>${gramosTxt(cot.peso_oro)} g</b>\n` +
    (cot.tejido ? `Tejido en nylon: ${dinero(cot.tejido)}\n` : '') +
    `Precio estimado: <b>${dinero(precio)}</b>${montaje.soporte === 'cadena' ? ' (sin la cadena)' : ''}`;
  const resumen = cabecera + '\n\n' + escaparHtml(resumenParametros(tipo, parametros)) + (nota ? `\n\nNota: ${escaparHtml(nota)}` : '');
  // El pie de una foto admite 1024 caracteres: si no cabe, va la cabecera en la foto y el resumen completo aparte
  // (cortar el HTML a mitad de etiqueta haría que Telegram rechace el mensaje).
  const cabe = resumen.length <= 1024;
  const pie = cabe ? resumen : cabecera.slice(0, 1024);

  let aviso;
  await cargarAdmins(env);
  if (!telegramActivo(env) || !admins(env).length) {
    aviso = 'Diseño guardado. Telegram no está configurado: Carlos no recibió el aviso automático.';
    console.log('[disenos]', fol, 'guardado sin aviso a Telegram. Habría enviado:\n' + resumen);
  } else {
    // Avisar sin hacer esperar al cliente. El STL solo le llega a Carlos por aquí.
    ctx.waitUntil(avisarAdmins(env, async (chat) => {
      const r1 = png ? await sendPhoto(env, chat, png, pie, null, `${fol}.png`) : null;
      const r2 = await sendDocument(env, chat, stl, `${fol}.stl`, 'model/stl', png ? '' : pie);
      const r3 = cabe ? null : await sendMessage(env, chat, resumen.slice(0, 4000));
      return (r1?.ok ?? true) && r2.ok && (r3?.ok ?? true);
    }));
  }

  return json({
    ok: true, id, folio: fol, precio_estimado: precio, peso_pieza: pesoR, peso_oro: cot.peso_oro, montaje, restantes,
    ...(aviso ? { aviso } : {}),
  });
}
