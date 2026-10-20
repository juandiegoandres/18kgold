// Visor 3D. Dos vistas:
//  · «Pieza»: la joya sola (o con su cadena/tejido y balines, sin silueta) sobre el fondo hueso, con
//    sombra suave en el piso y giro lento.
//  · «Puesta»: la joya sobre una silueta gris mate a escala real (busto, mano o pierna).
// Oro físico con reflejos de un estudio de fotografía de joyas (cajas de luz suaves) generado en
// tiempo real con PMREM; MSAA del lienzo; tone mapping neutro.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { colocar, colocarAnillo } from './siluetas.js';
import {
  Recorrido, construirTejido, construirCadena, construirBalines, construirCorredizo, posicionesBalines,
  RADIO_TEJIDO, RADIO_CADENA,
} from './tejidos.js';
import { lugarDe, largoMm } from './montaje.js';

const FONDO = 0xf4f0e6;
export const ACABADOS = {
  brillante: { color: 0xe0b44e, roughness: 0.12, clearcoat: 0.5 },
  mate: { color: 0xd8ae4c, roughness: 0.42, clearcoat: 0 },
  rose: { color: 0xe7a184, roughness: 0.14, clearcoat: 0.45 },
};

// Estudio virtual: cuarto cálido medio con cajas de luz de borde suave. Solo se usa como mapa de
// reflejos (no se ve): da al oro contraste entre brillos largos y zonas oscuras, como en foto de joyería.
function texturaCaja() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.55, '#f2f2f2'); grad.addColorStop(1, '#000000');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function escenaEstudio() {
  const s = new THREE.Scene();
  const cuarto = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.29, 0.25), side: THREE.BackSide }));
  s.add(cuarto);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.84, 0.72) }));
  piso.rotation.x = -Math.PI / 2; piso.position.y = -5.9; s.add(piso);
  const mapa = texturaCaja();
  const caja = (w, h, pos, mirar, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k * 0.98, k * 0.94), map: mapa, side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...mirar); s.add(m);
  };
  caja(7, 4, [0, 5.8, 0.6], [0, 0, 0], 7);        // cenital grande
  caja(1.6, 7, [-5.8, 0.8, 1.5], [0, 0, 0], 5);   // tira izquierda
  caja(1.6, 7, [5.8, 0.6, -0.8], [0, 0, 0], 3.4); // tira derecha
  // Cartulina frontal grande y clara: lo que refleja una cara plana vista de frente (placas, letras).
  const frente = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 9), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.12, 0.92), map: mapa }));
  frente.position.set(0, 0.8, 5.95); frente.lookAt(0, 0.8, 0); s.add(frente);
  caja(5, 2.4, [0, 2.2, 5.9], [0, 0, 0], 4);      // caja de luz frontal alta
  caja(3, 1.4, [1.5, 2.5, -5.8], [0, 0, 0], 5);   // contraluz
  return s;
}

