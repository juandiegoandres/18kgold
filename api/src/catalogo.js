// Catálogo público: productos activos con el precio ya resuelto.
import { json, numeroAjuste, ErrorHttp } from './util.js';
import { leerAjustes, preciosGramo, calcularPrecio, hechuraGramo, tejidoValor, ultimaActualizacion } from './precios.js';

const SELECT_PRODUCTO = `
  SELECT p.*, c.slug AS categoria_slug, c.nombre AS categoria_nombre
  FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id`;

export const urlImagen = (base, clave) => `${base}/img/${clave.split('/').map(encodeURIComponent).join('/')}`;

/** Fila de BD → objeto Producto del contrato (§2). */
export function aProducto(fila, imagenes, precios, base) {
  const { base: antes, final, ahorro } = calcularPrecio(fila, precios);
  return {
    id: fila.id,
    slug: fila.slug,
    sku: fila.sku || '',
    nombre: fila.nombre,
    descripcion: fila.descripcion || '',
    categoria: fila.categoria_slug || null,
    categoria_nombre: fila.categoria_nombre || null,
    tipo_oro: fila.tipo_oro,
    tipo_precio: fila.tipo_precio,
    peso_gramos: Number(fila.peso_gramos) || 0,
    medidas: fila.medidas || '',
    precio: final,
    precio_antes: ahorro > 0 ? antes : null,
    destacado: !!fila.destacado,
    imagenes: (imagenes || []).map((c) => urlImagen(base, c)),
    creado: fila.creado,
  };
}

/** Imágenes agrupadas por producto_id. */
async function imagenesPorProducto(env, ids = null) {
  let rs;
  if (ids) {
    if (!ids.length) return {};
    rs = await env.DB.prepare(`SELECT producto_id, clave FROM producto_imagenes WHERE producto_id IN (${ids.map(() => '?').join(',')}) ORDER BY orden, id`).bind(...ids).all();
  } else {
    rs = await env.DB.prepare('SELECT producto_id, clave FROM producto_imagenes ORDER BY orden, id').all();
  }
  const m = {};
  for (const r of rs.results) (m[r.producto_id] ||= []).push(r.clave);
  return m;
}

export async function getCatalogo(request, env) {
  const base = new URL(request.url).origin;
  const [ajustes, cats, prods, imgs, actualizado] = await Promise.all([
    leerAjustes(env),
    env.DB.prepare('SELECT slug, nombre, orden FROM categorias ORDER BY orden, id').all(),
    env.DB.prepare(`${SELECT_PRODUCTO} WHERE p.activo = 1 ORDER BY p.destacado DESC, p.id DESC`).all(),
    imagenesPorProducto(env),
    ultimaActualizacion(env),
  ]);
  const precios = preciosGramo(ajustes);
  return json({
    marca: ajustes.marca || '18gold KPrada',
    precios: { ...precios, actualizado },
    ajustes: {
      whatsapp: ajustes.whatsapp || '',
      instagram: ajustes.instagram || '',
      tiktok: ajustes.tiktok || '',
      anuncio: ajustes.anuncio || '',
      hechura_gramo: hechuraGramo(ajustes),
      tejido_valor: tejidoValor(ajustes),
      envio_valor: numeroAjuste(ajustes.envio_valor),
      envio_gratis_desde: numeroAjuste(ajustes.envio_gratis_desde),
    },
    categorias: cats.results,
    productos: prods.results.map((p) => aProducto(p, imgs[p.id], precios, base)),
  }, 200, { 'cache-control': 'public, max-age=60' });
}

export async function getProducto(request, env, slug) {
  const base = new URL(request.url).origin;
  const fila = await env.DB.prepare(`${SELECT_PRODUCTO} WHERE p.slug = ? AND p.activo = 1`).bind(slug).first();
  if (!fila) throw new ErrorHttp(404, 'No encontramos esa joya.');

  const rel = await env.DB.prepare(
    `${SELECT_PRODUCTO} WHERE p.activo = 1 AND p.id <> ? AND p.categoria_id IS ? ORDER BY p.destacado DESC, p.id DESC LIMIT 4`
  ).bind(fila.id, fila.categoria_id).all();

  const ajustes = await leerAjustes(env);
  const precios = preciosGramo(ajustes);
  const imgs = await imagenesPorProducto(env, [fila.id, ...rel.results.map((r) => r.id)]);
  // contador de vistas sin bloquear la respuesta
  env.DB.prepare('UPDATE productos SET vistas = vistas + 1 WHERE id = ?').bind(fila.id).run().catch(() => {});

  return json({
    ...aProducto(fila, imgs[fila.id], precios, base),
    relacionados: rel.results.map((r) => aProducto(r, imgs[r.id], precios, base)),
  }, 200, { 'cache-control': 'public, max-age=60' });
}

/** Busca un producto por sku o slug (bot). Incluye inactivos. */
export async function buscarProducto(env, ref) {
  return env.DB.prepare(`${SELECT_PRODUCTO} WHERE UPPER(p.sku) = UPPER(?) OR p.slug = ? OR CAST(p.id AS TEXT) = ? LIMIT 1`)
    .bind(ref, ref, ref).first();
}

export { SELECT_PRODUCTO };
