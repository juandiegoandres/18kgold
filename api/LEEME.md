# 18gold-api (Cloudflare Worker)

API JSON del catálogo, diseños y pedidos, más el webhook del bot de Telegram de Carlos.
Datos en D1 (`DB`), fotos/STL en R2 (`ARCHIVOS`). Contrato en `../ARQUITECTURA.md`.
**El Worker no usa IA** (ARQUITECTURA §4): no hay OpenRouter ni `/api/ia/*`; el bot arma los
borradores leyendo el pie de foto (`src/pie.js`).

## Correr en local

```bash
cd api
npm install
cp .dev.vars.ejemplo .dev.vars        # opcional: datos del bot de Telegram
node ../herramientas/migrar.mjs --aplicar          # esquema + semilla + migraciones en D1 local
# (solo migraciones nuevas sobre una base que ya existe:  npm run migrar:local)
node ../herramientas/subir-imagenes.mjs --local    # fotos al R2 local (~10 min, de a una)
npx wrangler dev --port 8787
```

- `http://127.0.0.1:8787/api/catalogo` · `/api/producto/<slug>` · `/img/productos/<archivo>`
- Sin `TELEGRAM_TOKEN` todo funciona igual: las salidas a Telegram solo se registran en la
  consola (`[telegram] sin TELEGRAM_TOKEN, se omite ...`) y `/api/disenos` responde con `aviso`
  y deja en el log el resumen que habría recibido Carlos.
- Probar el webhook en local sin archivo `.dev.vars`:
  ```bash
  npx wrangler dev --port 8787 --var TELEGRAM_SECRETO:s --var TELEGRAM_RUTA_SECRETA:r --var TELEGRAM_ADMINS:111
  curl -X POST localhost:8787/telegram/r -H 'X-Telegram-Bot-Api-Secret-Token: s' -H 'content-type: application/json' \
    -d '{"message":{"message_id":1,"chat":{"id":111},"text":"/tejido 30000"}}'
  ```
