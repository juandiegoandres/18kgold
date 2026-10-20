// SOLO DESARROLLO. Genera mapas de alturas (bajorrelieve) para las medallas con un modelo de imagen
// de OpenRouter. Lee la llave de ../../.secretos/openrouter.env en tiempo de ejecución (no la imprime ni la copia).
//   node herramientas/generar-relieves.mjs <carpeta-salida> [motivo ...] [--n 2] [--modelo id]
// Luego: python3 herramientas/limpiar-relieves.py <carpeta-salida> public/relieves
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const envTxt = fs.readFileSync(path.resolve(aqui, '../../.secretos/openrouter.env'), 'utf8');
const LLAVE = (envTxt.match(/^\s*OPENROUTER_API_KEY\s*=\s*"?([^"\n\r]+)"?/m) || [])[1];
if (!LLAVE) { console.error('Falta OPENROUTER_API_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const salida = args.shift();
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const N = Number(opt('--n', 2));
const MODELO = opt('--modelo', 'google/gemini-3.1-flash-image');

const BASE = 'Grayscale HEIGHT MAP (depth map) for die-striking a small gold medal in bas-relief. ' +
  'Pure black background (#000000) outside the figure. The figure is rendered ONLY with brightness = height: ' +
  'brighter is higher, darker is lower, smooth rounded sculpted volumes like a coin or medal die, soft gradients, ' +
  'clear readable silhouette with bold simple forms suitable for a 15 mm medal. ' +
  'Flat frontal view, no lighting, no cast shadows, no specular highlights, no color, no texture noise, ' +
  'NO text, NO letters, NO numbers, NO border, NO frame, NO rim, NO circle around it. ' +
  'Figure centered, filling about 85% of the square. Square 1:1 image.';

const MOTIVOS = {
  san_benito: 'Saint Benedict of Nursia standing in full figure, bearded monk in hooded Benedictine habit, holding a cross in his raised right hand and an open book (the Rule) in his left hand, frontal, traditional Saint Benedict medal iconography.',
  virgen_milagrosa: 'Our Lady of the Miraculous Medal, the Virgin Mary standing in full figure on a half globe, long veil and mantle, both arms lowered and open with rays of light coming down from her hands, crushing a serpent under her feet, frontal.',
  guadalupe: 'Our Lady of Guadalupe in full figure, hands joined in prayer at the chest, head slightly tilted, star-covered mantle covering her head, surrounded by a radiant almond-shaped aureole of straight rays, standing on a crescent moon held by a small angel, frontal.',
  divino_nino: 'The Divine Child Jesus (Divino Nino of Bogota): a young child Jesus standing in full figure, both arms raised and opened wide above shoulders, long tunic with a belt, small three-ray halo above his head, frontal.',
  sagrado_corazon: 'Sacred Heart of Jesus, half-length figure of Jesus with long hair and beard, robe and mantle, his right hand blessing and left hand pointing to the Sacred Heart on his chest, the heart surrounded by thorns with small flames and a cross on top, frontal.',
  espiritu_santo: 'The Holy Spirit as a dove descending, wings fully spread symmetrically, head down, tail fanned, with straight rays of light radiating behind it, frontal symmetric.',
  angel_guarda: 'Guardian angel in full figure with large spread feathered wings, long robe, gently protecting a small child at its side with one hand on the child shoulder, frontal.',
  cristo: 'The body of Christ crucified (corpus only, WITHOUT the cross), front view, arms outstretched perfectly horizontally, head inclined to the right, loincloth, feet together, slender elegant figure. The arms span the full width; the figure is tall and narrow like the letter T.',
};

const lista = args.length ? args : Object.keys(MOTIVOS);
fs.mkdirSync(salida, { recursive: true });

async function pedir(motivo, k) {
  const cuerpo = {
    model: MODELO,
    modalities: ['image', 'text'],
    messages: [{ role: 'user', content: `${BASE}\nSubject: ${MOTIVOS[motivo]}` }],
    image_config: { aspect_ratio: '1:1' },
  };
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LLAVE}`, 'Content-Type': 'application/json', 'X-Title': '18gold KPrada relieves (dev)' },
    body: JSON.stringify(cuerpo),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(d).slice(0, 300)}`);
  const img = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!img) throw new Error('sin imagen: ' + JSON.stringify(d).slice(0, 300));
  const [, ext, b64] = img.match(/^data:image\/(\w+);base64,(.*)$/s);
  const archivo = path.join(salida, `${motivo}-${k}.${ext === 'jpeg' ? 'jpg' : ext}`);
  fs.writeFileSync(archivo, Buffer.from(b64, 'base64'));
  return { archivo, costo: d.usage?.cost ?? null };
}

let total = 0;
const tareas = [];
for (const m of lista) for (let k = 1; k <= N; k++) tareas.push([m, k]);
await Promise.all(tareas.map(async ([m, k]) => {
  try { const r = await pedir(m, k); total += r.costo || 0; console.log('ok', r.archivo, r.costo); }
  catch (e) { console.log('fallo', m, k, e.message); }
}));
console.log('costo total USD ≈', total.toFixed(4));
