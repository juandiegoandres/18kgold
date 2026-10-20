// Página /disena/: diseñador 3D en tres pasos — 1 Elige tu pieza · 2 Personaliza · 3 Llévala y envía.
// El visor ocupa el alto de la ventana; el panel tiene su propio scroll y una barra fija (dentro del panel,
// no flotante) con el precio y el botón «Siguiente». Nada flota con el scroll de la página.
// El STL nunca se descarga aquí: viaja solo dentro del envío a Carlos (ARQUITECTURA.md §5).

import '../estilos/disena.css';
import {
  crearDisenador, ESQUEMA, FUENTES, desglosePrecio, cargarTarifas, formatoPesos, diametroInterior,
  registrarFuentesCss, NOMBRES, HILO, LARGOS, SOPORTES, ESTILOS_CADENA, USOS_TEJIDO, PATRONES, COLORES_HILO,
  DIAMETROS_BALIN, ACABADOS_BALIN, DISTRIBUCIONES,
} from '../disenador/index.js';
import { PIEZAS, NOMBRE_TIPO, NOMBRES_OPCION, GRUPOS_FIGURA, PARAMETROS_INICIALES, miniatura, nombreDiseno } from '../disenador/catalogo.js';

const layouts = import.meta.glob('../comun/layout.js');
const estilosBase = import.meta.glob('../estilos/base.css', { eager: true });
void estilosBase;

const API = String(import.meta.env.VITE_API || '').replace(/\/$/, '');
const WHATSAPP = '573178861724';
const params = new URLSearchParams(location.search);
const REDUCIR = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mm = (n) => (Math.round(n * 10) / 10).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const escapar = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------------------------------------------------------------------------------
// Controles por tipo: los importantes primero; el resto en «Más opciones».
// ---------------------------------------------------------------------------------------------
const CAMPOS = {
  nombre: { principales: ['texto', 'fuente', 'alto'], avanzados: ['grosor', 'base', 'adorno', 'puntos', 'argolla'] },
  inicial: { principales: ['letra', 'fuente', 'marco', 'alto'], avanzados: ['grosor'] },
  placa: { principales: ['forma', 'grabado_frente', 'grabado_reverso', 'ancho', 'alto'], avanzados: ['grosor', 'grabado_fuente', 'argolla'] },
  medalla: { principales: ['motivo', 'diametro', 'borde', 'reverso', 'grabado_reverso'], avanzados: ['forma', 'grosor', 'grabado_fuente'] },
  cruz: { principales: ['estilo', 'alto', 'punto_luz', 'cristo'], avanzados: ['brazo', 'grosor'] },
  motivo: { principales: ['figura', 'texto', 'alto', 'calado'], avanzados: ['grosor', 'argolla'] },
  anillo: { principales: ['talla', 'ancho', 'perfil', 'grabado_interior'], avanzados: ['grosor', 'grabado_fuente'] },
};
const ROTULOS = {
  texto: 'Nombre', letra: 'Letra', fuente: 'Tipografía', alto: 'Alto', grosor: 'Grosor', base: 'Base',
  adorno: 'Adorno', argolla: 'Argolla', marco: 'Marco', forma: 'Forma', ancho: 'Ancho',
  grabado_frente: 'Grabado al frente', grabado_reverso: 'Grabado al reverso', talla: 'Talla',
  perfil: 'Perfil', grabado_interior: 'Grabado interior', grabado_fuente: 'Letra del grabado', puntos: 'Puntos y tildes',
  motivo: 'Figura', diametro: 'Diámetro', borde: 'Borde', reverso: 'Reverso', estilo: 'Estilo', brazo: 'Ancho del brazo',
  punto_luz: 'Punto de luz', cristo: 'Cristo', figura: 'Figura', calado: 'Acabado de la figura',
};
const BOOLEANOS = {
  punto_luz: ['Sin piedra', 'Con punto de luz'],
  cristo: ['Cruz lisa', 'Con Cristo'],
  calado: ['Llena', 'Calada'],
};
const PLACEHOLDER = {
  texto: 'Escribe el nombre', letra: 'A', grabado_frente: 'Ej.: Te amo', grabado_reverso: 'Ej.: 14·02·2026', grabado_interior: 'Ej.: Siempre juntos',
};
const AYUDA = {
  grabado_frente: 'Grabado láser después de fundir. Se ve en la vista previa.',
  grabado_interior: 'Grabado láser después de fundir.',
  talla: 'Talla colombiana / US.',
  puntos: 'El punto de la i y las tildes se sueldan a su letra, o se cambian por un adorno.',
  punto_luz: 'Circonia en un asiento de oro; Carlos la engasta después de fundir.',
};
const ATAJOS = { diametro: [12, 15, 18, 22] };
const VISUALES = new Set(['motivo', 'estilo', 'figura']); // selectores con miniatura

let d = null;
let tipo = 'nombre';
let paso = 1;
let tarifas = null;
let cliente = null;
let ultimo = null;
let primeraLectura = null;
let listo = false;