- Pruebas sin dependencias: `npm test` (lector de pies de foto y cotización con montaje).
- Código de prueba en local:
  ```bash
  npx wrangler d1 execute 18gold --local --command \
    "INSERT INTO codigos (codigo, cliente, expira) VALUES ('KP-PRUEB', 'Prueba', '2099-01-01T00:00:00Z')"
  ```
  (los códigos reales usan solo `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, sin I, L, O, 0 ni 1).

## Desplegar

```bash
cd api
npx wrangler login
npx wrangler d1 create 18gold                 # pegar el database_id en wrangler.toml
npx wrangler r2 bucket create 18gold-archivos
# SITIO_URL y ORIGENES en wrangler.toml → el dominio real del front (GitHub Pages)

npx wrangler secret put TELEGRAM_TOKEN        # de @BotFather
npx wrangler secret put TELEGRAM_SECRETO      # aleatorio: letras, números, _ o -
npx wrangler secret put TELEGRAM_RUTA_SECRETA # aleatorio, va en la URL del webhook
npx wrangler secret put TELEGRAM_ADMINS       # chat_id de Carlos (coma-separados)

node ../herramientas/migrar.mjs --aplicar --remote   # esquema + semilla + migraciones en D1 remota
node ../herramientas/subir-imagenes.mjs --remote
npx wrangler deploy                                  # imprime https://18gold-api.<cuenta>.workers.dev
```

Configurar el bot (webhook + menú de comandos), desde la raíz del proyecto:

```bash
TELEGRAM_TOKEN=... TELEGRAM_SECRETO=... TELEGRAM_RUTA_SECRETA=... \
API_URL=https://18gold-api.<cuenta>.workers.dev node herramientas/configurar-bot.mjs
# estado:  TELEGRAM_TOKEN=... node herramientas/configurar-bot.mjs --info
```

Cambios de esquema: `esquema.sql` es la base idempotente (`CREATE ... IF NOT EXISTS`); las columnas
nuevas van en `migraciones/NNNN_nombre.sql` (`migrations_dir` en `wrangler.toml`) y se aplican con
`npx wrangler d1 migrations apply 18gold --local|--remote`. Wrangler lleva el registro en la tabla
`d1_migrations` y no repite las ya aplicadas (no correrlas a mano con `d1 execute`: SQLite no tiene
`ADD COLUMN IF NOT EXISTS`). `0002_montaje.sql` agrega `disenos.montaje` (JSON), `disenos.peso_oro` y el
ajuste `tejido_valor`.
**Ojo:** volver a correr `migrar.mjs --aplicar` reemplaza el catálogo con el del PHP.

## chat_id de Carlos

1. Desplegar con `TELEGRAM_ADMINS` vacío (o sin definir) y correr `configurar-bot.mjs`.
2. Carlos le escribe cualquier cosa al bot: el bot le responde «Tu chat_id es 123456789».
3. `npx wrangler secret put TELEGRAM_ADMINS` con ese número. Desde ahí el bot solo le
   responde a él (los demás chats se ignoran y quedan en el log: `npx wrangler tail`).

Alternativa sin desplegar: antes de poner el webhook, Carlos le escribe al bot y se abre
`https://api.telegram.org/bot<TOKEN>/getUpdates` → `message.chat.id`.

## Notas

- Rate limit por IP (tabla `limites`): `/api/codigo` 10 cada 10 min, `/api/disenos` 15/h, `/api/pedidos` 20/h.
- **El STL solo lo recibe Carlos**: se guarda en R2 como `disenos/D-000123.stl` y se le manda por
  Telegram; ninguna ruta lo sirve (`/img/` solo acepta `productos/*.{jpg,png,webp,gif}` y vistas de
  diseño). No hay otra ruta que lea R2.
- Vistas PNG de diseños: se guardan como `disenos/D-000123-<16 hex>.png` (sufijo aleatorio de 64 bits)
  y `/img/` solo las sirve con ese formato exacto: el folio secuencial no basta para adivinarlas.
  Se eligió esto (y no «solo por Telegram») para que el enlace «vista» de `/disenos` en el bot siga
  sirviendo. La clave nunca se devuelve al cliente web.

## Bot: foto → borrador (sin IA)

`src/pie.js` lee el pie de la foto: peso (`4,2 g`, `4.2gr`, `4,2 gramos`, `peso: 5,6`), tipo de oro
(`italiano/italiana`; si no, nacional), categoría por palabras clave contra las categorías de la BD
(cadena/gargantilla, pulsera/esclava/tobillera, aretes/topos/candongas/argollas, anillo/argollas de
matrimonio, dije/medalla, conjunto/juego; gana la que aparece primero), medidas (`45 cm`), nombre = primera
línea sin peso, oro ni medidas (o «Joya nueva») y descripción = las demás líneas. Botones: `Publicar` ·
`Cambiar peso` · `Cambiar categoría` · `Cambiar nombre` · `Descartar`.

## Diseños con montaje (`POST /api/disenos`)

`montaje` (§5) se valida y recorta con `normalizarMontaje()` (`src/esquema-disenador.js`): valores fuera de
lista → defecto, números → al rango (`largo_cm` de tejido 14–24, collar 38–60; balines 0–20; diámetro
redondeado y recortado a 3–6 mm). Solo se guarda el sub-objeto del soporte elegido; **sin soporte
(`ninguno`) los balines se ponen en 0**. El servidor recalcula (`cotizarDiseno()` en `src/precios.js`):

```
peso_balin = 15.5/1000 × 4/3·π·(r³ − (r−0.3)³),  r = diametro/2      (4 mm → 0,20043 g)
peso_pieza = round2(peso_estimado)
peso_oro   = round2(peso_pieza + cantidad × peso_balin)
precio     = centena(peso_oro × gramo[tipo_oro] + peso_pieza × hechura_gramo + (tejido ? tejido_valor : 0))
```

La cadena no entra (se cotiza aparte). Respuesta: `{ok, id, folio, precio_estimado, peso_pieza, peso_oro,
montaje, restantes}`. En D1: `disenos.montaje` (JSON), `peso_estimado` = pieza, `peso_oro`.
`/api/catalogo` expone `ajustes.tejido_valor` (por defecto 25000; Carlos lo cambia con `/tejido <valor>`).
- Folios: diseños `D-000123`, pedidos `P-000123`. El precio de diseños y pedidos siempre se
  recalcula en el servidor.
