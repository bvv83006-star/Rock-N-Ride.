import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = id => document.getElementById(id);
const canvasEl = $('canvas');
const startScreen = $('startScreen');
const gameShell = $('gameShell');
const pauseOverlay = $('pauseOverlay');
const loadingEl = $('loading');
const speedEl = $('speedEl'), gearEl = $('gearEl'), nitroEl = $('nitroEl');
const scoreEl = $('scoreEl'), carNameEl = $('carNameEl'), airEl = $('airEl'), bestAirEl = $('bestAirEl');
const clockEl = $('clockEl');
const driftPop = $('driftPop'), driftScoreEl = $('driftScore'), driftMultEl = $('driftMult');
const bigText = $('bigText');
const hudCoins = $('hudCoins'), hudGears = $('hudGears');
const userNameEl = $('userName'), userAvatarEl = $('userAvatar');
const chatBox = $('chatBox'), chatMsgs = $('chatMsgs'), chatInput = $('chatInput');
const chatSend = $('chatSend'), chatToggle = $('chatToggle');
const nameInput = $('nameInput'), startColors = $('startColors'), playBtn = $('playBtn');
const pauseBtn = $('pauseBtn'), resumeBtn = $('resumeBtn'), quitBtn = $('quitBtn');
const fsBtn = $('fsBtn'), musicBtn = $('musicBtn');
const touchLeft = $('touchLeft'), touchRight = $('touchRight');
const steerWheel = $('steerWheel'), wheelGrip = $('wheelGrip');
const btnLeft = $('btnLeft'), btnRight = $('btnRight');
const minimapCanvas = $('minimapCanvas');

const playerName = (localStorage.getItem('username') || 'Player').slice(0, 20);
let playerColor = parseInt((localStorage.getItem('playerColor') || '#ff3b30').replace('#', ''), 16);
if (userNameEl) userNameEl.textContent = playerName;
if (userAvatarEl) userAvatarEl.textContent = playerName.charAt(0).toUpperCase();
if (nameInput) nameInput.value = playerName;

const SAVE_KEY = 'rocknride_save_v8';
const SETTINGS_KEY = 'rocknride_settings_v1';
const loadSave = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { coins:0, gears:0, owned:['sedan'], selected:'sedan', upgrades:{}, bodykits:{} }; } catch { return { coins:0, gears:0, owned:['sedan'], selected:'sedan', upgrades:{}, bodykits:{} }; } };
const DEFAULT_SETTINGS = { steerType:'buttons', tiltSens:50, steerSens:70, autoAccel:false, invertSteer:false, vibration:true, gfxQuality:'medium', shadows:true, bloom:true, motionBlur:false, drawDist:70, volMaster:100, volEngine:80, volMusic:60, volSfx:100, units:'kmh', minimap:true, damage:false, showFps:false, traffic:'medium', camera:'chase' };
const loadSettings = () => { try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) }; } catch { return { ...DEFAULT_SETTINGS }; } };
const saveGame = s => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {} };

let save = loadSave();
let settings = loadSettings();
if (!save.upgrades) save.upgrades = {};
if (!save.bodykits) save.bodykits = {};
if (!save.selected) save.selected = 'sedan';
if (!Array.isArray(save.owned)) save.owned = ['sedan'];

const CAR_CLASSES = [
  { id:'sedan', name:'SEDAN', cost:0, speed:65, accel:26, grip:1.04, model:'/models/sedan.glb' },
  { id:'taxi', name:'TAXI', cost:500, speed:70, accel:28, grip:1.06, model:'/models/taxi.glb' },
  { id:'sports', name:'SPORTS', cost:1500, speed:82, accel:38, grip:1.14, model:'/models/sports.glb' },
  { id:'suv', name:'SUV', cost:2000, speed:70, accel:28, grip:1.18, model:'/models/suv.glb' },
  { id:'muscle', name:'MUSCLE', cost:3000, speed:88, accel:45, grip:0.98, model:'/models/muscle.glb' },
  { id:'police', name:'POLICE', cost:4500, speed:92, accel:48, grip:1.20, model:'/models/police.glb' },
  { id:'rally', name:'RALLY', cost:6000, speed:90, accel:44, grip:1.24, model:'/models/rally.glb' },
  { id:'race', name:'RACE CAR', cost:8000, speed:105, accel:55, grip:1.28, model:'/models/race.glb' },
  { id:'super', name:'SUPERCAR', cost:15000, speed:125, accel:60, grip:1.32, model:'/models/super.glb' },
  { id:'hyper', name:'HYPERCAR', cost:25000, speed:139, accel:75, grip:1.36, model:'/models/hyper.glb' }
];
const getCar = id => CAR_CLASSES.find(c => c.id === id) || CAR_CLASSES[0];
function getStats(car) { const u = save.upgrades[car.id] || {}; return { speed: car.speed + (u.speed||0)*4, accel: car.accel + (u.accel||0)*3, grip: car.grip + (u.grip||0)*0.05 }; }

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa8c8e0, 0.0016);
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.1, 1800);
const renderer = new THREE.WebGLRenderer({ antialias: settings.gfxQuality !== 'low', powerPreference: 'high-performance' });
const isMobile = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.3 : 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = settings.shadows;
renderer.shadowMap.type = settings.gfxQuality === 'low' ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasEl.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0x88bbee, 0x2a2a30, 0.85); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.castShadow = settings.shadows;
const shadowSize = settings.gfxQuality === 'ultra' || settings.gfxQuality === 'high' ? 2048 : 1024;
sun.shadow.mapSize.set(shadowSize, shadowSize);
Object.assign(sun.shadow.camera, { left:-300, right:300, top:300, bottom:-300, near:1, far:1200 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const amb = new THREE.AmbientLight(0x3a4560, 0.4); scene.add(amb);
const moon = new THREE.DirectionalLight(0x9ab8ff, 0); scene.add(moon, moon.target);

const skyUniforms = { top:{value:new THREE.Color(0x3a8ee8)}, mid:{value:new THREE.Color(0x80b8e8)}, bot:{value:new THREE.Color(0xc0e0ff)}, sunPos:{value:new THREE.Vector3(0,1,0)}, sunCol:{value:new THREE.Color(0xffffff)} };
const skyMat = new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, fog:false, uniforms:skyUniforms,
  vertexShader:'varying vec3 vDir;void main(){vec4 wp=modelMatrix*vec4(position,1.0);vDir=normalize(wp.xyz-cameraPosition);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top;uniform vec3 mid;uniform vec3 bot;uniform vec3 sunPos;uniform vec3 sunCol;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=d.y;vec3 col=mix(bot,mid,smoothstep(-0.02,0.3,h));col=mix(col,top,smoothstep(0.2,0.85,h));float sd=dot(d,normalize(sunPos));col+=sunCol*pow(max(sd,0.0),400.0)*3.0;col+=sunCol*pow(max(sd,0.0),6.0)*0.25;gl_FragColor=vec4(col,1.0);}'
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), skyMat));

