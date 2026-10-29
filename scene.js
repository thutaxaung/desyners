// 3D hero: the Desyners logo, extruded from assets/logo.svg, turns with scroll and leans toward the mouse.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const hero = document.querySelector('.hero');
const pin = document.querySelector('.hero-pin');
const canvas = document.getElementById('hero-3d');
const anchor = document.querySelector('.hero-art');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fail() { document.documentElement.classList.add('no-webgl'); canvas.remove(); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { fail(); }

if (renderer) start();

function start() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Sky-blue rim light from behind so the edges glow in the brand blues.
  const rim = new THREE.PointLight(0x6aaef5, 70, 30);
  rim.position.set(-3, 2, -3);
  scene.add(rim);
  const rim2 = new THREE.PointLight(0x2f7bff, 45, 30);
  rim2.position.set(4, -2, -2);
  scene.add(rim2);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 3, 5);
  scene.add(key);

  const group = new THREE.Group();   // moved by scroll / layout
  const spin = new THREE.Group();    // rotated by scroll, mouse and time
  group.add(spin);
  scene.add(group);

  // Floating blue particles around the logo.
  const COUNT = innerWidth < 860 ? 140 : 320;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.2 + Math.random() * 3.2, a = Math.random() * Math.PI * 2, y = (Math.random() - .5) * 4;
    pos.set([Math.cos(a) * r, y, Math.sin(a) * r - 1], i * 3);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x2f7bff, size: 0.035, transparent: true, opacity: .85, depthWrite: false
  }));
  group.add(particles);

  new SVGLoader().load('assets/logo.svg', (data) => {
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 170, curveSegments: 28,
      bevelEnabled: true, bevelThickness: 26, bevelSize: 16, bevelSegments: 8
    });
    geo.center();
    const s = 3.1 / 1458;            // logo is 1458 SVG units wide -> 3.1 world units
    geo.scale(s, -s, s);             // SVG y points down
    geo.computeVertexNormals();
    // Logo finishes; ?logo=<name> previews one, otherwise FINISH is used.
    const FINISHES = {
      graphite: { color: 0x565e70, metalness: .7, roughness: .27, clearcoat: .8, clearcoatRoughness: .12, envMapIntensity: 2.2 },
      blue:     { color: 0x1d5cff, metalness: .25, roughness: .18, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.6 },
      pearl:    { color: 0xf4f7ff, metalness: 0, roughness: .22, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.2, sheen: 1, sheenColor: 0x9cc4ff },
      chrome:   { color: 0xdfe7f5, metalness: 1, roughness: .1, envMapIntensity: 1.8 },
      iris:     { color: 0x7fa8ff, metalness: .55, roughness: .16, clearcoat: 1, clearcoatRoughness: .05, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [250, 800], envMapIntensity: 1.8 }
    };
    const FINISH = 'graphite';
    const pick = new URLSearchParams(location.search).get('logo');
    const mat = new THREE.MeshPhysicalMaterial({ ...(FINISHES[pick] || FINISHES[FINISH]), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    spin.add(mesh);
    intro = 0;
  }, undefined, fail);

  // ---- state ----
  let intro = -1;                    // -1 until the model has loaded, then animates 0 -> 1
  let p = 0, pSmooth = 0;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const home = new THREE.Vector3(), center = new THREE.Vector3(0, .35, 0);
  let homeScale = 1, visible = true;

  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  // Where on screen the logo should sit: the centre of .hero-art, converted to world units at z = 0.
  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    const nx = ((ar.left + ar.width / 2 - hr.left) / w) * 2 - 1;
    const ny = -(((ar.top + ar.height / 2 - hr.top) / h) * 2 - 1);
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const viewW = viewH * camera.aspect;
    home.set(nx * viewW / 2, ny * viewH / 2, 0);
    homeScale = Math.min((ar.width / w) * viewW / 3.3, 1.35);
  }
  new ResizeObserver(layout).observe(hero);
  addEventListener('load', layout);
  layout();

  function progress() {
    const r = pin.getBoundingClientRect();
    const range = pin.offsetHeight - hero.offsetHeight;
    if (range > 10) return THREE.MathUtils.clamp(-r.top / range, 0, 1);
    return THREE.MathUtils.clamp(-r.top / Math.max(hero.offsetHeight, 1), 0, 1);
  }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;

    p = progress();
    pSmooth += (p - pSmooth) * Math.min(1, dt * 6);
    const pinned = pin.offsetHeight - hero.offsetHeight > 10;
    hero.style.setProperty('--p', pinned ? pSmooth.toFixed(4) : 0);

    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4);

    if (intro >= 0 && intro < 1) intro = Math.min(1, intro + dt / 1.6);
    const k = ease(Math.max(intro, 0));
    const idle = reduced ? 0 : t;

    // Desktop: travel from beside the headline to centre stage and grow. Phones: stay put, just turn.
    const travel = pinned ? ease(pSmooth) : 0;
    group.position.lerpVectors(home, center, travel);
    group.position.y += Math.sin(idle * 1.2) * .06 + (1 - k) * -1.2;
    const sc = THREE.MathUtils.lerp(homeScale, homeScale * 1.3, travel) * (0.6 + .4 * k);
    group.scale.setScalar(sc);

    spin.rotation.y = -0.45 + pSmooth * Math.PI * 2 + Math.sin(idle * .5) * .18 + mouse.sx * .45 + (1 - k) * -1.6;
    spin.rotation.x = 0.12 + Math.sin(pSmooth * Math.PI) * .45 + mouse.sy * .3;
    spin.rotation.z = Math.sin(idle * .35) * .04;

    particles.rotation.y = idle * .05 + pSmooth * 1.5;
    particles.material.opacity = .85 * k;
    rim.intensity = 70 + pSmooth * 80;

    renderer.render(scene, camera);
  }
  frame();
}
