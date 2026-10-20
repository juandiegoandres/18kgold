// Adornos que solo existen en la vista (no van al STL): piedras (circonia en el asiento del punto de luz)
// y esmaltes de color (ojo turco). Se cuelgan de la malla como hijos.
import * as THREE from 'three';

let materialPiedra = null;
function matPiedra() {
  if (!materialPiedra) {
    // Circonia: facetas espejadas casi blancas con un leve tornasol; sobre el fondo claro una transmisión
    // real se veía gris y apagada.
    materialPiedra = new THREE.MeshPhysicalMaterial({
      color: 0xf6f8ff, metalness: 0.92, roughness: 0.03, envMapIntensity: 2.6, flatShading: true,
      clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.6, iridescenceIOR: 1.8, iridescenceThicknessRange: [180, 520],
    });
    materialPiedra.__compartido = true;
  }
  return materialPiedra;
}

// Talla brillante simplificada: mesa, corona, filetín y pabellón (16 facetas).
function geometriaBrillante(d) {
  const R = d / 2;
  const perfil = [
    new THREE.Vector2(0, -0.43 * d),
    new THREE.Vector2(R * 0.985, -0.012 * d),
    new THREE.Vector2(R, 0),
    new THREE.Vector2(R * 0.985, 0.012 * d),
    new THREE.Vector2(R * 0.56, 0.16 * d),
    new THREE.Vector2(0, 0.16 * d),
  ];
  const g = new THREE.LatheGeometry(perfil, 16);
  g.rotateX(Math.PI / 2);
  return g.toNonIndexed();
}

export function adornosVista(info = {}) {
  const out = [];
  for (const q of info.piedras || []) {
    const m = new THREE.Mesh(geometriaBrillante(q.d), matPiedra());
    // El filetín apoya al ras del asiento.
    m.position.set(q.x, q.y, q.z + 0.02);
    m.castShadow = true;
    m.userData.adorno = 'piedra';
    out.push(m);
  }
  for (const e of info.esmaltes || []) {
    const geo = e.ri > 0 ? new THREE.RingGeometry(e.ri, e.ro, 96) : new THREE.CircleGeometry(e.ro, 96);
    const mat = new THREE.MeshPhysicalMaterial({ color: e.color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, metalness: 0 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(e.x, e.y, e.z);
    m.userData.adorno = 'esmalte';
    out.push(m);
  }
  return out;
}
