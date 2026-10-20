# 18gold KPrada — arquitectura v2

Tienda de joyería en oro 18k de **Carlos** (hermano del profe). WhatsApp 573178861724 ·
Instagram @18GOLDKPRADA · TikTok @18goldKprada · lema «¡Teje tu historia!».
Sin pasarela de pagos: el cliente pide en la web y cierra por WhatsApp.

```
web/   Front estático (Vite, vanilla JS, Three.js, GSAP+ScrollTrigger, Lenis) → GitHub Pages
api/   Cloudflare Worker: API JSON + webhook de Telegram + D1 (datos) + R2 (imágenes, STL)
herramientas/  migración desde legado-php (SQLite → D1 seed, fotos → R2)
legado-php/    la app PHP anterior (solo referencia; no se despliega)
fotos-originales/  fotos de WhatsApp fuente del catálogo
```

Convenciones (heredadas, no cambiar): **todo en español** (funciones, variables, rutas,
clases CSS). Sin emojis en la interfaz. Consultas D1 siempre preparadas (`.bind()`).

---

## 1. Reglas del dominio

- **El precio no se guarda, se calcula** (igual que en PHP `calcular_precio()`):
  - `tipo_precio='gramo'` → `peso_gramos × precio_gramo[tipo_oro] + mano_obra`
  - `tipo_precio='pieza'` → `precio_pieza`
  - luego descuento (`porcentaje` | `valor`) y redondeo a la centena.
  - El Worker calcula y entrega `precio` ya resuelto; el front nunca recalcula el catálogo.
- `precio_gramo` por `tipo_oro`: `nacional` | `italiano` (tabla `ajustes`, historial en `precios_historial`).
- **Diseños personalizados** (dije con nombre, inicial, placa, anillo): oro 18k ley 750,
  densidad **15,5 g/cm³**. `peso_estimado = volumen_cm3 × 15.5`.
  `precio_estimado = peso_estimado × precio_gramo[tipo_oro] + peso_estimado × hechura_gramo`
  (ajuste `hechura_gramo`, por defecto 60000) redondeado a la centena. Siempre se muestra como **estimado**.
- **Código de cliente**: Carlos lo genera desde Telegram para la persona con quien negocia.
  Formato `KP-XXXXX` (5 caracteres de `ABCDEFGHJKMNPQRSTUVWXYZ23456789`), con nombre del
  cliente, vencimiento (por defecto 15 días) y máximo de diseños enviados (por defecto 5).
  Sin código válido no se puede **enviar** un diseño (sí se puede jugar con el diseñador).

## 2. API del Worker (JSON, CORS para el origen del front)

Base: `VITE_API` en el front (dev: `http://127.0.0.1:8787`).

| Método | Ruta | Respuesta / cuerpo |
|---|---|---|
| GET | `/api/catalogo` | `{ marca, precios:{nacional,italiano,actualizado}, ajustes:{whatsapp,instagram,tiktok,anuncio,hechura_gramo,tejido_valor,envio_valor,envio_gratis_desde}, categorias:[{slug,nombre,orden}], productos:[Producto] }` |
| GET | `/api/producto/:slug` | `Producto` + `relacionados:[Producto]` |
| POST | `/api/codigo` | `{codigo}` → `{ok:true, cliente, expira, restantes}` o `{ok:false, error}` |
| POST | `/api/disenos` | `{codigo, tipo, parametros, montaje, peso_estimado, precio_estimado, tipo_oro, nota, vista_png (dataURL), stl_base64}` → `{ok, id, folio}`. Guarda STL y PNG en R2, avisa a Telegram con foto + STL adjunto. |
| POST | `/api/pedidos` | `{cliente:{nombre,whatsapp,ciudad,direccion?}, items:[{slug,cantidad}], nota}` → `{ok, folio, total, wa_texto}`. Recalcula precios en el servidor. Avisa a Telegram. |
| GET | `/img/:clave+` | sirve objeto de R2 (imágenes de productos, vistas de diseños) con cache largo |
| POST | `/telegram/<TELEGRAM_RUTA_SECRETA>` | webhook; además valida header `X-Telegram-Bot-Api-Secret-Token` |

`Producto` = `{ id, slug, sku, nombre, descripcion, categoria (slug), categoria_nombre, tipo_oro,
tipo_precio, peso_gramos, medidas, precio, precio_antes (null si no hay descuento), destacado,
imagenes:[url absoluta], creado }`. Solo `activo=1`.

## 3. Bot de Telegram (lo usa Carlos para administrar todo)

Solo responde a los chat_id en el secreto `TELEGRAM_ADMINS` (lista separada por comas).
Comandos (en español, con menú `setMyCommands`):

