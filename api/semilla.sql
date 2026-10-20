-- Semilla generada por herramientas/migrar.mjs el 2026-10-20T22:58:57.278Z
-- Fuente: legado-php/data/18gold.sqlite. Reemplaza catálogo, categorías e historial de precios.
DELETE FROM producto_imagenes;
DELETE FROM productos;
DELETE FROM categorias;
DELETE FROM precios_historial;
DELETE FROM sqlite_sequence WHERE name IN ('producto_imagenes','productos','categorias','precios_historial');

INSERT INTO ajustes (clave, valor) VALUES ('precio_gramo_nacional', '352000') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('precio_gramo_italiano', '410000') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('marca', '18gold KPrada') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('slogan', '¡Teje tu historia!') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('whatsapp', '573178861724') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('instagram', '18GOLDKPRADA') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('instagram2', 'CAPRARAMIREZ') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('tiktok', '18goldKprada') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('tiktok2', 'caprada') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('envio_valor', '15000') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('envio_gratis_desde', '500000') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT INTO ajustes (clave, valor) VALUES ('anuncio', 'Envios a toda Colombia') ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('hechura_gramo', '60000');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('tejido_valor', '25000');

INSERT INTO categorias (id, nombre, slug, icono, orden) VALUES (1, 'Cadenas', 'cadenas', 'diamante', 1);
INSERT INTO categorias (id, nombre, slug, icono, orden) VALUES (2, 'Pulseras', 'pulseras', 'anillo', 2);
INSERT INTO categorias (id, nombre, slug, icono, orden) VALUES (3, 'Anillos', 'anillos', 'anillo', 3);
INSERT INTO categorias (id, nombre, slug, icono, orden) VALUES (4, 'Dijes', 'dijes', 'chispa', 4);
INSERT INTO categorias (id, nombre, slug, icono, orden) VALUES (5, 'Aretes', 'aretes', 'corona', 5);
INSERT INTO categorias (id, nombre, slug, icono, orden) VALUES (6, 'Conjuntos', 'conjuntos', 'regalo', 6);

INSERT INTO precios_historial (id, tipo, precio, creado) VALUES (1, 'nacional', 340000, '2026-07-28 00:24:34');
INSERT INTO precios_historial (id, tipo, precio, creado) VALUES (2, 'italiano', 395000, '2026-07-28 00:24:34');
INSERT INTO precios_historial (id, tipo, precio, creado) VALUES (3, 'nacional', 352000, '2026-07-28 00:33:17');
INSERT INTO precios_historial (id, tipo, precio, creado) VALUES (4, 'italiano', 410000, '2026-07-28 00:33:17');
INSERT INTO precios_historial (id, tipo, precio, creado) VALUES (5, 'nacional', 358000, '2026-07-28 01:16:48');
INSERT INTO precios_historial (id, tipo, precio, creado) VALUES (6, 'italiano', 415000, '2026-07-28 01:16:48');

INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (1, 'KP-001', 'Topos corona Rolex redondos', 'topos-corona-rolex-redondos', 'Par de topos redondos con la corona grabada dentro de un marco perlado.

• Material: oro 18k nacional
• Estilo: Corona grabada en bajorrelieve
• Medida: Ø 6 mm
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '6 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 4, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (2, 'KP-002', 'Topos alita de ángel', 'topos-alita-de-angel-2', 'Alitas pequeñas con las plumas marcadas a mano y rosca de seguridad marcada 18k.

• Material: oro 18k nacional
• Estilo: Alita con plumas marcadas
• Medida: 8 mm de ancho
• Peso de referencia: 0,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.6, 0, 25000, 4, 'ninguno', 0, 0, 1, 0, '8 mm de ancho', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (3, 'KP-003', 'Topos media esfera — 4 medidas', 'topos-media-esfera-4-medidas-3', 'Medidas disponibles: #4 (0.8 g), #5 (1 g), #7 (1.2 g), #8 (1.4 g). Rosca de seguridad.

• Material: oro 18k nacional
• Estilo: Media esfera lisa pulida
• Medida: #4 · #5 · #7 · #8
• Peso de referencia: 1 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 1, 0, 75000, 5, 'ninguno', 0, 0, 1, 0, '#4 · #5 · #7 · #8', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (4, 'KP-004', 'Topos balín liso — 4 medidas', 'topos-bal-in-liso-4-medidas-4', 'Cuatro tamaños en un mismo modelo, del más discreto al más llamativo.

• Material: oro 18k nacional
• Estilo: Balín liso espejo
• Medida: Medidas 1 a 4
• Peso de referencia: 0,8 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.8, 0, 0, 2, 'ninguno', 0, 0, 1, 0, 'Medidas 1 a 4', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (5, 'KP-005', 'Topos luna con circones — oro rosado', 'topos-luna-con-circones-oro-rosado-5', 'Media luna en tono rosado con circones blancos sobre el borde. Vienen en su cajita.

• Material: oro 18k nacional
• Estilo: Luna con circones engastados
• Medida: 8 mm
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 0, 3, 'ninguno', 0, 0, 1, 0, '8 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (6, 'KP-006', 'Surtido de topos infantiles', 'surtido-de-topos-infantiles-6', 'Set surtido de topos pequeños, ideales para niña o para segundo hueco.

• Material: oro 18k nacional
• Estilo: Osito, flor, alita, ratón, mano y trébol
• Medida: 4 a 7 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 0, 3, 'ninguno', 0, 0, 1, 0, '4 a 7 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (7, 'KP-007', 'Topos piecitos de bebé', 'topos-piecitos-de-beb-e-7', 'El detalle más pedido para mamá primeriza. Diminutos y con muy buen acabado.

• Material: oro 18k nacional
• Estilo: Piecito con deditos marcados
• Medida: 6 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '6 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (8, 'KP-008', 'Topos círculo con barra', 'topos-c-irculo-con-barra-8', 'Diseño minimalista tipo botón, marcado 18k en la rosca.

• Material: oro 18k nacional
• Estilo: Círculo liso con barra central
• Medida: Ø 5 mm
• Peso de referencia: 0,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.6, 0, 0, 2, 'porcentaje', 11, 0, 1, 0, 'Ø 5 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (9, 'KP-009', 'Topos luna con circones — modelo 2', 'topos-luna-con-circones-modelo-2-9', 'Misma luna con circones, presentada en estuche gris.

• Material: oro 18k nacional
• Estilo: Luna con circones
• Medida: 8 mm
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 0, 5, 'ninguno', 0, 0, 1, 0, '8 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (10, 'KP-010', 'Topos gucci grano de café', 'topos-gucci-grano-de-caf-e-10', 'Dos pesos disponibles: 1 g y 1.1 g. El clásico que nunca pasa de moda.

• Material: oro 18k nacional
• Estilo: Eslabón grano de café
• Medida: 1 g y 1.1 g
• Peso de referencia: 1,05 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 1.05, 0, 0, 4, 'ninguno', 0, 1, 1, 0, '1 g y 1.1 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 6, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (11, 'KP-011', 'Conjunto corazón calado — cadena, dije y topos', 'conjunto-coraz-on-calado-cadena-dije-y-topos-11', 'Conjunto completo: cadena veneciana fina, dije de corazón calado y los topos a juego.

• Material: oro 18k italiano ley 750
• Estilo: Corazón calado + cadena veneciana
• Medida: Cadena 45 cm
• Peso de referencia: 2,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 6, 'gramo', 'italiano', 2.5, 0, 25000, 3, 'ninguno', 0, 0, 1, 0, 'Cadena 45 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (12, 'KP-012', 'Topos balín diamantado — 6 medidas', 'topos-bal-in-diamantado-6-medidas-12', 'Medidas: #3 (0.5 g), #4 (0.55 g), #5 (0.66 g), #6 (0.7 g), #8 (1.2 g), #9 (1.25 g).

• Material: oro 18k nacional
• Estilo: Balín con corte diamantado
• Medida: #3 a #9
• Peso de referencia: 0,66 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.66, 0, 75000, 5, 'ninguno', 0, 0, 1, 0, '#3 a #9', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (13, 'KP-013', 'Topos gucci — 3 medidas', 'topos-gucci-3-medidas-13', 'Tres pesos del mismo modelo para que elijas qué tan marcado lo quieres.

• Material: oro 18k nacional
• Estilo: Eslabón grano de café
• Medida: 0.5 g · 0.6 g · 0.8 g
• Peso de referencia: 0,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.6, 0, 25000, 4, 'ninguno', 0, 0, 1, 0, '0.5 g · 0.6 g · 0.8 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (14, 'KP-014', 'Topos luna con circones — modelo 3', 'topos-luna-con-circones-modelo-3-14', 'Presentación en estuche, listos para regalo.

• Material: oro 18k nacional
• Estilo: Luna con circones
• Medida: 8 mm
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 0, 7, 'ninguno', 0, 0, 1, 0, '8 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (15, 'KP-015', 'Topos de circón blanco y negro', 'topos-de-circ-on-blanco-y-negro-15', 'Surtido con circón blanco y circón negro, en varios tamaños y pesos.

• Material: oro 18k nacional
• Estilo: Circón engastado en garras
• Medida: 0.4 g a 1.0 g
• Peso de referencia: 0,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.6, 0, 50000, 3, 'porcentaje', 8, 0, 1, 0, '0.4 g a 1.0 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (16, 'KP-016', 'Topos balín liso — rosca española', 'topos-bal-in-liso-nosca-espa-ola-16', 'Dos cierres a elegir: mariposa (#4, 0.6 g) o rosca española (#5, 0.8 g).

• Material: oro 18k nacional
• Estilo: Balín liso
• Medida: #4 y #5
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 75000, 6, 'ninguno', 0, 0, 1, 0, '#4 y #5', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (17, 'KP-017', 'Topos corazón mini', 'topos-coraz-on-mini-17', 'Los más pequeñitos: discretos y perfectos para uso diario.

• Material: oro 18k nacional
• Estilo: Corazón liso inflado
• Medida: 4 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 75000, 3, 'ninguno', 0, 0, 1, 0, '4 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (18, 'KP-018', 'Topos balín liso — 6 medidas', 'topos-bal-in-liso-6-medidas-18', 'Medidas: #3 (0.4 g), #4 (0.5 g), #5 (0.6 g), #6 (0.7 g), #7 (0.7 g), #8 (0.8 g).

• Material: oro 18k nacional
• Estilo: Balín liso espejo
• Medida: #3 a #8
• Peso de referencia: 0,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.6, 0, 0, 6, 'ninguno', 0, 0, 1, 0, '#3 a #8', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (19, 'KP-019', 'Topos corazón liso', 'topos-coraz-on-liso-19', 'Corazón lleno con brillo espejo. Rosca de seguridad.

• Material: oro 18k nacional
• Estilo: Corazón liso
• Medida: 5 mm
• Peso de referencia: 0,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.6, 0, 0, 3, 'ninguno', 0, 1, 1, 0, '5 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (20, 'KP-020', 'Topos corazón mini — modelo 2', 'topos-coraz-on-mini-modelo-2-20', 'Presentación en tira de 6 pares.

• Material: oro 18k nacional
• Estilo: Corazón liso
• Medida: 4 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 0, 5, 'ninguno', 0, 0, 0, 0, '4 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (21, 'KP-021', 'Topos redondos diamantados', 'topos-redondos-diamantados-21', 'Disco plano con corte diamantado que hace destellar la luz.

• Material: oro 18k nacional
• Estilo: Disco con corte diamantado en rayos
• Medida: Ø 5 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 0, 2, 'ninguno', 0, 0, 1, 0, 'Ø 5 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (22, 'KP-022', 'Topos corazón calado', 'topos-coraz-on-calado-22', 'Silueta de corazón en hilo de oro, muy livianos.

• Material: oro 18k nacional
• Estilo: Corazón calado en hilo
• Medida: 5 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 75000, 8, 'porcentaje', 13, 0, 1, 0, '5 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (23, 'KP-023', 'Topos corona Rolex', 'topos-corona-rolex-23', 'La corona clásica, con las cinco puntas bien definidas.

• Material: oro 18k nacional
• Estilo: Corona de cinco puntas
• Medida: 7 mm
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 75000, 4, 'ninguno', 0, 0, 1, 0, '7 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (24, 'KP-024', 'Topos Arcángel San Miguel', 'topos-arc-angel-san-miguel-24', 'Medalla ovalada del Arcángel San Miguel, con la inscripción alrededor.

• Material: oro 18k nacional
• Estilo: Medalla ovalada en relieve
• Medida: Ovalado 8 mm
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 0, 6, 'ninguno', 0, 0, 1, 0, 'Ovalado 8 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (25, 'KP-025', 'Topos corazón mini — modelo 3', 'topos-coraz-on-mini-modelo-3-25', 'Modelo alterno del corazón pequeño.

• Material: oro 18k nacional
• Estilo: Corazón liso
• Medida: 4 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 25000, 3, 'ninguno', 0, 0, 0, 0, '4 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (26, 'KP-026', 'Topos gucci con rosca de seguridad', 'topos-gucci-con-rosca-de-seguridad-26', 'Rosca de seguridad para que no se caigan. Tres pesos disponibles.

• Material: oro 18k nacional
• Estilo: Grano de café con rosca
• Medida: 0.6 g · 0.7 g · 1.1 g
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 25000, 3, 'ninguno', 0, 0, 1, 0, '0.6 g · 0.7 g · 1.1 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (27, 'KP-027', 'Topos balín diamantado — 6 medidas grandes', 'topos-bal-in-diamantado-6-medidas-grandes-27', 'Medidas: #3 (0.5 g), #5 (0.6 g), #6 (0.7 g), #7 (0.7 g), #8 (1.2 g), #10 (1.5 g).

• Material: oro 18k nacional
• Estilo: Balín con corte diamantado
• Medida: #3 a #10
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 75000, 8, 'ninguno', 0, 0, 1, 0, '#3 a #10', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (28, 'KP-028', 'Topos corazón y flor diamantados', 'topos-coraz-on-y-flor-diamantados-28', 'Corazón grande con marco perlado (2 g) y flores diamantadas (0.9 g).

• Material: oro 18k nacional
• Estilo: Corte diamantado en rayos
• Medida: Corazón 2 g · flor 0.9 g
• Peso de referencia: 0,9 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.9, 0, 50000, 4, 'ninguno', 0, 1, 1, 0, 'Corazón 2 g · flor 0.9 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (29, 'KP-029', 'Topos gucci pequeños', 'topos-gucci-peque-nos-29', 'El tamaño más vendido: 0.5 g, discreto y elegante.

• Material: oro 18k nacional
• Estilo: Grano de café
• Medida: 0.5 g
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 0, 2, 'porcentaje', 12, 0, 1, 0, '0.5 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (30, 'KP-030', 'Topos corazón — surtido de 6 pesos', 'topos-coraz-on-surtido-de-6-pesos-30', 'Seis pares en distintos pesos y acabados: liso, inflado y diamantado.

• Material: oro 18k nacional
• Estilo: Corazón liso y diamantado
• Medida: 0.5 g a 1.0 g
• Peso de referencia: 0,8 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.8, 0, 0, 8, 'ninguno', 0, 0, 1, 0, '0.5 g a 1.0 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (31, 'KP-031', 'Topos corazón con borde perlado', 'topos-coraz-on-con-borde-perlado-31', 'El corazón va enmarcado por una fila de bolitas que le da mucho brillo.

• Material: oro 18k nacional
• Estilo: Corazón inflado con marco de perlitas
• Medida: 0.7 g y 0.8 g
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '0.7 g y 0.8 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (32, 'KP-032', 'Topos corazón doble marco', 'topos-coraz-on-doble-marco-32', 'Centro texturizado y doble marco pulido. De los más llamativos.

• Material: oro 18k nacional
• Estilo: Corazón texturizado con doble marco
• Medida: 0.8 g a 1.0 g
• Peso de referencia: 0,85 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.85, 0, 0, 5, 'ninguno', 0, 0, 1, 0, '0.8 g a 1.0 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (33, 'KP-033', 'Topos corazón inflado', 'topos-coraz-on-inflado-33', 'Corazón lleno, redondeado, con muy buen peso para su tamaño.

• Material: oro 18k nacional
• Estilo: Corazón liso inflado
• Medida: 0.8 g y 0.9 g
• Peso de referencia: 0,8 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.8, 0, 75000, 7, 'ninguno', 0, 0, 1, 0, '0.8 g y 0.9 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (34, 'KP-034', 'Topos corazón y flor — 3 pesos', 'topos-coraz-on-y-flor-3-pesos-34', 'Tres presentaciones: corazón diamantado, flor diamantada y corazón liso.

• Material: oro 18k nacional
• Estilo: Diamantado y liso
• Medida: 0.6 g · 0.7 g · 1.0 g
• Peso de referencia: 0,8 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.8, 0, 25000, 3, 'ninguno', 0, 0, 1, 0, '0.6 g · 0.7 g · 1.0 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (35, 'KP-035', 'Topos trébol diamantado', 'topos-tr-ebol-diamantado-35', 'El trébol de la suerte con corte diamantado y borde de perlitas.

• Material: oro 18k nacional
• Estilo: Trébol de cuatro hojas con borde perlado
• Medida: 0.9 g a 1.1 g
• Peso de referencia: 1 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 1, 0, 50000, 5, 'ninguno', 0, 0, 1, 0, '0.9 g a 1.1 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (36, 'KP-036', 'Topos trébol rojo esmaltado', 'topos-tr-ebol-rojo-esmaltado-36', 'Trébol con centro esmaltado en rojo. Un toque de color muy distinto.

• Material: oro 18k nacional
• Estilo: Trébol con esmalte rojo
• Medida: 0.7 g
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 0, 7, 'porcentaje', 13, 0, 1, 0, '0.7 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (37, 'KP-037', 'Topos trébol rojo — modelo 2', 'topos-tr-ebol-rojo-modelo-2-37', 'Presentación en tira de 6 pares.

• Material: oro 18k nacional
• Estilo: Trébol esmaltado
• Medida: 0.7 g
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 75000, 6, 'ninguno', 0, 0, 0, 0, '0.7 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (38, 'KP-038', 'Topos trébol grande diamantado', 'topos-tr-ebol-grande-diamantado-38', 'La versión grande del trébol, para quien busca algo que se note.

• Material: oro 18k nacional
• Estilo: Trébol grande con borde perlado
• Medida: 1.6 g y 1.7 g
• Peso de referencia: 1,65 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 1.65, 0, 25000, 4, 'ninguno', 0, 0, 1, 0, '1.6 g y 1.7 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (39, 'KP-039', 'Topos Virgen de Guadalupe', 'topos-virgen-de-guadalupe-39', 'Medalla ovalada de la Virgen de Guadalupe, con la inscripción en el borde.

• Material: oro 18k nacional
• Estilo: Medalla ovalada en relieve
• Medida: 0.6 g a 0.8 g
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 25000, 4, 'ninguno', 0, 0, 1, 0, '0.6 g a 0.8 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (40, 'KP-040', 'Topos Virgen Milagrosa', 'topos-virgen-milagrosa-40', 'Medalla de la Virgen Milagrosa con la oración alrededor.

• Material: oro 18k nacional
• Estilo: Medalla ovalada en relieve
• Medida: 0.6 g y 0.7 g
• Peso de referencia: 0,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.6, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '0.6 g y 0.7 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (41, 'KP-041', 'Argollas criollas — surtido de 8', 'argollas-criollas-surtido-de-8-41', 'Ocho modelos distintos: lisas, torcidas y con corte diamantado.

• Material: oro 18k italiano ley 750
• Estilo: Lisas, torzal y diamantadas
• Medida: 0.9 g a 1.3 g
• Peso de referencia: 1,2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'italiano', 1.2, 0, 0, 8, 'ninguno', 0, 0, 1, 0, '0.9 g a 1.3 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (42, 'KP-042', 'Topos trébol diamantado 1 g', 'topos-tr-ebol-diamantado-1-g-42', 'El trébol en su peso más equilibrado: 1 g el par.

• Material: oro 18k nacional
• Estilo: Trébol con borde perlado
• Medida: 1.0 g
• Peso de referencia: 1 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 1, 0, 0, 8, 'ninguno', 0, 0, 1, 0, '1.0 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (43, 'KP-043', 'Argollas criollas — modelos gruesos', 'argollas-criollas-modelos-gruesos-43', 'Criollas de mayor calibre, con acabados torcidos y diamantados.

• Material: oro 18k italiano ley 750
• Estilo: Torzal y diamantadas
• Medida: 1.1 g a 1.9 g
• Peso de referencia: 1,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'italiano', 1.5, 0, 0, 6, 'porcentaje', 14, 0, 1, 0, '1.1 g a 1.9 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (44, 'KP-044', 'Argollas criollas — surtido mediano', 'argollas-criollas-surtido-mediano-44', 'Ocho modelos en pesos medios, muy cómodas para uso diario.

• Material: oro 18k italiano ley 750
• Estilo: Lisas y diamantadas
• Medida: 1.0 g a 1.4 g
• Peso de referencia: 1,2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'italiano', 1.2, 0, 50000, 5, 'ninguno', 0, 0, 1, 0, '1.0 g a 1.4 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (45, 'KP-045', 'Argollas criollas torzal', 'argollas-criollas-torzal-45', 'El tejido torcido que le da movimiento y brillo desde cualquier ángulo.

• Material: oro 18k italiano ley 750
• Estilo: Torzal trenzado
• Medida: 1.0 g a 1.6 g
• Peso de referencia: 1,3 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'italiano', 1.3, 0, 0, 6, 'ninguno', 0, 0, 1, 0, '1.0 g a 1.6 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (46, 'KP-046', 'Topos corona con circones', 'topos-corona-con-circones-46', 'La corona con circón blanco en cada punta. Muy vistosos.

• Material: oro 18k nacional
• Estilo: Corona con circones en las puntas
• Medida: 1.3 g y 1.4 g
• Peso de referencia: 1,35 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 1.35, 0, 25000, 4, 'ninguno', 0, 1, 1, 0, '1.3 g y 1.4 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (47, 'KP-047', 'Argollas criollas — surtido grande', 'argollas-criollas-surtido-grande-47', 'Ocho modelos, del más fino al más grueso.

• Material: oro 18k italiano ley 750
• Estilo: Diamantadas y lisas
• Medida: 1.1 g a 1.9 g
• Peso de referencia: 1,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'italiano', 1.5, 0, 75000, 8, 'ninguno', 0, 0, 1, 0, '1.1 g a 1.9 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (48, 'KP-048', 'Topos corona en disco', 'topos-corona-en-disco-48', 'La corona grabada dentro de un disco con borde de perlitas.

• Material: oro 18k nacional
• Estilo: Corona dentro de disco perlado
• Medida: Ø 6 mm
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 75000, 4, 'ninguno', 0, 0, 1, 0, 'Ø 6 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (49, 'KP-049', 'Topos corona mini', 'topos-corona-mini-49', 'La versión más discreta de la corona: 0.5 g el par.

• Material: oro 18k nacional
• Estilo: Corona pequeña
• Medida: 5 mm
• Peso de referencia: 0,5 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.5, 0, 75000, 3, 'ninguno', 0, 0, 1, 0, '5 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (50, 'KP-050', 'Topos corona — 2 pesos', 'topos-corona-2-pesos-50', 'Dos pesos del mismo modelo, según qué tan marcada la quieras.

• Material: oro 18k nacional
• Estilo: Corona de cinco puntas
• Medida: 0.6 g y 0.7 g
• Peso de referencia: 0,7 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 5, 'gramo', 'nacional', 0.7, 0, 75000, 5, 'porcentaje', 5, 0, 1, 0, '0.6 g y 0.7 g', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (51, 'KP-051', 'Pulsera rosario italiana con cruz', 'pulsera-rosario-italiana-con-cruz-51', 'Pulsera tipo rosario con cruz y medalla de la Virgen. También en versión con bolitas tricolor.

• Material: oro 18k italiano ley 750
• Estilo: Cadena de bolitas con cruz y medalla
• Medida: 19 cm
• Peso de referencia: 1,6 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.6, 0, 0, 7, 'ninguno', 0, 0, 1, 0, '19 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (52, 'KP-052', 'Pulsera figaro 3 en 1 italiana', 'pulsera-figaro-3-en-1-italiana-52', 'El tejido figaro clásico: tres eslabones cortos y uno largo. Marcada ITALY.

• Material: oro 18k italiano ley 750
• Estilo: Tejido figaro (3 en 1)
• Medida: 20 cm
• Peso de referencia: 1,9 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.9, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (53, 'KP-053', 'Pulsos cubanos italianos', 'pulsos-cubanos-italianos-53', 'Ocho pesos disponibles, de 1.42 g a 3.15 g. Marcados 18k italiano.

• Material: oro 18k italiano ley 750
• Estilo: Tejido cubano
• Medida: 18 y 20 cm
• Peso de referencia: 1,9 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.9, 0, 0, 3, 'ninguno', 0, 0, 1, 0, '18 y 20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (54, 'KP-054', 'Pulseras italianas con charms', 'pulseras-italianas-con-charms-54', 'Con mariposas, lunas y estrellitas colgando. De 2 g a 2.1 g.

• Material: oro 18k italiano ley 750
• Estilo: Cadena fina con dijes colgantes
• Medida: 18 y 19 cm
• Peso de referencia: 2,05 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 2.05, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '18 y 19 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (55, 'KP-055', 'Pulsera cubano doble italiana', 'pulsera-cubano-doble-italiana-55', 'Tejido cubano de doble eslabón, marcada ITALY en el broche.

• Material: oro 18k italiano ley 750
• Estilo: Tejido cubano doble
• Medida: 18 cm
• Peso de referencia: 1,53 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.53, 0, 75000, 4, 'ninguno', 0, 1, 1, 0, '18 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (56, 'KP-056', 'Pulsos tejido chino livianos', 'pulsos-tejido-chino-livianos-56', 'Livianos y flexibles, de 1.05 g a 1.17 g. Muy cómodos para el día a día.

• Material: oro 18k italiano ley 750
• Estilo: Tejido chino redondo
• Medida: 18 y 20 cm
• Peso de referencia: 1,1 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.1, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '18 y 20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (57, 'KP-057', 'Esclavas italianas', 'esclavas-italianas-57', 'Placa lisa lista para grabar el nombre. Ideal para bebé o niña.

• Material: oro 18k italiano ley 750
• Estilo: Placa lisa para grabar
• Medida: 15 cm
• Peso de referencia: 2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 2, 0, 25000, 3, 'porcentaje', 5, 0, 1, 0, '15 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (58, 'KP-058', 'Pulsera tejido franco italiana', 'pulsera-tejido-franco-italiana-58', 'Tejido franco compacto, se ve macizo pero es muy liviana.

• Material: oro 18k italiano ley 750
• Estilo: Tejido franco (espiga)
• Medida: Ajustable
• Peso de referencia: 1,2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.2, 0, 50000, 4, 'ninguno', 0, 0, 1, 0, 'Ajustable', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (59, 'KP-059', 'Pulseras ojo turco italianas', 'pulseras-ojo-turco-italianas-59', 'Con ojos turcos azules o blancos entre bolitas diamantadas. Para la buena suerte.

• Material: oro 18k italiano ley 750
• Estilo: Cadena con ojos turcos esmaltados
• Medida: 20 cm
• Peso de referencia: 2,2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 2.2, 0, 25000, 3, 'ninguno', 0, 0, 1, 0, '20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (60, 'KP-060', 'Pulseras figaro 3 en 1 livianas', 'pulseras-figaro-3-en-1-livianas-60', 'Las más livianas del figaro: de 0.9 g a 1 g.

• Material: oro 18k italiano ley 750
• Estilo: Tejido figaro
• Medida: 18 · 19.5 · 20 cm
• Peso de referencia: 0,95 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 0.95, 0, 25000, 3, 'ninguno', 0, 0, 1, 0, '18 · 19.5 · 20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (61, 'KP-061', 'Pulsos lazo italianos', 'pulsos-lazo-italianos-61', 'Cinco pesos: de 1.2 g a 4.75 g. El tejido lazo es de los más resistentes.

• Material: oro 18k italiano ley 750
• Estilo: Tejido lazo (cordón torcido)
• Medida: 18 · 19 · 20 cm
• Peso de referencia: 1,3 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.3, 0, 0, 5, 'ninguno', 0, 0, 1, 0, '18 · 19 · 20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (62, 'KP-062', 'Pulseras ojo turco — modelo 2', 'pulseras-ojo-turco-modelo-2-62', 'Versión con ojo azul oscuro y versión con ojo blanco.

• Material: oro 18k italiano ley 750
• Estilo: Cadena con ojos turcos
• Medida: 20 cm
• Peso de referencia: 2,2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 2.2, 0, 0, 8, 'ninguno', 0, 0, 0, 0, '20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (63, 'KP-063', 'Pulseras tejido chino 3 mm', 'pulseras-tejido-chino-3-mm-63', 'Malla plana de 3 mm, de 1.8 g a 2 g. Se ve mucho más de lo que pesa.

• Material: oro 18k italiano ley 750
• Estilo: Tejido chino plano 3 mm
• Medida: 18 y 20 cm
• Peso de referencia: 1,9 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 1.9, 0, 0, 8, 'ninguno', 0, 0, 1, 0, '18 y 20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (64, 'KP-064', 'Pulseras tejido chino 6 mm', 'pulseras-tejido-chino-6-mm-64', 'Malla ancha de 6 mm, de 3.3 g a 3.45 g. Muy elegante en la muñeca.

• Material: oro 18k italiano ley 750
• Estilo: Tejido chino plano 6 mm
• Medida: 20 y 21 cm
• Peso de referencia: 3,4 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 3.4, 0, 0, 8, 'porcentaje', 6, 1, 1, 0, '20 y 21 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (65, 'KP-065', 'Pulseras tejido chino 6 mm reforzado', 'pulseras-tejido-chino-6-mm-reforzado-65', 'La versión más gruesa: 4.45 g y 4.5 g.

• Material: oro 18k italiano ley 750
• Estilo: Tejido chino plano 6 mm
• Medida: 20 cm
• Peso de referencia: 4,48 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 4.48, 0, 0, 2, 'ninguno', 0, 0, 1, 0, '20 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (66, 'KP-066', 'Cadenas italianas 45 cm — finas', 'cadenas-italianas-45-cm-finas-66', 'Seis modelos entre 1.82 g y 2 g. Perfectas para llevar un dije.

• Material: oro 18k italiano ley 750
• Estilo: Singapur y figaro
• Medida: 45 cm · 2 a 2.1 mm
• Peso de referencia: 1,9 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 1.9, 0, 0, 4, 'ninguno', 0, 0, 1, 0, '45 cm · 2 a 2.1 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (67, 'KP-067', 'Cadenas italianas 50 cm', 'cadenas-italianas-50-cm-67', 'Seis tejidos distintos, de 1.16 g a 3.5 g.

• Material: oro 18k italiano ley 750
• Estilo: Franco, lazo, singapur y espejo
• Medida: 50 cm · 1.6 a 3 mm
• Peso de referencia: 2,45 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 2.45, 0, 50000, 4, 'ninguno', 0, 0, 1, 0, '50 cm · 1.6 a 3 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (68, 'KP-068', 'Cadenas italianas 45 cm — surtido', 'cadenas-italianas-45-cm-surtido-68', 'Diez modelos, de 2.2 g a 3.4 g. Marcadas ITALY.

• Material: oro 18k italiano ley 750
• Estilo: Lazo, cubano, figaro y franco
• Medida: 45 cm · 1.6 a 3.3 mm
• Peso de referencia: 2,8 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 2.8, 0, 75000, 5, 'ninguno', 0, 0, 1, 0, '45 cm · 1.6 a 3.3 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (69, 'KP-069', 'Cadenas 45 cm livianas', 'cadenas-45-cm-livianas-69', 'Doce modelos livianos, de 0.7 g a 1.9 g. Las más económicas para empezar.

• Material: oro 18k italiano ley 750
• Estilo: Espejo, forzada, veneciana y figaro
• Medida: 45 cm
• Peso de referencia: 1,3 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 1.3, 0, 25000, 2, 'ninguno', 0, 0, 1, 0, '45 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (70, 'KP-070', 'Esclavas italianas — modelo 2', 'esclavas-italianas-modelo-2-70', 'Placa lista para grabar, en 1.95 g y 2 g.

• Material: oro 18k italiano ley 750
• Estilo: Placa lisa para grabar
• Medida: 15 cm
• Peso de referencia: 2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 2, 'gramo', 'italiano', 2, 0, 75000, 6, 'ninguno', 0, 0, 1, 0, '15 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (71, 'KP-071', 'Cadenas italianas 50 cm — surtido', 'cadenas-italianas-50-cm-surtido-71', 'Doce modelos, de 1.05 g a 4.66 g.

• Material: oro 18k italiano ley 750
• Estilo: Chino, veneciana, figaro y cubano
• Medida: 50 cm · 1.6 a 3.1 mm
• Peso de referencia: 2,8 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 2.8, 0, 25000, 5, 'porcentaje', 7, 0, 1, 0, '50 cm · 1.6 a 3.1 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (72, 'KP-072', 'Cadenas 50 cm livianas', 'cadenas-50-cm-livianas-72', 'Seis modelos livianos, de 0.9 g a 1.7 g.

• Material: oro 18k italiano ley 750
• Estilo: Cubano, bolitas y veneciana
• Medida: 50 cm
• Peso de referencia: 1,25 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 1.25, 0, 25000, 4, 'ninguno', 0, 0, 1, 0, '50 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (73, 'KP-073', 'Cadenas 45 cm livianas — modelo 2', 'cadenas-45-cm-livianas-modelo-2-73', 'Doce modelos livianos entre 0.7 g y 1.9 g.

• Material: oro 18k italiano ley 750
• Estilo: Surtido de tejidos
• Medida: 45 cm
• Peso de referencia: 1,3 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 1.3, 0, 0, 2, 'ninguno', 0, 1, 1, 0, '45 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 3, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (74, 'KP-074', 'Cadenas italianas 50 cm — medianas', 'cadenas-italianas-50-cm-medianas-74', 'Once modelos de 2.4 g a 3.85 g.

• Material: oro 18k italiano ley 750
• Estilo: Figaro, lazo, cubano y veneciana
• Medida: 50 cm · 1.7 a 3.2 mm
• Peso de referencia: 3,2 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 3.2, 0, 0, 6, 'ninguno', 0, 0, 1, 0, '50 cm · 1.7 a 3.2 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (75, 'KP-075', 'Cadenas italianas 45 cm — medianas', 'cadenas-italianas-45-cm-medianas-75', 'Diez modelos de 2.2 g a 3.4 g.

• Material: oro 18k italiano ley 750
• Estilo: Lazo, cubano y figaro
• Medida: 45 cm · 1.6 a 3.3 mm
• Peso de referencia: 2,8 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 2.8, 0, 0, 8, 'ninguno', 0, 0, 1, 0, '45 cm · 1.6 a 3.3 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (76, 'KP-076', 'Cadenas italianas 60 cm', 'cadenas-italianas-60-cm-76', 'Doce modelos de 2.6 g a 10.9 g. Para hombre o para llevar con dije grande.

• Material: oro 18k italiano ley 750
• Estilo: Chino, cubano, figaro y lazo
• Medida: 60 cm · 2 a 6 mm
• Peso de referencia: 4 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 4, 0, 0, 3, 'ninguno', 0, 0, 1, 0, '60 cm · 2 a 6 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 0, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (77, 'KP-077', 'Cadenas 50 cm livianas — modelo 2', 'cadenas-50-cm-livianas-modelo-2-77', 'Seis modelos de 0.9 g a 1.7 g.

• Material: oro 18k italiano ley 750
• Estilo: Surtido de tejidos
• Medida: 50 cm
• Peso de referencia: 1,25 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 1.25, 0, 0, 5, 'ninguno', 0, 0, 1, 0, '50 cm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 1, '2026-07-28 00:24:34');
INSERT INTO productos (id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos, precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado) VALUES (78, 'KP-078', 'Cadenas italianas 60 cm — gruesas', 'cadenas-italianas-60-cm-gruesas-78', 'Once modelos de 2.75 g a 11.3 g. Las más imponentes del catálogo.

• Material: oro 18k italiano ley 750
• Estilo: Cubano, chino, lazo y veneciana
• Medida: 60 cm · 1.8 a 4 mm
• Peso de referencia: 4,1 g
• Garantía de material

Escríbenos por WhatsApp y te mandamos video de la pieza antes de enviarla ✨', 1, 'gramo', 'italiano', 4.1, 0, 75000, 5, 'porcentaje', 15, 0, 1, 0, '60 cm · 1.8 a 4 mm', 'Revisar peso real y confirmar si se cobra por gramo o por joya.', 1, '2026-07-28 00:24:34');

INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (1, 1, 'productos/kp-001-1fe32.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (2, 2, 'productos/kp-002-65b44.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (3, 3, 'productos/kp-003-90081.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (4, 4, 'productos/kp-004-5098c.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (5, 5, 'productos/kp-005-a1df5.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (6, 6, 'productos/kp-006-9b836.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (7, 7, 'productos/kp-007-9ecb0.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (8, 8, 'productos/kp-008-0b58a.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (9, 9, 'productos/kp-009-93193.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (10, 10, 'productos/kp-010-04603.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (11, 11, 'productos/kp-011-f6956.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (12, 12, 'productos/kp-012-0b3a4.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (13, 13, 'productos/kp-013-95eb6.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (14, 14, 'productos/kp-014-6714e.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (15, 15, 'productos/kp-015-830f5.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (16, 16, 'productos/kp-016-45329.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (17, 17, 'productos/kp-017-e0e11.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (18, 18, 'productos/kp-018-2fa06.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (19, 19, 'productos/kp-019-4d1a7.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (20, 20, 'productos/kp-020-49db9.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (21, 21, 'productos/kp-021-47a99.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (22, 22, 'productos/kp-022-2fb37.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (23, 23, 'productos/kp-023-4ea0c.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (24, 24, 'productos/kp-024-3d46c.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (25, 25, 'productos/kp-025-66720.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (26, 26, 'productos/kp-026-4f78e.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (27, 27, 'productos/kp-027-bc808.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (28, 28, 'productos/kp-028-0cd9e.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (29, 29, 'productos/kp-029-cec3b.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (30, 30, 'productos/kp-030-587bd.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (31, 31, 'productos/kp-031-9902c.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (32, 32, 'productos/kp-032-83ae7.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (33, 33, 'productos/kp-033-b84ca.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (34, 34, 'productos/kp-034-c72e8.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (35, 35, 'productos/kp-035-73cf6.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (36, 36, 'productos/kp-036-09993.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (37, 37, 'productos/kp-037-6d641.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (38, 38, 'productos/kp-038-0e53a.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (39, 39, 'productos/kp-039-a83a7.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (40, 40, 'productos/kp-040-00dbb.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (41, 41, 'productos/kp-041-c4c51.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (42, 42, 'productos/kp-042-a8271.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (43, 43, 'productos/kp-043-d4bbc.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (44, 44, 'productos/kp-044-e4c85.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (45, 45, 'productos/kp-045-4c277.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (46, 46, 'productos/kp-046-101fe.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (47, 47, 'productos/kp-047-c0ac0.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (48, 48, 'productos/kp-048-3aa00.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (49, 49, 'productos/kp-049-8395e.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (50, 50, 'productos/kp-050-2882d.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (51, 51, 'productos/kp-051-e0d32.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (52, 52, 'productos/kp-052-d4bfc.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (53, 53, 'productos/kp-053-8a866.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (54, 54, 'productos/kp-054-decd5.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (55, 55, 'productos/kp-055-31cd7.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (56, 56, 'productos/kp-056-eb9ed.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (57, 57, 'productos/kp-057-0f7dc.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (58, 58, 'productos/kp-058-89dc1.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (59, 59, 'productos/kp-059-7bf47.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (60, 60, 'productos/kp-060-c6c69.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (61, 61, 'productos/kp-061-8bc28.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (62, 62, 'productos/kp-062-b3151.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (63, 63, 'productos/kp-063-54ba8.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (64, 64, 'productos/kp-064-d959a.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (65, 65, 'productos/kp-065-c36af.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (66, 66, 'productos/kp-066-1acf8.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (67, 67, 'productos/kp-067-ac95a.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (68, 68, 'productos/kp-068-b2c43.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (69, 69, 'productos/kp-069-8ec67.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (70, 70, 'productos/kp-070-b8cc4.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (71, 71, 'productos/kp-071-af2ed.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (72, 72, 'productos/kp-072-8ae50.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (73, 73, 'productos/kp-073-65b74.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (74, 74, 'productos/kp-074-3bbc0.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (75, 75, 'productos/kp-075-eabd1.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (76, 76, 'productos/kp-076-4fd43.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (77, 77, 'productos/kp-077-d5920.jpeg', 0);
INSERT INTO producto_imagenes (id, producto_id, clave, orden) VALUES (78, 78, 'productos/kp-078-043ff.jpeg', 0);
