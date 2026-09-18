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
const hudCoins = $('hudCoins');
const userNameEl = $('userName'), userAvatarEl = $('userAvatar');
const nameInput = $('nameInput'), startColors = $('startColors'), playBtn = $('playBtn');
const pauseBtn = $('pauseBtn'), resumeBtn = $('resumeBtn'), quitBtn = $('quitBtn');
const fsBtn = $('fsBtn'), musicBtn = $('musicBtn');
const touchLeft = $('touchLeft'), touchRight = $('touchRight');
const btnLeft = $('btnLeft'), btnRight = $('btnRight');
const minimapCanvas = $('minimapCanvas');

const playerName = (localStorage.getItem('username') || 'Player').slice(0, 20);
let playerColor = parseInt((localStorage.getItem('playerColor') || '#ff3b30').replace('#',''), 16);
if (userNameEl) userNameEl.textContent = playerName;
if (userAvatarEl) userAvatarEl.textContent = playerName.charAt(0).toUpperCase();
if (nameInput) nameInput.value = playerName;
if (hudCoins) hudCoins.textContent = '∞';

const CAR_CLASSES = [
  { id:'sedan', name:'SEDAN', model:'/models/sedan.glb', speed:65, accel:30, grip:1.05 },
  { id:'taxi', name:'TAXI', model:'/models/taxi.glb', speed:70, accel:28, grip:1.06 },
  { id:'sports', name:'SPORTS', model:'/models/sports.glb', speed:82, accel:38, grip:1.14 },
  { id:'suv', name:'SUV', model:'/models/suv.glb', speed:70, accel:28, grip:1.18 },
  { id:'muscle', name:'MUSCLE', model:'/models/muscle.glb', speed:88, accel:45, grip:0.98 },
  { id:'police', name:'POLICE', model:'/models/police.glb', speed:92, accel:48, grip:1.20 },
  { id:'rally', name:'RALLY', model:'/models/rally.glb', speed:90, accel:44, grip:1.24 },
  { id:'race', name:'RACE CAR', model:'/models/race.glb', speed:105, accel:55, grip:1.28 },
  { id:'super', name:'SUPERCAR', model:'/models/super.glb', speed:125, accel:60, grip:1.32 },
  { id:'hyper', name:'HYPERCAR', model:'/models/hyper.glb', speed:139, accel:75, grip:1.36 }
];
const getCar = id => CAR_CLASSES.find(c => c.id === id) || CAR_CLASSES[0];

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa8c8e0, 0.0012);
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.1, 2500);
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
const isMobile = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.3 : 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasEl.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x88bbee, 0x2a2a30, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left:-400, right:400, top:400, bottom:-400, near:1, far:1400 });
scene.add(sun, sun.target);
scene.add(new THREE.AmbientLight(0x3a4560, 0.4));
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 12), new THREE.MeshBasicMaterial({ color:0x80b8e8, side:THREE.BackSide, fog:false })));

