import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator
 * Generates high-fidelity photographic textures at runtime using HTML5 Canvas.
 * Cached as singletons to ensure zero redundant GPU memory allocation.
 */

let cachedFlakeNormal: THREE.CanvasTexture | null = null;
let cachedCarbonTexture: THREE.CanvasTexture | null = null;
let cachedCarbonNormal: THREE.CanvasTexture | null = null;
let cachedTireTexture: THREE.CanvasTexture | null = null;
let cachedTireBump: THREE.CanvasTexture | null = null;
let cachedRotorTexture: THREE.CanvasTexture | null = null;
let cachedContactShadowTexture: THREE.CanvasTexture | null = null;
let cachedGrilleMeshTexture: THREE.CanvasTexture | null = null;
let cachedDashboardScreenTexture: THREE.CanvasTexture | null = null;

/**
 * High-Frequency Metallic Paint Flake Normal Map
 * Simulates micro-crystallites in automotive metallic clearcoat.
 */
export function getCarPaintFlakeNormalMap(): THREE.CanvasTexture {
  if (cachedFlakeNormal) return cachedFlakeNormal;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // High-frequency subtle perturbation around neutral normal (128, 128, 255)
      const nx = 128 + (Math.random() - 0.5) * 42;
      const ny = 128 + (Math.random() - 0.5) * 42;
      const nz = 255;

      data[idx] = Math.max(0, Math.min(255, nx));
      data[idx + 1] = Math.max(0, Math.min(255, ny));
      data[idx + 2] = nz;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  cachedFlakeNormal = texture;
  return texture;
}

/**
 * 2x2 Twill Carbon Fiber Weave Texture
 * Provides realistic woven carbon fiber pattern for splitters, diffusers, hoods, and spoilers.
 */
export function getCarbonFiberTextures(): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } {
  if (cachedCarbonTexture && cachedCarbonNormal) {
    return { map: cachedCarbonTexture, normalMap: cachedCarbonNormal };
  }

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nctx = normalCanvas.getContext('2d')!;

  // 2x2 twill weave pattern
  ctx.fillStyle = '#111215';
  ctx.fillRect(0, 0, size, size);

  nctx.fillStyle = '#8080ff';
  nctx.fillRect(0, 0, size, size);

  const step = 8;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const isAlt = ((x / step) + (y / step)) % 2 === 0;

      // Diffuse gradient
      const grad = ctx.createLinearGradient(x, y, x + (isAlt ? step : 0), y + (isAlt ? 0 : step));
      grad.addColorStop(0, isAlt ? '#22252a' : '#141619');
      grad.addColorStop(0.5, isAlt ? '#3a3f47' : '#282c33');
      grad.addColorStop(1, isAlt ? '#181a1e' : '#0e1013');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 0.5, y + 0.5, step - 1, step - 1);

      // Normal map weave slant
      const ngrad = nctx.createLinearGradient(x, y, x + step, y + step);
      if (isAlt) {
        ngrad.addColorStop(0, '#9a70ff');
        ngrad.addColorStop(1, '#6690ff');
      } else {
        ngrad.addColorStop(0, '#709aff');
        ngrad.addColorStop(1, '#9066ff');
      }
      nctx.fillStyle = ngrad;
      nctx.fillRect(x, y, step, step);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  cachedCarbonTexture = texture;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(16, 16);
  cachedCarbonNormal = normalMap;

  return { map: texture, normalMap };
}

/**
 * Performance Tire Tread & Sidewall Bump Map
 * Features directional grooves, water evacuation sipes, and shoulder blocks.
 */
