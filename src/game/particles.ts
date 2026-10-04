import * as THREE from 'three';

interface SkidPoint {
  p1x: number;
  p1y: number;
  p1z: number;
  p2x: number;
  p2y: number;
  p2z: number;
  opacity: number;
}

export class SkidMarkManager {
  private readonly maxPoints: number = 600;
  private readonly points: SkidPoint[] = [];
  private pointHead: number = 0;
  private pointCount: number = 0;
  private needsRebuild: boolean = false;
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const maxCapacity = 200;
    this.points = new Array(maxCapacity);
    for (let i = 0; i < maxCapacity; i++) {
      this.points[i] = { p1x: 0, p1y: 0, p1z: 0, p2x: 0, p2y: 0, p2z: 0, opacity: 0.8 };
    }

    this.positions = new Float32Array(this.maxPoints * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -4.0,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  public addMark(p1: THREE.Vector3, p2: THREE.Vector3, opacity: number = 0.8) {
    const pt = this.points[this.pointHead];
    pt.p1x = p1.x;
    pt.p1y = Math.max(0.025, p1.y + 0.015);
    pt.p1z = p1.z;

    pt.p2x = p2.x;
    pt.p2y = Math.max(0.025, p2.y + 0.015);
    pt.p2z = p2.z;
    pt.opacity = opacity;

    this.pointHead = (this.pointHead + 1) % this.points.length;
    if (this.pointCount < this.points.length) {
      this.pointCount++;
    }

    this.needsRebuild = true;
  }

  public update() {
    if (this.needsRebuild) {
      this.rebuildGeometry();
      this.needsRebuild = false;
    }
  }

  private rebuildGeometry() {
    let vertIndex = 0;
    const len = this.pointCount;
    if (len < 2) return;

    const startIdx = (this.pointHead - len + this.points.length) % this.points.length;

    for (let i = 0; i < len - 1; i++) {
      const idxCurr = (startIdx + i) % this.points.length;
      const idxNext = (startIdx + i + 1) % this.points.length;
      const curr = this.points[idxCurr];
      const next = this.points[idxNext];

      // Distance check - don't connect across teleport or reset
      const dx = curr.p1x - next.p1x;
      const dz = curr.p1z - next.p1z;
      if (dx * dx + dz * dz > 9.0) continue;

      if (vertIndex + 6 > this.maxPoints) break;

      // Triangle 1
      this.setVertex(vertIndex++, curr.p1x, curr.p1y, curr.p1z);
      this.setVertex(vertIndex++, curr.p2x, curr.p2y, curr.p2z);
      this.setVertex(vertIndex++, next.p1x, next.p1y, next.p1z);

      // Triangle 2
      this.setVertex(vertIndex++, curr.p2x, curr.p2y, curr.p2z);
      this.setVertex(vertIndex++, next.p2x, next.p2y, next.p2z);
      this.setVertex(vertIndex++, next.p1x, next.p1y, next.p1z);
    }

    this.geometry.setDrawRange(0, vertIndex);
    this.geometry.attributes.position.needsUpdate = true;
  }

  private setVertex(index: number, x: number, y: number, z: number) {
    const offset = index * 3;
    if (offset + 2 >= this.positions.length) return;
    this.positions[offset] = x;
    this.positions[offset + 1] = y;
    this.positions[offset + 2] = z;
  }

  public clear() {
    this.pointCount = 0;
    this.pointHead = 0;
    this.geometry.setDrawRange(0, 0);
    this.geometry.attributes.position.needsUpdate = true;
  }
}

interface ParticleItem {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'smoke' | 'spark' | 'flame';
}

export class ParticleEmitter {
  private readonly maxParticles = 350;
  private activeLimit = 350;
  private readonly pool: ParticleItem[] = [];
  private mesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private scene: THREE.Scene;

  private static readonly SPARK_COLOR = new THREE.Color(0xf59e0b);
  private static readonly SMOKE_COLOR = new THREE.Color(0xd4d4d8);
  private static readonly FLAME_COLOR = new THREE.Color(0x38bdf8);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const geo = new THREE.DodecahedronGeometry(0.2, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.maxParticles * 3), 3);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    // Pre-allocate zero-garbage pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 0.3,
        type: 'smoke',
      });
    }
  }

  public setQualityBudget(quality: 'performance' | 'balanced' | 'ultra') {
    if (quality === 'performance') {
      this.activeLimit = 140;
    } else if (quality === 'balanced') {
      this.activeLimit = 260;
    } else {
      this.activeLimit = 350;
    }
  }

  private getFreeParticle(): ParticleItem | null {
    for (let i = 0; i < this.activeLimit; i++) {
      if (!this.pool[i].active) return this.pool[i];
    }
    return null;
  }

  public emitSmoke(position: THREE.Vector3, velocity: THREE.Vector3) {
    const p = this.getFreeParticle();
    if (!p) return;

    p.active = true;
    p.type = 'smoke';
    p.x = position.x + (Math.random() - 0.5) * 0.25;
    p.y = position.y + 0.1;
    p.z = position.z + (Math.random() - 0.5) * 0.25;

    p.vx = velocity.x * 0.2 + (Math.random() - 0.5) * 0.7;
    p.vy = 1.3 + Math.random() * 0.8;
    p.vz = velocity.z * 0.2 + (Math.random() - 0.5) * 0.7;

    p.life = 0;
    p.maxLife = 0.55 + Math.random() * 0.35;
    p.size = 0.35 + Math.random() * 0.22;
  }

  public emitBackfireSparks(position: THREE.Vector3, exhaustDir: THREE.Vector3) {
    const sparkCount = this.activeLimit > 200 ? 6 : 3;
    for (let i = 0; i < sparkCount; i++) {
      const p = this.getFreeParticle();
      if (!p) return;

      p.active = true;
      p.type = 'spark';
      p.x = position.x;
      p.y = position.y;
      p.z = position.z;

      const speed = 7 + Math.random() * 6;
      p.vx = exhaustDir.x * speed + (Math.random() - 0.5) * 2;
      p.vy = exhaustDir.y * speed + (Math.random() - 0.5) * 2;
      p.vz = exhaustDir.z * speed + (Math.random() - 0.5) * 2;

      p.life = 0;
      p.maxLife = 0.18 + Math.random() * 0.12;
      p.size = 0.16;
    }
  }

  public update(dt: number) {
    let activeIndex = 0;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      // Physics integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      if (p.type === 'smoke') {
        p.vy += 0.85 * dt; // thermal buoyant lift
        p.vx *= 0.94;
        p.vz *= 0.94;
        p.size += 1.3 * dt; // plume expansion
      } else {
        p.vy -= 9.8 * dt; // spark gravity
      }

      // Render matrix update
      const progress = p.life / p.maxLife;
      const currentScale = p.size * (1 - progress * 0.3);

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.scale.set(currentScale, currentScale, currentScale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(activeIndex, this.dummy.matrix);

      const color = p.type === 'spark'
        ? ParticleEmitter.SPARK_COLOR
        : p.type === 'flame'
        ? ParticleEmitter.FLAME_COLOR
        : ParticleEmitter.SMOKE_COLOR;
      this.mesh.setColorAt(activeIndex, color);

      activeIndex++;
    }

    this.mesh.count = activeIndex;
    if (activeIndex > 0) {
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }
  }
}