function makeAsphalt() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#1a1a1e'; x.fillRect(0,0,512,512);
  for (let i = 0; i < 8000; i++) { const v = (Math.random()-0.5)*30; x.fillStyle = `rgb(${26+v|0},${26+v|0},${30+v|0})`; x.fillRect(Math.random()*512|0,Math.random()*512|0,1,1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeSand() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#c8a86a'; x.fillRect(0,0,256,256);
  for (let i = 0; i < 5000; i++) { const v = (Math.random()-0.5)*40; x.fillStyle = `rgb(${200+v|0},${168+v|0},${106+v|0})`; x.fillRect(Math.random()*256|0,Math.random()*256|0,1,1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const asphaltTex = makeAsphalt(); asphaltTex.repeat.set(80, 80);
const sandTex = makeSand(); sandTex.repeat.set(40, 40);

const MAT = {
  asphalt:new THREE.MeshStandardMaterial({ color:0x232326, map:asphaltTex, roughness:0.9 }),
  sidewalk:new THREE.MeshStandardMaterial({ color:0x909098, roughness:0.95 }),
  glass:new THREE.MeshStandardMaterial({ color:0x5a90c8, roughness:0.2, metalness:0.5 }),
  office:new THREE.MeshStandardMaterial({ color:0x556677, roughness:0.75 }),
  resi:new THREE.MeshStandardMaterial({ color:0x8a7a6a, roughness:0.85 }),
  industrial:new THREE.MeshStandardMaterial({ color:0x4a4a55, roughness:0.8 }),
  concrete:new THREE.MeshStandardMaterial({ color:0x9a9a9e, roughness:0.9 }),
  darkConcrete:new THREE.MeshStandardMaterial({ color:0x3a3a42, roughness:0.9 }),
  roof:new THREE.MeshStandardMaterial({ color:0x14141a, roughness:0.9 }),
  yellow:new THREE.MeshBasicMaterial({ color:0xffcc22 }),
  white:new THREE.MeshBasicMaterial({ color:0xdddddd }),
  ramp:new THREE.MeshStandardMaterial({ color:0x2a2e38, roughness:0.7 }),
  neon:new THREE.MeshStandardMaterial({ color:0x38f7c0, emissive:0x38f7c0, emissiveIntensity:1.4 }),
  trunk:new THREE.MeshStandardMaterial({ color:0x4a3224, roughness:0.95 }),
  leaf:new THREE.MeshStandardMaterial({ color:0x2a5a3a, roughness:0.9 }),
  sand:new THREE.MeshStandardMaterial({ color:0xc8a86a, map:sandTex, roughness:0.95 }),
  water:new THREE.MeshStandardMaterial({ color:0x2c7cff, roughness:0.15, metalness:0.5, transparent:true, opacity:0.85 }),
  grass:new THREE.MeshStandardMaterial({ color:0x3a5a3a, roughness:0.95 }),
  runway:new THREE.MeshStandardMaterial({ color:0x1a1a1a, roughness:0.92 })
};

const BUILDINGS = [];
function box(w,h,d,mat,x,y,z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; }
function addStreet(x,z,w,d) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w,d),MAT.asphalt); m.rotation.x = -Math.PI/2; m.position.set(x,0.02,z); m.receiveShadow = true; scene.add(m); }
function addBuilding(x,z,w,d,h,mat) {
  box(w*1.1, 4, d*1.1, MAT.darkConcrete, x, 2, z);
  box(w, h-4, d, mat, x, h/2+2, z);
  box(w+0.5, 0.6, d+0.5, MAT.roof, x, h+0.3, z);
  BUILDINGS.push({ x, z, w:w*1.2, d:d*1.2 });
}
function addTree(x,z,s=1) {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4*s,0.6*s,3*s,6), MAT.trunk);
  t.position.set(x, 1.5*s, z); t.castShadow = true; scene.add(t);
  const l = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5*s,0), MAT.leaf);
  l.position.set(x, 4.5*s, z); l.castShadow = true; scene.add(l);
}

// ===== WORLD 1600x1600 =====
const WORLD_HALF = 800;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF*2, WORLD_HALF*2), new THREE.MeshStandardMaterial({ color:0x2a2a30, map:asphaltTex, roughness:0.96 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

for (let i = -700; i <= 700; i += 100) {
  addStreet(i, 0, 16, 1600);
  addStreet(0, i, 1600, 16);
  const l1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1600), MAT.yellow);
  l1.rotation.x = -Math.PI/2; l1.position.set(i, 0.04, 0); scene.add(l1);
  const l2 = new THREE.Mesh(new THREE.PlaneGeometry(1600, 0.4), MAT.yellow);
  l2.rotation.x = -Math.PI/2; l2.position.set(0, 0.04, i); scene.add(l2);
}

// DOWNTOWN
(function() {
  const cx = 400, cz = -400;
  for (let i = -120; i <= 120; i += 60) { addStreet(cx+i, cz, 10, 240); addStreet(cx, cz+i, 240, 10); }
  const towers = [[-90,-90,28,28,140],[0,-110,34,34,180],[90,-90,26,26,120],[-110,0,30,30,160],[0,0,38,38,200],[110,0,32,32,150],[-90,90,24,24,110],[0,110,36,36,170],[90,90,28,28,130]];
  for (const [dx,dz,w,d,h] of towers) {
    addBuilding(cx+dx,cz+dz,w,d,h,MAT.glass);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.3,10,6), MAT.darkConcrete);
    ant.position.set(cx+dx, h+5, cz+dz); scene.add(ant);
    const bc = new THREE.Mesh(new THREE.SphereGeometry(0.4,8,6), new THREE.MeshBasicMaterial({color:0xff2222}));
    bc.position.set(cx+dx, h+10, cz+dz); scene.add(bc);
  }
})();

// RESIDENTIAL
(function() {
  const cx = -400, cz = 400;
  for (let x = -120; x <= 120; x += 60) for (let z = -120; z <= 120; z += 60) addBuilding(cx+x, cz+z, 12, 12, 8+Math.random()*4, MAT.resi);
  for (let i = 0; i < 40; i++) addTree(cx + (Math.random()-0.5)*260, cz + (Math.random()-0.5)*260, 0.8 + Math.random()*0.5);
})();

