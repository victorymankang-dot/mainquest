// Templum Salutis — The Healing Temple (procedural Three.js sanctuary)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  makeStoneTexture, makeTrencadis, makeStainedGlass, makeRoseWindow,
  makeFloorMosaic, makeGrassTexture, makeWaterFallTexture, makeBirdSprite,
  makeGlowTexture, makePlaqueTexture, makeFlameSprite
} from './textures.js';
import {
  initAuth, onAuthChange, currentUser, displayNameOf,
  signUp, signIn, signOut, setPilgrimPreference, getPilgrimPreference,
  fetchPrayers, addPrayer, deletePrayer
} from './auth.js';

/* ================= renderer / scene / camera ================= */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.09;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe2c8a2, 90, 260);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(37, 19, 47);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 5;
controls.maxDistance = 135;
controls.maxPolarAngle = Math.PI * 0.5;

const FLOOR = 2;                 // temple interior floor height (top of plinth)
const clock = new THREE.Clock();

/* ================= helpers ================= */
const rand = (a, b) => a + Math.random() * (b - a);
const deg = d => (d * Math.PI) / 180;
function archShape(w, h, oy = 0) {           // pointed arch outline (centred on x=0)
  const r = w / 2, springY = oy + h - r;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, oy);
  s.lineTo(-w / 2, springY);
  s.quadraticCurveTo(-w / 2, oy + h, 0, oy + h);
  s.quadraticCurveTo(w / 2, oy + h, w / 2, springY);
  s.lineTo(w / 2, oy);
  s.closePath();
  return s;
}
function archPath(w, h, oy = 0) {
  const r = w / 2, springY = oy + h - r;
  const p = new THREE.Path();
  p.moveTo(-w / 2, oy);
  p.lineTo(-w / 2, springY);
  p.quadraticCurveTo(-w / 2, oy + h, 0, oy + h);
  p.quadraticCurveTo(w / 2, oy + h, w / 2, springY);
  p.lineTo(w / 2, oy);
  p.closePath();
  return p;
}
function shadowed(mesh, cast = true, receive = true) {
  mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh;
}
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); return shadowed(m);
}

/* ================= materials ================= */
const stoneTex = makeStoneTexture(2.2, 2.2);
const stoneMat  = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xf2ead6, roughness: 0.94 });
const stone2Mat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xcbc0a4, roughness: 0.97 });
const stoneDark = new THREE.MeshStandardMaterial({ color: 0x6f6853, roughness: 0.9 });
const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x5e4d28, metalness: 0.78, roughness: 0.42 });
const goldMat   = new THREE.MeshStandardMaterial({ color: 0xc9a24e, metalness: 0.9, roughness: 0.28, emissive: 0x5a4010, emissiveIntensity: 0.5 });
const woodMat   = new THREE.MeshStandardMaterial({ color: 0x45311f, roughness: 0.82 });
const soilMat   = new THREE.MeshStandardMaterial({ color: 0x35291d, roughness: 1 });
const hedgeMat  = new THREE.MeshStandardMaterial({ color: 0x2e4a2c, roughness: 1 });
const cypressMat= new THREE.MeshStandardMaterial({ color: 0x24381f, roughness: 1 });
const oliveMats = [0x84966f, 0x71835e, 0x93a37e].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));
const trunkMat  = new THREE.MeshStandardMaterial({ color: 0x5e5040, roughness: 1 });
const pineMat   = new THREE.MeshStandardMaterial({ color: 0x3c5232, roughness: 1, flatShading: true });
const lavMat    = new THREE.MeshStandardMaterial({ color: 0x7d6d99, roughness: 1, flatShading: true });
const grassMat  = new THREE.MeshStandardMaterial({ map: makeGrassTexture(), color: 0xbfd0a8, roughness: 1 });

const trenchA = new THREE.MeshStandardMaterial({ map: makeTrencadis(null, '#e9e4d4', 3, 3), roughness: 0.32, metalness: 0.05 });
const trenchB = new THREE.MeshStandardMaterial({ map: makeTrencadis(['#f4f1e6', '#dfe9e4', '#bcd3d8', '#8fb8c9', '#3f5c6e', '#e8c766', '#7a9ab5'], '#e9e4d4', 3, 3), roughness: 0.32 });
const trenchC = new THREE.MeshStandardMaterial({ map: makeTrencadis(['#f7e8c8', '#e8c766', '#d99a3a', '#a86a2a', '#f4f1e6', '#c96f4a'], '#efe6d0', 3, 3), roughness: 0.32 });
const trenchRoof = new THREE.MeshStandardMaterial({ map: makeTrencadis('roof', '#ddd4c2', 5, 5), roughness: 0.4 });
const trenchBench = new THREE.MeshStandardMaterial({ map: makeTrencadis(['#f4f1e6', '#bcd3d8', '#e8c766', '#c96f4a', '#3f8f8f', '#7a4a9e'], '#ece7db', 6, 1), roughness: 0.3 });
const trenchFinial = [trenchA, trenchB, trenchC];

const glassKinds = ['tide', 'ember', 'royal', 'dawn'];
const glassMats = glassKinds.map(k => {
  const t = makeStainedGlass(k);
  return new THREE.MeshStandardMaterial({
    map: t, transparent: true, side: THREE.DoubleSide,
    emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.65,
    roughness: 0.4, metalness: 0, depthWrite: false
  });
});
const roseTex = makeRoseWindow();
const roseMat = new THREE.MeshStandardMaterial({
  map: roseTex, emissive: 0xffffff, emissiveMap: roseTex,
  emissiveIntensity: 0.9, roughness: 0.45
});

const glowTex = makeGlowTexture();
const flameTex = makeFlameSprite();
const floorTex = makeFloorMosaic(5, 5);
const vaultInMat = new THREE.MeshStandardMaterial({ color: 0xe8dfc9, roughness: 0.95, side: THREE.BackSide });
const vaultOutMat = new THREE.MeshStandardMaterial({ map: trenchRoof.map, roughness: 0.45, side: THREE.FrontSide });

