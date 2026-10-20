# Licencias de relieves, iconos y datos del diseñador

## Mapas de alturas de las medallas y del Cristo (`public/relieves/*.png`)
Generados en desarrollo (2026-10-18) con el modelo de imagen `google/gemini-3.1-flash-image` vía
OpenRouter, a partir de descripciones de iconografía religiosa tradicional (sin imágenes de referencia
de terceros), y limpiados con `herramientas/limpiar-relieves.py`. Script: `herramientas/generar-relieves.mjs`.
Uso comercial permitido por los términos del proveedor para el contenido generado por el usuario.
El reverso de San Benito (cruz, letras C·S·P·B, C·S·S·M·L, N·D·S·M·D, PAX y V·R·S·N·S·M·V·S·M·Q·L·I·V·B)
se construye en vectores con Cormorant Garamond (OFL) en `src/disenador/clasicas.js`.

## Contornos de dijes (`src/disenador/motivos-datos.js`, generado con `herramientas/extraer-motivos.mjs`)
| Dije | Fuente | Autor | Licencia |
|---|---|---|---|
| Mano de Fátima (`hamsa`), huella (`paw`) | Font Awesome Free 6 — https://fontawesome.com | Fonticons, Inc. | CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/ |
| Paloma (`peace-dove`), elefante (`elephant`), herradura (`horseshoe`) | game-icons.net — https://game-icons.net | Delapouite | CC BY 3.0 — https://creativecommons.org/licenses/by/3.0/ |
| Trébol (`clover`) | game-icons.net | Lorc | CC BY 3.0 |
| Signos del zodiaco (U+2648–U+2653) | Noto Sans Symbols — https://fonts.google.com/noto | Google | SIL Open Font License 1.1 (`public/fuentes/licencias/OFL-notosanssymbols.txt`) |
| Mapa de Colombia | Natural Earth 1:50m Admin 0 — https://www.naturalearthdata.com | Natural Earth | Dominio público |

Los contornos se escalan, se cierran rendijas menores de 0,5 mm y se engrosan para fundir; la herradura se
gira 180°. Corazón, infinito, árbol de la vida, luna y estrella, estrella, ojo turco, ángel y «Mamá» son
dibujos propios (paramétricos) del diseñador.

Atribución requerida (CC BY): «Iconos de Font Awesome (CC BY 4.0) y de game-icons.net por Delapouite y
Lorc (CC BY 3.0)». Se muestra en el pie de todas las páginas (`.pie-creditos`, src/comun/layout.js) y en este archivo.