// INDUSTRIAL
(function() {
  const cx = -400, cz = -400;
  for (let i = 0; i < 10; i++) addBuilding(cx + (Math.random()-0.5)*240, cz + (Math.random()-0.5)*240, 30, 24, 12, MAT.industrial);
  const cc = [0xdd3322, 0x2c7cff, 0xffbf35, 0x38f7c0, 0xff6a3a];
  for (let i = 0; i < 30; i++) {
    const x = cx + (Math.random()-0.5)*260, z = cz + (Math.random()-0.5)*260;
    const m = new THREE.MeshStandardMaterial({ color:cc[Math.floor(Math.random()*cc.length)], roughness:0.7 });
    for (let s = 0; s < 1 + Math.floor(Math.random()*3); s++) box(7, 2.6, 3, m, x, 1.3 + s*2.7, z);
  }
})();

// BEACH
(function() {
  const bx = -550, bz = 550;
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(500, 350), MAT.sand);
  sand.rotation.x = -Math.PI/2; sand.position.set(bx, 0.05, bz); sand.receiveShadow = true; scene.add(sand);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(700, 500), MAT.water);
  water.rotation.x = -Math.PI/2; water.position.set(bx - 150, 0.03, bz + 300); scene.add(water);
  box(400, 0.3, 14, MAT.sidewalk, bx, 0.15, bz - 100);
  for (let i = 0; i < 15; i++) {
    const pz = bz + 60 + i * 12;
    box(24, 0.4, 12, MAT.concrete, bx - 100, 1.5, pz);
  }
  for (let i = 0; i < 35; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.6,8,6), MAT.trunk);
    t.position.set(bx + (Math.random()-0.5)*380, 4, bz - 90 + Math.random()*80); t.castShadow = true; scene.add(t);
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(3,0), MAT.leaf);
    l.position.set(bx + (Math.random()-0.5)*380, 9, bz - 90 + Math.random()*80); scene.add(l);
  }
  for (let i = 0; i < 12; i++) {
    const x = bx + (Math.random()-0.5)*350, z = bz + 20 + Math.random()*60;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,3,6), MAT.concrete);
    pole.position.set(x, 1.5, z); scene.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2, 0.8, 8), new THREE.MeshStandardMaterial({ color:[0xff3b30,0x38f7c0,0xffd400,0x2c7cff][Math.floor(Math.random()*4)], roughness:0.7 }));
    canopy.position.set(x, 3.2, z); scene.add(canopy);
  }
  const lh = new THREE.Mesh(new THREE.CylinderGeometry(5,7,45,16), new THREE.MeshStandardMaterial({color:0xdddddd,roughness:0.6}));
  lh.position.set(bx - 200, 22.5, bz - 50); lh.castShadow = true; scene.add(lh);
  const lht = new THREE.Mesh(new THREE.CylinderGeometry(8,8,8,16), new THREE.MeshStandardMaterial({color:0xff3b30,roughness:0.5}));
  lht.position.set(bx - 200, 49, bz - 50); scene.add(lht);
  const lhb = new THREE.Mesh(new THREE.SphereGeometry(2,12,8), new THREE.MeshBasicMaterial({color:0xffd400}));
  lhb.position.set(bx - 200, 53, bz - 50); scene.add(lhb);
})();

// AIRPORT
(function() {
  const ax = 550, az = 550;
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(500, 400), new THREE.MeshStandardMaterial({color:0x2e2e34, roughness:0.9}));
  apron.rotation.x = -Math.PI/2; apron.position.set(ax, 0.02, az); apron.receiveShadow = true; scene.add(apron);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(560, 50), MAT.runway);
  rw.rotation.x = -Math.PI/2; rw.position.set(ax, 0.05, az); rw.receiveShadow = true; scene.add(rw);
  for (let i = -30; i <= 30; i++) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.2), MAT.white);
    d.rotation.x = -Math.PI/2; d.position.set(ax + i*9, 0.07, az); scene.add(d);
  }
  for (const sgn of [-1,1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(560, 0.6), MAT.white);
    e.rotation.x = -Math.PI/2; e.position.set(ax, 0.07, az + sgn*22); scene.add(e);
  }
  const taxi = new THREE.Mesh(new THREE.PlaneGeometry(400, 20), MAT.runway);
  taxi.rotation.x = -Math.PI/2; taxi.position.set(ax, 0.04, az + 80); scene.add(taxi);
  box(120, 18, 40, MAT.concrete, ax - 100, 9, az + 130);
  box(118, 12, 1, MAT.glass, ax - 100, 6, az + 110);
  box(14, 55, 14, MAT.concrete, ax + 100, 27, az + 130);
  box(22, 10, 22, MAT.glass, ax + 100, 60, az + 130);
  box(24, 1.5, 24, MAT.darkConcrete, ax + 100, 65, az + 130);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1,10,8), new THREE.MeshBasicMaterial({color:0xff2222}));
  beacon.position.set(ax + 100, 67, az + 130); scene.add(beacon);
  // Plane
  const plane1 = new THREE.Group();
  plane1.position.set(ax - 60, 0, az + 80);
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 30, 16), MAT.concrete);
  fus.rotation.z = Math.PI/2; fus.position.y = 5; plane1.add(fus);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2.5,16,12), MAT.concrete);
  nose.position.set(-15, 5, 0); plane1.add(nose);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 28), MAT.concrete);
  wing.position.set(-2, 5, 0); plane1.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 0.8), new THREE.MeshStandardMaterial({color:0x2c7cff, metalness:0.5}));
  tail.position.set(14, 10, 0); plane1.add(tail);
  scene.add(plane1);
  for (let i = 0; i < 4; i++) box(45, 22, 45, MAT.industrial, ax - 200 + i * 55, 11, az + 180);
})();