export function getTireTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  if (cachedTireTexture && cachedTireBump) {
    return { map: cachedTireTexture, bumpMap: cachedTireBump };
  }

  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bctx = bumpCanvas.getContext('2d')!;

  // Deep matte black base
  ctx.fillStyle = '#18191c';
  ctx.fillRect(0, 0, width, height);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, width, height);

  // Center circumferential grooves (deep black & indented in bump)
  const grooveWidth = 14;
  const grooveXPositions = [width * 0.28, width * 0.5, width * 0.72];

  grooveXPositions.forEach(gx => {
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(gx - grooveWidth / 2, 0, grooveWidth, height);

    bctx.fillStyle = '#202020';
    bctx.fillRect(gx - grooveWidth / 2, 0, grooveWidth, height);
  });

  // Diagonal lateral water sipes / tread blocks
  const sipeStep = 24;
  for (let y = 0; y < height; y += sipeStep) {
    // Left shoulder channels
    ctx.strokeStyle = '#0e0f12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width * 0.26, y + 12);
    ctx.stroke();

    bctx.strokeStyle = '#303030';
    bctx.lineWidth = 4;
    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.lineTo(width * 0.26, y + 12);
    bctx.stroke();

    // Right shoulder channels
    ctx.beginPath();
    ctx.moveTo(width, y);
    ctx.lineTo(width * 0.74, y + 12);
    ctx.stroke();

    bctx.beginPath();
    bctx.moveTo(width, y);
    bctx.lineTo(width * 0.74, y + 12);
    bctx.stroke();

    // Tread block highlight
    bctx.fillStyle = '#b0b0b0';
    bctx.fillRect(width * 0.32, y + 4, width * 0.14, sipeStep - 8);
    bctx.fillRect(width * 0.54, y + 4, width * 0.14, sipeStep - 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  cachedTireTexture = texture;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(1, 4);
  cachedTireBump = bump;

  return { map: texture, bumpMap: bump };
}

/**
 * Cross-Drilled & Slotted Brake Rotor Face
 * Brushed radial finish with cooling holes and curved directional slots.
 */
export function getBrakeRotorTexture(): THREE.CanvasTexture {
  if (cachedRotorTexture) return cachedRotorTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;

  // Brushed steel radial gradient
  const grad = ctx.createRadialGradient(center, center, 20, center, center, center);
  grad.addColorStop(0, '#71717a');
  grad.addColorStop(0.35, '#a1a1aa');
  grad.addColorStop(0.5, '#d4d4d8');
  grad.addColorStop(0.85, '#e4e4e7');
  grad.addColorStop(1.0, '#71717a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Concentric friction ring tracks
  ctx.strokeStyle = 'rgba(60, 60, 65, 0.25)';
  for (let r = 40; r < center - 4; r += 3) {
    ctx.lineWidth = 1 + (Math.random() > 0.5 ? 1 : 0);
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross-drilled cooling holes
  ctx.fillStyle = '#18181b';
  const rings = [52, 70, 88, 106];
  const holeCountPerRing = 16;
  rings.forEach((radius, rIdx) => {
    const angleOffset = (rIdx % 2) * (Math.PI / holeCountPerRing);
    for (let i = 0; i < holeCountPerRing; i++) {
      const angle = (i / holeCountPerRing) * Math.PI * 2 + angleOffset;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Directional cooling slots
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2.5;
  for (let s = 0; s < 8; s++) {
    const baseAngle = (s / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(center, center, 80, baseAngle, baseAngle + 0.22);
    ctx.stroke();
  }

  // Dark central hub mount
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.arc(center, center, 32, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  cachedRotorTexture = texture;
  return texture;
}

/**
 * Soft Ambient Occlusion Ground Contact Shadow
 * Renders an oval shadow beneath the vehicle with realistic ground contact softness.
 */
export function getContactShadowTexture(): THREE.CanvasTexture {
  if (cachedContactShadowTexture) return cachedContactShadowTexture;

  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const cx = width / 2;
  const cy = height / 2;

  // Multi-tier Gaussian soft radial gradient
  const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, width * 0.48);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
  grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.save();
  ctx.scale(1.0, 2.1);
  ctx.beginPath();
  ctx.arc(cx, cy / 2.1, width * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  cachedContactShadowTexture = texture;
  return texture;
}

/**
 * Radiator & Air Intake Hexagonal Mesh Texture
 */
export function getGrilleMeshTexture(): THREE.CanvasTexture {
  if (cachedGrilleMeshTexture) return cachedGrilleMeshTexture;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.5;

  const hexR = 8;
  const hexW = Math.sqrt(3) * hexR;
  const hexH = 2 * hexR;

  for (let y = -hexH; y < size + hexH; y += hexH * 0.75) {
    const row = Math.round(y / (hexH * 0.75));
    const xOffset = (row % 2) * (hexW / 2);
    for (let x = -hexW; x < size + hexW; x += hexW) {
      drawHex(ctx, x + xOffset, y, hexR);
    }
  }

  function drawHex(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = cx + r * Math.sin(a);
      const hy = cy + r * Math.cos(a);
      if (i === 0) c.moveTo(hx, hy);
      else c.lineTo(hx, hy);
    }
    c.closePath();
    c.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  cachedGrilleMeshTexture = texture;
  return texture;
}

/**
 * Glowing Digital Dashboard Screen HUD Texture (Cockpit Interior)
 */
export function getDashboardScreenTexture(): THREE.CanvasTexture {
  if (cachedDashboardScreenTexture) return cachedDashboardScreenTexture;

  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);

  // Cyan & Amber UI lines
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // Tachometer arc bar
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.75, 45, Math.PI, Math.PI * 2);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Speedometer text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('0', width / 2, height * 0.72);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.fillText('KM/H', width / 2, height * 0.86);

  // Gear indicator
  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('N', width * 0.25, height * 0.55);

  const texture = new THREE.CanvasTexture(canvas);
  cachedDashboardScreenTexture = texture;
  return texture;
}

let cachedNavScreenTexture: THREE.CanvasTexture | null = null;
let cachedLicensePlateTexture: THREE.CanvasTexture | null = null;
let cachedTireSidewallTexture: THREE.CanvasTexture | null = null;
let cachedEngineV10Texture: THREE.CanvasTexture | null = null;

/**
 * Center Console Infotainment & GPS Navigation Map Screen Texture
 */
export function getCenterConsoleNavTexture(): THREE.CanvasTexture {
  if (cachedNavScreenTexture) return cachedNavScreenTexture;

  const w = 256;
  const h = 180;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Dark modern dark-mode UI theme
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Map background with simulated vector roads
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(8, 8, w - 16, h - 36);

  // Roads
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(20, 140);
  ctx.bezierCurveTo(70, 110, 100, 50, 200, 30);
  ctx.stroke();

  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(140, 150);
  ctx.lineTo(140, 20);
  ctx.stroke();

  // Navigation Route (Glowing Blue & Cyan)
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(35, 130);
  ctx.bezierCurveTo(75, 105, 110, 60, 140, 60);
  ctx.lineTo(210, 60);
  ctx.stroke();

  // Car GPS Position Arrow
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(90, 85);
  ctx.lineTo(82, 100);
  ctx.lineTo(90, 95);
  ctx.lineTo(98, 100);
  ctx.closePath();
  ctx.fill();

  // Route target icon
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(200, 60, 5, 0, Math.PI * 2);
  ctx.fill();

  // Infotainment bottom bar (Climate / Media)
  ctx.fillStyle = '#020617';
  ctx.fillRect(8, h - 28, w - 16, 20);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('21.5°C AUTO', 16, h - 14);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('APEX HORIZON OS', w - 16, h - 14);

  const texture = new THREE.CanvasTexture(canvas);
  cachedNavScreenTexture = texture;
  return texture;
}

/**
 * High-Resolution Embossed Automotive License Plate Texture
 */
export function getLicensePlateTexture(plateText: string = 'APEX GT'): THREE.CanvasTexture {
  if (cachedLicensePlateTexture) return cachedLicensePlateTexture;

  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Plate background with stamped border
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Embossed outer rim
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  // Region top banner
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(9, 9, w - 18, 24);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HORIZON CITY', w / 2, 26);

  // Main embossed vehicle registration number
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 44px monospace';
  ctx.fillText(plateText, w / 2, 82);

  // Bottom slogan
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('THE APEX OF MOTORSPORT', w / 2, 110);

  // Screws/bolts in corners
  const screws = [
    { x: 24, y: 38 },
    { x: w - 24, y: 38 },
    { x: 24, y: 94 },
    { x: w - 24, y: 94 },
  ];
  screws.forEach(s => {
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(s.x - 3, s.y - 1, 6, 2);
  });

  const texture = new THREE.CanvasTexture(canvas);
  cachedLicensePlateTexture = texture;
  return texture;
}

/**
 * High-Detail Racing Tire Sidewall Texture with embossed lettering
 */
export function getTireSidewallTexture(): THREE.CanvasTexture {
  if (cachedTireSidewallTexture) return cachedTireSidewallTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Dark rubber base
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, size, size);

  // Concentric bead rings
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  [120, 150, 190, 220, 240].forEach(r => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Racing tire compound color stripe (Yellow / Red competition marker)
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 205, 0, Math.PI * 2);
  ctx.stroke();

  // High-performance embossed sidewall branding
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';

  // Circular text drawing helper
  const drawCircularText = (text: string, radius: number, startAngle: number, letterSpacing: number) => {
    let currentAngle = startAngle;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(currentAngle);
      ctx.translate(0, -radius);
      ctx.fillText(char, 0, 0);
      ctx.restore();
      currentAngle += letterSpacing;
    }
  };

  drawCircularText('★ APEX CORSA COMPETIZIONE ★', 170, -Math.PI * 0.45, 0.08);
  drawCircularText('285 / 35 ZR20 • ULTRA HIGH PERFORMANCE', 170, Math.PI * 0.55, 0.065);

  const texture = new THREE.CanvasTexture(canvas);
  cachedTireSidewallTexture = texture;
  return texture;
}

/**
 * Mid-Engine V10 / V8 Engine Bay Plenums & Cylinder Heads Texture
 */
export function getEngineV10Texture(): THREE.CanvasTexture {
  if (cachedEngineV10Texture) return cachedEngineV10Texture;

  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  // Carbon engine cover shroud
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(20, 20, w - 40, h - 40);

  // Twin Red Wrinkle-Finish Cam Covers
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(35, 40, 55, 175);
  ctx.fillRect(w - 90, 40, 55, 175);

  // Polished Aluminum Intake Runners (5 on left, 5 on right for V10)
  for (let i = 0; i < 5; i++) {
    const y = 55 + i * 32;

    // Left runner
    const gradL = ctx.createLinearGradient(90, y, 125, y);
    gradL.addColorStop(0, '#64748b');
    gradL.addColorStop(0.5, '#f8fafc');
    gradL.addColorStop(1, '#475569');
    ctx.fillStyle = gradL;
    ctx.fillRect(90, y, 35, 16);

    // Right runner
    const gradR = ctx.createLinearGradient(w - 125, y, w - 90, y);
    gradR.addColorStop(0, '#475569');
    gradR.addColorStop(0.5, '#f8fafc');
    gradR.addColorStop(1, '#64748b');
    ctx.fillStyle = gradR;
    ctx.fillRect(w - 125, y, 35, 16);
  }

  // Central carbon intake plenum badge
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(115, 30, 26, 195);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px sans-serif';
  ctx.save();
  ctx.translate(132, 130);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('V10 5.2L DOHC', 0, 4);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  cachedEngineV10Texture = texture;
  return texture;
}

let cachedAsphaltMap: THREE.CanvasTexture | null = null;
let cachedAsphaltBump: THREE.CanvasTexture | null = null;
let cachedAsphaltRoughness: THREE.CanvasTexture | null = null;

/**
 * Photorealistic High-Definition Asphalt PBR Textures
 * Simulates graded mineral aggregate (crushed basalt, granite, quartz), bitumen binder,
 * subtle micro-cracks, oil runoff, and polished rubber wheel wear lanes.
 */
export function getAsphaltPBRTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  if (cachedAsphaltMap && cachedAsphaltBump && cachedAsphaltRoughness) {
    return { map: cachedAsphaltMap, bumpMap: cachedAsphaltBump, roughnessMap: cachedAsphaltRoughness };
  }

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  // 1. Dark weathered bitumen base
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  rctx.fillStyle = '#b8b8b8'; // Default medium-high roughness
  rctx.fillRect(0, 0, size, size);

  // 2. Graded mineral aggregates (15,000 fine stone particles)
  const colors = ['#2b3038', '#14161a', '#3f4652', '#4b5563', '#23272e', '#52525b', '#e2e8f0'];
  for (let i = 0; i < 16000; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const s = 1 + Math.random() * 2.5;
    const colIdx = Math.floor(Math.random() * colors.length);
    ctx.fillStyle = colors[colIdx];
    ctx.fillRect(px, py, s, s);

    // Bump relief
    const bVal = Math.floor(90 + Math.random() * 110);
    bctx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    bctx.fillRect(px, py, s, s);
  }

  // 3. Polished wheel-track wear lanes (smoother, darker bitumen where tires roll)
  // Left lane track & Right lane track
  const wheelTracks = [size * 0.26, size * 0.74];
  wheelTracks.forEach(trackX => {
    // Dark tire rubber deposit
    const tireGrad = ctx.createLinearGradient(trackX - 90, 0, trackX + 90, 0);
    tireGrad.addColorStop(0.0, 'rgba(15, 17, 20, 0.0)');
    tireGrad.addColorStop(0.3, 'rgba(12, 14, 16, 0.38)');
    tireGrad.addColorStop(0.5, 'rgba(10, 11, 13, 0.45)');
    tireGrad.addColorStop(0.7, 'rgba(12, 14, 16, 0.38)');
    tireGrad.addColorStop(1.0, 'rgba(15, 17, 20, 0.0)');
    ctx.fillStyle = tireGrad;
    ctx.fillRect(trackX - 90, 0, 180, size);

    // Polished lower roughness in wheel tracks (giving realistic specular sheen from streetlights & sun)
    const roughGrad = rctx.createLinearGradient(trackX - 90, 0, trackX + 90, 0);
    roughGrad.addColorStop(0.0, 'rgba(184, 184, 184, 1.0)');
    roughGrad.addColorStop(0.5, 'rgba(110, 110, 110, 1.0)'); // smoother, more reflective
    roughGrad.addColorStop(1.0, 'rgba(184, 184, 184, 1.0)');
    rctx.fillStyle = roughGrad;
    rctx.fillRect(trackX - 90, 0, 180, size);
  });

  // 4. Center oil drip line and subtle asphalt micro-cracks
  const centerGrad = ctx.createLinearGradient(size * 0.45, 0, size * 0.55, 0);
  centerGrad.addColorStop(0.0, 'rgba(15, 17, 20, 0.0)');
  centerGrad.addColorStop(0.5, 'rgba(10, 11, 12, 0.28)');
  centerGrad.addColorStop(1.0, 'rgba(15, 17, 20, 0.0)');
  ctx.fillStyle = centerGrad;
  ctx.fillRect(size * 0.45, 0, size * 0.1, size);

  // Subtle tar seal crack lines
  ctx.strokeStyle = '#121418';
  ctx.lineWidth = 1.8;
  for (let c = 0; c < 6; c++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80);
    ctx.lineTo(sx + (Math.random() - 0.5) * 140, sy + (Math.random() - 0.5) * 140);
    ctx.stroke();
  }

  const mapTex = new THREE.CanvasTexture(canvas);
  mapTex.wrapS = THREE.RepeatWrapping;
  mapTex.wrapT = THREE.RepeatWrapping;
  mapTex.colorSpace = THREE.SRGBColorSpace;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;

  const roughTex = new THREE.CanvasTexture(roughCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;

  cachedAsphaltMap = mapTex;
  cachedAsphaltBump = bumpTex;
  cachedAsphaltRoughness = roughTex;

  return { map: mapTex, bumpMap: bumpTex, roughnessMap: roughTex };
}

let cachedConcreteTexture: THREE.CanvasTexture | null = null;
let cachedConcreteBump: THREE.CanvasTexture | null = null;

/**
 * Poured Concrete Sidewalk PBR Texture
 * Simulates brushed concrete slabs, expansion joints, and subtle sidewalk aging.
 */
export function getConcreteSidewalkTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  if (cachedConcreteTexture && cachedConcreteBump) {
    return { map: cachedConcreteTexture, bumpMap: cachedConcreteBump };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bctx = bCanvas.getContext('2d')!;

  // Light concrete base
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // Brushed concrete noise
  for (let i = 0; i < 7000; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const val = 140 + Math.random() * 30;
    ctx.fillStyle = `rgb(${val}, ${val + 2}, ${val + 5})`;
    ctx.fillRect(px, py, 2, 1);
  }

  // Expansion joint seams (dividing concrete slabs every 128px)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  bctx.strokeStyle = '#303030';
  bctx.lineWidth = 4;

  for (let x = 0; x <= size; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();

    bctx.beginPath();
    bctx.moveTo(x, 0);
    bctx.lineTo(x, size);
    bctx.stroke();
  }

  for (let y = 0; y <= size; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.lineTo(size, y);
    bctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  cachedConcreteTexture = map;
  cachedConcreteBump = bumpMap;

  return { map, bumpMap };
}

let cachedFacadeTexture: THREE.CanvasTexture | null = null;

/**
 * Modern High-Rise Architectural Curtain Wall Facade Texture
 * Features glass window panes with illuminated offices, metallic mullions, and blinds.
 */
export function getModernBuildingFacadeTexture(): THREE.CanvasTexture {
  if (cachedFacadeTexture) return cachedFacadeTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Metal structural frame
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, size, size);

  const windowCols = 8;
  const windowRows = 16;
  const padX = 6;
  const padY = 5;
  const wWidth = (size / windowCols) - padX;
  const wHeight = (size / windowRows) - padY;

  for (let r = 0; r < windowRows; r++) {
    for (let c = 0; c < windowCols; c++) {
      const wx = c * (size / windowCols) + padX / 2;
      const wy = r * (size / windowRows) + padY / 2;

      // Realistic office interior lighting probability
      const isLit = Math.random() < 0.45;
      const isWarm = Math.random() < 0.65;

      if (isLit) {
        ctx.fillStyle = isWarm ? '#fef08a' : '#e0f2fe';
      } else {
        // Reflective dark tinted window glass
        ctx.fillStyle = '#0f172a';
      }

      ctx.fillRect(wx, wy, wWidth, wHeight);

      // Subtle horizontal window blind slats
      if (Math.random() < 0.4) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
        for (let b = 0; b < wHeight * 0.6; b += 4) {
          ctx.fillRect(wx, wy + b, wWidth, 2);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 12);
  cachedFacadeTexture = texture;
  return texture;
}

let cachedManholeTexture: THREE.CanvasTexture | null = null;
let cachedDrainGrateTexture: THREE.CanvasTexture | null = null;
let cachedHighwaySignTexture: THREE.CanvasTexture | null = null;
let cachedSpeedLimitTexture: THREE.CanvasTexture | null = null;
let cachedSunstripTexture: THREE.CanvasTexture | null = null;
let cachedRearDefrosterTexture: THREE.CanvasTexture | null = null;

/**
 * Cast Iron Roadway Manhole Cover Texture
 */
export function getManholeCoverTexture(): THREE.CanvasTexture {
  if (cachedManholeTexture) return cachedManholeTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark weathered cast iron circular base
  ctx.fillStyle = '#22262d';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  // Outer recessed ring
  ctx.fillStyle = '#1c1f24';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#383e47';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Diamond waffle grip pattern
  ctx.strokeStyle = '#2f343d';
  ctx.lineWidth = 3;
  for (let i = -r; i < r; i += 14) {
    ctx.beginPath();
    ctx.moveTo(cx + i, cy - r);
    ctx.lineTo(cx + i, cy + r);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - r, cy + i);
    ctx.lineTo(cx + r, cy + i);
    ctx.stroke();
  }

  // Inner center ring
  ctx.fillStyle = '#181b20';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Embossed utility lettering
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HORIZON CITY', cx, cy - 6);
  ctx.fillText('STORM SEWER', cx, cy + 12);

  // Pick holes / key slots
  [-45, 45].forEach(dx => {
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(cx + dx - 6, cy - 4, 12, 8);
  });

  const texture = new THREE.CanvasTexture(canvas);
  cachedManholeTexture = texture;
  return texture;
}

/**
 * Roadside Curbside Storm Drain Grate Texture
 */
export function getStormDrainGrateTexture(): THREE.CanvasTexture {
  if (cachedDrainGrateTexture) return cachedDrainGrateTexture;

  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Dark cast iron surround
  ctx.fillStyle = '#262930';
  ctx.fillRect(0, 0, w, h);

  // Outer frame
  ctx.strokeStyle = '#434854';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  // Deep drainage slots (black void with cast iron crossbars)
  const slotCount = 10;
  const slotW = 14;
  const slotSpacing = (w - 36) / slotCount;

  for (let i = 0; i < slotCount; i++) {
    const x = 20 + i * slotSpacing;
    ctx.fillStyle = '#090a0d';
    ctx.fillRect(x, 16, slotW, h - 32);

    // Lateral crossbar
    ctx.fillStyle = '#323640';
    ctx.fillRect(x, h / 2 - 3, slotW, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  cachedDrainGrateTexture = texture;
  return texture;
}

/**
 * Green Interstate Highway Overhead Gantry Destination Sign
 */
export function getHighwayGantrySignTexture(dest1 = 'HORIZON DOWNTOWN', dest2 = 'AIRPORT EXPRESSWAY'): THREE.CanvasTexture {
  if (cachedHighwaySignTexture) return cachedHighwaySignTexture;

  const w = 512;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // MUTCD Interstate Highway Green
  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, 0, w, h);

  // White reflective double border
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Interstate route badge / shield
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(40, 24);
  ctx.lineTo(80, 24);
  ctx.lineTo(90, 50);
  ctx.lineTo(60, 80);
  ctx.lineTo(30, 50);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('95', 60, 55);

  // Destinations & arrows
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(dest1, 106, 52);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(dest2, 106, 92);

  // Exit info & distance
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('EXIT 4A  •  1/2 MILE', 106, 134);

  // White lane guidance arrows
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('↑  ↗', w - 28, 92);

  const texture = new THREE.CanvasTexture(canvas);
  cachedHighwaySignTexture = texture;
  return texture;
}

/**
 * Standard Speed Limit Sign (55 MPH / 80 KM/H)
 */
export function getSpeedLimitSignTexture(speed = '55'): THREE.CanvasTexture {
  if (cachedSpeedLimitTexture) return cachedSpeedLimitTexture;

  const w = 128;
  const h = 180;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // White reflective aluminum background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Black border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('SPEED', w / 2, 34);
  ctx.fillText('LIMIT', w / 2, 54);

  ctx.font = 'bold 64px monospace';
  ctx.fillText(speed, w / 2, 126);

  const texture = new THREE.CanvasTexture(canvas);
  cachedSpeedLimitTexture = texture;
  return texture;
}

/**
 * Upper Windshield Gradient Sun Visor Strip with Competition Banner
 */
export function getWindshieldSunstripTexture(): THREE.CanvasTexture {
  if (cachedSunstripTexture) return cachedSunstripTexture;

  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Darkened gradient banner
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.98)');
  grad.addColorStop(0.75, 'rgba(15, 23, 42, 0.85)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Crisp white motorsport sun-strip banner
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ APEX MOTORSPORT COMPETIZIONE ★', w / 2, 42);

  // Red & cyan accent racing stripe
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(40, 56, w / 2 - 40, 4);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(w / 2, 56, w / 2 - 40, 4);

  // Technical inspection track pass badge in top corner
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(w - 75, 12, 55, 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('TECH PASS', w - 48, 25);
  ctx.fillText('2026 GT', w - 48, 38);

  const texture = new THREE.CanvasTexture(canvas);
  cachedSunstripTexture = texture;
  return texture;
}

/**
 * Rear Windshield Copper Heating Defroster Grid Texture
 */
export function getRearDefrosterTexture(): THREE.CanvasTexture {
  if (cachedRearDefrosterTexture) return cachedRearDefrosterTexture;

  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Copper wire bus bars on left and right edges
  ctx.fillStyle = 'rgba(217, 119, 6, 0.85)';
  ctx.fillRect(16, 25, 6, h - 50);
  ctx.fillRect(w - 22, 25, 6, h - 50);

  // 12 horizontal defroster heating filament lines
  const wireCount = 12;
  const step = (h - 60) / wireCount;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
  for (let i = 0; i < wireCount; i++) {
    const y = 32 + i * step;
    ctx.fillRect(18, y, w - 36, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  cachedRearDefrosterTexture = texture;
  return texture;
}

let cachedRacingLineTexture: THREE.CanvasTexture | null = null;

/**
 * Dynamic Racing & Navigation Guide Line Texture
 * Features forward-pointing illuminated directional chevrons with neon edges
 * for high-speed tracking and cornering path visualization.
 */
export function getRacingLineTexture(): THREE.CanvasTexture {
  if (cachedRacingLineTexture) return cachedRacingLineTexture;

  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Soft glowing outer boundary rails
  const gradL = ctx.createLinearGradient(0, 0, 16, 0);
  gradL.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
  gradL.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = gradL;
  ctx.fillRect(0, 0, 16, h);

  const gradR = ctx.createLinearGradient(w, 0, w - 16, 0);
  gradR.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
  gradR.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = gradR;
  ctx.fillRect(w - 16, 0, 16, h);

  // Subtle central highway track line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(w / 2 - 2, 0, 4, h);

  // 3 forward-pointing neon chevrons per tile unit
  const chevronCount = 3;
  const step = h / chevronCount;

  for (let c = 0; c < chevronCount; c++) {
    const centerY = c * step + step * 0.5;

    // Glowing chevron shadow/halo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(22, centerY + 24);
    ctx.lineTo(w / 2, centerY - 18);
    ctx.lineTo(w - 22, centerY + 24);
    ctx.stroke();

    // Sharp bright core
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(22, centerY + 24);
    ctx.lineTo(w / 2, centerY - 18);
    ctx.lineTo(w - 22, centerY + 24);
    ctx.stroke();

    // Hot center arrow tip
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.beginPath();
    ctx.arc(w / 2, centerY - 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  cachedRacingLineTexture = texture;
  return texture;
}

let cachedOpponentLineTexture: THREE.CanvasTexture | null = null;

/**
 * High-Adrenaline Opponent Chaser & Slipstream Follow Line Texture
 * Features high-intensity neon purple/magenta dual chevrons with laser guide tracks
 * for persistent opponent pursuit across the city at all times.
 */
export function getOpponentLineTexture(): THREE.CanvasTexture {
  if (cachedOpponentLineTexture) return cachedOpponentLineTexture;

  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Outer neon purple/violet energy borders
  const gradL = ctx.createLinearGradient(0, 0, 20, 0);
  gradL.addColorStop(0, 'rgba(216, 70, 255, 0.9)');
  gradL.addColorStop(0.5, 'rgba(168, 85, 247, 0.5)');
  gradL.addColorStop(1, 'rgba(147, 51, 234, 0.0)');
  ctx.fillStyle = gradL;
  ctx.fillRect(0, 0, 20, h);

  const gradR = ctx.createLinearGradient(w, 0, w - 20, 0);
  gradR.addColorStop(0, 'rgba(216, 70, 255, 0.9)');
  gradR.addColorStop(0.5, 'rgba(168, 85, 247, 0.5)');
  gradR.addColorStop(1, 'rgba(147, 51, 234, 0.0)');
  ctx.fillStyle = gradR;
  ctx.fillRect(w - 20, 0, 20, h);

  // Center dashed laser tracker line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3 high-intensity pursuit double-chevrons per tile unit
  const chevronCount = 3;
  const step = h / chevronCount;

  for (let c = 0; c < chevronCount; c++) {
    const centerY = c * step + step * 0.5;

    // Outer magenta flare
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.6)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(18, centerY + 22);
    ctx.lineTo(w / 2, centerY - 16);
    ctx.lineTo(w - 18, centerY + 22);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(18, centerY + 22);
    ctx.lineTo(w / 2, centerY - 16);
    ctx.lineTo(w - 18, centerY + 22);
    ctx.stroke();

    // Secondary trailing chevron for slipstream drafting feel
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(26, centerY + 34);
    ctx.lineTo(w / 2, centerY + 2);
    ctx.lineTo(w - 26, centerY + 34);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  cachedOpponentLineTexture = texture;
  return texture;
}

