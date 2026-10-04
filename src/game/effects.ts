import * as THREE from 'three';
import { getRacingLineTexture, getOpponentLineTexture } from './textures';

export type GuideMode = 'all' | 'opponent' | 'mission' | 'off';

/**
 * Dynamic 3D Racing & Opponent Chaser Guide Line System
 * Zero-allocation high-performance architecture to eliminate GC stutter.
 * Features:
 *  1. Persistent Opponent Chaser Line: Real-time road navigation & slipstream draft ribbon to rival at all times.
 *  2. Mission Racing Line: Checkpoint path with dynamic green/amber/red braking zones and sky beacons.
 */
export class RacingGuideLine {
  public group: THREE.Group;
  public mode: GuideMode = 'mission';

  // 1. Mission / Waypoint Ribbon
  private ribbonMesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshBasicMaterial;
  private readonly maxSegments: number = 80;
  private positions: Float32Array;
  private colors: Float32Array;
  private uvs: Float32Array;

  // 2. Persistent Opponent Chase Ribbon
  private opponentRibbonMesh: THREE.Mesh;
  private opponentGeometry: THREE.BufferGeometry;
  private opponentMaterial: THREE.MeshBasicMaterial;
  private readonly maxOpponentSegments: number = 90;
  private opponentPositions: Float32Array;
  private opponentColors: Float32Array;
  private opponentUvs: Float32Array;

  // Checkpoint Sky Beacon Pillar
  private beaconGroup: THREE.Group;
  private beaconPillar: THREE.Mesh;
  private beaconPulseRing: THREE.Mesh;
  private floatingArrow: THREE.Group;

  // Animation states
  private scrollOffset: number = 0;
  private oppScrollOffset: number = 0;
  private animTimer: number = 0;

  // Pre-allocated scratch object pools (ZERO HEAP ALLOCATION PER FRAME)
  private _sampledPoints: THREE.Vector3[] = Array.from({ length: 90 }, () => new THREE.Vector3());
  private _tangents: THREE.Vector3[] = Array.from({ length: 90 }, () => new THREE.Vector3());
  private _controlPoints: THREE.Vector3[] = Array.from({ length: 24 }, () => new THREE.Vector3());

  private _oppSampledPoints: THREE.Vector3[] = Array.from({ length: 100 }, () => new THREE.Vector3());
  private _oppTangents: THREE.Vector3[] = Array.from({ length: 100 }, () => new THREE.Vector3());
  private _oppControlPoints: THREE.Vector3[] = Array.from({ length: 24 }, () => new THREE.Vector3());

  private _curve: THREE.CatmullRomCurve3 = new THREE.CatmullRomCurve3([], false, 'centripetal', 0.45);
  private _scratchNormal: THREE.Vector3 = new THREE.Vector3();
  private _scratchVec1: THREE.Vector3 = new THREE.Vector3();
  private _scratchVec2: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();

    // 1. Mission Ribbon Mesh (Road-projected racing line)
    const maxVerts = (this.maxSegments + 1) * 2;
    this.positions = new Float32Array(maxVerts * 3);
    this.colors = new Float32Array(maxVerts * 3);
    this.uvs = new Float32Array(maxVerts * 2);

    const indices: number[] = [];
    for (let i = 0; i < this.maxSegments; i++) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      indices.push(v0, v1, v2);
      indices.push(v2, v1, v3);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setIndex(indices);
    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.MeshBasicMaterial({
      map: getRacingLineTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });

    this.ribbonMesh = new THREE.Mesh(this.geometry, this.material);
    this.ribbonMesh.frustumCulled = false;
    this.group.add(this.ribbonMesh);

    // 2. Opponent Chaser Ribbon (Persistent Neon Purple/Magenta Duel Track)
    const maxOppVerts = (this.maxOpponentSegments + 1) * 2;
    this.opponentPositions = new Float32Array(maxOppVerts * 3);
    this.opponentColors = new Float32Array(maxOppVerts * 3);
    this.opponentUvs = new Float32Array(maxOppVerts * 2);