// ---------------------------------------------------------------------------------------------
// Paso 1: galería
// ---------------------------------------------------------------------------------------------
function construirGaleria() {
  $('[data-galeria]').innerHTML = PIEZAS.map((p) => `
    <button type="button" class="tarjeta-pieza${p.destacada ? ' destacada' : ''}" data-tipo="${p.tipo}" aria-pressed="false">
      <span class="tp-imagen"><img src="${miniatura(p.mini)}" alt="" loading="lazy" width="320" height="320"></span>
      <span class="tp-texto"><b>${p.nombre}</b><small>${p.desc}</small></span>
    </button>`).join('');
}

function construirSubgaleria(t) {
  const caja = $('[data-subgaleria]');
  const p = PIEZAS.find((x) => x.tipo === t);
  if (!p?.sub) { caja.hidden = true; caja.innerHTML = ''; return; }
  const clave = p.sub.clave;
  const actual = d?.parametrosDe(t)[clave];
  const grupos = p.sub.grupos || [{ titulo: null, opciones: p.sub.opciones }];
  caja.innerHTML = `<button type="button" class="sub-volver" data-volver>← Todas las piezas</button><p class="sub-titulo">${p.sub.titulo}</p>` + grupos.map((g) => `
    ${g.titulo ? `<p class="sub-grupo">${g.titulo}</p>` : ''}
    <div class="sub-rejilla" role="radiogroup" aria-label="${escapar(g.titulo || p.sub.titulo)}">
      ${g.opciones.map((o) => `<button type="button" role="radio" class="sub-op" data-sub-tipo="${t}" data-clave="${clave}" data-valor="${o}" aria-checked="${o === actual}">
        <img src="${miniatura(`${t}-${o}`)}" alt="" loading="lazy" width="160" height="160"><span>${NOMBRES_OPCION[clave][o]}</span></button>`).join('')}
    </div>`).join('');
}

function marcarGaleria() {
  for (const b of $$('.tarjeta-pieza')) b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo));
}

// ---------------------------------------------------------------------------------------------
// Paso 2: controles
// ---------------------------------------------------------------------------------------------
function visible(k, p) {
  if (tipo === 'medalla' && (k === 'grabado_reverso' || k === 'grabado_fuente')) return p.reverso === 'grabado';
  if (tipo === 'motivo' && k === 'calado') return p.figura === 'ojo_turco' || !SIN_CALADO.has(p.figura);
  if (tipo === 'inicial' && k === 'argolla') return false;
  return true;
}
const SIN_CALADO = new Set(['infinito', 'arbol_vida', 'herradura', 'mama', ...GRUPOS_FIGURA.find((g) => g.id === 'zodiaco').opciones]);

function rotulo(k, p) {
  if (tipo === 'motivo' && k === 'texto') return p.figura === 'mama' ? 'Nombres de los hijos' : 'Texto grabado (opcional)';
  if (tipo === 'medalla' && k === 'motivo') return 'Figura de la medalla';
  if (tipo === 'motivo' && k === 'alto') return 'Tamaño';
  return ROTULOS[k] || k;
}
function marcador(k, p) {
  if (tipo === 'motivo' && k === 'texto') return p.figura === 'mama' ? 'Ej.: Sofía, Tomás, Emma' : 'Ej.: Siempre';
  return PLACEHOLDER[k] || '';
}
function maxTexto(k, def, p) {
  if (tipo === 'motivo' && k === 'texto') return p.figura === 'mama' ? 40 : 12;
  return def.max;
}

function valorLegible(k, v) {
  if (k === 'talla') return `${String(v).replace('.', ',')} · ⌀ ${mm(diametroInterior(v))} mm`;
  const u = ['alto', 'grosor', 'ancho', 'diametro', 'brazo'].includes(k) ? ' mm' : '';
  return `${String(Math.round(v * 10) / 10).replace('.', ',')}${u}`;
}