export function crearVisor(contenedor, { reducirMovimiento = false, interactivo = true, acercarPuesta = 1 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(FONDO, 1);
  renderer.domElement.className = 'visor-lienzo';
  renderer.domElement.setAttribute('aria-label', 'Vista 3D de la joya. Arrastra para girar, pellizca o usa la rueda para acercar.');
  renderer.domElement.setAttribute('role', 'img');
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(FONDO);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const estudio = escenaEstudio();
  const entorno = pmrem.fromScene(estudio, 0.05).texture;
  estudio.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
  escena.environment = entorno;
  escena.environmentIntensity = 1.0;
  escena.environmentRotation.set(0, 0.35, 0);

  const camara = new THREE.PerspectiveCamera(28, 1, 0.5, 4000);
  camara.position.set(0, 6, 80);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xe8dfca, 0.35);
  escena.add(hemi);
  const sol = new THREE.DirectionalLight(0xffffff, 1.1);
  sol.position.set(18, 60, 34);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.radius = 9;
  sol.shadow.blurSamples = 16;
  sol.shadow.bias = -0.0004;
  const sc = sol.shadow.camera;
  sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 200;
  escena.add(sol, sol.target);

  const piso = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.ShadowMaterial({ color: 0x3a2c10, opacity: 0.16 }));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  escena.add(piso);

  const material = new THREE.MeshPhysicalMaterial({
    color: ACABADOS.brillante.color, metalness: 1, roughness: ACABADOS.brillante.roughness,
    clearcoat: ACABADOS.brillante.clearcoat, clearcoatRoughness: 0.06, envMapIntensity: 1.3, specularIntensity: 1,
  });

  const pivote = new THREE.Group();     // vista Pieza: centra la pieza; la cámara orbita alrededor
  escena.add(pivote);
  const montajePieza = new THREE.Group(); // el montaje visto desde la pieza (sin silueta)
  montajePieza.matrixAutoUpdate = false;
  pivote.add(montajePieza);
  const puesta = new THREE.Group();     // vista Puesta (coordenadas del cuerpo, mm)
  puesta.visible = false;
  escena.add(puesta);

  let malla = null;
  let decals = [];
  let tipoActual = null;
  let infoPieza = null;
  let montaje = null;
  let colocacion = null;     // resultado de siluetas.colocar
  let modo = 'pieza';
  let grabadoVisible = false;
  // «Ver grabado»: corte por un plano que deja media argolla para leer la cara interior.
  const planoCorte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const materialCorte = new THREE.MeshPhysicalMaterial();
  const regla = new THREE.Group();
  regla.visible = false;
  escena.add(regla);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.07;
  controles.enablePan = false;
  controles.rotateSpeed = 0.7;
  controles.autoRotate = !reducirMovimiento;
  controles.autoRotateSpeed = 0.55;
  controles.minPolarAngle = 0.15;
  controles.maxPolarAngle = Math.PI / 2 - 0.04;
  // Vitrina (inicio): sin arrastre, para que el toque haga scroll de la página y el clic abra el diseñador.
  if (!interactivo) { controles.enabled = false; renderer.domElement.style.pointerEvents = 'none'; renderer.domElement.setAttribute('aria-hidden', 'true'); }
  let reanudar = null;
  let giroPreferido = !reducirMovimiento;
  controles.addEventListener('start', () => {
    controles.autoRotate = false;
    clearTimeout(reanudar);
    cancelarVuelo();
  });
  controles.addEventListener('end', () => {
    clearTimeout(reanudar);
    if (giroPreferido && modo === 'pieza') reanudar = setTimeout(() => { controles.autoRotate = true; }, 5000);
  });

  let radio = 20;
  let semi = { x: 20, y: 20 };   // semiejes visibles (mm) en la vista Pieza
  let centroPieza = new THREE.Vector3();

  // Vuelo suave de cámara (respeta reducir movimiento).
  let vuelo = null;
  function cancelarVuelo() { vuelo = null; }
  function volar(destPos, destTarget, ms = 650) {
    if (reducirMovimiento || ms <= 0) {
      // Un vuelo anterior aún en curso pisaría este encuadre inmediato.
      vuelo = null;
      camara.position.copy(destPos); controles.target.copy(destTarget); controles.update(); return;
    }
    vuelo = { p0: camara.position.clone(), t0: controles.target.clone(), p1: destPos, t1: destTarget, ini: performance.now(), ms };
  }

  function distanciaPara(semiX, semiY, margenX = 0.8, margenY = 0.72) {
    const ancho = contenedor.clientWidth || 1, alto = contenedor.clientHeight || 1;
    const aspecto = ancho / alto;
    const tv = Math.tan((camara.fov * Math.PI) / 360);
    return Math.max(semiY / (tv * margenY), semiX / (tv * aspecto * margenX));
  }

  function encuadrar(suave = false) {
    if (modo === 'puesta') return encuadrarPuesta(suave);
    const dist = Math.max(distanciaPara(semi.x, semi.y), radio * 1.2) + radio * 0.4;
    const destino = centroPieza.clone();
    const dir = camara.position.clone().sub(controles.target).normalize();
    if (!suave || dir.lengthSq() < 0.5) dir.set(0, 0.16, 1).normalize();
    controles.minDistance = dist * 0.25;
    controles.maxDistance = dist * 2.6;
    controles.minPolarAngle = 0.15;
    controles.maxPolarAngle = Math.PI / 2 - 0.04;
    controles.minAzimuthAngle = -Infinity; controles.maxAzimuthAngle = Infinity;
    volar(destino.clone().add(dir.multiplyScalar(dist)), destino, suave ? 450 : 0);
  }

  function encuadrarPuesta(suave = false) {
    if (!colocacion) return;
    const e = colocacion.encuadre;
    const ancho = contenedor.clientWidth || 1, alto = contenedor.clientHeight || 1;
    const asp = ancho / alto;
    // En pantallas angostas, que quepa también a lo ancho.
    const semiY = e.alto / 2, semiX = Math.max(e.alto * 0.42, e.alto / 2 * Math.min(1, 0.95));
    const dist = distanciaPara(semiX, semiY, asp < 0.9 ? 0.98 : 0.95, 0.96) * acercarPuesta;
    const dir = e.dir.clone().normalize();
    controles.minDistance = dist * 0.35;
    controles.maxDistance = dist * 1.8;
    controles.minPolarAngle = 0.35;
    controles.maxPolarAngle = Math.PI * 0.72;
    const az = Math.atan2(dir.x, dir.z);
    controles.minAzimuthAngle = az - 1.1; controles.maxAzimuthAngle = az + 1.1;
    // Más cerca (vitrina del inicio): el centro se corre hacia la pieza para que no quede cortada.
    const centro = e.centro.clone();
    if (acercarPuesta < 1) centro.lerp(new THREE.Vector3().setFromMatrixPosition(colocacion.matriz), Math.min(1, (1 - acercarPuesta) * 1.1));
    volar(centro.clone().add(dir.multiplyScalar(dist)), centro, suave ? 700 : 0);
  }

  function ajustarTamano() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => { ajustarTamano(); });
  ro.observe(contenedor);
  ajustarTamano();

  let vivo = true;
  let ultimo = performance.now();
  renderer.setAnimationLoop(() => {
    if (!vivo) return;
    const ahora = performance.now();
    const dt = Math.min(0.1, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (vuelo) {
      const u = Math.min(1, (ahora - vuelo.ini) / vuelo.ms), e = 1 - (1 - u) ** 3;
      camara.position.lerpVectors(vuelo.p0, vuelo.p1, e);
      controles.target.lerpVectors(vuelo.t0, vuelo.t1, e);
      if (u >= 1) vuelo = null;
    }
    controles.update(dt);
    renderer.render(escena, camara);
  });

  function luzPara(centro, tam) {
    sol.position.copy(centro).add(new THREE.Vector3(tam * 0.9, tam * 3.2, tam * 1.9));
    sol.target.position.copy(centro);
    const s = Math.max(20, tam * 2.2);
    sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 1; sc.far = tam * 12;
    sc.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------------------------------
  function ponerGeometria(geo, tipo, extra = {}) {
    if (malla) { pivote.remove(malla); malla.geometry.dispose(); }
    for (const d of decals) { d.parent?.remove(d); d.geometry.dispose(); if (!d.material.__compartido) { d.material.map?.dispose(); d.material.dispose(); } }
    decals = [];
    geo.computeBoundingBox();
    const conGrabado = grabadoVisible;
    malla = new THREE.Mesh(geo, material);
    malla.castShadow = true;
    malla.receiveShadow = false;
    tipoActual = tipo;
    infoPieza = extra.info || null;
    const b = geo.boundingBox;
    const tam = new THREE.Vector3(); b.getSize(tam);
    if (tipo === 'anillo') {
      malla.rotation.set(0, 0.62, 0);
      malla.position.set(0, 0, 0);
    } else {
      const cz = (b.min.z + b.max.z) / 2;
      malla.position.set(0, 0, -cz);
      malla.rotation.set(0, 0, 0);
    }
    if (reversoActivo && tipo !== 'anillo') malla.rotation.y = Math.PI;
    pivote.add(malla);
    if (extra.decals) for (const d of extra.decals) { malla.add(d); decals.push(d); }
    reconstruirMontaje();
    grabadoVisible = false;
    if (conGrabado && tipo === 'anillo' && decals.length) verGrabado(true);
    return malla;
  }

  // Coloca la pieza (y su montaje) para la vista Pieza: pose, piso, regla y encuadre.
  function poseDePieza() {
    if (!malla) return;
    const b = malla.geometry.boundingBox;
    const tam = new THREE.Vector3(); b.getSize(tam);
    if (tipoActual === 'anillo') {
      const r = tam.x / 2;
      pivote.position.set(0, r, 0);
      pivote.rotation.set(0, 0, 0);
      radio = r * 1.15;
      semi = { x: r * 1.15, y: r * 1.05 };
      centroPieza.set(0, r, 0);
    } else {
      pivote.rotation.set(-0.12, 0, 0);
      let alto = tam.y / 2 + Math.max(3, tam.y * 0.22);
      // Con montaje: la caja de lo que se ve cerca de la pieza.
      const cajaM = new THREE.Box3();
      if (montajePieza.children.length) {
        montajePieza.updateMatrixWorld(true);
        const tmp = new THREE.Box3().setFromObject(montajePieza, true);
        const inv = new THREE.Matrix4().copy(pivote.matrixWorld).invert();
        tmp.applyMatrix4(inv);
        cajaM.copy(tmp);
        if (!cajaM.isEmpty()) alto = Math.max(alto, -cajaM.min.y + 2);
      }
      pivote.position.set(0, alto, 0);
      radio = Math.max(tam.x, tam.y) * 0.56 + 1;
      semi = { x: tam.x / 2 + 1, y: tam.y / 2 + 1 };
      centroPieza.set(0, alto, 0);
      const lugar = montaje && lugarDe(montaje);
      if (!cajaM.isEmpty() && (lugar === 'muneca' || lugar === 'tobillo')) {
        // Pulsera y tobillera: se ve el aro completo.
        semi = { x: Math.max(semi.x, (cajaM.max.x - cajaM.min.x) / 2 + 2), y: Math.max(semi.y, (cajaM.max.y - cajaM.min.y) / 2 + 2) };
        radio = Math.max(radio, Math.max(semi.x, semi.y));
        centroPieza.set(0, alto + (cajaM.max.y + cajaM.min.y) / 2 * 0.5, 0);
      } else if (!cajaM.isEmpty()) {
        semi = { x: semi.x * 1.25, y: semi.y * 1.35 };
        radio *= 1.2;
        centroPieza.set(0, alto + tam.y * 0.18, 0);
      }
    }
    actualizarRegla(tam, tipoActual);
    luzPara(centroPieza, radio);
  }

  // ---------------------------------------------------------------------------------------
  // Montaje (cadena / tejido / balines) y vista Puesta
  // ---------------------------------------------------------------------------------------
  function vaciar(g) {
    while (g.children.length) {
      const c = g.children.pop();
      c.traverse?.((o) => {
        if (o.isMesh) { o.geometry?.dispose?.(); if (o.material && !o.material.__compartido) { o.material.bumpMap = null; o.material.dispose?.(); } }
      });
    }
  }
  material.__compartido = true;

  function datosPieza() {
    const b = malla.geometry.boundingBox;
    const info = infoPieza || {};
    return {
      tipo: tipoActual,
      argollas: info.argollas || [],
      ri: tipoActual === 'anillo' ? (info.diametro_interior || 17) / 2 : (info.argolla_ri || 1.4),
      grosor: b.max.z - b.min.z,
      caja: { x0: b.min.x, x1: b.max.x, y0: b.min.y, y1: b.max.y },
    };
  }

  function reconstruirMontaje() {
    vaciar(montajePieza);
    vaciar(puesta);
    colocacion = null;
    if (!malla) { poseDePieza(); return; }
    const pieza = datosPieza();
    const lugar = montaje && montaje.soporte !== 'ninguno' && tipoActual !== 'anillo' ? lugarDe(montaje) : null;
    if (tipoActual === 'anillo') {
      colocacion = colocarAnillo(pieza);
    } else if (lugar) {
      const rCordon = montaje.soporte === 'cadena' ? RADIO_CADENA[montaje.cadena.estilo] : RADIO_TEJIDO[montaje.tejido.patron];
      colocacion = colocar(lugar, pieza, largoMm(montaje), rCordon);
    }
    if (colocacion) {
      // Silueta + pieza en la vista Puesta.
      puesta.add(colocacion.silueta);
      const copia = malla.clone(true);
      copia.position.set(0, 0, 0); copia.rotation.set(0, 0, 0); copia.scale.set(1, 1, 1);
      const local = new THREE.Matrix4();
      if (tipoActual !== 'anillo') local.makeTranslation(0, 0, malla.position.z);
      copia.matrixAutoUpdate = false;
      copia.matrix.copy(colocacion.matriz).multiply(local);
      copia.castShadow = true;
      puesta.add(copia);
      // Montaje.
      if (colocacion.camino) {
        const m = construirMontaje(colocacion, pieza);
        puesta.add(m);
        const m2 = construirMontaje(colocacion, pieza);
        montajePieza.add(m2);
        montajePieza.matrix.copy(colocacion.matriz).invert();
        montajePieza.matrixWorldNeedsUpdate = true;
      }
    }
    poseDePieza();
    if (modo === 'puesta') {
      if (colocacion) luzPara(colocacion.encuadre.centro, colocacion.encuadre.alto * 0.55);
      else fijarVista('pieza');
    }
  }

  function construirMontaje(col, pieza) {
    const g = new THREE.Group();
    const eje = lugarDe(montaje) === 'cuello' ? new THREE.Vector3(0, 0, -8) : new THREE.Vector3(0, 0, 0);
    const rec = new Recorrido(col.camino.puntos, { cerrado: col.camino.cerrado, eje, paso: 0.5 });
    // Dónde está el dije sobre el recorrido.
    const L = rec.largo;
    let dije, extremos;
    if (col.camino.cerrado) {
      // El recorrido empieza y termina en la argolla (frente).
      dije = { sA: L - 3, sB: 3 };
      extremos = { sA: L * 0.5 + 6, sB: L * 0.5 - 6 };
      // Para que las fórmulas de «repartidos» funcionen en el aro, usamos s negativos a la izquierda.
      dije = { sA: -3, sB: 3 };
      extremos = { sA: -L * 0.5 + 9, sB: L * 0.5 - 9 };
    } else {
      dije = { sA: 0, sB: L };
      extremos = { sA: 0, sB: L };
    }
    // En el cuello solo se ve el frente: los «extremos» son los lados del cuello.
    if (lugarDe(montaje) === 'cuello') {
      const atras = Math.min(L * 0.32, 175);
      if (col.camino.cerrado) extremos = { sA: -(L / 2 - atras / 2), sB: L / 2 - atras / 2 };
      else extremos = { sA: 18, sB: L - 18 };
      if (!col.camino.cerrado) {
        // Abierto: va de la argolla izquierda (s=0) a la derecha (s=L) por detrás.
        dije = { sA: L, sB: 0 };
      }
    }
    let lista = [];
    const b = montaje.balines;
    if (b.cantidad) {
      if (col.camino.cerrado) {
        lista = posicionesBalines(b, rec, { dije, extremos });
      } else {
        // Abierto: el lado «A» del dije es el final del recorrido y el «B» el comienzo.
        const n = b.cantidad;
        const paso = b.diametro + 0.35;
        if (b.distribucion === 'junto_al_dije') {
          for (let i = 0; i < n; i++) { const k = Math.floor(i / 2); lista.push(i % 2 ? L - 1.6 - b.diametro / 2 - k * paso : 1.6 + b.diametro / 2 + k * paso); }
        } else if (b.distribucion === 'extremos') {
          const e0 = lugarDe(montaje) === 'cuello' ? Math.min(L * 0.3, 120) : 8;
          for (let i = 0; i < n; i++) { const k = Math.floor(i / 2); lista.push(i % 2 ? L - e0 - k * paso : e0 + k * paso); }
        } else {
          const vis = lugarDe(montaje) === 'cuello' ? Math.min(L * 0.32, 150) : L / 2 - 6;
          const izq = Math.ceil(n / 2), der = Math.floor(n / 2);
          for (let i = 1; i <= izq; i++) lista.push(4 + ((vis - 4) * i) / (izq + 1));
          for (let i = 1; i <= der; i++) lista.push(L - 4 - ((vis - 4) * i) / (der + 1));
        }
      }
    }
    const huecos = lista.map((s) => [s - b.diametro / 2 - 0.2, s + b.diametro / 2 + 0.2]);
    if (montaje.soporte === 'tejido') {
      g.add(construirTejido(rec, montaje.tejido, huecos));
      if (montaje.tejido.uso !== 'collar') {
        // Corredizo por detrás/abajo, lejos de la pieza.
        g.add(construirCorredizo(rec, col.camino.cerrado ? L / 2 : L / 2, montaje.tejido));
      }
    } else {
      g.add(construirCadena(rec, montaje.cadena.estilo, material, huecos.map(([a, c]) => [a + 0.4, c - 0.4])));
    }
    if (lista.length) g.add(construirBalines(rec, lista, b, material));
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    void pieza;
    return g;
  }

  // Fija el montaje sin reconstruir (lo hará ponerGeometria enseguida).
  function fijarMontajeSilencioso(m) { montaje = m ? structuredClone(m) : null; }
  function fijarMontaje(m) {
    montaje = m ? structuredClone(m) : null;
    reconstruirMontaje();
  }

  function fijarVista(v) {
    if (grabadoVisible && v === 'puesta') verGrabado(false);
    if (v === 'puesta' && reversoActivo) { reversoActivo = false; if (malla) malla.rotation.y = 0; }
    const nuevo = v === 'puesta' && colocacion ? 'puesta' : 'pieza';
    modo = nuevo;
    puesta.visible = modo === 'puesta';
    pivote.visible = modo === 'pieza';
    piso.visible = modo === 'pieza';
    regla.visible = modo === 'pieza' && reglaPreferida;
    controles.autoRotate = modo === 'pieza' && giroPreferido;
    if (modo === 'puesta') {
      const e = colocacion.encuadre;
      luzPara(e.centro, e.alto * 0.55);
      sol.intensity = 1.25;
      sol.shadow.radius = 5;
      hemi.intensity = 0.55;
      encuadrarPuesta(true);
    } else {
      sol.intensity = 1.1;
      sol.shadow.radius = 9;
      hemi.intensity = 0.35;
      poseDePieza();
      encuadrar(false);
    }
    return modo;
  }

  let reglaPreferida = false;
  function actualizarRegla(tam, tipo) {
    while (regla.children.length) {
      const c = regla.children.pop();
      c.geometry?.dispose(); c.material?.map?.dispose(); c.material?.dispose();
    }
    const largo = Math.ceil(tam.x / 5) * 5;
    const x0 = -largo / 2;
    const z = tipo === 'anillo' ? tam.x * 0.75 + 3 : 6;
    const pts = [new THREE.Vector3(x0, 0.02, z), new THREE.Vector3(x0 + largo, 0.02, z)];
    for (let i = 0; i <= largo; i++) {
      const h = i % 10 === 0 ? 2.2 : i % 5 === 0 ? 1.5 : 0.8;
      pts.push(new THREE.Vector3(x0 + i, 0.02, z), new THREE.Vector3(x0 + i, 0.02, z - h));
    }
    const lineas = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x100f0d }));
    regla.add(lineas);
    const etiqueta = (texto, x) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#100f0d';
      g.font = '500 34px Outfit, system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(texto, 128, 32);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.03, z + 1.8);
      regla.add(m);
    };
    etiqueta('0', x0);
    etiqueta(`${largo} mm`, x0 + largo);
  }

  function verGrabado(activo = !grabadoVisible) {
    if (!malla || tipoActual !== 'anillo' || !decals.length) activo = false;
    if (activo && modo !== 'pieza') fijarVista('pieza');
    grabadoVisible = activo;
    if (activo) {
      materialCorte.copy(material);
      materialCorte.side = THREE.DoubleSide;
      materialCorte.clippingPlanes = [planoCorte];
      malla.material = materialCorte;
      for (const d of decals) { d.material.clippingPlanes = [planoCorte]; d.material.needsUpdate = true; }
      // Anillo de pie, eje hacia la cámara; el corte quita la mitad de arriba.
      malla.rotation.set(0, 0, 0);
      malla.updateMatrixWorld(true);
      const c = new THREE.Vector3(); malla.getWorldPosition(c);
      planoCorte.constant = c.y + 0.2;
      controles.autoRotate = false;
      const r = (infoPieza?.diametro_interior || 17) / 2;
      const objetivo = c.clone().add(new THREE.Vector3(0, -r * 0.55, 0));
      const dir = new THREE.Vector3(0, 1.25, 1).normalize();
      volar(objetivo.clone().add(dir.multiplyScalar(r * 4.6)), objetivo, 800);
    } else if (malla) {
      malla.material = material;
      for (const d of decals) { d.material.clippingPlanes = null; d.material.needsUpdate = true; }
      if (tipoActual === 'anillo') malla.rotation.set(0, 0.62, 0);
      controles.autoRotate = giroPreferido && modo === 'pieza';
      encuadrar(true);
    }
    return grabadoVisible;
  }

  // Reverso: la pieza gira 180° sobre su eje vertical (solo en la vista Pieza, sin giro automático).
  let reversoActivo = false;
  function reverso(v = !reversoActivo) {
    reversoActivo = Boolean(v) && Boolean(malla) && tipoActual !== 'anillo';
    if (reversoActivo && modo !== 'pieza') fijarVista('pieza');
    if (malla && tipoActual !== 'anillo') malla.rotation.y = reversoActivo ? Math.PI : 0;
    if (reversoActivo) { controles.autoRotate = false; encuadrar(true); }
    else controles.autoRotate = giroPreferido && modo === 'pieza';
    return reversoActivo;
  }

  function fijarAcabado(nombre) {
    const a = ACABADOS[nombre] || ACABADOS.brillante;
    material.color.set(a.color);
    material.roughness = a.roughness;
    material.clearcoat = a.clearcoat;
    material.needsUpdate = true;
    if (grabadoVisible) { materialCorte.copy(material); materialCorte.side = THREE.DoubleSide; materialCorte.clippingPlanes = [planoCorte]; }
  }

  // Captura cuadrada. `vista`: 'puesta' | 'pieza' | null (la actual).
  function capturar(lado = 1200, { vista = null } = {}) {
    const prevW = renderer.domElement.width, prevH = renderer.domElement.height;
    const prevPR = renderer.getPixelRatio();
    const prevAsp = camara.aspect;
    const modoPrevio = modo;
    const camPrev = { p: camara.position.clone(), t: controles.target.clone() };
    const vueloPrevio = vuelo; vuelo = null;
    renderer.setPixelRatio(1);
    renderer.setSize(lado, lado, false);
    camara.aspect = 1;
    camara.updateProjectionMatrix();
    const quiere = vista || modo;
    if (quiere !== modo) {
      const rm = reducirMovimiento; reducirMovimiento = true;
      fijarVista(quiere);
      reducirMovimiento = rm;
    } else if (vista) {
      const rm = reducirMovimiento; reducirMovimiento = true;
      if (modo === 'puesta') encuadrarPuesta(false); else encuadrar(false);
      reducirMovimiento = rm;
    }
    // El encuadre usa el tamaño del contenedor: lo corregimos para el cuadrado.
    if (vista) {
      const d = camara.position.clone().sub(controles.target);
      const w = contenedor.clientWidth || 1, h = contenedor.clientHeight || 1;
      if (w / h > 1) d.multiplyScalar(Math.min(1.6, w / h) * 0.92);
      camara.position.copy(controles.target).add(d);
    }
    controles.update();
    renderer.render(escena, camara);
    const url = renderer.domElement.toDataURL('image/png');
    if (quiere !== modoPrevio) {
      const rm = reducirMovimiento; reducirMovimiento = true;
      fijarVista(modoPrevio);
      reducirMovimiento = rm;
    }
    camara.position.copy(camPrev.p); controles.target.copy(camPrev.t);
    vuelo = vueloPrevio;
    renderer.setPixelRatio(prevPR);
    renderer.setSize(prevW / prevPR, prevH / prevPR, false);
    camara.aspect = prevAsp;
    camara.updateProjectionMatrix();
    controles.update();
    ajustarTamano();
    return url;
  }

  return {
    renderer, escena, camara, controles, material, pivote, puesta,
    ponerGeometria, encuadrar, radio: () => radio, fijarAcabado, capturar, fijarMontaje, fijarMontajeSilencioso, fijarVista,
    vista: () => modo,
    verGrabado,
    reverso: (v) => (v === undefined ? reversoActivo : reverso(v)),
    grabadoVisible: () => grabadoVisible,
    puedePuesta: () => Boolean(colocacion),
    obtenerMalla: () => malla,
    regla: (v) => { reglaPreferida = v ?? !reglaPreferida; regla.visible = reglaPreferida && modo === 'pieza'; return reglaPreferida; },
    giro: (v) => { giroPreferido = v ?? !giroPreferido; controles.autoRotate = giroPreferido && modo === 'pieza'; return giroPreferido; },
    destruir() {
      vivo = false;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      controles.dispose();
      if (malla) malla.geometry.dispose();
      vaciar(puesta); vaciar(montajePieza);
      material.dispose();
      entorno.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