    const oppIndices: number[] = [];
    for (let i = 0; i < this.maxOpponentSegments; i++) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      oppIndices.push(v0, v1, v2);
      oppIndices.push(v2, v1, v3);
    }

    this.opponentGeometry = new THREE.BufferGeometry();
    this.opponentGeometry.setAttribute('position', new THREE.BufferAttribute(this.opponentPositions, 3));
    this.opponentGeometry.setAttribute('color', new THREE.BufferAttribute(this.opponentColors, 3));
    this.opponentGeometry.setAttribute('uv', new THREE.BufferAttribute(this.opponentUvs, 2));
    this.opponentGeometry.setIndex(oppIndices);
    this.opponentGeometry.setDrawRange(0, 0);

    this.opponentMaterial = new THREE.MeshBasicMaterial({
      map: getOpponentLineTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });

    this.opponentRibbonMesh = new THREE.Mesh(this.opponentGeometry, this.opponentMaterial);
    this.opponentRibbonMesh.frustumCulled = false;
    this.group.add(this.opponentRibbonMesh);

    // 3. Active Checkpoint Sky Beacon Pillar
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.visible = false;

    const pillarGeo = new THREE.CylinderGeometry(1.8, 1.8, 90, 16, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.beaconPillar = new THREE.Mesh(pillarGeo, pillarMat);
    this.beaconPillar.position.y = 45;
    this.beaconGroup.add(this.beaconPillar);

    const ringGeo = new THREE.RingGeometry(3.2, 4.4, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.beaconPulseRing = new THREE.Mesh(ringGeo, ringMat);
    this.beaconPulseRing.position.y = 0.06;
    this.beaconGroup.add(this.beaconPulseRing);

    this.floatingArrow = new THREE.Group();
    this.floatingArrow.position.y = 7.5;
    // Sleek aerodynamic waypoint chevron pointing cleanly down at the target
    const arrowConeGeo = new THREE.ConeGeometry(1.1, 2.5, 8);
    arrowConeGeo.rotateX(Math.PI);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const arrowCone = new THREE.Mesh(arrowConeGeo, arrowMat);
    this.floatingArrow.add(arrowCone);

    // Subtle waypoint halo ring around chevron
    const haloGeo = new THREE.TorusGeometry(1.4, 0.08, 6, 24);
    haloGeo.rotateX(Math.PI * 0.5);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.y = 0.5;
    this.floatingArrow.add(haloMesh);

    this.beaconGroup.add(this.floatingArrow);

    this.group.add(this.beaconGroup);
  }

  public get enabled(): boolean {
    return this.mode !== 'off';
  }

  public toggleMode(): GuideMode {
    if (this.mode === 'mission') this.mode = 'opponent';
    else if (this.mode === 'opponent') this.mode = 'off';
    else this.mode = 'mission';

    if (this.mode === 'off') {
      this.clear();
    }
    return this.mode;
  }

  public update(
    dt: number,
    carPos: THREE.Vector3,
    carForward: THREE.Vector3,
    carSpeedKmh: number,
    checkpoints: [number, number, number][] | null,
    currentIdx: number,
    rivalPos?: THREE.Vector3 | null,
    rivalWaypoints?: THREE.Vector3[]
  ) {
    if (this.mode === 'off') {
      this.clear();
      return;
    }

    this.animTimer += dt;
    this.scrollOffset -= dt * 2.8;
    if (this.material.map) {
      this.material.map.offset.y = this.scrollOffset;
    }

    this.oppScrollOffset -= dt * 3.6; // Faster forward rush for opponent pursuit
    if (this.opponentMaterial.map) {
      this.opponentMaterial.map.offset.y = this.oppScrollOffset;
    }

    const showMission = (this.mode === 'all' || this.mode === 'mission');
    const showOpponent = (this.mode === 'all' || this.mode === 'opponent');

    // 1. Mission / Waypoint Line
    if (showMission && checkpoints && checkpoints.length > 0 && currentIdx < checkpoints.length) {
      this.beaconGroup.visible = true;
      const currentCp = checkpoints[currentIdx];
      this.beaconGroup.position.set(currentCp[0], 0, currentCp[2]);

      const pulse = Math.sin(this.animTimer * 3.5) * 0.5 + 0.5;
      this.beaconPulseRing.scale.set(1.0 + pulse * 0.45, 1.0 + pulse * 0.45, 1.0 + pulse * 0.45);
      (this.beaconPulseRing.material as THREE.MeshBasicMaterial).opacity = 0.75 - pulse * 0.35;

      this.floatingArrow.rotation.y += dt * 2.2;
      this.floatingArrow.position.y = 7.2 + Math.sin(this.animTimer * 4.0) * 0.4;

      // Populate control points without heap allocation
      let cpCount = 0;
      this._controlPoints[cpCount++].set(carPos.x, 0.045, carPos.z);

      const toCpX = currentCp[0] - carPos.x;
      const toCpZ = currentCp[2] - carPos.z;
      const distToFirst = Math.sqrt(toCpX * toCpX + toCpZ * toCpZ);
      const leadDist = Math.min(10, Math.max(3, distToFirst * 0.35));

      this._controlPoints[cpCount++].set(
        carPos.x + carForward.x * leadDist,
        0.045,
        carPos.z + carForward.z * leadDist
      );

      const lookAheadCount = Math.min(4, checkpoints.length - currentIdx);
      for (let i = 0; i < lookAheadCount; i++) {
        const cp = checkpoints[currentIdx + i];
        this._controlPoints[cpCount++].set(cp[0], Math.max(0.045, cp[1] * 0.1), cp[2]);
      }

      this.generateMissionRibbon(cpCount, carSpeedKmh);
    } else {
      this.beaconGroup.visible = false;
      this.geometry.setDrawRange(0, 0);
    }

    // 2. Persistent Opponent Follow Line (ALL THE TIME)
    if (showOpponent && rivalPos) {
      this.updateOpponentFollowLine(carPos, carForward, rivalPos, rivalWaypoints);
    } else {
      this.opponentGeometry.setDrawRange(0, 0);
    }
  }

  private updateOpponentFollowLine(
    carPos: THREE.Vector3,
    carForward: THREE.Vector3,
    rivalPos: THREE.Vector3,
    rivalWaypoints?: THREE.Vector3[]
  ) {
    const dx = rivalPos.x - carPos.x;
    const dz = rivalPos.z - carPos.z;
    const distToRival = Math.sqrt(dx * dx + dz * dz);

    let count = 0;
    // Start at vehicle bumper
    this._oppControlPoints[count++].set(carPos.x, 0.05, carPos.z);

    if (distToRival <= 75 || !rivalWaypoints || rivalWaypoints.length === 0) {
      // Direct slipstream chase vector
      const lead = Math.min(12, Math.max(4, distToRival * 0.35));
      this._oppControlPoints[count++].set(
        carPos.x + carForward.x * lead,
        0.05,
        carPos.z + carForward.z * lead
      );

      // Midpoint
      this._oppControlPoints[count++].set(
        carPos.x + dx * 0.6,
        0.05,
        carPos.z + dz * 0.6
      );

      // Opponent position
      this._oppControlPoints[count++].set(rivalPos.x, 0.05, rivalPos.z);
    } else {
      // Long-distance street network waypoint routing to opponent!
      const lead = 10;
      this._oppControlPoints[count++].set(
        carPos.x + carForward.x * lead,
        0.05,
        carPos.z + carForward.z * lead
      );

      // Find closest waypoint to player
      let bestPlayerIdx = 0;
      let minPlayerDistSq = Infinity;
      for (let i = 0; i < rivalWaypoints.length; i++) {
        const wp = rivalWaypoints[i];
        const wdx = wp.x - carPos.x;
        const wdz = wp.z - carPos.z;
        const dsq = wdx * wdx + wdz * wdz;
        if (dsq < minPlayerDistSq) {
          minPlayerDistSq = dsq;
          bestPlayerIdx = i;
        }
      }

      // Find closest waypoint to rival
      let bestRivalIdx = 0;
      let minRivalDistSq = Infinity;
      for (let i = 0; i < rivalWaypoints.length; i++) {
        const wp = rivalWaypoints[i];
        const wdx = wp.x - rivalPos.x;
        const wdz = wp.z - rivalPos.z;
        const dsq = wdx * wdx + wdz * wdz;
        if (dsq < minRivalDistSq) {
          minRivalDistSq = dsq;
          bestRivalIdx = i;
        }
      }

      // Route through the loop waypoints towards rival (max 5 intermediate waypoints)
      const numWp = rivalWaypoints.length;
      let curr = bestPlayerIdx;
      let hops = 0;
      while (curr !== bestRivalIdx && hops < 5 && count < 20) {
        const wp = rivalWaypoints[curr];
        this._oppControlPoints[count++].set(wp.x, 0.05, wp.z);
        curr = (curr + 1) % numWp;
        hops++;
      }

      // Terminate directly at rival car
      this._oppControlPoints[count++].set(rivalPos.x, 0.05, rivalPos.z);
    }

    this.generateOpponentRibbon(count, distToRival);
  }

  private generateMissionRibbon(pointCount: number, carSpeedKmh: number) {
    if (pointCount < 2) {
      this.geometry.setDrawRange(0, 0);
      return;
    }

    const pts = this._controlPoints.slice(0, pointCount);
    this._curve.points = pts;
    this._curve.updateArcLengths();

    const segments = Math.min(this.maxSegments, Math.max(20, pointCount * 14));

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      this._curve.getPoint(u, this._sampledPoints[i]);
      this._curve.getTangent(u, this._tangents[i]);
    }

    const halfWidth = 0.72;
    let accumDistance = 0;

    for (let i = 0; i <= segments; i++) {
      const p = this._sampledPoints[i];
      const t = this._tangents[i];

      if (i > 0) {
        accumDistance += p.distanceTo(this._sampledPoints[i - 1]);
      }

      this._scratchNormal.set(-t.z, 0, t.x).normalize();
      const nx = this._scratchNormal.x * halfWidth;
      const nz = this._scratchNormal.z * halfWidth;

      const vL = i * 2;
      const vR = i * 2 + 1;

      // Position Left
      this.positions[vL * 3] = p.x + nx;
      this.positions[vL * 3 + 1] = p.y;
      this.positions[vL * 3 + 2] = p.z + nz;

      // Position Right
      this.positions[vR * 3] = p.x - nx;
      this.positions[vR * 3 + 1] = p.y;
      this.positions[vR * 3 + 2] = p.z - nz;

      // UVs
      const vCoord = accumDistance * 0.35;
      this.uvs[vL * 2] = 0;
      this.uvs[vL * 2 + 1] = vCoord;
      this.uvs[vR * 2] = 1;
      this.uvs[vR * 2 + 1] = vCoord;

      // Dynamic Speed-Reactive Cornering Color
      let r = 0.12;
      let g = 0.95;
      let b = 0.45;

      const lookAheadIdx = Math.min(segments, i + 4);
      const lookAheadTangent = this._tangents[lookAheadIdx];
      const turnAngle = Math.abs(t.angleTo(lookAheadTangent));

      if (turnAngle > 0.45 && carSpeedKmh > 75) {
        r = 0.98;
        g = 0.15;
        b = 0.22;
      } else if (turnAngle > 0.25 && carSpeedKmh > 55) {
        r = 0.98;
        g = 0.78;
        b = 0.12;
      }

      this.colors[vL * 3] = r;
      this.colors[vL * 3 + 1] = g;
      this.colors[vL * 3 + 2] = b;

      this.colors[vR * 3] = r;
      this.colors[vR * 3 + 1] = g;
      this.colors[vR * 3 + 2] = b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
    this.geometry.setDrawRange(0, segments * 6);
  }

  private generateOpponentRibbon(pointCount: number, distToRival: number) {
    if (pointCount < 2) {
      this.opponentGeometry.setDrawRange(0, 0);
      return;
    }

    const pts = this._oppControlPoints.slice(0, pointCount);
    this._curve.points = pts;
    this._curve.updateArcLengths();

    const segments = Math.min(this.maxOpponentSegments, Math.max(24, pointCount * 14));

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      this._curve.getPoint(u, this._oppSampledPoints[i]);
      this._curve.getTangent(u, this._oppTangents[i]);
    }

    // Dynamic width: widens when close into slipstream draft pocket
    const halfWidth = distToRival < 40 ? 0.9 : 0.75;
    let accumDistance = 0;

    for (let i = 0; i <= segments; i++) {
      const p = this._oppSampledPoints[i];
      const t = this._oppTangents[i];

      if (i > 0) {
        accumDistance += p.distanceTo(this._oppSampledPoints[i - 1]);
      }

      this._scratchNormal.set(-t.z, 0, t.x).normalize();
      const nx = this._scratchNormal.x * halfWidth;
      const nz = this._scratchNormal.z * halfWidth;

      const vL = i * 2;
      const vR = i * 2 + 1;

      this.opponentPositions[vL * 3] = p.x + nx;
      this.opponentPositions[vL * 3 + 1] = 0.052;
      this.opponentPositions[vL * 3 + 2] = p.z + nz;

      this.opponentPositions[vR * 3] = p.x - nx;
      this.opponentPositions[vR * 3 + 1] = 0.052;
      this.opponentPositions[vR * 3 + 2] = p.z - nz;

      const vCoord = accumDistance * 0.4;
      this.opponentUvs[vL * 2] = 0;
      this.opponentUvs[vL * 2 + 1] = vCoord;
      this.opponentUvs[vR * 2] = 1;
      this.opponentUvs[vR * 2 + 1] = vCoord;

      // Glowing Neon Violet / Hot Magenta color gradient
      let r = 0.85;
      let g = 0.25;
      let b = 1.0;

      if (distToRival < 30) {
        // High-intensity Slipstream Draft: Electric Cyan / Magenta pulse
        r = 0.95;
        g = 0.35;
        b = 0.95;
      }

      this.opponentColors[vL * 3] = r;
      this.opponentColors[vL * 3 + 1] = g;
      this.opponentColors[vL * 3 + 2] = b;

      this.opponentColors[vR * 3] = r;
      this.opponentColors[vR * 3 + 1] = g;
      this.opponentColors[vR * 3 + 2] = b;
    }

    this.opponentGeometry.attributes.position.needsUpdate = true;
    this.opponentGeometry.attributes.color.needsUpdate = true;
    this.opponentGeometry.attributes.uv.needsUpdate = true;
    this.opponentGeometry.setDrawRange(0, segments * 6);
  }

  public clear() {
    this.geometry.setDrawRange(0, 0);
    this.opponentGeometry.setDrawRange(0, 0);
    this.beaconGroup.visible = false;
  }

  public setEnabled(enabled: boolean) {
    this.mode = enabled ? 'all' : 'off';
    if (!enabled) {
      this.clear();
    }
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.opponentGeometry.dispose();
    this.opponentMaterial.dispose();
    this.beaconPillar.geometry.dispose();
    (this.beaconPillar.material as THREE.Material).dispose();
    this.beaconPulseRing.geometry.dispose();
    (this.beaconPulseRing.material as THREE.Material).dispose();
  }
}

