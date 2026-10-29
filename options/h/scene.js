// Option H: a 3D phone "product shot" that turns through six chapters as you scroll.
// The phone's screen is a canvas redrawn every frame, so each chapter shows a live app.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const stick = document.querySelector('.stick'), canvas = document.getElementById('stage');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
catch (e) { document.documentElement.classList.add('no-webgl'); canvas.remove(); }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100); camera.position.set(0, .35, 11.5);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);
  const rimL = new THREE.PointLight(0x6aaef5, 70, 30); rimL.position.set(-5, 2, -3); scene.add(rimL);
  const rimR = new THREE.PointLight(0x2f7bff, 60, 30); rimR.position.set(5, -1, -2); scene.add(rimR);

  /* ---------------- The phone ---------------- */
  const PW = 1.62, PH = 3.36, PD = .2;
  const phone = new THREE.Group(), body = new THREE.Group();
  phone.add(body); scene.add(phone);
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x2c5fe0, metalness: .8, roughness: .26, clearcoat: .8, clearcoatRoughness: .15, envMapIntensity: 1.5 });
  body.add(new THREE.Mesh(new RoundedBoxGeometry(PW, PH, PD, 8, .24), metal));
  // side buttons
  const btnGeo = new RoundedBoxGeometry(.04, .32, .07, 2, .015);
  [[PW / 2 + .012, .7], [-PW / 2 - .012, .9], [-PW / 2 - .012, .45]].forEach(([x, y]) => { const b = new THREE.Mesh(btnGeo, metal); b.position.set(x, y, 0); body.add(b); });
  // camera bump on the back
  const bump = new THREE.Mesh(new RoundedBoxGeometry(.66, .66, .06, 4, .14), new THREE.MeshPhysicalMaterial({ color: 0x2552c4, metalness: .6, roughness: .2, clearcoat: 1 }));
  bump.position.set(-.38, 1.18, -PD / 2 - .02); body.add(bump);
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x05070d, metalness: .2, roughness: .05, clearcoat: 1 });
  [[-.52, 1.32], [-.24, 1.04], [-.52, 1.04]].forEach(([x, y]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .05, 32), lensMat); l.rotation.x = Math.PI / 2; l.position.set(x, y, -PD / 2 - .06); body.add(l); });

  // live screen
  const SW = 600, SH = Math.round(600 * (PH - .06) / (PW - .06));
  const sc = document.createElement('canvas'); sc.width = SW; sc.height = SH;
  const g = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW - .06, PH - .06), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, toneMapped: false }));
  screen.position.z = PD / 2 + .003; body.add(screen);

  // logo on the back
  const logoImg = new Image(); logoImg.src = '../../assets/logo-mark.png';
  const bc = document.createElement('canvas'); bc.width = 512; bc.height = 512;
  const backTex = new THREE.CanvasTexture(bc); backTex.colorSpace = THREE.SRGBColorSpace;
  logoImg.onload = () => {
    const b = bc.getContext('2d'); b.clearRect(0, 0, 512, 512);
    const w = 300, h = w * logoImg.height / logoImg.width; b.drawImage(logoImg, (512 - w) / 2, (512 - h) / 2 - 20, w, h);
    b.fillStyle = 'rgba(255,255,255,.9)'; b.font = '700 34px Inter, sans-serif'; b.textAlign = 'center'; b.fillText('DESYNERS', 256, 400);
    backTex.needsUpdate = true;
  };
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: backTex, transparent: true, opacity: .9 }));
  back.position.set(0, -.2, -PD / 2 - .003); back.rotation.y = Math.PI; body.add(back);

  /* ---------------- Mirror floor with a soft fade ---------------- */
  const floorShader = {
    uniforms: { color: { value: new THREE.Color(0xcfe0ff) }, tDiffuse: { value: null }, textureMatrix: { value: null } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vUv2;
      void main(){ vUv = textureMatrix * vec4(position, 1.0); vUv2 = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; varying vec4 vUv; varying vec2 vUv2;
      void main(){ vec4 base = texture2DProj(tDiffuse, vUv); float f = 1.0 - smoothstep(.04, .48, distance(vUv2, vec2(.5)));
        gl_FragColor = vec4(base.rgb * color, base.a * f * .42);
        #include <colorspace_fragment>
      }`
  };
  const floor = new Reflector(new THREE.CircleGeometry(5.5, 64), { shader: floorShader, clipBias: .003, textureWidth: 1024, textureHeight: 1024, color: 0xcfe0ff });
  floor.material.transparent = true; floor.material.depthWrite = false;
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // contact shadow
  const shC = document.createElement('canvas'); shC.width = shC.height = 128;
  const shg = shC.getContext('2d'), grd = shg.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, 'rgba(8,30,90,.45)'); grd.addColorStop(1, 'rgba(8,30,90,0)'); shg.fillStyle = grd; shg.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shC), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

  /* ---------------- Chapter 2: floating hearts ---------------- */
  const heartTex = (col) => { const c = document.createElement('canvas'); c.width = c.height = 128; const h = c.getContext('2d'); h.font = '100px serif'; h.textAlign = 'center'; h.textBaseline = 'middle'; h.fillStyle = col; h.fillText('♥', 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const hTex = [heartTex('#ff4d6d'), heartTex('#2f7bff'), heartTex('#6aaef5')];
  const hearts = Array.from({ length: 18 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hTex[i % 3], transparent: true, depthWrite: false })); s.userData = { o: Math.random(), sp: .12 + Math.random() * .12, x: (Math.random() - .5) * 3.2, z: (Math.random() - .5) * 1.5, s: .18 + Math.random() * .22 }; scene.add(s); return s; });

  /* ---------------- Chapter 3: AI agent nodes with data pulses ---------------- */
  // Vector icons (blue tile, white symbol) so they look the same on every device
  const iconTex = (kind) => {
    const c = document.createElement('canvas'); c.width = c.height = 160; const h = c.getContext('2d');
    const gr = h.createLinearGradient(0, 0, 160, 160); gr.addColorStop(0, '#4d92ff'); gr.addColorStop(1, '#0a4fd8');
    h.fillStyle = gr; h.beginPath(); h.roundRect(8, 8, 144, 144, 40); h.fill();
    h.strokeStyle = h.fillStyle = '#fff'; h.lineWidth = 11; h.lineCap = h.lineJoin = 'round';
    if (kind === 'chat') { h.beginPath(); h.roundRect(36, 44, 88, 62, 22); h.fill(); h.beginPath(); h.moveTo(56, 100); h.lineTo(48, 122); h.lineTo(76, 104); h.fill(); h.fillStyle = '#0a5cf0'; [60, 80, 100].forEach((x) => { h.beginPath(); h.arc(x, 75, 6, 0, 6.3); h.fill(); }); }
    if (kind === 'ai') { const star = (x, y, r) => { h.beginPath(); h.moveTo(x, y - r); h.quadraticCurveTo(x, y, x + r, y); h.quadraticCurveTo(x, y, x, y + r); h.quadraticCurveTo(x, y, x - r, y); h.quadraticCurveTo(x, y, x, y - r); h.fill(); }; star(72, 82, 40); star(116, 50, 18); }
    if (kind === 'bars') { [[44, 88], [70, 64], [96, 40]].forEach(([x, y]) => { h.beginPath(); h.roundRect(x, y, 20, 120 - y, 6); h.fill(); }); }
    if (kind === 'bell') { h.beginPath(); h.moveTo(48, 104); h.quadraticCurveTo(54, 96, 54, 76); h.quadraticCurveTo(56, 44, 80, 42); h.quadraticCurveTo(104, 44, 106, 76); h.quadraticCurveTo(106, 96, 112, 104); h.closePath(); h.fill(); h.beginPath(); h.arc(80, 114, 10, 0, Math.PI); h.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const nodeMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: .1, roughness: .15, clearcoat: 1, transmission: .2, envMapIntensity: 1.3 });
  const nodeDefs = [['chat', -1.7, 1.2], ['ai', 1.7, 1.2], ['bars', 1.7, -.65], ['bell', -1.7, -.65]];
  const nodes = nodeDefs.map(([e, x, y]) => {
    const n = new THREE.Group();
    n.add(new THREE.Mesh(new RoundedBoxGeometry(.56, .56, .56, 4, .14), nodeMat));
    const ic = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(e), transparent: true, depthTest: false })); ic.scale.setScalar(.42); ic.position.z = .34; n.add(ic);
    n.userData = { x, y }; scene.add(n); return n;
  });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const lines = nodes.map(() => { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const l = new THREE.Line(geo, lineMat); scene.add(l); return l; });
  const packets = nodes.map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 16), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true })); scene.add(m); return m; });

  /* ---------------- Screen drawing ---------------- */
  const FONT = 'Inter, system-ui, sans-serif';
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
  const wrap = (text, x, y, maxW, lh) => { const words = text.split(' '); let line = '', yy = y; for (const w of words) { const test = line ? line + ' ' + w : w; if (g.measureText(test).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = test; } g.fillText(line, x, yy); return yy; };
  const lines2 = (text, maxW) => { const words = text.split(' '); let line = '', n = 1; for (const w of words) { const test = line ? line + ' ' + w : w; if (g.measureText(test).width > maxW && line) { n++; line = w; } else line = test; } return n; };
  const fmt = (v) => Math.round(v).toLocaleString('en-US');

  function frameAndStatus(dark) {
    g.clearRect(0, 0, SW, SH);
    g.fillStyle = '#05070d'; rr(0, 0, SW, SH, 86); g.fill();
    g.save(); rr(14, 14, SW - 28, SH - 28, 72); g.clip();
    return () => {
      g.fillStyle = dark ? '#fff' : '#0b1b46'; g.font = `700 26px ${FONT}`; g.textAlign = 'left'; g.fillText('9:41', 66, 66);
      g.textAlign = 'right'; g.fillText('5G ▮', SW - 66, 66); g.textAlign = 'left';
      g.fillStyle = '#05070d'; rr(SW / 2 - 78, 34, 156, 44, 22); g.fill();
      g.restore();
    };
  }
  function screenHome(t) {
    const end = frameAndStatus(true);
    const gr = g.createLinearGradient(0, 0, SW, SH); gr.addColorStop(0, '#3b82ff'); gr.addColorStop(.55, '#0a5cf0'); gr.addColorStop(1, '#0638b8'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(SW * .9, SH * .2, 260, 0, 6.3); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `300 150px ${FONT}`; g.fillText('9:41', SW / 2, 290);
    g.font = `600 30px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('Desyners AI · working for you', SW / 2, 345); g.textAlign = 'left';
    const notes = [['💬', 'Messenger Bot', 'New order #1042'], ['🤖', 'Desyners AI', 'Replied to 37 customers'], ['📈', 'Sales', '+18% this week'], ['✍️', 'Content', '3 posts scheduled']];
    notes.forEach(([ic, app, txt], i) => {
      const k = ease((t - .4 - i * .55) / .5); if (k <= 0) return;
      const y = 420 + i * 170 + (1 - k) * -60;
      g.globalAlpha = k; g.fillStyle = 'rgba(255,255,255,.88)'; rr(40, y, SW - 80, 148, 34); g.fill();
      g.fillStyle = '#e6efff'; rr(66, y + 30, 88, 88, 24); g.fill(); g.font = `48px ${FONT}`; g.fillText(ic, 84, y + 92);
      g.fillStyle = '#51607f'; g.font = `700 24px ${FONT}`; g.fillText(app.toUpperCase(), 180, y + 62);
      g.fillStyle = '#0b1b46'; g.font = `600 29px ${FONT}`; g.fillText(txt, 180, y + 104);
      g.fillStyle = '#8a97b5'; g.font = `500 22px ${FONT}`; g.textAlign = 'right'; g.fillText('now', SW - 70, y + 62); g.textAlign = 'left';
      g.globalAlpha = 1;
    });
    g.fillStyle = 'rgba(255,255,255,.5)'; rr(SW / 2 - 90, SH - 46, 180, 10, 5); g.fill();
    end();
  }
  const chat = [['u', 'Do you deliver to Mandalay?'], ['b', 'Yes! Delivery takes 2–3 days. Shall I take your order?'], ['u', '2 boxes please 🙏'], ['b', '✓ Order #1042 confirmed. We\'ll message you when it ships.']];
  function screenChat(t) {
    const end = frameAndStatus(false);
    g.fillStyle = '#fff'; g.fillRect(0, 0, SW, SH);
    g.fillStyle = '#f3f6fd'; g.fillRect(0, 96, SW, 120);
    const av = g.createLinearGradient(50, 120, 130, 200); av.addColorStop(0, '#2f7bff'); av.addColorStop(1, '#6aaef5'); g.fillStyle = av; g.beginPath(); g.arc(96, 156, 38, 0, 6.3); g.fill();
    g.fillStyle = '#0b1b46'; g.font = `800 31px ${FONT}`; g.fillText('Desyners Bot', 152, 148); g.fillStyle = '#22a35a'; g.font = `600 23px ${FONT}`; g.fillText('● Active now', 152, 184);
    const loop = t % 11; let y = 270;
    let shown = 0; const times = [.4, 2.0, 3.6, 5.2];
    chat.forEach(([who, txt], i) => {
      const at = times[i]; if (loop < at - (who === 'b' ? 1 : 0)) return;
      g.font = `500 29px ${FONT}`; const maxW = SW * .62, n = lines2(txt, maxW), h = 30 + n * 38;
      const typing = who === 'b' && loop < at;
      const w = typing ? 120 : Math.min(maxW, g.measureText(txt).width) + 52;
      const x = who === 'u' ? SW - 44 - w : 44;
      const k = ease((loop - (typing ? at - 1 : at)) / .35);
      g.globalAlpha = k;
      g.fillStyle = who === 'u' ? '#0a5cf0' : '#eef3fd'; rr(x, y + (1 - k) * 20, w, typing ? 70 : h, 30); g.fill();
      if (typing) { for (let d = 0; d < 3; d++) { g.fillStyle = '#8a97b5'; g.beginPath(); g.arc(x + 32 + d * 28, y + 35 - Math.max(0, Math.sin(loop * 9 - d)) * 8, 7, 0, 6.3); g.fill(); } }
      else { g.fillStyle = who === 'u' ? '#fff' : '#0b1b46'; if (txt.startsWith('✓')) g.fillStyle = '#0b1b46'; wrap(txt, x + 26, y + 46, maxW, 38); }
      g.globalAlpha = 1; y += (typing ? 70 : h) + 22; shown++;
    });
    g.fillStyle = '#f3f6fd'; rr(36, SH - 150, SW - 72, 80, 40); g.fill(); g.fillStyle = '#8a97b5'; g.font = `500 26px ${FONT}`; g.fillText('Message…', 72, SH - 100);
    g.fillStyle = '#0a5cf0'; g.beginPath(); g.arc(SW - 80, SH - 110, 28, 0, 6.3); g.fill();
    end();
  }
  function screenPost(t) {
    const end = frameAndStatus(false);
    g.fillStyle = '#fff'; g.fillRect(0, 0, SW, SH);
    g.fillStyle = '#0a5cf0'; g.font = `900 40px ${FONT}`; g.fillText('feed', 50, 160);
    const av = g.createLinearGradient(0, 200, 0, 280); av.addColorStop(0, '#ffb347'); av.addColorStop(1, '#ff5f6d'); g.fillStyle = av; g.beginPath(); g.arc(90, 240, 34, 0, 6.3); g.fill();
    g.fillStyle = '#0b1b46'; g.font = `800 28px ${FONT}`; g.fillText('Shwe Fashion', 140, 232); g.fillStyle = '#8a97b5'; g.font = `500 22px ${FONT}`; g.fillText('Sponsored · 2h', 140, 266);
    const img = g.createLinearGradient(0, 300, SW, 900); img.addColorStop(0, '#2f7bff'); img.addColorStop(1, '#0638b8'); g.fillStyle = img; rr(30, 300, SW - 60, 560, 30); g.fill();
    g.fillStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(SW * .75, 420, 170, 0, 6.3); g.fill();
    g.fillStyle = '#fff'; g.font = `900 64px ${FONT}`; g.fillText('New', 70, 700); g.fillText('arrivals ✨', 70, 772);
    const sh = (t * .45) % 1.6; const lg = g.createLinearGradient(30 + (sh - .4) * SW, 0, 30 + sh * SW, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.25)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; rr(30, 300, SW - 60, 560, 30); g.fill();
    const likes = 120 + ease(t / 4) * 1128, pop = 1 + Math.max(0, Math.sin((t % 1.4) / 1.4 * Math.PI * 2)) * .18;
    g.save(); g.translate(70, 925); g.scale(pop, pop); g.fillStyle = '#ff4d6d'; g.font = `44px ${FONT}`; g.fillText('♥', -16, 16); g.restore();
    g.fillStyle = '#0b1b46'; g.font = `800 30px ${FONT}`; g.fillText(fmt(likes) + ' likes', 112, 940);
    g.fillStyle = '#8a97b5'; g.font = `500 24px ${FONT}`; g.fillText(fmt(36 + ease(t / 4) * 180) + ' shares · ' + fmt(12 + ease(t / 4) * 94) + ' comments', 50, 990);
    g.fillStyle = '#0b1b46'; g.font = `500 27px ${FONT}`; wrap('ဆောင်းရာသီ အသစ်ရောက် — order now on Messenger 💬', 50, 1046, SW - 100, 38);
    end();
  }
  const steps = [['💬', 'New message', 'Messenger'], ['🤖', 'AI reply in Burmese', '0.8 s'], ['📄', 'Order saved', 'Google Sheets'], ['🔔', 'Team notified', 'Viber']];
  function screenFlow(t) {
    const end = frameAndStatus(true);
    const gr = g.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#0b1b46'); gr.addColorStop(1, '#061638'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
    g.fillStyle = '#9cc4ff'; g.font = `700 24px ${FONT}`; g.fillText('AI AGENTS · LIVE', 50, 160);
    g.fillStyle = '#fff'; g.font = `800 46px ${FONT}`; g.fillText('Order workflow', 50, 220);
    const loop = t % 5;
    steps.forEach(([ic, a, b], i) => {
      const y = 280 + i * 160, done = loop > .6 + i * .9, active = !done && loop > i * .9 - .3;
      g.fillStyle = done ? 'rgba(59,123,255,.22)' : 'rgba(255,255,255,.06)'; rr(40, y, SW - 80, 130, 28); g.fill();
      if (active) { g.strokeStyle = 'rgba(156,196,255,.8)'; g.lineWidth = 3; rr(40, y, SW - 80, 130, 28); g.stroke(); }
      g.font = `52px ${FONT}`; g.fillText(ic, 70, y + 85);
      g.fillStyle = '#fff'; g.font = `700 30px ${FONT}`; g.fillText(a, 150, y + 62); g.fillStyle = '#9fb2d8'; g.font = `500 24px ${FONT}`; g.fillText(b, 150, y + 98);
      g.fillStyle = done ? '#22c55e' : 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(SW - 92, y + 65, 26, 0, 6.3); g.fill();
      if (done) { g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(SW - 104, y + 66); g.lineTo(SW - 95, y + 76); g.lineTo(SW - 79, y + 55); g.stroke(); }
      if (i < 3) { g.fillStyle = 'rgba(156,196,255,.35)'; g.fillRect(96, y + 132, 4, 26); }
    });
    g.fillStyle = 'rgba(255,255,255,.08)'; rr(40, SH - 250, SW - 80, 150, 30); g.fill();
    g.fillStyle = '#9fb2d8'; g.font = `600 24px ${FONT}`; g.fillText('Tasks automated today', 76, SH - 196);
    g.fillStyle = '#fff'; g.font = `900 58px ${FONT}`; g.fillText(fmt(1200 + t * 3.2), 76, SH - 130);
    end();
  }
  function screenDash(t) {
    const end = frameAndStatus(false);
    g.fillStyle = '#f5f8ff'; g.fillRect(0, 0, SW, SH);
    g.fillStyle = '#0b1b46'; g.font = `800 42px ${FONT}`; g.fillText('Dashboard', 50, 170);
    g.fillStyle = '#8a97b5'; g.font = `500 24px ${FONT}`; g.fillText('This month · Odoo ERP', 50, 210);
    const k = ease(t / 2.4);
    [['Sales (MMK)', fmt(18400000 * k), '+18%'], ['Orders', fmt(642 * k), '+12%']].forEach(([l, v, d], i) => {
      const x = 40 + i * ((SW - 100) / 2 + 20), w = (SW - 100) / 2;
      g.fillStyle = '#fff'; rr(x, 250, w, 170, 28); g.fill();
      g.fillStyle = '#8a97b5'; g.font = `600 22px ${FONT}`; g.fillText(l, x + 26, 296);
      g.fillStyle = '#0b1b46'; g.font = `800 ${i ? 52 : 36}px ${FONT}`; g.fillText(v, x + 26, 360);
      g.fillStyle = '#22a35a'; g.font = `700 22px ${FONT}`; g.fillText(d, x + 26, 398);
    });
    g.fillStyle = '#fff'; rr(40, 450, SW - 80, 380, 30); g.fill();
    g.fillStyle = '#0b1b46'; g.font = `700 26px ${FONT}`; g.fillText('Weekly orders', 70, 500);
    const hs = [.42, .6, .36, .72, .55, .84, .96];
    hs.forEach((h, i) => { const bh = 250 * h * ease(t / 1.6 - i * .08), x = 76 + i * 68; const bg = g.createLinearGradient(0, 800 - bh, 0, 800); bg.addColorStop(0, '#6aaef5'); bg.addColorStop(1, '#0a5cf0'); g.fillStyle = bg; rr(x, 800 - bh, 42, Math.max(bh, 4), 12); g.fill(); });
    g.fillStyle = '#fff'; rr(40, 860, SW - 80, 300, 30); g.fill();
    g.fillStyle = '#0b1b46'; g.font = `700 26px ${FONT}`; g.fillText('Revenue trend', 70, 910);
    const pts = [[0, .8], [.15, .7], [.3, .74], [.45, .5], [.6, .56], [.75, .3], [.9, .22], [1, .1]], pr = ease(t / 2.6);
    g.strokeStyle = '#0a5cf0'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    pts.forEach(([px, py], i) => { if (px > pr) return; const X = 76 + px * (SW - 152), Y = 950 + py * 170; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
    end();
  }
  function screenBrand(t) {
    const end = frameAndStatus(true);
    const gr = g.createLinearGradient(0, 0, SW, SH); gr.addColorStop(0, '#3b82ff'); gr.addColorStop(1, '#0638b8'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
    if (logoImg.complete) { const w = 300, h = w * logoImg.height / logoImg.width; g.drawImage(logoImg, (SW - w) / 2, SH / 2 - h, w, h); }
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `800 44px ${FONT}`; g.fillText('DESYNERS', SW / 2, SH / 2 + 60); g.textAlign = 'left';
    end();
  }
  const screens = [screenHome, screenChat, screenPost, screenFlow, screenDash, screenBrand];

  /* ---------------- Choreography ---------------- */
  // [x, y, rotX, rotY, scale] per chapter, for wide and narrow screens
  const KW = [[2.35, .05, .06, -.38, 1], [-2.35, 0, .02, .42, 1], [2.35, .05, .05, -.32, 1], [-1.95, .15, .1, .28, .82], [2.3, 0, -.08, -.28, 1.02], [0, -.75, .04, Math.PI - .3, .78]];
  const KN = [[0, 1.05, .06, -.3, .66], [0, 1.05, .04, .35, .66], [0, 1.05, .05, -.3, .66], [0, 1.25, .1, 0, .5], [0, 1.05, -.06, -.25, .66], [0, .55, .04, Math.PI - .3, .55]];
  const cur = { x: 2.35, y: 0, rx: 0, ry: 0, s: .6 };
  let mx = 0, my = 0, sx = 0, sy = 0, lastCh = -1, chT0 = 0, introK = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; });
  let wide = true;
  const fit = () => { const w = stick.clientWidth, h = stick.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); wide = w / h > 1.05; floor.getRenderTarget().setSize(Math.min(1024, w), Math.min(1024, h)); };
  new ResizeObserver(fit).observe(stick); fit();
  const sm = (t) => t * t * (3 - 2 * t);
  const clock = new THREE.Clock();

  (function frame() {
    requestAnimationFrame(frame);
    if (stick.getBoundingClientRect().bottom < -50 || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 1), t = clock.elapsedTime, S = window.STORY || { f: 0, ch: 0 }, f = S.f || 0;
    const L = 1 - Math.pow(.92, dt * 60), L2 = 1 - Math.pow(.95, dt * 60);
    const K = wide ? KW : KN, i0 = Math.min(5, Math.floor(f)), i1 = Math.min(5, i0 + 1), k = sm(Math.min(Math.max(f - i0, 0), 1));
    const a = K[i0], b = K[i1], tgt = a.map((v, j) => v + (b[j] - v) * k);
    introK = 1 - Math.pow(1 - Math.min(t / 1.8, 1), 3);
    cur.x += (tgt[0] - cur.x) * L; cur.y += (tgt[1] - cur.y) * L; cur.rx += (tgt[2] - cur.rx) * L; cur.ry += (tgt[3] - cur.ry) * L; cur.s += (tgt[4] * (.55 + .45 * introK) - cur.s) * L;
    sx += (mx - sx) * L2; sy += (my - sy) * L2;
    phone.position.set(cur.x, cur.y + Math.sin(t * 1.1) * .06, 0);
    phone.rotation.set(cur.rx + sy * .12, cur.ry + Math.sin(t * .5) * .07 + sx * .2, Math.sin(t * .7) * .02);
    phone.scale.setScalar(cur.s);
    const fy = cur.y - (PH / 2) * cur.s - .14;
    floor.position.y = fy; shadow.position.set(cur.x, fy + .005, 0); shadow.scale.set(cur.s, cur.s, 1);

    // Screen: switch app per chapter, restart its clock when the chapter changes
    const ch = Math.min(5, Math.round(f));
    if (ch !== lastCh) { lastCh = ch; chT0 = t; }
    screens[ch](t - chT0); screenTex.needsUpdate = true;

    // Hearts around the post chapter
    const hv = Math.max(0, 1 - Math.abs(f - 2) * 1.8);
    hearts.forEach((h) => { const u = h.userData, fr = (u.o + t * u.sp) % 1; h.visible = hv > .01; h.position.set(cur.x + u.x * cur.s + Math.sin(t + u.o * 9) * .15, cur.y - 1.2 + fr * 3.6, u.z + .6); h.scale.setScalar(u.s * (.6 + fr * .6)); h.material.opacity = hv * Math.sin(fr * Math.PI); });

    // Agent nodes around the automation chapter
    const nv = Math.max(0, 1 - Math.abs(f - 3) * 1.7), ns = wide ? 1 : .5;
    nodes.forEach((n, i) => {
      const u = n.userData, e = sm(nv);
      n.visible = nv > .01;
      n.position.set(cur.x + u.x * ns * e, cur.y + u.y * ns * e + Math.sin(t * 1.3 + i) * .08, .5);
      n.rotation.set(Math.sin(t * .8 + i) * .3, t * .6 + i, 0); n.scale.setScalar(e * ns);
      const pos = lines[i].geometry.attributes.position; pos.setXYZ(0, cur.x, cur.y + .2, .1); pos.setXYZ(1, n.position.x, n.position.y, n.position.z); pos.needsUpdate = true;
      lineMat.opacity = nv * .55;
      const q = ((t * .7 + i * .25) % 1); packets[i].visible = nv > .05;
      packets[i].position.set(cur.x + (n.position.x - cur.x) * q, cur.y + .2 + (n.position.y - cur.y - .2) * q, .2); packets[i].material.opacity = nv * Math.sin(q * Math.PI);
    });
    rimL.intensity = 70 + nv * 60; floor.material.uniforms.color.value.setHex(nv > .5 ? 0x9cc4ff : 0xcfe0ff);

    camera.position.x = sx * .25; camera.position.y = .35 - sy * .15; camera.lookAt(0, .1, 0);
    renderer.render(scene, camera);
  })();
}
