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
const btnLeft = $('btnLeft'), btnRight = $('btnRight');

const playerName = (localStorage.getItem('username') || 'Player').slice(0, 20);
let playerColor = parseInt((localStorage.getItem('playerColor') || '#ff3b30').replace('#',''), 16);
if (userNameEl) userNameEl.textContent = playerName;
if (userAvatarEl) userAvatarEl.textContent = playerName.charAt(0).toUpperCase();
if (nameInput) nameInput.value = playerName;

const SAVE_KEY = 'rocknride_save_v8';
const loadSave = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { coins:0, gears:0, selected:'sedan' }; } catch { return { coins:0, gears:0, selected:'sedan' }; } };
const save = loadSave();
const saveGame = s => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {} };

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
scene.fog = new THREE.FogExp2(0xa8c8e0, 0.0016);
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.1, 1800);
const renderer = new THREE.WebGLRenderer({ antialias:true });
const isMobile = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.3 : 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasEl.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x88bbee, 0x2a2a30, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left:-200, right:200, top:200, bottom:-200, near:1, far:800 });
scene.add(sun, sun.target);
scene.add(new THREE.AmbientLight(0x3a4560, 0.4));
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1000, 24, 12), new THREE.MeshBasicMaterial({ color:0x80b8e8, side:THREE.BackSide, fog:false })));

function makeAsphalt() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#1a1a1e'; x.fillRect(0,0,512,512);
  for (let i = 0; i < 8000; i++) { const v = (Math.random()-0.5)*30; x.fillStyle = `rgb(${26+v|0},${26+v|0},${30+v|0})`; x.fillRect(Math.random()*512|0,Math.random()*512|0,1,1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const asphaltTex = makeAsphalt(); asphaltTex.repeat.set(60, 60);

const MAT = {
  asphalt:new THREE.MeshStandardMaterial({ color:0x232326, map:asphaltTex, roughness:0.9 }),
  sidewalk:new THREE.MeshStandardMaterial({ color:0x909098, roughness:0.95 }),
  glass:new THREE.MeshStandardMaterial({ color:0x5a90c8, roughness:0.2, metalness:0.5 }),
  office:new THREE.MeshStandardMaterial({ color:0x556677, roughness:0.75 }),
  darkConcrete:new THREE.MeshStandardMaterial({ color:0x3a3a42, roughness:0.9 }),
  roof:new THREE.MeshStandardMaterial({ color:0x14141a, roughness:0.9 }),
  yellow:new THREE.MeshBasicMaterial({ color:0xffcc22 }),
  ramp:new THREE.MeshStandardMaterial({ color:0x2a2e38, roughness:0.7 }),
  trunk:new THREE.MeshStandardMaterial({ color:0x4a3224, roughness:0.95 }),
  leaf:new THREE.MeshStandardMaterial({ color:0x2a5a3a, roughness:0.9 })
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

const STREETS = [-308, -220, -132, -44, 44, 132, 220, 308];
const STREET_WIDTH = 18;
const BLOCK_SIZE = 70;
const SIDEWALK = 5;
const WORLD_HALF = 420;
const BLOCK_CENTERS = [-264, -176, -88, 0, 88, 176, 264];
const PARK_BLOCKS = new Set(['-264,0','264,0','0,-264','0,264','-176,-88','176,88','-176,88','176,-88','-264,-264','264,264','-264,264','264,-264','-88,-176','88,176','-88,176','88,-176']);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF*2.6, WORLD_HALF*2.6), new THREE.MeshStandardMaterial({ color:0x2a2a30, map:asphaltTex, roughness:0.96 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

const streetLen = (STREETS[STREETS.length-1] - STREETS[0]) + STREET_WIDTH + 240;
for (const s of STREETS) {
  addStreet(s, 0, STREET_WIDTH, streetLen);
  addStreet(0, s, streetLen, STREET_WIDTH);
  const l1 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, streetLen), MAT.yellow);
  l1.rotation.x = -Math.PI/2; l1.position.set(s, 0.035, 0); scene.add(l1);
  const l2 = new THREE.Mesh(new THREE.PlaneGeometry(streetLen, 0.35), MAT.yellow);
  l2.rotation.x = -Math.PI/2; l2.position.set(0, 0.035, s); scene.add(l2);
}
for (const bx of BLOCK_CENTERS) {
  for (const bz of BLOCK_CENTERS) {
    const w = BLOCK_SIZE + SIDEWALK*2;
    const walk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, w), MAT.sidewalk);
    walk.position.set(bx, 0.15, bz); walk.receiveShadow = true; scene.add(walk);
    if (PARK_BLOCKS.has(`${bx},${bz}`)) {
      for (let i = 0; i < 6; i++) {
        const dx = (Math.random()-0.5)*(BLOCK_SIZE-12);
        const dz = (Math.random()-0.5)*(BLOCK_SIZE-12);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.6,3,6), MAT.trunk);
        t.position.set(bx+dx,1.5,bz+dz); scene.add(t);
        const l = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5,0), MAT.leaf);
        l.position.set(bx+dx,4.5,bz+dz); scene.add(l);
      }
    } else {
      const distC = Math.hypot(bx, bz);
      const count = 2 + Math.floor(Math.random()*2);
      const placed = [];
      for (let i = 0; i < count; i++) {
        const bw = 16 + Math.random()*14;
        const bd = 16 + Math.random()*14;
        const bh = 20 + Math.random()*Math.max(40, 140-distC*0.3);
        const half = BLOCK_SIZE/2 - Math.max(bw,bd)/2 - 2;
        const ox = (Math.random()*2-1)*Math.max(2,half-4);
        const oz = (Math.random()*2-1)*Math.max(2,half-4);
        let ok = true;
        for (const p of placed) { if (Math.hypot(p.x-ox,p.z-oz) < (p.s+Math.max(bw,bd))/2+2) { ok = false; break; } }
        if (!ok) continue;
        placed.push({ x:ox, z:oz, s:Math.max(bw,bd) });
        addBuilding(bx+ox, bz+oz, bw, bd, bh, Math.random()<0.5?MAT.glass:MAT.office);
      }
    }
  }
}

