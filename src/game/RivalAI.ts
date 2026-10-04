import * as THREE from 'three';
import { CAR_PRESETS, Car3DView, createCar3D } from './cars';
import { RivalState } from './types';

export interface RivalTierConfig {
  tier: number;
  id: string;
  name: string;
  carPresetId: string;
  carColor: string;
  difficulty: 'Rookie' | 'Street' | 'Pro' | 'Legend';
  baseSpeedKmh: number;
  maxSpeedKmh: number;
  rewardCash: number;
  rewardXp: number;
}

export const RIVAL_TIERS: RivalTierConfig[] = [
  {
    tier: 1,
    id: 'rival_rookie_silvia',
    name: 'Ghost Shinobi R34',
    carPresetId: 'shinobi_r34',
    carColor: '#38bdf8',
    difficulty: 'Rookie',
    baseSpeedKmh: 125,
    maxSpeedKmh: 165,
    rewardCash: 3500,
    rewardXp: 350,
  },
  {
    tier: 2,
    id: 'rival_street_miata',
    name: 'Shadow Miata Turbo',
    carPresetId: 'miata_na',
    carColor: '#ef4444',
    difficulty: 'Street',
    baseSpeedKmh: 145,
    maxSpeedKmh: 190,
    rewardCash: 6000,
    rewardXp: 550,
  },
  {
    tier: 3,
    id: 'rival_midnight_gtr',
    name: 'Phantom GT-R R35',
    carPresetId: 'gtr_r35',
    carColor: '#18181b',
    difficulty: 'Pro',
    baseSpeedKmh: 175,
    maxSpeedKmh: 240,
    rewardCash: 10000,
    rewardXp: 850,
  },
  {
    tier: 4,
    id: 'rival_rosso_dino',
    name: 'Dino Corse 246',
    carPresetId: 'dino_246gt',
    carColor: '#e11d48',
    difficulty: 'Pro',
    baseSpeedKmh: 195,
    maxSpeedKmh: 260,
    rewardCash: 16000,
    rewardXp: 1200,
  },
  {
    tier: 5,
    id: 'rival_apex_overlord',
    name: 'Apex Overlord Cyber-GT',
    carPresetId: 'apex_gt',
    carColor: '#8b5cf6',
    difficulty: 'Legend',
    baseSpeedKmh: 220,
    maxSpeedKmh: 295,
    rewardCash: 25000,
    rewardXp: 2000,
  },
];

export class RivalCarManager {
  private scene: THREE.Scene;
  public car3D!: Car3DView;
  public currentTierIndex: number = 2; // Default to Midnight GT-R for high adrenaline
  public currentTier: RivalTierConfig;
  public winStreak: number = 0;

  // Transform & Kinematics
  public position = new THREE.Vector3(0, 0.45, 80);
  public velocity = new THREE.Vector3(0, 0, 0);
  public headingAngle: number = 0;
  public currentSpeedKmh: number = 0;
  public steerAngle: number = 0;
  public wheelSpinAngle: number = 0;

  // Battle state
  public battleScore: number = 0;
  public readonly TARGET_SCORE: number = 1000;
  public isPlayerAhead: boolean = false;
  public distanceToPlayer: number = 0;
  public status: 'racing' | 'leading' | 'trailing' | 'overtaking' | 'defeated' = 'racing';
  public lastEventText: string = 'Challenge the Rival!';

  // Waypoints loop around the expanded world
  private waypoints: THREE.Vector3[] = [];
  private currentWaypointIndex: number = 0;

  // 3D Billboard HUD Tag
  private nameplateSprite!: THREE.Sprite;
  private canvas!: HTMLCanvasElement;
  private canvasCtx!: CanvasRenderingContext2D;
  private texture!: THREE.CanvasTexture;
  private lastDrawnDistance: number = -999;
  private nameplateCooldown: number = 0;
  private overheadBeacon!: THREE.Group;

  // Exhaust flame mesh
  private exhaustFlameLeft!: THREE.Mesh;
  private exhaustFlameRight!: THREE.Mesh;
  private flameTimer: number = 0;