/* ================= sky, sun, stars ================= */
const skyUniforms = {
  uTop:     { value: new THREE.Color(0x8098bd) },
  uHorizon: { value: new THREE.Color(0xf2c48d) },
  uSunDir:  { value: new THREE.Vector3(0, 0.3, -1).normalize() },
  uSunColor:{ value: new THREE.Color(0xffd9a3) }
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(430, 32, 20),
  new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uTop, uHorizon, uSunColor;
      uniform vec3 uSunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uTop, smoothstep(0.02, 0.55, h));
        if (h < 0.0) col = mix(uHorizon, uHorizon * 0.45, smoothstep(0.0, -0.28, h));
        float s = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSunColor * (pow(s, 700.0) * 1.7 + pow(s, 16.0) * 0.22);
        gl_FragColor = vec4(col, 1.0);
      }`
  })
);
scene.add(sky);

const sunLight = new THREE.DirectionalLight(0xffd9a3, 2.3);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -62; sunLight.shadow.camera.right = 62;
sunLight.shadow.camera.top = 62; sunLight.shadow.camera.bottom = -62;
sunLight.shadow.camera.far = 240;
sunLight.shadow.bias = -0.0006;
scene.add(sunLight, sunLight.target);

const hemi = new THREE.HemisphereLight(0xd8c4a8, 0x5f6b4e, 1.0);
scene.add(hemi);

const sunDisk = new THREE.Mesh(
  new THREE.CircleGeometry(17, 32),
  new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false, transparent: true, opacity: 0.96 })
);
scene.add(sunDisk);
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0.55,
  blending: THREE.AdditiveBlending, depthWrite: false, fog: false
}));
sunGlow.scale.set(150, 150, 1);
scene.add(sunGlow);

// stars (visible at dusk)
const starGeo = new THREE.BufferGeometry();
{
  const pts = [];
  for (let i = 0; i < 700; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(415);
    if (v.y > -25) pts.push(v.x, v.y, v.z);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
}
const starMat = new THREE.PointsMaterial({ color: 0xfff6e0, size: 2.1, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
scene.add(new THREE.Points(starGeo, starMat));

/* ================= ground & plaza ================= */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), grassMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const plaza = new THREE.Mesh(new THREE.CircleGeometry(13.5, 44), new THREE.MeshStandardMaterial({ map: makeStoneTexture(6, 6), color: 0xd8cfb4, roughness: 0.9 }));
plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.03, 31.5); plaza.receiveShadow = true;
scene.add(plaza);

const ringPath = new THREE.Mesh(new THREE.RingGeometry(24.5, 28.2, 64), new THREE.MeshStandardMaterial({ map: makeStoneTexture(8, 1), color: 0xcfc4a4, roughness: 0.95 }));
ringPath.rotation.x = -Math.PI / 2; ringPath.position.y = 0.015; ringPath.receiveShadow = true;
scene.add(ringPath);

const mainPath = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 44), new THREE.MeshStandardMaterial({ map: makeStoneTexture(2, 10), color: 0xd8cfb4, roughness: 0.92 }));
mainPath.rotation.x = -Math.PI / 2; mainPath.position.set(0, 0.022, 66); mainPath.receiveShadow = true;
scene.add(mainPath);

/* ================= temple plinth & steps ================= */
const temple = new THREE.Group();
scene.add(temple);
temple.add(box(37, 1.0, 59, stone2Mat, 0, 0.5, 0));
temple.add(box(33.5, 1.0, 55, stoneMat, 0, 1.5, 0));
temple.add(box(31.2, 0.28, 52.5, stoneDark, 0, 2.06, 0));

// grand entrance steps descending from the plinth front edge (z = 29.5)
[[19.5, 1.72, 29.95], [17.5, 1.22, 31.05], [15.5, 0.72, 32.15], [13.5, 0.22, 33.25]]
  .forEach(([w, y, z]) => temple.add(box(w, 0.55, 1.25, stone2Mat, 0, y, z)));
// apse undercroft — seals the 2 m slit between apse wall base (y=2) and ground
temple.add(box(19.5, 2.0, 9.0, stone2Mat, 0, 1.0, -26.4));

/* ================= nave walls (solid segments + transept openings) ================= */
const wallH = 11, wallTop = FLOOR + wallH, wallMid = FLOOR + wallH / 2;
for (const s of [1, -1]) {
  temple.add(box(1.5, wallH, 14.6, stoneMat, s * 8, wallMid, -14.7));
  temple.add(box(1.5, wallH, 14.6, stoneMat, s * 8, wallMid,  14.7));
  // cornice
  temple.add(box(2.0, 0.7, 44.5, stone2Mat, s * 8, wallTop + 0.32, 0));
  // big triumphal arch opening toward transept (flush with the wall)
  const frameShape = archShape(9.6, 10.6, 0);
  frameShape.holes.push(archPath(7.6, 9.6, 0));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape, { depth: 1.7, bevelEnabled: false }), stoneDark);
  frame.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
  frame.position.set(s * 7.15, FLOOR, 0);
  shadowed(frame);
  temple.add(frame);
}

/* ================= crossing piers ================= */
for (const sx of [1, -1]) for (const sz of [1, -1])
  temple.add(box(2.1, wallH, 2.1, stoneDark, sx * 6.2, wallMid, sz * 6.2));

/* ================= transept walls ================= */
for (const s of [1, -1]) {
  // transept arm outer walls — split at the nave so the crossing stays open
  for (const sx of [1, -1])
    temple.add(box(9, wallH, 1.5, stoneMat, sx * 12.5, wallMid, s * 7.75));
  // end wall + gable
  temple.add(box(1.5, wallH + 2.2, 16.2, stoneMat, s * 17.2, FLOOR + (wallH + 2.2) / 2, 0));
  temple.add(box(2.0, 0.7, 16.4, stone2Mat, s * 17.2, wallTop + 2.2 + 0.32, 0));
  const tri = new THREE.Shape();
  tri.moveTo(-8.1, 0); tri.lineTo(8.1, 0); tri.lineTo(0, 4.6); tri.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.5, bevelEnabled: false }), stoneMat);
  gable.rotation.y = Math.PI / 2;
  gable.position.set(s * 17.2 + (s > 0 ? -0.75 : 0.75), wallTop + 2.9, 0);
  shadowed(gable);
  temple.add(gable);
}

/* ================= facade (west front) ================= */
const FAC_Z = 22;
temple.add(box(27.5, 20, 2.1, stoneMat, 0, FLOOR + 10, FAC_Z));
temple.add(box(28.3, 0.8, 2.6, stone2Mat, 0, FLOOR + 20.1, FAC_Z));   // cornice
// gable triangle
{
  const tri = new THREE.Shape();
  tri.moveTo(-13.75, 0); tri.lineTo(13.75, 0); tri.lineTo(0, 5.4); tri.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 2.1, bevelEnabled: false }), stoneMat);
  gable.position.set(0, FLOOR + 20.5, FAC_Z - 1.05);
  shadowed(gable); temple.add(gable);
}
// gable apex finial
{
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), trenchC);
  ball.position.set(0, FLOOR + 26.4, FAC_Z); shadowed(ball); temple.add(ball);
  const crossV = box(0.22, 2.1, 0.22, goldMat, 0, FLOOR + 27.6, FAC_Z); temple.add(crossV);
  const crossH = box(1.15, 0.22, 0.22, goldMat, 0, FLOOR + 27.95, FAC_Z); temple.add(crossH);
}
// corner mini-spires on facade
for (const s of [1, -1]) {
  const pts = [new THREE.Vector2(0.62, 0), new THREE.Vector2(0.6, 0.9), new THREE.Vector2(0.42, 2.2), new THREE.Vector2(0.18, 3.1), new THREE.Vector2(0.02, 3.6)];
  const mini = new THREE.Mesh(new THREE.LatheGeometry(pts, 10), trenchB);
  mini.position.set(s * 12.6, FLOOR + 20.5, FAC_Z); shadowed(mini); temple.add(mini);
}

/* ---------- portals (extruded pointed-arch frames, bronze) ---------- */
function makePortal(w, h, x, zBase, withDoors = true) {
  const g = new THREE.Group();
  const shape = archShape(w, h, 0);
  shape.holes.push(archPath(w * 0.78, h * 0.9, h * 0.02));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.85, bevelEnabled: false }), bronzeMat);
  frame.position.z = -0.425;
  shadowed(frame); g.add(frame);
  // dark recess
  const recess = new THREE.Mesh(new THREE.ShapeGeometry(archShape(w * 0.78, h * 0.9, h * 0.02)), new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 1 }));
  recess.position.z = -0.32; g.add(recess);
  if (withDoors) {
    const dw = (w * 0.78) / 2 - 0.04, dh = h * 0.72;
    const dGeo = new THREE.BoxGeometry(dw, dh, 0.16);
    const left = new THREE.Mesh(dGeo, bronzeMat); left.position.set(-dw / 2 - 0.03, dh / 2, -0.18);
    const right = new THREE.Mesh(dGeo, bronzeMat); right.position.set(dw / 2 + 0.03, dh / 2, -0.18);
    shadowed(left); shadowed(right); g.add(left, right);
    // vertical bronze bars + ring handles
    for (const bx of [-w * 0.27, -w * 0.135, 0, w * 0.135, w * 0.27]) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, h * 0.8, 8), goldMat);
      bar.position.set(bx, h * 0.4, -0.08); g.add(bar);
    }
    for (const hx of [-dw * 0.55, dw * 0.55]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 18), goldMat);
      ring.position.set(hx, h * 0.36, -0.05); g.add(ring);
    }
  }
  g.position.set(x, FLOOR, zBase);
  temple.add(g);
  return g;
}
makePortal(7.3, 9.6, 0, FAC_Z + 1.06, true);
makePortal(4.35, 6.3, -9.6, FAC_Z + 1.06, true);
makePortal(4.35, 6.3, 9.6, FAC_Z + 1.06, true);

/* ---------- facade plaque ---------- */
{
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 2.5),
    new THREE.MeshStandardMaterial({ map: makePlaqueTexture('TEMPLVM SALVTIS', 'SANCTVARIVM · SALVTIS'), roughness: 0.85 })
  );
  plaque.position.set(0, FLOOR + 12.1, FAC_Z + 1.08); temple.add(plaque);
}

/* ---------- rose window + side niches ---------- */
{
  const rose = new THREE.Mesh(new THREE.CircleGeometry(3.05, 40), roseMat);
  rose.position.set(0, FLOOR + 16.6, FAC_Z + 1.07); temple.add(rose);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.08, 0.34, 10, 40), stone2Mat);
  rim.position.set(0, FLOOR + 16.6, FAC_Z + 1.12); shadowed(rim); temple.add(rim);
}
for (const nx of [-6.1, 6.1, -12.6, 12.6]) {
  const niche = new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.45, 3.4, 0)), new THREE.MeshStandardMaterial({ color: 0x141009, roughness: 1 }));
  niche.position.set(nx, FLOOR + 4.6, FAC_Z + 1.06); temple.add(niche);
  const v = box(0.14, 1.15, 0.1, goldMat, nx, FLOOR + 6.0, FAC_Z + 1.14); temple.add(v);
  const h = box(0.62, 0.14, 0.1, goldMat, nx, FLOOR + 6.28, FAC_Z + 1.14); temple.add(h);
}

/* ================= spires (trencadís lathe towers) ================= */
function makeSpire(baseR, height, matIdx) {
  const g = new THREE.Group();
  const pts = [];
  const prof = [
    [1.00, 0.00], [0.99, 0.07], [0.90, 0.20], [0.76, 0.36], [0.60, 0.50],
    [0.46, 0.62], [0.38, 0.72], [0.475, 0.79], [0.34, 0.855], [0.175, 0.925], [0.02, 1.00]
  ];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r * baseR, y * height));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), trenchFinial[matIdx % 3]);
  shadowed(body); g.add(body);
  // collar rings
  for (const fy of [0.30, 0.55, 0.74]) {
    const rr = prof.reduce((best, [r, y]) => Math.abs(y - fy) < Math.abs(best[1] - fy) ? [r, y] : best)[0] * baseR;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rr + 0.06, 0.1, 8, 18), stoneDark);
    ring.rotation.x = Math.PI / 2; ring.position.y = fy * height; g.add(ring);
  }
  // finial sphere + cross
  const orb = new THREE.Mesh(new THREE.SphereGeometry(baseR * 0.30, 12, 9), trenchC);
  orb.position.y = height + baseR * 0.14; shadowed(orb); g.add(orb);
  const cv = box(0.14, baseR * 0.95, 0.14, goldMat, 0, height + baseR * 0.72, 0); g.add(cv);
  const ch = box(baseR * 0.52, 0.14, 0.14, goldMat, 0, height + baseR * 0.82, 0); g.add(ch);
  return g;
}
const spireDefs = [
  // facade spires (taller outer pair)
  { x: -11.4, z: FAC_Z, r: 2.35, h: 16.5, m: 0 },
  { x:  11.4, z: FAC_Z, r: 2.35, h: 16.5, m: 1 },
  { x: -7.3,  z: FAC_Z, r: 1.95, h: 13.0, m: 2 },
  { x:  7.3,  z: FAC_Z, r: 1.95, h: 13.0, m: 0 },
  // transept end spires
  { x: -17.2, z:  5.4, r: 1.9, h: 12.2, m: 1 },
  { x: -17.2, z: -5.4, r: 1.9, h: 12.2, m: 2 },
  { x:  17.2, z:  5.4, r: 1.9, h: 12.2, m: 2 },
  { x:  17.2, z: -5.4, r: 1.9, h: 12.2, m: 0 },
  // apse spires
  { x: -6.6, z: -22.5, r: 2.0, h: 13.2, m: 0 },
  { x:  6.6, z: -22.5, r: 2.0, h: 13.2, m: 1 }
];
for (const d of spireDefs) {
  const s = makeSpire(d.r, d.h, d.m);
  s.position.set(d.x, FLOOR, d.z);
  temple.add(s);
}
// central "Tower of Jesus"
{
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 4.7, 2.6, 12), stone2Mat);
  skirt.position.set(0, 14.2, 0); shadowed(skirt); temple.add(skirt);
  const jesus = makeSpire(3.15, 12.5, 2);
  jesus.position.set(0, 15.2, 0); temple.add(jesus);
  const crossV = box(0.3, 3.4, 0.3, goldMat, 0, 31.6, 0); temple.add(crossV);
  const crossH = box(1.7, 0.3, 0.3, goldMat, 0, 31.9, 0); temple.add(crossH);
}

/* ================= apse (half-cylinder + semi-dome) ================= */
{
  const apse = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.5, wallH + 1.5, 26, 1, true, Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xefe6d2, roughness: 0.94, side: THREE.DoubleSide })
  );
  apse.position.set(0, FLOOR + (wallH + 1.5) / 2, -22);
  shadowed(apse); temple.add(apse);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: trenchRoof.map, color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide })
  );
  dome.scale.y = 0.55;
  dome.position.set(0, FLOOR + wallH + 1.5, -22);
  shadowed(dome); temple.add(dome);

  // small oculus (eye of heaven) at dome top
  const oculus = new THREE.Mesh(new THREE.CircleGeometry(1.15, 20), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
  oculus.rotation.x = Math.PI / 2; oculus.position.set(0, FLOOR + wallH + 1.5 + 8.5 * 0.55 - 0.02, -22);
  temple.add(oculus);
}

/* ================= vaults (inner pale / outer trencadís) ================= */
{
  const naveVaultIn = new THREE.Mesh(new THREE.CylinderGeometry(8.3, 8.3, 44, 26, 1, true, Math.PI / 2, Math.PI), vaultInMat);
  naveVaultIn.rotation.x = Math.PI / 2; naveVaultIn.position.set(0, wallTop, 0); temple.add(naveVaultIn);
  const naveVaultOut = new THREE.Mesh(new THREE.CylinderGeometry(8.35, 8.35, 44.3, 26, 1, true, Math.PI / 2, Math.PI), vaultOutMat);
  naveVaultOut.rotation.x = Math.PI / 2; naveVaultOut.position.set(0, wallTop, 0); shadowed(naveVaultOut); temple.add(naveVaultOut);

  const tranVaultIn = new THREE.Mesh(new THREE.CylinderGeometry(8.3, 8.3, 35.6, 26, 1, true, 0, Math.PI), vaultInMat);
  tranVaultIn.rotation.z = Math.PI / 2; tranVaultIn.position.set(0, wallTop + 0.35, 0); temple.add(tranVaultIn);
  const tranVaultOut = new THREE.Mesh(new THREE.CylinderGeometry(8.35, 8.35, 35.9, 26, 1, true, 0, Math.PI), vaultOutMat);
  tranVaultOut.rotation.z = Math.PI / 2; tranVaultOut.position.set(0, wallTop + 0.35, 0); shadowed(tranVaultOut); temple.add(tranVaultOut);
}

/* ================= interior floor ================= */
{
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(32.6, 52.4), new THREE.MeshStandardMaterial({ map: floorTex, color: 0xd8cbb0, roughness: 0.75 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR + 0.16; floor.receiveShadow = true; temple.add(floor);
}

/* ================= tree columns (Gaudí branching) ================= */
const columnColors = [0x6e3325, 0x3d4148];   // porphyry / basalt
const columnXs = [-5.2, 5.2], columnZs = [-15.5, -9.5, -3.8, 3.8, 9.5, 15.5];
let colIdx = 0;
for (const cx of columnXs) for (const cz of columnZs) {
  const g = new THREE.Group();
  const colMat = new THREE.MeshStandardMaterial({ color: columnColors[colIdx % 2], roughness: 0.72, metalness: 0.08 });
  colIdx++;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.82, 7.4, 10), colMat);
  trunk.position.y = FLOOR + 3.7; shadowed(trunk); g.add(trunk);
  const capital = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 0.55, 1.35, 10), colMat);
  capital.position.y = FLOOR + 8.05; shadowed(capital); g.add(capital);
  // branches
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + (colIdx * 0.3);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.30, 3.6, 7), colMat);
    branch.position.set(Math.cos(a) * 1.05, FLOOR + 9.6, Math.sin(a) * 1.05);
    branch.rotation.z = Math.cos(a) * 0.62;
    branch.rotation.x = -Math.sin(a) * 0.62;
    shadowed(branch); g.add(branch);
  }
  g.position.set(cx, 0, cz);
  temple.add(g);
}

/* ================= stained-glass decal windows ================= */
function addGlassDecal(w, h, kind, x, y, z, rotY = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMats[glassKinds.indexOf(kind)]);
  m.position.set(x, y, z); m.rotation.y = rotY; temple.add(m);
}
const naveWindowZ = [-17.2, -11.6, -3.4, 3.4, 11.6, 17.2];
const naveKinds   = ['tide', 'royal', 'ember', 'dawn', 'tide', 'royal'];
for (const s of [1, -1]) {
  naveWindowZ.forEach((z, i) => addGlassDecal(3.0, 7.4, naveKinds[i], s * 8.77, FLOOR + 6.2, z, s > 0 ? Math.PI / 2 : -Math.PI / 2));
  // interior faces (mirrored glow)
  naveWindowZ.forEach((z, i) => addGlassDecal(3.0, 7.4, naveKinds[i], s * 7.23, FLOOR + 6.2, z, s > 0 ? -Math.PI / 2 : Math.PI / 2));
}
// transept walls: 3 lancets + rose each side
for (const s of [1, -1]) {
  for (const x of [-12.5, 12.5])
    addGlassDecal(2.6, 6.6, x < 0 ? 'ember' : 'royal', x, FLOOR + 6.0, s * 7.0, s > 0 ? 0 : Math.PI);
  const rose = new THREE.Mesh(new THREE.CircleGeometry(1.75, 26), roseMat);
  rose.position.set(s * 17.97, FLOOR + 8.6, 0); rose.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; temple.add(rose);
  const rose2 = rose.clone();
  rose2.position.x = s * 16.42;
  rose2.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
  temple.add(rose2);
}
// apse lancets
for (const a of [-0.62, 0, 0.62]) {
  const lx = Math.sin(a) * 8.58, lz = -22 - Math.cos(a) * 8.58;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 5.6), glassMats[1]);
  m.position.set(lx, FLOOR + 6.4, lz); m.rotation.y = -a; temple.add(m);
}
// warm light pools on the floor (fake sun through glass)
const poolGeo = new THREE.PlaneGeometry(4.2, 7.2);
for (const s of [1, -1]) for (const z of [-11.6, 11.6]) {
  const pool = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(s * 4.6, FLOOR + 0.2, z); temple.add(pool);
}

/* ================= altar, cross, candles, pool ================= */
{
  // chancel dais
  temple.add(box(11, 0.5, 7.6, stone2Mat, 0, FLOOR + 0.25, -17.2));
  // altar block
  const altar = box(4.8, 1.25, 1.9, stoneMat, 0, FLOOR + 1.13, -17.6); temple.add(altar);
  temple.add(box(5.3, 0.18, 2.3, stoneDark, 0, FLOOR + 1.83, -17.6));
  // great golden cross on the apse wall
  const shape = new THREE.Shape();
  const w = 0.62, W = 2.1, h = 6.6, H = 1.05;           // vertical bar, horizontal bar
  shape.moveTo(-w, -h / 2); shape.lineTo(w, -h / 2); shape.lineTo(w, -0.2);
  shape.lineTo(W, -0.2); shape.lineTo(W, H - 0.2); shape.lineTo(w, H - 0.2);
  shape.lineTo(w, h / 2); shape.lineTo(-w, h / 2); shape.lineTo(-w, H - 0.2);
  shape.lineTo(-W, H - 0.2); shape.lineTo(-W, -0.2); shape.lineTo(-w, -0.2); shape.closePath();
  const cross = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false }), goldMat);
  cross.position.set(0, FLOOR + 8.6, -21.3); shadowed(cross); temple.add(cross);
}

/* ---------- healing pool (semi-circle in the apse) ---------- */
const waterUniforms = {
  uTime: { value: 0 },
  uDeep: { value: new THREE.Color(0x0e3f47) },
  uShallow: { value: new THREE.Color(0x3f8f86) }
};
const waterMat = new THREE.ShaderMaterial({
  uniforms: waterUniforms,
  transparent: true,
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform float uTime; uniform vec3 uDeep, uShallow;
    varying vec2 vUv;
    void main() {
      vec2 p = vUv - 0.5;
      float r = length(p) * 2.0;
      vec3 col = mix(uShallow, uDeep, smoothstep(0.1, 0.95, r));
      float rip = sin(r * 26.0 - uTime * 1.5 + sin((vUv.x + vUv.y) * 14.0 + uTime * 0.8) * 0.7);
      col += vec3(0.05, 0.075, 0.075) * (rip * 0.5 + 0.5);
      float glint = pow(max(0.0, sin(vUv.x * 74.0 + uTime * 2.1) * sin(vUv.y * 71.0 - uTime * 1.6)), 30.0);
      col += vec3(1.0, 0.98, 0.9) * glint * 0.75;
      float alpha = 0.93 * smoothstep(1.0, 0.9, r);
      gl_FragColor = vec4(col, alpha);
    }`
});
{
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.7, 36, 0, Math.PI), waterMat);
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, FLOOR + 0.22, -19.1); temple.add(pool);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.3, 8, 30, Math.PI), stone2Mat);
  rim.rotation.x = -Math.PI / 2; rim.position.set(0, FLOOR + 0.28, -19.1); shadowed(rim); temple.add(rim);
}