let timeOfDay = 12.5;
const SECONDS_PER_HOUR = 22;
const KEYS = [
  { h:0, top:0x01020a, mid:0x050818, bot:0x0a0c1a, sun:0x101828, sunI:0.10, moonI:0.45, fog:0x08091a, fogD:0.0022, hemiI:0.25, ambI:0.20 },
  { h:6.5, top:0x4a7ab8, mid:0xa8c8e8, bot:0xffd0a0, sun:0xffd0a0, sunI:1.4, moonI:0.10, fog:0xa8b8c8, fogD:0.0018, hemiI:0.75, ambI:0.35 },
  { h:12, top:0x3a8ee8, mid:0x80b8e8, bot:0xc0e0ff, sun:0xffffff, sunI:2.8, moonI:0.0, fog:0xa8d0f0, fogD:0.0014, hemiI:0.95, ambI:0.45 },
  { h:17.5, top:0x3a5ea8, mid:0xffa880, bot:0xff7040, sun:0xffb080, sunI:2.3, moonI:0.0, fog:0xc09080, fogD:0.0018, hemiI:0.75, ambI:0.35 },
  { h:21, top:0x0a0a2a, mid:0x1a1040, bot:0x402060, sun:0x303050, sunI:0.25, moonI:0.35, fog:0x1a1030, fogD:0.0022, hemiI:0.30, ambI:0.22 },
  { h:24, top:0x01020a, mid:0x050818, bot:0x0a0c1a, sun:0x101828, sunI:0.10, moonI:0.45, fog:0x08091a, fogD:0.0022, hemiI:0.25, ambI:0.20 }
];
const _cA = new THREE.Color(), _cB = new THREE.Color();
function lerpKey(hour) {
  let a = KEYS[0], b = KEYS[KEYS.length-1];
  for (let i = 0; i < KEYS.length-1; i++) { if (hour >= KEYS[i].h && hour <= KEYS[i+1].h) { a = KEYS[i]; b = KEYS[i+1]; break; } }
  const t = (hour - a.h) / Math.max(0.001, b.h - a.h);
  const L = (av, bv) => av + (bv - av) * t;
  const C = (ah, bh) => _cA.setHex(ah).lerp(_cB.setHex(bh), t).getHex();
  return { top:C(a.top,b.top), mid:C(a.mid,b.mid), bot:C(a.bot,b.bot), sun:C(a.sun,b.sun), fog:C(a.fog,b.fog), sunI:L(a.sunI,b.sunI), moonI:L(a.moonI,b.moonI), fogD:L(a.fogD,b.fogD), hemiI:L(a.hemiI,b.hemiI), ambI:L(a.ambI,b.ambI) };
}
function applyTimeOfDay() {
  const k = lerpKey(timeOfDay);
  skyUniforms.top.value.setHex(k.top); skyUniforms.mid.value.setHex(k.mid); skyUniforms.bot.value.setHex(k.bot);
  skyUniforms.sunCol.value.setHex(k.sun);
  scene.fog.color.setHex(k.fog); scene.fog.density = k.fogD;
  renderer.setClearColor(k.mid);
  const sunT = (timeOfDay - 6) / 12 * Math.PI;
  const sx = Math.cos(sunT) * 300, sy = Math.sin(sunT) * 300;
  sun.position.set(sx, Math.max(-40, sy), 150); sun.target.position.set(0,0,0);
  moon.position.set(-sx, Math.max(30, -sy), -150);
  sun.intensity = k.sunI; sun.color.setHex(k.sun);
  moon.intensity = k.moonI;
  hemi.intensity = k.hemiI; amb.intensity = k.ambI;
  skyUniforms.sunPos.value.copy(sun.position).normalize();
}

function makeAsphalt() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#1a1a1e'; x.fillRect(0,0,512,512);
  for (let i = 0; i < 12000; i++) { const v = (Math.random()-0.5)*30; x.fillStyle = `rgb(${26+v|0},${26+v|0},${30+v|0})`; x.fillRect(Math.random()*512|0, Math.random()*512|0, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const asphaltTex = makeAsphalt(); asphaltTex.repeat.set(60, 60);

const MAT = {
  asphalt:new THREE.MeshStandardMaterial({color:0x232326,map:asphaltTex,roughness:0.9}),
  sidewalk:new THREE.MeshStandardMaterial({color:0x909098,roughness:0.95}),
  glass:new THREE.MeshStandardMaterial({color:0x5a90c8,roughness:0.1,metalness:0.6,transparent:true,opacity:0.75}),
  office:new THREE.MeshStandardMaterial({color:0x556677,roughness:0.75,metalness:0.2}),
  resi:new THREE.MeshStandardMaterial({color:0x8a7a6a,roughness:0.85}),
  industrial:new THREE.MeshStandardMaterial({color:0x4a4a55,roughness:0.8,metalness:0.3}),
  concrete:new THREE.MeshStandardMaterial({color:0x9a9a9e,roughness:0.9}),
  darkConcrete:new THREE.MeshStandardMaterial({color:0x3a3a42,roughness:0.9}),
  roof:new THREE.MeshStandardMaterial({color:0x14141a,roughness:0.9}),
  sand:new THREE.MeshStandardMaterial({color:0xc8a86a,roughness:0.95}),
  grass:new THREE.MeshStandardMaterial({color:0x3a5a3a,roughness:0.95}),
  water:new THREE.MeshStandardMaterial({color:0x2c7cff,roughness:0.2,metalness:0.4,transparent:true,opacity:0.85}),
  yellow:new THREE.MeshBasicMaterial({color:0xffcc22}),
  white:new THREE.MeshBasicMaterial({color:0xdddddd}),
  ramp:new THREE.MeshStandardMaterial({color:0x2a2e38,roughness:0.7,metalness:0.4}),
  neon:new THREE.MeshStandardMaterial({color:0x38f7c0,emissive:0x38f7c0,emissiveIntensity:1.4}),
  runway:new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.92}),
  trunk:new THREE.MeshStandardMaterial({color:0x4a3224,roughness:0.95}),
  leaf:new THREE.MeshStandardMaterial({color:0x2a5a3a,roughness:0.9})
};

const BUILDINGS = [];
function box(w,h,d,mat,x,y,z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow = settings.shadows; m.receiveShadow = settings.shadows; scene.add(m); return m; }
function addStreet(x,z,w,d) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w,d),MAT.asphalt); m.rotation.x = -Math.PI/2; m.position.set(x,0.02,z); m.receiveShadow = settings.shadows; scene.add(m); }
function addBuilding(x,z,w,d,h,mat) {
  box(w*1.1, 4, d*1.1, MAT.darkConcrete, x, 2, z);
  box(w, h-4, d, mat, x, h/2+2, z);
  box(w+0.5, 0.6, d+0.5, MAT.roof, x, h+0.3, z);
  if (Math.random() < 0.4) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.2,8,6), MAT.darkConcrete);
    ant.position.set(x, h+4.5, z); scene.add(ant);
    const bc = new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6), new THREE.MeshBasicMaterial({color:0xff2222}));
    bc.position.set(x, h+8.5, z); scene.add(bc);
  }
  BUILDINGS.push({x, z, w:w*1.2, d:d*1.2});
}

