#!/usr/bin/env node
// Sube legado-php/public/uploads/productos/* al bucket R2 como productos/<archivo>.
// Uso:  node herramientas/subir-imagenes.mjs --local   (R2 simulado de wrangler dev)
//       node herramientas/subir-imagenes.mjs --remote  (R2 real; requiere wrangler login)
import { readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const correr = promisify(execFile);
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.join(RAIZ, 'legado-php/public/uploads/productos');
const API = path.join(RAIZ, 'api');
const destino = process.argv.includes('--remote') ? '--remote' : '--local';
const TIPOS = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

const archivos = readdirSync(CARPETA).filter((f) => TIPOS[f.split('.').pop().toLowerCase()]);
console.log(`Subiendo ${archivos.length} imágenes a 18gold-archivos/productos (${destino})…`);

let ok = 0, fallas = 0;
const pendientes = [...archivos];
async function trabajador() {
  while (pendientes.length) {
    const f = pendientes.shift();
    let ultimoError;
    for (let intento = 1; intento <= 3; intento++) {
      try {
        await correr('npx', ['wrangler', 'r2', 'object', 'put', `18gold-archivos/productos/${f}`, '--file', path.join(CARPETA, f),
          '--content-type', TIPOS[f.split('.').pop().toLowerCase()], destino], { cwd: API });
        ultimoError = null;
        break;
      } catch (e) {
        ultimoError = e;
        await new Promise((r) => setTimeout(r, 1000 * intento));
      }
    }
    if (ultimoError) {
      fallas++;
      console.error(`\n${f}: ${String(ultimoError.stderr || ultimoError.message).slice(0, 300)}`);
    } else {
      ok++;
      process.stdout.write('.');
    }
  }
}
// En local el R2 simulado es SQLite y no admite escrituras simultáneas: de a una.
await Promise.all(Array.from({ length: destino === '--local' ? 1 : 6 }, trabajador));
console.log(`\nListo: ${ok} subidas, ${fallas} fallas.`);
process.exit(fallas ? 1 : 0);