const RAMPS = [
  { x:0, z:-44, rot:Math.PI/2, w:14, d:40, h:7 },
  { x:0, z:44, rot:-Math.PI/2, w:14, d:40, h:7 },
  { x:-44, z:0, rot:0, w:14, d:40, h:7 },
  { x:44, z:0, rot:Math.PI, w:14, d:40, h:7 },
  { x:-176, z:0, rot:0, w:12, d:32, h:6 },
  { x:176, z:0, rot:Math.PI, w:12, d:32, h:6 },
  { x:0, z:-176, rot:Math.PI/2, w:12, d:32, h:6 },
  { x:0, z:176, rot:-Math.PI/2, w:12, d:32, h:6 }
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

const P = { x:88, z:88, y:0, heading:-Math.PI/2, speed:0, vy:0, airborne:false, airTime:0, bestAir:0, nitro:100, gear:1, score:0, coins:0, drifting:false, driftScore:0, driftMultiplier:1, driftTimer:0, slipX:0, slipZ:0, carClass: save.selected || 'sedan' };

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
  const hh = 12, mm = 0;
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
    if (P.driftScore > 50) { P.score += P.driftScore; P.coins += Math.round(P.driftScore/200); showBig('+' + P.driftScore + ' DRIFT'); }
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
        P.score += reward; P.coins += Math.round(reward/40);
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

  P.gear = Math.max(1, Math.min(6, Math.ceil(Math.abs(P.speed)/10)));
  player.position.set(P.x, P.y, P.z);
  player.rotation.y = P.heading;

  if (P.drifting && speedAbs > 15 && !P.airborne) {
    const backX = P.x - Math.sin(P.heading)*1.6;
    const backZ = P.z - Math.cos(P.heading)*1.6;
    const lX = backX + Math.cos(P.heading)*0.9, lZ = backZ - Math.sin(P.heading)*0.9;
    const rX = backX - Math.cos(P.heading)*0.9, rZ = backZ + Math.sin(P.heading)*0.9;
    addSkid(lX, lZ, P.heading); addSkid(rX, rZ, P.heading);
    for (let k = 0; k < 2; k++) {
      spawnSmoke(lX, 0.3, lZ); spawnSmoke(rX, 0.3, rZ);
    }
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

function resize() {
  const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.034, (now - last)/1000);
  last = now;
  if (started && !paused) updatePlayer(dt);
  for (const s of skidMarks) { if (s.life > 0) { s.life -= dt; s.mesh.material.opacity = Math.max(0, s.life*0.2); if (s.life <= 0) s.mesh.visible = false; } }
  for (const p of smokeParts) {
    if (p.life > 0) { p.life -= dt; p.mesh.position.x += p.vx*dt; p.mesh.position.y += p.vy*dt; p.mesh.position.z += p.vz*dt; p.mesh.scale.multiplyScalar(1+dt*1.4); p.mesh.material.opacity = Math.max(0, p.life*0.55); if (p.life <= 0) p.mesh.visible = false; }
  }
  updateCamera(dt);
  updateHud(dt);
  sun.target.position.set(P.x, 0, P.z);
  sun.position.set(P.x + 100, 200, P.z + 100);
  sun.target.updateMatrixWorld();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

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
    if (chatToggle) chatToggle.style.display = 'block';
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