// ===== ROCK N RIDE MAP =====
const STREETS = [-308, -220, -132, -44, 44, 132, 220, 308];
const STREET_WIDTH = 18;
const BLOCK_SIZE = 70;
const SIDEWALK = 5;
const WORLD_HALF = 420;
const BLOCK_CENTERS = [-264, -176, -88, 0, 88, 176, 264];
const PARK_BLOCKS = new Set(['-264,0','264,0','0,-264','0,264','-176,-88','176,88','-176,88','176,-88','-264,-264','264,264','-264,264','264,-264','-88,-176','88,176','-88,176','88,-176']);

const groundMat = new THREE.MeshStandardMaterial({color:0x2a2a30,map:asphaltTex,roughness:0.96});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF*2.6, WORLD_HALF*2.6), groundMat);
ground.rotation.x = -Math.PI/2; ground.receiveShadow = settings.shadows; scene.add(ground);

const streetLen = (STREETS[STREETS.length-1] - STREETS[0]) + STREET_WIDTH + 240;
for (const s of STREETS) {
  addStreet(s, 0, STREET_WIDTH, streetLen);
  addStreet(0, s, streetLen, STREET_WIDTH);
}

for (const s of STREETS) {
  const l1 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, streetLen), MAT.yellow);
  l1.rotation.x = -Math.PI/2; l1.position.set(s - 0.5, 0.035, 0); scene.add(l1);
  const l2 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, streetLen), MAT.yellow);
  l2.rotation.x = -Math.PI/2; l2.position.set(s + 0.5, 0.035, 0); scene.add(l2);
  const l3 = new THREE.Mesh(new THREE.PlaneGeometry(streetLen, 0.35), MAT.yellow);
  l3.rotation.x = -Math.PI/2; l3.position.set(0, 0.035, s - 0.5); scene.add(l3);
  const l4 = new THREE.Mesh(new THREE.PlaneGeometry(streetLen, 0.35), MAT.yellow);
  l4.rotation.x = -Math.PI/2; l4.position.set(0, 0.035, s + 0.5); scene.add(l4);
  for (let p = -260; p <= 260; p += 16) {
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 6), MAT.white);
    w1.rotation.x = -Math.PI/2; w1.position.set(s - STREET_WIDTH/4, 0.035, p); scene.add(w1);
    const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 6), MAT.white);
    w2.rotation.x = -Math.PI/2; w2.position.set(s + STREET_WIDTH/4, 0.035, p); scene.add(w2);
    const w3 = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.4), MAT.white);
    w3.rotation.x = -Math.PI/2; w3.position.set(p, 0.035, s - STREET_WIDTH/4); scene.add(w3);
    const w4 = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.4), MAT.white);
    w4.rotation.x = -Math.PI/2; w4.position.set(p, 0.035, s + STREET_WIDTH/4); scene.add(w4);
  }
}

const cwGeo = new THREE.PlaneGeometry(0.9, 2.4);
for (const sx of STREETS) {
  for (const sz of STREETS) {
    for (let i = -3; i <= 3; i++) {
      const c1 = new THREE.Mesh(cwGeo, MAT.white);
      c1.rotation.x = -Math.PI/2; c1.position.set(sx + i*2.4, 0.04, sz - STREET_WIDTH/2 - 2); scene.add(c1);
      const c2 = c1.clone(); c2.position.z = sz + STREET_WIDTH/2 + 2; scene.add(c2);
      const c3 = c1.clone(); c3.rotation.z = Math.PI/2;
      c3.position.set(sx - STREET_WIDTH/2 - 2, 0.04, sz + i*2.4); scene.add(c3);
      const c4 = c3.clone(); c4.position.x = sx + STREET_WIDTH/2 + 2; scene.add(c4);
    }
  }
}

for (const bx of BLOCK_CENTERS) {
  for (const bz of BLOCK_CENTERS) {
    const w = BLOCK_SIZE + SIDEWALK*2;
    const walk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, w), MAT.sidewalk);
    walk.position.set(bx, 0.15, bz);
    walk.receiveShadow = settings.shadows;
    scene.add(walk);

    if (PARK_BLOCKS.has(`${bx},${bz}`)) {
      for (let i = 0; i < 8; i++) {
        const dx = (Math.random()-0.5) * (BLOCK_SIZE - 12);
        const dz = (Math.random()-0.5) * (BLOCK_SIZE - 12);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3, 6), MAT.trunk);
        t.position.set(bx+dx, 1.5, bz+dz); scene.add(t);
        const l = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 0), MAT.leaf);
        l.position.set(bx+dx, 4.5, bz+dz); scene.add(l);
      }
    } else {
      const distC = Math.hypot(bx, bz);
      const count = 2 + Math.floor(Math.random() * 2);
      const placed = [];
      for (let i = 0; i < count; i++) {
        const bw = 16 + Math.random() * 14;
        const bd = 16 + Math.random() * 14;
        const bh = 20 + Math.random() * (140 - distC * 0.3);
        const half = BLOCK_SIZE/2 - Math.max(bw, bd)/2 - 2;
        const ox = (Math.random() * 2 - 1) * Math.max(2, half - 4);
        const oz = (Math.random() * 2 - 1) * Math.max(2, half - 4);
        let ok = true;
        for (const p of placed) {
          if (Math.hypot(p.x - ox, p.z - oz) < (p.s + Math.max(bw, bd))/2 + 2) { ok = false; break; }
        }
        if (!ok) continue;
        placed.push({ x: ox, z: oz, s: Math.max(bw, bd) });
        addBuilding(bx+ox, bz+oz, bw, bd, bh, Math.random() < 0.5 ? MAT.glass : MAT.office);
      }
    }
  }
}

// Highway ring
(function () {
  const ringR = 380, seg = 48;
  for (let i = 0; i < seg; i++) {
    const a0 = (i/seg) * Math.PI * 2, a1 = ((i+1)/seg) * Math.PI * 2;
    const mx = Math.cos((a0+a1)/2) * ringR;
    const mz = Math.sin((a0+a1)/2) * ringR;
    const p = new THREE.Mesh(new THREE.BoxGeometry(28, 1.2, 26), MAT.concrete);
    p.position.set(mx, 12, mz); p.rotation.y = -(a0+a1)/2;
    p.castShadow = settings.shadows; p.receiveShadow = settings.shadows; scene.add(p);
    if (i % 4 === 0) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 12, 8), MAT.concrete);
      pil.position.set(mx, 6, mz); pil.castShadow = settings.shadows; scene.add(pil);
    }
  }
})();

// Stunt Bowl
const BOWL = { x: 350, z: 350, r: 55, h: 36 };
(function () {
  const segments = 48, rings = 6;
  for (let r = 0; r < rings; r++) {
    const t0 = r/rings, t1 = (r+1)/rings;
    const r0 = BOWL.r * (1 - t0 * 0.15), r1 = BOWL.r * (1 - t1 * 0.15);
    const y0 = t0 * BOWL.h, y1 = t1 * BOWL.h;
    for (let s = 0; s < segments; s++) {
      const a0 = (s/segments) * Math.PI * 2, a1 = ((s+1)/segments) * Math.PI * 2;
      const x0 = Math.cos(a0)*r0, z0 = Math.sin(a0)*r0;
      const x1 = Math.cos(a1)*r0, z1 = Math.sin(a1)*r0;
      const x2 = Math.cos(a1)*r1, z2 = Math.sin(a1)*r1;
      const x3 = Math.cos(a0)*r1, z3 = Math.sin(a0)*r1;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0,y0,z0,x1,y0,z1,x2,y1,z2,x0,y0,z0,x2,y1,z2,x3,y1,z3]), 3));
      geo.computeVertexNormals();
      const panel = new THREE.Mesh(geo, MAT.ramp);
      panel.position.set(BOWL.x, 0, BOWL.z);
      panel.receiveShadow = settings.shadows; panel.castShadow = settings.shadows;
      scene.add(panel);
    }
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(BOWL.r*0.85, 0.5, 8, 48), MAT.neon);
  rim.rotation.x = Math.PI/2; rim.position.set(BOWL.x, BOWL.h, BOWL.z); scene.add(rim);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshStandardMaterial({color:0xffd400,emissive:0xffd400,emissiveIntensity:1.5,transparent:true,opacity:0.8}));
  pad.rotation.x = -Math.PI/2; pad.position.set(BOWL.x, 0.06, BOWL.z); scene.add(pad);
})();