/* ---------- candles ---------- */
const candleFlames = [];
const candleGeo = new THREE.CylinderGeometry(0.09, 0.12, 1, 6);
const candleMat = new THREE.MeshStandardMaterial({ color: 0xe8e0cd, roughness: 0.6, emissive: 0x3a2a10, emissiveIntensity: 0.3 });
const flameGeo = new THREE.PlaneGeometry(0.34, 0.5);
function addCandle(x, z, h) {
  const c = new THREE.Mesh(candleGeo, candleMat);
  c.scale.y = h; c.position.set(x, FLOOR + h / 2, z); temple.add(c);
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffc46a }));
  f.scale.set(0.5, 0.72, 1); f.position.set(x, FLOOR + h + 0.22, z); temple.add(f);
  candleFlames.push(f);
}
for (let i = 0; i < 12; i++) {
  const th = Math.PI + 0.28 + (i / 11) * (Math.PI - 0.56);
  addCandle(Math.cos(th) * 4.5, -19.1 + Math.sin(th) * 4.5, rand(0.5, 1.1));
}
addCandle(-2.2, -17.4, 0.8); addCandle(2.2, -17.4, 0.9);

/* ---------- interior lights ---------- */
const altarLight = new THREE.PointLight(0xffc46a, 22, 30, 1); altarLight.position.set(0, FLOOR + 5.5, -16.4); scene.add(altarLight);
const poolLight  = new THREE.PointLight(0x9fd8d0, 13, 22, 1); poolLight.position.set(0, FLOOR + 3.2, -19.3); scene.add(poolLight);
const naveLight  = new THREE.PointLight(0xffe0b0, 24, 42, 1); naveLight.position.set(0, FLOOR + 9.5, 4);    scene.add(naveLight);
const fountainLight = new THREE.PointLight(0xffd0a0, 0, 15, 1); fountainLight.position.set(0, 4.4, 31.5);   scene.add(fountainLight);
const facadeLightL = new THREE.PointLight(0xffc987, 0, 17, 1); facadeLightL.position.set(-5.5, 6.2, 26.5); scene.add(facadeLightL);
const facadeLightR = new THREE.PointLight(0xffc987, 0, 17, 1); facadeLightR.position.set( 5.5, 6.2, 26.5); scene.add(facadeLightR);

/* ---------- pews ---------- */
for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
  const z = 2.5 + i * 3.6;
  temple.add(box(3.1, 0.16, 0.95, woodMat, side * 3.7, FLOOR + 0.78, z));
  temple.add(box(3.1, 0.55, 0.18, woodMat, side * 3.7, FLOOR + 0.42, z + 0.36));
  temple.add(box(3.1, 0.55, 0.18, woodMat, side * 3.7, FLOOR + 0.42, z - 0.36));
}

