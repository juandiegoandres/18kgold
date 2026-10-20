// Bolsa de compras en localStorage. Se guarda slug + cantidad + una foto de referencia
// (nombre, precio, imagen) para pintar rápido; el precio real se refresca con el catálogo.

const CLAVE = 'kp:bolsa:v1';
export const EVENTO = 'kp:bolsa';

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(datos) ? datos.filter((l) => l && l.slug && l.cantidad > 0) : [];
  } catch {
    return [];
  }
}

function escribir(lineas) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lineas));
  } catch {
    /* modo privado o almacenamiento bloqueado: la bolsa vive solo en esta página */
  }
  memoria = lineas;
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { cantidad: contar(lineas) } }));
}

let memoria = null;
const actual = () => memoria ?? (memoria = leer());

function contar(lineas) {
  return lineas.reduce((s, l) => s + l.cantidad, 0);
}

export function obtenerBolsa() {
  return actual().map((l) => ({ ...l }));
}

export function cantidadBolsa() {
  return contar(actual());
}

export function agregar(producto, cantidad = 1) {
  const lineas = obtenerBolsa();
  const l = lineas.find((x) => x.slug === producto.slug);
  if (l) l.cantidad = Math.min(20, l.cantidad + cantidad);
  else
    lineas.push({
      slug: producto.slug,
      cantidad: Math.min(20, cantidad),
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagenes?.[0] || '',
    });
  escribir(lineas);
}

export function fijarCantidad(slug, cantidad) {
  const lineas = obtenerBolsa()
    .map((l) => (l.slug === slug ? { ...l, cantidad: Math.max(0, Math.min(20, cantidad)) } : l))
    .filter((l) => l.cantidad > 0);
  escribir(lineas);
}

export function quitar(slug) {
  escribir(obtenerBolsa().filter((l) => l.slug !== slug));
}

export function vaciar() {
  escribir([]);
}

/** Refresca nombre/precio/imagen desde el catálogo y descarta lo que ya no existe. */
export function sincronizar(productos) {
  const porSlug = new Map(productos.map((p) => [p.slug, p]));
  const antes = obtenerBolsa();
  const lineas = antes
    .filter((l) => porSlug.has(l.slug))
    .map((l) => {
      const p = porSlug.get(l.slug);
      return { ...l, nombre: p.nombre, precio: p.precio, imagen: p.imagenes?.[0] || l.imagen };
    });
  if (JSON.stringify(lineas) !== JSON.stringify(antes)) escribir(lineas);
  return { lineas, retirados: antes.length - lineas.length };
}

// Otra pestaña cambió la bolsa
window.addEventListener('storage', (e) => {
  if (e.key !== CLAVE) return;
  memoria = leer();
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { cantidad: contar(memoria) } }));
});