function htmlCampo(k, def, p) {
  const id = `c-${tipo}-${k}`;
  const ayuda = AYUDA[k] ? `<p class="ayuda">${AYUDA[k]}</p>` : '';
  if (def.tipo === 'texto') {
    return `<div class="campo"><label class="campo-rotulo" for="${id}">${rotulo(k, p)}</label>
      <input id="${id}" class="entrada${k === 'letra' ? ' entrada-letra' : ''}" data-k="${k}" maxlength="${maxTexto(k, def, p)}" value="${escapar(p[k])}" placeholder="${marcador(k, p)}" spellcheck="false">${ayuda}</div>`;
  }
  if (def.tipo === 'numero') {
    const atajos = ATAJOS[k] ? `<div class="segmentos atajos" role="radiogroup" aria-label="Medidas comunes" data-atajo="${k}">${ATAJOS[k].map((a) => `<button type="button" role="radio" data-valor="${a}" aria-checked="${Number(p[k]) === a}">${a} mm</button>`).join('')}</div>` : '';
    return `<div class="campo campo-rango"><div class="campo-cabeza"><label class="campo-rotulo" for="${id}">${rotulo(k, p)}</label>
      <output class="campo-valor" for="${id}" data-salida="${k}">${valorLegible(k, p[k])}</output></div>${atajos}
      <input id="${id}" type="range" class="rango" data-k="${k}" min="${def.min}" max="${def.max}" step="${def.paso}" value="${p[k]}">${ayuda}</div>`;
  }
  if (def.tipo === 'booleano') {
    const [no, si] = BOOLEANOS[k] || ['No', 'Sí'];
    return `<div class="campo"><span class="campo-rotulo" id="${id}">${rotulo(k, p)}</span>
      <div class="segmentos" role="radiogroup" aria-labelledby="${id}" data-grupo="${k}" data-bool>
        <button type="button" role="radio" data-valor="false" aria-checked="${!p[k]}">${no}</button>
        <button type="button" role="radio" data-valor="true" aria-checked="${Boolean(p[k])}">${si}</button>
      </div>${ayuda}</div>`;
  }
  if (def.tipo === 'opcion' && k === 'fuente') {
    const ops = def.opciones.filter((o) => !FUENTES[o].oculta || o === p[k]);
    return `<div class="campo"><span class="campo-rotulo" id="${id}">${rotulo(k, p)}</span>
      <div class="fuentes" role="radiogroup" aria-labelledby="${id}" data-grupo="${k}">${ops.map((o) => fuenteMuestra(o, p)).join('')}</div></div>`;
  }
  if (def.tipo === 'opcion' && VISUALES.has(k)) {
    const tira = def.opciones.map((o) => `<button type="button" role="radio" class="tira-op" data-valor="${o}" aria-checked="${o === p[k]}">
      <img src="${miniatura(`${tipo}-${o}`)}" alt="" loading="lazy" width="120" height="120"><span>${NOMBRES_OPCION[k][o]}</span></button>`).join('');
    return `<div class="campo"><span class="campo-rotulo" id="${id}">${rotulo(k, p)} <span class="campo-dato" data-dato="${k}">· ${NOMBRES_OPCION[k][p[k]]}</span></span>
      <div class="tira" role="radiogroup" aria-labelledby="${id}" data-grupo="${k}">${tira}</div></div>`;
  }
  if (def.tipo === 'opcion') {
    if (def.opciones.length < 2) return '';
    return `<div class="campo"><span class="campo-rotulo" id="${id}">${rotulo(k, p)}</span>
      <div class="segmentos${def.opciones.length > 4 ? ' segmentos-multi' : ''}" role="radiogroup" aria-labelledby="${id}" data-grupo="${k}">
      ${def.opciones.map((o) => `<button type="button" role="radio" data-valor="${o}" aria-checked="${String(o === p[k])}">${NOMBRES_OPCION[k]?.[o] || o}</button>`).join('')}
      </div></div>`;
  }
  return '';
}

function fuenteMuestra(clave, p) {
  const f = FUENTES[clave];
  const txt = tipo === 'inicial' ? (p.letra || 'S') : (p.texto || 'Sofía');
  return `<button type="button" role="radio" class="fuente-op" data-valor="${clave}" aria-checked="${clave === p.fuente}" aria-label="${f.nombre}">
    <span class="fuente-muestra" style="font-family:'${f.familiaCss}', serif;${f.variacion ? 'font-weight:700;' : ''}">${escapar(txt)}</span>
    <span class="fuente-nombre">${f.nombre}</span></button>`;
}

function construirControles() {
  const esq = ESQUEMA[tipo];
  const p = d.parametrosDe(tipo);
  const { principales, avanzados } = CAMPOS[tipo];
  $('[data-controles]').innerHTML = principales.filter((k) => visible(k, p)).map((k) => htmlCampo(k, esq[k], p)).join('');
  $('[data-avanzados]').innerHTML = avanzados.filter((k) => visible(k, p)).map((k) => htmlCampo(k, esq[k], p)).join('');
  $('[data-pieza-nombre]').textContent = NOMBRE_TIPO[tipo];
  // La tira de figuras muestra la elegida.
  centrarTiras();
  sincronizarComunes(p);
}
// La figura elegida queda a la vista en su tira (sin scrollIntoView: movería también la página).
function centrarTiras() {
  for (const t of $$('.tira')) {
    const b = t.querySelector('[aria-checked="true"]');
    if (!b || !t.clientWidth) continue;
    t.scrollLeft += b.getBoundingClientRect().left - t.getBoundingClientRect().left - (t.clientWidth - b.offsetWidth) / 2;
  }
}

function sincronizarControles(p) {
  for (const g of $$('[data-grupo]')) {
    for (const b of $$('button', g)) b.setAttribute('aria-checked', String(b.dataset.valor === String(p[g.dataset.grupo])));
  }
  for (const g of $$('[data-atajo]')) for (const b of $$('button', g)) b.setAttribute('aria-checked', String(Number(b.dataset.valor) === Number(p[g.dataset.atajo])));
  for (const el of $$('[data-k]')) {
    const k = el.dataset.k;
    if (document.activeElement === el && el.type !== 'range') continue;
    if (el.value !== String(p[k])) el.value = p[k];
    const out = $(`[data-salida="${k}"]`);
    if (out) out.textContent = valorLegible(k, p[k]);
  }
  for (const s of $$('[data-dato]')) s.textContent = `· ${NOMBRES_OPCION[s.dataset.dato][p[s.dataset.dato]]}`;
  sincronizarComunes(p);
}
function sincronizarComunes(p) {
  for (const g of $$('[data-comun]')) for (const b of $$('button', g)) b.setAttribute('aria-checked', String(b.dataset.valor === p[g.dataset.comun]));
}