// MOUNTAIN
(function() {
  const cx = -650, cz = -650;
  const g = new THREE.Mesh(new THREE.PlaneGeometry(300,300), MAT.grass);
  g.rotation.x = -Math.PI/2; g.position.set(cx, 0.04, cz); g.receiveShadow = true; scene.add(g);
  const m = new THREE.Mesh(new THREE.ConeGeometry(100,140,10), new THREE.MeshStandardMaterial({color:0x5a5a4a,roughness:0.95}));
  m.position.set(cx, 70, cz); m.castShadow = true; scene.add(m);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(35,45,10), new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.9}));
  cap.position.set(cx, 110, cz); scene.add(cap);
  for (let i = 0; i < 40; i++) {
    const x = cx + (Math.random()-0.5)*280, z = cz + (Math.random()-0.5)*280;
    if (Math.hypot(x-cx, z-cz) < 100) continue;
    addTree(x, z, 0.9 + Math.random()*0.7);
  }
})();

// HIGHWAY RING (elevated)
(function() {
  const ringR = 620, seg = 64;
  for (let i = 0; i < seg; i++) {
    const a0 = (i/seg)*Math.PI*2, a1 = ((i+1)/seg)*Math.PI*2;
    const mx = Math.cos((a0+a1)/2)*ringR, mz = Math.sin((a0+a1)/2)*ringR;
    const p = new THREE.Mesh(new THREE.BoxGeometry(36, 1.4, 34), MAT.concrete);
    p.position.set(mx, 12, mz); p.rotation.y = -(a0+a1)/2;
    p.castShadow = true; p.receiveShadow = true; scene.add(p);
    for (const sgn of [-1,1]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(36, 0.8, 0.5), MAT.neon);
      r.position.set(
        mx + Math.cos(-(a0+a1)/2 + Math.PI/2) * sgn * 16,
        13.5,
        mz + Math.sin(-(a0+a1)/2 + Math.PI/2) * sgn * 16
      );
      r.rotation.y = -(a0+a1)/2;
      scene.add(r);
    }
    if (i % 4 === 0) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(2.5,3,12,8), MAT.concrete);
      pil.position.set(mx, 6, mz); pil.castShadow = true; scene.add(pil);
    }
  }
  // Highway exit ramps to ground
  for (let k = 0; k < 8; k++) {
    const a = (k/8)*Math.PI*2;
    const ex = Math.cos(a)*ringR, ez = Math.sin(a)*ringR;
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 70), MAT.concrete);
    ramp.position.set(ex*0.85, 6, ez*0.85);
    ramp.rotation.y = -a;
    ramp.rotation.x = -0.18;
    scene.add(ramp);
  }
})();