- `/oro` — muestra precios. `/oro nacional 352000` · `/oro italiano 410000` actualiza y guarda historial.
- **Mandar foto** (con o sin pie) → borrador leyendo el pie (peso «4,2 g», «italiano», categoría por
  palabras clave), con botones `Publicar` · `Cambiar nombre` · `Cambiar peso` · `Cambiar categoría` · `Descartar`.
  Varias fotos en álbum = una sola joya.
- `/productos [texto]` — busca; cada resultado con botones `Ocultar/Mostrar`, `Destacar`, `Peso`, `Precio`, `Borrar`.
- `/peso <sku|slug> <gramos>` · `/precio <sku|slug> <valor>` (pasa a precio por pieza) · `/ocultar <sku>` · `/mostrar <sku>`
- `/codigo <nombre del cliente> [días]` → genera y responde con el código y el enlace
  `https://<dominio>/disena/?c=KP-XXXXX` listo para reenviar por WhatsApp.
- `/codigos` — vigentes y cuántos diseños lleva cada uno. `/anular KP-XXXXX`.
- `/tejido <valor>` — mano de obra del tejido en nylon (ajuste `tejido_valor`, por defecto 25000).
- `/disenos` — últimos diseños recibidos; `/pedidos` — últimos pedidos.
- `/anuncio <texto>` (vacío = quitar) — franja de anuncio de la web.
- `/ayuda`.
- Notificaciones entrantes: diseño nuevo (foto de la vista + STL como documento + resumen
  de parámetros, peso, precio y cliente), pedido nuevo (resumen + enlace wa.me al cliente).

## 4. IA — NO va en producción (decisión del profe, 2026-10-18)

El servidor **no usa IA**. Se quitó `/api/ia/interpretar` y la ficha por visión del bot: el
bot arma el borrador leyendo el pie de la foto (peso «4,2 g», «italiano», categoría por
palabras clave) y Carlos completa con botones.
La llave de OpenRouter vive SOLO en `.secretos/openrouter.env` (gitignored) y se usa en
desarrollo, desde scripts locales, para mejorar el diseño (generar referencias/siluetas,
revisar capturas). Nunca en el front, en el Worker ni en el repo.

## 5. Diseñador (web/src/disenador/) — esquema de parámetros

Módulo independiente. API: `const d = await crearDisenador(contenedor, {alCambiar})`;
`d.fijar(tipo, parametros)`, `d.obtener() → {tipo, parametros, volumen_cm3}`,
`d.exportarSTL() → ArrayBuffer`, `d.capturarPNG() → dataURL`, `d.destruir()`.

Todas las medidas en **milímetros**. La geometría de dijes/placas/iniciales es 2,5D: se
unen los contornos en 2D (polygon-clipping) y se extruye UNA sola malla cerrada (STL
manifiesto). Grosor mínimo de pared 0,8 mm. El grabado es **láser después de fundir**: se
guarda como texto y se dibuja en la vista previa, no se talla en el STL.

```js
nombre:  { texto, fuente: 'script1'|'script2'|'script3'|'serif'|'bloque', alto: 8–20, grosor: 0.8–2.0,
           base: 'ninguna'|'linea'|'doble', adorno: 'ninguno'|'corazon'|'corona'|'estrella'|'mariposa',
           argolla: 'izquierda'|'centro'|'derecha'|'dos' }
inicial: { letra, fuente, alto: 10–25, grosor: 1.0–2.0, marco: 'ninguno'|'circulo'|'ovalo'|'corazon', argolla: true }
placa:   { forma: 'rectangular'|'militar'|'ovalada'|'circulo'|'corazon', ancho: 12–35, alto: 15–45, grosor: 0.8–2.0,
           grabado_frente, grabado_reverso, argolla: 'arriba'|'lateral' }
anillo:  { talla: 4–14 (talla colombiana/US, diámetro interior = 11.63 + 0.8128·talla mm),
           ancho: 2–10, grosor: 1.2–2.5, perfil: 'plano'|'media_cana'|'comodo'|'facetado', grabado_interior }
           (nombre e inicial además: puntos: 'unir'|'corazon'|'diamante'; placa y anillo: grabado_fuente: 'serif'|'script')
           (fuentes vigentes: script1 = Damion, script2 = Pacifico, script3 = Dancing Script, oculta en el selector)
medalla: { motivo: 'san_benito'|'virgen_milagrosa'|'guadalupe'|'divino_nino'|'sagrado_corazon'|'espiritu_santo'|'angel_guarda',
           diametro: 12–25 (atajos 12, 15, 18, 22), forma: 'redonda'|'ovalada', borde: 'liso'|'cordon'|'puntos',
           grosor: 1.0–2.0, reverso: 'liso'|'cruz_san_benito'|'grabado', grabado_reverso, grabado_fuente, argolla: 'arriba' }
           Frente en RELIEVE (mapa de alturas sobre la tapa; malla cerrada). Reverso 'cruz_san_benito' = cruz con
           C·S·P·B en los cuadrantes, C·S·S·M·L vertical, N·D·S·M·D horizontal, V·R·S·N·S·M·V·S·M·Q·L·I·V·B
           alrededor y PAX arriba, en relieve.
cruz:    { estilo: 'latina'|'griega'|'redondeada'|'con_borde'|'florenzada'|'tau', alto: 12–40, brazo: 1.5–5,
           grosor: 1.0–2.5, punto_luz: true|false, cristo: true|false (relieve), argolla: 'arriba' }
motivo:  { figura: 'corazon'|'infinito'|'arbol_vida'|'trebol'|'herradura'|'ojo_turco'|'mano_fatima'|'elefante'|
           'luna_estrella'|'estrella'|'huella'|'mapa_colombia'|'paloma'|'angel'|'mama'|
           'zodiaco_aries'…'zodiaco_piscis' (12), alto: 10–30, grosor: 0.8–2.0, calado: true|false,
           texto: '' (opcional, hasta 12 caracteres; en 'mama' = nombres de los hijos separados por coma, hasta 40), argolla: 'arriba'|'lateral' }
comun:   { tipo_oro: 'nacional'|'italiano', acabado: 'brillante'|'mate'|'rose' (solo vista) }
```

