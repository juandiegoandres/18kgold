// Diseñador 3D de joyas en oro 18k — API pública (ARQUITECTURA.md §5):
//   const d = await crearDisenador(contenedor, { alCambiar })
//   d.fijar(tipo, parametros) · d.obtener() · d.exportarSTL({ contraccion }) · d.capturarPNG() · d.destruir()
// La geometría se calcula en un Web Worker (con respaldo en el hilo principal si no hay Workers).

import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { crearVisor } from './visor.js';
import { normalizar, porDefecto, TIPOS } from './esquema.js';
import { grabadosPlaca, grabadoAnillo, grabadosZonas } from './grabado.js';
import { adornosVista } from './adornos-vista.js';
import { FUENTES, FUENTES_GRABADO_CSS } from './fuentes.js';
import { normalizarMontaje } from './montaje.js';

export { FUENTES } from './fuentes.js';
export { ESQUEMA, TIPOS, normalizar, porDefecto, diametroInterior } from './esquema.js';
export { calcularPrecio, desglosePrecio, cargarTarifas, PRECIOS_REFERENCIA, formatoPesos } from './precio.js';
export * from './montaje.js';

const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
export const URL_FUENTES = new URL(`${base}fuentes/`, location.href).href;

// Registra las fuentes en CSS (para el selector y los grabados) con la misma base que el Worker.
let fuentesCss = null;
export function registrarFuentesCss() {
  if (fuentesCss) return fuentesCss;
  const tareas = [...Object.values(FUENTES), ...Object.values(FUENTES_GRABADO_CSS)].map((f) => {
    const ff = new FontFace(f.familiaCss, `url(${URL_FUENTES}${f.archivo})`, f.variacion ? { weight: '100 900' } : {});
    document.fonts.add(ff);
    return ff.load().catch(() => null);
  });
  fuentesCss = Promise.all(tareas);
  return fuentesCss;
}

function crearMotor() {
  // Worker de módulo (Vite lo empaqueta). Si falla, se genera en el hilo principal.
  let worker = null;
  try {
    worker = new Worker(new URL('./trabajador.js', import.meta.url), { type: 'module' });
  } catch { worker = null; }
  const pendientes = new Map();
  let siguiente = 1;
  if (worker) {
    worker.onmessage = (e) => {
      const p = pendientes.get(e.data.id);
      if (!p) return;
      pendientes.delete(e.data.id);
      e.data.ok ? p.resolve(e.data) : p.reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      for (const p of pendientes.values()) p.reject(new Error(e.message || 'Error en el generador'));
      pendientes.clear();
    };
  }
  let local = null;
  async function enLocal(tipo, parametros) {
    if (!local) {
      const [{ generar }, opentype, rec] = await Promise.all([import('./generar.js'), import('opentype.js'), import('./recursos.js')]);
      local = { generar, opentype: opentype.default || opentype, fuentes: {}, imgs: {}, recursosDe: rec.recursosDe, cargarImagenGris: rec.cargarImagenGris };
    }
    const fuentes = {}, imgs = {};
    const rec = local.recursosDe(tipo, parametros);
    for (const k of rec.fuentes) {
      if (!local.fuentes[k]) {
        const b = await fetch(URL_FUENTES + FUENTES[k].archivo).then((r) => r.arrayBuffer());
        local.fuentes[k] = local.opentype.parse(b);
      }
      fuentes[k] = local.fuentes[k];
    }
    for (const k of rec.imgs) {
      try { local.imgs[k] ??= await local.cargarImagenGris(new URL(`../relieves/${k}.png`, URL_FUENTES).href); imgs[k] = local.imgs[k]; } catch { /* sin relieve */ }
    }
    const r = local.generar(tipo, parametros, fuentes, imgs);
    return {
      ok: true, tipo, parametros: r.parametros,
      posicion: r.render.attributes.position.array, normal: r.render.attributes.normal.array,
      volumen_cm3: r.volumen_cm3, peso_g: r.peso_g, medidas: r.medidas, verificacion: r.verificacion, avisos: r.avisos, info: r.info, ms: r.ms,
    };
  }
  return {
    generar(tipo, parametros) {
      if (!worker) return enLocal(tipo, parametros);
      const id = siguiente++;
      return new Promise((resolve, reject) => {
        pendientes.set(id, { resolve, reject });
        worker.postMessage({ id, tipo, parametros, baseFuentes: URL_FUENTES });
      }).catch((err) => {
        // Si el Worker no pudo arrancar (p. ej. navegador sin Workers de módulo), seguimos en local.
        if (/Worker|import|module/i.test(err.message)) { worker?.terminate(); worker = null; return enLocal(tipo, parametros); }
        throw err;
      });
    },
    destruir() { worker?.terminate(); },
  };
}