// STUNT BOWL
const BOWL = { x: 700, z: -700, r: 70, h: 45 };
(function() {
  const segments = 48, rings = 6;
  for (let r = 0; r < rings; r++) {
    const t0 = r/rings, t1 = (r+1)/rings;
    const r0 = BOWL.r*(1-t0*0.15), r1 = BOWL.r*(1-t1*0.15);
    const y0 = t0*BOWL.h, y1 = t1*BOWL.h;
    for (let s = 0; s < segments; s++) {
      const a0 = (s/segments)*Math.PI*2, a1 = ((s+1)/segments)*Math.PI*2;
      const x0 = Math.cos(a0)*r0, z0 = Math.sin(a0)*r0;
      const x1 = Math.cos(a1)*r0, z1 = Math.sin(a1)*r0;
      const x2 = Math.cos(a1)*r1, z2 = Math.sin(a1)*r1;
      const x3 = Math.cos(a0)*r1, z3 = Math.sin(a0)*r1;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0,y0,z0,x1,y0,z1,x2,y1,z2,x0,y0,z0,x2,y1,z2,x3,y1,z3]), 3));
      geo.computeVertexNormals();
      const panel = new THREE.Mesh(geo, MAT.ramp);
      panel.position.set(BOWL.x, 0, BOWL.z); panel.receiveShadow = true; panel.castShadow = true;
      scene.add(panel);
    }
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(BOWL.r*0.85, 0.5, 8, 48), MAT.neon);
  rim.rotation.x = Math.PI/2; rim.position.set(BOWL.x, BOWL.h, BOWL.z); scene.add(rim);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(8,32), new THREE.MeshStandardMaterial({color:0xffd400,emissive:0xffd400,emissiveIntensity:1.5,transparent:true,opacity:0.8}));
  pad.rotation.x = -Math.PI/2; pad.position.set(BOWL.x, 0.06, BOWL.z); scene.add(pad);
})();

// ===== MANY RAMPS =====
const RAMPS = [
  { x:0, z:-100, rot:Math.PI/2, w:16, d:40, h:7 },
  { x:0, z:100, rot:-Math.PI/2, w:16, d:40, h:7 },
  { x:-100, z:0, rot:0, w:16, d:40, h:7 },
  { x:100, z:0, rot:Math.PI, w:16, d:40, h:7 },
  { x:-300, z:-100, rot:0, w:14, d:36, h:6 },
  { x:300, z:-100, rot:Math.PI, w:14, d:36, h:6 },
  { x:-300, z:100, rot:0, w:14, d:36, h:6 },
  { x:300, z:100, rot:Math.PI, w:14, d:36, h:6 },
  { x:-100, z:-300, rot:Math.PI/2, w:14, d:36, h:6 },
  { x:100, z:-300, rot:-Math.PI/2, w:14, d:36, h:6 },
  { x:-100, z:300, rot:Math.PI/2, w:14, d:36, h:6 },
  { x:100, z:300, rot:-Math.PI/2, w:14, d:36, h:6 },
  { x:-500, z:0, rot:0, w:14, d:36, h:6 },
  { x:500, z:0, rot:Math.PI, w:14, d:36, h:6 },
  { x:0, z:-500, rot:Math.PI/2, w:14, d:36, h:6 },
  { x:0, z:500, rot:-Math.PI/2, w:14, d:36, h:6 },
  { x:-200, z:-200, rot:Math.PI/4, w:12, d:32, h:5 },
  { x:200, z:200, rot:-Math.PI/4, w:12, d:32, h:5 },
  { x:-200, z:200, rot:-Math.PI/4, w:12, d:32, h:5 },
  { x:200, z:-200, rot:Math.PI/4, w:12, d:32, h:5 }
];
for (const r of RAMPS) {
  r._c = Math.cos(r.rot); r._s = Math.sin(r.rot);
  r._slope = r.h/r.d; r._ax = Math.sin(r.rot); r._az = Math.cos(r.rot);
  const ang = Math.atan2(r.h, r.d), len = Math.hypot(r.h, r.d);
  const g = new THREE.Group();
  g.position.set(r.x, 0, r.z); g.rotation.y = r.rot;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.5, len), MAT.ramp);
  plate.rotation.x = -ang; plate.position.y = r.h/2;
  plate.castShadow = true; plate.receiveShadow = true;
  g.add(plate);
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

// ===== CAR LOADING =====
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
          s.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
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
  const body = new THREE.Mesh(new THREE.BoxGeometry(2,0.8,4.5), new THREE.MeshStandardMaterial({ color:colorHex, metalness:0.7, roughness:0.3 }));
  body.position.y = 0.5; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.55,2), new THREE.MeshStandardMaterial({ color:0x111820, metalness:0.4, roughness:0.15 }));
  cabin.position.set(0,1.15,0.2); g.add(cabin);
  return g;
}

function buildCar(classId, colorHex) {
  const cls = getCar(classId);
  const template = modelCache[cls.id];
  const outer = new THREE.Group();
  outer.userData.classId = cls.id;
  if (!template) { const fb = makeFallbackCar(colorHex); outer.add(fb); outer.userData.bodyMaterial = fb.children[0].material; return outer; }
  let model;
  try { model = template.clone(true); } catch(e) { const fb = makeFallbackCar(colorHex); outer.add(fb); return outer; }
  model.rotation.y = Math.PI;
  outer.add(model);
  let biggest = null, bigVol = 0;
  model.traverse(o => { if (o.isMesh) { const b = new THREE.Box3().setFromObject(o); const s = new THREE.Vector3(); b.getSize(s); const v = s.x*s.y*s.z; if (v > bigVol) { bigVol = v; biggest = o; } } });
  if (biggest && biggest.material) { biggest.material = biggest.material.clone(); biggest.material.color.setHex(colorHex); outer.userData.bodyMaterial = biggest.material; }
  return outer;
}

