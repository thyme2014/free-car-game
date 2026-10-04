import * as THREE from 'three';
import { TimeOfDay, VisualTheme } from './types';

/**
 * Procedural Sky & Environment Map Generator
 * Generates high-dynamic equirectangular panoramic sky textures for Day, Sunset, Night, and Dawn
 * blended with Visual Themes (Photoreal, Cyberpunk, Tokyo Drift, Desert Run, Synthwave).
 * Uses Three.js PMREMGenerator to produce specular reflections on car metallic paint, chrome, glass, and wet asphalt.
 */
export class EnvironmentManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private pmremGenerator: THREE.PMREMGenerator;
  private currentEnvTexture: THREE.Texture | null = null;
  private currentSkyTexture: THREE.Texture | null = null;
  private currentTime: TimeOfDay = 'day';
  private currentTheme: VisualTheme = 'photoreal';

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
  }

  public setEnvironment(time: TimeOfDay, theme: VisualTheme = this.currentTheme) {
    this.currentTime = time;
    this.currentTheme = theme;

    if (this.currentEnvTexture) {
      this.currentEnvTexture.dispose();
    }
    if (this.currentSkyTexture) {
      this.currentSkyTexture.dispose();
    }

    const canvas = this.createSkyPanorama(time, theme);
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.mapping = THREE.EquirectangularReflectionMapping;
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    const envRenderTarget = this.pmremGenerator.fromEquirectangular(canvasTexture);
    this.currentEnvTexture = envRenderTarget.texture;
    this.currentSkyTexture = canvasTexture;

    // Apply environment to entire scene for metallic, glass, and specular reflections
    this.scene.environment = this.currentEnvTexture;
    this.scene.background = canvasTexture;
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.setEnvironment(time, this.currentTheme);
  }

  public setTheme(theme: VisualTheme) {
    this.setEnvironment(this.currentTime, theme);
  }

  private createSkyPanorama(time: TimeOfDay, theme: VisualTheme): HTMLCanvasElement {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const horizonY = height * 0.52;

    if (theme === 'cyberpunk') {
      this.renderCyberpunkSky(ctx, width, height, horizonY, time);
    } else if (theme === 'tokyo_drift') {
      this.renderTokyoSky(ctx, width, height, horizonY, time);
    } else if (theme === 'desert_run') {
      this.renderDesertSky(ctx, width, height, horizonY, time);
    } else if (theme === 'synthwave') {
      this.renderSynthwaveSky(ctx, width, height, horizonY, time);
    } else {
      this.renderPhotorealSky(ctx, width, height, horizonY, time);
    }

    return canvas;
  }

  private renderPhotorealSky(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number, time: TimeOfDay) {
    switch (time) {
      case 'day': {
        // High-dynamic physical Rayleigh scattering gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0.0, '#1045a1'); // Deep zenith blue
        skyGrad.addColorStop(0.35, '#2563eb');
        skyGrad.addColorStop(0.65, '#60a5fa');
        skyGrad.addColorStop(0.88, '#bae6fd');
        skyGrad.addColorStop(1.0, '#f0f9ff'); // Horizon warm haze
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Photorealistic Solar Disk with Multi-Ring Corona & Atmospheric Flare
        const sunX = width * 0.46;
        const sunY = height * 0.22;

        // Outer ambient solar glow
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 320);
        sunGlow.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
        sunGlow.addColorStop(0.12, 'rgba(254, 240, 138, 0.7)');
        sunGlow.addColorStop(0.35, 'rgba(253, 224, 71, 0.22)');
        sunGlow.addColorStop(0.7, 'rgba(186, 230, 253, 0.08)');
        sunGlow.addColorStop(1.0, 'rgba(186, 230, 253, 0.0)');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, width, horizonY);

        // Pure white sun core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
        ctx.fill();

        // High-altitude wispy cirrus clouds
        this.drawCirrusClouds(ctx, width, height * 0.15, 'rgba(255, 255, 255, 0.35)');

        // Volumetric mid-altitude cumulus clouds with 3D sunlit highlights & shaded bellies
        this.drawVolumetricClouds(ctx, width, height * 0.32, '#e2e8f0', '#ffffff', 0.85);
        this.drawVolumetricClouds(ctx, width, height * 0.42, '#cbd5e1', '#f8fafc', 0.65);

        // Distant Mountain Ridge silhouette with aerial perspective
        this.drawMountainRidges(ctx, width, horizonY, '#475569', '#64748b');

        // Ground gradient
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        groundGrad.addColorStop(0.0, '#334155');
        groundGrad.addColorStop(0.18, '#1e293b');
        groundGrad.addColorStop(1.0, '#0f172a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        this.drawSkyline(ctx, width, horizonY, '#1e293b', '#334155');
        break;
      }

      case 'sunset': {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0.0, '#1e052d');
        skyGrad.addColorStop(0.22, '#4a044e');
        skyGrad.addColorStop(0.48, '#831843');
        skyGrad.addColorStop(0.68, '#be123c');
        skyGrad.addColorStop(0.84, '#ea580c');
        skyGrad.addColorStop(0.94, '#f59e0b');
        skyGrad.addColorStop(1.0, '#fef08a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Low golden sun with dramatic fiery corona
        const sunX = width * 0.62;
        const sunY = horizonY - 32;

        const sunGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 360);
        sunGrad.addColorStop(0.0, 'rgba(255, 255, 245, 1.0)');
        sunGrad.addColorStop(0.15, 'rgba(254, 240, 138, 0.95)');
        sunGrad.addColorStop(0.35, 'rgba(251, 146, 60, 0.65)');
        sunGrad.addColorStop(0.65, 'rgba(225, 29, 72, 0.25)');
        sunGrad.addColorStop(1.0, 'rgba(131, 24, 67, 0.0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Pure intense solar core
        ctx.fillStyle = '#fffff0';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
        ctx.fill();

        this.drawVolumetricClouds(ctx, width, height * 0.28, '#831843', '#fb7185', 0.6);
        this.drawVolumetricClouds(ctx, width, height * 0.38, '#9f1239', '#fdba74', 0.7);

        this.drawMountainRidges(ctx, width, horizonY, '#3b0764', '#581c87');

        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        groundGrad.addColorStop(0.0, '#4c0519');
        groundGrad.addColorStop(0.3, '#240212');
        groundGrad.addColorStop(1.0, '#0d0107');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        this.drawSkyline(ctx, width, horizonY, '#1c0525', '#3b0d4a');
        break;
      }

      case 'night': {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0.0, '#010309');
        skyGrad.addColorStop(0.4, '#04091a');
        skyGrad.addColorStop(0.75, '#0a1128');
        skyGrad.addColorStop(0.92, '#0f172a');
        skyGrad.addColorStop(1.0, '#1e1b4b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Dense sharp starfield with magnitudes
        this.drawStars(ctx, width, horizonY, 320);

        // Realistic Moon with illuminated crater texture and soft lunar halo
        const moonX = width * 0.38;
        const moonY = height * 0.2;

        const moonHalo = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 180);
        moonHalo.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
        moonHalo.addColorStop(0.12, 'rgba(224, 242, 254, 0.8)');
        moonHalo.addColorStop(0.4, 'rgba(56, 189, 248, 0.18)');
        moonHalo.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)');
        ctx.fillStyle = moonHalo;
        ctx.fillRect(0, 0, width, horizonY);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
        ctx.fill();

        this.drawMountainRidges(ctx, width, horizonY, '#020617', '#080d1e');

        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        groundGrad.addColorStop(0.0, '#080d1e');
        groundGrad.addColorStop(0.25, '#030712');
        groundGrad.addColorStop(1.0, '#010206');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        this.drawNightSkyline(ctx, width, horizonY, false);
        break;
      }

      case 'dawn': {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0.0, '#1e1b4b');
        skyGrad.addColorStop(0.35, '#3b0764');
        skyGrad.addColorStop(0.6, '#701a75');
        skyGrad.addColorStop(0.78, '#c026d3');
        skyGrad.addColorStop(0.9, '#f472b6');
        skyGrad.addColorStop(0.97, '#fb923c');
        skyGrad.addColorStop(1.0, '#fef08a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        const sunX = width * 0.28;
        const sunY = horizonY - 14;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 240);
        sunGrad.addColorStop(0.0, 'rgba(255, 255, 245, 1.0)');
        sunGrad.addColorStop(0.2, 'rgba(254, 215, 170, 0.7)');
        sunGrad.addColorStop(0.5, 'rgba(244, 114, 182, 0.25)');
        sunGrad.addColorStop(1.0, 'rgba(192, 38, 211, 0.0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, width, horizonY);

        this.drawVolumetricClouds(ctx, width, height * 0.34, '#701a75', '#f472b6', 0.55);
        this.drawMountainRidges(ctx, width, horizonY, '#2e1065', '#4c1d95');

        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        groundGrad.addColorStop(0.0, '#2e1065');
        groundGrad.addColorStop(0.25, '#170638');
        groundGrad.addColorStop(1.0, '#090218');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        this.drawSkyline(ctx, width, horizonY, '#170638', '#3b0764');
        break;
      }
    }
  }

  private renderCyberpunkSky(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number, time: TimeOfDay) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0.0, '#050212');
    skyGrad.addColorStop(0.35, '#1e0836');
    skyGrad.addColorStop(0.7, '#581c87');
    skyGrad.addColorStop(0.92, '#a21caf');
    skyGrad.addColorStop(1.0, '#06b6d4');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    this.drawStars(ctx, width, horizonY, 120);

    // Glowing giant neon moon / cyber sun
    const moonX = width * 0.5;
    const moonY = height * 0.24;
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 160);
    moonGrad.addColorStop(0.0, '#f472b6');
    moonGrad.addColorStop(0.2, '#ec4899');
    moonGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.4)');
    moonGrad.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Wet reflective cyber ground
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGrad.addColorStop(0.0, '#1e0836');
    groundGrad.addColorStop(0.3, '#0e021a');
    groundGrad.addColorStop(1.0, '#04010a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Neon skyline with vivid cyan & magenta glowing billboards
    this.drawNightSkyline(ctx, width, horizonY, true);
  }

  private renderTokyoSky(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number, time: TimeOfDay) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0.0, '#020617');
    skyGrad.addColorStop(0.5, '#0f172a');
    skyGrad.addColorStop(0.85, '#1e293b');
    skyGrad.addColorStop(1.0, '#ea580c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    this.drawStars(ctx, width, horizonY, 90);

    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGrad.addColorStop(0.0, '#1e293b');
    groundGrad.addColorStop(0.3, '#0f172a');
    groundGrad.addColorStop(1.0, '#020617');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    this.drawSkyline(ctx, width, horizonY, '#0f172a', '#334155');
  }

  private renderDesertSky(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number, time: TimeOfDay) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0.0, '#0284c7');
    skyGrad.addColorStop(0.3, '#38bdf8');
    skyGrad.addColorStop(0.7, '#fdba74');
    skyGrad.addColorStop(0.9, '#fb923c');
    skyGrad.addColorStop(1.0, '#fed7aa');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Blazing desert sun
    const sunX = width * 0.55;
    const sunY = height * 0.18;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
    sunGrad.addColorStop(0.0, '#ffffff');
    sunGrad.addColorStop(0.2, '#fef08a');
    sunGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.4)');
    sunGrad.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Desert terracotta earth
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGrad.addColorStop(0.0, '#9a3412');
    groundGrad.addColorStop(0.3, '#7c2d12');
    groundGrad.addColorStop(1.0, '#431407');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    this.drawSkyline(ctx, width, horizonY, '#7c2d12', '#9a3412');
  }

  private renderSynthwaveSky(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number, time: TimeOfDay) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0.0, '#18022a');
    skyGrad.addColorStop(0.4, '#4c0519');
    skyGrad.addColorStop(0.7, '#831843');
    skyGrad.addColorStop(0.9, '#db2777');
    skyGrad.addColorStop(1.0, '#f43f5e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Striped 80s synthwave neon sun
    const sunX = width * 0.5;
    const sunY = horizonY - 30;
    const sunR = 90;
    const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sunGrad.addColorStop(0.0, '#fde047');
    sunGrad.addColorStop(0.5, '#f43f5e');
    sunGrad.addColorStop(1.0, '#db2777');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal retro sun scanline slits
    ctx.fillStyle = '#18022a';
    for (let i = 0; i < 8; i++) {
      const lineY = sunY + i * 11;
      const lineH = 2 + i * 0.8;
      ctx.fillRect(sunX - sunR, lineY, sunR * 2, lineH);
    }

    // Synthwave purple grid ground
    ctx.fillStyle = '#0f0119';
    ctx.fillRect(0, horizonY, width, height - horizonY);

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, height);
      ctx.lineTo(width * 0.5, horizonY);
      ctx.stroke();
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D, width: number, horizonY: number, count: number) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < count; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * (horizonY - 30);
      const r = Math.random() * 1.5 + 0.5;
      ctx.globalAlpha = 0.3 + Math.random() * 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private drawCirrusClouds(ctx: CanvasRenderingContext2D, width: number, y: number, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    for (let c = 0; c < 14; c++) {
      const cx = (c * (width / 14) + c * 30) % width;
      const cy = y + Math.sin(c * 1.8) * 25;
      const cLen = 140 + Math.cos(c) * 60;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + cLen * 0.3, cy - 14, cx + cLen * 0.7, cy + 18, cx + cLen, cy - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawVolumetricClouds(
    ctx: CanvasRenderingContext2D,
    width: number,
    y: number,
    baseColor: string,
    highlightColor: string,
    opacity: number
  ) {
    ctx.save();

    for (let c = 0; c < 14; c++) {
      const cx = (c * (width / 13) + Math.sin(c * 2.4) * 60) % width;
      const cy = y + Math.cos(c * 1.6) * 22;
      const r = 50 + Math.sin(c * 1.3) * 24;

      // 1. Shaded cloud base / underbelly
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = opacity * 0.85;
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.25, r * 0.95, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.8, cy + r * 0.2, r * 0.75, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.8, cy + r * 0.25, r * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // 2. Sunlit bright puffy crest
      ctx.fillStyle = highlightColor;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.1, r * 0.85, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.7, cy - r * 0.15, r * 0.65, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.3, cy, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawMountainRidges(
    ctx: CanvasRenderingContext2D,
    width: number,
    horizonY: number,
    farColor: string,
    nearColor: string
  ) {
    ctx.save();

    // Far mountain ridge
    ctx.fillStyle = farColor;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= width; x += 40) {
      const peakY = horizonY - 45 - Math.sin(x * 0.008) * 35 - Math.cos(x * 0.02) * 20;
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fill();

    // Near mountain ridge with aerial perspective
    ctx.fillStyle = nearColor;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= width; x += 30) {
      const peakY = horizonY - 25 - Math.sin(x * 0.012 + 1.2) * 25 - Math.cos(x * 0.03 + 0.5) * 15;
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawFluffyClouds(ctx: CanvasRenderingContext2D, width: number, y: number, color: string, opacity: number) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    for (let c = 0; c < 12; c++) {
      const cx = (c * (width / 11) + Math.sin(c * 2) * 40) % width;
      const cy = y + Math.cos(c * 1.5) * 18;
      const r = 35 + Math.sin(c) * 15;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.8, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.7, cy - r * 0.1, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.3, cy + r * 0.1, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawSkyline(ctx: CanvasRenderingContext2D, width: number, horizonY: number, color1: string, color2: string) {
    ctx.save();
    let currentX = 0;
    while (currentX < width) {
      const bWidth = 24 + Math.random() * 45;
      const bHeight = 25 + Math.random() * 85;
      ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
      ctx.fillRect(currentX, horizonY - bHeight, bWidth, bHeight);

      if (Math.random() > 0.6) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(currentX + bWidth * 0.45, horizonY - bHeight - 12, 2, 12);
      }
      currentX += bWidth + 3;
    }
    ctx.restore();
  }

  private drawNightSkyline(ctx: CanvasRenderingContext2D, width: number, horizonY: number, isNeon: boolean = false) {
    ctx.save();
    let currentX = 0;
    const neonColors = ['#06b6d4', '#ec4899', '#a855f7', '#3b82f6', '#f59e0b', '#10b981'];

    while (currentX < width) {
      const bWidth = 28 + Math.random() * 50;
      const bHeight = 35 + Math.random() * 110;

      ctx.fillStyle = '#050711';
      ctx.fillRect(currentX, horizonY - bHeight, bWidth, bHeight);

      // Lit office windows
      const rows = Math.floor(bHeight / 9);
      const cols = Math.floor(bWidth / 7);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.55) {
            ctx.fillStyle = isNeon
              ? (Math.random() > 0.5 ? '#06b6d4' : '#ec4899')
              : (Math.random() > 0.3 ? '#fef08a' : '#93c5fd');
            ctx.globalAlpha = 0.7;
            ctx.fillRect(currentX + 3 + c * 7, horizonY - bHeight + 4 + r * 9, 3.5, 4.5);
          }
        }
      }

      // Neon rooftop signage
      if (isNeon && Math.random() > 0.65) {
        const signCol = neonColors[Math.floor(Math.random() * neonColors.length)];
        ctx.fillStyle = signCol;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(currentX + 4, horizonY - bHeight - 8, bWidth - 8, 4);
      }

      currentX += bWidth + 4;
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  public dispose() {
    if (this.currentEnvTexture) {
      this.currentEnvTexture.dispose();
    }
    if (this.currentSkyTexture) {
      this.currentSkyTexture.dispose();
    }
    this.pmremGenerator.dispose();
  }
}
