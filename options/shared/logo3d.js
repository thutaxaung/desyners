// Shared 3D Desyners logo: extrudes assets/logo.svg into a mesh. Used by all three design options.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export const FINISHES = {
  chrome: { color: 0xdfe7f5, metalness: 1, roughness: .1, envMapIntensity: 1.8 },
  blue:   { color: 0x1d5cff, metalness: .25, roughness: .18, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.6 },
  glass:  { color: 0xffffff, metalness: 0, roughness: .05, transmission: 1, thickness: .6, ior: 1.45, iridescence: .6, envMapIntensity: 1.4 }
};

// Resolves to { mesh, geometry }. width is the logo's width in world units.
export function loadLogo(url, finish = 'chrome', width = 3.1) {
  return new Promise((resolve, reject) => {
    new SVGLoader().load(url, (data) => {
      const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 170, curveSegments: 28,
        bevelEnabled: true, bevelThickness: 26, bevelSize: 16, bevelSegments: 8
      });
      geometry.center();
      const s = width / 1458;
      geometry.scale(s, -s, s);
      geometry.computeVertexNormals();
      const material = new THREE.MeshPhysicalMaterial({ ...FINISHES[finish], side: THREE.DoubleSide });
      resolve({ mesh: new THREE.Mesh(geometry, material), geometry });
    }, undefined, reject);
  });
}
