// Cliente mínimo de la API de bots de Telegram.
// Si falta TELEGRAM_TOKEN, las llamadas no fallan: devuelven {ok:false} y lo registran en consola.

const API = 'https://api.telegram.org';

export const telegramActivo = (env) => !!env.TELEGRAM_TOKEN;

const lista = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

/** Dueños (secreto TELEGRAM_ADMINS) + administradores agregados desde el bot (cargarAdmins). */
export const admins = (env) => [...new Set([...lista(env.TELEGRAM_ADMINS), ...(env._adminsBot || [])])];

/** Carga en env los administradores agregados desde el bot (ajustes.admins_bot). Llamar antes de admins(). */
export async function cargarAdmins(env) {
  const r = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'admins_bot'").first();
  env._adminsBot = lista(r?.valor);
  return env._adminsBot;
}

export const esDueno = (env, chatId) => lista(env.TELEGRAM_ADMINS).includes(String(chatId));

export const esAdmin = (env, chatId) => admins(env).includes(String(chatId));

async function llamar(env, metodo, cuerpo) {
  if (!env.TELEGRAM_TOKEN) {
    console.log(`[telegram] sin TELEGRAM_TOKEN, se omite ${metodo}`, cuerpo instanceof FormData ? '(multipart)' : JSON.stringify(cuerpo).slice(0, 300));
    return { ok: false, description: 'TELEGRAM_TOKEN no configurado' };
  }
  try {
    const multipart = cuerpo instanceof FormData;
    const r = await fetch(`${API}/bot${env.TELEGRAM_TOKEN}/${metodo}`, {
      method: 'POST',
      headers: multipart ? undefined : { 'content-type': 'application/json' },
      body: multipart ? cuerpo : JSON.stringify(cuerpo),
    });
    const j = await r.json().catch(() => ({ ok: false, description: `HTTP ${r.status}` }));
    if (!j.ok) console.log(`[telegram] ${metodo} falló:`, j.description);
    return j;
  } catch (e) {
    console.log(`[telegram] ${metodo} error de red:`, e.message);
    return { ok: false, description: e.message };
  }
}

const teclado = (botones) => (botones ? { reply_markup: { inline_keyboard: botones } } : {});

export const sendMessage = (env, chat_id, text, botones, extra = {}) =>
  llamar(env, 'sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...teclado(botones), ...extra });

export const editMessageText = (env, chat_id, message_id, text, botones) =>
  llamar(env, 'editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...teclado(botones) });

export const editMessageReplyMarkup = (env, chat_id, message_id, botones) =>
  llamar(env, 'editMessageReplyMarkup', { chat_id, message_id, reply_markup: { inline_keyboard: botones || [] } });

export const answerCallbackQuery = (env, callback_query_id, text = '') =>
  llamar(env, 'answerCallbackQuery', { callback_query_id, text });

function adjunto(campo, datos, nombre, tipo, chat_id, extra) {
  const f = new FormData();
  f.append('chat_id', String(chat_id));
  f.append(campo, new Blob([datos], { type: tipo }), nombre);
  for (const [k, v] of Object.entries(extra)) if (v !== undefined) f.append(k, typeof v === 'string' ? v : JSON.stringify(v));
  return f;
}

/** foto: Uint8Array/ArrayBuffer (se sube) o string (file_id / URL). */
export function sendPhoto(env, chat_id, foto, caption = '', botones, nombre = 'vista.png') {
  if (typeof foto === 'string') return llamar(env, 'sendPhoto', { chat_id, photo: foto, caption, parse_mode: 'HTML', ...teclado(botones) });
  return llamar(env, 'sendPhoto', adjunto('photo', foto, nombre, 'image/png', chat_id, {
    caption, parse_mode: 'HTML', reply_markup: botones ? { inline_keyboard: botones } : undefined,
  }));
}

export const sendDocument = (env, chat_id, datos, nombre, tipo = 'application/octet-stream', caption = '') =>
  llamar(env, 'sendDocument', adjunto('document', datos, nombre, tipo, chat_id, { caption, parse_mode: 'HTML' }));

export const getFile = (env, file_id) => llamar(env, 'getFile', { file_id });

/** Descarga un archivo de Telegram → Uint8Array (o null). */
export async function descargarArchivo(env, file_id) {
  const r = await getFile(env, file_id);
  if (!r.ok) return null;
  const resp = await fetch(`${API}/file/bot${env.TELEGRAM_TOKEN}/${r.result.file_path}`);
  if (!resp.ok) return null;
  return new Uint8Array(await resp.arrayBuffer());
}

export const setWebhook = (env, url, secret_token) =>
  llamar(env, 'setWebhook', { url, secret_token, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });

/** Envía un mensaje a todos los admins. Devuelve cuántos se entregaron. */
export async function avisarAdmins(env, fn) {
  if (!telegramActivo(env) || !admins(env).length) {
    console.log('[telegram] aviso a admins omitido (falta TELEGRAM_TOKEN o TELEGRAM_ADMINS)');
    return 0;
  }
  let n = 0;
  for (const chat of admins(env)) {
    try { if (await fn(chat)) n++; } catch (e) { console.log('[telegram] aviso falló', e.message); }
  }
  return n;
}

/** Álbum de fotos (2–10). Con una sola foto Telegram exige sendPhoto. */
export const sendMediaGroup = (env, chat_id, media) =>
  media.length === 1
    ? llamar(env, 'sendPhoto', { chat_id, photo: media[0].media, caption: media[0].caption })
    : llamar(env, 'sendMediaGroup', { chat_id, media });

export const getChat = (env, chat_id) => llamar(env, 'getChat', { chat_id });
