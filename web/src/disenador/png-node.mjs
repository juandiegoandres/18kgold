// Decodificador PNG mínimo para Node (pruebas y herramientas): 8 bits, gris / gris+alfa / RGB / RGBA,
// sin entrelazado. Devuelve { ancho, alto, datos: Uint8Array } en gris (canal de luminancia).
import zlib from 'node:zlib';

export function leerPNGGris(buf) {
  let o = 8, ancho = 0, alto = 0, tipo = 0, prof = 0;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), t = buf.toString('ascii', o + 4, o + 8);
    const d = buf.subarray(o + 8, o + 8 + len);
    if (t === 'IHDR') { ancho = d.readUInt32BE(0); alto = d.readUInt32BE(4); prof = d[8]; tipo = d[9]; if (d[12]) throw new Error('PNG entrelazado no soportado'); }
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    o += 12 + len;
  }
  if (prof !== 8) throw new Error('Solo PNG de 8 bits');
  const canales = { 0: 1, 4: 2, 2: 3, 6: 4 }[tipo];
  if (!canales) throw new Error('Tipo de PNG no soportado');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const fila = ancho * canales;
  const px = new Uint8Array(alto * fila);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < alto; y++) {
    const f = raw[y * (fila + 1)];
    const ini = y * (fila + 1) + 1;
    for (let x = 0; x < fila; x++) {
      const v = raw[ini + x];
      const a = x >= canales ? px[y * fila + x - canales] : 0;
      const b = y ? px[(y - 1) * fila + x] : 0;
      const c = y && x >= canales ? px[(y - 1) * fila + x - canales] : 0;
      px[y * fila + x] = (v + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? paeth(a, b, c) : 0)) & 255;
    }
  }
  const datos = new Uint8Array(ancho * alto);
  for (let i = 0; i < ancho * alto; i++) {
    if (canales <= 2) datos[i] = px[i * canales];
    else datos[i] = Math.round(0.299 * px[i * canales] + 0.587 * px[i * canales + 1] + 0.114 * px[i * canales + 2]);
  }
  return { ancho, alto, datos };
}