/* ================= trees & planting ================= */
function makeCypress(h = 5.4) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.7, 7), trunkMat);
  trunk.position.y = 0.35; g.add(trunk);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, h, 9), cypressMat);
  cone.position.y = 0.6 + h / 2; shadowed(cone); g.add(cone);
  g.scale.setScalar(rand(0.85, 1.2));
  return g;
}
function makeOlive() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.46, 2.2, 7), trunkMat);
  trunk.position.y = 1.1; trunk.rotation.z = rand(-0.08, 0.08); shadowed(trunk); g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.15, 1.6), 1), oliveMats[i % 3]);
    s.position.set(rand(-0.8, 0.8), 2.5 + rand(-0.25, 0.55), rand(-0.8, 0.8));
    s.scale.y = 0.78; shadowed(s); g.add(s);
  }
  return g;
}
function makeStonePine() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.56, 4.3, 7), trunkMat);
  trunk.position.y = 2.15; shadowed(trunk); g.add(trunk);
  const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(2.75, 1), pineMat);
  cap.scale.y = 0.4; cap.position.y = 4.75; shadowed(cap); g.add(cap);
  return g;
}
function scatterTree(factory, x, z, rotY = Math.random() * Math.PI * 2) {
  const t = factory(); t.position.set(x, 0, z); t.rotation.y = rotY; scene.add(t); return t;
}
// cypress avenue lining the entrance path
for (const z of [46, 53, 60, 67, 74, 81]) for (const s of [1, -1]) scatterTree(makeCypress, s * 4.8, z);
// apse guardians + plaza corners
for (const [x, z] of [[-9.5, -27.5], [9.5, -27.5], [-16, 17], [16, 17]]) scatterTree(makeCypress, x, z);
// olive groves
for (const [x, z] of [[-19, 14], [-24, -4], [-15, 23], [20, 18], [26.5, 2], [17, -10], [30, 25], [-28, 27], [24, -19], [-17, -17]]) scatterTree(makeOlive, x, z);
// stone pines framing the apse
for (const [x, z] of [[-14.5, -30], [14.5, -30], [-21, -23], [21, -23]]) scatterTree(makeStonePine, x, z);
// lavender beds flanking the plaza
for (const s of [1, -1]) {
  const bed = box(6.6, 0.14, 3.1, soilMat, s * 10.6, 0.07, 24.6); bed.castShadow = false; scene.add(bed);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), lavMat);
    b.position.set(s * 10.6 - 2.7 + i * 0.9, 0.36, 23.75 + r * 1.7); b.scale.y = 0.72; scene.add(b);
  }
}

/* ================= gate & plaque ================= */
for (const s of [1, -1]) {
  scene.add(box(1.7, 6.1, 1.7, stoneMat, s * 3.55, 3.05, 86));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.28, 1.15, 4), stoneDark);
  cap.position.set(s * 3.55, 6.65, 86); cap.rotation.y = Math.PI / 4; shadowed(cap); scene.add(cap);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 9), trenchC);
  orb.position.set(s * 3.55, 7.6, 86); shadowed(orb); scene.add(orb);
}
{
  const slab = box(2.7, 1.9, 0.34, stone2Mat, 6.6, 0.95, 83.4); slab.rotation.x = -0.16; scene.add(slab);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 0.72),
    new THREE.MeshStandardMaterial({ map: makePlaqueTexture('TEMPLVM SALVTIS', 'a healing sanctuary'), roughness: 0.85 }));
  pl.position.set(6.6, 1.06, 83.56); pl.rotation.x = -0.16; scene.add(pl);
}

/* ================= Font de la Vida (Fountain of Life) ================= */
const fountain = new THREE.Group();
fountain.position.set(0, 0, 31.5);
scene.add(fountain);
{
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.4, 0.55, 26), stone2Mat); s1.position.y = 0.275; shadowed(s1); fountain.add(s1);
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.95, 0.55, 26), stoneMat); s2.position.y = 0.82; shadowed(s2); fountain.add(s2);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.06, 0.34, 10, 30), stoneDark); rim.rotation.x = Math.PI / 2; rim.position.y = 1.14; fountain.add(rim);
  const basinWater = new THREE.Mesh(new THREE.CircleGeometry(2.98, 30), waterMat); basinWater.rotation.x = -Math.PI / 2; basinWater.position.y = 1.06; fountain.add(basinWater);
  // fluted column
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.6, 2.25, 12), stoneMat); col.position.y = 2.2; shadowed(col); fountain.add(col);
  for (const ry of [1.5, 2.35]) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.075, 8, 16), trenchB); band.rotation.x = Math.PI / 2; band.position.y = ry; fountain.add(band); }
  // chalice bowl (lathe)
  const bowlPts = [new THREE.Vector2(0.06, 0), new THREE.Vector2(0.5, 0.1), new THREE.Vector2(1.28, 0.34), new THREE.Vector2(1.55, 0.62), new THREE.Vector2(1.42, 0.72), new THREE.Vector2(0.75, 0.74)];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 18), stone2Mat); bowl.position.y = 3.32; shadowed(bowl); fountain.add(bowl);
  const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.11, 8, 22), trenchC); bowlRim.rotation.x = Math.PI / 2; bowlRim.position.y = 3.99; fountain.add(bowlRim);
  // falling water from bowl to basin
  const fallTex = makeWaterFallTexture();
  const fall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32, 2.15, 2.25, 18, 1, true),
    new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, color: 0xdff2f2 })
  );
  fall.position.y = 2.15; fall.name = 'waterfall'; fountain.add(fall);
  // finial: trencadís orb + gold cross
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 9), trenchC); orb.position.y = 4.35; shadowed(orb); fountain.add(orb);
  const cv = box(0.1, 0.75, 0.1, goldMat, 0, 4.95, 0); fountain.add(cv);
  const ch = box(0.42, 0.1, 0.1, goldMat, 0, 5.06, 0); fountain.add(ch);
}

/* ================= serpentine benches (Park Güell homage) ================= */
const benchArcs = [45, 135, 225, 315];
for (const degA of benchArcs) {
  const a = deg(degA), half = 0.36, R = 8.7;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = a - half + (i / 8) * half * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * R, 0.78, 31.5 + Math.sin(t) * R));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const seat = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.42, 8), trenchBench);
  shadowed(seat); scene.add(seat);
  const backCurve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, 1.62, p.z)));
  const back = new THREE.Mesh(new THREE.TubeGeometry(backCurve, 16, 0.3, 8), trenchBench);
  shadowed(back); scene.add(back);
  // supports
  for (const f of [0.18, 0.5, 0.82]) {
    const p = curve.getPoint(f);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.62, 8), stoneDark);
    leg.position.set(p.x, 0.31, p.z); scene.add(leg);
  }
}

/* ================= meditation labyrinth (west lawn) ================= */
{
  const lab = new THREE.Group(); lab.position.set(-30, 0, 6); scene.add(lab);
  const radii = [2.25, 3.65, 5.05], gaps = [0.7, 2.4, 4.5];
  radii.forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.42, 7, 44, Math.PI * 2 - 1.05), hedgeMat);
    ring.rotation.x = Math.PI / 2; ring.rotation.z = gaps[i];
    ring.position.y = 0.4; shadowed(ring); lab.add(ring);
  });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.5, 22), stone2Mat);
  hub.position.y = 0.25; shadowed(hub); lab.add(hub);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), trenchA);
  orb.position.y = 0.78; lab.add(orb);
}

/* ================= Stations of healing (trencadís crosses) ================= */
for (const [x, z] of [[18, 18], [-18, 18], [18, -18], [-18, -18]]) {
  scene.add(box(0.95, 1.15, 0.95, stone2Mat, x, 0.575, z));
  const v = box(0.26, 1.55, 0.26, trenchA, x, 1.9, z); scene.add(v);
  const h = box(0.88, 0.26, 0.26, trenchA, x, 2.12, z); scene.add(h);
}

/* ================= dust motes & birds ================= */
const dustGeo = new THREE.BufferGeometry();
{
  const pts = [];
  for (let i = 0; i < 240; i++) pts.push(rand(-6.5, 6.5), rand(3, 12.5), rand(-20, 21));
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
}
const dustMat = new THREE.PointsMaterial({ color: 0xffe8b0, map: glowTex, size: 0.24, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

const birdTex = makeBirdSprite();
const birds = [];
for (let i = 0; i < 5; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: birdTex, color: 0x1c1a16, transparent: true, opacity: 0.9, depthWrite: false }));
  s.scale.set(3.6, 1.8, 1); scene.add(s);
  birds.push({ sprite: s, r: 26 + i * 8, h: 27 + i * 4.5, speed: 0.045 + i * 0.008, phase: rand(0, Math.PI * 2) });
}

/* ================= hotspots (clickable golden orbs) ================= */
const hotspotDefs = [
  { p: [0, FLOOR + 16.6, 24.6],  title: 'The Rose of Dawn', text: 'Twelve petals of hand-cut coloured glass. At dusk the whole nave ignites as the low sun pours through — a daily resurrection of colour, in the spirit of Gaudí’s Passion façade.' },
  { p: [11.4, FLOOR + 19.5, 22], title: 'The Towers of Joy', text: 'Trencadís-tipped spires rise toward heaven like stone wheat. Each is crowned with a mosaic orb and a gilded cross — symbols of light, harvest and renewal.' },
  { p: [0, FLOOR + 9.2, 5.6],    title: 'The Forest of Stone', text: 'Columns branch and flare like living trees, carrying the vault without a single straight line — Gaudí’s structural secret: nature itself as the blueprint.' },
  { p: [0, FLOOR + 3.1, -19.1],  title: 'The Healing Pool', text: 'The heart of the sanctuary. A still, shallow pool mirrors the dome; visitors are invited to dip their hands and release what ails them before candlelight.' },
  { p: [0, 5.6, 31.5],           title: 'Font de la Vida', text: 'The Fountain of Life. Water falls in a perpetual veil from the chalice — a reminder that healing is ceaselessly renewed, never given once and for all.' },
  { p: [6.05, 2.5, 37.6],        title: 'The Serpentine Bench', text: 'A homage to Park Güell’s mosaic sea-serpent. Sit, trace the broken tiles with your eyes, and let the mind wander kinder paths.' },
  { p: [-30, 2.1, 6],            title: 'Labyrinth of Stillness', text: 'A single winding path inward and outward again. Walk it slowly — the oldest prayer of the body, older than any building.' }
];
const hotspotGroup = new THREE.Group(); scene.add(hotspotGroup);
const hotspotHits = [];
hotspotDefs.forEach((d, i) => {
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd970 }));
  orb.position.set(...d.p); hotspotGroup.add(orb);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd070, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(1.7, 1.7, 1); glow.position.set(...d.p); hotspotGroup.add(glow);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
  hit.position.set(...d.p); hit.userData.index = i; hotspotGroup.add(hit);
  hotspotHits.push(hit);
  d.glow = glow; d.orb = orb;
});

const infoBox = document.getElementById('info');
const infoTitle = document.getElementById('infoTitle');
const infoText = document.getElementById('infoText');
function showInfo(i) {
  infoTitle.textContent = hotspotDefs[i].title;
  infoText.textContent = hotspotDefs[i].text;
  infoBox.classList.add('show');
}
document.getElementById('infoClose').addEventListener('click', () => infoBox.classList.remove('show'));

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function castHotspots(ev) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(hotspotHits, false);
  return hits.length ? hits[0].object.userData.index : -1;
}
let downInfo = null;
canvas.addEventListener('pointerdown', ev => {
  downInfo = { x: ev.clientX, y: ev.clientY };
  if (walkState.mode === 'walk') {
    walkState.drag = true;
    walkState.lastX = ev.clientX; walkState.lastY = ev.clientY;
    canvas.setPointerCapture(ev.pointerId);
  }
});
canvas.addEventListener('pointermove', ev => {
  if (walkState.drag) {
    walkState.yaw -= (ev.clientX - walkState.lastX) * 0.0052;
    walkState.pitch = THREE.MathUtils.clamp(walkState.pitch + (ev.clientY - walkState.lastY) * 0.0042, 0.12, 1.05);
    walkState.lastX = ev.clientX; walkState.lastY = ev.clientY;
  } else if (walkState.mode === 'orbit' && !downInfo) {
    canvas.style.cursor = castHotspots(ev) >= 0 ? 'pointer' : 'grab';
  }
});
canvas.addEventListener('pointerup', ev => {
  const dragged = downInfo && Math.hypot(ev.clientX - downInfo.x, ev.clientY - downInfo.y) > 7;
  walkState.drag = false; downInfo = null;
  if (!dragged) {
    const i = castHotspots(ev);
    if (i >= 0) showInfo(i);
  }
});
canvas.addEventListener('wheel', ev => {
  if (walkState.mode === 'walk') {
    ev.preventDefault();
    walkState.dist = THREE.MathUtils.clamp(walkState.dist + ev.deltaY * 0.006, 3.0, 9.0);
  }
}, { passive: false });