function actualizarMuestrasFuente() {
  const p = d.parametrosDe(tipo);
  const txt = tipo === 'inicial' ? p.letra : p.texto;
  for (const m of $$('.fuente-muestra')) m.textContent = txt || ' ';
}

// Claves que cambian qué controles se ven: se reconstruye el formulario.
const REARMAN = new Set(['reverso', 'figura']);
function cambiar(k, v) {
  const def = ESQUEMA[tipo][k];
  if (def?.tipo === 'numero') v = Number(v);
  if (def?.tipo === 'booleano') v = v === true || v === 'true';
  const extra = {};
  if (tipo === 'motivo' && k === 'figura') {
    const antes = d.parametrosDe('motivo');
    if ((v === 'mama') !== (antes.figura === 'mama')) extra.texto = '';
    if (v === 'mama' && antes.alto < 18) extra.alto = 20;
  }
  d.fijar(tipo, { [k]: v, ...extra });
  const out = $(`[data-salida="${k}"]`);
  if (out) out.textContent = valorLegible(k, v);
  if (k === 'texto' || k === 'letra') actualizarMuestrasFuente();
  if (REARMAN.has(k)) construirControles();
}

// ---------------------------------------------------------------------------------------------
// Lectura en vivo
// ---------------------------------------------------------------------------------------------
const gramos = (n) => `${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g`;
const TARIFA_REF = { nacional: 352000, italiano: 410000, hechura_gramo: 60000, tejido_valor: 25000, referencial: true };

function pintarLectura(o) {
  ultimo = o;
  if (!o.medidas) return;
  if (o.listo && !listo) {
    listo = true;
    document.body.classList.add('disenador-listo');
  }
  const m = o.medidas;
  const medidas = o.tipo === 'anillo'
    ? `Talla ${String(o.parametros.talla).replace('.', ',')} · ⌀ ${mm(m.diametro_interior)} · ${mm(m.ancho)} × ${mm(m.grosor)} mm`
    : `${mm(m.ancho)} × ${mm(m.alto)} × ${mm(m.grosor)} mm`;
  const t = tarifas || TARIFA_REF;
  const oro = o.parametros.tipo_oro;
  const dz = desglosePrecio(o.peso_g, oro, t, o.montaje);
  for (const el of $$('[data-l="medidas"]')) el.textContent = medidas;
  for (const el of $$('[data-l="peso"]')) el.textContent = gramos(dz.peso_oro);
  for (const el of $$('[data-l="precio"]')) el.textContent = formatoPesos(dz.precio);
  $('[data-r="medidas"]').textContent = medidas;
  $('[data-r="peso"]').textContent = gramos(dz.peso_oro);
  $('[data-r="precio"]').textContent = formatoPesos(dz.precio);
  $('[data-r="pieza"]').textContent = nombreDiseno(o.tipo, o.parametros);
  for (const k of ['nacional', 'italiano']) { const el = $(`[data-gramo-btn="${k}"]`); if (el) el.textContent = `${formatoPesos(t[k])}/g`; }
  const partes = [`Pieza ${gramos(dz.peso_pieza)}`];
  if (dz.cantidad) partes.push(`Balines ${dz.cantidad} × ${gramos(dz.peso_balin)}`);
  if (dz.tejido) partes.push(`Tejido ${formatoPesos(dz.tejido)}`);
  if (dz.cadena_aparte) partes.push('Cadena aparte');
  $('[data-r="desglose"]').textContent = partes.join(' · ');
  $('[data-r="nota"]').textContent = (t.referencial
    ? 'Precio referencial: no pudimos leer el gramo de hoy. '
    : `Con el gramo de hoy (${oro === 'italiano' ? 'italiano' : 'nacional'} ${formatoPesos(t[oro])}). `) + 'Oro 18k (15,5 g/cm³) más hechura sobre la pieza' + (dz.tejido ? ', más el tejido' : '') + '. Es un estimado: Carlos confirma el valor final.';
  $('[data-avisos]').innerHTML = o.avisos.map((a) => `<li>${escapar(a)}</li>`).join('');
  sincronizarControles(o.parametros);
  actualizarMuestrasFuente();
  pintarMontaje(o);
  pintarVistas();
  actualizarEnlaceWa();
}

// ---------------------------------------------------------------------------------------------
// Paso 3: montaje
// ---------------------------------------------------------------------------------------------
const OPC_MONTAJE = {
  soporte: [['cadena', 'Cadena de oro'], ['tejido', 'Tejido en nylon'], ['ninguno', 'Solo la pieza']],
  'cadena.estilo': ESTILOS_CADENA.map((v) => [v, NOMBRES.estilo[v]]),
  'tejido.uso': USOS_TEJIDO.map((v) => [v, NOMBRES.uso[v]]),
  'tejido.patron': PATRONES.map((v) => [v, NOMBRES.patron[v]]),
  'balines.diametro': DIAMETROS_BALIN.map((v) => [String(v), `${v} mm`]),
  'balines.acabado': ACABADOS_BALIN.map((v) => [v, NOMBRES.acabado[v]]),
  'balines.distribucion': DISTRIBUCIONES.map((v) => [v, NOMBRES.distribucion[v]]),
};
void SOPORTES;
const leer = (obj, ruta) => ruta.split('.').reduce((a, k) => a?.[k], obj);
const anidar = (ruta, v) => { const [a, b] = ruta.split('.'); return b ? { [a]: { [b]: v } } : { [a]: v }; };