const P = { x:88, z:88, y:0, heading:-Math.PI/2, speed:0, vy:0, airborne:false, airTime:0, bestAir:0, nitro:100, gear:1, score:0, drifting:false, driftScore:0, driftMultiplier:1, driftTimer:0, slipX:0, slipZ:0, carClass:'sedan' };

let player = buildCar(P.carClass, playerColor);
player.position.set(P.x, 0, P.z);
player.rotation.y = P.heading;
scene.add(player);

const keys = {};
const blockKeys = ['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright','shift'];
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (blockKeys.includes(k)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function bindTouch(el, key) {
  if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); keys[key] = true; });
  el.addEventListener('pointerup', e => { e.preventDefault(); keys[key] = false; });
  el.addEventListener('pointercancel', e => { e.preventDefault(); keys[key] = false; });
  el.addEventListener('pointerleave', e => { e.preventDefault(); keys[key] = false; });
}
document.querySelectorAll('[data-key]').forEach(el => bindTouch(el, el.dataset.key));

const skidGeo = new THREE.PlaneGeometry(0.5,1.3);
const skidMarks = [];
let skidIdx = 0;
for (let i = 0; i < 100; i++) {
  const m = new THREE.Mesh(skidGeo, new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.4, depthWrite:false }));
  m.rotation.x = -Math.PI/2; m.visible = false;
  scene.add(m); skidMarks.push({ mesh:m, life:0 });
}
function addSkid(x, z, rotY) {
  const s = skidMarks[skidIdx];
  s.mesh.position.set(x, 0.05, z); s.mesh.rotation.z = rotY;
  s.mesh.visible = true; s.mesh.material.opacity = 0.6; s.life = 3;
  skidIdx = (skidIdx+1) % 100;
}

const smokeGeo = new THREE.SphereGeometry(0.5, 5, 5);
const smokeParts = [];
let smokeIdx = 0;
for (let i = 0; i < 60; i++) {
  const m = new THREE.Mesh(smokeGeo, new THREE.MeshBasicMaterial({ color:0xe8e8e8, transparent:true, opacity:0.7, depthWrite:false }));
  m.visible = false; scene.add(m);
  smokeParts.push({ mesh:m, life:0, vx:0, vy:0, vz:0 });
}
function spawnSmoke(x, y, z) {
  const p = smokeParts[smokeIdx];
  p.mesh.position.set(x, y, z); p.mesh.scale.setScalar(1+Math.random()*0.9);
  p.mesh.visible = true; p.mesh.material.opacity = 0.8;
  p.vx = (Math.random()-0.5)*3; p.vy = 1.5+Math.random()*2; p.vz = (Math.random()-0.5)*3;
  p.life = 1.4; smokeIdx = (smokeIdx+1) % 60;
}