/* ================= time of day ================= */
const TOD = [
  { t: 0.00, elev: 24, azim:  58, sun: 0xffe9c4, sunI: 2.1, top: 0x6ea6cc, hor: 0xd3e2e2, fog: 0xcfdde0, hemiI: 1.0,  hSky: 0xbcd4de, hGnd: 0x6f7a5e, exp: 1.00, win: 0.35, stars: 0.0, cand: 0.35, disk: 0xfff2d8 },
  { t: 0.33, elev: 63, azim: 118, sun: 0xfff6e6, sunI: 2.7, top: 0x4f8fc4, hor: 0xc2d8dc, fog: 0xc4d6d8, hemiI: 1.15, hSky: 0xcfe2e8, hGnd: 0x77836a, exp: 1.06, win: 0.12, stars: 0.0, cand: 0.20, disk: 0xffffff },
  { t: 0.66, elev: 14, azim: 238, sun: 0xffd9a3, sunI: 2.3, top: 0x8098bd, hor: 0xf2c48d, fog: 0xe2c8a2, hemiI: 1.0,  hSky: 0xd8c4a8, hGnd: 0x5f6b4e, exp: 1.09, win: 0.65, stars: 0.0, cand: 0.60, disk: 0xffd9a0 },
  { t: 1.00, elev:  3, azim: 262, sun: 0xff9e63, sunI: 1.1, top: 0x232f52, hor: 0xc06a44, fog: 0x584e4c, hemiI: 0.7,  hSky: 0x46536f, hGnd: 0x333b2c, exp: 0.97, win: 1.6,  stars: 0.9, cand: 1.7,  disk: 0xff9a58 }
];
const todSlider = document.getElementById('tod');
const todLabel = document.getElementById('todLabel');
const _cA = new THREE.Color(), _cB = new THREE.Color();
function lerpColor(a, b, t, target) { _cA.setHex(a); _cB.setHex(b); return target.copy(_cA).lerp(_cB, t); }
const _tmpColor = new THREE.Color();

function applyTimeOfDay(t) {
  t = THREE.MathUtils.clamp(t, 0, 1);
  let i = 0;
  while (i < TOD.length - 2 && t > TOD[i + 1].t) i++;
  const a = TOD[i], b = TOD[i + 1];
  const k = THREE.MathUtils.smoothstep((t - a.t) / (b.t - a.t), 0, 1);
  const L = (x, y) => x + (y - x) * k;

  const elev = deg(L(a.elev, b.elev)), azim = deg(L(a.azim, b.azim));
  const sunDir = new THREE.Vector3(Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim)).normalize();
  sunLight.position.copy(sunDir).multiplyScalar(110);
  lerpColor(a.sun, b.sun, k, sunLight.color);
  sunLight.intensity = L(a.sunI, b.sunI);
  lerpColor(a.hSky, b.hSky, k, hemi.color);
  lerpColor(a.hGnd, b.hGnd, k, hemi.groundColor);
  hemi.intensity = L(a.hemiI, b.hemiI);
  lerpColor(a.fog, b.fog, k, scene.fog.color);
  lerpColor(a.top, b.top, k, skyUniforms.uTop.value);
  lerpColor(a.hor, b.hor, k, skyUniforms.uHorizon.value);
  skyUniforms.uSunDir.value.copy(sunDir);
  lerpColor(a.sun, b.sun, k, skyUniforms.uSunColor.value);
  renderer.toneMappingExposure = L(a.exp, b.exp);

  const winI = L(a.win, b.win);
  for (const m of glassMats) m.emissiveIntensity = 0.15 + winI;
  roseMat.emissiveIntensity = 0.25 + winI * 1.25;

  starMat.opacity = L(a.stars, b.stars);
  const cand = L(a.cand, b.cand);
  altarLight.intensity = 22 * cand + 6;
  poolLight.intensity = 13 * cand + 4;
  naveLight.intensity = 14 + 10 * cand;
  fountainLight.intensity = 9 * cand;
  facadeLightL.intensity = facadeLightR.intensity = 7 * cand;

  sunDisk.position.copy(sunDir).multiplyScalar(400);
  sunDisk.lookAt(camera.position);
  lerpColor(a.disk, b.disk, k, sunDisk.material.color);
  sunGlow.position.copy(sunDir).multiplyScalar(395);
  lerpColor(a.disk, b.disk, k, sunGlow.material.color);
  sunGlow.material.opacity = 0.35 + 0.35 * (1 - sunDir.y);

  todLabel.textContent = t < 0.16 ? 'Morning' : t < 0.45 ? 'Midday' : t < 0.82 ? 'Golden hour' : 'Dusk';
  return cand;
}
let candleBoost = applyTimeOfDay(0.68);
todSlider.addEventListener('input', () => { candleBoost = applyTimeOfDay(todSlider.value / 100); });

/* ================= generative ambient audio ================= */
let audioCtx = null, masterGain = null, soundOn = false, nextBird = 0, nextBell = 0;
function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain(); masterGain.gain.value = 0; masterGain.connect(audioCtx.destination);
  // wind: looped filtered noise
  const len = 2 * audioCtx.sampleRate, buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.55;
  const noise = audioCtx.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const windGain = audioCtx.createGain(); windGain.gain.value = 0.055;
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.09;
  const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.028;
  lfo.connect(lfoGain); lfoGain.connect(windGain.gain);
  noise.connect(lp); lp.connect(windGain); windGain.connect(masterGain);
  noise.start(); lfo.start();
  // deep singing-bowl drone (396 Hz — release)
  for (const [freq, amp] of [[396, 0.016], [528, 0.012]]) {
    const o = audioCtx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const g = audioCtx.createGain(); g.gain.value = amp;
    o.connect(g); g.connect(masterGain); o.start();
  }
}
function chirp(when) {
  const o = audioCtx.createOscillator(); o.type = 'sine';
  const f0 = 2200 + Math.random() * 1600;
  o.frequency.setValueAtTime(f0, when);
  o.frequency.exponentialRampToValueAtTime(f0 * 0.62, when + 0.16);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.055, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.24);
  o.connect(g); g.connect(masterGain);
  o.start(when); o.stop(when + 0.26);
}
function bell(when) {
  for (const [mult, amp, decay] of [[1, 0.16, 9], [1.5, 0.06, 6], [2.0, 0.028, 4]]) {
    const o = audioCtx.createOscillator(); o.type = 'sine'; o.frequency.value = 396 * mult;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    o.connect(g); g.connect(masterGain);
    o.start(when); o.stop(when + decay + 0.1);
  }
}
const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', () => {
  if (!audioCtx) initAudio();
  soundOn = !soundOn;
  audioCtx.resume();
  masterGain.gain.linearRampToValueAtTime(soundOn ? 1 : 0, audioCtx.currentTime + 0.6);
  soundBtn.innerHTML = soundOn ? '♪ &nbsp;Sound on' : '♪ &nbsp;Sound off';
  soundBtn.setAttribute('aria-pressed', String(soundOn));
  if (soundOn) { nextBird = audioCtx.currentTime + 0.4; nextBell = audioCtx.currentTime + 2.5; }
});

/* ================= pilgrim characters (Brother / Sister) ================= */
const pilgrimGroup = new THREE.Group(); scene.add(pilgrimGroup);
const PLAYER_R = 0.38;
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
const pilgrimSpawnText = { brother: 'Brother Martin — the monk', sister: 'Sister Lucia — the nun', novice: 'Novice Pip — the child monk' };
const pilgrimShortName = { brother: 'Brother Martin', sister: 'Sister Lucia', novice: 'Novice Pip' };

/* ---------- floating nameplate above the pilgrim ---------- */
function makeNameSprite(text) {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 72;
  const x = c.getContext('2d');
  let size = 30;
  x.font = `600 ${size}px Georgia, "Times New Roman", serif`;
  while (x.measureText(text).width > 240 && size > 15) {
    size -= 2;
    x.font = `600 ${size}px Georgia, "Times New Roman", serif`;
  }
  const pad = 18, w = Math.min(c.width - 8, x.measureText(text).width + pad * 2), h = 46;
  const x0 = (c.width - w) / 2, y0 = (c.height - h) / 2, r = 23;
  x.beginPath();
  if (x.roundRect) x.roundRect(x0, y0, w, h, r);
  else { x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); }
  x.fillStyle = 'rgba(15,21,18,0.78)';
  x.fill();
  x.strokeStyle = 'rgba(224,192,120,0.85)';
  x.lineWidth = 2;
  x.stroke();
  x.fillStyle = '#f6efdc';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, c.width / 2, c.height / 2 + 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  sprite.scale.set(2.3, 0.52, 1);
  sprite.position.y = 2.02;
  return sprite;
}
function currentNameplateText() {
  const u = currentUser();
  if (u) return displayNameOf(u);
  return pilgrimShortName[(pilgrim && pilgrim.kind) || 'brother'];
}
function refreshNameplate() {
  if (!pilgrim) return;
  const text = currentNameplateText();
  if (pilgrim.namePlateText === text) return;
  const old = pilgrim.nameSprite;
  if (old) {
    pilgrim.group.remove(old);
    if (old.material.map) old.material.map.dispose();
    old.material.dispose();
  }
  const sprite = makeNameSprite(text);
  pilgrim.group.add(sprite);
  pilgrim.nameSprite = sprite;
  pilgrim.namePlateText = text;
}