function construirMontaje() {
  for (const [ruta, ops] of Object.entries(OPC_MONTAJE)) {
    $(`[data-m="${ruta}"]`).innerHTML = ops.map(([v, t]) => `<button type="button" role="radio" data-valor="${v}" aria-checked="false">${t}</button>`).join('');
  }
  $('[data-m="tejido.color"]').innerHTML = COLORES_HILO.map((c) => `<button type="button" role="radio" class="color-op" data-valor="${c}" aria-checked="false" aria-label="${HILO[c].nombre}" title="${HILO[c].nombre}"><span style="background:${HILO[c].hex}"></span></button>`).join('');
  const fs = $('[data-montaje]');
  fs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-m] button');
    if (!b) return;
    const ruta = b.closest('[data-m]').dataset.m;
    let v = b.dataset.valor;
    if (ruta === 'balines.diametro') v = Number(v);
    const cambio = anidar(ruta, v);
    if (ruta === 'soporte' && v === 'ninguno') cambio.balines = { cantidad: 0 };
    d.fijarMontaje(cambio);
  });
  fs.addEventListener('input', (e) => {
    const r = e.target.closest('[data-mr]');
    if (!r) return;
    const ruta = r.dataset.mr;
    const salida = $(`[data-ms="${ruta}"]`);
    if (salida) salida.textContent = valorMontaje(ruta, Number(r.value));
    d.fijarMontaje(anidar(ruta, Number(r.value)));
  });
}
function valorMontaje(ruta, v) {
  if (ruta.endsWith('largo_cm')) return `${v} cm`;
  if (ruta === 'balines.cantidad') return v ? `${v}` : 'Sin balines';
  return String(v);
}
function pintarMontaje(o) {
  const m = o.montaje;
  if (!m) return;
  const anillo = o.tipo === 'anillo';
  $('[data-montaje-anillo]').hidden = !anillo;
  $('[data-montaje-soporte]').hidden = anillo;
  $('[data-sub="cadena"]').hidden = anillo || m.soporte !== 'cadena';
  $('[data-sub="tejido"]').hidden = anillo || m.soporte !== 'tejido';
  $('[data-sub="balines"]').hidden = anillo || m.soporte === 'ninguno';
  for (const g of $$('[data-m]')) {
    const v = String(leer(m, g.dataset.m));
    for (const b of $$('button', g)) b.setAttribute('aria-checked', String(b.dataset.valor === v));
  }
  $('[data-color-nombre]').textContent = `· ${HILO[m.tejido.color].nombre}`;
  const lt = LARGOS[m.tejido.uso];
  const rt = $('[data-mr="tejido.largo_cm"]');
  rt.min = lt.min; rt.max = lt.max;
  for (const r of $$('[data-mr]')) {
    const v = leer(m, r.dataset.mr);
    if (document.activeElement !== r && Number(r.value) !== v) r.value = v;
    const salida = $(`[data-ms="${r.dataset.mr}"]`);
    if (salida) salida.textContent = valorMontaje(r.dataset.mr, v);
  }
  $('[data-balines-detalle]').hidden = !m.balines.cantidad;
}

// ---------------------------------------------------------------------------------------------
// Vistas: Puesta (por defecto, siluetas grises) | Pieza; Reverso; Ver grabado
// ---------------------------------------------------------------------------------------------
let vistaPreferida = 'puesta';
function tieneReverso(o) {
  if (!o) return false;
  const p = o.parametros;
  if (o.tipo === 'medalla') return true;
  if (o.tipo === 'placa') return Boolean(p.grabado_reverso?.trim());
  if (o.tipo === 'motivo') return Boolean(p.texto?.trim()) && p.calado;
  return false;
}
function pintarVistas() {
  const puede = d.puedePuesta();
  if (vistaPreferida === 'puesta' && puede && d.vista() !== 'puesta') d.vista('puesta');
  const v = d.vista();
  for (const b of $$('[data-vista]')) {
    b.setAttribute('aria-checked', String(b.dataset.vista === v));
    if (b.dataset.vista === 'puesta') {
      b.disabled = !puede;
      b.title = puede ? 'Ver la joya puesta, a escala real' : 'Elige cadena o tejido para verla puesta';
    }
  }
  const o = ultimo;
  $('[data-accion="grabado"]').hidden = !(o?.tipo === 'anillo' && o.parametros.grabado_interior?.trim());
  const rev = $('[data-accion="reverso"]');
  rev.hidden = !tieneReverso(o);
  if (rev.hidden && d.reverso?.()) d.reverso(false);
  rev.setAttribute('aria-pressed', String(Boolean(d.reverso?.())));
}
function fijarVista(v) {
  vistaPreferida = v;
  if (v === 'puesta') { $('[data-accion="grabado"]').setAttribute('aria-pressed', 'false'); d.reverso(false); }
  d.vista(v);
  pintarVistas();
}

