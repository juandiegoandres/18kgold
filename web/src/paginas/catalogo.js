import { montarLayout } from '../comun/layout.js';
import { revelar, refrescar } from '../comun/movimiento.js';
import { tarjetaJoya, activarFotos, estadoVacio } from '../comun/tarjeta.js';
import { esc, ruta } from '../comun/formato.js';
import { ico } from '../comun/iconos.js';
import '../estilos/catalogo.css';

const { main, datos } = montarLayout({ activa: 'catalogo' });

const POR_PAGINA = 24;
const params = new URLSearchParams(location.search);
const estado = {
  cat: params.get('cat') || '',
  oro: params.get('oro') || '',
  orden: params.get('orden') || 'recomendado',
  q: params.get('q') || '',
  mostrar: POR_PAGINA,
};

main.innerHTML = `
  <div class="contenedor">
    <header class="catalogo-cabeza">
      <p class="rotulo rotulo-oro">Catálogo</p>
      <h1 class="titulo-l" data-titular>Oro 18k, <em>pieza por pieza</em></h1>
      <p class="tenue catalogo-intro">Cada precio está calculado con el gramo de hoy. Las fotos son de las piezas reales.</p>
    </header>

    <form class="filtros" role="search" aria-label="Filtrar joyas" onsubmit="return false">
      <div class="filtros-cats" role="group" aria-label="Categoría" data-cats>
        <button type="button" class="chip" aria-pressed="true" data-cat="">Todas</button>
      </div>
      <div class="filtros-fila">
        <div class="campo campo-buscar">
          <label for="f-q" class="solo-lectores">Buscar</label>
          <span class="buscar-ico" aria-hidden="true">${ico('lupa', { tam: 18 })}</span>
          <input class="entrada" id="f-q" type="search" placeholder="Buscar: corazón, rolex, topos…" autocomplete="off" value="${esc(estado.q)}">
        </div>
        <div class="campo">
          <label for="f-oro">Tipo de oro</label>
          <select class="entrada" id="f-oro">
            <option value="">Todos</option>
            <option value="nacional">Nacional 18k</option>
            <option value="italiano">Italiano ley 750</option>
          </select>
        </div>
        <div class="campo">
          <label for="f-orden">Ordenar</label>
          <select class="entrada" id="f-orden">
            <option value="recomendado">Destacadas</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
            <option value="nuevas">Más nuevas</option>
          </select>
        </div>
      </div>
    </form>

    <div class="resultado-barra">
      <p class="rotulo" data-cuenta aria-live="polite">Cargando joyas…</p>
      <button type="button" class="enlace-linea" data-limpiar hidden>Quitar filtros</button>
    </div>

    <div class="rejilla-joyas" data-rejilla aria-busy="true">
      ${Array.from({ length: 8 }, () => '<div class="esqueleto" aria-hidden="true"><div class="marco-foto"></div><div class="esqueleto-linea"></div><div class="esqueleto-linea corta"></div></div>').join('')}
    </div>
    <div class="mas-fila"><button type="button" class="boton boton-linea" data-mas hidden>Ver más joyas</button></div>
  </div>`;

revelar(main);

const $ = (s) => main.querySelector(s);
$('#f-oro').value = estado.oro;
$('#f-orden').value = estado.orden;

