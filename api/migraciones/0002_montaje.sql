-- 0002 · montaje de los diseños (ARQUITECTURA §5) y ajuste tejido_valor.
-- La 0001 es esquema.sql (CREATE ... IF NOT EXISTS). Esta se aplica con el registro de migraciones de
-- wrangler (tabla d1_migrations), que la corre UNA sola vez por base:
--   npx wrangler d1 migrations apply 18gold --local     (o --remote)
-- SQLite no tiene ADD COLUMN IF NOT EXISTS: no correrla a mano con `d1 execute` dos veces.

-- JSON del montaje ya validado: {soporte, cadena?|tejido?, balines}
ALTER TABLE disenos ADD COLUMN montaje TEXT NOT NULL DEFAULT '{}';
-- peso_estimado = solo la pieza (lo que se funde); peso_oro = pieza + balines
ALTER TABLE disenos ADD COLUMN peso_oro REAL NOT NULL DEFAULT 0;
UPDATE disenos SET peso_oro = peso_estimado WHERE peso_oro = 0;

-- Mano de obra del tejido en nylon (se suma al precio cuando soporte = tejido). Cambia con /tejido.
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('tejido_valor', '25000');
