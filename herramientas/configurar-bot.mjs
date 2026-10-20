#!/usr/bin/env node
// Registra el webhook del bot y su menú de comandos (COMANDOS de api/src/bot.js: incluye /tejido; sin comandos de IA).
// Uso (variables de entorno, no se guardan en ningún lado):
//   TELEGRAM_TOKEN=... TELEGRAM_SECRETO=... TELEGRAM_RUTA_SECRETA=... \
//   API_URL=https://18gold-api.<tu-cuenta>.workers.dev  node herramientas/configurar-bot.mjs
// Con --info solo muestra el estado actual del webhook.
import { COMANDOS } from '../api/src/bot.js';

const { TELEGRAM_TOKEN, TELEGRAM_SECRETO, TELEGRAM_RUTA_SECRETA, API_URL } = process.env;
if (!TELEGRAM_TOKEN) { console.error('Falta TELEGRAM_TOKEN'); process.exit(1); }

async function tg(metodo, cuerpo = {}) {
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${metodo}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo),
  });
  const j = await r.json();
  console.log(metodo, j.ok ? 'ok' : `ERROR: ${j.description}`);
  return j;
}

if (process.argv.includes('--info')) {
  const j = await tg('getWebhookInfo');
  console.log(JSON.stringify({ ...j.result, url: j.result?.url?.replace(/telegram\/.+$/, 'telegram/***') }, null, 2));
  process.exit(0);
}

if (!TELEGRAM_SECRETO || !TELEGRAM_RUTA_SECRETA || !API_URL) {
  console.error('Faltan TELEGRAM_SECRETO, TELEGRAM_RUTA_SECRETA o API_URL');
  process.exit(1);
}
if (!/^[A-Za-z0-9_-]{1,256}$/.test(TELEGRAM_SECRETO)) {
  console.error('TELEGRAM_SECRETO solo admite letras, números, _ y - (requisito de Telegram)');
  process.exit(1);
}

const url = `${API_URL.replace(/\/$/, '')}/telegram/${TELEGRAM_RUTA_SECRETA}`;
await tg('setWebhook', { url, secret_token: TELEGRAM_SECRETO, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
await tg('setMyCommands', { commands: COMANDOS.map(([command, description]) => ({ command, description })) });
await tg('setMyDescription', { description: 'Bot de administración de 18gold KPrada.' });
const info = await tg('getWebhookInfo');
if (info.result?.last_error_message) console.log('Último error del webhook:', info.result.last_error_message);