export async function crearDisenador(contenedor, opciones = {}) {
  const { alCambiar = () => {}, alEstado = () => {}, retardo = 140 } = opciones;
  const reducirMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const visor = crearVisor(contenedor, { reducirMovimiento, interactivo: opciones.interactivo !== false, acercarPuesta: opciones.acercarPuesta || 1 });
  const motor = crearMotor();
  registrarFuentesCss();

  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, porDefecto(t)]));
  let tipo = TIPOS.includes(opciones.tipo) ? opciones.tipo : 'nombre';
  const usados = new Set();
  let resultado = null;      // última respuesta del generador
  let pedido = 0;            // número de la última solicitud (descarta respuestas viejas)
  let temporizador = null;
  let enCurso = null;
  let primera = true;
  let tipoMostrado = null;
  let esperando = [];
  // Lo que eligió la persona (se conserva al pasar por el anillo, que no lleva soporte) y lo efectivo.
  let montajeUsuario = normalizarMontaje(opciones.montaje || {});
  let montaje = montajeUsuario;

  function aplicar(r) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(r.posicion, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(r.normal, 3));
    geo.computeBoundingBox();
    const b = geo.boundingBox;
    let decals = [];
    const p = r.parametros;
    if (r.tipo === 'placa') decals = grabadosPlaca(p, { x0: b.min.x, x1: b.max.x, y0: b.min.y, y1: b.max.y, z0: b.min.z, z1: b.max.z });
    if (r.tipo === 'anillo') decals = grabadoAnillo(p);
    if (r.info?.zonas_grabado?.length) decals.push(...grabadosZonas(r.info.zonas_grabado, p, p.grosor));
    decals.push(...adornosVista(r.info));
    const radioAntes = visor.radio();
    // El montaje depende del tipo (el anillo no lleva soporte).
    montaje = normalizarMontaje(montajeUsuario, r.tipo);
    visor.fijarMontajeSilencioso?.(montaje);
    visor.ponerGeometria(geo, r.tipo, { decals, info: r.info });
    visor.fijarAcabado(p.acabado);
    const cambioTam = Math.abs(visor.radio() - radioAntes) / radioAntes > 0.12;
    if (visor.vista() === 'puesta') { if (primera || tipoMostrado !== r.tipo) visor.fijarVista('puesta'); }
    else if (primera || tipoMostrado !== r.tipo || cambioTam) visor.encuadrar(!primera && tipoMostrado === r.tipo);
    primera = false;
    tipoMostrado = r.tipo;
    resultado = r;
    alCambiar(api.obtener());
  }

  function programar(inmediato = false) {
    clearTimeout(temporizador);
    const n = ++pedido;
    alEstado({ generando: true });
    const correr = async () => {
      // Solo una generación a la vez; si llegan cambios mientras tanto, se toma el último.
      if (enCurso) { await enCurso.catch(() => {}); if (n !== pedido) return; }
      const params = { ...porTipo[tipo] };
      const t = tipo;
      enCurso = motor.generar(t, params);
      try {
        const r = await enCurso;
        if (n === pedido) {
          aplicar(r);
          alEstado({ generando: false });
          const w = esperando; esperando = [];
          w.forEach((f) => f.resolve(api.obtener()));
        }
      } catch (err) {
        if (n === pedido) {
          alEstado({ generando: false, error: err.message });
          const w = esperando; esperando = [];
          w.forEach((f) => f.reject(err));
        }
      } finally { enCurso = null; }
    };
    if (inmediato) correr(); else temporizador = setTimeout(correr, retardo);
    return new Promise((resolve, reject) => esperando.push({ resolve, reject }));
  }

  const api = {
    // Cambia el tipo y/o los parámetros (se mezclan con los actuales). Devuelve una promesa
    // que resuelve con obtener() cuando la malla nueva está en pantalla.
    fijar(nuevoTipo, parametros = {}, { inmediato = false } = {}) {
      if (nuevoTipo && TIPOS.includes(nuevoTipo)) tipo = nuevoTipo;
      // Los comunes (oro, acabado) viajan entre tipos.
      const comunes = { tipo_oro: porTipo[tipo].tipo_oro, acabado: porTipo[tipo].acabado };
      for (const t of TIPOS) {
        if (parametros.tipo_oro) porTipo[t].tipo_oro = parametros.tipo_oro;
        if (parametros.acabado) porTipo[t].acabado = parametros.acabado;
      }
      porTipo[tipo] = normalizar(tipo, { ...porTipo[tipo], ...comunes, ...parametros });
      // Solo el acabado o el oro: no hace falta regenerar la malla.
      const soloVista = Object.keys(parametros).every((k) => k === 'acabado' || k === 'tipo_oro');
      if (soloVista && resultado && resultado.tipo === tipo && Object.keys(parametros).length) {
        visor.fijarAcabado(porTipo[tipo].acabado);
        resultado = { ...resultado, parametros: { ...resultado.parametros, ...parametros } };
        alCambiar(api.obtener());
        return Promise.resolve(api.obtener());
      }
      return programar(inmediato);
    },
    obtener() {
      const r = resultado;
      return {
        tipo: r?.tipo ?? tipo,
        parametros: { ...(r?.parametros ?? porTipo[tipo]) },
        volumen_cm3: r?.volumen_cm3 ?? 0,
        peso_g: r?.peso_g ?? 0,
        medidas: r?.medidas ?? null,
        verificacion: r?.verificacion ?? null,
        avisos: r?.avisos ?? [],
        montaje: structuredClone(montaje),
        listo: Boolean(r) && r.tipo === tipo,
      };
    },
    // Cambia cómo se lleva la pieza (se mezcla con el actual). No regenera la malla de oro.
    fijarMontaje(m = {}) {
      const u = montajeUsuario;
      const mezcla = {
        ...u, ...m,
        cadena: { ...u.cadena, ...(m.cadena || {}) },
        tejido: { ...u.tejido, ...(m.tejido || {}) },
        balines: { ...u.balines, ...(m.balines || {}) },
      };
      // Al cambiar de uso, el largo vuelve al típico de ese uso.
      if (m.tejido?.uso && m.tejido.uso !== u.tejido.uso && m.tejido.largo_cm === undefined) delete mezcla.tejido.largo_cm;
      montajeUsuario = normalizarMontaje(mezcla);
      montaje = normalizarMontaje(montajeUsuario, resultado?.tipo ?? tipo);
      const antes = visor.vista();
      visor.fijarMontaje(montaje);
      // Otro lugar del cuerpo (cuello ↔ muñeca ↔ tobillo): se vuelve a encuadrar.
      if (antes === 'puesta' && visor.vista() === 'puesta' && (m.soporte || m.tejido?.uso)) visor.fijarVista('puesta');
      alCambiar(api.obtener());
      return api.obtener();
    },
    // 'pieza' | 'puesta'. Devuelve la vista efectiva (Puesta necesita soporte, o ser anillo).
    vista(v) { return v ? visor.fijarVista(v) : visor.vista(); },
    verGrabado: (v) => visor.verGrabado(v),
    puedePuesta: () => visor.puedePuesta(),
    parametrosDe: (t) => ({ ...porTipo[t] }),
    tipoActual: () => tipo,
    exportarSTL({ contraccion = 0 } = {}) {
      const m = visor.obtenerMalla();
      if (!m) throw new Error('Aún no hay malla');
      const geo = m.geometry.clone();
      const s = 1 + (Number(contraccion) || 0) / 100;
      if (s !== 1) geo.scale(s, s, s);
      const dv = new STLExporter().parse(new THREE.Mesh(geo), { binary: true });
      geo.dispose();
      return dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength);
    },
    // La imagen que recibe Carlos: puesta si hay soporte; si no, la pieza sola.
    capturarPNG(lado = 1200) { return visor.capturar(lado, { vista: montaje.soporte !== 'ninguno' && visor.puedePuesta() ? 'puesta' : 'pieza' }); },
    // Ver el reverso (medalla, placa): gira la pieza 180° en la vista Pieza.
    reverso: (v) => (v === undefined ? visor.reverso() : visor.reverso(v)),
    yaUsado: (t) => usados.has(t),
    marcarUsado: (t) => usados.add(t),
    regla: (v) => visor.regla(v),
    giro: (v) => visor.giro(v),
    encuadrar: () => visor.encuadrar(false),
    visor,
    destruir() {
      clearTimeout(temporizador);
      motor.destruir();
      visor.destruir();
    },
  };

  await api.fijar(tipo, opciones.parametros || {}, { inmediato: true }).catch(() => {});
  return api;
}