const RAMPS = [
  { x: 0, z: -44, rot: Math.PI/2, w: 14, d: 40, h: 7 },
  { x: 0, z: 44, rot: -Math.PI/2, w: 14, d: 40, h: 7 },
  { x: -44, z: 0, rot: 0, w: 14, d: 40, h: 7 },
  { x: 44, z: 0, rot: Math.PI, w: 14, d: 40, h: 7 },
  { x: -176, z: 0, rot: 0, w: 12, d: 32, h: 6 },
  { x: 176, z: 0, rot: Math.PI, w: 12, d: 32, h: 6 },
  { x: 0, z: -176, rot: Math.PI/2, w: 12, d: 32, h: 6 },
  { x: 0, z: 176, rot: -Math.PI/2, w: 12, d: 32, h: 6 }
];
for (const r of RAMPS) {
  r._c = Math.cos(r.rot); r._s = Math.sin(r.rot);
  r._slope = r.h/r.d; r._ax = Math.sin(r.rot); r._az = Math.cos(r.rot);
  const ang = Math.atan2(r.h, r.d), len = Math.hypot(r.h, r.d);
  const g = new THREE.Group();
  g.position.set(r.x, 0, r.z); g.rotation.y = r.rot;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.5, len), MAT.ramp);
  plate.rotation.x = -ang; plate.position.y = r.h/2;
  plate.castShadow = settings.shadows; plate.receiveShadow = settings.shadows;
  g.add(plate);
  for (const sgn of [-1,1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, len), new THREE.MeshStandardMaterial({color:0xff3b30,emissive:0xff3b30,emissiveIntensity:0.8}));
    rail.rotation.x = -ang;
    rail.position.set(sgn*r.w/2, r.h/2+0.55, 0);
    g.add(rail);
  }
  scene.add(g);
}

function rampAt(x, z) {
  for (const r of RAMPS) {
    const dx = x - r.x, dz = z - r.z;
    const lx = r._c*dx - r._s*dz;
    const lz = r._s*dx + r._c*dz;
    if (Math.abs(lx) <= r.w/2 && Math.abs(lz) <= r.d/2) return { ramp:r, lx, lz };
  }
  return null;
}
function groundHeightAt(x, z) {
  const hit = rampAt(x, z);
  if (hit) { const t = (hit.lz + hit.ramp.d/2) / hit.ramp.d; return t * hit.ramp.h; }
  return 0;
}
function hitsBuilding(x, z, radius = 2) {
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.x) < b.w/2 + radius && Math.abs(z - b.z) < b.d/2 + radius) return true;
  }
  return false;
}

// CAR LOADING
const gltfLoader = new GLTFLoader();
const modelCache = {};
async function preloadCars(onProgress) {
  let done = 0; const total = CAR_CLASSES.length;
  await Promise.all(CAR_CLASSES.map(c => new Promise(resolve => {
    gltfLoader.load(c.model,
      (gltf) => {
        try {
          const s = gltf.scene;
          const b = new THREE.Box3().setFromObject(s);
          const size = new THREE.Vector3(); b.getSize(size);
          const scale = 4.5 / Math.max(size.x, size.z, 0.1);
          s.scale.setScalar(scale);
          const b2 = new THREE.Box3().setFromObject(s);
          s.position.y -= b2.min.y;
          s.traverse(o => { if (o.isMesh) { o.castShadow = settings.shadows; o.receiveShadow = settings.shadows; } });
          modelCache[c.id] = s;
        } catch(e) {}
        done++; if (onProgress) onProgress(done, total); resolve();
      },
      undefined,
      () => { done++; if (onProgress) onProgress(done, total); resolve(); }
    );
  })));
}

function makeFallbackCar(colorHex) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2,0.8,4.5), new THREE.MeshStandardMaterial({color:colorHex,metalness:0.7,roughness:0.3}));
  body.position.y = 0.5; body.castShadow = settings.shadows; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.55,2), new THREE.MeshStandardMaterial({color:0x111820,metalness:0.4,roughness:0.15}));
  cabin.position.set(0,1.15,0.2); g.add(cabin);
  return g;
}

function attachBodyKits(carGroup, classId) {
  const bk = (save.bodykits && save.bodykits[classId]) || { spoiler:'none', exhaust:'none', underglow:'none', wheels:'black' };
  if (bk.spoiler !== 'none') {
    const spoilerMat = new THREE.MeshStandardMaterial({color:0x1a1a1e,metalness:0.8,roughness:0.3});
    const g = new THREE.Group();
    if (bk.spoiler === 'sport') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.08,0.4),spoilerMat);
      base.position.set(0,1.55,2.1); g.add(base);
      for (const sx of [-1,1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.25,0.15),spoilerMat); leg.position.set(sx*0.6,1.4,2.1); g.add(leg); }
    } else if (bk.spoiler === 'gt') {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2,0.1,0.55),spoilerMat);
      wing.position.set(0,1.75,2.15); g.add(wing);
      for (const sx of [-1,1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.5,0.2),spoilerMat); leg.position.set(sx*0.8,1.5,2.15); g.add(leg); }
    } else if (bk.spoiler === 'jdm') {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.9,0.15,0.4),spoilerMat);
      wing.position.set(0,2.0,2.1); wing.rotation.x = -0.15; g.add(wing);
      for (const sx of [-1,1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.7,0.15),spoilerMat); leg.position.set(sx*0.75,1.6,2.1); g.add(leg); }
    }
    g.children.forEach(m => { m.castShadow = settings.shadows; });
    carGroup.add(g);
  }
  if (bk.exhaust !== 'none') {
    const chromeMat = new THREE.MeshStandardMaterial({color:0xdddddd,metalness:1,roughness:0.15});
    const positions = { single:[[0,0.4,2.4]], dual:[[-0.5,0.4,2.4],[0.5,0.4,2.4]], quad:[[-0.6,0.4,2.4],[-0.3,0.4,2.4],[0.3,0.4,2.4],[0.6,0.4,2.4]] };
    (positions[bk.exhaust] || []).forEach(([x,y,z]) => {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.2,8),chromeMat);
      ex.rotation.x = Math.PI/2; ex.position.set(x,y,z); carGroup.add(ex);
    });
  }
  if (bk.underglow !== 'none') {
    const colors = { red:0xff3b30, blue:0x2c7cff, green:0x39ff14, purple:0x8833cc, gold:0xffd400 };
    const glowMat = new THREE.MeshBasicMaterial({color:colors[bk.underglow]||0xffffff,transparent:true,opacity:0.5,side:THREE.DoubleSide,depthWrite:false});
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.5,5), glowMat);
    glow.rotation.x = -Math.PI/2; glow.position.y = 0.15; carGroup.add(glow);
  }
  if (bk.wheels !== 'black') {
    const colors = { chrome:0xdddddd, gold:0xffd400, neon:0x38f7c0 };
    const wheelColor = colors[bk.wheels] || 0x222222;
    carGroup.traverse(o => {
      if (o.isMesh && o.material && o.material.metalness > 0.7) {
        o.material = o.material.clone();
        o.material.color.setHex(wheelColor);
      }
    });
  }
}

