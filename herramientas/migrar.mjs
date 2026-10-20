#!/usr/bin/env node
// Migra la base del PHP (legado-php/data/18gold.sqlite) a una semilla SQL para D1.
// Uso:  node herramientas/migrar.mjs            → genera api/semilla.sql
//       node herramientas/migrar.mjs --aplicar  → además aplica esquema + semilla + migraciones a D1 LOCAL
//       node herramientas/migrar.mjs --aplicar --remote → a D1 remota
// Requiere Node 22.5+ (node:sqlite).
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = path.join(RAIZ, 'legado-php/data/18gold.sqlite');
const API = path.join(RAIZ, 'api');
const SALIDA = path.join(API, 'semilla.sql');

if (!existsSync(ORIGEN)) { console.error('No encuentro', ORIGEN); process.exit(1); }
const db = new DatabaseSync(ORIGEN, { readOnly: true });

const lit = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};
const insertar = (tabla, filas, cols) => filas.map((f) =>
  `INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${cols.map((c) => lit(f[c])).join(', ')});`).join('\n');

// Ajustes: se omiten las llaves de IA del PHP (ahora son secretos del Worker) y lo que ya no aplica.
const OMITIR = /^(anthropic_|live_|promo_|hero_|tiktok_live)/;
const ajustes = db.prepare('SELECT clave, valor FROM ajustes').all()
  .filter((a) => !OMITIR.test(a.clave))
  .map((a) => (a.clave.startsWith('envio_') ? { ...a, valor: String(a.valor).replace(/\D/g, '') } : a));

const categorias = db.prepare('SELECT id, nombre, slug, icono, orden FROM categorias ORDER BY id').all();
const historial = db.prepare('SELECT id, tipo, precio, creado FROM precios_historial ORDER BY id').all();
const productos = db.prepare(`SELECT id, sku, nombre, slug, descripcion, categoria_id, tipo_precio, tipo_oro, peso_gramos,
  precio_pieza, mano_obra, stock, descuento_tipo, descuento_val, destacado, activo, verificado, medidas, nota_admin, vistas, creado
  FROM productos ORDER BY id`).all().map((p) => ({ ...p, sku: p.sku || `KP-${String(p.id).padStart(3, '0')}` }));
const imagenes = db.prepare('SELECT id, producto_id, ruta, orden FROM producto_imagenes ORDER BY id').all()
  .map((i) => ({ ...i, clave: `productos/${i.ruta}` }));

const sql = `-- Semilla generada por herramientas/migrar.mjs el ${new Date().toISOString()}
-- Fuente: legado-php/data/18gold.sqlite. Reemplaza catálogo, categorías e historial de precios.
DELETE FROM producto_imagenes;
DELETE FROM productos;
DELETE FROM categorias;
DELETE FROM precios_historial;
DELETE FROM sqlite_sequence WHERE name IN ('producto_imagenes','productos','categorias','precios_historial');

${ajustes.map((a) => `INSERT INTO ajustes (clave, valor) VALUES (${lit(a.clave)}, ${lit(a.valor)}) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;`).join('\n')}
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('hechura_gramo', '60000');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('tejido_valor', '25000');

${insertar('categorias', categorias, ['id', 'nombre', 'slug', 'icono', 'orden'])}

${insertar('precios_historial', historial, ['id', 'tipo', 'precio', 'creado'])}

${insertar('productos', productos, ['id', 'sku', 'nombre', 'slug', 'descripcion', 'categoria_id', 'tipo_precio', 'tipo_oro', 'peso_gramos',
  'precio_pieza', 'mano_obra', 'stock', 'descuento_tipo', 'descuento_val', 'destacado', 'activo', 'verificado', 'medidas', 'nota_admin', 'vistas', 'creado'])}

${insertar('producto_imagenes', imagenes, ['id', 'producto_id', 'clave', 'orden'])}
`;
writeFileSync(SALIDA, sql);
console.log(`semilla.sql: ${ajustes.length} ajustes, ${categorias.length} categorías, ${productos.length} productos ` +
  `(${productos.filter((p) => p.activo).length} activos), ${imagenes.length} imágenes, ${historial.length} precios históricos.`);

if (process.argv.includes('--aplicar')) {
  const destino = process.argv.includes('--remote') ? '--remote' : '--local';
  for (const f of ['esquema.sql', 'semilla.sql']) {
    console.log(`Aplicando ${f} (${destino})…`);
    execFileSync('npx', ['wrangler', 'd1', 'execute', '18gold', destino, `--file=${f}`, '--yes'], { cwd: API, stdio: 'inherit' });
  }
  // Migraciones incrementales (api/migraciones/): wrangler lleva el registro y no repite las ya aplicadas.
  console.log(`Aplicando migraciones (${destino})…`);
  execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', '18gold', destino], { cwd: API, stdio: 'inherit', env: { ...process.env, CI: '1' } });
}
