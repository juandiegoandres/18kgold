// Joya 3D del inicio: una argolla lisa entrelazada con una argolla TEJIDA (cordón de tres hilos
// torcidos — «¡Teje tu historia!»), generadas por código. Oro metálico (MeshPhysicalMaterial)
// iluminado solo con RoomEnvironment/PMREM. Fondo transparente: el hueso plano lo pone el CSS.
//
// Gira lento; el puntero y el scroll solo cambian la ROTACIÓN (nunca la posición).
// Sin WebGL → imagen del logo. Con prefers-reduced-motion → un solo cuadro quieto.

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, PMREMGenerator,
  TubeGeometry, LatheGeometry, Curve, Vector2, Vector3, ACESFilmicToneMapping, SRGBColorSpace, MathUtils, DoubleSide,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ruta } from '../comun/formato.js';

/** Hilo k de un cordón torcido alrededor de un aro de radio R. */
class HiloTorcido extends Curve {
  constructor(R, a, vueltas, fase) {
    super();
    Object.assign(this, { R, a, vueltas, fase });
  }
  getPoint(t, destino = new Vector3()) {
    const th = t * Math.PI * 2;
    const g = this.vueltas * th + this.fase;
    const radial = this.R + this.a * Math.cos(g);
    return destino.set(radial * Math.cos(th), this.a * Math.sin(g), radial * Math.sin(th));
  }
}

/** Perfil «comfort fit» de una argolla: rectángulo con cantos redondeados, girado en torno a Y. */
function argollaLisa(radioInterior, ancho, grosor) {
  const pts = [];
  const r = Math.min(grosor, ancho) * 0.45;
  const x0 = radioInterior, x1 = radioInterior + grosor, y0 = -ancho / 2, y1 = ancho / 2;
  const arco = (cx, cy, a0, a1) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + ((a1 - a0) * i) / 8;
      pts.push(new Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
  };
  // interior levemente abombado (comodidad) recorriendo el contorno en sentido antihorario
  arco(x0 + r, y0 + r, Math.PI, Math.PI * 1.5);
  arco(x1 - r, y0 + r, -Math.PI / 2, 0);
  arco(x1 - r, y1 - r, 0, Math.PI / 2);
  arco(x0 + r, y1 - r, Math.PI / 2, Math.PI);
  pts.push(pts[0].clone());
  return new LatheGeometry(pts, 160);
}

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function respaldo(contenedor) {
  contenedor.classList.add('hero-respaldo');
  contenedor.innerHTML = `<img src="${ruta('img/logo.jpg')}" alt="18gold KPrada — ¡Teje tu historia!" width="1024" height="1536">`;
}

export function crearHero3D(contenedor) {
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hayWebGL()) return respaldo(contenedor);

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return respaldo(contenedor);
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Argolla de oro 18k tejida, entrelazada con una argolla lisa, en 3D');
  contenedor.appendChild(renderer.domElement);

  const escena = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camara = new PerspectiveCamera(30, 1, 0.1, 50);
  camara.position.set(0, 0, 8.2);

  const oro = new MeshPhysicalMaterial({
    color: 0xe7bd6a, metalness: 1, roughness: 0.2, clearcoat: 0.35, clearcoatRoughness: 0.15, envMapIntensity: 1.15,
  });
  const oroSatin = oro.clone();
  oroSatin.roughness = 0.12;
oroSatin.side = DoubleSide;

  const joya = new Group();

  // Argolla tejida: tres hilos torcidos
  const tejida = new Group();
  for (let k = 0; k < 3; k++) {
    const hilo = new HiloTorcido(1, 0.105, 22, (k * Math.PI * 2) / 3);
    tejida.add(new Mesh(new TubeGeometry(hilo, 900, 0.082, 18, true), oro));
  }
  joya.add(tejida);

  // Argolla lisa, entrelazada (plano perpendicular, centro desplazado)
  const lisa = new Mesh(argollaLisa(0.9, 0.34, 0.12), oroSatin);
  lisa.rotation.x = Math.PI / 2;
  lisa.position.set(1.0, 0, 0);
  joya.add(lisa);

  // centrar el conjunto
  joya.children.forEach((m) => (m.position.x -= 0.5));
  joya.rotation.set(0.55, -0.4, 0.18);
  const pivote = new Group();
  pivote.add(joya);
  escena.add(pivote);

  // ---------- tamaño ----------
  const ajustar = () => {
    const { width, height } = contenedor.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camara.aspect = width / height;
    // que la pieza quepa también en contenedores angostos
    camara.position.z = camara.aspect < 1 ? 8.2 / Math.max(camara.aspect, 0.6) : 8.2;
    camara.updateProjectionMatrix();
    renderer.render(escena, camara);
  };
  const ro = new ResizeObserver(ajustar);
  ro.observe(contenedor);
  ajustar();

  if (quieto) {
    contenedor.classList.add('hero-listo');
    return { destruir: () => { ro.disconnect(); renderer.dispose(); } };
  }

  // ---------- interacción: solo rotación ----------
  const objetivo = { x: 0, y: 0 };
  const actual = { x: 0, y: 0, scroll: 0 };
  const alMover = (e) => {
    const r = contenedor.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    objetivo.y = MathUtils.clamp(nx, -1.4, 1.4) * 0.35;
    objetivo.x = MathUtils.clamp(ny, -1.4, 1.4) * 0.22;
  };
  window.addEventListener('pointermove', alMover, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
  io.observe(contenedor);

  let giro = 0;
  let previo = performance.now();
  let id = 0;
  const cuadro = (ahora) => {
    id = requestAnimationFrame(cuadro);
    if (!visible || document.hidden) {
      previo = ahora;
      return;
    }
    const dt = Math.min((ahora - previo) / 1000, 0.05);
    previo = ahora;
    giro += dt * 0.32;
    const r = contenedor.getBoundingClientRect();
    const progreso = MathUtils.clamp(-r.top / Math.max(r.height, 1), 0, 1.2);
    actual.x += (objetivo.x - actual.x) * 0.05;
    actual.y += (objetivo.y - actual.y) * 0.05;
    actual.scroll += (progreso - actual.scroll) * 0.08;
    pivote.rotation.y = giro + actual.y + actual.scroll * 1.6;
    pivote.rotation.x = actual.x + actual.scroll * 0.5;
    tejida.rotation.y = Math.sin(giro * 0.7) * 0.06; // respiración mínima del tejido
    renderer.render(escena, camara);
  };
  id = requestAnimationFrame(cuadro);
  requestAnimationFrame(() => contenedor.classList.add('hero-listo'));

  return {
    destruir() {
      cancelAnimationFrame(id);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', alMover);
      renderer.dispose();
    },
  };
}
