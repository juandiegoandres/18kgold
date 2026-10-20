// Ajustes y cálculo de precios (misma fórmula que calcular_precio() del PHP).
import { numeroAjuste, ahoraIso } from './util.js';

export const DENSIDAD_ORO_18K = 15.5; // g/cm³

export async function leerAjustes(env) {
  const { results } = await env.DB.prepare('SELECT clave, valor FROM ajustes').all();
  const a = {};
  for (const r of results) a[r.clave] = r.valor;
  return a;
}

export async function fijarAjuste(env, clave, valor) {
  await env.DB.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor')
    .bind(clave, String(valor)).run();
}

export function preciosGramo(ajustes) {
  return {
    nacional: numeroAjuste(ajustes.precio_gramo_nacional),
    italiano: numeroAjuste(ajustes.precio_gramo_italiano),
  };
}

export const hechuraGramo = (ajustes) => numeroAjuste(ajustes.hechura_gramo, 60000);

/** Redondeo a la centena (round(x, -2) de PHP, mitad hacia arriba). */
export const centena = (n) => Math.round((Number(n) || 0) / 100) * 100;

/**
 * Devuelve { base, final, ahorro } — igual que el PHP: base y final se redondean por separado.
 */
export function calcularPrecio(p, precios) {
  let base;
  if ((p.tipo_precio || 'gramo') === 'pieza') {
    base = Number(p.precio_pieza) || 0;
  } else {
    const pg = p.tipo_oro === 'italiano' ? precios.italiano : precios.nacional;
    base = (Number(p.peso_gramos) || 0) * pg + (Number(p.mano_obra) || 0);
  }
  let final = base;
  const dv = Number(p.descuento_val) || 0;
  if (p.descuento_tipo === 'porcentaje' && dv > 0) final = base - (base * dv) / 100;
  else if (p.descuento_tipo === 'valor' && dv > 0) final = Math.max(0, base - dv);
  base = centena(base);
  final = centena(final);
  return { base, final, ahorro: Math.max(0, base - final) };
}

export const tejidoValor = (ajustes) => numeroAjuste(ajustes.tejido_valor, 25000);

export const PARED_BALIN_MM = 0.3;
/** Redondeo a 2 decimales (igual que el front). */
export const dosDecimales = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Balín = esfera HUECA de oro 18k, pared 0,3 mm (la perforación se ignora). Gramos, sin redondear. */
export function pesoBalin(diametroMm) {
  const r = Number(diametroMm) / 2;
  if (!(r > 0)) return 0;
  const ri = Math.max(0, r - PARED_BALIN_MM);
  const volumenMm3 = (4 / 3) * Math.PI * (r ** 3 - ri ** 3);
  return (DENSIDAD_ORO_18K / 1000) * volumenMm3;
}

/**
 * Diseño personalizado con montaje (ARQUITECTURA §5):
 *   peso_oro = peso_pieza + cantidad × peso_balin
 *   precio   = peso_oro × gramo[tipo_oro] + peso_pieza × hechura + (tejido ? tejido_valor : 0)   → a la centena
 * Los pesos se redondean a 2 decimales antes de cotizar. La cadena de oro NO entra (se cotiza aparte).
 */
export function cotizarDiseno(pesoPieza, tipoOro, ajustes, montaje = null) {
  const pieza = dosDecimales(pesoPieza);
  const n = montaje?.balines?.cantidad || 0;
  const unBalin = n ? pesoBalin(montaje.balines.diametro) : 0;
  const balines = dosDecimales(n * unBalin);
  const oro = dosDecimales(pieza + n * unBalin);
  const pg = preciosGramo(ajustes)[tipoOro === 'italiano' ? 'italiano' : 'nacional'];
  const tejido = montaje?.soporte === 'tejido' ? tejidoValor(ajustes) : 0;
  const precio = centena(oro * pg + pieza * hechuraGramo(ajustes) + tejido);
  return { peso_pieza: pieza, peso_balin: Math.round(unBalin * 10000) / 10000, peso_balines: balines, peso_oro: oro, tejido, precio };
}

/** Diseño sin montaje: peso × (gramo + hechura), a la centena. */
export const precioDiseno = (peso, tipoOro, ajustes) => cotizarDiseno(peso, tipoOro, ajustes).precio;

export async function actualizarPrecioGramo(env, tipo, valor) {
  const clave = { hechura: 'hechura_gramo', tejido: 'tejido_valor' }[tipo] || `precio_gramo_${tipo}`;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').bind(clave, String(valor)),
    env.DB.prepare('INSERT INTO precios_historial (tipo, precio, creado) VALUES (?, ?, ?)').bind(tipo, valor, ahoraIso()),
  ]);
}

export async function ultimaActualizacion(env) {
  const r = await env.DB.prepare("SELECT MAX(creado) AS f FROM precios_historial WHERE tipo IN ('nacional','italiano')").first();
  return r?.f || null;
}