function buildCar(classId, colorHex) {
  const cls = getCar(classId);
  const template = modelCache[cls.id];
  const outer = new THREE.Group();
  outer.userData.classId = cls.id;
  if (!template) {
    const fb = makeFallbackCar(colorHex);
    outer.add(fb); outer.userData.bodyMaterial = fb.children[0].material;
    attachBodyKits(outer, cls.id); return outer;
  }
  let model;
  try { model = template.clone(true); }
  catch(e) { const fb = makeFallbackCar(colorHex); outer.add(fb); attachBodyKits(outer, cls.id); return outer; }
  model.rotation.y = Math.PI;
  outer.add(model);
  let biggest = null, bigVol = 0;
  model.traverse(o => {
    if (o.isMesh) {
      const b = new THREE.Box3().setFromObject(o);
      const s = new THREE.Vector3(); b.getSize(s);
      const v = s.x*s.y*s.z;
      if (v > bigVol) { bigVol = v; biggest = o; }
    }
  });
  if (biggest && biggest.material) {
    biggest.material = biggest.material.clone();
    biggest.material.color.setHex(colorHex);
    outer.userData.bodyMaterial = biggest.material;
  }
  attachBodyKits(outer, cls.id);
  return outer;
}

const P = {
  x:88, z:88, y:0, heading:-Math.PI/2,
  speed:0, vy:0, airborne:false, airTime:0, bestAir:0,
  nitro:100, gear:1, score:0, coins:0, drifting:false,
  driftScore:0, driftMultiplier:1, driftTimer:0,
  slipX:0, slipZ:0, swapCooldown:0, glitchCooldown:0,
  carClass: save.selected || 'sedan'
};

let player = buildCar(P.carClass, playerColor);
player.position.set(P.x, 0, P.z);
player.rotation.y = P.heading;
scene.add(player);

const keys = {};
const blockKeys = ['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright','shift'];
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (chatInput && document.activeElement === chatInput) { if (k === 'escape') chatInput.blur(); return; }
  keys[k] = true;
  if (blockKeys.includes(k)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function bindTouch(el, key) {
  if (!el) return;
  const on = e => { e.preventDefault(); keys[key] = true; };
  const off = e => { e.preventDefault(); keys[key] = false; };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
}
document.querySelectorAll('[data-key]').forEach(el => bindTouch(el, el.dataset.key));

let tiltActive = false, tiltGamma = 0;
async function requestTilt() {
  if (typeof DeviceOrientationEvent === 'undefined') return;
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r !== 'granted') return;
    }
    window.addEventListener('deviceorientation', e => { tiltGamma = e.gamma || 0; });
    tiltActive = true;
  } catch(e) {}
}

let wheelAngle = 0, wheelDragging = false, wheelStartX = 0, wheelStartAngle = 0;
if (steerWheel) {
  steerWheel.addEventListener('pointerdown', e => {
    e.preventDefault(); wheelDragging = true;
    wheelStartX = e.clientX; wheelStartAngle = wheelAngle;
    steerWheel.setPointerCapture(e.pointerId);
  });
  steerWheel.addEventListener('pointermove', e => {
    if (!wheelDragging) return;
    e.preventDefault();
    const dx = e.clientX - wheelStartX;
    wheelAngle = Math.max(-1, Math.min(1, wheelStartAngle + dx / 60));
    if (wheelGrip) wheelGrip.style.transform = `rotate(${wheelAngle * 100}deg)`;
  });
  const endDrag = () => {
    wheelDragging = false; wheelAngle *= 0.7;
    if (wheelGrip) wheelGrip.style.transform = `rotate(${wheelAngle * 100}deg)`;
  };
  steerWheel.addEventListener('pointerup', endDrag);
  steerWheel.addEventListener('pointercancel', endDrag);
}

function applySteerMode() {
  const mode = settings.steerType;
  if (!touchLeft) return;
  if (mode === 'wheel' || mode === 'buttons') touchLeft.style.display = 'flex';
  else touchLeft.style.display = 'none';
  if (mode === 'wheel') {
    if (btnLeft) btnLeft.style.display = 'none';
    if (btnRight) btnRight.style.display = 'none';
    if (steerWheel) { steerWheel.style.display = 'block'; steerWheel.classList.add('show'); }
  } else if (mode === 'buttons') {
    if (btnLeft) btnLeft.style.display = 'grid';
    if (btnRight) btnRight.style.display = 'grid';
    if (steerWheel) { steerWheel.style.display = 'none'; steerWheel.classList.remove('show'); }
  } else {
    if (btnLeft) btnLeft.style.display = 'none';
    if (btnRight) btnRight.style.display = 'none';
    if (steerWheel) { steerWheel.style.display = 'none'; steerWheel.classList.remove('show'); }
  }
}
applySteerMode();
if (settings.steerType === 'tilt') requestTilt();

const skidGeo = new THREE.PlaneGeometry(0.5,1.3);
const skidMarks = [];
let skidIdx = 0;
for (let i = 0; i < 150; i++) {
  const m = new THREE.Mesh(skidGeo, new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.4,depthWrite:false}));
  m.rotation.x = -Math.PI/2; m.visible = false;
  scene.add(m); skidMarks.push({mesh:m,life:0});
}
function addSkid(x,z,rotY) {
  const s = skidMarks[skidIdx];
  s.mesh.position.set(x,0.05,z); s.mesh.rotation.z = rotY;
  s.mesh.visible = true; s.mesh.material.opacity = 0.6; s.life = 4;
  skidIdx = (skidIdx+1) % 150;
}

const smokeGeo = new THREE.SphereGeometry(0.5,6,6);
const smokeParts = [];
let smokeIdx = 0;
for (let i = 0; i < 100; i++) {
  const m = new THREE.Mesh(smokeGeo, new THREE.MeshBasicMaterial({color:0xe8e8e8,transparent:true,opacity:0.7,depthWrite:false}));
  m.visible = false; scene.add(m);
  smokeParts.push({mesh:m,life:0,vx:0,vy:0,vz:0});
}
function spawnSmoke(x,y,z) {
  const p = smokeParts[smokeIdx];
  p.mesh.position.set(x,y,z);
  p.mesh.scale.setScalar(1 + Math.random()*0.9);
  p.mesh.visible = true; p.mesh.material.opacity = 0.8;
  p.vx = (Math.random()-0.5)*3; p.vy = 1.8+Math.random()*2; p.vz = (Math.random()-0.5)*3;
  p.life = 1.5;
  smokeIdx = (smokeIdx+1) % 100;
}