let relojEstado = null;
function pintarEstado({ generando, error }) {
  const el = $('[data-estado]');
  clearTimeout(relojEstado);
  if (error) { el.textContent = `No se pudo generar: ${error}`; el.classList.add('activo'); return; }
  if (generando) relojEstado = setTimeout(() => { el.innerHTML = '<span class="cargando-linea" aria-hidden="true"></span>Generando'; el.classList.add('activo'); }, 220);
  else { el.textContent = ''; el.classList.remove('activo'); }
}

// ---------------------------------------------------------------------------------------------
// Pasos
// ---------------------------------------------------------------------------------------------
const TEXTO_SIGUIENTE = { 1: 'Personalizar', 2: 'Cómo la llevas' };
function irPaso(n, { enfocar = false } = {}) {
  paso = Math.max(1, Math.min(3, n));
  for (const b of $$('[data-ir]')) {
    const sel = Number(b.dataset.ir) === paso;
    b.setAttribute('aria-selected', String(sel));
    b.tabIndex = sel ? 0 : -1;
    b.classList.toggle('hecho', Number(b.dataset.ir) < paso);
  }
  for (const s of $$('[data-paso]')) s.hidden = Number(s.dataset.paso) !== paso;
  $('[data-cuerpo]').scrollTop = 0;
  $('[data-atras]').hidden = paso === 1;
  const sig = $('[data-siguiente]');
  sig.hidden = paso === 3;
  sig.textContent = TEXTO_SIGUIENTE[paso] || '';
  $('[data-enviar]').hidden = !(paso === 3 && cliente);
  $('[data-pedir-codigo]').hidden = !(paso === 3 && !cliente);
  if (paso === 1) { $('[data-galeria]').hidden = false; $('[data-subgaleria]').hidden = true; }
  if (paso === 2) centrarTiras();
  if (enfocar) $(`[data-ir="${paso}"]`).focus();
}

function seleccionarTipo(t, { parametros = {}, avanzar = false } = {}) {
  if (!ESQUEMA[t]) return;
  const cambia = t !== tipo;
  tipo = t;
  marcarGaleria();
  const iniciales = cambia && !d.yaUsado?.(t) ? PARAMETROS_INICIALES[t] || {} : {};
  d.fijar(t, { ...iniciales, ...parametros });
  d.marcarUsado?.(t);
  construirControles();
  construirSubgaleria(t);
  // El anillo se ve puesto en la mano sin soporte; las demás piezas en el cuello.
  actualizarEnlaceWa();
  try {
    const u = new URL(location.href);
    u.searchParams.set('tipo', t);
    history.replaceState(null, '', u);
  } catch { /* sin history */ }
  if (avanzar) irPaso(2);
}

// ---------------------------------------------------------------------------------------------
// Código de cliente y envío
// ---------------------------------------------------------------------------------------------
async function postJSON(ruta, cuerpo, ms = 30000) {
  if (!API) throw new Error('El servicio no está configurado.');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${API}${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo), signal: ctrl.signal });
    let datos = null;
    try { datos = await r.json(); } catch { /* sin cuerpo */ }
    if (!r.ok && !datos) throw new Error(`El servicio respondió ${r.status}.`);
    return datos || {};
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('El servicio tardó demasiado. Intenta de nuevo.');
    if (e instanceof TypeError) throw new Error('No hay conexión con el servicio en este momento.');
    throw e;
  } finally { clearTimeout(t); }
}

const FORMATO_CODIGO = /^KP-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;
function normalizarCodigo(v) {
  let c = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.startsWith('KP')) c = c.slice(2);
  return c ? `KP-${c.slice(0, 5)}` : '';
}

function textoWhatsApp() {
  const o = ultimo;
  const t = tarifas || TARIFA_REF;
  let s = `Hola Carlos, estoy en el diseñador de 18gold KPrada y me gusta este diseño: ${nombreDiseno(o?.tipo || tipo, o?.parametros || {})}`;
  if (o?.medidas && o.peso_g) {
    const dz = desglosePrecio(o.peso_g, o.parametros.tipo_oro, t, o.montaje);
    s += ` (${gramos(dz.peso_oro)} aprox., estimado ${formatoPesos(dz.precio)})`;
  }
  s += cliente ? '.' : '. ¿Me das un código para enviarte el diseño?';
  return s;
}

