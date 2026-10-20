import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-página: cada carpeta con index.html es una URL limpia en GitHub Pages.
const paginas = ['', 'catalogo', 'joya', 'disena', 'carrito', 'como-comprar'];

export default defineConfig({
  base: process.env.BASE ?? '/',
  build: {
    rollupOptions: {
      input: Object.fromEntries(paginas.map((p) => [p || 'inicio', resolve(__dirname, p, 'index.html')])),
    },
  },
});