  // Callback for when rival is defeated
  public onDefeatCallback?: (tier: RivalTierConfig, streak: number) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.currentTier = RIVAL_TIERS[this.currentTierIndex];
    this.initWaypoints();
    this.spawnRivalCar();
    this.createNameplate();
    this.createOverheadBeacon();
    this.createExhaustFlames();
  }

  public getWaypoints(): THREE.Vector3[] {
    return this.waypoints;
  }

  public getCurrentWaypointIndex(): number {
    return this.currentWaypointIndex;
  }

  private initWaypoints() {
    // A grand loop spanning the city avenues, downtown flyovers, coastal highway, and high-speed drag strip
    const rawWaypoints = [
      // Main central boulevard
      [0, 0.45, 120],
      [0, 0.45, 240],
      [80, 0.45, 320],
      [160, 0.45, 320],
      // East expressway / Drag strip corridor
      [240, 0.45, 240],
      [280, 0.45, 120],
      [280, 0.45, -120],
      [240, 0.45, -240],
      // North touge & industrial loop
      [160, 0.45, -320],
      [0, 0.45, -320],
      [-120, 0.45, -320],
      [-240, 0.45, -240],
      // West coastal highway ring
      [-280, 0.45, -120],
      [-280, 0.45, 120],
      [-240, 0.45, 240],
      [-120, 0.45, 320],
      [0, 0.45, 240],
      [0, 0.45, 40],
      [0, 0.45, -60],
      [0, 0.45, 60],
    ];

    this.waypoints = rawWaypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  }

  private spawnRivalCar() {
    if (this.car3D) {
      this.scene.remove(this.car3D.rootGroup);
    }

    const preset = CAR_PRESETS[this.currentTier.carPresetId] || CAR_PRESETS.gtr_r35 || CAR_PRESETS.apex_gt;
    this.car3D = createCar3D(preset, this.currentTier.carColor);
    this.scene.add(this.car3D.rootGroup);

    // Initial position near start of track
    const startWp = this.waypoints[0];
    this.position.set(startWp.x + 4, 0.45, startWp.z);
    this.car3D.rootGroup.position.copy(this.position);

    // Initial heading towards waypoint 1
    const nextWp = this.waypoints[1];
    this.headingAngle = Math.atan2(nextWp.x - this.position.x, nextWp.z - this.position.z);
    this.car3D.rootGroup.rotation.y = this.headingAngle;
  }

  private createNameplate() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 128;
    this.canvasCtx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
    });

    this.nameplateSprite = new THREE.Sprite(spriteMat);
    this.nameplateSprite.scale.set(4.2, 1.05, 1);
    this.nameplateSprite.position.set(0, 2.2, 0);
    this.car3D.rootGroup.add(this.nameplateSprite);
    this.updateNameplateGraphic(0);
  }

  private updateNameplateGraphic(distanceMeters: number) {
    if (!this.canvasCtx) return;
    const ctx = this.canvasCtx;
    ctx.clearRect(0, 0, 512, 128);

    // Background badge
    ctx.fillStyle = 'rgba(10, 10, 15, 0.88)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 112, 24);
    ctx.fill();

    // Border glow
    const diffColor =
      this.currentTier.difficulty === 'Legend'
        ? '#a855f7'
        : this.currentTier.difficulty === 'Pro'
        ? '#f43f5e'
        : this.currentTier.difficulty === 'Street'
        ? '#f59e0b'
        : '#06b6d4';

    ctx.strokeStyle = diffColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Text: Rival Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${this.currentTier.name.toUpperCase()}`, 30, 52);

    // Text: Difficulty & Distance
    ctx.fillStyle = diffColor;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${this.currentTier.difficulty.toUpperCase()} AI`, 30, 94);

    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'right';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${Math.round(distanceMeters)}m DISTANCE`, 480, 94);

    this.texture.needsUpdate = true;
  }

  private createOverheadBeacon() {
    this.overheadBeacon = new THREE.Group();
    this.overheadBeacon.position.set(0, 3.4, 0);

    // Glowing vertical pillar beam (visible from across the city)
    const beamGeo = new THREE.CylinderGeometry(0.35, 0.35, 60, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 30;
    this.overheadBeacon.add(beam);

    // Holographic rotating diamond marker
    const diamondGeo = new THREE.OctahedronGeometry(0.65, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      wireframe: false,
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.name = 'diamondMesh';
    this.overheadBeacon.add(diamond);

    // Outer pulsing tracker ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.5, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'ringMesh';
    this.overheadBeacon.add(ring);

    this.car3D.rootGroup.add(this.overheadBeacon);
  }

  private createExhaustFlames() {
    const flameGeo = new THREE.ConeGeometry(0.12, 0.65, 8);
    flameGeo.rotateX(Math.PI / 2); // point backwards
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
    });

    this.exhaustFlameLeft = new THREE.Mesh(flameGeo, flameMat);
    this.exhaustFlameRight = new THREE.Mesh(flameGeo, flameMat.clone());

    this.exhaustFlameLeft.position.set(-0.45, 0.35, -2.2);
    this.exhaustFlameRight.position.set(0.45, 0.35, -2.2);

    this.car3D.rootGroup.add(this.exhaustFlameLeft);
    this.car3D.rootGroup.add(this.exhaustFlameRight);
  }

  public update(
    dt: number,
    playerPosition: THREE.Vector3,
    playerSpeedKmh: number,
    playerIsDrifting: boolean,
    playerDriftScore: number
  ) {
    if (this.status === 'defeated') {
      return;
    }

    // 1. Distance & relative position to player
    this.distanceToPlayer = this.position.distanceTo(playerPosition);

    // Is player ahead? Check projection along rival heading vector
    const toPlayer = new THREE.Vector3().subVectors(playerPosition, this.position);
    const rivalForward = new THREE.Vector3(Math.sin(this.headingAngle), 0, Math.cos(this.headingAngle));
    const forwardProjection = toPlayer.dot(rivalForward);
    const wasPlayerAhead = this.isPlayerAhead;
    this.isPlayerAhead = forwardProjection > 0;

    // Detect Clean Overtake event
    if (!wasPlayerAhead && this.isPlayerAhead && this.distanceToPlayer < 40) {
      this.battleScore = Math.min(this.TARGET_SCORE, this.battleScore + 120);
      this.lastEventText = '🔥 Clean Overtake! +120 Duel Pts';
    }

    // 2. Adaptive rubberband speed
    let targetSpeed = this.currentTier.baseSpeedKmh;

    if (this.isPlayerAhead) {
      // Player is winning: rival accelerates hard with boost to chase!
      targetSpeed = Math.min(this.currentTier.maxSpeedKmh, Math.max(targetSpeed, playerSpeedKmh + 15));
      this.status = 'trailing';
    } else {
      // Rival is leading
      if (this.distanceToPlayer > 110) {
        // Player is far behind: rival eases off slightly so race stays competitive and fun!
        targetSpeed = Math.max(90, this.currentTier.baseSpeedKmh * 0.8);
      } else {
        targetSpeed = this.currentTier.baseSpeedKmh * 1.05;
      }
      this.status = 'leading';
    }

    // Smooth acceleration / braking towards targetSpeed
    const accelRate = 45; // km/h per sec
    if (this.currentSpeedKmh < targetSpeed) {
      this.currentSpeedKmh += accelRate * dt;
    } else {
      this.currentSpeedKmh -= accelRate * 1.4 * dt;
    }

    const speedMps = this.currentSpeedKmh / 3.6;

    // 3. Waypoint Navigation along the circuit
    const currentTargetWp = this.waypoints[this.currentWaypointIndex];
    const distToWp = this.position.distanceTo(currentTargetWp);

    if (distToWp < 28) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    }

    const targetWp = this.waypoints[this.currentWaypointIndex];
    const desiredHeading = Math.atan2(targetWp.x - this.position.x, targetWp.z - this.position.z);

    // Smooth angle interpolation
    let angleDiff = desiredHeading - this.headingAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const turnRate = 2.4;
    this.steerAngle = Math.max(-0.45, Math.min(0.45, angleDiff));
    this.headingAngle += this.steerAngle * turnRate * dt;

    // Move forward along heading
    this.velocity.set(Math.sin(this.headingAngle) * speedMps, 0, Math.cos(this.headingAngle) * speedMps);

    this.position.addScaledVector(this.velocity, dt);
    this.car3D.rootGroup.position.copy(this.position);
    this.car3D.rootGroup.rotation.y = this.headingAngle;

    // Steer front wheels
    if (this.car3D.wheelMeshes[0] && this.car3D.wheelMeshes[1]) {
      this.car3D.wheelMeshes[0].rotation.y = this.steerAngle;
      this.car3D.wheelMeshes[1].rotation.y = this.steerAngle;
    }

    // Spin all wheels
    this.wheelSpinAngle += (speedMps / 0.35) * dt;
    for (let i = 0; i < 4; i++) {
      const wheel = this.car3D.wheelMeshes[i];
      if (wheel && wheel.children[0]) {
        wheel.children[0].rotation.x = this.wheelSpinAngle;
      }
    }

    // Body roll into cornering
    const lateralG = (this.currentSpeedKmh / 160) * this.steerAngle;
    this.car3D.chassisGroup.rotation.z = -lateralG * 0.12;

    // 4. Duel Scoring Logic (How player beats the computer car)
    if (this.distanceToPlayer < 140) {
      // Point 1: Leading race points
      if (this.isPlayerAhead) {
        const leadRate = this.distanceToPlayer > 40 ? 55 : 35;
        this.battleScore = Math.min(this.TARGET_SCORE, this.battleScore + leadRate * dt);
      }

      // Point 2: Drifting converts into duel points!
      if (playerIsDrifting && playerDriftScore > 0) {
        const driftPointsRate = 45;
        this.battleScore = Math.min(this.TARGET_SCORE, this.battleScore + driftPointsRate * dt);
        this.lastEventText = '⚡ Drift Dominance! +Duel Pts';
      }

      // Point 3: High speed drafting
      if (playerSpeedKmh > 180 && this.distanceToPlayer < 60) {
        this.battleScore = Math.min(this.TARGET_SCORE, this.battleScore + 25 * dt);
        this.lastEventText = '💨 High-Speed Slipstream! +Duel Pts';
      }
    }

    // Check Win Condition against Computer Car
    if (this.battleScore >= this.TARGET_SCORE) {
      this.triggerDefeat();
    }

    // 5. Exhaust backfire flames
    this.flameTimer += dt;
    if (this.currentSpeedKmh > 130 && Math.random() < 0.08) {
      (this.exhaustFlameLeft.material as THREE.MeshBasicMaterial).opacity = 0.9;
      (this.exhaustFlameRight.material as THREE.MeshBasicMaterial).opacity = 0.9;
      const s = 0.8 + Math.random() * 0.6;
      this.exhaustFlameLeft.scale.set(s, s, s * 1.5);
      this.exhaustFlameRight.scale.set(s, s, s * 1.5);
    } else {
      (this.exhaustFlameLeft.material as THREE.MeshBasicMaterial).opacity *= 0.75;
      (this.exhaustFlameRight.material as THREE.MeshBasicMaterial).opacity *= 0.75;
    }

    // 6. Animate overhead holographic beacon
    if (this.overheadBeacon) {
      const diamond = this.overheadBeacon.getObjectByName('diamondMesh');
      if (diamond) {
        diamond.rotation.y += dt * 3.0;
        diamond.position.y = 0.2 + Math.sin(this.flameTimer * 4.0) * 0.15;
      }
      const ring = this.overheadBeacon.getObjectByName('ringMesh') as THREE.Mesh | undefined;
      if (ring && ring.material) {
        const pulse = Math.sin(this.flameTimer * 5.0) * 0.5 + 0.5;
        ring.scale.set(1.0 + pulse * 0.35, 1.0 + pulse * 0.35, 1.0 + pulse * 0.35);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 - pulse * 0.4;
      }
    }

    // 7. Throttled nameplate refresh (only when distance changes noticeably, reducing canvas draw/upload lag)
    this.nameplateCooldown += dt;
    const roundedDist = Math.round(this.distanceToPlayer);
    if (this.nameplateCooldown >= 0.25 && (Math.abs(roundedDist - this.lastDrawnDistance) >= 2 || this.lastDrawnDistance === -999)) {
      this.nameplateCooldown = 0;
      this.lastDrawnDistance = roundedDist;
      this.updateNameplateGraphic(roundedDist);
    }
  }

  public triggerDefeat() {
    this.status = 'defeated';
    this.battleScore = this.TARGET_SCORE;
    this.lastEventText = `🏆 ${this.currentTier.name} DEFEATED!`;

    if (this.onDefeatCallback) {
      this.onDefeatCallback(this.currentTier, this.winStreak + 1);
    }
  }

  public advanceToNextRivalTier() {
    this.winStreak += 1;
    this.currentTierIndex = (this.currentTierIndex + 1) % RIVAL_TIERS.length;
    this.currentTier = RIVAL_TIERS[this.currentTierIndex];
    this.battleScore = 0;
    this.status = 'racing';
    this.lastEventText = `New Challenger: ${this.currentTier.name}!`;

    this.spawnRivalCar();
    this.createNameplate();
    this.createOverheadBeacon();
    this.createExhaustFlames();
  }

  public teleportNearPlayer(playerPos: THREE.Vector3, playerHeading: number) {
    // Spawn rival 40 meters ahead of the player on their track
    this.position.set(
      playerPos.x + Math.sin(playerHeading) * 40,
      0.45,
      playerPos.z + Math.cos(playerHeading) * 40
    );
    this.headingAngle = playerHeading;
    this.currentSpeedKmh = 120;
    this.car3D.rootGroup.position.copy(this.position);
    this.car3D.rootGroup.rotation.y = this.headingAngle;
  }

  public getRivalState(): RivalState {
    const progressPercent = Math.round((this.battleScore / this.TARGET_SCORE) * 100);
    return {
      id: this.currentTier.id,
      name: this.currentTier.name,
      carName: CAR_PRESETS[this.currentTier.carPresetId]?.name || 'Sports GT',
      difficulty: this.currentTier.difficulty,
      speedKmh: Math.round(this.currentSpeedKmh),
      position: [this.position.x, this.position.y, this.position.z],
      distanceToPlayer: Math.round(this.distanceToPlayer),
      isPlayerAhead: this.isPlayerAhead,
      battleProgress: progressPercent,
      battleScore: Math.round(this.battleScore),
      targetScore: this.TARGET_SCORE,
      status: this.status,
      tier: this.currentTier.tier,
      rewardCash: this.currentTier.rewardCash,
      rewardXp: this.currentTier.rewardXp,
      streak: this.winStreak,
      lastEventText: this.lastEventText,
    };
  }

  public dispose() {
    if (this.car3D) {
      this.scene.remove(this.car3D.rootGroup);
    }
  }
}
