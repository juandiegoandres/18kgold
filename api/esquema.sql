-- 18gold KPrada — esquema D1 (SQLite)
-- Local:   npx wrangler d1 execute 18gold --local  --file=esquema.sql
-- Remoto:  npx wrangler d1 execute 18gold --remote --file=esquema.sql
-- Idempotente: se puede volver a correr sin perder datos.

CREATE TABLE IF NOT EXISTS ajustes (
  clave  TEXT PRIMARY KEY,
  valor  TEXT
);

-- Historial de cambios del precio del gramo (tipo = nacional | italiano | hechura)
CREATE TABLE IF NOT EXISTS precios_historial (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo    TEXT NOT NULL,
  precio  REAL NOT NULL,
  creado  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT NOT NULL,
  slug    TEXT NOT NULL UNIQUE,
  icono   TEXT DEFAULT '',
  orden   INTEGER DEFAULT 0
);

-- El precio NO se guarda: se calcula (ver src/precios.js)
CREATE TABLE IF NOT EXISTS productos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sku             TEXT,
  nombre          TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  descripcion     TEXT DEFAULT '',
  categoria_id    INTEGER REFERENCES categorias(id),
  tipo_precio     TEXT DEFAULT 'gramo',     -- gramo | pieza
  tipo_oro        TEXT DEFAULT 'nacional',  -- nacional | italiano
  peso_gramos     REAL DEFAULT 0,
  precio_pieza    REAL DEFAULT 0,
  mano_obra       REAL DEFAULT 0,
  stock           INTEGER DEFAULT 1,
  descuento_tipo  TEXT DEFAULT 'ninguno',   -- ninguno | porcentaje | valor
  descuento_val   REAL DEFAULT 0,
  destacado       INTEGER DEFAULT 0,
  activo          INTEGER DEFAULT 1,
  verificado      INTEGER DEFAULT 1,
  medidas         TEXT DEFAULT '',
  nota_admin      TEXT DEFAULT '',
  vistas          INTEGER DEFAULT 0,
  creado          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo, destacado);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);

-- clave = clave del objeto en R2 (p. ej. productos/kp-001-1fe32.jpeg)
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  clave        TEXT NOT NULL,
  orden        INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_imagenes_producto ON producto_imagenes(producto_id, orden);

-- Códigos de cliente KP-XXXXX que Carlos genera desde Telegram
CREATE TABLE IF NOT EXISTS codigos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo       TEXT NOT NULL UNIQUE,
  cliente      TEXT NOT NULL,
  max_disenos  INTEGER NOT NULL DEFAULT 5,
  usados       INTEGER NOT NULL DEFAULT 0,
  expira       TEXT NOT NULL,              -- ISO 8601 UTC
  anulado      INTEGER NOT NULL DEFAULT 0,
  creado_por   TEXT DEFAULT '',
  creado       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Columnas montaje y peso_oro: migraciones/0002_montaje.sql (correr después de este archivo)
CREATE TABLE IF NOT EXISTS disenos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  folio            TEXT UNIQUE,            -- D-000123
  codigo_id        INTEGER REFERENCES codigos(id),
  codigo           TEXT NOT NULL,
  cliente          TEXT DEFAULT '',
  tipo             TEXT NOT NULL,          -- nombre | inicial | placa | anillo | medalla | cruz | motivo
  parametros       TEXT NOT NULL,          -- JSON ya validado
  tipo_oro         TEXT DEFAULT 'nacional',
  peso_estimado    REAL DEFAULT 0,
  precio_estimado  REAL DEFAULT 0,         -- recalculado en el servidor
  precio_cliente   REAL DEFAULT 0,         -- lo que mostró el front (referencia)
  nota             TEXT DEFAULT '',
  clave_stl        TEXT DEFAULT '',
  clave_png        TEXT DEFAULT '',        -- disenos/D-000123-<16 hex>.png (sufijo aleatorio)
  estado           TEXT DEFAULT 'nuevo',
  creado           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedidos (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  folio             TEXT UNIQUE,           -- P-000123
  cliente_nombre    TEXT NOT NULL,
  cliente_whatsapp  TEXT NOT NULL,
  ciudad            TEXT DEFAULT '',
  direccion         TEXT DEFAULT '',
  subtotal          REAL DEFAULT 0,
  envio             REAL DEFAULT 0,
  total             REAL DEFAULT 0,
  nota              TEXT DEFAULT '',
  estado            TEXT DEFAULT 'nuevo',
  creado            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedido_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id    INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id  INTEGER,
  slug         TEXT,
  nombre       TEXT,
  detalle      TEXT DEFAULT '',
  precio_unit  REAL DEFAULT 0,
  cantidad     INTEGER DEFAULT 1,
  subtotal     REAL DEFAULT 0
);

-- Borradores de producto creados al mandar fotos al bot (un álbum = un borrador)
CREATE TABLE IF NOT EXISTS borradores_bot (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id         TEXT NOT NULL,
  grupo           TEXT NOT NULL,           -- media_group_id o 'u<update_id>' si es una sola foto
  fotos           TEXT NOT NULL DEFAULT '[]', -- JSON: file_id de Telegram (la mayor resolución)
  claves          TEXT NOT NULL DEFAULT '[]', -- JSON: claves R2 ya descargadas
  texto           TEXT DEFAULT '',         -- pie de foto
  propuesta       TEXT DEFAULT '{}',       -- JSON: nombre, categoria, descripcion, medidas, peso_gramos, tipo_oro
  estado          TEXT DEFAULT 'recibiendo', -- recibiendo | listo | publicado | descartado
  mensaje_id      INTEGER,
  producto_id     INTEGER,
  creado          TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chat_id, grupo)
);

-- Límite de peticiones por IP (anti fuerza bruta de códigos)
CREATE TABLE IF NOT EXISTS limites (
  clave    TEXT PRIMARY KEY,               -- <uso>:<ip>
  inicio   INTEGER NOT NULL,               -- epoch s del inicio de la ventana
  conteo   INTEGER NOT NULL DEFAULT 0
);

-- Ajustes por defecto (la semilla de migración sobrescribe los que existan en el PHP)
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES
  ('marca', '18gold KPrada'),
  ('slogan', '¡Teje tu historia!'),
  ('precio_gramo_nacional', '352000'),
  ('precio_gramo_italiano', '410000'),
  ('hechura_gramo', '60000'),
  ('tejido_valor', '25000'),
  ('whatsapp', '573178861724'),
  ('instagram', '18GOLDKPRADA'),
  ('tiktok', '18goldKprada'),
  ('anuncio', ''),
  ('envio_valor', '15000'),
  ('envio_gratis_desde', '500000');
