import * as THREE from 'three';
import { TimeOfDay, VisualTheme } from './types';
import { WorldCollider } from './physics';
import {
  getAsphaltPBRTextures,
  getConcreteSidewalkTexture,
  getModernBuildingFacadeTexture,
  getManholeCoverTexture,
  getStormDrainGrateTexture,
  getHighwayGantrySignTexture,
  getSpeedLimitSignTexture,
} from './textures';

export interface WorldObject {
  scene: THREE.Scene;
  colliders: WorldCollider[];
  checkpointGroup: THREE.Group;
  sunLight: THREE.DirectionalLight;
  setCheckpoints: (points: [number, number, number][], activeIdx?: number) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setTheme: (theme: VisualTheme) => void;
  update: (time: number, carPos?: THREE.Vector3) => void;
}

/**
 * Next-Gen 3D City & Stunt World
 * Optimized with high-efficiency instanced rendering:
 * - Instanced streetlamps, road markings, curbs, trees, and window glow
 * - Dynamic shadow frustum tracking player position for razor-sharp shadows
 * - Distant mountain panorama, harbor canal with wave ripples, and stunt ramps
 */
export function createWorld(scene: THREE.Scene): WorldObject {
  const colliders: WorldCollider[] = [];

  // 1. High-Performance Photorealistic Lighting System
  const sunLight = new THREE.DirectionalLight(0xfffaed, 2.45);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.radius = 1.6;
  sunLight.shadow.camera.near = 1.0;
  sunLight.shadow.camera.far = 320;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 60;
  sunLight.shadow.camera.bottom = -60;
  sunLight.shadow.bias = -0.0002;
  sunLight.shadow.normalBias = 0.03;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xbde0fe, 0x334155, 0.55);
  scene.add(hemisphereLight);

  scene.fog = new THREE.FogExp2(0xcfdbe6, 0.0012);

  // 2. Procedural High-Definition PBR Asphalt & Concrete Materials
  const asphaltPBR = getAsphaltPBRTextures();
  asphaltPBR.map.repeat.set(32, 32);
  asphaltPBR.bumpMap.repeat.set(32, 32);
  asphaltPBR.roughnessMap.repeat.set(32, 32);

  const asphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltPBR.map,
    bumpMap: asphaltPBR.bumpMap,
    bumpScale: 0.045,
    roughnessMap: asphaltPBR.roughnessMap,
    roughness: 0.76,
    metalness: 0.12,
    envMapIntensity: 1.25,
  });

  const concretePBR = getConcreteSidewalkTexture();
  concretePBR.map.repeat.set(24, 24);
  concretePBR.bumpMap.repeat.set(24, 24);

  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: concretePBR.map,
    bumpMap: concretePBR.bumpMap,
    bumpScale: 0.035,
    roughness: 0.85,
    metalness: 0.08,
  });

  const curbRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.45,
    metalness: 0.1,
  });

  const curbWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.38,
    metalness: 0.1,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a1e,
    roughness: 0.95,
  });

  const modernFacadeTexture = getModernBuildingFacadeTexture();

  const buildingMatA = new THREE.MeshStandardMaterial({
    map: modernFacadeTexture,
    roughness: 0.18,
    metalness: 0.65,
    envMapIntensity: 2.2,
  });

  const buildingMatB = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.25,
    metalness: 0.65,
    envMapIntensity: 1.6,
  });

  const glassBuildingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.08,
    metalness: 0.9,
    envMapIntensity: 2.4,
  });
  const glassMat = glassBuildingMat;

  const windowLitMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  const roadLineMat = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.4,
  });

  const roadYellowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
  });

  const roadReflectorMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.8,
  });

  const treeTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
  });

  const treeFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.8,
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.08,
    metalness: 0.92,
    transparent: true,
    opacity: 0.85,
    envMapIntensity: 2.8,
  });

  const streetlightMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xfef08a,
    emissiveIntensity: 0.2,
    roughness: 0.1,
  });

  const neonColors = [0x06b6d4, 0xec4899, 0xa855f7, 0x3b82f6, 0x10b981];
  const neonMaterials = neonColors.map(col =>
    new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    })
  );

  const containerColors = [0x0284c7, 0xd97706, 0x16a34a, 0x9333ea, 0xdc2626];

  // 3. Ground Plane
  const groundGeo = new THREE.PlaneGeometry(3000, 3000);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, grassMat);
  ground.receiveShadow = true;
  ground.position.y = -0.02;
  scene.add(ground);

  // Helper to register box collider
  function addBoxObstacle(mesh: THREE.Mesh, halfX: number, halfY: number, halfZ: number, canCastShadow = false) {
    if (canCastShadow) {
      mesh.castShadow = true;
    }
    mesh.receiveShadow = true;
    scene.add(mesh);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(mesh.position, new THREE.Vector3(halfX * 2, halfY * 2, halfZ * 2));
    colliders.push({ type: 'box', box, mesh });
  }

  // 4. City Road Network & Expanded Mega-World
  const ROAD_WIDTH = 18;
  const CITY_SPAN = 720;
  const ROAD_COORDS = [-240, -160, -80, 0, 80, 160, 240];

  // Create base road planes
  ROAD_COORDS.forEach(rx => {
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CITY_SPAN);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.set(rx, 0.01, 0);
    road.receiveShadow = true;
    scene.add(road);
  });

  ROAD_COORDS.forEach(rz => {
    const roadGeo = new THREE.PlaneGeometry(CITY_SPAN, ROAD_WIDTH);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.set(0, 0.01, rz);
    road.receiveShadow = true;
    scene.add(road);
  });

  // 4b. Procedural Cast-Iron Utility Infrastructure: Manhole Covers & Curbside Storm Drains
  const manholeTex = getManholeCoverTexture();
  const stormDrainTex = getStormDrainGrateTexture();

  const manholeMat = new THREE.MeshStandardMaterial({
    map: manholeTex,
    roughness: 0.82,
    metalness: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const stormDrainMat = new THREE.MeshStandardMaterial({
    map: stormDrainTex,
    roughness: 0.78,
    metalness: 0.75,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const manholeGeo = new THREE.CircleGeometry(0.58, 24);
  manholeGeo.rotateX(-Math.PI / 2);

  const stormDrainGeo = new THREE.PlaneGeometry(0.85, 1.4);
  stormDrainGeo.rotateX(-Math.PI / 2);

  // Distribute cast-iron manhole covers along travel lanes
  ROAD_COORDS.forEach(rx => {
    for (let z = -CITY_SPAN / 2 + 30; z <= CITY_SPAN / 2 - 30; z += 55) {
      if (Math.abs(z % 80) < 16) continue; // Skip intersections
      const laneOffset = ((Math.abs(Math.floor(z / 55))) % 2 === 0) ? -3.6 : 3.6;
      const manhole = new THREE.Mesh(manholeGeo, manholeMat);
      manhole.position.set(rx + laneOffset, 0.024, z);
      manhole.receiveShadow = true;
      scene.add(manhole);
    }
  });

  // Distribute storm drain grates against curbs before intersections
  ROAD_COORDS.forEach(rx => {
    ROAD_COORDS.forEach(rz => {
      const drainDist = 14;
      const curbX = (ROAD_WIDTH / 2) - 0.55;
      [
        { x: rx - curbX, z: rz - drainDist },
        { x: rx + curbX, z: rz - drainDist },
        { x: rx - curbX, z: rz + drainDist },
        { x: rx + curbX, z: rz + drainDist },
      ].forEach(d => {
        const drain = new THREE.Mesh(stormDrainGeo, stormDrainMat);
        drain.position.set(d.x, 0.025, d.z);
        drain.receiveShadow = true;
        scene.add(drain);
      });
    });
  });

  // 4c. Highway Overhead Truss Gantries & Roadside Speed Limit Signs
  const highwayGantryTex = getHighwayGantrySignTexture('DOWNTOWN / HARBOR', 'TOUGE PASS / SPEEDWAY');
  const gantrySignMat = new THREE.MeshStandardMaterial({
    map: highwayGantryTex,
    roughness: 0.35,
    metalness: 0.1,
  });

  const speedLimit65Tex = getSpeedLimitSignTexture('65');
  const speedLimit80Tex = getSpeedLimitSignTexture('80');
  const speedLimit65Mat = new THREE.MeshStandardMaterial({
    map: speedLimit65Tex,
    roughness: 0.3,
    metalness: 0.1,
  });
  const speedLimit80Mat = new THREE.MeshStandardMaterial({
    map: speedLimit80Tex,
    roughness: 0.3,
    metalness: 0.1,
  });

  const galvanizedSteelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.3,
  });

  const gantryLocations = [
    { x: 0, z: 120, rot: 0, width: 22 },
    { x: 0, z: -120, rot: Math.PI, width: 22 },
    { x: 200, z: 0, rot: -Math.PI / 2, width: 24 },
    { x: -200, z: 0, rot: Math.PI / 2, width: 24 },
  ];

  gantryLocations.forEach(gLoc => {
    const gGroup = new THREE.Group();
    gGroup.position.set(gLoc.x, 0, gLoc.z);
    gGroup.rotation.y = gLoc.rot;

    // Dual vertical lattice support legs
    [-gLoc.width / 2, gLoc.width / 2].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.4, 0.7), galvanizedSteelMat);
      leg.position.set(lx, 3.7, 0);
      leg.castShadow = true;
      gGroup.add(leg);

      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.6, 8), buildingMatB);
      foot.position.set(lx, 0.3, 0);
      gGroup.add(foot);
    });

    // Horizontal truss span crossbeam
    const truss = new THREE.Mesh(new THREE.BoxGeometry(gLoc.width, 0.9, 0.9), galvanizedSteelMat);
    truss.position.set(0, 7.2, 0);
    truss.castShadow = true;
    gGroup.add(truss);

    // Green interstate reflectorized sign board
    const signBoardGeo = new THREE.PlaneGeometry(10.5, 3.2);
    const signBoard = new THREE.Mesh(signBoardGeo, gantrySignMat);
    signBoard.position.set(0, 6.4, 0.48);
    gGroup.add(signBoard);

    // Maintenance catwalk walkway
    const walkway = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.12, 1.2), galvanizedSteelMat);
    walkway.position.set(0, 4.6, 0.7);
    gGroup.add(walkway);

    // Downward illumination fixtures
    [-3.8, 0, 3.8].forEach(fx => {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.4), galvanizedSteelMat);
      fixture.position.set(fx, 4.8, 1.1);
      gGroup.add(fixture);
    });

    scene.add(gGroup);
  });

  // Roadside Speed Limit Signs on Galvanized Posts
  const speedSignGeo = new THREE.PlaneGeometry(0.75, 1.05);
  const postGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.8, 8);

  const speedSignLocations = [
    { x: 10.2, z: 45, rot: 0, is80: false },
    { x: -10.2, z: -45, rot: Math.PI, is80: false },
    { x: 90.2, z: 95, rot: 0, is80: false },
    { x: -89.8, z: -95, rot: Math.PI, is80: false },
    { x: 200, z: 195, rot: -Math.PI / 4, is80: true },
    { x: -200, z: 195, rot: Math.PI / 4, is80: true },
    { x: 302, z: -270, rot: 0, is80: true },
  ];

  speedSignLocations.forEach(loc => {
    const post = new THREE.Mesh(postGeo, galvanizedSteelMat);
    post.position.set(loc.x, 1.4, loc.z);
    post.castShadow = true;
    scene.add(post);

    const sign = new THREE.Mesh(speedSignGeo, loc.is80 ? speedLimit80Mat : speedLimit65Mat);
    sign.position.set(loc.x, 2.2, loc.z + 0.03);
    sign.rotation.y = loc.rot;
    scene.add(sign);
  });

  // Inner High-Speed Ring Highway (Radius 280m)
  const HIGHWAY_RADIUS = 280;
  const hwPoints: THREE.Vector3[] = [];
  const hwSegments = 48;
  for (let s = 0; s <= hwSegments; s++) {
    const angle = (s / hwSegments) * Math.PI * 2;
    hwPoints.push(new THREE.Vector3(Math.cos(angle) * HIGHWAY_RADIUS, 0.02, Math.sin(angle) * HIGHWAY_RADIUS));
  }
  const hwCurve = new THREE.CatmullRomCurve3(hwPoints);
  const hwGeo = new THREE.TubeGeometry(hwCurve, 96, 11, 6, true);
  hwGeo.scale(1, 0.01, 1);
  const highwayMesh = new THREE.Mesh(hwGeo, asphaltMat);
  highwayMesh.receiveShadow = true;
  scene.add(highwayMesh);

  // Grand Outer Ring Expressway (Radius 450m - 900m diameter super-speed ring!)
  const HIGHWAY_RADIUS_OUTER = 450;
  const hwOuterPoints: THREE.Vector3[] = [];
  const hwOuterSegments = 64;
  for (let s = 0; s <= hwOuterSegments; s++) {
    const angle = (s / hwOuterSegments) * Math.PI * 2;
    hwOuterPoints.push(new THREE.Vector3(Math.cos(angle) * HIGHWAY_RADIUS_OUTER, 0.02, Math.sin(angle) * HIGHWAY_RADIUS_OUTER));
  }
  const hwOuterCurve = new THREE.CatmullRomCurve3(hwOuterPoints);
  const hwOuterGeo = new THREE.TubeGeometry(hwOuterCurve, 128, 14, 6, true);
  hwOuterGeo.scale(1, 0.01, 1);
  const highwayOuterMesh = new THREE.Mesh(hwOuterGeo, asphaltMat);
  highwayOuterMesh.receiveShadow = true;
  scene.add(highwayOuterMesh);

  // Airport Super Drag Strip / 640m High-Speed Runway at East Corridor (X = 320)
  const runwayGeo = new THREE.PlaneGeometry(32, 640);
  runwayGeo.rotateX(-Math.PI / 2);
  const runwayMesh = new THREE.Mesh(runwayGeo, asphaltMat);
  runwayMesh.position.set(320, 0.02, 0);
  runwayMesh.receiveShadow = true;
  scene.add(runwayMesh);

  // Runway Centerline Dashes (Broad bright white aviation stripes)
  const runwayDashGeo = new THREE.PlaneGeometry(1.4, 16);
  runwayDashGeo.rotateX(-Math.PI / 2);
  const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  for (let rz = -290; rz <= 290; rz += 28) {
    const dash = new THREE.Mesh(runwayDashGeo, whitePaintMat);
    dash.position.set(320, 0.025, rz);
    dash.receiveShadow = true;
    scene.add(dash);
  }

  // Runway Threshold Piano-Key Zebra Bars
  const threshBarGeo = new THREE.PlaneGeometry(1.6, 12);
  threshBarGeo.rotateX(-Math.PI / 2);
  [-305, 305].forEach(threshZ => {
    for (let barX = 307; barX <= 333; barX += 3.2) {
      const bar = new THREE.Mesh(threshBarGeo, whitePaintMat);
      bar.position.set(barX, 0.026, threshZ);
      bar.receiveShadow = true;
      scene.add(bar);
    }
  });

  // Drag Strip Staging Christmas Tree at Start Line (X = 320, Z = -295)
  const treePole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 })
  );
  treePole.position.set(320, 2.1, -295);
  scene.add(treePole);

  const treeBulbColors = [0xf59e0b, 0xf59e0b, 0xf59e0b, 0x10b981]; // 3 Amber staging + 1 Green GO light
  treeBulbColors.forEach((col, idx) => {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 8),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.5 })
    );
    bulb.position.set(320, 1.4 + idx * 0.6, -295);
    scene.add(bulb);
  });

  // Drag Distance Overhead Gantry Signs (1/4 Mile & Finish)
  [
    { z: -295 + 200, label: '1/8 MILE' },
    { z: -295 + 402, label: '1/4 MILE' },
    { z: 295, label: 'FINISH' },
  ].forEach(mark => {
    const gantryGeo = new THREE.BoxGeometry(34, 0.8, 0.8);
    const gantry = new THREE.Mesh(gantryGeo, buildingMatB);
    gantry.position.set(320, 6.5, mark.z);
    scene.add(gantry);

    [-16, 16].forEach(legX => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7, 0.8), buildingMatB);
      leg.position.set(320 + legX, 3.5, mark.z);
      scene.add(leg);
    });
  });

  // Northwest Mountain Touge Drifting Pass (Winding S-Curves)
  const tougeCurvePoints = [
    new THREE.Vector3(-240, 0.03, -160),
    new THREE.Vector3(-290, 0.03, -190),
    new THREE.Vector3(-360, 0.03, -210),
    new THREE.Vector3(-410, 0.03, -260),
    new THREE.Vector3(-380, 0.03, -320),
    new THREE.Vector3(-310, 0.03, -350),
    new THREE.Vector3(-240, 0.03, -310),
  ];
  const tougeCurve = new THREE.CatmullRomCurve3(tougeCurvePoints);
  const tougeRoadGeo = new THREE.TubeGeometry(tougeCurve, 80, 7.5, 6, false);
  tougeRoadGeo.scale(1, 0.01, 1);
  const tougeRoadMesh = new THREE.Mesh(tougeRoadGeo, asphaltMat);
  tougeRoadMesh.receiveShadow = true;
  scene.add(tougeRoadMesh);

  // Red & White Alternating Racing Rumble Strips (Kerbs) along Touge apexes
  const kerbRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
  const kerbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  for (let k = 0; k < 60; k++) {
    const t = k / 60;
    const pt = tougeCurve.getPoint(t);
    const tangent = tougeCurve.getTangent(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    [-1, 1].forEach(side => {
      const kerbMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.14, 1.8),
        k % 2 === 0 ? kerbRedMat : kerbWhiteMat
      );
      kerbMesh.position.set(
        pt.x + normal.x * (side * 7.8),
        0.06,
        pt.z + normal.z * (side * 7.8)
      );
      kerbMesh.rotation.y = Math.atan2(tangent.x, tangent.z);
      scene.add(kerbMesh);
    });
  }

  // 5. Instanced Center Road Dashes (Combines 400+ meshes into 1 draw call!)
  const dashMatrices: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();

  ROAD_COORDS.forEach(rx => {
    for (let z = -CITY_SPAN / 2 + 6; z < CITY_SPAN / 2 - 6; z += 6) {
      if (Math.abs(z % 12) < 6) {
        dummy.position.set(rx, 0.02, z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(0.35, 3.2, 1);
        dummy.updateMatrix();
        dashMatrices.push(dummy.matrix.clone());
      }
    }
  });

  ROAD_COORDS.forEach(rz => {
    for (let x = -CITY_SPAN / 2 + 6; x < CITY_SPAN / 2 - 6; x += 6) {
      if (Math.abs(x % 12) < 6) {
        dummy.position.set(x, 0.02, rz);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(3.2, 0.35, 1);
        dummy.updateMatrix();
        dashMatrices.push(dummy.matrix.clone());
      }
    }
  });

  const dashPlaneGeo = new THREE.PlaneGeometry(1, 1);
  const instancedDashes = new THREE.InstancedMesh(dashPlaneGeo, roadYellowMat, dashMatrices.length);
  dashMatrices.forEach((mat, i) => instancedDashes.setMatrixAt(i, mat));
  instancedDashes.instanceMatrix.needsUpdate = true;
  instancedDashes.receiveShadow = true;
  scene.add(instancedDashes);

  // 6. Instanced Road Reflectors (Cat-eyes along center line)
  const reflectorMatrices: THREE.Matrix4[] = [];
  ROAD_COORDS.forEach(rx => {
    for (let z = -CITY_SPAN / 2 + 6; z < CITY_SPAN / 2 - 6; z += 12) {
      dummy.position.set(rx, 0.04, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.2, 0.06, 0.2);
      dummy.updateMatrix();
      reflectorMatrices.push(dummy.matrix.clone());
    }
  });
  ROAD_COORDS.forEach(rz => {
    for (let x = -CITY_SPAN / 2 + 6; x < CITY_SPAN / 2 - 6; x += 12) {
      dummy.position.set(x, 0.04, rz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.2, 0.06, 0.2);
      dummy.updateMatrix();
      reflectorMatrices.push(dummy.matrix.clone());
    }
  });

  const reflectorGeo = new THREE.BoxGeometry(1, 1, 1);
  const instancedReflectors = new THREE.InstancedMesh(reflectorGeo, roadReflectorMat, reflectorMatrices.length);
  reflectorMatrices.forEach((mat, i) => instancedReflectors.setMatrixAt(i, mat));
  instancedReflectors.instanceMatrix.needsUpdate = true;
  scene.add(instancedReflectors);

  // 7. Instanced Sidewalk Curbs & Racing Kerbs (Low profile 0.08m with driveway cutout for garage)
  const curbMatrices: THREE.Matrix4[] = [];
  const sideOffset = ROAD_WIDTH * 0.46;

  // Add sidewalks alongside roads
  ROAD_COORDS.forEach(rx => {
    [-1, 1].forEach(side => {
      dummy.position.set(rx + side * (sideOffset + 1.6), 0.04, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(2.8, 0.08, CITY_SPAN + 8);
      dummy.updateMatrix();
      curbMatrices.push(dummy.matrix.clone());
    });
  });
  ROAD_COORDS.forEach(rz => {
    [-1, 1].forEach(side => {
      // If along the main street (rz === 0) on the south side (side === -1), split curb to leave wide driveway for Apex Garage
      if (rz === 0 && side === -1) {
        // Left segment up to garage driveway (x = -CITY_SPAN / 2 to 24)
        const leftLen = 24 - (-CITY_SPAN / 2);
        dummy.position.set(-CITY_SPAN / 2 + leftLen / 2, 0.04, rz + side * (sideOffset + 1.6));
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(leftLen, 0.08, 2.8);
        dummy.updateMatrix();
        curbMatrices.push(dummy.matrix.clone());

        // Right segment after garage driveway (x = 66 to CITY_SPAN / 2)
        const rightLen = CITY_SPAN / 2 - 66;
        dummy.position.set(66 + rightLen / 2, 0.04, rz + side * (sideOffset + 1.6));
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(rightLen, 0.08, 2.8);
        dummy.updateMatrix();
        curbMatrices.push(dummy.matrix.clone());
      } else {
        dummy.position.set(0, 0.04, rz + side * (sideOffset + 1.6));
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(CITY_SPAN + 8, 0.08, 2.8);
        dummy.updateMatrix();
        curbMatrices.push(dummy.matrix.clone());
      }
    });
  });

  const curbBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const instancedCurbs = new THREE.InstancedMesh(curbBoxGeo, sidewalkMat, curbMatrices.length);
  curbMatrices.forEach((mat, i) => instancedCurbs.setMatrixAt(i, mat));
  instancedCurbs.instanceMatrix.needsUpdate = true;
  instancedCurbs.receiveShadow = true;
  scene.add(instancedCurbs);

  // 8. Instanced Street Lamps (Poles & Glowing Heads)
  const lampPoleMatrices: THREE.Matrix4[] = [];
  const lampArmMatrices: THREE.Matrix4[] = [];
  const lampBulbMatrices: THREE.Matrix4[] = [];

  ROAD_COORDS.forEach(rx => {
    ROAD_COORDS.forEach(rz => {
      // Corner pole
      dummy.position.set(rx + 11.2, 3.8, rz + 11.2);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.18, 7.6, 0.18);
      dummy.updateMatrix();
      lampPoleMatrices.push(dummy.matrix.clone());

      // Arm reaching toward road
      dummy.position.set(rx + 10.1, 7.5, rz + 11.2);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(2.4, 0.14, 0.14);
      dummy.updateMatrix();
      lampArmMatrices.push(dummy.matrix.clone());

      // Glowing bulb
      dummy.position.set(rx + 9.0, 7.3, rz + 11.2);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.5, 0.5, 0.5);
      dummy.updateMatrix();
      lampBulbMatrices.push(dummy.matrix.clone());
    });
  });

  const poleGeo = new THREE.CylinderGeometry(1, 1.2, 1, 8);
  const armGeo = new THREE.BoxGeometry(1, 1, 1);
  const bulbGeo = new THREE.SphereGeometry(1, 10, 8);

  const instancedPoles = new THREE.InstancedMesh(poleGeo, buildingMatB, lampPoleMatrices.length);
  lampPoleMatrices.forEach((m, i) => instancedPoles.setMatrixAt(i, m));
  instancedPoles.instanceMatrix.needsUpdate = true;
  scene.add(instancedPoles);

  const instancedArms = new THREE.InstancedMesh(armGeo, buildingMatB, lampArmMatrices.length);
  lampArmMatrices.forEach((m, i) => instancedArms.setMatrixAt(i, m));
  instancedArms.instanceMatrix.needsUpdate = true;
  scene.add(instancedArms);

  const instancedBulbs = new THREE.InstancedMesh(bulbGeo, streetlightMat, lampBulbMatrices.length);
  lampBulbMatrices.forEach((m, i) => instancedBulbs.setMatrixAt(i, m));
  instancedBulbs.instanceMatrix.needsUpdate = true;
  scene.add(instancedBulbs);

  // 9. Instanced Palm Trees Along Avenues
  const treeTrunkMatrices: THREE.Matrix4[] = [];
  const treeFoliageMatrices: THREE.Matrix4[] = [];

  ROAD_COORDS.forEach(rx => {
    [-1, 1].forEach(side => {
      for (let z = -CITY_SPAN / 2 + 25; z < CITY_SPAN / 2 - 25; z += 35) {
        if (Math.abs(z) < 20 || Math.abs(z % 80) < 18) continue; // Skip intersections
        const tx = rx + side * (sideOffset + 4.2);
        const tz = z;

        dummy.position.set(tx, 3.2, tz);
        dummy.rotation.set(0.04, Math.sin(tx + tz), 0);
        dummy.scale.set(0.35, 6.4, 0.35);
        dummy.updateMatrix();
        treeTrunkMatrices.push(dummy.matrix.clone());

        dummy.position.set(tx, 6.8, tz);
        dummy.rotation.set(0, Math.cos(tx), 0);
        dummy.scale.set(3.2, 2.5, 3.2);
        dummy.updateMatrix();
        treeFoliageMatrices.push(dummy.matrix.clone());
      }
    });
  });

  if (treeTrunkMatrices.length > 0) {
    const trunkGeo = new THREE.CylinderGeometry(0.7, 1.0, 1, 6);
    const foliageGeo = new THREE.ConeGeometry(1, 1.5, 6);

    const instancedTrunks = new THREE.InstancedMesh(trunkGeo, treeTrunkMat, treeTrunkMatrices.length);
    treeTrunkMatrices.forEach((m, i) => instancedTrunks.setMatrixAt(i, m));
    instancedTrunks.instanceMatrix.needsUpdate = true;
    scene.add(instancedTrunks);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, treeFoliageMat, treeFoliageMatrices.length);
    treeFoliageMatrices.forEach((m, i) => instancedFoliage.setMatrixAt(i, m));
    instancedFoliage.instanceMatrix.needsUpdate = true;
    instancedFoliage.castShadow = true;
    scene.add(instancedFoliage);
  }

  // 10. Instanced Windows on Buildings
  const windowMatrices: THREE.Matrix4[] = [];

  // Buildings & Skyscrapers
  for (let ix = 0; ix < ROAD_COORDS.length - 1; ix++) {
    for (let iz = 0; iz < ROAD_COORDS.length - 1; iz++) {
      const centerX = (ROAD_COORDS[ix] + ROAD_COORDS[ix + 1]) / 2;
      const centerZ = (ROAD_COORDS[iz] + ROAD_COORDS[iz + 1]) / 2;

      // Leave center plaza open (0, 0 block)
      if (Math.abs(centerX) < 40 && Math.abs(centerZ) < 40) continue;

      // Reserve block (40, -40) for Apex Tuning Garage Workshop
      if (Math.abs(centerX - 40) < 10 && Math.abs(centerZ - -40) < 10) continue;

      // Dock zone in the north-east corner
      if (centerX > 70 && centerZ > 70) continue;

      const subBuildings = 3;
      for (let sb = 0; sb < subBuildings; sb++) {
        const ox = (sb === 0 ? -12 : sb === 1 ? 14 : 0);
        const oz = (sb === 0 ? 12 : sb === 1 ? -12 : -10);
        const bw = 18 + (sb * 5);
        const bd = 18 + ((2 - sb) * 5);
        const bh = 30 + Math.floor((Math.sin(centerX * 11 + centerZ * 7 + sb) * 0.5 + 0.5) * 65);

        const bMat = sb === 0 ? buildingMatA : sb === 1 ? buildingMatB : glassBuildingMat;
        const bGeo = new THREE.BoxGeometry(bw, bh, bd);
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(centerX + ox, bh / 2, centerZ + oz);
        addBoxObstacle(building, bw / 2, bh / 2, bd / 2);

        // Window Rows / Lit Panels (Collected into InstancedMesh)
        const winRows = Math.min(8, Math.floor(bh / 9));
        for (let wr = 1; wr < winRows; wr++) {
          dummy.position.set(centerX + ox, wr * 8 + 4, centerZ + oz + bd / 2 + 0.05);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(bw * 0.72, 1.6, 1);
          dummy.updateMatrix();
          windowMatrices.push(dummy.matrix.clone());
        }

        // Rooftop glowing neon billboard
        if (sb === 2 && bh > 55) {
          const neonMat = neonMaterials[Math.floor(Math.random() * neonMaterials.length)];
          const signGeo = new THREE.BoxGeometry(bw * 0.65, 3.5, 0.6);
          const sign = new THREE.Mesh(signGeo, neonMat);
          sign.position.set(centerX + ox, bh + 2.2, centerZ + oz);
          scene.add(sign);
        }
      }
    }
  }

  if (windowMatrices.length > 0) {
    const winPlane = new THREE.PlaneGeometry(1, 1);
    const instancedWindows = new THREE.InstancedMesh(winPlane, windowLitMat, windowMatrices.length);
    windowMatrices.forEach((m, i) => instancedWindows.setMatrixAt(i, m));
    instancedWindows.instanceMatrix.needsUpdate = true;
    scene.add(instancedWindows);
  }

  // 10b. Apex Tuning Garage & Open Drive-In Workshop Complex (Location: x: 45, z: -42)
  // 1. Smooth asphalt driveway connecting main avenue (z = -9) directly to garage apron
  const drivewayGeo = new THREE.PlaneGeometry(42, 20);
  drivewayGeo.rotateX(-Math.PI / 2);
  const drivewayMesh = new THREE.Mesh(drivewayGeo, asphaltMat);
  drivewayMesh.position.set(45, 0.02, -19);
  drivewayMesh.receiveShadow = true;
  scene.add(drivewayMesh);

  // 2. Garage Forecourt Parking Apron
  const garageApronGeo = new THREE.PlaneGeometry(46, 16);
  garageApronGeo.rotateX(-Math.PI / 2);
  const garageApronMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.15,
  });
  const garageApron = new THREE.Mesh(garageApronGeo, garageApronMat);
  garageApron.position.set(45, 0.025, -28);
  garageApron.receiveShadow = true;
  scene.add(garageApron);

  // 3. Workshop High-Gloss Polished Epoxy Interior Floor
  const workshopFloorGeo = new THREE.PlaneGeometry(36, 24);
  workshopFloorGeo.rotateX(-Math.PI / 2);
  const epoxyMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.18,
    metalness: 0.45,
    envMapIntensity: 1.8,
  });
  const workshopFloor = new THREE.Mesh(workshopFloorGeo, epoxyMat);
  workshopFloor.position.set(45, 0.03, -44);
  workshopFloor.receiveShadow = true;
  scene.add(workshopFloor);

  // Yellow & black safety hazard caution boundary line at entrance
  const cautionLineGeo = new THREE.PlaneGeometry(34, 0.8);
  cautionLineGeo.rotateX(-Math.PI / 2);
  const cautionLineMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
  });
  const cautionLine = new THREE.Mesh(cautionLineGeo, cautionLineMat);
  cautionLine.position.set(45, 0.035, -32.2);
  scene.add(cautionLine);

  // 4. Open Drive-In Building Structure (PERIMETER WALLS ONLY - ENTRANCE AND INTERIOR ARE COMPLETELY OPEN!)
  const garageWallMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.4,
    metalness: 0.6,
  });

  // Left Wall (x: 27, z: -44)
  const leftWallGeo = new THREE.BoxGeometry(1.6, 8.5, 24);
  const leftWall = new THREE.Mesh(leftWallGeo, garageWallMat);
  leftWall.position.set(27, 4.25, -44);
  addBoxObstacle(leftWall, 0.8, 4.25, 12, true);

  // Right Wall (x: 63, z: -44)
  const rightWallGeo = new THREE.BoxGeometry(1.6, 8.5, 24);
  const rightWall = new THREE.Mesh(rightWallGeo, garageWallMat);
  rightWall.position.set(63, 4.25, -44);
  addBoxObstacle(rightWall, 0.8, 4.25, 12, true);

  // Back Wall (x: 45, z: -56)
  const backWallGeo = new THREE.BoxGeometry(37.6, 8.5, 1.6);
  const backWall = new THREE.Mesh(backWallGeo, garageWallMat);
  backWall.position.set(45, 4.25, -56);
  addBoxObstacle(backWall, 18.8, 4.25, 0.8, true);

  // Entrance Pillars (Corners only)
  const pillarGeo = new THREE.BoxGeometry(1.6, 8.5, 1.6);
  const leftPillar = new THREE.Mesh(pillarGeo, garageWallMat);
  leftPillar.position.set(27, 4.25, -32);
  addBoxObstacle(leftPillar, 0.8, 4.25, 0.8, true);

  const rightPillar = new THREE.Mesh(pillarGeo, garageWallMat);
  rightPillar.position.set(63, 4.25, -32);
  addBoxObstacle(rightPillar, 0.8, 4.25, 0.8, true);

  // Overhead Entrance Lintel (High above at y: 7.7 - Car drives underneath with ample clearance)
  const lintelGeo = new THREE.BoxGeometry(37.6, 1.6, 1.6);
  const lintelMesh = new THREE.Mesh(lintelGeo, garageWallMat);
  lintelMesh.position.set(45, 7.7, -32);
  scene.add(lintelMesh);

  // Overhead Roof & Canopy
  const roofGeo = new THREE.BoxGeometry(38, 0.5, 25);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.6 });
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(45, 8.75, -44);
  scene.add(roofMesh);

  // Overhanging Front Canopy
  const frontCanopyGeo = new THREE.BoxGeometry(38, 0.4, 7);
  const frontCanopy = new THREE.Mesh(frontCanopyGeo, garageWallMat);
  frontCanopy.position.set(45, 8.4, -28.5);
  scene.add(frontCanopy);

  // 5. Interior Workshop Elements: Twin Hydraulic 2-Post Vehicle Lifts
  const liftYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.3,
    metalness: 0.7,
  });
  const liftBlueMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.35,
    metalness: 0.6,
  });

  // Central Primary Lift at x: 45, z: -42 (Where player parks for service)
  [-3.2, 3.2].forEach(lx => {
    const postGeo = new THREE.BoxGeometry(0.5, 4.2, 0.5);
    const postMesh = new THREE.Mesh(postGeo, liftYellowMat);
    postMesh.position.set(45 + lx, 2.1, -42);
    postMesh.castShadow = true;
    scene.add(postMesh);

    // Lift horizontal arm
    const armGeo = new THREE.BoxGeometry(1.6, 0.16, 0.25);
    const armMesh = new THREE.Mesh(armGeo, liftBlueMat);
    armMesh.position.set(45 + (lx > 0 ? 2.3 : -2.3), 0.35, -42);
    scene.add(armMesh);
  });

  // Secondary Lift Bay at x: 35, z: -42
  [-3.0, 3.0].forEach(lx => {
    const postGeo = new THREE.BoxGeometry(0.45, 4.2, 0.45);
    const postMesh = new THREE.Mesh(postGeo, liftYellowMat);
    postMesh.position.set(35 + lx, 2.1, -42);
    scene.add(postMesh);
  });

  // Dyno Rollers in ground at Bay 2
  const dynoRollerGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.2, 16);
  dynoRollerGeo.rotateZ(Math.PI / 2);
  const dynoMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
  [-0.6, 0.6].forEach(dz => {
    const roller = new THREE.Mesh(dynoRollerGeo, dynoMat);
    roller.position.set(35, 0.05, -42 + dz);
    scene.add(roller);
  });

  // Dyno Diagnostic Console Computer Tower
  const dynoTowerGeo = new THREE.BoxGeometry(1.2, 2.4, 0.8);
  const dynoTowerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const dynoTower = new THREE.Mesh(dynoTowerGeo, dynoTowerMat);
  dynoTower.position.set(31, 1.2, -42);
  scene.add(dynoTower);

  const dynoScreenGeo = new THREE.PlaneGeometry(0.9, 0.7);
  const dynoScreenMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const dynoScreen = new THREE.Mesh(dynoScreenGeo, dynoScreenMat);
  dynoScreen.position.set(31, 1.8, -41.59);
  scene.add(dynoScreen);

  // Red Snap-on Tool Cabinets & Workbench along Back Wall (z = -54.8)
  const toolCabinetMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.25,
    metalness: 0.7,
  });
  [-8, 0, 8].forEach(ox => {
    const cabinetGeo = new THREE.BoxGeometry(3.6, 1.8, 1.2);
    const cabinet = new THREE.Mesh(cabinetGeo, toolCabinetMat);
    cabinet.position.set(45 + ox, 0.9, -54.8);
    cabinet.castShadow = true;
    scene.add(cabinet);

    // Chrome cabinet top workbench
    const topGeo = new THREE.BoxGeometry(3.7, 0.1, 1.3);
    const topMesh = new THREE.Mesh(topGeo, dynoMat);
    topMesh.position.set(45 + ox, 1.85, -54.8);
    scene.add(topMesh);
  });

  // Tire Racks with Racing Slicks along Left Wall (x: 28.5)
  const tireRackGeo = new THREE.BoxGeometry(1.2, 3.2, 6.0);
  const tireRackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  const tireRack = new THREE.Mesh(tireRackGeo, tireRackMat);
  tireRack.position.set(28.5, 1.6, -48);
  scene.add(tireRack);

  // Nitrous refill station & oil barrels in right corner (x: 61, z: -53)
  const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 12);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.7 });
  [0, 1.1].forEach((bx, idx) => {
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(60.5 + bx * 0.8, 0.7, -53.5 + idx * 0.6);
    scene.add(barrel);
  });

  // 6. Overhead Industrial Fluorescent Lighting Strips inside Workshop
  const bayTubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [36, 45, 54].forEach(lx => {
    [-38, -48].forEach(lz => {
      const tubeGeo = new THREE.BoxGeometry(0.3, 0.15, 6.5);
      const tube = new THREE.Mesh(tubeGeo, bayTubeMat);
      tube.position.set(lx, 8.4, lz);
      scene.add(tube);
    });
  });

  // Interior Overhead Flood Light
  const garageInteriorLight = new THREE.PointLight(0xfff5ea, 2.4, 32);
  garageInteriorLight.position.set(45, 7.5, -43);
  scene.add(garageInteriorLight);

  // 7. High-Impact Illuminated Neon Entrance Signage
  const signBackGeo = new THREE.BoxGeometry(32, 2.6, 0.5);
  const signBackMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.8 });
  const signBack = new THREE.Mesh(signBackGeo, signBackMat);
  signBack.position.set(45, 9.8, -31.7);
  scene.add(signBack);

  const signNeonCyan = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });
  const signNeonAmber = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });
  const signNeonGreen = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 2.4,
    roughness: 0.1,
  });

  // Top Neon Bar: "APEX PERFORMANCE TUNING"
  const signBarTop = new THREE.Mesh(new THREE.BoxGeometry(30, 0.35, 0.6), signNeonCyan);
  signBarTop.position.set(45, 10.7, -31.5);
  scene.add(signBarTop);

  // Bottom Neon Bar: "DRIVE-IN SERVICE BAY"
  const signBarBottom = new THREE.Mesh(new THREE.BoxGeometry(30, 0.35, 0.6), signNeonAmber);
  signBarBottom.position.set(45, 8.9, -31.5);
  scene.add(signBarBottom);

  // Welcome Chevron Markers on Entrance Lintel: ">>> DRIVE IN >>>"
  [-8, -4, 0, 4, 8].forEach(cx => {
    const chevronGeo = new THREE.BoxGeometry(1.8, 0.3, 0.4);
    const chevron = new THREE.Mesh(chevronGeo, signNeonGreen);
    chevron.position.set(45 + cx, 7.7, -31.8);
    scene.add(chevron);
  });

  // 8. Holographic Service Lift Pad on Ground (at 45, -42 inside workshop)
  const padRingGeo = new THREE.RingGeometry(2.4, 3.6, 32);
  padRingGeo.rotateX(-Math.PI / 2);
  const padRingMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const padRing = new THREE.Mesh(padRingGeo, padRingMat);
  padRing.position.set(45, 0.08, -42);
  scene.add(padRing);

  const padInnerGeo = new THREE.CircleGeometry(2.2, 32);
  padInnerGeo.rotateX(-Math.PI / 2);
  const padInnerMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const padInner = new THREE.Mesh(padInnerGeo, padInnerMat);
  padInner.position.set(45, 0.07, -42);
  scene.add(padInner);

  // Floating Rotating 3D Golden Wrench Beacon above Lift at [45, 3.2, -42]
  const garageBeaconGroup = new THREE.Group();
  garageBeaconGroup.position.set(45, 3.2, -42);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 1.4,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Wrench Handle
  const wrenchHandle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.15), goldMat);
  garageBeaconGroup.add(wrenchHandle);

  // Wrench Open Head (Top)
  const wrenchHeadTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 16), goldMat);
  wrenchHeadTop.rotation.x = Math.PI / 2;
  wrenchHeadTop.position.set(0, 1.1, 0);
  garageBeaconGroup.add(wrenchHeadTop);

  // Wrench Ring Head (Bottom)
  const wrenchRingBottom = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.14, 12, 24), goldMat);
  wrenchRingBottom.position.set(0, -1.1, 0);
  garageBeaconGroup.add(wrenchRingBottom);

  // Holographic Light Pillar shining through the roof skylight
  const lightPillarGeo = new THREE.CylinderGeometry(0.4, 0.4, 25, 16, 1, true);
  const lightPillarMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const lightPillar = new THREE.Mesh(lightPillarGeo, lightPillarMat);
  lightPillar.position.set(45, 12.5, -42);
  scene.add(lightPillar);

  scene.add(garageBeaconGroup);

  // 11. Distant Mountain Skyline Ring (Expanded for 1440m+ world)
  const mountainGeo = new THREE.CylinderGeometry(1480, 1600, 140, 48, 1, true);
  const mountainMat = new THREE.MeshBasicMaterial({
    color: 0x1e293b,
    side: THREE.BackSide,
  });
  const mountains = new THREE.Mesh(mountainGeo, mountainMat);
  mountains.position.y = 45;
  scene.add(mountains);

  // 12. Industrial Shipping Docks & Stunt Yard
  for (let cx = 0; cx < 4; cx++) {
    for (let cz = 0; cz < 4; cz++) {
      if (Math.random() > 0.3) {
        const conW = 3.2;
        const conH = 3.0;
        const conL = 7.5;
        const conColor = containerColors[(cx + cz) % containerColors.length];
        const conMat = new THREE.MeshStandardMaterial({ color: conColor, roughness: 0.5, metalness: 0.6 });

        const stackHeight = 1 + Math.floor(Math.random() * 2);
        for (let sh = 0; sh < stackHeight; sh++) {
          const conGeo = new THREE.BoxGeometry(conW, conH, conL);
          const conMesh = new THREE.Mesh(conGeo, conMat);
          conMesh.position.set(100 + cx * 9, sh * conH + conH / 2, 100 + cz * 12);
          addBoxObstacle(conMesh, conW / 2, conH / 2, conL / 2);
        }
      }
    }
  }

  // Harbor Canal with reflective water
  const waterGeo = new THREE.PlaneGeometry(85, 140);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(165, 0.05, 120);
  scene.add(waterMesh);

  // 13. Stunt Ramps
  const rampMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.35,
    metalness: 0.4,
    envMapIntensity: 1.4,
  });

  const rampData = [
    { x: -40, z: -10, w: 10, l: 16, h: 4.5, rotY: 0 },
    { x: 0, z: 50, w: 12, l: 20, h: 5.5, rotY: Math.PI },
    { x: 80, z: -35, w: 10, l: 18, h: 5.0, rotY: 0 },
    { x: 120, z: 85, w: 12, l: 22, h: 6.0, rotY: Math.PI / 2 },
  ];

  for (const rd of rampData) {
    const rampGroup = new THREE.Group();
    const rampPlaneGeo = new THREE.PlaneGeometry(rd.w, Math.sqrt(rd.l * rd.l + rd.h * rd.h));
    const angle = Math.atan2(rd.h, rd.l);
    rampPlaneGeo.rotateX(-angle);

    const rampMesh = new THREE.Mesh(rampPlaneGeo, rampMat);
    rampMesh.position.set(0, rd.h / 2, rd.l / 2);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampGroup.add(rampMesh);

    const supportGeo = new THREE.BoxGeometry(0.5, rd.h, rd.l);
    const suppL = new THREE.Mesh(supportGeo, buildingMatB);
    suppL.position.set(-rd.w / 2, rd.h / 2, rd.l / 2);
    const suppR = new THREE.Mesh(supportGeo, buildingMatB);
    suppR.position.set(rd.w / 2, rd.h / 2, rd.l / 2);
    rampGroup.add(suppL, suppR);

    rampGroup.position.set(rd.x, 0, rd.z);
    rampGroup.rotation.y = rd.rotY;
    scene.add(rampGroup);

    const normal = new THREE.Vector3(0, Math.cos(angle), -Math.sin(angle)).applyAxisAngle(new THREE.Vector3(0, 1, 0), rd.rotY);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(rd.x, 0, rd.z));

    const halfW = rd.w / 2;
    const isRotX = Math.abs(Math.sin(rd.rotY)) > 0.7;
    const spanX = isRotX ? rd.l : halfW;
    const spanZ = isRotX ? halfW : rd.l;
    colliders.push({
      type: 'ramp',
      rampPlane: plane,
      rampBounds: {
        minX: rd.x - spanX,
        maxX: rd.x + spanX,
        minZ: rd.z - spanZ,
        maxZ: rd.z + spanZ,
        height: rd.h,
      },
    });
  }

  // =========================================================================
  // 13b. BIOME A: APEX INTERNATIONAL AIRPORT & 1000M DRAG STRIP RUNWAY (WEST)
  // Coordinates: X: -620 to -420, Z: -500 to +500
  // =========================================================================
  const airportAsphaltMat = new THREE.MeshStandardMaterial({
    color: 0x1e2229,
    roughness: 0.68,
    metalness: 0.1,
  });
  const aviationMarkingMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
  });

  // Main 1000m Runway Strip (X = -520, Z = -500 to +500, width = 42m)
  const runway1000Geo = new THREE.PlaneGeometry(42, 1000);
  runway1000Geo.rotateX(-Math.PI / 2);
  const runway1000Mesh = new THREE.Mesh(runway1000Geo, airportAsphaltMat);
  runway1000Mesh.position.set(-520, 0.022, 0);
  runway1000Mesh.receiveShadow = true;
  scene.add(runway1000Mesh);

  // Runway Centerline Dashes (Broad bright white aviation stripes every 25m)
  const rwDashGeo = new THREE.PlaneGeometry(1.8, 16);
  rwDashGeo.rotateX(-Math.PI / 2);
  for (let rz = -480; rz <= 480; rz += 28) {
    const dash = new THREE.Mesh(rwDashGeo, aviationMarkingMat);
    dash.position.set(-520, 0.026, rz);
    dash.receiveShadow = true;
    scene.add(dash);
  }

  // Runway Piano-Key Threshold Bars at both ends (-490 and +490)
  const rwPianoGeo = new THREE.PlaneGeometry(2.0, 16);
  rwPianoGeo.rotateX(-Math.PI / 2);
  [-490, 490].forEach(pz => {
    for (let bx = -537; bx <= -503; bx += 3.6) {
      const bar = new THREE.Mesh(rwPianoGeo, aviationMarkingMat);
      bar.position.set(bx, 0.027, pz);
      bar.receiveShadow = true;
      scene.add(bar);
    }
  });

  // Runway Edge Green/Amber Runway Guard Lights
  const rwLightGeo = new THREE.SphereGeometry(0.22, 8, 8);
  const rwGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2.2 });
  const rwAmberMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 2.2 });
  for (let lz = -480; lz <= 480; lz += 40) {
    [-541, -499].forEach((lx) => {
      const lMesh = new THREE.Mesh(rwLightGeo, (lz < -400 || lz > 400) ? rwGreenMat : rwAmberMat);
      lMesh.position.set(lx, 0.35, lz);
      scene.add(lMesh);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35), buildingMatB);
      post.position.set(lx, 0.175, lz);
      scene.add(post);
    });
  }

  // Parallel Taxiway & Connecting High-Speed Turnoffs
  const taxiwayGeo = new THREE.PlaneGeometry(24, 800);
  taxiwayGeo.rotateX(-Math.PI / 2);
  const taxiwayMesh = new THREE.Mesh(taxiwayGeo, asphaltMat);
  taxiwayMesh.position.set(-580, 0.021, 0);
  taxiwayMesh.receiveShadow = true;
  scene.add(taxiwayMesh);

  // Connecting turnoffs
  [-250, 0, 250].forEach(tz => {
    const turnoffGeo = new THREE.PlaneGeometry(38, 20);
    turnoffGeo.rotateX(-Math.PI / 2);
    const turnoffMesh = new THREE.Mesh(turnoffGeo, asphaltMat);
    turnoffMesh.position.set(-550, 0.021, tz);
    turnoffMesh.receiveShadow = true;
    scene.add(turnoffMesh);
  });

  // Airport Terminal Building & Control Tower
  const terminalGeo = new THREE.BoxGeometry(60, 14, 120);
  const terminalMesh = new THREE.Mesh(terminalGeo, buildingMatA);
  terminalMesh.position.set(-640, 7, -80);
  addBoxObstacle(terminalMesh, 30, 7, 60, true);

  // Control Tower
  const towerShaftGeo = new THREE.CylinderGeometry(4.5, 6.0, 48, 16);
  const towerShaft = new THREE.Mesh(towerShaftGeo, buildingMatB);
  towerShaft.position.set(-630, 24, -180);
  addBoxObstacle(towerShaft, 5, 24, 5, true);

  const towerDeckGeo = new THREE.CylinderGeometry(8.5, 6.5, 7, 16);
  const towerDeck = new THREE.Mesh(towerDeckGeo, glassMat);
  towerDeck.position.set(-630, 50, -180);
  scene.add(towerDeck);

  // Rotating Airport Beacon on Tower Roof
  const airportBeaconGroup = new THREE.Group();
  airportBeaconGroup.position.set(-630, 55, -180);
  const beaconHeadGeo = new THREE.BoxGeometry(1.6, 1.2, 2.8);
  const beaconHeadMesh = new THREE.Mesh(beaconHeadGeo, buildingMatB);
  airportBeaconGroup.add(beaconHeadMesh);
  const beaconLensG = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 3.5 })
  );
  beaconLensG.position.set(0, 0, 1.4);
  const beaconLensW = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 4.0 })
  );
  beaconLensW.position.set(0, 0, -1.4);
  airportBeaconGroup.add(beaconLensG, beaconLensW);
  scene.add(airportBeaconGroup);

  // 2 Massive Aircraft Hangars
  [-630].forEach(hx => {
    [80, 240].forEach((hz, hIdx) => {
      const hangarGeo = new THREE.BoxGeometry(52, 18, 70);
      const hangarMesh = new THREE.Mesh(
        hangarGeo,
        new THREE.MeshStandardMaterial({ color: hIdx === 0 ? 0x334155 : 0x1e293b, roughness: 0.5, metalness: 0.4 })
      );
      hangarMesh.position.set(hx, 9, hz);
      addBoxObstacle(hangarMesh, 26, 9, 35, true);

      // Open hangar bay door cutout
      const hangarDoorGeo = new THREE.PlaneGeometry(36, 14);
      const hangarDoor = new THREE.Mesh(
        hangarDoorGeo,
        new THREE.MeshBasicMaterial({ color: 0x09090b })
      );
      hangarDoor.position.set(hx + 26.1, 7, hz);
      hangarDoor.rotation.y = Math.PI / 2;
      scene.add(hangarDoor);
    });
  });

  // Parked Executive Private Jet Model on Hangar Apron
  const jetGroup = new THREE.Group();
  jetGroup.position.set(-580, 0, 160);
  jetGroup.rotation.y = Math.PI / 3;
  const fuselageGeo = new THREE.CylinderGeometry(1.6, 1.4, 22, 12);
  fuselageGeo.rotateX(Math.PI / 2);
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 });
  const fuselage = new THREE.Mesh(fuselageGeo, jetMat);
  fuselage.position.y = 2.4;
  jetGroup.add(fuselage);
  const wingsGeo = new THREE.BoxGeometry(20, 0.25, 3.8);
  const wings = new THREE.Mesh(wingsGeo, jetMat);
  wings.position.set(0, 2.2, 0);
  jetGroup.add(wings);
  const tailGeo = new THREE.BoxGeometry(0.3, 4.2, 3.2);
  const tail = new THREE.Mesh(tailGeo, jetMat);
  tail.position.set(0, 4.5, -9);
  jetGroup.add(tail);
  scene.add(jetGroup);
  colliders.push({
    type: 'box',
    box: new THREE.Box3(
      new THREE.Vector3(-592, 0, 148),
      new THREE.Vector3(-568, 6, 172)
    ),
  });

  // Drag Strip Staging Area at South End (X = -520, Z = -450)
  const dragXmasTree = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 5.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.8 })
  );
  dragXmasTree.position.set(-520, 2.5, -450);
  scene.add(dragXmasTree);
  [0x06b6d4, 0xf59e0b, 0xf59e0b, 0xf59e0b, 0x22c55e].forEach((bCol, bIdx) => {
    [-0.5, 0.5].forEach(side => {
      const bMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: bCol, emissive: bCol, emissiveIntensity: 2.0 })
      );
      bMesh.position.set(-520 + side, 1.2 + bIdx * 0.7, -450);
      scene.add(bMesh);
    });
  });

  // Finish Speed Gate Overhead Truss at Z = +450
  const dragFinishTruss = new THREE.Mesh(
    new THREE.BoxGeometry(44, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3 })
  );
  dragFinishTruss.position.set(-520, 7.5, 450);
  scene.add(dragFinishTruss);
  [-21, 21].forEach(lx => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 1.2), buildingMatB);
    post.position.set(-520 + lx, 4, 450);
    scene.add(post);
  });

  // =========================================================================
  // 13c. BIOME B: HIGHLAND TOUGE MOUNTAIN PASS & SUMMIT OVERLOOK (NORTH)
  // Coordinates: X: -350 to +350, Z: -680 to -450
  // =========================================================================
  const tougeAsphaltMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.72,
    metalness: 0.08,
  });
  const guardrailMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.85,
    roughness: 0.25,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x44403c,
    roughness: 0.95,
  });

  // Serpentine Touge Spine Curve
  const highlandPoints = [
    new THREE.Vector3(-340, 0.03, -460),
    new THREE.Vector3(-260, 2.5, -490),
    new THREE.Vector3(-180, 5.0, -560),
    new THREE.Vector3(-80, 8.5, -510),
    new THREE.Vector3(0, 12.0, -580),
    new THREE.Vector3(90, 8.0, -520),
    new THREE.Vector3(180, 5.5, -570),
    new THREE.Vector3(260, 2.5, -500),
    new THREE.Vector3(340, 0.03, -460),
  ];
  const highlandCurve = new THREE.CatmullRomCurve3(highlandPoints);
  const highlandGeo = new THREE.TubeGeometry(highlandCurve, 96, 8.5, 8, false);
  highlandGeo.scale(1, 0.015, 1);
  const highlandMesh = new THREE.Mesh(highlandGeo, tougeAsphaltMat);
  highlandMesh.receiveShadow = true;
  scene.add(highlandMesh);

  // Armco Steel Guardrails along mountain road outer edge
  for (let hi = 0; hi < 64; hi++) {
    const t = hi / 64;
    const pt = highlandCurve.getPoint(t);
    const tangent = highlandCurve.getTangent(t);
    const norm = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    [-1, 1].forEach(side => {
      const railGeo = new THREE.BoxGeometry(0.25, 0.7, 7.5);
      const rail = new THREE.Mesh(railGeo, guardrailMat);
      rail.position.set(pt.x + norm.x * (side * 9.2), pt.y + 0.45, pt.z + norm.z * (side * 9.2));
      rail.rotation.y = Math.atan2(tangent.x, tangent.z);
      scene.add(rail);

      // Guardrail post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), guardrailMat);
      post.position.set(pt.x + norm.x * (side * 9.2), pt.y + 0.4, pt.z + norm.z * (side * 9.2));
      scene.add(post);
    });
  }

  // Summit Observation Deck & Overlook Pavilion (X = 0, Z = -620)
  const summitPlazaGeo = new THREE.CylinderGeometry(28, 30, 2, 24);
  const summitPlaza = new THREE.Mesh(summitPlazaGeo, sidewalkMat);
  summitPlaza.position.set(0, 1.0, -620);
  scene.add(summitPlaza);
  colliders.push({
    type: 'box',
    box: new THREE.Box3(
      new THREE.Vector3(-28, 0, -648),
      new THREE.Vector3(28, 2.2, -592)
    ),
  });

  // Modernist Overlook Canopy
  const canopyRoof = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
  );
  canopyRoof.position.set(0, 6.5, -625);
  scene.add(canopyRoof);
  [-9, 9].forEach(px => {
    [-6, 6].forEach(pz => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6.5, 8), guardrailMat);
      col.position.set(px, 3.25, -625 + pz);
      addBoxObstacle(col, 0.4, 3.25, 0.4, true);
    });
  });

  // Rocky Mountain Crags & Pine Trees around Touge
  const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
  const pineFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });
  for (let rk = 0; rk < 28; rk++) {
    const rx = -320 + Math.random() * 640;
    const rz = -650 + Math.random() * 160;
    // Boulder
    const bGeo = new THREE.DodecahedronGeometry(2.5 + Math.random() * 4.5);
    const boulder = new THREE.Mesh(bGeo, rockMat);
    boulder.position.set(rx, 2.0, rz);
    boulder.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    scene.add(boulder);
    addBoxObstacle(boulder, 2.5, 2.5, 2.5);

    // Pine Tree
    const treeGroup = new THREE.Group();
    treeGroup.position.set(rx + 8, 0, rz + 8);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3), pineTrunkMat);
    trunk.position.y = 1.5;
    treeGroup.add(trunk);
    const fol1 = new THREE.Mesh(new THREE.ConeGeometry(2.8, 4.5, 8), pineFoliageMat);
    fol1.position.y = 4.5;
    const fol2 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.8, 8), pineFoliageMat);
    fol2.position.y = 7.0;
    treeGroup.add(fol1, fol2);
    scene.add(treeGroup);
  }

  // =========================================================================
  // 13d. BIOME C: COASTAL RIVIERA, OCEAN MARINA & LIGHTHOUSE (EAST)
  // Coordinates: X: +440 to +680, Z: -450 to +450
  // =========================================================================
  const oceanWaterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.12,
    metalness: 0.65,
    transparent: true,
    opacity: 0.88,
  });

  // Vast Ocean Water Surface (X: 470 to 760, Z: -720 to +720)
  const oceanGeo = new THREE.PlaneGeometry(300, 1440);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanWaterMat);
  oceanMesh.position.set(620, 0.05, 0);
  scene.add(oceanMesh);

  // Coastal Palm Promenade Boulevard Road (X = 440, Z = -450 to +450)
  const coastRoadGeo = new THREE.PlaneGeometry(24, 900);
  coastRoadGeo.rotateX(-Math.PI / 2);
  const coastRoadMesh = new THREE.Mesh(coastRoadGeo, asphaltMat);
  coastRoadMesh.position.set(440, 0.021, 0);
  coastRoadMesh.receiveShadow = true;
  scene.add(coastRoadMesh);

  // Concrete Seawall Barrier (X = 460, Z = -450 to +450)
  const seawallGeo = new THREE.BoxGeometry(2.4, 2.2, 900);
  const seawall = new THREE.Mesh(seawallGeo, sidewalkMat);
  seawall.position.set(460, 1.1, 0);
  addBoxObstacle(seawall, 1.2, 1.1, 450, true);

  // Seawall Stainless Steel Marine Bollards
  const bollardGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.9, 12);
  for (let bz = -440; bz <= 440; bz += 35) {
    const bollard = new THREE.Mesh(bollardGeo, guardrailMat);
    bollard.position.set(461, 2.5, bz);
    scene.add(bollard);
  }

  // 3 Marina Wooden Docks with Docked Luxury Yachts
  const woodPierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const yachtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });
  [-160, 0, 160].forEach((pz, pIdx) => {
    // Dock Pier extending 55m out into ocean
    const pierGeo = new THREE.BoxGeometry(60, 0.8, 6.0);
    const pier = new THREE.Mesh(pierGeo, woodPierMat);
    pier.position.set(490, 0.4, pz);
    addBoxObstacle(pier, 30, 0.4, 3.0);

    // Yacht moored alongside pier
    const yachtGroup = new THREE.Group();
    yachtGroup.position.set(510, 0.6, pz + (pIdx % 2 === 0 ? 8 : -8));
    const hullGeo = new THREE.BoxGeometry(22, 2.2, 5.2);
    const hull = new THREE.Mesh(hullGeo, yachtMat);
    yachtGroup.add(hull);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(11, 2.0, 4.0), glassMat);
    cabin.position.set(-2, 1.8, 0);
    yachtGroup.add(cabin);
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), guardrailMat);
    radarMast.position.set(-3, 3.8, 0);
    yachtGroup.add(radarMast);
    scene.add(yachtGroup);
  });

  // Coastal Lighthouse at Cape Point (X = 520, Z = 260)
  const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 4, 16), sidewalkMat);
  lhBase.position.set(520, 2.0, 260);
  addBoxObstacle(lhBase, 8, 2, 8, true);

  const lhTower = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 5.5, 34, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  lhTower.position.set(520, 21.0, 260);
  addBoxObstacle(lhTower, 4.5, 17, 4.5, true);

  // Rotating Maritime Lighthouse Beacon
  const lighthouseBeaconGroup = new THREE.Group();
  lighthouseBeaconGroup.position.set(520, 39.0, 260);
  const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 4.5, 16), glassMat);
  lighthouseBeaconGroup.add(lanternRoom);
  const lhLamp = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 5.0 })
  );
  lighthouseBeaconGroup.add(lhLamp);
  scene.add(lighthouseBeaconGroup);

  // =========================================================================
  // 13e. BIOME D: MEGASTUNT PROVING GROUNDS & SUPERPARK (SOUTH)
  // Coordinates: X: -350 to +350, Z: +450 to +680
  // =========================================================================
  const stuntArenaMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.55,
    metalness: 0.15,
  });
  const stuntNeonMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.8,
  });

  // Giant 420m x 220m Stunt Arena Plaza (X = 0, Z = 560)
  const arenaPlazaGeo = new THREE.PlaneGeometry(420, 220);
  arenaPlazaGeo.rotateX(-Math.PI / 2);
  const arenaPlaza = new THREE.Mesh(arenaPlazaGeo, stuntArenaMat);
  arenaPlaza.position.set(0, 0.022, 560);
  arenaPlaza.receiveShadow = true;
  scene.add(arenaPlaza);

  // Mega Launch Jump Ramp (Center: X = 0, Z = 490, facing South)
  const megaJumpW = 28;
  const megaJumpL = 36;
  const megaJumpH = 9.5;
  const megaAngle = Math.atan2(megaJumpH, megaJumpL);
  const megaJumpPlane = new THREE.PlaneGeometry(megaJumpW, Math.sqrt(megaJumpL * megaJumpL + megaJumpH * megaJumpH));
  megaJumpPlane.rotateX(-megaAngle);
  const megaJumpMesh = new THREE.Mesh(
    megaJumpPlane,
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 })
  );
  megaJumpMesh.position.set(0, megaJumpH / 2, 490 + megaJumpL / 2);
  megaJumpMesh.receiveShadow = true;
  scene.add(megaJumpMesh);
  const megaNormal = new THREE.Vector3(0, Math.cos(megaAngle), -Math.sin(megaAngle));
  colliders.push({
    type: 'ramp',
    rampPlane: new THREE.Plane().setFromNormalAndCoplanarPoint(megaNormal, new THREE.Vector3(0, 0, 490)),
    rampBounds: {
      minX: -megaJumpW / 2,
      maxX: megaJumpW / 2,
      minZ: 490,
      maxZ: 490 + megaJumpL,
      height: megaJumpH,
    },
  });

  // Downslope Landing Ramp at Z = 570
  const landingPlane = new THREE.PlaneGeometry(megaJumpW, Math.sqrt(megaJumpL * megaJumpL + megaJumpH * megaJumpH));
  landingPlane.rotateX(megaAngle);
  const landingMesh = new THREE.Mesh(landingPlane, stuntArenaMat);
  landingMesh.position.set(0, megaJumpH / 2, 570 + megaJumpL / 2);
  landingMesh.receiveShadow = true;
  scene.add(landingMesh);

  // Twin 360-Degree Corkscrew Stunt Tubes at X = -140 and +140, Z = 560
  [-140, 140].forEach(sx => {
    const loopGeo = new THREE.TorusGeometry(12, 2.2, 16, 32, Math.PI * 1.5);
    const loopMesh = new THREE.Mesh(loopGeo, stuntNeonMat);
    loopMesh.position.set(sx, 12, 560);
    loopMesh.rotation.y = Math.PI / 2;
    scene.add(loopMesh);
  });

  // High-Speed Banked Bowl Velodrome Curve (East Rim of Arena, X = 180, Z = 560)
  const bowlGeo = new THREE.CylinderGeometry(36, 42, 6, 24, 1, true);
  const bowlMesh = new THREE.Mesh(bowlGeo, buildingMatB);
  bowlMesh.position.set(180, 3, 560);
  scene.add(bowlMesh);

  // Stadium Spectator Grandstand along South Rim (Z = 660, X = -120 to +120)
  const grandstandGeo = new THREE.BoxGeometry(240, 16, 24);
  const grandstand = new THREE.Mesh(grandstandGeo, buildingMatA);
  grandstand.position.set(0, 8, 660);
  addBoxObstacle(grandstand, 120, 8, 12, true);

  // 14. Checkpoint Visuals
  const checkpointGroup = new THREE.Group();
  scene.add(checkpointGroup);
  const checkpointMeshes: THREE.Mesh[] = [];

  function setCheckpoints(points: [number, number, number][], activeIdx: number = 0) {
    while (checkpointGroup.children.length > 0) {
      checkpointGroup.remove(checkpointGroup.children[0]);
    }
    checkpointMeshes.length = 0;

    points.forEach((pt, idx) => {
      const isCurrent = idx === activeIdx;
      const ringGeo = new THREE.TorusGeometry(3.5, 0.35, 12, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: isCurrent ? 0x22c55e : 0xf59e0b,
        emissive: isCurrent ? 0x22c55e : 0xf59e0b,
        emissiveIntensity: isCurrent ? 1.8 : 0.6,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pt[0], pt[1] + 2.5, pt[2]);
      checkpointGroup.add(ring);
      checkpointMeshes.push(ring);
    });
  }

  // 15. Time of Day Lighting Function
  function setTimeOfDay(time: TimeOfDay) {
    switch (time) {
      case 'day':
        sunLight.color.setHex(0xfffaed);
        sunLight.intensity = 2.4;
        ambientLight.intensity = 0.65;
        ambientLight.color.setHex(0xffffff);
        hemisphereLight.intensity = 0.45;
        scene.fog?.color.setHex(0xcfdbe6);
        windowLitMat.emissiveIntensity = 0.3;
        streetlightMat.emissiveIntensity = 0.1;
        break;
      case 'sunset':
        sunLight.color.setHex(0xf97316);
        sunLight.intensity = 2.8;
        ambientLight.intensity = 0.45;
        ambientLight.color.setHex(0xfb7185);
        hemisphereLight.intensity = 0.35;
        scene.fog?.color.setHex(0x7c2d12);
        windowLitMat.emissiveIntensity = 1.2;
        streetlightMat.emissiveIntensity = 1.0;
        break;
      case 'night':
        sunLight.color.setHex(0x38bdf8);
        sunLight.intensity = 0.5;
        ambientLight.intensity = 0.25;
        ambientLight.color.setHex(0x1e1b4b);
        hemisphereLight.intensity = 0.2;
        scene.fog?.color.setHex(0x020617);
        windowLitMat.emissiveIntensity = 2.2;
        streetlightMat.emissiveIntensity = 2.8;
        break;
      case 'dawn':
        sunLight.color.setHex(0xfde047);
        sunLight.intensity = 1.6;
        ambientLight.intensity = 0.5;
        ambientLight.color.setHex(0xc084fc);
        hemisphereLight.intensity = 0.35;
        scene.fog?.color.setHex(0x6b21a8);
        windowLitMat.emissiveIntensity = 1.0;
        streetlightMat.emissiveIntensity = 0.6;
        break;
    }
  }

  function setTheme(theme: VisualTheme) {
    if (theme === 'cyberpunk') {
      asphaltMat.roughness = 0.16;
      asphaltMat.metalness = 0.78;
      asphaltMat.envMapIntensity = 2.4;
      if (scene.fog) scene.fog.color.setHex(0x18042b);
      windowLitMat.color.setHex(0xec4899);
      windowLitMat.emissive.setHex(0xec4899);
      streetlightMat.color.setHex(0x06b6d4);
      streetlightMat.emissive.setHex(0x06b6d4);
    } else if (theme === 'tokyo_drift') {
      asphaltMat.roughness = 0.28;
      asphaltMat.metalness = 0.52;
      asphaltMat.envMapIntensity = 1.8;
      if (scene.fog) scene.fog.color.setHex(0x0b1120);
      streetlightMat.color.setHex(0xf59e0b);
      streetlightMat.emissive.setHex(0xf59e0b);
    } else if (theme === 'desert_run') {
      asphaltMat.roughness = 0.85;
      asphaltMat.metalness = 0.08;
      asphaltMat.envMapIntensity = 0.9;
      if (scene.fog) scene.fog.color.setHex(0x7c2d12);
      grassMat.color.setHex(0x9a3412);
      grassMat.roughness = 0.95;
    } else if (theme === 'synthwave') {
      asphaltMat.roughness = 0.2;
      asphaltMat.metalness = 0.82;
      asphaltMat.envMapIntensity = 2.2;
      roadLineMat.color.setHex(0xec4899);
      roadLineMat.emissive.setHex(0xec4899);
      roadLineMat.emissiveIntensity = 1.8;
      if (scene.fog) scene.fog.color.setHex(0x3b0764);
    } else {
      asphaltMat.roughness = 0.8;
      asphaltMat.metalness = 0.14;
      asphaltMat.envMapIntensity = 0.9;
      grassMat.color.setHex(0x1e3a1e);
      roadLineMat.color.setHex(0xfafafa);
      roadLineMat.emissive.setHex(0x000000);
      roadLineMat.emissiveIntensity = 0;
      streetlightMat.color.setHex(0xffedd5);
      streetlightMat.emissive.setHex(0xfef08a);
    }
  }

  setTimeOfDay('day');

  return {
    scene,
    colliders,
    checkpointGroup,
    sunLight,
    setCheckpoints,
    setTimeOfDay,
    setTheme,
    update: (time: number, carPos?: THREE.Vector3) => {
      // Dynamic razor-sharp shadow tracking around player car
      if (carPos) {
        sunLight.position.set(carPos.x + 80, 130, carPos.z + 70);
        sunLight.target.position.set(carPos.x, carPos.y, carPos.z);
        sunLight.target.updateMatrixWorld();
      }

      // Gentle pulsing animation on active checkpoint ring
      checkpointMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = time * 1.5;
        const scale = 1.0 + Math.sin(time * 3 + idx) * 0.08;
        mesh.scale.set(scale, scale, scale);
      });

      // Shimmering harbor water
      waterMat.opacity = 0.82 + Math.sin(time * 2.5) * 0.06;

      // Animate Apex Garage golden wrench beacon
      garageBeaconGroup.rotation.y = time * 1.8;
      garageBeaconGroup.position.y = 3.2 + Math.sin(time * 2.8) * 0.25;
      padRing.rotation.z = -time * 0.8;

      // Animate Airport beacon & Coastal lighthouse beacons
      airportBeaconGroup.rotation.y = time * 2.2;
      lighthouseBeaconGroup.rotation.y = time * 1.4;
    },
  };
}
