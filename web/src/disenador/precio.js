// Precio estimado de un diseño personalizado (ARQUITECTURA.md §1 y §5), igual que el Worker:
//   peso_pieza = round2(peso de la pieza)
//   peso_oro   = round2(peso_pieza + cantidad × peso_balin)
//   precio     = round100(peso_oro × gramo[tipo_oro] + peso_pieza × hechura_gramo + (tejido ? tejido_valor : 0))
// La cadena de oro no entra (se cotiza aparte). Sin soporte no hay balines.

import { pesoBalin } from './montaje.js';

export const PRECIOS_REFERENCIA = { nacional: 352000, italiano: 410000, hechura_gramo: 60000, tejido_valor: 25000, referencial: true };

const r2 = (n) => Math.round(n * 100) / 100;

export function desglosePrecio(pesoG, tipoOro, tarifas = PRECIOS_REFERENCIA, montaje = null) {
  const gramo = Number(tarifas[tipoOro]) || PRECIOS_REFERENCIA[tipoOro] || PRECIOS_REFERENCIA.nacional;
  const hechura = Number(tarifas.hechura_gramo) || PRECIOS_REFERENCIA.hechura_gramo;
  const soporte = montaje?.soporte || 'ninguno';
  const cantidad = soporte === 'ninguno' ? 0 : Number(montaje?.balines?.cantidad) || 0;
  const diametro = Number(montaje?.balines?.diametro) || 4;
  const balin = cantidad ? pesoBalin(diametro) : 0;
  const tejido = soporte === 'tejido' ? (Number(tarifas.tejido_valor) || PRECIOS_REFERENCIA.tejido_valor) : 0;
  const pesoPieza = r2(pesoG);
  const pesoOro = r2(pesoPieza + cantidad * balin);
  const precio = Math.round((pesoOro * gramo + pesoPieza * hechura + tejido) / 100) * 100;
  return { precio, peso_pieza: pesoPieza, peso_oro: pesoOro, cantidad, peso_balin: balin, diametro, tejido, gramo, hechura, cadena_aparte: soporte === 'cadena' };
}

export function calcularPrecio(pesoG, tipoOro, tarifas = PRECIOS_REFERENCIA, montaje = null) {
  return desglosePrecio(pesoG, tipoOro, tarifas, montaje).precio;
}

// Lee /api/catalogo (con tiempo límite). Si falla, devuelve las tarifas de referencia.
export async function cargarTarifas(api, ms = 5000) {
  if (!api) return { ...PRECIOS_REFERENCIA };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const r = await fetch(`${api.replace(/\/$/, '')}/api/catalogo`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const nacional = Number(d?.precios?.nacional), italiano = Number(d?.precios?.italiano);
    if (!nacional || !italiano) throw new Error('sin precios');
    return {
      nacional, italiano,
      hechura_gramo: Number(d?.ajustes?.hechura_gramo) || PRECIOS_REFERENCIA.hechura_gramo,
      tejido_valor: Number(d?.ajustes?.tejido_valor) || PRECIOS_REFERENCIA.tejido_valor,
      whatsapp: d?.ajustes?.whatsapp || null,
      actualizado: d?.precios?.actualizado || null,
      referencial: false,
    };
  } catch {
    return { ...PRECIOS_REFERENCIA };
  }
}

export const formatoPesos = (n) => '$' + Math.round(n).toLocaleString('es-CO');
