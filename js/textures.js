// Procedural canvas textures — no external assets.
import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
function toTexture(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function makeStoneTexture(repeat = 3, repeatY = 3) {
  const c = makeCanvas(256, 256), ctx = c.getContext('2d');
  ctx.fillStyle = '#cfc2a0'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const g = 150 + Math.random() * 80 | 0;
    ctx.fillStyle = `rgba(${g},${g - 12},${g - 45},${rand(0.2, 0.45)})`;
    const s = rand(0.8, 3.1);
    ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
  }
  ctx.strokeStyle = 'rgba(110,100,75,0.28)';
  ctx.lineWidth = 1.4;
  for (let y = 34; y < 256; y += rand(38, 52)) {
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 18) ctx.lineTo(x, y + Math.sin(x * 0.05 + y) * 2.2);
    ctx.stroke();
  }
  return toTexture(c, repeat, repeatY);
}

export function makeTrencadis(palette, grout = '#e9e4d4', repeat = 2, repeatY = 2) {
  const c = makeCanvas(512, 512), ctx = c.getContext('2d');
  ctx.fillStyle = grout; ctx.fillRect(0, 0, 512, 512);
  const P = palette || ['#f4f1e6', '#dfe9e4', '#bcd3d8', '#8fb8c9', '#5f8ea6',
    '#e8c766', '#c96f4a', '#a8b97f', '#3f5c6e', '#7a4a3a', '#f0d9b5'];
  for (let i = 0; i < 240; i++) {
    const cx = Math.random() * 512, cy = Math.random() * 512, r = rand(9, 26);
    const n = 5 + (Math.random() * 3 | 0);
    const rot = Math.random() * Math.PI * 2;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const a = rot + (k / n) * Math.PI * 2 + rand(-0.25, 0.25);
      const rr = r * rand(0.62, 1.15);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = pick(P);
    ctx.globalAlpha = rand(0.82, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // a few vivid accent shards
  const accent = palette === 'roof'
    ? ['#c98f3f', '#8f7a2f', '#5f7a3a', '#a85a32']
    : ['#d94f3d', '#2f6f8f', '#e0b53a', '#3d7a52'];
  for (let i = 0; i < 26; i++) {
    const cx = Math.random() * 512, cy = Math.random() * 512, r = rand(5, 13);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * rand(0.6, 1), Math.random() * 3, 0, Math.PI * 2);
    ctx.fillStyle = pick(accent);
    ctx.fill();
  }
  return toTexture(c, repeat, repeatY);
}

function archPath(ctx, w, h, oy = 0) {
  const r = w / 2, springY = h - r + oy;
  ctx.beginPath();
  ctx.moveTo(0, oy + h - h); // placeholder replaced below
  ctx.closePath();
  // proper path built explicitly
  ctx.beginPath();
  ctx.moveTo(-w / 2, oy);
  ctx.lineTo(-w / 2, springY);
  ctx.quadraticCurveTo(-w / 2, oy + h, 0, oy + h);
  ctx.quadraticCurveTo(w / 2, oy + h, w / 2, springY);
  ctx.lineTo(w / 2, oy);
  ctx.closePath();
}

const GLASS_PALETTES = {
  tide:  ['#1d3f6e', '#2c5d8a', '#3f8f8f', '#58b09a', '#7fd0b0', '#123048', '#89c7d8', '#1f6f6f'],
  ember: ['#5e1a1a', '#8a3a1e', '#b85a24', '#d98a3a', '#e8c766', '#7a2a2a', '#c96f4a', '#3a1010'],
  royal: ['#2a1448', '#3f2060', '#5a3480', '#7a4a9e', '#9a6ab8', '#1e0f30', '#c4a0d9', '#4a2a68'],
  dawn:  ['#5e2a3a', '#8a3a4e', '#b85a5a', '#d98a6a', '#e8b87a', '#7a2a3a', '#f2d0a0', '#3a1520']
};

export function makeStainedGlass(kind = 'tide') {
  const W = 256, H = 448;
  const c = makeCanvas(W, H), ctx = c.getContext('2d');
  const palette = GLASS_PALETTES[kind] || GLASS_PALETTES.tide;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, 0);
  archPath(ctx, W - 16, H - 8, 4);
  ctx.clip();
  // luminous backdrop
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a2030');
  g.addColorStop(0.45, '#241a28');
  g.addColorStop(1, '#1a1420');
  ctx.fillStyle = g; ctx.fillRect(-W / 2, 0, W, H);
  // central light shaft
  const rg = ctx.createRadialGradient(0, H * 0.42, 8, 0, H * 0.42, W * 0.85);
  rg.addColorStop(0, 'rgba(255,240,205,0.55)');
  rg.addColorStop(1, 'rgba(255,240,205,0)');
  ctx.fillStyle = rg; ctx.fillRect(-W / 2, 0, W, H);
  // shards
  for (let i = 0; i < 150; i++) {
    const cx = rand(-W / 2, W / 2), cy = rand(0, H), r = rand(12, 34);
    const n = 5 + (Math.random() * 2 | 0), rot = Math.random() * 7;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const a = rot + (k / n) * Math.PI * 2 + rand(-0.3, 0.3);
      const rr = r * rand(0.6, 1.2);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = pick(palette);
    ctx.globalAlpha = rand(0.75, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(12,10,8,0.9)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.restore();
  // arch frame line
  ctx.save();
  ctx.translate(W / 2, 0);
  archPath(ctx, W - 16, H - 8, 4);
  ctx.strokeStyle = '#16120c';
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeRoseWindow() {
  const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d');
  const cx = S / 2, cy = S / 2;
  // deep glass base
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, S / 2);
  g.addColorStop(0, '#3a2a10');
  g.addColorStop(0.5, '#241428');
  g.addColorStop(1, '#120a18');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  const glassCols = ['#c94f38', '#e0b53a', '#3f8f8f', '#7a4a9e', '#58b09a', '#d98a3a', '#2c5d8a'];
  // 12 petal lobes
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2;
    const a1 = ((i + 1) / 12) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    // lobe glass
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, S * 0.44, a0 + 0.02, a1 - 0.02);
    ctx.closePath();
    const lg = ctx.createRadialGradient(cx, cy, 30, cx, cy, S * 0.44);
    const col = glassCols[i % glassCols.length];
    lg.addColorStop(0, '#f5e6b0');
    lg.addColorStop(0.45, col);
    lg.addColorStop(1, '#14080c');
    ctx.fillStyle = lg; ctx.fill();
    // lead came between lobes
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * S * 0.44, cy + Math.sin(a0) * S * 0.44);
    ctx.strokeStyle = '#0d0a08'; ctx.lineWidth = 7; ctx.stroke();
    // small oculus on each spoke
    const ox = cx + Math.cos(mid) * S * 0.29, oy = cy + Math.sin(mid) * S * 0.29;
    ctx.beginPath(); ctx.arc(ox, oy, S * 0.052, 0, Math.PI * 2);
    ctx.fillStyle = glassCols[(i * 5 + 2) % glassCols.length];
    ctx.fill();
    ctx.strokeStyle = '#0d0a08'; ctx.lineWidth = 5; ctx.stroke();
  }
  // rings
  for (const [r, w] of [[S * 0.44, 12], [S * 0.21, 9], [S * 0.075, 7]]) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#0d0a08'; ctx.lineWidth = w; ctx.stroke();
  }
  // glowing centre
  const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, S * 0.075);
  cg.addColorStop(0, '#fff6cf'); cg.addColorStop(1, '#c98a2a');
  ctx.beginPath(); ctx.arc(cx, cy, S * 0.065, 0, Math.PI * 2);
  ctx.fillStyle = cg; ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeFloorMosaic(repeat = 6, repeatY = 6) {
  const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d');
  ctx.fillStyle = '#a3947a'; ctx.fillRect(0, 0, S, S);
  const cols = ['#b86a3a', '#d9c49a', '#3f5c6e', '#7a8a5f', '#8a4a3a', '#cbb37e'];
  // large central rosette per tile
  const cx = S / 2, cy = S / 2;
  for (let ring = 5; ring >= 1; ring--) {
    ctx.beginPath(); ctx.arc(cx, cy, ring * 44, 0, Math.PI * 2);
    ctx.fillStyle = cols[ring % cols.length];
    ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.beginPath(); ctx.ellipse(0, -110, 26, 62, 0, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#cbb37e' : '#8a4a3a';
    ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();
  }
  // speckle
  for (let i = 0; i < 3000; i++) {
    const g = 120 + Math.random() * 110 | 0;
    ctx.fillStyle = `rgba(${g},${g - 10},${g - 35},0.5)`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  return toTexture(c, repeat, repeatY);
}

export function makeGrassTexture(repeat = 34, repeatY = 34) {
  const S = 256, c = makeCanvas(S, S), ctx = c.getContext('2d');
  ctx.fillStyle = '#47603a'; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 5200; i++) {
    const g = 60 + Math.random() * 90 | 0;
    ctx.fillStyle = `rgba(${g * 0.75 | 0},${g},${g * 0.55 | 0},0.55)`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 1.6, rand(2, 5));
  }
  return toTexture(c, repeat, repeatY);
}