const normal = (t) => String(t || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function sincronizarURL() {
  const p = new URLSearchParams();
  if (estado.cat) p.set('cat', estado.cat);
  if (estado.oro) p.set('oro', estado.oro);
  if (estado.orden !== 'recomendado') p.set('orden', estado.orden);
  if (estado.q) p.set('q', estado.q);
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
}

function filtrar(productos) {
  const terminos = normal(estado.q).split(/\s+/).filter(Boolean);
  let lista = productos.filter((p) => {
    if (estado.cat && p.categoria !== estado.cat) return false;
    if (estado.oro && p.tipo_oro !== estado.oro) return false;
    if (terminos.length) {
      const texto = normal(`${p.nombre} ${p.categoria_nombre} ${p.medidas} ${p.sku} ${p.descripcion}`);
      return terminos.every((t) => texto.includes(t));
    }
    return true;
  });
  const orden = {
    'precio-asc': (a, b) => a.precio - b.precio,
    'precio-desc': (a, b) => b.precio - a.precio,
    nuevas: (a, b) => String(b.creado).localeCompare(String(a.creado)) || b.id - a.id,
    recomendado: (a, b) => Number(b.destacado) - Number(a.destacado) || a.id - b.id,
  }[estado.orden];
  return orden ? [...lista].sort(orden) : lista;
}

let catalogo = null;

function pintar({ animar = true } = {}) {
  const rejilla = $('[data-rejilla]');
  const lista = filtrar(catalogo.productos);
  const visibles = lista.slice(0, estado.mostrar);
  const hayFiltros = Boolean(estado.cat || estado.oro || estado.q);
  $('[data-cuenta]').textContent = `${lista.length} ${lista.length === 1 ? 'joya' : 'joyas'}`;
  $('[data-limpiar]').hidden = !hayFiltros;
  $('[data-mas]').hidden = lista.length <= estado.mostrar;
  main.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === estado.cat)));

  if (!lista.length) {
    rejilla.classList.add('sin-resultados');
    rejilla.innerHTML = `<div class="sin-resultados-caja">
      <p class="titulo-m">No encontramos joyas con esos filtros.</p>
      <p class="tenue">Prueba otra palabra o quita los filtros. Si buscas algo especial, Carlos puede conseguirlo o fabricarlo.</p>
      <button type="button" class="boton boton-linea" data-limpiar-2>Quitar filtros</button>
    </div>`;
    rejilla.querySelector('[data-limpiar-2]').onclick = limpiar;
  } else {
    rejilla.classList.remove('sin-resultados');
    rejilla.innerHTML = visibles.map((p, i) => tarjetaJoya(p, { prioridad: i < 4 })).join('');
    activarFotos(rejilla);
    if (animar) {
      rejilla.removeAttribute('data-revelado');
      rejilla.dataset.aparecer = 'hijos';
      revelar(main);
    }
  }
  refrescar();
}

function limpiar() {
  Object.assign(estado, { cat: '', oro: '', q: '', mostrar: POR_PAGINA });
  $('#f-oro').value = '';
  $('#f-q').value = '';
  sincronizarURL();
  pintar();
}

datos.then((d) => {
  const rejilla = $('[data-rejilla]');
  rejilla.removeAttribute('aria-busy');
  if (!d || !d.productos.length) {
    $('[data-cuenta]').textContent = 'Catálogo no disponible';
    main.querySelector('.filtros').hidden = true;
    rejilla.outerHTML = estadoVacio({
      titulo: 'El catálogo no cargó',
      texto: 'Puede ser la conexión o que estemos actualizando precios. Intenta de nuevo en un momento, o pídele a Carlos las fotos por WhatsApp.',
      accion: '<button type="button" class="boton" onclick="location.reload()">Reintentar</button>',
      whatsapp: d?.ajustes?.whatsapp,
    });
    return;
  }
  catalogo = d;
  if (estado.cat && !d.categorias.some((c) => c.slug === estado.cat)) estado.cat = '';

  const cats = d.categorias.filter((c) => d.productos.some((p) => p.categoria === c.slug));
  $('[data-cats]').insertAdjacentHTML('beforeend', cats.map((c) => {
    const n = d.productos.filter((p) => p.categoria === c.slug).length;
    return `<button type="button" class="chip" aria-pressed="false" data-cat="${esc(c.slug)}">${esc(c.nombre)}<span class="chip-n">${n}</span></button>`;
  }).join(''));
  $('[data-cats] [data-cat=""]').insertAdjacentHTML('beforeend', `<span class="chip-n">${d.productos.length}</span>`);

  main.querySelectorAll('[data-cat]').forEach((b) =>
    b.addEventListener('click', () => {
      estado.cat = b.dataset.cat;
      estado.mostrar = POR_PAGINA;
      sincronizarURL();
      pintar();
    }),
  );
  $('#f-oro').addEventListener('change', (e) => { estado.oro = e.target.value; estado.mostrar = POR_PAGINA; sincronizarURL(); pintar(); });
  $('#f-orden').addEventListener('change', (e) => { estado.orden = e.target.value; sincronizarURL(); pintar(); });
  let espera = 0;
  $('#f-q').addEventListener('input', (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => { estado.q = e.target.value.trim(); estado.mostrar = POR_PAGINA; sincronizarURL(); pintar({ animar: false }); }, 220);
  });
  $('[data-limpiar]').addEventListener('click', limpiar);
  $('[data-mas]').addEventListener('click', () => { estado.mostrar += POR_PAGINA; pintar({ animar: false }); });

  if (estado.cat) {
    const c = d.categorias.find((x) => x.slug === estado.cat);
    if (c) document.title = `${c.nombre} en oro 18k — 18gold KPrada`;
  }
  pintar();
});