function makePilgrim(kind) {
  const isB = kind === 'brother', isN = kind === 'novice';
  const robeMat = new THREE.MeshStandardMaterial({
    color: isB ? 0x6b4a2f : isN ? 0x55613c : 0x463a5e, roughness: 0.95
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: isB ? 0xe8b48a : isN ? 0xf0c39a : 0xf2c9a0, roughness: 0.6
  });
  const cordMat = new THREE.MeshStandardMaterial({ color: 0xd9c49a, roughness: 0.9 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.5 });
  const g = new THREE.Group();

  // robe — smooth bell silhouette (lathe)
  const prof = [[0.02,0],[0.42,0],[0.46,0.07],[0.38,0.42],[0.30,0.78],[0.295,0.95],[0.335,1.06],[0.26,1.14],[0.14,1.185],[0.02,1.2]];
  const robe = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 14), robeMat);
  robe.position.y = 0.02; g.add(robe);
  // rope belt (cincture)
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.312, 0.034, 6, 16), cordMat);
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.79; g.add(belt);
  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 12), skinMat);
  head.position.y = 1.32; g.add(head);
  if (isB) {
    // tonsure — ring of hair, bald crown
    const tonsure = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.058, 6, 14), new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }));
    tonsure.rotation.x = Math.PI / 2.35; tonsure.position.y = 1.475; g.add(tonsure);
  } else if (isN) {
    // child monk — hood drawn up over the head
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.262, 12, 9, 0, Math.PI * 2, 0, Math.PI / 1.75), robeMat);
    hood.position.y = 1.37; hood.scale.set(1.06, 1.22, 1.06); g.add(hood);
    const hoodTip = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.16, 8), robeMat);
    hoodTip.position.y = 1.635; hoodTip.rotation.x = -0.18; g.add(hoodTip);
  } else {
    // kerchief wrapping the head + little bun behind
    const kerchief = new THREE.Mesh(new THREE.SphereGeometry(0.252, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.95), new THREE.MeshStandardMaterial({ color: 0xe8e0cd, roughness: 0.95 }));
    kerchief.position.y = 1.375; kerchief.scale.set(1.1, 0.92, 1.1); g.add(kerchief);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 1 }));
    bun.position.set(0, 1.28, -0.215); g.add(bun);
  }
  // eyes + serene smile (face on +z) — big and bright for the child
  const eyeGeo = new THREE.SphereGeometry(isN ? 0.034 : 0.027, 6, 5);
  const eyeL = new THREE.Mesh(eyeGeo, darkMat); eyeL.position.set(-0.088, 1.335, 0.209); g.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, darkMat); eyeR.position.set(0.088, 1.335, 0.209); g.add(eyeR);
  if (isN) {
    const cheekGeo = new THREE.SphereGeometry(0.02, 6, 5);
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xd98a7a, roughness: 0.8 });
    const cheekL = new THREE.Mesh(cheekGeo, cheekMat); cheekL.position.set(-0.125, 1.29, 0.205); g.add(cheekL);
    const cheekR = new THREE.Mesh(cheekGeo, cheekMat); cheekR.position.set(0.125, 1.29, 0.205); g.add(cheekR);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.011, 5, 10, Math.PI * 0.75), darkMat);
  smile.position.set(0, 1.235, 0.218); smile.rotation.z = Math.PI * 1.125; g.add(smile);
  // sleeves (arms merge into robe sides)
  const armGeo = new THREE.CylinderGeometry(0.072, 0.088, 0.6, 8);
  const armL = new THREE.Mesh(armGeo, robeMat); armL.position.set(-0.345, 0.88, 0.03); armL.rotation.z = 0.26; g.add(armL);
  const armR = new THREE.Mesh(armGeo, robeMat); armR.position.set(0.345, 0.88, 0.03); armR.rotation.z = -0.26; g.add(armR);
  // pilgrim staff in the right hand
  const staff = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 1.5, 7), new THREE.MeshStandardMaterial({ color: 0x6b5232, roughness: 1 }));
  staff.add(stick);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), cordMat); knob.position.y = 0.77; staff.add(knob);
  staff.position.set(0.43, 0.75, 0.14); staff.rotation.z = -0.1; g.add(staff);

  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { group: g, parts: { armL, armR, staff, eyeL, eyeR, head, baseScale: isN ? 0.74 : 1 } };
}

/* ---------- collision world (2D XZ) ---------- */
const aabbColliders = [
  // nave walls — open only through the transept crossing (|z| < 7.4)
  { minX: 7.25, maxX: 8.75, minZ: 7.4, maxZ: 22 }, { minX: 7.25, maxX: 8.75, minZ: -22, maxZ: -7.4 },
  { minX: -8.75, maxX: -7.25, minZ: 7.4, maxZ: 22 }, { minX: -8.75, maxX: -7.25, minZ: -22, maxZ: -7.4 },
  // facade wall — gaps for the three portals (central ±2.85, sides ±9.6 ±1.7)
  { minX: -13.75, maxX: -11.3, minZ: 20.95, maxZ: 23.05 }, { minX: -7.9, maxX: -2.85, minZ: 20.95, maxZ: 23.05 },
  { minX: 2.85, maxX: 7.9, minZ: 20.95, maxZ: 23.05 }, { minX: 11.3, maxX: 13.75, minZ: 20.95, maxZ: 23.05 },
  // transept end walls
  { minX: 16.45, maxX: 17.95, minZ: -8.1, maxZ: 8.1 }, { minX: -17.95, maxX: -16.45, minZ: -8.1, maxZ: 8.1 },
  // transept arm outer walls
  { minX: 8, maxX: 17, minZ: 7.0, maxZ: 8.5 }, { minX: -17, maxX: -8, minZ: 7.0, maxZ: 8.5 },
  { minX: 8, maxX: 17, minZ: -8.5, maxZ: -7.0 }, { minX: -17, maxX: -8, minZ: -8.5, maxZ: -7.0 },
  // crossing piers
  { minX: 5.15, maxX: 7.25, minZ: 5.15, maxZ: 7.25 }, { minX: -7.25, maxX: -5.15, minZ: 5.15, maxZ: 7.25 },
  { minX: 5.15, maxX: 7.25, minZ: -7.25, maxZ: -5.15 }, { minX: -7.25, maxX: -5.15, minZ: -7.25, maxZ: -5.15 },
  // altar dais
  { minX: -5.5, maxX: 5.5, minZ: -21.0, maxZ: -13.4 }
];
const circleColliders = [
  { x: 6.6, z: -22.5, r: 2.2 }, { x: -6.6, z: -22.5, r: 2.2 },       // apse pillars
  { x: 0, z: 31.5, r: 5.6 },                                          // Fountain of Life
  { x: 3.55, z: 86, r: 1.2 }, { x: -3.55, z: 86, r: 1.2 },             // gate pillars
  { x: 18, z: 18, r: 0.85 }, { x: -18, z: 18, r: 0.85 },
  { x: 18, z: -18, r: 0.85 }, { x: -18, z: -18, r: 0.85 }              // Stations of healing
];
for (const cx of [-5.2, 5.2]) for (const cz of [-15.5, -9.5, -3.8, 3.8, 9.5, 15.5])
  circleColliders.push({ x: cx, z: cz, r: 0.95 });                      // tree columns
for (const z of [46, 53, 60, 67, 74, 81]) for (const s of [1, -1])
  circleColliders.push({ x: s * 4.8, z, r: 0.55 });                     // cypress avenue
for (const [x, z] of [[-9.5, -27.5], [9.5, -27.5], [-16, 17], [16, 17]])
  circleColliders.push({ x, z, r: 0.55 });
for (const [x, z] of [[-19, 14], [-24, -4], [-15, 23], [20, 18], [26.5, 2], [17, -10], [30, 25], [-28, 27], [24, -19], [-17, -17]])
  circleColliders.push({ x, z, r: 0.65 });                              // olives
for (const [x, z] of [[-14.5, -30], [14.5, -30], [-21, -23], [21, -23]])
  circleColliders.push({ x, z, r: 0.7 });                               // stone pines

// Apse shell — half-annulus blocking the curved back wall (open toward +z)
const APSE = { x: 0, z: -22, rIn: 7.6, rOut: 9.45 };

function baseGroundY(x, z) {
  if (Math.abs(x) <= 18.5 && Math.abs(z) <= 29.5) return 2;                                   // plinth + interior
  if (Math.abs(x) <= 10.5 && z > 29.5 && z < 34.5) return 2 * (1 - (z - 29.5) / 5.0);         // entrance steps
  return 0;
}
function resolveCollisions(p, py) {
  // plinth body — low (ground-level) pilgrims may only enter via the south gap (steps);
  // once up on the plinth/interior (y ≥ 1.5) they walk freely — walls hold them in.
  if (py < 1.5) {
    const inFoot = Math.abs(p.x) < 18.6 && Math.abs(p.z) < 29.6;
    const inGap = Math.abs(p.x) < 10.5 && p.z >= 29.4;
    if (inFoot && !inGap) {
      const pen = [
        { d: p.x + 18.6, ax: 'x', to: -18.6 }, { d: 18.6 - p.x, ax: 'x', to: 18.6 },
        { d: p.z + 29.6, ax: 'z', to: -29.6 }, { d: 29.6 - p.z, ax: 'z', to: 29.6 }
      ].sort((a, b) => a.d - b.d)[0];
      if (pen.ax === 'x') p.x = pen.to; else p.z = pen.to;
    }
  }
  for (const c of aabbColliders) {
    if (p.x > c.minX - PLAYER_R && p.x < c.maxX + PLAYER_R && p.z > c.minZ - PLAYER_R && p.z < c.maxZ + PLAYER_R) {
      const pen = [
        { d: p.x - (c.minX - PLAYER_R), ax: 'x', to: c.minX - PLAYER_R },
        { d: (c.maxX + PLAYER_R) - p.x, ax: 'x', to: c.maxX + PLAYER_R },
        { d: p.z - (c.minZ - PLAYER_R), ax: 'z', to: c.minZ - PLAYER_R },
        { d: (c.maxZ + PLAYER_R) - p.z, ax: 'z', to: c.maxZ + PLAYER_R }
      ].sort((a, b) => a.d - b.d)[0];
      if (pen.ax === 'x') p.x = pen.to; else p.z = pen.to;
    }
  }
  for (const c of circleColliders) {
    const dx = p.x - c.x, dz = p.z - c.z, rr = c.r + PLAYER_R, d2 = dx * dx + dz * dz;
    if (d2 < rr * rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      p.x = c.x + (dx / d) * rr; p.z = c.z + (dz / d) * rr;
    }
  }
  // apse annulus (back wall only)
  if (p.z < -22) {
    const dx = p.x - APSE.x, dz = p.z - APSE.z, d = Math.hypot(dx, dz);
    if (d > APSE.rIn - PLAYER_R && d < APSE.rOut + PLAYER_R) {
      const side = (d - (APSE.rIn - PLAYER_R)) < ((APSE.rOut + PLAYER_R) - d) ? APSE.rIn - PLAYER_R : APSE.rOut + PLAYER_R;
      p.x = APSE.x + (dx / d) * side; p.z = APSE.z + (dz / d) * side;
    }
  }
  p.x = THREE.MathUtils.clamp(p.x, -120, 120);
  p.z = THREE.MathUtils.clamp(p.z, -60, 125);
}

/* ---------- walk state ---------- */
const walkState = {
  mode: 'orbit', yaw: 0, pitch: 0.34, dist: 5.6,
  heading: Math.PI, phase: 0, speed: 0, stepMark: 0,
  blinkAt: 2.2, blinkUntil: 0, groundY: 0, kneel: 0, kneelTarget: 0,
  drag: false, lastX: 0, lastY: 0,
  lastDir: new THREE.Vector3(0, 0, -1)
};
let pilgrim = null;   // { kind, group, parts }