/**
 * High-Speed Warp / Speed Line streaks that appear at high velocity.
 * Enhances the sensation of extreme speed and acceleration.
 */
export class SpeedLines {
  public group: THREE.Group;
  private linesMesh: THREE.LineSegments;
  private positions: Float32Array;
  private count: number = 80;
  private radius: number = 7.0;
  private static readonly _forwardUnit: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  constructor() {
    this.group = new THREE.Group();

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 2 * 3);

    for (let i = 0; i < this.count; i++) {
      this.resetLine(i);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    this.linesMesh = new THREE.LineSegments(geometry, material);
    this.linesMesh.frustumCulled = false;
    this.group.add(this.linesMesh);
  }

  private resetLine(i: number, zOffset: number = 0) {
    const angle = Math.random() * Math.PI * 2;
    const r = 2.5 + Math.random() * this.radius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * (r * 0.6) + 1.2;
    const zStart = 15 + Math.random() * 25 + zOffset;
    const lineLen = 3.5 + Math.random() * 8.0;

    const baseIdx = i * 6;
    // Point 1 (Head)
    this.positions[baseIdx] = x;
    this.positions[baseIdx + 1] = y;
    this.positions[baseIdx + 2] = zStart;

    // Point 2 (Tail)
    this.positions[baseIdx + 3] = x;
    this.positions[baseIdx + 4] = y;
    this.positions[baseIdx + 5] = zStart + lineLen;
  }

  public update(dt: number, speedKmh: number, carPos: THREE.Vector3, forward: THREE.Vector3) {
    const mat = this.linesMesh.material as THREE.LineBasicMaterial;

    if (speedKmh < 100) {
      mat.opacity = 0;
      return;
    }

    // Fade in between 100 and 240 km/h
    const intensity = Math.min(1.0, (speedKmh - 100) / 140);
    mat.opacity = intensity * 0.65;

    // Align group with car orientation & position
    this.group.position.copy(carPos);
    this.group.quaternion.setFromUnitVectors(SpeedLines._forwardUnit, forward);

    // Rush lines backward along local Z
    const rushSpeed = (speedKmh / 3.6) * 1.6;
    for (let i = 0; i < this.count; i++) {
      const baseIdx = i * 6;
      this.positions[baseIdx + 2] -= rushSpeed * dt;
      this.positions[baseIdx + 5] -= rushSpeed * dt;

      // If line rushes behind car, respawn in front
      if (this.positions[baseIdx + 5] < -5) {
        this.resetLine(i, 20);
      }
    }

    this.linesMesh.geometry.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.linesMesh.geometry.dispose();
    (this.linesMesh.material as THREE.Material).dispose();
  }
}