montaje (cómo se lleva la pieza; el STL es SOLO la pieza de oro a fundir):
montaje: { soporte: 'ninguno'|'cadena'|'tejido',
  cadena: { estilo: 'rolo'|'cartier'|'lazo'|'veneciana'|'singapur', largo_cm: 40–60 },   // se cotiza aparte
  tejido: { uso: 'pulsera'|'tobillera'|'collar', patron: 'macrame_plano'|'espiral'|'trenza'|'cola_raton'|'serpiente',
            color: 'negro'|'rojo'|'blanco'|'azul'|'cafe'|'verde'|'rosado'|'beige', largo_cm: 14–24 (collar 38–60) },
  balines: { cantidad: 0–20, diametro: 3|4|5|6, acabado: 'liso'|'diamantado',
             distribucion: 'junto_al_dije'|'repartidos'|'extremos' } }
Balín = esfera HUECA de oro 18k, pared 0,3 mm, con perforación (se ignora):
peso_balin_g = 15.5/1000 × 4/3·π·(r³ − (r−0.3)³), r = diametro/2.

Precio del diseño con montaje (Worker recalcula, front estima igual):
peso_oro = peso_pieza + cantidad × peso_balin_g
precio = peso_oro × precio_gramo[tipo_oro] + peso_pieza × hechura_gramo
         + (soporte=='tejido' ? tejido_valor : 0), redondeado a la centena.
La cadena de oro NO entra en el estimado (se cotiza aparte; se muestra la nota).
El peso se redondea a 2 decimales antes de cotizar, en ambos lados.

Vista «Puesta»: siluetas grises mate (cuello/escote para collar o cadena, muñeca para
pulsera, tobillo para tobillera, mano para anillo) con el montaje y la pieza a escala real.

**El STL solo lo recibe Carlos** (por Telegram al enviar el diseño). El front público NO
ofrece descargarlo en ningún modo; R2 no lo sirve por `/img/`.

Exporta STL binario en mm, escala 1:1, con `contraccion` opcional (%; por defecto 0) que escala el modelo.

## 6. Front (web/)

Páginas (multi-página Vite, URLs limpias con carpeta/index.html):
`/` inicio · `/catalogo/` · `/joya/?p=<slug>` · `/disena/` · `/carrito/` · `/como-comprar/`.

Sistema visual heredado (el profe es exigente, **no revertir**):
- **Sin degradados.** Fondo hueso `#f4f0e6`, negro `#100f0d`, oro plano `#9d7c2f` (sobre claro) / `#c9a44c` (sobre oscuro).
- Esquinas casi rectas (`2px`), líneas de 1px, mucho aire. Lujo sobrio con algo de brutalismo.
- Tipografía **Cormorant Garamond** (display) + **Outfit** (interfaz).
- Fotos siempre recortadas `object-fit: cover`, formato 4:5 uniforme.
- **Nada flota con el scroll** (nada de `sticky` en la foto del producto, nada de parallax barato).
  Las animaciones son revelados al entrar (máscaras, líneas que se dibujan, texto por líneas),
  el 3D es el protagonista. Respeta `prefers-reduced-motion`.
- Solo WhatsApp flotante. Logo: el SVG alámbrico (pirámide + diamante + hilo) que se dibuja solo.
- Carrito en `localStorage`; al confirmar: `POST /api/pedidos` y abre WhatsApp con `wa_texto`.