export function makeWaterFallTexture() {
  const c = makeCanvas(64, 256), ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 256);
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * 64, w = rand(1.5, 4.5), a = rand(0.15, 0.5);
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, `rgba(220,240,245,0)`);
    grad.addColorStop(0.25, `rgba(220,240,245,${a})`);
    grad.addColorStop(1, `rgba(220,240,245,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeBirdSprite() {
  const c = makeCanvas(128, 64), ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 64);
  ctx.strokeStyle = '#1c1a16';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 40);
  ctx.quadraticCurveTo(38, 8, 64, 34);
  ctx.quadraticCurveTo(90, 8, 120, 40);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeGlowTexture() {
  const S = 128, c = makeCanvas(S, S), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makePlaqueTexture(title, subtitle) {
  const c = makeCanvas(1024, 300), ctx = c.getContext('2d');
  ctx.fillStyle = '#c9bda0'; ctx.fillRect(0, 0, 1024, 300);
  for (let i = 0; i < 1500; i++) {
    const g = 150 + Math.random() * 70 | 0;
    ctx.fillStyle = `rgba(${g},${g - 10},${g - 40},0.4)`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 300, 2.4, 2.4);
  }
  ctx.strokeStyle = '#6e6248'; ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, 1024 - 36, 300 - 36);
  ctx.fillStyle = '#3c3423';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 108px Georgia, "Times New Roman", serif';
  // engraved look: light offset then dark main
  ctx.fillStyle = 'rgba(255,248,225,0.55)';
  ctx.fillText(title, 512, 128 + 4);
  ctx.fillStyle = '#332c1d';
  ctx.fillText(title, 512, 128);
  if (subtitle) {
    ctx.font = '400 40px Georgia, serif';
    ctx.fillStyle = 'rgba(255,248,225,0.5)';
    ctx.fillText(subtitle, 512, 228 + 2);
    ctx.fillStyle = '#4a4130';
    ctx.fillText(subtitle, 512, 228);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeFlameSprite() {
  const c = makeCanvas(64, 64), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 40, 2, 32, 36, 26);
  g.addColorStop(0, 'rgba(255,246,200,1)');
  g.addColorStop(0.35, 'rgba(255,196,90,0.9)');
  g.addColorStop(0.75, 'rgba(210,110,40,0.35)');
  g.addColorStop(1, 'rgba(210,110,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(32, 36, 18, 26, 0, 0, Math.PI * 2); ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
