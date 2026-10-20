// Qué recursos (tipografías, mapas de alturas) necesita cada pieza, y la carga de los mapas.
// Lo usan el Worker y el respaldo en el hilo principal.
import { FUENTES } from './fuentes.js';

// Mapas de alturas (PNG en gris) → { ancho, alto, datos } (luminancia).
export async function cargarImagenGris(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('No se pudo cargar el relieve');
  const bmp = await createImageBitmap(await r.blob());
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const px = g.getImageData(0, 0, bmp.width, bmp.height).data;
  const datos = new Uint8Array(bmp.width * bmp.height);
  for (let i = 0; i < datos.length; i++) datos[i] = px[i * 4];
  return { ancho: bmp.width, alto: bmp.height, datos };
}
// Qué fuentes e imágenes necesita cada pieza.
export function recursosDe(tipo, p = {}) {
  const fuentes = [], imgs = [];
  if (tipo === 'nombre' || tipo === 'inicial') fuentes.push(FUENTES[p.fuente] ? p.fuente : (tipo === 'nombre' ? 'script1' : 'serif'));
  if (tipo === 'medalla') { fuentes.push('serif'); imgs.push(p.motivo || 'san_benito'); }
  if (tipo === 'cruz' && p.cristo) imgs.push('cristo');
  if (tipo === 'motivo' && p.figura === 'mama') fuentes.push('script1');
  return { fuentes, imgs };
}