function spawnPilgrim(kind) {
  if (pilgrim) pilgrimGroup.remove(pilgrim.group);
  const built = makePilgrim(kind);
  pilgrim = { kind, ...built };
  pilgrim.group.position.set(5.5, 0, 43);   // plaza SE arc — a straight walk clears the fountain and meets the steps
  pilgrim.group.scale.setScalar(pilgrim.parts.baseScale || 1);
  walkState.heading = Math.PI;   // face the temple (north)
  walkState.phase = 0; walkState.speed = 0; walkState.groundY = 0;
  pilgrimGroup.add(pilgrim.group);
  if (window.__T) window.__T.pilgrim = pilgrim;
  refreshNameplate();
  const badge = document.getElementById('pilgrimBadge');
  if (badge) { badge.textContent = 'Now walking — ' + pilgrimSpawnText[kind]; badge.hidden = false; }
}

const keys = new Set();
const WALK_KEYS = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (WALK_KEYS.includes(e.code)) { keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); }
  if (e.code === 'Escape' && walkState.mode === 'walk') setWalkMode('orbit');
  if (e.code === 'KeyN') toggleKneel();
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

function setWalkMode(next) {
  walkState.mode = next;
  const walking = next === 'walk';
  controls.enabled = !walking;
  const toggle = document.getElementById('walkToggle');
  if (toggle) {
    toggle.textContent = walking ? '🕊  Return to orbit view' : '🚶  Walk the sanctuary';
    toggle.setAttribute('aria-pressed', String(walking));
  }
  const hint = document.getElementById('walkHint');
  if (hint) hint.hidden = !walking;
  if (walking && pilgrim) {
    const p = pilgrim.group.position;
    walkState.yaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    walkState.pitch = 0.34;
  } else if (!walking && pilgrim) {
    const p = pilgrim.group.position;
    controls.target.set(p.x, p.y + 1.35, p.z);
    controls.update();
  }
}

/* ---------- footsteps (soft scuff, routed through Sound) ---------- */
function playStep() {
  if (!audioCtx || !soundOn) return;
  const when = audioCtx.currentTime;
  const len = (0.08 * audioCtx.sampleRate) | 0;
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.value = 240 + Math.random() * 140; bp.Q.value = 1.2;
  const g = audioCtx.createGain(); g.gain.value = 0.45;
  src.connect(bp); bp.connect(g); g.connect(masterGain);
  src.start(when);
}

const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _move = new THREE.Vector3();
const _desiredCam = new THREE.Vector3();
function updatePilgrim(dt, t) {
  if (!pilgrim) return;
  const g = pilgrim.group, parts = pilgrim.parts;
  let ix = 0, iz = 0;
  if (walkState.mode === 'walk' && walkState.kneelTarget !== 1) {
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    ix += walkState.joyX || 0; iz += walkState.joyY || 0;
  }
  const run = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const hasInput = (ix !== 0 || iz !== 0);
  if (hasInput) {
    const sin = Math.sin(walkState.yaw), cos = Math.cos(walkState.yaw);
    _fwd.set(-sin, 0, -cos); _right.set(cos, 0, -sin);
    _move.copy(_fwd).multiplyScalar(iz).addScaledVector(_right, ix).normalize();
    walkState.lastDir.copy(_move);
    walkState.heading = lerpAngle(walkState.heading, Math.atan2(_move.x, _move.z), 1 - Math.exp(-10 * dt));
  }
  const targetSpeed = hasInput ? (run ? 5.1 : 3.1) : 0;
  walkState.speed += (targetSpeed - walkState.speed) * (1 - Math.exp(-8 * dt));

  const pos = g.position;
  if (walkState.speed > 0.02) {
    const dir = walkState.lastDir;
    pos.x += dir.x * walkState.speed * dt;
    pos.z += dir.z * walkState.speed * dt;
    resolveCollisions(pos, pos.y);
  }
  // ground height (plinth 2 m, entrance steps ramp, else grass)
  const targetY = baseGroundY(pos.x, pos.z);
  walkState.groundY += (targetY - walkState.groundY) * (1 - Math.exp(-12 * dt));

  const sp = walkState.speed, moving = sp > 0.25;
  walkState.phase += sp * dt * 2.05;
  const wp = walkState.phase;
  walkState.kneel += (walkState.kneelTarget - walkState.kneel) * (1 - Math.exp(-7 * dt));
  const k = walkState.kneel;
  const bs = parts.baseScale || 1;
  pos.y = walkState.groundY + (moving ? Math.abs(Math.sin(wp)) * 0.055 : 0);
  g.rotation.y = walkState.heading;
  g.rotation.z = moving ? Math.sin(wp) * 0.04 : 0;
  const breathe = moving ? 0 : Math.sin(t * 1.8) * 0.012;
  const crouch = 1 - 0.38 * k;
  g.scale.set(bs, bs * crouch * (1 + breathe), bs);

  const idleL = moving ? Math.sin(wp) * 0.62 : Math.sin(t * 1.7) * 0.05;
  const idleR = moving ? -Math.sin(wp) * 0.32 : -Math.sin(t * 1.7 + 0.7) * 0.05;
  parts.armL.rotation.x = THREE.MathUtils.lerp(idleL, -1.28, k);
  parts.armR.rotation.x = THREE.MathUtils.lerp(idleR, -1.42, k);
  parts.staff.rotation.x = THREE.MathUtils.lerp(moving ? Math.sin(wp) * 0.15 : 0, 0.5, k);
  parts.head.rotation.x = 0.38 * k;
  if (t > walkState.blinkAt) { walkState.blinkAt = t + 2.4 + Math.random() * 2.8; walkState.blinkUntil = t + 0.13; }
  const eyeS = t < walkState.blinkUntil ? 0.12 : 1;
  parts.eyeL.scale.y = eyeS; parts.eyeR.scale.y = eyeS;

  const mark = Math.floor(wp / Math.PI);
  if (moving && mark !== walkState.stepMark) { walkState.stepMark = mark; playStep(); }

  if (walkState.mode === 'walk') {
    const cp = Math.cos(walkState.pitch), spp = Math.sin(walkState.pitch);
    const distNow = walkState.dist * (1 - 0.32 * walkState.kneel);
    _desiredCam.set(
      pos.x + Math.sin(walkState.yaw) * cp * distNow,
      walkState.groundY + (1.05 - 0.34 * walkState.kneel) + spp * distNow,
      pos.z + Math.cos(walkState.yaw) * cp * distNow
    );
    camera.position.lerp(_desiredCam, 1 - Math.exp(-10 * dt));
    camera.lookAt(pos.x, walkState.groundY + 1.32 - 0.5 * walkState.kneel, pos.z);
  }
}

/* ================= camera preset views ================= */
const views = {
  overview:  { pos: [37, 19, 47],  tgt: [0, 8, 0] },
  facade:    { pos: [0, 9.5, 47],  tgt: [0, 13, 22] },
  nave:      { pos: [0, 6.6, 15],  tgt: [0, 9, -9] },
  pool:      { pos: [0, 10.5, -11.5], tgt: [0, 2.0, -19.8] },
  fountain:  { pos: [11, 5, 41],   tgt: [0, 2.4, 31.5] },
  labyrinth: { pos: [-39, 6.5, 19], tgt: [-30, 0.8, 6] }
};
const veil = document.getElementById('veil');
function flyTo(name) {
  const v = views[name]; if (!v) return;
  // quick veil flash — avoids clipping the camera through walls & spires
  veil.style.transitionDuration = '0.2s';
  veil.classList.remove('gone');
  setTimeout(() => {
    camera.position.set(...v.pos);
    controls.target.set(...v.tgt);
    controls.update();
    veil.classList.add('gone');
  }, 210);
}
document.querySelectorAll('.view-btn').forEach(b => b.addEventListener('click', () => flyTo(b.dataset.view)));

/* ================= panel toggle ================= */
const panel = document.getElementById('panel');
const panelToggle = document.getElementById('panelToggle');
panelToggle.addEventListener('click', () => { panel.classList.remove('hidden'); panelToggle.style.display = 'none'; });
const collapseBtn = document.createElement('button');
collapseBtn.textContent = '— hide panel';
collapseBtn.className = 'view-btn';
collapseBtn.style.cssText = 'margin-top:10px;width:100%;font-size:10.5px;opacity:.8';
collapseBtn.addEventListener('click', () => { panel.classList.add('hidden'); panelToggle.style.display = 'flex'; });
document.querySelector('#panel .btn-row').appendChild(collapseBtn);

/* ================= accounts & the prayer wall ================= */
const authButton = document.getElementById('authButton');
const authModal = document.getElementById('authModal');
const authClose = document.getElementById('authClose');
const authForm = document.getElementById('authForm');
const authToggle = document.getElementById('authToggle');
const nameField = document.getElementById('nameField');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const authError = document.getElementById('authError');
const authNote = document.getElementById('authNote');
const authSub = document.getElementById('authSub');
const wallButton = document.getElementById('wallButton');
const wallPanel = document.getElementById('wallPanel');
const wallClose = document.getElementById('wallClose');
const wallNotice = document.getElementById('wallNotice');
const prayerList = document.getElementById('prayerList');
const prayerEmpty = document.getElementById('prayerEmpty');
const prayerForm = document.getElementById('prayerForm');
const prayerBody = document.getElementById('prayerBody');
const prayerCount = document.getElementById('prayerCount');
const prayerSubmit = document.getElementById('prayerSubmit');
const wallSignedOut = document.getElementById('wallSignedOut');
const wallSignin = document.getElementById('wallSignin');
const toastEl = document.getElementById('toast');

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3400);
}
function prettyAuthError(err) {
  const m = (err && err.message) || String(err) || 'Something went wrong.';
  if (/invalid login credentials/i.test(m)) return 'That email and password do not match.';
  if (/email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox.';
  if (/user already registered/i.test(m)) return 'An account already exists for that email — sign in instead.';
  if (/password should be at least/i.test(m)) return 'Password must be at least 6 characters.';
  if (/failed to fetch|networkerror|network request failed/i.test(m)) return 'Could not reach the sanctuary server — check your connection.';
  return m;
}

let authMode = 'signin';
function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  nameField.hidden = !signup;
  authName.required = signup;
  authSubmit.textContent = signup ? 'Create account' : 'Sign in';
  authToggle.textContent = signup ? '…or sign in instead' : '…or create an account';
  authSub.textContent = signup
    ? 'Join the sanctuary — your pilgrim will follow you to any device.'
    : 'Sign in to leave a prayer on the wall and carry your pilgrim between devices.';
  authPassword.autocomplete = signup ? 'new-password' : 'current-password';
  authError.hidden = true; authNote.hidden = true;
}
function showModal() {
  setAuthMode(authMode);
  authModal.classList.add('show');
  authModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => (authMode === 'signup' ? authName : authEmail).focus(), 60);
}
function hideModal() { authModal.classList.remove('show'); authModal.setAttribute('aria-hidden', 'true'); }
function openWall() { wallPanel.classList.add('show'); wallPanel.setAttribute('aria-hidden', 'false'); refreshPrayers(); }
function closeWall() { wallPanel.classList.remove('show'); wallPanel.setAttribute('aria-hidden', 'true'); }