let hudTimer = 0, started = false, paused = false;
function updateHud(dt) {
  hudTimer += dt;
  if (hudTimer < 0.06) return;
  hudTimer = 0;
  if (!started) return;
  speedEl.textContent = Math.round(Math.abs(P.speed) * 3.6);
  gearEl.textContent = P.speed < -0.4 ? 'R' : P.speed < 0.7 ? 'N' : String(P.gear);
  nitroEl.style.width = P.nitro.toFixed(0) + '%';
  scoreEl.textContent = P.score.toLocaleString();
  carNameEl.textContent = getCar(P.carClass).name;
  airEl.textContent = P.airTime.toFixed(1) + 's';
  bestAirEl.textContent = P.bestAir.toFixed(2) + 's';
  clockEl.textContent = '12:00';
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
  const throttle = keys['w'] ? 1 : 0;
  const brake = keys['s'] ? 1 : 0;
  const steer = Math.max(-1, Math.min(1, (keys['a']?1:0) - (keys['d']?1:0)));
  const driftKey = keys[' '];
  const nitro = keys['shift'] && P.nitro > 0 && !P.airborne;

  if (throttle) P.speed += (nitro ? cls.accel*1.6 : cls.accel) * dt;
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
  } else if (P.drifting) {
    if (P.driftScore > 50) { P.score += P.driftScore; showBig('+' + P.driftScore + ' DRIFT'); }
    P.drifting = false; P.driftScore = 0; P.driftMultiplier = 1;
  }

  if (!P.airborne) {
    const gripMult = P.drifting ? 0.35 : 1.0;
    const grip = Math.min(speedAbs/18, 1) * cls.grip * gripMult;
    P.heading += steer * dt * 2.1 * grip * Math.sign(P.speed||1);
  } else P.heading += steer * dt * 1.1;

  const vx = -Math.sin(P.heading) * P.speed;
  const vz = -Math.cos(P.heading) * P.speed;
  if (P.drifting) {
    const slide = steer * dt * 8 * P.driftMultiplier;
    P.slipX += Math.cos(P.heading) * slide;
    P.slipZ -= Math.sin(P.heading) * slide;
    P.slipX *= 0.92; P.slipZ *= 0.92;
  } else { P.slipX *= 0.85; P.slipZ *= 0.85; }

  const nx = P.x + (vx + P.slipX) * dt;
  const nz = P.z + (vz + P.slipZ) * dt;
  let blocked = false;
  const hitRamp = rampAt(nx, nz);
  if (hitRamp) {
    const t = (hitRamp.lz + hitRamp.ramp.d/2) / hitRamp.ramp.d;
    const surface = t * hitRamp.ramp.h;
    if (!P.airborne && surface > P.y + 1.2) blocked = true;
  }
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
    P.vy -= 26 * dt; P.y += P.vy * dt; P.airTime += dt;
    if (P.y <= gh) {
      P.y = gh; P.vy = 0; P.airborne = false;
      if (P.airTime > 0.35) {
        const reward = Math.round(P.airTime*900 + P.bestAir*40);
        P.score += reward;
        if (P.airTime > P.bestAir) P.bestAir = P.airTime;
        showBig('+' + reward + ' AIR');
      }
      P.airTime = 0;
    }
  } else {
    if (gh < P.y - 0.15) {
      P.airborne = true; P.airTime = 0;
      if (rampSurface > 0) { const along = vx*rampAx + vz*rampAz; P.vy = Math.max(-3, Math.min(14, rampSlope*along)); }
    } else {
      P.y = gh;
      if (rampSurface > 0) { const along = vx*rampAx + vz*rampAz; P.vy = Math.max(-3, Math.min(14, rampSlope*along)); }
    }
  }

  const distBowl = Math.hypot(P.x - BOWL.x, P.z - BOWL.z);
  if (distBowl < 8 && Math.abs(P.speed) > 12) {
    P.speed = 195; P.vy = 24; P.airborne = true;
    showBig('700 GLITCH!');
  }

  P.gear = Math.max(1, Math.min(6, Math.ceil(Math.abs(P.speed)/10)));
  player.position.set(P.x, P.y, P.z);
  player.rotation.y = P.heading;

  if (P.drifting && speedAbs > 15 && !P.airborne) {
    const backX = P.x - Math.sin(P.heading)*1.6;
    const backZ = P.z - Math.cos(P.heading)*1.6;
    const lX = backX + Math.cos(P.heading)*0.9, lZ = backZ - Math.sin(P.heading)*0.9;
    const rX = backX - Math.cos(P.heading)*0.9, rZ = backZ + Math.sin(P.heading)*0.9;
    addSkid(lX, lZ, P.heading); addSkid(rX, rZ, P.heading);
    spawnSmoke(lX, 0.3, lZ); spawnSmoke(rX, 0.3, rZ);
  }
}

const camTarget = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCamera(dt) {
  camTarget.set(P.x + Math.sin(P.heading)*11, P.y+5.5, P.z + Math.cos(P.heading)*11);
  camLook.set(P.x, P.y+1.3, P.z);
  const k = 1 - Math.pow(0.0015, dt);
  camera.position.lerp(camTarget, k);
  camera.lookAt(camLook);
}