function pintarCliente() {
  const con = Boolean(cliente);
  $('[data-envio-con]').hidden = !con;
  const s = $('[data-saludo]');
  if (con) {
    s.hidden = false;
    const n = Number(cliente.restantes);
    const resto = Number.isFinite(n) ? ` · ${n} envío${n === 1 ? '' : 's'} disponible${n === 1 ? '' : 's'}` : '';
    s.textContent = `Hola, ${cliente.cliente}${resto}`;
    $('[data-codigo-ayuda]').textContent = `Código ${cliente.codigo} activo. Ya puedes enviarle el diseño a Carlos.`;
  } else s.hidden = true;
  irPaso(paso);
  actualizarEnlaceWa();
}
function actualizarEnlaceWa() {
  $('[data-pedir-codigo]').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(textoWhatsApp())}`;
}

async function validarCodigo(valor, silencioso = false) {
  const msj = $('[data-codigo-msj]');
  const codigo = normalizarCodigo(valor);
  $('[data-codigo]').value = codigo;
  if (!FORMATO_CODIGO.test(codigo)) {
    if (!silencioso) { msj.textContent = 'El código tiene la forma KP-XXXXX (cinco letras o números).'; msj.dataset.tono = 'error'; }
    return;
  }
  msj.textContent = 'Validando…'; msj.dataset.tono = '';
  try {
    const r = await postJSON('/api/codigo', { codigo }, 12000);
    if (r.ok) {
      cliente = { codigo, cliente: r.cliente || 'cliente', expira: r.expira, restantes: r.restantes };
      try { sessionStorage.setItem('kp:codigo', codigo); } catch { /* sin almacenamiento */ }
      const vence = r.expira ? new Date(r.expira) : null;
      msj.textContent = vence && !Number.isNaN(vence.getTime()) ? `Válido hasta el ${vence.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}.` : 'Código válido.';
      msj.dataset.tono = 'ok';
    } else {
      cliente = null;
      msj.textContent = r.error || 'Ese código no es válido o ya venció. Pídele uno nuevo a Carlos.';
      msj.dataset.tono = 'error';
    }
  } catch (e) {
    cliente = null;
    msj.textContent = silencioso ? '' : e.message; msj.dataset.tono = 'error';
  }
  pintarCliente();
}

function aBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function enviar() {
  const boton = $('[data-enviar]');
  const caja = $('[data-enviado]');
  const o = d.obtener();
  if (!o.listo || !cliente) return;
  boton.disabled = true; boton.textContent = 'Enviando…';
  caja.hidden = true;
  try {
    const dz = desglosePrecio(o.peso_g, o.parametros.tipo_oro, tarifas || {}, o.montaje);
    const cuerpo = {
      codigo: cliente.codigo, tipo: o.tipo, parametros: o.parametros, montaje: o.montaje,
      peso_estimado: dz.peso_pieza, precio_estimado: dz.precio,
      tipo_oro: o.parametros.tipo_oro, nota: $('[data-nota]').value.trim(),
      vista_png: d.capturarPNG(), stl_base64: aBase64(d.exportarSTL()),
    };
    const r = await postJSON('/api/disenos', cuerpo, 90000);
    if (!r.ok) throw new Error(r.error || 'No se pudo enviar el diseño.');
    if (Number.isFinite(Number(cliente.restantes))) cliente.restantes = Math.max(0, Number(cliente.restantes) - 1);
    pintarCliente();
    const txt = `Hola Carlos, te envié mi diseño desde la web. Folio ${r.folio}. ${nombreDiseno(o.tipo, o.parametros)}. Peso estimado ${dz.peso_oro.toFixed(2).replace('.', ',')} g.`;
    caja.innerHTML = `<p class="enviado-titulo">Diseño enviado</p>
      <p>Folio <b>${escapar(r.folio)}</b>. Carlos ya lo recibió con la vista y el archivo para fundir.</p>
      <a class="boton-d boton-d-linea" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Avisar a Carlos por WhatsApp</a>`;
    caja.hidden = false;
    $('[data-cuerpo]').scrollTop = $('[data-cuerpo]').scrollHeight;
  } catch (e) {
    caja.innerHTML = `<p class="mensaje" data-tono="error">${escapar(e.message)}</p>`;
    caja.hidden = false;
  } finally {
    boton.disabled = false; boton.textContent = 'Enviar a Carlos';
  }
}

// ---------------------------------------------------------------------------------------------
function eventos() {
  $('[data-galeria]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tipo]');
    if (!b) return;
    const t = b.dataset.tipo;
    const conSub = PIEZAS.find((x) => x.tipo === t)?.sub;
    seleccionarTipo(t, { avanzar: !conSub });
    // Con subcategorías (medallas, cruces, dijes): la galería cede el lugar a las opciones de ese tipo.
    if (conSub) { $('[data-galeria]').hidden = true; $('[data-subgaleria]').hidden = false; $('[data-cuerpo]').scrollTop = 0; }
  });
  $('[data-subgaleria]').addEventListener('click', (e) => {
    if (e.target.closest('[data-volver]')) { $('[data-galeria]').hidden = false; $('[data-subgaleria]').hidden = true; $('[data-cuerpo]').scrollTop = 0; return; }
    const b = e.target.closest('[data-sub-tipo]');
    if (!b) return;
    seleccionarTipo(b.dataset.subTipo, { parametros: { [b.dataset.clave]: b.dataset.valor }, avanzar: true });
  });
  const panel = $('.disena-panel');
  panel.addEventListener('input', (e) => {
    const el = e.target.closest('[data-k]');
    if (el) cambiar(el.dataset.k, el.value);
  });
  panel.addEventListener('click', (e) => {
    const at = e.target.closest('[data-atajo] button');
    if (at) { cambiar(at.closest('[data-atajo]').dataset.atajo, Number(at.dataset.valor)); return; }
    const b = e.target.closest('[data-grupo] button');
    if (!b) return;
    const g = b.closest('[data-grupo]');
    for (const x of $$('button', g)) x.setAttribute('aria-checked', String(x === b));
    cambiar(g.dataset.grupo, g.hasAttribute('data-bool') ? b.dataset.valor === 'true' : b.dataset.valor);
  });
  document.addEventListener('keydown', (e) => {
    const g = e.target.closest?.('[role="radiogroup"], [role="tablist"]');
    if (!g || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const bs = $$('button', g);
    const i = bs.indexOf(e.target);
    if (i < 0) return;
    e.preventDefault();
    const j = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length;
    bs[j].focus(); bs[j].click();
  });
  for (const g of $$('[data-comun]')) {
    g.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      for (const x of $$('button', g)) x.setAttribute('aria-checked', String(x === b));
      d.fijar(tipo, { [g.dataset.comun]: b.dataset.valor });
    });
  }
  for (const b of $$('[data-ir]')) b.addEventListener('click', () => irPaso(Number(b.dataset.ir)));
  $('[data-siguiente]').addEventListener('click', () => irPaso(paso + 1));
  $('[data-atras]').addEventListener('click', () => irPaso(paso - 1));
  $('[data-accion="regla"]').addEventListener('click', (e) => e.currentTarget.setAttribute('aria-pressed', String(d.regla())));
  $('[data-accion="giro"]').addEventListener('click', (e) => e.currentTarget.setAttribute('aria-pressed', String(d.giro())));
  $('[data-accion="centrar"]').addEventListener('click', () => d.encuadrar());
  $('[data-accion="reverso"]').addEventListener('click', () => {
    const activo = !d.reverso();
    if (activo) vistaPreferida = 'pieza';
    d.reverso(activo);
    pintarVistas();
  });
  $('[data-validar]').addEventListener('click', () => validarCodigo($('[data-codigo]').value));
  $('[data-codigo]').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); validarCodigo(e.target.value); } });
  $('[data-enviar]').addEventListener('click', enviar);
  for (const b of $$('[data-vista]')) b.addEventListener('click', () => { if (!b.disabled) fijarVista(b.dataset.vista); });
  $('[data-accion="grabado"]').addEventListener('click', (e) => {
    if (!d.visor.grabadoVisible()) vistaPreferida = 'pieza';
    const activo = d.verGrabado();
    e.currentTarget.setAttribute('aria-pressed', String(activo));
    pintarVistas();
  });
}

async function iniciar() {
  const cargarLayout = layouts['../comun/layout.js'];
  if (cargarLayout) {
    try { (await cargarLayout()).montarLayout({ activa: 'disena', suave: false }); }
    catch (e) { console.warn('[disena] sin encabezado/pie:', e.message); }
  }
  // Alto del diseñador = lo que queda de la pantalla bajo el encabezado.
  const medirArriba = () => {
    const sec = $('.disena');
    document.documentElement.style.setProperty('--disena-arriba', `${Math.round(sec.getBoundingClientRect().top + scrollY)}px`);
  };
  medirArriba();
  addEventListener('resize', medirArriba);
  // La franja de anuncio y la tira del gramo llegan después: se vuelve a medir cuando cambia el alto.
  try { new ResizeObserver(medirArriba).observe(document.body); } catch { /* sin ResizeObserver */ }
  document.fonts?.ready.then(medirArriba);
  if (REDUCIR) $('[data-accion="giro"]').setAttribute('aria-pressed', 'false');
  registrarFuentesCss();
  construirGaleria();
  construirMontaje();

  const tarifasP = cargarTarifas(API).then((t) => { tarifas = t; if (ultimo) pintarLectura(ultimo); });

  // Pieza inicial: la de ?tipo= (desde el inicio) o el nombre en cadena de oro, vista Puesta.
  const pedido = params.get('tipo');
  const inicial = ESQUEMA[pedido] ? pedido : 'nombre';
  const extra = {};
  for (const k of ['motivo', 'estilo', 'figura']) if (params.get(k)) extra[k] = params.get(k);
  tipo = inicial;
  d = await crearDisenador($('[data-escena]'), {
    alCambiar: (o) => { if (d) pintarLectura(o); else primeraLectura = o; },
    alEstado: pintarEstado,
    montaje: { soporte: 'cadena', cadena: { estilo: 'rolo', largo_cm: 45 } },
    tipo: inicial,
    parametros: { ...(PARAMETROS_INICIALES[inicial] || {}), ...extra },
  });
  d.marcarUsado?.(inicial);
  if (REDUCIR) d.giro(false);
  window.disenador = d;
  marcarGaleria();
  construirControles();
  eventos();
  pintarLectura(primeraLectura || d.obtener());
  irPaso(pedido && ESQUEMA[pedido] ? 2 : 1);
  pintarCliente();
  await tarifasP;

  const c = params.get('c') || (() => { try { return sessionStorage.getItem('kp:codigo'); } catch { return null; } })();
  if (c) validarCodigo(c, !params.get('c'));
}

iniciar();