authButton.addEventListener('click', () => {
  if (currentUser()) { signOut().then(() => toast('Go in peace.')); return; }
  showModal();
});
authClose.addEventListener('click', hideModal);
authModal.addEventListener('pointerdown', e => { if (e.target === authModal) hideModal(); });
authToggle.addEventListener('click', () => setAuthMode(authMode === 'signin' ? 'signup' : 'signin'));
wallButton.addEventListener('click', openWall);
wallClose.addEventListener('click', closeWall);
wallSignin.addEventListener('click', showModal);
window.addEventListener('keydown', e => {
  if (e.code !== 'Escape') return;
  if (authModal.classList.contains('show')) hideModal();
  else if (wallPanel.classList.contains('show')) closeWall();
});

authForm.addEventListener('submit', async e => {
  e.preventDefault();
  authError.hidden = true; authNote.hidden = true;
  const email = authEmail.value.trim(), password = authPassword.value, displayName = authName.value.trim();
  if (!email || !password) { authError.textContent = 'Email and password are required.'; authError.hidden = false; return; }
  if (authMode === 'signup' && !displayName) { authError.textContent = 'Tell us your name.'; authError.hidden = false; return; }
  authSubmit.disabled = true; authSubmit.textContent = 'One moment…';
  try {
    if (authMode === 'signup') {
      const { data, error } = await signUp(email, password, displayName);
      if (error) throw error;
      if (data?.session) { toast(`Welcome, ${displayName}.`); hideModal(); }
      else {
        authNote.textContent = 'A confirmation link is on its way to your inbox — confirm it, then sign in.';
        authNote.hidden = false;
        setAuthMode('signin');
        authEmail.value = email; authPassword.value = '';
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast('Welcome back.');
      hideModal(); authForm.reset();
    }
  } catch (err) {
    authError.textContent = prettyAuthError(err);
    authError.hidden = false;
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === 'signup' ? 'Create account' : 'Sign in';
  }
});

function relTime(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString();
}
function showWallNotice(msg) { wallNotice.textContent = msg; wallNotice.hidden = false; }
function renderPrayer(row, meId) {
  const li = document.createElement('li'); li.className = 'prayer-item';
  const meta = document.createElement('div'); meta.className = 'prayer-meta';
  const name = document.createElement('span'); name.className = 'prayer-name'; name.textContent = row.display_name;
  const time = document.createElement('span'); time.className = 'prayer-time'; time.textContent = relTime(row.created_at);
  meta.append(name, time);
  if (meId && row.user_id === meId) {
    const del = document.createElement('button');
    del.className = 'prayer-del'; del.textContent = '✕'; del.title = 'Withdraw my prayer'; del.setAttribute('aria-label', 'Withdraw my prayer');
    del.addEventListener('click', async () => {
      const { error } = await deletePrayer(row.id);
      if (error) { toast('Could not withdraw it: ' + error.message); return; }
      li.remove(); toast('Your prayer was withdrawn.');
    });
    meta.append(del);
  }
  const body = document.createElement('p'); body.className = 'prayer-body'; body.textContent = row.body;
  li.append(meta, body);
  return li;
}
async function refreshPrayers() {
  prayerList.textContent = '';
  prayerEmpty.hidden = true;
  const { data, error } = await fetchPrayers(30);
  if (error) {
    showWallNotice(/relation .*prayers.* does not exist|Could not find/i.test(error.message || '')
      ? 'The wall is not built yet — run supabase/schema.sql in the Supabase SQL editor.'
      : 'The wall could not be read: ' + (error.message || 'unknown error'));
    return;
  }
  wallNotice.hidden = true;
  const rows = data ?? [];
  prayerEmpty.hidden = rows.length !== 0;
  const meId = currentUser()?.id ?? null;
  for (const row of rows) prayerList.appendChild(renderPrayer(row, meId));
}

prayerBody.addEventListener('input', () => { prayerCount.textContent = String(280 - prayerBody.value.length); });
prayerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const body = prayerBody.value.trim();
  if (!body) return;
  prayerSubmit.disabled = true;
  const { error } = await addPrayer(body);
  prayerSubmit.disabled = false;
  if (error) {
    toast(/relation .*prayers.* does not exist|Could not find/i.test(error.message || '')
      ? 'Run supabase/schema.sql first.'
      : (error.message || 'Could not leave your prayer.'));
    return;
  }
  prayerBody.value = ''; prayerCount.textContent = '280';
  toast('Your intention is on the wall.');
  refreshPrayers();
});

onAuthChange(session => {
  const u = session?.user ?? null;
  authButton.textContent = u ? `✦ ${displayNameOf(u)} · sign out` : '✦ Sign in';
  prayerForm.hidden = !u;
  wallSignedOut.hidden = Boolean(u);
  if (u) {
    // adopt the account's pilgrim into this device if none was chosen here yet
    const pref = getPilgrimPreference();
    try { if (pref && !localStorage.getItem('ts-pilgrim')) localStorage.setItem('ts-pilgrim', pref); } catch (_) { /* private mode */ }
    refreshPrayers();
  }
  refreshNameplate();   // nameplate follows the signed-in user (or guest fallback)
});
initAuth();

/* ================= pilgrim selection & walk UI ================= */
const overlay = document.getElementById('pilgrimOverlay');
const walkToggle = document.getElementById('walkToggle');
const orbitOnly = document.getElementById('orbitOnly');
const switchPilgrim = document.getElementById('switchPilgrim');

function hidePilgrimOverlay() { overlay.classList.add('gone'); document.body.classList.add('ts-entered'); }
function showPilgrimOverlay() { overlay.classList.remove('gone'); }

document.querySelectorAll('.pilgrim-card').forEach(card => {
  card.addEventListener('click', () => {
    const kind = card.dataset.pilgrim;
    spawnPilgrim(kind);
    try { localStorage.setItem('ts-pilgrim', kind); } catch (_) { /* private mode */ }
    setPilgrimPreference(kind);   // sync to account when signed in
    hidePilgrimOverlay();
    setWalkMode('walk');
  });
});
orbitOnly.addEventListener('click', hidePilgrimOverlay);
switchPilgrim.addEventListener('click', showPilgrimOverlay);
walkToggle.addEventListener('click', () => {
  if (!pilgrim) { showPilgrimOverlay(); return; }
  setWalkMode(walkState.mode === 'walk' ? 'orbit' : 'walk');
});

/* ================= touch joystick (walk mode) ================= */
const joyEl = document.getElementById('joy');
const joyKnob = document.getElementById('joyKnob');
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
let joyId = null, joyCenter = { x: 0, y: 0 };
const JOY_R = 46;
function setJoyFromEvent(ev) {
  const dx = ev.clientX - joyCenter.x, dy = ev.clientY - joyCenter.y;
  const len = Math.hypot(dx, dy), cl = Math.min(len, JOY_R);
  const nx = len > 0 ? dx / len : 0, ny = len > 0 ? dy / len : 0;
  walkState.joyX = (nx * cl) / JOY_R;
  walkState.joyY = -(ny * cl) / JOY_R;
  joyKnob.style.transform = `translate(${nx * cl}px, ${ny * cl}px)`;
}
if (joyEl) {
  joyEl.addEventListener('pointerdown', ev => {
    joyId = ev.pointerId;
    const r = joyEl.getBoundingClientRect();
    joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    joyEl.setPointerCapture(ev.pointerId);
    setJoyFromEvent(ev);
    ev.preventDefault();
  });
  joyEl.addEventListener('pointermove', ev => { if (ev.pointerId === joyId) setJoyFromEvent(ev); });
  const joyEnd = ev => {
    if (ev.pointerId !== joyId) return;
    joyId = null; walkState.joyX = 0; walkState.joyY = 0;
    joyKnob.style.transform = 'translate(0px, 0px)';
  };
  joyEl.addEventListener('pointerup', joyEnd);
  joyEl.addEventListener('pointercancel', joyEnd);
}
function refreshJoyVisibility() {
  if (!joyEl) return;
  joyEl.hidden = !(isTouch && walkState.mode === 'walk');
}
const _origSetWalkMode = setWalkMode;
setWalkMode = function (m) { _origSetWalkMode(m); refreshJoyVisibility(); };
refreshJoyVisibility();

/* ================= kneel to pray ================= */
const kneelBtn = document.getElementById('kneelBtn');
function toggleKneel() {
  if (!pilgrim || walkState.mode !== 'walk') return;
  walkState.kneelTarget = walkState.kneelTarget === 1 ? 0 : 1;
  const kneeling = walkState.kneelTarget === 1;
  const name = pilgrimShortName[pilgrim.kind];
  const nearPool = Math.hypot(pilgrim.group.position.x, pilgrim.group.position.z + 19) < 5;
  toast(kneeling
    ? (nearPool ? `By the waters, ${name} kneels in stillness.` : `${name} kneels in stillness.`)
    : `${name} rises.`);
  if (kneeling && audioCtx && soundOn) bell(audioCtx.currentTime + 0.02);
  if (kneelBtn) {
    kneelBtn.setAttribute('aria-pressed', String(kneeling));
    kneelBtn.innerHTML = kneeling ? '✶&nbsp; Rise' : '✶&nbsp; Kneel to pray';
  }
}
if (kneelBtn) kneelBtn.addEventListener('click', toggleKneel);

/* ================= debug handle (used by smoke tests) ================= */
window.__T = { camera, controls, flyTo, scene, spawnPilgrim, setWalkMode, walkState, toggleKneel };

/* ================= animation loop ================= */
const waterfall = fountain.getObjectByName('waterfall');
let firstFrame = true;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.09);
  const t = clock.elapsedTime;

  if (walkState.mode === 'orbit') controls.update();
  updatePilgrim(dt, t);

  // water & falls
  waterUniforms.uTime.value = t;
  if (waterfall) waterfall.material.map.offset.y = -t * 1.35;

  // dust motes drift
  dust.rotation.y = t * 0.018;
  dust.position.y = Math.sin(t * 0.3) * 0.35;
  dustMat.opacity = 0.34 + 0.16 * (0.5 + 0.5 * Math.sin(t * 0.7));

  // birds circle over the sanctuary
  for (const b of birds) {
    const a = t * b.speed + b.phase;
    b.sprite.position.set(Math.cos(a) * b.r, b.h + Math.sin(t * 0.8 + b.phase) * 1.6, Math.sin(a) * b.r);
  }

  // candle flicker
  const flick = 0.86 + 0.14 * Math.sin(t * 9.3) * Math.sin(t * 5.1 + 1.7) + 0.06 * Math.sin(t * 23.7);
  altarLight.intensity = (22 * candleBoost + 6) * flick;
  poolLight.intensity = (13 * candleBoost + 4) * (2 - flick);
  for (const f of candleFlames) f.scale.y = 0.66 + 0.16 * flick;

  // hotspot pulse
  hotspotDefs.forEach((d, i) => {
    const s = 1.45 + 0.4 * Math.sin(t * 2.1 + i * 1.3);
    d.glow.scale.set(s, s, 1);
  });

  // bells & birdsong scheduling
  if (soundOn && audioCtx) {
    const now = audioCtx.currentTime;
    if (now >= nextBird) { chirp(now + 0.02); nextBird = now + rand(1.4, 4.2); }
    if (now >= nextBell) { bell(now + 0.02); nextBell = now + rand(22, 34); }
  }

  renderer.render(scene, camera);

  if (firstFrame) { firstFrame = false; setTimeout(() => veil.classList.add('gone'), 350); }
}
animate();

/* ================= resize ================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