function drawMinimap() {
  if (!minimapCanvas) return;
  const ctx = minimapCanvas.getContext('2d');
  const W = minimapCanvas.width, H = minimapCanvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(10,10,14,0.7)';
  ctx.beginPath(); ctx.arc(W/2, H/2, W/2, 0, Math.PI*2); ctx.fill();
  const scale = 0.07;
  const cx = W/2, cy = H/2;
  ctx.fillStyle = 'rgba(120,140,180,0.7)';
  for (const b of BUILDINGS) {
    const dx = (b.x - P.x)*scale + cx;
    const dz = (b.z - P.z)*scale + cy;
    if (dx < 4 || dx > W-4 || dz < 4 || dz > H-4) continue;
    ctx.fillRect(dx-1.5, dz-1.5, 3, 3);
  }
  const bx = (BOWL.x - P.x)*scale + cx;
  const bz = (BOWL.z - P.z)*scale + cy;
  if (bx > 0 && bx < W && bz > 0 && bz < H) {
    ctx.fillStyle = '#ffd400';
    ctx.beginPath(); ctx.arc(bx, bz, 5, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#38f7c0';
  for (const id in otherPlayers) {
    const o = otherPlayers[id];
    if (!o.mesh) continue;
    const px = (o.mesh.position.x - P.x)*scale + cx;
    const pz = (o.mesh.position.z - P.z)*scale + cy;
    if (px < 0 || px > W || pz < 0 || pz > H) continue;
    ctx.beginPath(); ctx.arc(px, pz, 3, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.moveTo(cx, cy-7); ctx.lineTo(cx-5, cy+5); ctx.lineTo(cx+5, cy+5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,212,0,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W/2, H/2, W/2 - 2, 0, Math.PI*2); ctx.stroke();
}

// ===== MULTIPLAYER =====
const socket = (typeof io !== 'undefined') ? io() : null;
const otherPlayers = {};
function addOtherPlayer(info, id) {
  if (!socket || id === socket.id || otherPlayers[id]) return;
  const mesh = buildCar(info.carClass || 'sedan', info.color || 0xff3b30);
  mesh.position.set(info.x||0, info.y||0, info.z||0);
  mesh.rotation.y = info.rotY || 0;
  scene.add(mesh);
  otherPlayers[id] = { mesh };
}
function removeOtherPlayer(id) {
  const o = otherPlayers[id];
  if (!o) return;
  scene.remove(o.mesh);
  delete otherPlayers[id];
}
if (socket) {
  socket.on('connect', () => socket.emit('setInfo', { name: playerName, color: playerColor, carClass: P.carClass }));
  socket.on('currentPlayers', players => Object.keys(players).forEach(id => { if (id !== socket.id) addOtherPlayer(players[id], id); }));
  socket.on('newPlayer', info => addOtherPlayer(info, info.id));
  socket.on('playerMoved', info => {
    const o = otherPlayers[info.id];
    if (!o) return;
    o.mesh.position.set(info.x, info.y, info.z);
    o.mesh.rotation.y = info.rotY;
  });
  socket.on('playerDisconnected', id => removeOtherPlayer(id));
}

let last = performance.now();
let minimapTimer = 0;
function loop(now) {
  const dt = Math.min(0.034, (now - last)/1000);
  last = now;
  if (started && !paused) updatePlayer(dt);
  for (const s of skidMarks) { if (s.life > 0) { s.life -= dt; s.mesh.material.opacity = Math.max(0, s.life*0.2); if (s.life <= 0) s.mesh.visible = false; } }
  for (const p of smokeParts) {
    if (p.life > 0) {
      p.life -= dt;
      p.mesh.position.x += p.vx*dt; p.mesh.position.y += p.vy*dt; p.mesh.position.z += p.vz*dt;
      p.mesh.scale.multiplyScalar(1+dt*1.4);
      p.mesh.material.opacity = Math.max(0, p.life*0.55);
      if (p.life <= 0) p.mesh.visible = false;
    }
  }
  updateCamera(dt);
  updateHud(dt);
  sun.target.position.set(P.x, 0, P.z);
  sun.position.set(P.x + 100, 200, P.z + 100);
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
  if (w === 0 || h === 0) return;
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
    if (socket) socket.emit('setInfo', { name: playerName, color: playerColor, carClass: P.carClass });
  });
}

if (playBtn) {
  playBtn.addEventListener('click', async () => {
    const name = (nameInput.value || 'Player').trim().slice(0,20) || 'Player';
    localStorage.setItem('username', name);
    if (userNameEl) userNameEl.textContent = name;
    if (userAvatarEl) userAvatarEl.textContent = name.charAt(0).toUpperCase();
    if (socket) socket.emit('setInfo', { name, color: playerColor, carClass: P.carClass });
    startScreen.classList.add('hidden');
    gameShell.classList.remove('hidden');
    resize();
    loadingEl.classList.remove('hidden');
    loadingEl.textContent = 'LOADING 0/' + CAR_CLASSES.length;
    await preloadCars((done, total) => { loadingEl.textContent = 'LOADING ' + done + '/' + total; });
    scene.remove(player);
    player = buildCar(P.carClass, playerColor);
    player.position.set(P.x, P.y, P.z);
    player.rotation.y = P.heading;
    scene.add(player);
    started = true; paused = false;
    loadingEl.classList.add('hidden');
    if (touchRight) touchRight.style.display = isMobile ? 'flex' : 'none';
    if (touchLeft) touchLeft.style.display = isMobile ? 'flex' : 'none';
    resize();
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
if (musicBtn) musicBtn.addEventListener('click', () => musicBtn.classList.toggle('off'));

requestAnimationFrame(loop);