let audioCtx = null, engineOsc = null, engineGain = null, engineFilter = null, musicGain = null, sfxGain = null;
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const master = audioCtx.createGain();
    master.gain.value = settings.volMaster / 100;
    master.connect(audioCtx.destination);
    engineGain = audioCtx.createGain(); engineGain.gain.value = 0; engineGain.connect(master);
    engineFilter = audioCtx.createBiquadFilter(); engineFilter.type = 'lowpass'; engineFilter.frequency.value = 400;
    engineFilter.connect(engineGain);
    engineOsc = audioCtx.createOscillator(); engineOsc.type = 'sawtooth';
    engineOsc.connect(engineFilter); engineOsc.start();
    musicGain = audioCtx.createGain(); musicGain.gain.value = settings.volMusic / 100; musicGain.connect(master);
    sfxGain = audioCtx.createGain(); sfxGain.gain.value = settings.volSfx / 100; sfxGain.connect(master);
    startMusic();
  } catch(e) {}
}
function updateEngine(speed) {
  if (!audioCtx) return;
  const s = Math.abs(speed);
  engineOsc.frequency.setTargetAtTime(50 + s*6, audioCtx.currentTime, 0.1);
  engineFilter.frequency.setTargetAtTime(300 + s*15, audioCtx.currentTime, 0.1);
  engineGain.gain.setTargetAtTime((s > 1 ? 0.04 + s*0.002 : 0.015) * (settings.volEngine/100), audioCtx.currentTime, 0.1);
}

let musicTimer = null;
const MELODY = [[523.25,1],[659.25,1],[783.99,1],[659.25,1],[1046.50,4],[587.33,1],[698.46,1],[880.00,1],[698.46,1],[1174.66,4],[493.88,1],[587.33,1],[698.46,1],[587.33,1],[880.00,3],[783.99,1],[659.25,2]];
const BASS = [130.81,130.81,146.83,146.83,164.81,164.81,130.81,130.81];
let mIdx = 0, bIdx = 0;
function startMusic() {
  if (!audioCtx || musicTimer) return;
  let next = audioCtx.currentTime;
  const STEP = 0.22;
  function tick() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    while (next < now + 0.15) {
      const [f, dur] = MELODY[mIdx % MELODY.length];
      playNote(f, dur * STEP * 0.9, 'square', 0.05, next);
      mIdx++;
      const bf = BASS[Math.floor(bIdx) % BASS.length];
      if (bIdx % 2 === 0) playNote(bf, STEP * 1.6, 'triangle', 0.08, next);
      bIdx++;
      next += STEP;
    }
  }
  musicTimer = setInterval(tick, 30);
}
function playNote(freq, dur, type, vol, start) {
  if (!audioCtx || !musicGain) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(g); g.connect(musicGain);
  osc.start(start); osc.stop(start + dur + 0.05);
}
function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
function playCoin() {
  if (!audioCtx || !sfxGain) return;
  const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
  g.gain.setValueAtTime(0.08, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  osc.connect(g); g.connect(sfxGain);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

let hudTimer = 0, started = false, paused = false;
function updateHud(dt) {
  hudTimer += dt;
  if (hudTimer < 0.06) return;
  hudTimer = 0;
  if (!started) return;
  const kmh = Math.abs(P.speed) * 3.6;
  speedEl.textContent = Math.round(settings.units === 'mph' ? kmh * 0.621 : kmh);
  gearEl.textContent = P.speed < -0.4 ? 'R' : P.speed < 0.7 ? 'N' : String(P.gear);
  nitroEl.style.width = P.nitro.toFixed(0) + '%';
  scoreEl.textContent = P.score.toLocaleString();
  carNameEl.textContent = getCar(P.carClass).name;
  airEl.textContent = P.airTime.toFixed(1) + 's';
  bestAirEl.textContent = P.bestAir.toFixed(2) + 's';
  const hh = Math.floor(timeOfDay) % 24;
  const mm = Math.floor((timeOfDay - Math.floor(timeOfDay)) * 60);
  clockEl.textContent = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
  hudCoins.textContent = Math.floor(save.coins + P.coins).toLocaleString();
  if (P.drifting && P.driftScore > 0) {
    driftPop.classList.add('show');
    driftScoreEl.textContent = P.driftScore;
    driftMultEl.textContent = P.driftMultiplier.toFixed(1);
  } else driftPop.classList.remove('show');
}
function showBig(text, duration = 1200) {
  bigText.textContent = text;
  bigText.classList.add('show');
  clearTimeout(showBig._t);
  showBig._t = setTimeout(() => bigText.classList.remove('show'), duration);
}

function updatePlayer(dt) {
  const cls = getCar(P.carClass);
  const stats = getStats(cls);
  const throttle = (keys['w'] || settings.autoAccel) ? 1 : 0;
  const brake = keys['s'] ? 1 : 0;
  let steer = (keys['a'] ? 1 : 0) - (keys['d'] ? 1 : 0);

  if (settings.steerType === 'tilt' && tiltActive && steer === 0) {
    const dead = 3; const g = tiltGamma;
    if (Math.abs(g) > dead) steer += Math.max(-1, Math.min(1, (g - Math.sign(g)*dead) / 28));
  }
  if (settings.steerType === 'wheel' && wheelDragging) steer = wheelAngle;
  if (settings.invertSteer) steer = -steer;
  steer = Math.max(-1, Math.min(1, steer));

  const driftKey = keys[' '];
  const nitro = keys['shift'] && P.nitro > 0 && !P.airborne;

  if (throttle) P.speed += (nitro ? stats.accel*1.6 : stats.accel) * dt;
  if (brake) P.speed -= 38 * dt;
  if (!throttle && !brake) P.speed -= Math.sign(P.speed) * Math.min(Math.abs(P.speed), 6*dt);
  if (P.airborne) P.speed -= Math.sign(P.speed) * Math.min(Math.abs(P.speed), 1.5*dt);

  if (nitro) P.nitro = Math.max(0, P.nitro - 24*dt);
  else P.nitro = Math.min(100, P.nitro + 4.5*dt);

  P.speed = Math.max(-22, Math.min(195, P.speed));
  const speedAbs = Math.abs(P.speed);
  const canDrift = speedAbs > 12 && !P.airborne;

  if (driftKey && canDrift) {
    if (!P.drifting) { P.drifting = true; P.driftTimer = 0; P.driftScore = 0; P.driftMultiplier = 1; }
    P.driftTimer += dt;
    P.driftMultiplier = Math.min(8, 1 + P.driftTimer * 0.7);
    P.driftScore += Math.round(speedAbs * dt * 12 * P.driftMultiplier);
  } else {
    if (P.drifting) {
      if (P.driftScore > 50) { P.score += P.driftScore; P.coins += Math.round(P.driftScore/200); showBig('+' + P.driftScore + ' DRIFT'); }
      P.drifting = false; P.driftScore = 0; P.driftMultiplier = 1;
    }
  }

  if (!P.airborne) {
    const gripMult = P.drifting ? 0.35 : 1.0;
    const grip = Math.min(speedAbs/18, 1) * stats.grip * gripMult;
    P.heading += steer * dt * 2.1 * grip * Math.sign(P.speed||1) * (settings.steerSens/70);
  } else P.heading += steer * dt * 1.1;

  const vx = -Math.sin(P.heading) * P.speed;
  const vz = -Math.cos(P.heading) * P.speed;
  if (P.drifting) {
    const slide = steer * dt * 8 * P.driftMultiplier;
    P.slipX += Math.cos(P.heading) * slide;
    P.slipZ -= Math.sin(P.heading) * slide;
    P.slipX *= 0.92; P.slipZ *= 0.92;
  } else { P.slipX *= 0.85; P.slipZ *= 0.85; }

  let nx = P.x + (vx + P.slipX) * dt;
  let nz = P.z + (vz + P.slipZ) * dt;

  let blocked = false;
  const hitRamp = rampAt(nx, nz);
  if (hitRamp) {
    const t = (hitRamp.lz + hitRamp.ramp.d/2) / hitRamp.ramp.d;
    const surface = t * hitRamp.ramp.h;
    if (!P.airborne && surface > P.y + 1.2) blocked = true;
  }
  if (hitsBuilding(nx, nz, 2)) blocked = true;
  if (blocked) P.speed *= -0.25;
  else { P.x = nx; P.z = nz; }

  const bx = WORLD_HALF - 10;
  if (P.x < -bx) { P.x = -bx; P.speed *= 0.6; }
  if (P.x > bx) { P.x = bx; P.speed *= 0.6; }
  if (P.z < -bx) { P.z = -bx; P.speed *= 0.6; }
  if (P.z > bx) { P.z = bx; P.speed *= 0.6; }

  const here = rampAt(P.x, P.z);
  let rampSurface = 0, rampSlope = 0, rampAx = 0, rampAz = 0;
  if (here) {
    const t = (here.lz + here.ramp.d/2) / here.ramp.d;
    rampSurface = t * here.ramp.h;
    rampSlope = here.ramp._slope;
    rampAx = here.ramp._ax; rampAz = here.ramp._az;
  }
  const gh = groundHeightAt(P.x, P.z);

  if (P.airborne) {
    P.vy -= 26 * dt;
    P.y += P.vy * dt;
    P.airTime += dt;
    if (P.y <= gh) {
      P.y = gh; P.vy = 0; P.airborne = false;
      if (P.airTime > 0.35) {
        const reward = Math.round(P.airTime*900 + P.bestAir*40);
        P.score += reward; P.coins += Math.round(reward/40);
        if (P.airTime > P.bestAir) P.bestAir = P.airTime;
        showBig('+' + reward + ' AIR');
      }
      P.airTime = 0;
    }
  } else {
    if (gh < P.y - 0.15) {
      P.airborne = true; P.airTime = 0;
      if (rampSurface > 0) {
        const along = vx*rampAx + vz*rampAz;
        P.vy = Math.max(-3, Math.min(14, rampSlope*along));
      } else P.vy = 0;
    } else {
      P.y = gh;
      if (rampSurface > 0) {
        const along = vx*rampAx + vz*rampAz;
        P.vy = Math.max(-3, Math.min(14, rampSlope*along));
      } else P.vy = 0;
    }
  }

  if (P.glitchCooldown > 0) P.glitchCooldown -= dt;
  const distBowl = Math.hypot(P.x - BOWL.x, P.z - BOWL.z);
  if (distBowl < 8 && Math.abs(P.speed) > 12 && P.glitchCooldown <= 0) {
    P.speed = 195; P.vy = 24; P.airborne = true; P.airTime = 0;
    P.glitchCooldown = 3;
    showBig('700 GLITCH!');
  }

  P.gear = Math.max(1, Math.min(6, Math.ceil(Math.abs(P.speed)/10)));
  player.position.set(P.x, P.y, P.z);
  player.rotation.y = P.heading;
  updateEngine(P.speed);

  if (P.drifting && speedAbs > 15 && !P.airborne) {
    const backX = P.x - Math.sin(P.heading)*1.6;
    const backZ = P.z - Math.cos(P.heading)*1.6;
    const lX = backX + Math.cos(P.heading)*0.9;
    const lZ = backZ - Math.sin(P.heading)*0.9;
    const rX = backX - Math.cos(P.heading)*0.9;
    const rZ = backZ + Math.sin(P.heading)*0.9;
    addSkid(lX,lZ,P.heading); addSkid(rX,rZ,P.heading);
    for (let k = 0; k < 3; k++) {
      spawnSmoke(lX + (Math.random()-0.5)*1.2, 0.3 + Math.random()*0.6, lZ + (Math.random()-0.5)*1.2);
      spawnSmoke(rX + (Math.random()-0.5)*1.2, 0.3 + Math.random()*0.6, rZ + (Math.random()-0.5)*1.2);
    }
  }
}

const camTarget = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCamera(dt) {
  if (settings.camera === 'hood') {
    camTarget.set(P.x - Math.sin(P.heading)*0.4, P.y+1.55, P.z - Math.cos(P.heading)*0.4);
    camLook.set(P.x - Math.sin(P.heading)*14, P.y+1.1, P.z - Math.cos(P.heading)*14);
  } else if (settings.camera === 'top') {
    camTarget.set(P.x, P.y+45, P.z+0.5);
    camLook.set(P.x, P.y, P.z);
  } else {
    camTarget.set(P.x + Math.sin(P.heading)*11, P.y+5.5, P.z + Math.cos(P.heading)*11);
    camLook.set(P.x, P.y+1.3, P.z);
  }
  const k = 1 - Math.pow(0.0015, dt);
  camera.position.lerp(camTarget, k);
  camera.lookAt(camLook);
}

function drawMinimap() {
  if (!settings.minimap || !minimapCanvas) return;
  const ctx = minimapCanvas.getContext('2d');
  const W = minimapCanvas.width, H = minimapCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = 'rgba(10,10,14,0.6)';
  ctx.beginPath(); ctx.arc(W/2,H/2,W/2,0,Math.PI*2); ctx.fill();
  const scale = 0.12;
  const cx = W/2, cy = H/2;
  ctx.fillStyle = 'rgba(80,80,90,0.5)';
  for (const b of BUILDINGS) {
    const dx = (b.x - P.x)*scale + cx;
    const dz = (b.z - P.z)*scale + cy;
    if (dx < 0 || dx > W || dz < 0 || dz > H) continue;
    ctx.fillRect(dx-1, dz-1, 3, 3);
  }
  const bx = (BOWL.x - P.x)*scale + cx;
  const bz = (BOWL.z - P.z)*scale + cy;
  if (bx > 0 && bx < W && bz > 0 && bz < H) {
    ctx.fillStyle = '#ffd400';
    ctx.beginPath(); ctx.arc(bx,bz,5,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#38f7c0';
  for (const id in otherPlayers) {
    const o = otherPlayers[id];
    if (!o.mesh) continue;
    const px = (o.mesh.position.x - P.x)*scale + cx;
    const pz = (o.mesh.position.z - P.z)*scale + cy;
    if (px < 0 || px > W || pz < 0 || pz > H) continue;
    ctx.beginPath(); ctx.arc(px,pz,3,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.moveTo(cx,cy-6); ctx.lineTo(cx-4,cy+4); ctx.lineTo(cx+4,cy+4);
  ctx.closePath(); ctx.fill();
}

const socket = (typeof io !== 'undefined') ? io() : null;
const otherPlayers = {};
function addOtherPlayer(info, id) {
  if (!socket || id === socket.id || otherPlayers[id]) return;
  const mesh = buildCar(info.carClass || 'sedan', info.color || 0xff3b30);
  mesh.position.set(info.x||0, info.y||0, info.z||0);
  mesh.rotation.y = info.rotY || 0;
  scene.add(mesh);
  otherPlayers[id] = { mesh, name: info.name || 'Player' };
}
function removeOtherPlayer(id) {
  const o = otherPlayers[id];
  if (!o) return;
  scene.remove(o.mesh);
  delete otherPlayers[id];
}
if (socket) {
  socket.on('connect', () => socket.emit('setInfo', { name:playerName, color:playerColor, carClass:P.carClass }));
  socket.on('currentPlayers', players => Object.keys(players).forEach(id => { if (id !== socket.id) addOtherPlayer(players[id], id); }));
  socket.on('newPlayer', info => addOtherPlayer(info, info.id));
  socket.on('playerMoved', info => {
    const o = otherPlayers[info.id];
    if (!o) return;
    o.mesh.position.set(info.x, info.y, info.z);
    o.mesh.rotation.y = info.rotY;
    if (info.name) o.name = info.name;
  });
  socket.on('playerDisconnected', id => removeOtherPlayer(id));
  socket.on('chatMessage', data => {
    if (!data || !data.text) return;
    addChat(data.name || 'Player', data.text, data.id === socket.id);
  });
}

function addChat(name, text, mine) {
  if (!chatMsgs) return;
  const d = document.createElement('div');
  d.className = 'chat-msg' + (mine ? ' mine' : '');
  d.innerHTML = '<span class="who">' + name.replace(/</g,'&lt;') + ':</span>' + text.replace(/</g,'&lt;');
  chatMsgs.appendChild(d);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  while (chatMsgs.children.length > 20) chatMsgs.removeChild(chatMsgs.firstChild);
}
function sendChat() {
  const t = chatInput.value.trim().slice(0,100);
  if (!t || !socket) return;
  socket.emit('chatMessage', t);
  chatInput.value = '';
}
if (chatSend) chatSend.addEventListener('click', sendChat);
if (chatInput) chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); sendChat(); }
  if (e.key === 'Escape') { chatBox.classList.remove('open'); chatInput.blur(); }
});
if (chatToggle) chatToggle.addEventListener('click', () => {
  chatBox.classList.toggle('open');
  if (chatBox.classList.contains('open')) chatInput.focus();
});

let last = performance.now();
let minimapTimer = 0;
function loop(now) {
  const dt = Math.min(0.034, (now - last)/1000);
  last = now;
  if (started && !paused) {
    updatePlayer(dt);
    timeOfDay = (timeOfDay + dt * SECONDS_PER_HOUR / 60) % 24;
  }
  for (const s of skidMarks) {
    if (s.life > 0) { s.life -= dt; s.mesh.material.opacity = Math.max(0, s.life*0.15); if (s.life <= 0) s.mesh.visible = false; }
  }
  for (const p of smokeParts) {
    if (p.life > 0) {
      p.life -= dt;
      p.mesh.position.x += p.vx*dt;
      p.mesh.position.y += p.vy*dt;
      p.mesh.position.z += p.vz*dt;
      p.mesh.scale.multiplyScalar(1 + dt*1.4);
      p.mesh.material.opacity = Math.max(0, p.life*0.55);
      if (p.life <= 0) p.mesh.visible = false;
    }
  }
  updateCamera(dt);
  updateHud(dt);
  applyTimeOfDay();
  sun.target.position.set(P.x, 0, P.z);
  sun.position.set(P.x + sun.position.x*0.3, sun.position.y, P.z + sun.position.z*0.3);
  sun.target.updateMatrixWorld();
  minimapTimer += dt;
  if (minimapTimer > 0.15) { minimapTimer = 0; drawMinimap(); }
  if (socket && started && !paused) {
    if (!P._lastNet) P._lastNet = 0;
    if (now - P._lastNet > 60) {
      socket.emit('playerMovement', { x:P.x, y:P.y, z:P.z, rotY:P.heading, carClass:P.carClass, color:playerColor });
      P._lastNet = now;
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function resize() {
  const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

if (startColors) {
  startColors.querySelectorAll('button').forEach(b => b.classList.toggle('on', parseInt(b.dataset.color.slice(1),16) === playerColor));
  startColors.addEventListener('click', e => {
    const btn = e.target.closest('button[data-color]');
    if (!btn) return;
    startColors.querySelectorAll('button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    playerColor = parseInt(btn.dataset.color.slice(1),16);
    localStorage.setItem('playerColor', btn.dataset.color);
    if (player.userData.bodyMaterial) player.userData.bodyMaterial.color.setHex(playerColor);
  });
}

if (playBtn) {
  playBtn.addEventListener('click', async () => {
    const name = (nameInput.value || 'Player').trim().slice(0,20) || 'Player';
    localStorage.setItem('username', name);
    if (userNameEl) userNameEl.textContent = name;
    if (userAvatarEl) userAvatarEl.textContent = name.charAt(0).toUpperCase();
    if (socket) socket.emit('setInfo', { name, color:playerColor, carClass:P.carClass });
    startScreen.classList.add('hidden');
    gameShell.classList.remove('hidden');
    loadingEl.classList.remove('hidden');
    loadingEl.textContent = 'LOADING CARS 0/' + CAR_CLASSES.length + '…';
    initAudio();
    await preloadCars((done, total) => { loadingEl.textContent = 'LOADING CARS ' + done + '/' + total + '…'; });
    scene.remove(player);
    player = buildCar(P.carClass, playerColor);
    player.position.set(P.x, P.y, P.z);
    player.rotation.y = P.heading;
    scene.add(player);
    started = true; paused = false;
    loadingEl.classList.add('hidden');
    if (touchRight) touchRight.style.display = isMobile ? 'flex' : 'none';
    applySteerMode();
    if (chatToggle) chatToggle.style.display = 'block';
    last = performance.now();
  });
}

if (pauseBtn) pauseBtn.addEventListener('click', () => {
  if (!started) return;
  paused = true;
  pauseOverlay.classList.remove('hidden');
});
if (resumeBtn) resumeBtn.addEventListener('click', () => {
  paused = false;
  pauseOverlay.classList.add('hidden');
  last = performance.now();
});
if (quitBtn) quitBtn.addEventListener('click', () => location.reload());
if (fsBtn) fsBtn.addEventListener('click', () => document.documentElement.requestFullscreen?.());
if (musicBtn) musicBtn.addEventListener('click', () => {
  if (musicTimer) { stopMusic(); musicBtn.classList.add('off'); }
  else { startMusic(); musicBtn.classList.remove('off'); }
});

setInterval(() => {
  if (started && !paused && P.coins > 0) {
    save.coins += P.coins;
    P.coins = 0;
    saveGame(save);
  }
}, 8000);

applyTimeOfDay();
requestAnimationFrame(loop);