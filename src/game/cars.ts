import * as THREE from 'three';
import { CarConfig, VehicleUpgrades, DEFAULT_UPGRADES } from './types';
import {
  getCarPaintFlakeNormalMap,
  getCarbonFiberTextures,
  getTireTextures,
  getBrakeRotorTexture,
  getContactShadowTexture,
  getGrilleMeshTexture,
  getDashboardScreenTexture,
  getCenterConsoleNavTexture,
  getLicensePlateTexture,
  getTireSidewallTexture,
  getEngineV10Texture,
  getWindshieldSunstripTexture,
  getRearDefrosterTexture,
} from './textures';

export const CAR_PRESETS: Record<string, CarConfig> = {
  apex_gt: {
    id: 'apex_gt',
    name: 'Apex GT V10',
    category: 'Supercar',
    topSpeedKmh: 340,
    acceleration: 2.7,
    handling: 9.5,
    mass: 1420,
    driveType: 'AWD',
    engineSoundType: 'v10',
    colors: ['#e11d48', '#0284c7', '#10b981', '#f59e0b', '#18181b', '#f8fafc'],
    defaultColor: '#e11d48',
    description: 'Mid-engine AWD flagship. Active motorized aero wing, razor precision, and explosive high-speed stability.',
    dimensions: {
      length: 4.55,
      width: 2.05,
      height: 1.18,
      wheelbase: 2.65,
      wheelRadius: 0.35,
    },
    gears: [3.4, 2.15, 1.55, 1.2, 0.95, 0.8],
    finalDrive: 3.65,
    maxRpm: 8500,
    idleRpm: 900,
  },
  viper_drift: {
    id: 'viper_drift',
    name: 'Viper Spec-D',
    category: 'Drift Muscle',
    topSpeedKmh: 315,
    acceleration: 3.1,
    handling: 8.9,
    mass: 1540,
    driveType: 'RWD',
    engineSoundType: 'v8_muscle',
    colors: ['#8b5cf6', '#10b981', '#f97316', '#0f172a', '#eab308', '#dc2626'],
    defaultColor: '#8b5cf6',
    description: 'Twin-turbo V8 drift weapon with welded rear differential and massive steering angle for smoking sideways runs.',
    dimensions: {
      length: 4.65,
      width: 2.12,
      height: 1.24,
      wheelbase: 2.7,
      wheelRadius: 0.36,
    },
    gears: [3.2, 2.05, 1.48, 1.15, 0.9, 0.75],
    finalDrive: 3.9,
    maxRpm: 7800,
    idleRpm: 800,
  },
  rally_proto: {
    id: 'rally_proto',
    name: 'Rally Raider RS',
    category: 'Gymkhana AWD',
    topSpeedKmh: 280,
    acceleration: 2.9,
    handling: 9.7,
    mass: 1280,
    driveType: 'AWD',
    engineSoundType: 'turbo_rally',
    colors: ['#06b6d4', '#84cc16', '#ec4899', '#f97316', '#3b82f6', '#f1f5f9'],
    defaultColor: '#06b6d4',
    description: 'Lightweight rally chassis with high-travel suspension and instant turbo boost. Unstoppable over stunt ramps.',
    dimensions: {
      length: 4.25,
      width: 1.95,
      height: 1.35,
      wheelbase: 2.55,
      wheelRadius: 0.37,
    },
    gears: [3.6, 2.3, 1.68, 1.28, 1.02, 0.85],
    finalDrive: 4.15,
    maxRpm: 8200,
    idleRpm: 1000,
  },
  cyber_phantom: {
    id: 'cyber_phantom',
    name: 'Cyber Phantom GT',
    category: 'Electric Hypercar',
    topSpeedKmh: 385,
    acceleration: 2.1,
    handling: 9.9,
    mass: 1680,
    driveType: 'AWD',
    engineSoundType: 'electric_hyper',
    colors: ['#06b6d4', '#ec4899', '#a855f7', '#10b981', '#ffffff', '#09090b'],
    defaultColor: '#06b6d4',
    description: 'Ultra-low Le Mans hypercar with central shark fin, cyan neon underglow, and instant quad-motor electric torque.',
    dimensions: {
      length: 4.75,
      width: 2.15,
      height: 1.12,
      wheelbase: 2.8,
      wheelRadius: 0.36,
    },
    gears: [3.8, 2.5, 1.8, 1.35, 1.0, 0.72],
    finalDrive: 3.4,
    maxRpm: 10500,
    idleRpm: 600,
  },
  muscle_horizon: {
    id: 'muscle_horizon',
    name: 'Horizon 69 Muscle',
    category: 'Classic Big Block V8',
    topSpeedKmh: 300,
    acceleration: 3.3,
    handling: 8.3,
    mass: 1620,
    driveType: 'RWD',
    engineSoundType: 'classic_v8',
    colors: ['#dc2626', '#f59e0b', '#18181b', '#2563eb', '#15803d', '#475569'],
    defaultColor: '#dc2626',
    description: '7.0L supercharged big block V8 with huge chrome blower scoop, thunderous idle rumble, and burnout torque.',
    dimensions: {
      length: 4.85,
      width: 2.08,
      height: 1.28,
      wheelbase: 2.78,
      wheelRadius: 0.37,
    },
    gears: [3.1, 1.95, 1.4, 1.08, 0.85, 0.7],
    finalDrive: 3.73,
    maxRpm: 7200,
    idleRpm: 750,
  },
  formula_apex: {
    id: 'formula_apex',
    name: 'Formula Apex F1',
    category: 'Open-Wheel GP',
    topSpeedKmh: 375,
    acceleration: 1.8,
    handling: 10.0,
    mass: 790,
    driveType: 'RWD',
    engineSoundType: 'formula_v10',
    colors: ['#0284c7', '#dc2626', '#10b981', '#f59e0b', '#18181b', '#ffffff'],
    defaultColor: '#0284c7',
    description: 'Grand Prix open-wheel single seater. Multi-element front/rear wings, halo cockpit, and screaming 18,000 RPM V10.',
    dimensions: {
      length: 4.95,
      width: 2.0,
      height: 0.98,
      wheelbase: 3.1,
      wheelRadius: 0.33,
    },
    gears: [3.5, 2.5, 1.9, 1.5, 1.2, 1.0, 0.85],
    finalDrive: 3.2,
    maxRpm: 18000,
    idleRpm: 3500,
  },
  venom_f5: {
    id: 'venom_f5',
    name: 'Venom F5 Hyper',
    category: 'Top Speed Hypercar',
    topSpeedKmh: 425,
    acceleration: 2.3,
    handling: 9.3,
    mass: 1360,
    driveType: 'RWD',
    engineSoundType: 'hyper_v8',
    colors: ['#eab308', '#dc2626', '#0284c7', '#18181b', '#ffffff', '#4f46e5'],
    defaultColor: '#eab308',
    description: '6.6L twin-turbo Fury V8 hypercar engineered to break 400 km/h. Longtail teardrop silhouette and quad exhaust.',
    dimensions: {
      length: 4.7,
      width: 2.05,
      height: 1.13,
      wheelbase: 2.8,
      wheelRadius: 0.36,
    },
    gears: [3.1, 2.0, 1.45, 1.1, 0.88, 0.72, 0.6],
    finalDrive: 3.15,
    maxRpm: 8800,
    idleRpm: 950,
  },
  titan_trophy: {
    id: 'titan_trophy',
    name: 'Titan 4x4 Trophy',
    category: 'Off-Road Trophy Truck',
    topSpeedKmh: 245,
    acceleration: 3.5,
    handling: 8.6,
    mass: 2150,
    driveType: 'AWD',
    engineSoundType: 'v8_muscle',
    colors: ['#f97316', '#eab308', '#15803d', '#3b82f6', '#18181b', '#f1f5f9'],
    defaultColor: '#f97316',
    description: 'Baja-ready trophy truck. Lifted heavy-duty chassis, tubular roll cage, massive beadlock off-road tires, and bull bar.',
    dimensions: {
      length: 5.1,
      width: 2.22,
      height: 1.82,
      wheelbase: 3.05,
      wheelRadius: 0.46,
    },
    gears: [3.8, 2.3, 1.6, 1.2, 0.92, 0.75],
    finalDrive: 4.56,
    maxRpm: 7000,
    idleRpm: 850,
  },
  shinobi_r34: {
    id: 'shinobi_r34',
    name: 'Ghost Shinobi R',
    category: 'JDM Legend Tuner',
    topSpeedKmh: 335,
    acceleration: 2.8,
    handling: 9.6,
    mass: 1390,
    driveType: 'AWD',
    engineSoundType: 'jdm_turbo',
    colors: ['#0284c7', '#ffffff', '#7c3aed', '#18181b', '#ef4444', '#10b981'],
    defaultColor: '#0284c7',
    description: 'Twin-turbo inline-6 street icon with widebody fender flares, vented carbon hood, high aluminum GT wing, and blow-off pops.',
    dimensions: {
      length: 4.6,
      width: 2.02,
      height: 1.32,
      wheelbase: 2.66,
      wheelRadius: 0.35,
    },
    gears: [3.3, 2.1, 1.5, 1.18, 0.95, 0.78],
    finalDrive: 3.85,
    maxRpm: 9200,
    idleRpm: 950,
  },
  hudson_hornet: {
    id: 'hudson_hornet',
    name: 'Fabulous Hudson Hornet',
    category: '1951 NASCAR Legend',
    topSpeedKmh: 235,
    acceleration: 3.5,
    handling: 9.5,
    mass: 1610,
    driveType: 'RWD',
    engineSoundType: 'classic_v8',
    colors: ['#1e3a8a', '#7f1d1d', '#18181b', '#065f46', '#d97706', '#fef3c7'],
    defaultColor: '#1e3a8a',
    description: '1951 NASCAR champion. Revolutionary low-slung "step-down" chassis, Twin H-Power dual carburetors, chrome waterfall grille, rear wheel skirts, and legendary drift handling.',
    dimensions: {
      length: 5.15,
      width: 2.05,
      height: 1.42,
      wheelbase: 3.12,
      wheelRadius: 0.38,
    },
    gears: [3.4, 2.1, 1.45, 1.05, 0.82],
    finalDrive: 3.75,
    maxRpm: 6800,
    idleRpm: 750,
  },
  gtr_r35: {
    id: 'gtr_r35',
    name: 'Godzilla GT-R R35',
    category: 'Twin-Turbo Supercar',
    topSpeedKmh: 345,
    acceleration: 2.6,
    handling: 9.7,
    mass: 1720,
    driveType: 'AWD',
    engineSoundType: 'v6_twin_turbo',
    colors: ['#94a3b8', '#dc2626', '#ffffff', '#18181b', '#2563eb', '#f59e0b'],
    defaultColor: '#94a3b8',
    description: '3.8L VR38DETT twin-turbo V6 with ATTESA E-TS AWD. Iconic quad circular taillights, aggressive carbon front splitter, high GT wing, and explosive all-wheel launch grip.',
    dimensions: {
      length: 4.68,
      width: 2.05,
      height: 1.25,
      wheelbase: 2.78,
      wheelRadius: 0.36,
    },
    gears: [3.8, 2.35, 1.7, 1.3, 1.02, 0.8],
    finalDrive: 3.7,
    maxRpm: 8000,
    idleRpm: 850,
  },
  miata_na: {
    id: 'miata_na',
    name: 'Roadster MX-5 Miata',
    category: 'Lightweight JDM Roadster',
    topSpeedKmh: 215,
    acceleration: 4.8,
    handling: 9.9,
    mass: 960,
    driveType: 'RWD',
    engineSoundType: 'screaming_i4',
    colors: ['#dc2626', '#1e3a8a', '#ffffff', '#16a34a', '#eab308', '#18181b'],
    defaultColor: '#dc2626',
    description: 'Lightweight convertible roadster legend. Pop-up headlights, compact cockpit with twin chrome roll hoops, 50:50 balance, and laser-precise drift transitions.',
    dimensions: {
      length: 3.95,
      width: 1.78,
      height: 1.18,
      wheelbase: 2.26,
      wheelRadius: 0.31,
    },
    gears: [3.1, 1.9, 1.35, 1.0, 0.82],
    finalDrive: 4.1,
    maxRpm: 7500,
    idleRpm: 850,
  },
  dino_246gt: {
    id: 'dino_246gt',
    name: 'Ferrari Dino 246 GT',
    category: '1969 Italian Grand Tourer',
    topSpeedKmh: 245,
    acceleration: 5.5,
    handling: 9.4,
    mass: 1080,
    driveType: 'RWD',
    engineSoundType: 'classic_v6_dino',
    colors: ['#dc2626', '#eab308', '#0284c7', '#ffffff', '#18181b', '#15803d'],
    defaultColor: '#dc2626',
    description: '1969 Maranello mid-engine icon. Scalloped door air scoops, curvaceous flared fenders, curved rear buttresses with vertical glass, chrome quad exhausts, and a singing Weber-carbureted 2.4L DOHC V6.',
    dimensions: {
      length: 4.23,
      width: 1.82,
      height: 1.14,
      wheelbase: 2.34,
      wheelRadius: 0.33,
    },
    gears: [3.05, 1.95, 1.4, 1.05, 0.85],
    finalDrive: 3.6,
    maxRpm: 7800,
    idleRpm: 900,
  },
};

export interface Car3DView {
  rootGroup: THREE.Group;
  chassisGroup: THREE.Group;
  wheelMeshes: THREE.Group[]; // FL, FR, RL, RR
  brakeLightMaterial: THREE.MeshStandardMaterial;
  headlightMaterial: THREE.MeshStandardMaterial;
  reverseLightMaterial: THREE.MeshStandardMaterial;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  glassMaterial?: THREE.MeshPhysicalMaterial;
  carbonMaterial?: THREE.MeshPhysicalMaterial;
  chromeMaterial?: THREE.MeshStandardMaterial;
  headlightBeams: THREE.SpotLight[];
  exhaustFlameMesh: THREE.Mesh;
  exhaustFlameLight?: THREE.PointLight;
  activeSpoiler?: THREE.Group;
  underglowLight: THREE.PointLight;
  underglowMesh: THREE.Mesh;
  rotorMeshes: THREE.Mesh[];
  caliperMeshes: THREE.Mesh[];
  contactShadowMesh?: THREE.Mesh;
  steeringWheelGroup?: THREE.Group;
  wiperGroup?: THREE.Group;
  suspensionCoils?: THREE.Mesh[];
}

export function createCar3D(inputConfig: CarConfig, colorHex?: string, upgrades: VehicleUpgrades = DEFAULT_UPGRADES): Car3DView {
  const config = (inputConfig && inputConfig.dimensions) ? inputConfig : CAR_PRESETS.apex_gt;
  const rootGroup = new THREE.Group();
  const chassisGroup = new THREE.Group();
  rootGroup.add(chassisGroup);

  let activeSteeringWheelGroup: THREE.Group | undefined;
  let activeWiperGroup: THREE.Group | undefined;
  const suspensionCoils: THREE.Mesh[] = [];

  const carColor = colorHex || config.defaultColor;

  // Shared procedural textures
  const flakeNormalMap = getCarPaintFlakeNormalMap();
  const carbonTextures = getCarbonFiberTextures();
  const tireTextures = getTireTextures();
  const rotorTexture = getBrakeRotorTexture();
  const contactShadowTex = getContactShadowTexture();
  const grilleMeshTex = getGrilleMeshTexture();
  const dashboardTex = getDashboardScreenTexture();
  const navScreenTex = getCenterConsoleNavTexture();
  const licensePlateTex = getLicensePlateTexture(config.name.substring(0, 9).toUpperCase());
  const tireSidewallTex = getTireSidewallTexture();
  const engineV10Tex = getEngineV10Texture();

  // Multi-Coat Automotive Metallic Paint with Specular Clearcoat & HDR Reflection
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(carColor),
    metalness: 0.88,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    normalMap: flakeNormalMap,
    normalScale: new THREE.Vector2(0.04, 0.04),
    reflectivity: 1.0,
    ior: 1.52,
    specularIntensity: 1.0,
    envMapIntensity: 2.6,
  });

  // Authentic 2x2 Twill Prepreg Carbon Fiber with Anisotropic Sheen
  const carbonMaterial = new THREE.MeshPhysicalMaterial({
    map: carbonTextures.map,
    normalMap: carbonTextures.normalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    color: 0x24252a,
    metalness: 0.45,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.8,
  });

  // Automotive Safety Glass with Realistic Tint, Index of Refraction & Fresnel Specular
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x050914,
    metalness: 0.9,
    roughness: 0.02,
    transmission: 0.72,
    transparent: true,
    opacity: 0.82,
    ior: 1.52,
    envMapIntensity: 3.2,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.99,
    roughness: 0.02,
    envMapIntensity: 3.0,
  });

  const interiorMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Burnt Titanium Blue/Purple Heat-Treated Exhaust Material
  const burntTitaniumMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.96,
    roughness: 0.12,
    envMapIntensity: 2.8,
  });

  // Racing Harness Fabric Material
  const harnessMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.75,
    metalness: 0.08,
  });

  // Embossed Stamped Automotive License Plate Material
  const licensePlateMaterial = new THREE.MeshStandardMaterial({
    map: licensePlateTex,
    roughness: 0.35,
    metalness: 0.15,
  });

  const brakeLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.45,
    roughness: 0.15,
  });

  const reverseLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0,
    roughness: 0.15,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfffbeb,
    emissiveIntensity: 0.4,
    roughness: 0.08,
  });

  const neonAccentMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  // Carbon hood if weight reduction stage installed or carbon parts selected
  const hoodMaterial = (upgrades.weightReduction > 0 || upgrades.carbonParts) ? carbonMaterial : bodyMaterial;

  const { length, width, height } = config.dimensions;

  // Stance height offset
  let stanceYOffset = 0;
  if (upgrades.suspensionStage === 1) stanceYOffset = -0.02;
  else if (upgrades.suspensionStage === 2) stanceYOffset = -0.04;
  else if (upgrades.suspensionStage === 3) stanceYOffset = -0.06; // Slammed
  chassisGroup.position.y += stanceYOffset;

  // -------------------------------------------------------------
  // CAR MESH BUILDER
  // -------------------------------------------------------------
  const spoilerGroup = new THREE.Group();

  if (config.id === 'formula_apex') {
    // FORMULA 1 OPEN WHEEL
    // Narrow sleek monocoque nose
    const noseGeo = new THREE.ConeGeometry(0.35, length * 0.55, 12);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, bodyMaterial);
    nose.position.set(0, height * 0.35, length * 0.25);
    chassisGroup.add(nose);

    // Main central cockpit body
    const bodyGeo = new THREE.BoxGeometry(width * 0.45, height * 0.42, length * 0.55);
    const body = new THREE.Mesh(bodyGeo, bodyMaterial);
    body.position.set(0, height * 0.4, -length * 0.1);
    chassisGroup.add(body);

    // Aerodynamic sidepods
    const podGeo = new THREE.BoxGeometry(width * 0.22, height * 0.35, length * 0.35);
    const podL = new THREE.Mesh(podGeo, bodyMaterial);
    podL.position.set(width * 0.32, height * 0.35, -length * 0.05);
    const podR = new THREE.Mesh(podGeo, bodyMaterial);
    podR.position.set(-width * 0.32, height * 0.35, -length * 0.05);
    chassisGroup.add(podL, podR);

    // Open cockpit opening & Halo titanium safety bar
    const haloGeo = new THREE.TorusGeometry(0.28, 0.03, 8, 16, Math.PI);
    const halo = new THREE.Mesh(haloGeo, carbonMaterial);
    halo.position.set(0, height * 0.72, length * 0.02);
    halo.rotation.x = Math.PI / 4;
    chassisGroup.add(halo);

    // Massive front wing assembly
    const fWingGeo = new THREE.BoxGeometry(width * 1.05, 0.04, 0.4);
    const fWing = new THREE.Mesh(fWingGeo, carbonMaterial);
    fWing.position.set(0, 0.12, length * 0.52);
    chassisGroup.add(fWing);

    // Giant high rear wing with DRS flap
    const rWingGeo = new THREE.BoxGeometry(width * 0.85, 0.04, 0.3);
    const rWing = new THREE.Mesh(rWingGeo, carbonMaterial);
    rWing.position.set(0, height * 0.95, -length * 0.48);
    const rStrutL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.45, 0.1), carbonMaterial);
    rStrutL.position.set(0.3, height * 0.72, -length * 0.48);
    const rStrutR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.45, 0.1), carbonMaterial);
    rStrutR.position.set(-0.3, height * 0.72, -length * 0.48);
    spoilerGroup.add(rWing, rStrutL, rStrutR);

    // Rear rain LED flashing light
    const rainLight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), brakeLightMaterial);
    rainLight.position.set(0, height * 0.4, -length * 0.51);
    chassisGroup.add(rainLight);

  } else if (config.id === 'titan_trophy') {
    // 4X4 OFF-ROAD TROPHY TRUCK
    // Raised heavy-duty chassis cabin
    const cabinGeo = new THREE.BoxGeometry(width * 0.85, height * 0.55, length * 0.45);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(0, height * 0.65, length * 0.05);
    chassisGroup.add(cabin);

    // Front hood & grille
    const hoodGeo = new THREE.BoxGeometry(width * 0.82, height * 0.35, length * 0.35);
    const hood = new THREE.Mesh(hoodGeo, hoodMaterial);
    hood.position.set(0, height * 0.55, length * 0.38);
    chassisGroup.add(hood);

    // Heavy-duty front bull bar with integrated skid plate
    const bullBarGeo = new THREE.BoxGeometry(width * 0.9, height * 0.45, 0.15);
    const bullBar = new THREE.Mesh(bullBarGeo, carbonMaterial);
    bullBar.position.set(0, height * 0.45, length * 0.52);
    chassisGroup.add(bullBar);

    // 4 Amber LED Spotlights on roof rack
    const spotRack = new THREE.Mesh(new THREE.BoxGeometry(width * 0.75, 0.08, 0.1), chromeMaterial);
    spotRack.position.set(0, height * 0.96, length * 0.15);
    const lamps = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.05, 0.04), headlightMaterial);
    lamps.position.set(0, 0, 0.06);
    spotRack.add(lamps);
    chassisGroup.add(spotRack);

    // Open rear tubular truck bed with dual full-size spare tires
    const spareGeo = new THREE.CylinderGeometry(config.dimensions.wheelRadius, config.dimensions.wheelRadius, 0.28, 16);
    spareGeo.rotateZ(Math.PI / 2);
    const spareMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });
    const spare1 = new THREE.Mesh(spareGeo, spareMat);
    spare1.position.set(0.35, height * 0.58, -length * 0.28);
    spare1.rotation.x = -0.3;
    const spare2 = new THREE.Mesh(spareGeo, spareMat);
    spare2.position.set(-0.35, height * 0.58, -length * 0.28);
    spare2.rotation.x = -0.3;
    chassisGroup.add(spare1, spare2);

    // Tubular roll cage framing the rear bed
    const cageGeo = new THREE.BoxGeometry(width * 0.85, height * 0.48, length * 0.4);
    const cage = new THREE.Mesh(cageGeo, carbonMaterial);
    cage.position.set(0, height * 0.6, -length * 0.25);
    chassisGroup.add(cage);

  } else {
    // STANDARD / SUPERCAR / GT / JDM BODIES
    // 1. Lower Main Chassis
    const lowerGeo = new THREE.BoxGeometry(width * 0.94, height * 0.32, length * 0.96);
    const lowerBody = new THREE.Mesh(lowerGeo, bodyMaterial);
    lowerBody.position.set(0, height * 0.28, 0);
    lowerBody.castShadow = true;
    chassisGroup.add(lowerBody);

    // 2. Hood / Front Bonnet
    const hoodLength = length * 0.38;
    const hoodGeo = new THREE.BoxGeometry(width * 0.86, height * 0.18, hoodLength);
    const hood = new THREE.Mesh(hoodGeo, hoodMaterial);
    hood.position.set(0, height * 0.44, length * 0.3);
    hood.castShadow = true;
    chassisGroup.add(hood);

    // 3. Cabin / Glass Cockpit
    const cabinLength = length * 0.44;
    const cabinWidth = width * 0.82;
    const cabinHeight = height * 0.48;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, height * 0.68, -length * 0.04);
    cabin.castShadow = true;
    chassisGroup.add(cabin);

    // Upper Windshield Gradient Sun Visor Strip with Competition Banner
    const sunstripGeo = new THREE.PlaneGeometry(cabinWidth * 0.86, height * 0.14);
    const sunstripMat = new THREE.MeshBasicMaterial({
      map: getWindshieldSunstripTexture(),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const sunstrip = new THREE.Mesh(sunstripGeo, sunstripMat);
    sunstrip.position.set(0, height * 0.85, -length * 0.04 + cabinLength * 0.505);
    chassisGroup.add(sunstrip);

    // Rear Windshield Copper Heating Defroster Grid
    const defrosterGeo = new THREE.PlaneGeometry(cabinWidth * 0.82, height * 0.36);
    const defrosterMat = new THREE.MeshBasicMaterial({
      map: getRearDefrosterTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const defroster = new THREE.Mesh(defrosterGeo, defrosterMat);
    defroster.position.set(0, height * 0.68, -length * 0.04 - cabinLength * 0.505);
    chassisGroup.add(defroster);

    // Cowl Panel & Windshield Wipers with Rubber Blades & Washer Jet Nozzles
    const wiperAssembly = new THREE.Group();
    wiperAssembly.position.set(0, height * 0.52, -length * 0.04 + cabinLength * 0.51);

    // Dual Twin-Nozzle Washer Fluid Jets on Cowl
    [-0.24, 0.24].forEach(nx => {
      const nozzle = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.012, 0.02),
        carbonMaterial
      );
      nozzle.position.set(nx, 0.015, 0.03);
      wiperAssembly.add(nozzle);
    });

    // Articulated Wiper Arms & Rubber Blades
    [-0.28, 0.08].forEach(wx => {
      const armGroup = new THREE.Group();
      armGroup.position.set(wx, 0.02, 0);

      // Pivot spindle
      const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), chromeMaterial);
      pivot.rotateX(Math.PI / 2);
      armGroup.add(pivot);

      // Stamped metal wiper arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.28), carbonMaterial);
      arm.position.set(0.06, 0.08, -0.04);
      arm.rotation.z = -0.32;
      arm.rotation.x = -0.42;
      armGroup.add(arm);

      // Rubber squeegee blade
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.26), interiorMaterial);
      blade.position.set(0.06, 0.075, -0.04);
      blade.rotation.z = -0.32;
      blade.rotation.x = -0.42;
      armGroup.add(blade);

      wiperAssembly.add(armGroup);
    });

    chassisGroup.add(wiperAssembly);
    activeWiperGroup = wiperAssembly;

    // 4. Roof panel
    const roofMaterial = upgrades.weightReduction > 0 ? carbonMaterial : bodyMaterial;
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.86, height * 0.08, cabinLength * 0.65);
    const roof = new THREE.Mesh(roofGeo, roofMaterial);
    roof.position.set(0, height * 0.92, -length * 0.04);
    roof.castShadow = true;
    chassisGroup.add(roof);

    // 5. Interior cockpit: Detailed dashboard, digital HUD screen, GPS navigation touchscreen, racing bucket seats & steering wheel
    const dashGeo = new THREE.BoxGeometry(cabinWidth * 0.82, 0.12, 0.32);
    const dash = new THREE.Mesh(dashGeo, interiorMaterial);
    dash.position.set(0, height * 0.58, length * 0.08);
    chassisGroup.add(dash);

    // Glowing Digital Instrument Cluster Screen HUD
    const hudScreenGeo = new THREE.PlaneGeometry(0.24, 0.12);
    const hudScreenMat = new THREE.MeshBasicMaterial({ map: dashboardTex });
    const hudScreen = new THREE.Mesh(hudScreenGeo, hudScreenMat);
    hudScreen.position.set(-0.32, height * 0.63, length * 0.04);
    hudScreen.rotation.x = -Math.PI / 6;
    chassisGroup.add(hudScreen);

    // Center Console Floating GPS Navigation Touchscreen
    const navScreenGeo = new THREE.PlaneGeometry(0.28, 0.18);
    const navScreenMat = new THREE.MeshBasicMaterial({ map: navScreenTex });
    const navScreen = new THREE.Mesh(navScreenGeo, navScreenMat);
    navScreen.position.set(0.04, height * 0.58, length * 0.05);
    navScreen.rotation.x = -Math.PI / 7;
    chassisGroup.add(navScreen);

    // Interior Windshield Rearview Mirror
    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06), carbonMaterial);
    mirrorStem.position.set(0, height * 0.86, length * 0.02);
    const innerMirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.02), chromeMaterial);
    innerMirror.position.set(0, height * 0.83, length * 0.02);
    chassisGroup.add(mirrorStem, innerMirror);

    // 3-Spoke Sport Racing Steering Wheel with Paddle Shifters
    const steerWheelGroup = new THREE.Group();
    steerWheelGroup.position.set(-0.32, height * 0.64, length * 0.02);
    steerWheelGroup.rotation.x = Math.PI / 5;

    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 12, 24), carbonMaterial);
    steerWheelGroup.add(wheelRim);

    const steerCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), chromeMaterial);
    steerCenter.rotateX(Math.PI / 2);
    steerWheelGroup.add(steerCenter);

    // Steering spokes
    const spokeGeo = new THREE.BoxGeometry(0.022, 0.11, 0.01);
    const spokeL = new THREE.Mesh(spokeGeo, carbonMaterial);
    spokeL.position.set(-0.06, 0, 0);
    spokeL.rotation.z = Math.PI / 2.3;
    const spokeR = new THREE.Mesh(spokeGeo, carbonMaterial);
    spokeR.position.set(0.06, 0, 0);
    spokeR.rotation.z = -Math.PI / 2.3;
    const spokeB = new THREE.Mesh(spokeGeo, carbonMaterial);
    spokeB.position.set(0, -0.06, 0);
    steerWheelGroup.add(spokeL, spokeR, spokeB);

    // Brushed Aluminum Paddle Shifters behind steering wheel (+ and -)
    const paddleGeo = new THREE.BoxGeometry(0.012, 0.075, 0.022);
    const paddleUp = new THREE.Mesh(paddleGeo, chromeMaterial);
    paddleUp.position.set(0.09, 0.02, -0.025);
    const paddleDown = new THREE.Mesh(paddleGeo, chromeMaterial);
    paddleDown.position.set(-0.09, 0.02, -0.025);
    steerWheelGroup.add(paddleUp, paddleDown);

    chassisGroup.add(steerWheelGroup);
    activeSteeringWheelGroup = steerWheelGroup;

    // Center Console, Shifter & Anodized Start Button
    const consoleGeo = new THREE.BoxGeometry(0.18, 0.14, 0.6);
    const consoleMesh = new THREE.Mesh(consoleGeo, carbonMaterial);
    consoleMesh.position.set(0, height * 0.44, -length * 0.06);
    chassisGroup.add(consoleMesh);

    const shiftKnob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), chromeMaterial);
    shiftKnob.position.set(0, height * 0.54, -length * 0.02);
    const startBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 })
    );
    startBtn.position.set(0.06, height * 0.52, 0.04);
    chassisGroup.add(shiftKnob, startBtn);

    // Dual High-Performance Racing Bucket Seats with Harnesses & Bolsters
    [-0.32, 0.32].forEach(seatX => {
      const seatGroup = new THREE.Group();
      seatGroup.position.set(seatX, height * 0.46, -length * 0.08);

      // Seat cushion base
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.42), interiorMaterial);
      seatGroup.add(baseMesh);

      // High-bolster lateral thigh supports
      const bolsterL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.38), interiorMaterial);
      bolsterL.position.set(0.17, 0.08, 0);
      const bolsterR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.38), interiorMaterial);
      bolsterR.position.set(-0.17, 0.08, 0);
      seatGroup.add(bolsterL, bolsterR);

      // Backrest with shoulder wings
      const backrestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 0.1), interiorMaterial);
      backrestMesh.position.set(0, 0.26, -0.16);
      backrestMesh.rotation.x = -0.15;
      seatGroup.add(backrestMesh);

      // Headrest
      const headrestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.08), interiorMaterial);
      headrestMesh.position.set(0, 0.52, -0.2);
      seatGroup.add(headrestMesh);

      // 4-Point Racing Harness Shoulder Belts with Silver Camlock Buckle
      [-0.07, 0.07].forEach(strapX => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.4, 0.012), harnessMaterial);
        strap.position.set(strapX, 0.26, -0.1);
        strap.rotation.x = -0.15;
        seatGroup.add(strap);
      });
      const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 12), chromeMaterial);
      buckle.rotateX(Math.PI / 2);
      buckle.position.set(0, 0.14, -0.06);
      seatGroup.add(buckle);

      chassisGroup.add(seatGroup);
    });

    // Heavy-duty Underbody Mechanical Components: Subframe, Transmission, Driveshaft & Rear Differential
    const underbodyGroup = new THREE.Group();

    // Front tubular engine subframe crossmember
    const subframeF = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.06, 0.16), carbonMaterial);
    subframeF.position.set(0, height * 0.14, length * 0.26);
    underbodyGroup.add(subframeF);

    // Heavy cast transmission bellhousing & gearbox
    const transGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.42, 12);
    transGeo.rotateX(Math.PI / 2);
    const transMesh = new THREE.Mesh(transGeo, chromeMaterial);
    transMesh.position.set(0, height * 0.15, length * 0.12);
    underbodyGroup.add(transMesh);

    // Central driveshaft tunnel with catalytic converter canisters & resonator
    const driveshaftGeo = new THREE.CylinderGeometry(0.04, 0.04, length * 0.52, 10);
    driveshaftGeo.rotateX(Math.PI / 2);
    const driveshaft = new THREE.Mesh(driveshaftGeo, chromeMaterial);
    driveshaft.position.set(0, height * 0.14, -length * 0.14);
    underbodyGroup.add(driveshaft);

    // Dual Catalytic Converter / Resonator cans
    [-0.14, 0.14].forEach(cx => {
      const catGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.32, 12);
      catGeo.rotateX(Math.PI / 2);
      const cat = new THREE.Mesh(catGeo, burntTitaniumMaterial);
      cat.position.set(cx, height * 0.14, 0.04);
      underbodyGroup.add(cat);
    });

    // Rear Differential "Pumpkin" Casing with Aluminum Cooling Fins
    const diffGroup = new THREE.Group();
    diffGroup.position.set(0, height * 0.16, -length * 0.28);
    const diffSphere = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), carbonMaterial);
    diffGroup.add(diffSphere);
    const diffCover = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), chromeMaterial);
    diffCover.rotateX(Math.PI / 2);
    diffCover.position.z = -0.08;
    diffGroup.add(diffCover);

    // Rear Drive Half-Shaft Axles running out to wheels
    [-1, 1].forEach(side => {
      const axleGeo = new THREE.CylinderGeometry(0.024, 0.024, width * 0.38, 8);
      axleGeo.rotateZ(Math.PI / 2);
      const axle = new THREE.Mesh(axleGeo, chromeMaterial);
      axle.position.set(side * (width * 0.22), 0, 0);
      diffGroup.add(axle);
    });

    underbodyGroup.add(diffGroup);
    chassisGroup.add(underbodyGroup);

    // Muscular Flared Fender Arches (Front & Rear)
    [-1, 1].forEach(side => {
      const archGeo = new THREE.BoxGeometry(0.12, height * 0.26, length * 0.22);
      const fArch = new THREE.Mesh(archGeo, bodyMaterial);
      fArch.position.set(side * (width * 0.48), height * 0.36, config.dimensions.wheelbase * 0.5);
      const rArch = new THREE.Mesh(archGeo, bodyMaterial);
      rArch.position.set(side * (width * 0.49), height * 0.37, -config.dimensions.wheelbase * 0.5);
      chassisGroup.add(fArch, rArch);

      // Carbon Fiber Ground Effect Side Skirts with Rear Winglets
      const skirtGeo = new THREE.BoxGeometry(0.07, 0.035, length * 0.54);
      const skirt = new THREE.Mesh(skirtGeo, carbonMaterial);
      skirt.position.set(side * (width * 0.485), 0.12, 0);

      const finGeo = new THREE.BoxGeometry(0.03, 0.1, 0.12);
      const skirtFin = new THREE.Mesh(finGeo, carbonMaterial);
      skirtFin.position.set(side * (width * 0.5), 0.16, -config.dimensions.wheelbase * 0.38);
      chassisGroup.add(skirt, skirtFin);
    });

    // 6. Front Aerodynamic Splitter, Endplate Winglets, Turnbuckle Support Struts & Canards
    const splitterGeo = new THREE.BoxGeometry(width * 1.04, 0.06, 0.5);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(0, 0.12, length * 0.5);
    splitter.castShadow = true;
    chassisGroup.add(splitter);

    [-1, 1].forEach(side => {
      // Splitter outer endplate winglets
      const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.38), carbonMaterial);
      winglet.position.set(side * (width * 0.52), 0.17, length * 0.5);
      chassisGroup.add(winglet);

      // Dual-tier bumper corner dive planes / canards
      const canardUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.16), carbonMaterial);
      canardUpper.position.set(side * (width * 0.46), height * 0.36, length * 0.48);
      canardUpper.rotation.z = side * -0.22;
      const canardLower = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.18), carbonMaterial);
      canardLower.position.set(side * (width * 0.48), height * 0.25, length * 0.5);
      canardLower.rotation.z = side * -0.22;
      chassisGroup.add(canardUpper, canardLower);

      // Chrome turnbuckle support strut rods
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2), chromeMaterial);
      strut.position.set(side * 0.28, 0.2, length * 0.51);
      strut.rotation.x = -0.35;
      chassisGroup.add(strut);
    });

    // 7. Rear Aerodynamic Diffuser with 4 Vertical Air Strakes & F1 Rain Strobe
    const diffuserGeo = new THREE.BoxGeometry(width * 0.94, 0.15, 0.42);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuser.position.set(0, 0.14, -length * 0.49);
    chassisGroup.add(diffuser);

    // 4 Vertical Diffuser Venturi Fins
    [-0.34, -0.12, 0.12, 0.34].forEach(finX => {
      const strakeGeo = new THREE.BoxGeometry(0.02, 0.14, 0.44);
      const strake = new THREE.Mesh(strakeGeo, carbonMaterial);
      strake.position.set(finX, 0.13, -length * 0.49);
      chassisGroup.add(strake);
    });

    // F1-Style Center Rear Rain / Fog Strobe Lamp
    const rainStrobe = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.05, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.2 })
    );
    rainStrobe.position.set(0, 0.14, -length * 0.505);
    chassisGroup.add(rainStrobe);

    // 8. Model Specific Custom Exterior Parts
    if (config.id === 'apex_gt') {
      const wingGeo = new THREE.BoxGeometry(width * 0.96, 0.04, 0.32);
      const wing = new THREE.Mesh(wingGeo, carbonMaterial);
      wing.position.set(0, height * 0.66, -length * 0.44);
      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.12), carbonMaterial);
      strutL.position.set(0.42, height * 0.53, -length * 0.44);
      const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.12), carbonMaterial);
      strutR.position.set(-0.42, height * 0.53, -length * 0.44);
      spoilerGroup.add(wing, strutL, strutR);

      // Mid-Engine V10 Bay with transparent rear window showcase
      const engineBay = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.85),
        new THREE.MeshStandardMaterial({ map: engineV10Tex, roughness: 0.35, metalness: 0.8 })
      );
      engineBay.rotation.x = -Math.PI / 2;
      engineBay.position.set(0, height * 0.52, -length * 0.22);
      chassisGroup.add(engineBay);

      // Glass engine cover window
      const engineGlass = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.02, length * 0.28), glassMaterial);
      engineGlass.position.set(0, height * 0.62, -length * 0.22);
      chassisGroup.add(engineGlass);

      // Carbon engine bay X-Brace structural reinforcement
      const xBrace1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 8), carbonMaterial);
      xBrace1.rotation.z = Math.PI / 4;
      xBrace1.rotation.x = Math.PI / 2;
      xBrace1.position.set(0, height * 0.58, -length * 0.22);
      const xBrace2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 8), carbonMaterial);
      xBrace2.rotation.z = -Math.PI / 4;
      xBrace2.rotation.x = Math.PI / 2;
      xBrace2.position.set(0, height * 0.58, -length * 0.22);
      chassisGroup.add(xBrace1, xBrace2);

    } else if (config.id === 'viper_drift') {
      // VIPER SPEC-D DRIFT CAR
      // 1. Ducktail spoiler
      const ducktailGeo = new THREE.BoxGeometry(width * 0.94, 0.18, 0.1);
      const ducktail = new THREE.Mesh(ducktailGeo, carbonMaterial);
      ducktail.position.set(0, height * 0.53, -length * 0.5);
      ducktail.rotation.x = 0.38;
      spoilerGroup.add(ducktail);

      // 2. Widebody Rivet Bolt-On Overfenders
      [-1, 1].forEach(side => {
        const overfenderF = new THREE.Mesh(new THREE.BoxGeometry(0.14, height * 0.28, length * 0.24), carbonMaterial);
        overfenderF.position.set(side * (width * 0.52), height * 0.37, config.dimensions.wheelbase * 0.5);
        const overfenderR = new THREE.Mesh(new THREE.BoxGeometry(0.15, height * 0.29, length * 0.26), carbonMaterial);
        overfenderR.position.set(side * (width * 0.53), height * 0.38, -config.dimensions.wheelbase * 0.5);
        chassisGroup.add(overfenderF, overfenderR);

        // 3. Side-exit rocker panel exhaust pipes with heat shield
        const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.28), chromeMaterial);
        heatShield.position.set(side * (width * 0.49), 0.16, 0.1);
        const sidePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 12), burntTitaniumMaterial);
        sidePipe.rotateZ(side * (Math.PI / 2));
        sidePipe.position.set(side * (width * 0.505), 0.15, 0.1);
        chassisGroup.add(heatShield, sidePipe);
      });

      // 4. Vented hood louvers
      for (let l = -2; l <= 2; l++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.04), carbonMaterial);
        louver.position.set(0, height * 0.54, length * 0.28 + l * 0.07);
        chassisGroup.add(louver);
      }

    } else if (config.id === 'rally_proto') {
      // RALLY RAIDER RS
      // 1. High-mount rally spoiler
      const rallyWingGeo = new THREE.BoxGeometry(cabinWidth * 0.92, 0.06, 0.3);
      const rallyWing = new THREE.Mesh(rallyWingGeo, carbonMaterial);
      rallyWing.position.set(0, height * 0.95, -cabinLength * 0.56);
      spoilerGroup.add(rallyWing);

      // 2. Roof air intake scoop
      const rallyScoop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.35), carbonMaterial);
      rallyScoop.position.set(0, height * 0.96, -0.05);
      chassisGroup.add(rallyScoop);

      // 3. Tubular steel front brush guard with 4 amber rally fog lamps
      const bullBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.65, height * 0.26, 0.06), carbonMaterial);
      bullBar.position.set(0, height * 0.32, length * 0.52);
      chassisGroup.add(bullBar);

      [-0.22, -0.07, 0.07, 0.22].forEach(lx => {
        const fogLamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.048, 0.03, 16),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.2 })
        );
        fogLamp.rotateX(Math.PI / 2);
        fogLamp.position.set(lx, height * 0.34, length * 0.54);
        chassisGroup.add(fogLamp);
      });

      // 4. Heavy-duty red mudflaps behind all four wheels
      [-1, 1].forEach(side => {
        const flapMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 });
        const flapGeo = new THREE.BoxGeometry(0.02, 0.22, 0.16);
        const fFlap = new THREE.Mesh(flapGeo, flapMat);
        fFlap.position.set(side * (width * 0.49), 0.14, config.dimensions.wheelbase * 0.34);
        const rFlap = new THREE.Mesh(flapGeo, flapMat);
        rFlap.position.set(side * (width * 0.5), 0.14, -config.dimensions.wheelbase * 0.66);
        chassisGroup.add(fFlap, rFlap);
      });

    } else if (config.id === 'cyber_phantom') {
      // CYBER PHANTOM GT
      // 1. Full dorsal aero shark fin
      const finGeo = new THREE.BoxGeometry(0.04, height * 0.45, length * 0.5);
      const fin = new THREE.Mesh(finGeo, carbonMaterial);
      fin.position.set(0, height * 0.76, -length * 0.18);
      chassisGroup.add(fin);

      // Cyan neon blade down fin spine
      const finSpine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, length * 0.48), neonAccentMat);
      finSpine.position.set(0, height * 0.98, -length * 0.18);
      chassisGroup.add(finSpine);

      const frontBlade = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.03, 0.06), neonAccentMat);
      frontBlade.position.set(0, height * 0.38, length * 0.505);
      chassisGroup.add(frontBlade);

      // Full-width continuous cybernetic rear LED light strip
      const rearLightBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.035, 0.03), neonAccentMat);
      rearLightBar.position.set(0, height * 0.46, -length * 0.506);
      chassisGroup.add(rearLightBar);

    } else if (config.id === 'muscle_horizon') {
      // HORIZON 69 MUSCLE
      // 1. Polished chrome supercharger blower scoop with triple red butterfly valves
      const blowerCase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.7), chromeMaterial);
      blowerCase.position.set(0, height * 0.62, length * 0.25);
      const scoopFace = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.1), chromeMaterial);
      scoopFace.position.set(0, 0.08, 0.35);
      blowerCase.add(scoopFace);

      [-0.12, 0, 0.12].forEach(vx => {
        const valve = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.015, 12),
          new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.2 })
        );
        valve.rotateX(Math.PI / 2);
        valve.position.set(vx, 0.08, 0.41);
        blowerCase.add(valve);
      });
      chassisGroup.add(blowerCase);

      // 2. Dual White Racing Stripes over hood and roof
      [-0.14, 0.14].forEach(sx => {
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
        const hStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.1, length * 0.38), stripeMat);
        hStripe.rotation.x = -Math.PI / 2;
        hStripe.position.set(sx, height * 0.535, length * 0.3);
        const rStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.1, length * 0.44), stripeMat);
        rStripe.rotation.x = -Math.PI / 2;
        rStripe.position.set(sx, height * 0.965, -length * 0.04);
        chassisGroup.add(hStripe, rStripe);
      });

      // 3. Side-exit straight chrome drag pipes
      [-1, 1].forEach(side => {
        const pipeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.3, 12);
        pipeGeo.rotateX(Math.PI / 2);
        const pipe = new THREE.Mesh(pipeGeo, chromeMaterial);
        pipe.position.set(side * (width * 0.48), 0.12, 0);
        chassisGroup.add(pipe);
      });

    } else if (config.id === 'venom_f5') {
      // VENOM F5 HYPERCAR
      // 1. Roof snorkel ram-air scoop
      const roofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.6), carbonMaterial);
      roofScoop.position.set(0, height * 0.96, -length * 0.1);
      chassisGroup.add(roofScoop);

      // 2. High-downforce carbon wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 0.04, 0.34), carbonMaterial);
      wing.position.set(0, height * 0.68, -length * 0.48);
      const sL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.12), carbonMaterial);
      sL.position.set(0.45, height * 0.56, -length * 0.48);
      const sR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.12), carbonMaterial);
      sR.position.set(-0.45, height * 0.56, -length * 0.48);
      spoilerGroup.add(wing, sL, sR);

      // 3. Triangular quad titanium center exhaust cluster
      [
        { x: -0.06, y: height * 0.38 },
        { x: 0.06, y: height * 0.38 },
        { x: 0, y: height * 0.46 },
      ].forEach(pos => {
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 12), burntTitaniumMaterial);
        tip.rotateX(Math.PI / 2);
        tip.position.set(pos.x, pos.y, -length * 0.505);
        chassisGroup.add(tip);
      });

    } else if (config.id === 'shinobi_r34') {
      // GHOST SHINOBI R34 JDM TUNER
      // 1. High-pedestal Aluminum GT Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, 0.04, 0.32), carbonMaterial);
      wing.position.set(0, height * 0.85, -length * 0.46);
      const sL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.1), chromeMaterial);
      sL.position.set(0.4, height * 0.64, -length * 0.46);
      const sR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.1), chromeMaterial);
      sR.position.set(-0.4, height * 0.64, -length * 0.46);
      spoilerGroup.add(wing, sL, sR);

      // 2. Huge front bar-and-plate aluminum intercooler with welded charge pipes
      const ic = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, height * 0.26, 0.08), chromeMaterial);
      ic.position.set(0, height * 0.25, length * 0.51);
      const icPipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10), chromeMaterial);
      icPipeL.position.set(-0.35, height * 0.25, length * 0.48);
      const icPipeR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10), chromeMaterial);
      icPipeR.position.set(0.35, height * 0.25, length * 0.48);
      chassisGroup.add(ic, icPipeL, icPipeR);

      // 3. N1-Style Japanese Angled Cannon Exhaust (5-inch Burnt Titanium Tip)
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.25, 16), burntTitaniumMaterial);
      cannon.rotateX(Math.PI / 2.2);
      cannon.rotateZ(-0.25);
      cannon.position.set(0.34, height * 0.16, -length * 0.515);
      chassisGroup.add(cannon);

    } else if (config.id === 'hudson_hornet') {
      // 1951 HUDSON HORNET "STEP-DOWN" VINTAGE FASTBACK COUPE
      // 1. Aerodynamic Fastback Teardrop Roofline
      const fastbackGeo = new THREE.BoxGeometry(width * 0.78, height * 0.38, length * 0.36);
      const fastback = new THREE.Mesh(fastbackGeo, bodyMaterial);
      fastback.position.set(0, height * 0.75, -length * 0.24);
      fastback.rotation.x = 0.28; // sloping torpedo rear
      chassisGroup.add(fastback);

      // 2. Vintage Windshield Exterior Sun Visor
      const visorGeo = new THREE.BoxGeometry(width * 0.86, 0.03, 0.25);
      const visor = new THREE.Mesh(visorGeo, chromeMaterial);
      visor.position.set(0, height * 0.94, length * 0.16);
      visor.rotation.x = -0.15;
      chassisGroup.add(visor);

      // 3. Central Chrome Hood Spear / Ornament
      const hoodSpear = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, length * 0.38), chromeMaterial);
      hoodSpear.position.set(0, height * 0.65, length * 0.32);
      chassisGroup.add(hoodSpear);

      // 4. Iconic Chrome Waterfall Grille with horizontal ribs
      const grilleGeo = new THREE.BoxGeometry(width * 0.72, height * 0.32, 0.08);
      const grille = new THREE.Mesh(grilleGeo, chromeMaterial);
      grille.position.set(0, height * 0.36, length * 0.505);
      chassisGroup.add(grille);

      for (let r = -2; r <= 2; r++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(width * 0.68, 0.02, 0.04), chromeMaterial);
        slat.position.set(0, height * 0.36 + r * 0.04, length * 0.515);
        chassisGroup.add(slat);
      }

      // 5. Classic Heavy Wraparound Chrome Front Bumper with Bumper Guards
      const fBumper = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.14, 0.22), chromeMaterial);
      fBumper.position.set(0, height * 0.24, length * 0.52);
      const fGuardL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.14), chromeMaterial);
      fGuardL.position.set(0.38, height * 0.28, length * 0.54);
      const fGuardR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.14), chromeMaterial);
      fGuardR.position.set(-0.38, height * 0.28, length * 0.54);
      chassisGroup.add(fBumper, fGuardL, fGuardR);

      // 6. Heavy Chrome Rear Bumper with Bumper Guards
      const rBumper = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.14, 0.22), chromeMaterial);
      rBumper.position.set(0, height * 0.26, -length * 0.51);
      const rGuardL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.14), chromeMaterial);
      rGuardL.position.set(0.38, height * 0.3, -length * 0.53);
      const rGuardR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.14), chromeMaterial);
      rGuardR.position.set(-0.38, height * 0.3, -length * 0.53);
      chassisGroup.add(rBumper, rGuardL, rGuardR);

      // 7. Signature Rear Fender Skirts (covering top of rear wheels)
      const skirtGeo = new THREE.BoxGeometry(0.05, height * 0.38, length * 0.28);
      const skirtL = new THREE.Mesh(skirtGeo, bodyMaterial);
      skirtL.position.set(width * 0.505, height * 0.36, -config.dimensions.wheelbase * 0.5);
      const skirtR = new THREE.Mesh(skirtGeo, bodyMaterial);
      skirtR.position.set(-width * 0.505, height * 0.36, -config.dimensions.wheelbase * 0.5);
      chassisGroup.add(skirtL, skirtR);

      // 8. Chrome Side Body Spears (running full body length)
      const sideSpearGeo = new THREE.BoxGeometry(0.03, 0.04, length * 0.85);
      const sideSpearL = new THREE.Mesh(sideSpearGeo, chromeMaterial);
      sideSpearL.position.set(width * 0.51, height * 0.44, 0);
      const sideSpearR = new THREE.Mesh(sideSpearGeo, chromeMaterial);
      sideSpearR.position.set(-width * 0.51, height * 0.44, 0);
      chassisGroup.add(sideSpearL, sideSpearR);

    } else if (config.id === 'gtr_r35') {
      // NISSAN GT-R R35 "GODZILLA"
      // 1. High carbon pedestal GT wing
      const gtrWing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 0.04, 0.35), carbonMaterial);
      gtrWing.position.set(0, height * 0.88, -length * 0.46);
      const gtrStrutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.12), carbonMaterial);
      gtrStrutL.position.set(0.42, height * 0.67, -length * 0.46);
      const gtrStrutR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.12), carbonMaterial);
      gtrStrutR.position.set(-0.42, height * 0.67, -length * 0.46);
      spoilerGroup.add(gtrWing, gtrStrutL, gtrStrutR);

      // 2. Twin NACA bonnet air scoops
      const nacaL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.28), carbonMaterial);
      nacaL.position.set(0.24, height * 0.54, length * 0.28);
      const nacaR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.28), carbonMaterial);
      nacaR.position.set(-0.24, height * 0.54, length * 0.28);
      chassisGroup.add(nacaL, nacaR);

      // 3. Quad signature circular taillights
      [-0.34, -0.16, 0.16, 0.34].forEach(xOff => {
        const ringGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
        ringGeo.rotateX(Math.PI / 2);
        const ring = new THREE.Mesh(ringGeo, brakeLightMaterial);
        ring.position.set(xOff, height * 0.46, -length * 0.505);
        chassisGroup.add(ring);
      });

      // 4. Quad titanium exhaust tips
      [-0.35, -0.25, 0.25, 0.35].forEach(xOff => {
        const pipeGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.16, 12);
        pipeGeo.rotateX(Math.PI / 2);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(xOff, height * 0.18, -length * 0.52);
        chassisGroup.add(pipe);
      });

    } else if (config.id === 'miata_na') {
      // MAZDA MX-5 MIATA NA ROADSTER
      // 1. Pop-Up Headlight Pods on front hood
      const popupPodGeo = new THREE.BoxGeometry(width * 0.24, 0.14, 0.26);
      const popL = new THREE.Mesh(popupPodGeo, bodyMaterial);
      popL.position.set(width * 0.26, height * 0.6, length * 0.34);
      popL.rotation.x = -0.18;
      const popR = new THREE.Mesh(popupPodGeo, bodyMaterial);
      popR.position.set(-width * 0.26, height * 0.6, length * 0.34);
      popR.rotation.x = -0.18;

      // Round headlights inside pop-up pods
      const roundLampGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.04, 16);
      roundLampGeo.rotateX(Math.PI / 2);
      const lampL = new THREE.Mesh(roundLampGeo, headlightMaterial);
      lampL.position.set(0, 0, 0.13);
      popL.add(lampL);
      const lampR = new THREE.Mesh(roundLampGeo, headlightMaterial);
      lampR.position.set(0, 0, 0.13);
      popR.add(lampR);
      chassisGroup.add(popL, popR);

      // 2. Twin Chrome Safety Roll Hoops behind seats
      const hoopGeo = new THREE.TorusGeometry(0.14, 0.025, 8, 16, Math.PI);
      const hoopL = new THREE.Mesh(hoopGeo, chromeMaterial);
      hoopL.position.set(width * 0.24, height * 0.88, -length * 0.05);
      const hoopR = new THREE.Mesh(hoopGeo, chromeMaterial);
      hoopR.position.set(-width * 0.24, height * 0.88, -length * 0.05);
      chassisGroup.add(hoopL, hoopR);

      // 3. Cute smiling lower grille mouth with red tow hook
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(width * 0.44, height * 0.14, 0.08), carbonMaterial);
      mouth.position.set(0, height * 0.26, length * 0.505);
      const towHook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      towHook.position.set(width * 0.2, height * 0.22, length * 0.52);
      chassisGroup.add(mouth, towHook);

      // 4. Polished chrome dual exhaust
      const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12);
      pipeGeo.rotateX(Math.PI / 2);
      const ex1 = new THREE.Mesh(pipeGeo, chromeMaterial);
      ex1.position.set(0.26, height * 0.2, -length * 0.51);
      const ex2 = new THREE.Mesh(pipeGeo, chromeMaterial);
      ex2.position.set(0.35, height * 0.2, -length * 0.51);
      chassisGroup.add(ex1, ex2);

    } else if (config.id === 'dino_246gt') {
      // FERRARI DINO 246 GT CLASSIC
      // 1. Flowing voluptuous front fender arches
      const fenderGeo = new THREE.BoxGeometry(width * 0.26, height * 0.28, length * 0.45);
      const fenderL = new THREE.Mesh(fenderGeo, bodyMaterial);
      fenderL.position.set(width * 0.36, height * 0.52, length * 0.24);
      const fenderR = new THREE.Mesh(fenderGeo, bodyMaterial);
      fenderR.position.set(-width * 0.36, height * 0.52, length * 0.24);
      chassisGroup.add(fenderL, fenderR);

      // 2. Scalloped side air scoops on doors for mid-mounted V6
      const scoopGeo = new THREE.BoxGeometry(0.08, height * 0.18, 0.32);
      const scoopL = new THREE.Mesh(scoopGeo, carbonMaterial);
      scoopL.position.set(width * 0.48, height * 0.45, -length * 0.1);
      const scoopR = new THREE.Mesh(scoopGeo, carbonMaterial);
      scoopR.position.set(-width * 0.48, height * 0.45, -length * 0.1);
      chassisGroup.add(scoopL, scoopR);

      // 3. Iconic Flying Buttress rear roof pillars framing vertical rear window
      const buttressGeo = new THREE.BoxGeometry(0.08, height * 0.35, length * 0.32);
      const buttL = new THREE.Mesh(buttressGeo, bodyMaterial);
      buttL.position.set(width * 0.32, height * 0.72, -length * 0.2);
      buttL.rotation.x = 0.28;
      const buttR = new THREE.Mesh(buttressGeo, bodyMaterial);
      buttR.position.set(-width * 0.32, height * 0.72, -length * 0.2);
      buttR.rotation.x = 0.28;
      chassisGroup.add(buttL, buttR);

      // 4. Vintage chrome split bumperettes (front and rear)
      const bumpF1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), chromeMaterial);
      bumpF1.position.set(width * 0.32, height * 0.26, length * 0.52);
      const bumpF2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), chromeMaterial);
      bumpF2.position.set(-width * 0.32, height * 0.26, length * 0.52);

      const bumpR1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), chromeMaterial);
      bumpR1.position.set(width * 0.32, height * 0.3, -length * 0.51);
      const bumpR2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), chromeMaterial);
      bumpR2.position.set(-width * 0.32, height * 0.3, -length * 0.51);
      chassisGroup.add(bumpF1, bumpF2, bumpR1, bumpR2);

      // 5. Quad classic round taillights
      [-0.32, -0.18, 0.18, 0.32].forEach(xOff => {
        const tailRing = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), brakeLightMaterial);
        tailRing.rotation.x = Math.PI / 2;
        tailRing.position.set(xOff, height * 0.44, -length * 0.505);
        chassisGroup.add(tailRing);
      });

      // 6. Classic quad chrome exhaust pipes
      [-0.26, -0.18, 0.18, 0.26].forEach(xOff => {
        const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12);
        pipeGeo.rotateX(Math.PI / 2);
        const pipe = new THREE.Mesh(pipeGeo, chromeMaterial);
        pipe.position.set(xOff, height * 0.2, -length * 0.52);
        chassisGroup.add(pipe);
      });
    }
  }

  chassisGroup.add(spoilerGroup);

  // 1. Ambient Occlusion Ground Contact Shadow Decal
  const shadowPlaneGeo = new THREE.PlaneGeometry(width * 1.35, length * 1.15);
  shadowPlaneGeo.rotateX(-Math.PI / 2);
  const shadowPlaneMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const contactShadowMesh = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  contactShadowMesh.position.set(0, 0.015, 0);
  rootGroup.add(contactShadowMesh);

  // 2. Aerodynamic Side Wing Mirrors with Mirror Glass
  [-1, 1].forEach(side => {
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(side * (width * 0.48), height * 0.58, length * 0.16);

    // Stalk mount
    const stalkGeo = new THREE.BoxGeometry(0.06, 0.03, 0.08);
    const stalk = new THREE.Mesh(stalkGeo, carbonMaterial);
    stalk.position.set(side * 0.03, 0, 0);
    mirrorGroup.add(stalk);

    // Aerodynamic housing
    const housingGeo = new THREE.BoxGeometry(0.12, 0.09, 0.18);
    const housing = new THREE.Mesh(housingGeo, bodyMaterial);
    housing.position.set(side * 0.08, 0.02, -0.02);
    housing.rotation.y = side * 0.18;
    mirrorGroup.add(housing);

    // Reflective Chrome Mirror Glass
    const glassGeo = new THREE.PlaneGeometry(0.08, 0.06);
    const mirrorGlass = new THREE.Mesh(glassGeo, chromeMaterial);
    mirrorGlass.position.set(side * 0.08, 0.02, -0.111);
    mirrorGlass.rotation.y = Math.PI;
    mirrorGroup.add(mirrorGlass);

    chassisGroup.add(mirrorGroup);
  });

  // 3. Front Honeycomb Grille & Aluminum Intercooler Core
  const grilleMeshGeo = new THREE.PlaneGeometry(width * 0.62, height * 0.22);
  const grilleMeshMat = new THREE.MeshStandardMaterial({
    map: grilleMeshTex,
    color: 0x18181b,
    roughness: 0.9,
    metalness: 0.2,
  });
  const frontGrille = new THREE.Mesh(grilleMeshGeo, grilleMeshMat);
  frontGrille.position.set(0, height * 0.24, length * 0.498);
  chassisGroup.add(frontGrille);

  // Intercooler core behind grille
  const intercoolerGeo = new THREE.BoxGeometry(width * 0.54, height * 0.18, 0.06);
  const intercooler = new THREE.Mesh(intercoolerGeo, chromeMaterial);
  intercooler.position.set(0, height * 0.24, length * 0.46);
  chassisGroup.add(intercooler);

  // 4. Aerodynamic Windshield Wipers
  [-0.24, 0.18].forEach(wx => {
    const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.32), carbonMaterial);
    wiperArm.position.set(wx, height * 0.54, length * 0.14);
    wiperArm.rotation.x = -0.32;
    wiperArm.rotation.y = -0.12;
    chassisGroup.add(wiperArm);
  });

  // 5. Realistic Headlight Assemblies: Projector Lenses, LED DRL Blades & Outer Glass Lens
  [-1, 1].forEach(side => {
    const headGroup = new THREE.Group();
    headGroup.position.set(side * (width * 0.36), height * 0.38, length * 0.49);

    // Dark Chrome Reflector Housing Bucket
    const bucketGeo = new THREE.BoxGeometry(width * 0.2, 0.09, 0.1);
    const bucket = new THREE.Mesh(bucketGeo, carbonMaterial);
    headGroup.add(bucket);

    // Dual High-Intensity Projector Spheres
    [-0.05, 0.05].forEach(projX => {
      const projLens = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), headlightMaterial);
      projLens.position.set(projX, 0, 0.04);
      headGroup.add(projLens);
    });

    // Signature LED DRL Halo / Light Guide Blade
    const drlBlade = new THREE.Mesh(new THREE.BoxGeometry(width * 0.18, 0.014, 0.02), headlightMaterial);
    drlBlade.position.set(0, 0.032, 0.048);
    headGroup.add(drlBlade);

    // Outer Crystal Polycarbonate Protective Cover Lens
    const coverGeo = new THREE.BoxGeometry(width * 0.205, 0.095, 0.02);
    const cover = new THREE.Mesh(coverGeo, glassMaterial);
    cover.position.set(0, 0, 0.052);
    headGroup.add(cover);

    chassisGroup.add(headGroup);
  });

  // 6. Realistic 3D LED Taillight Assemblies: Prism Diffusers & Ruby Lightbars
  [-1, 1].forEach(side => {
    const tailGroup = new THREE.Group();
    tailGroup.position.set(side * (width * 0.32), height * 0.45, -length * 0.505);

    // Dark Housing
    const tailHousing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.32, 0.08, 0.06), carbonMaterial);
    tailGroup.add(tailHousing);

    // Glowing LED Lightbar Blade
    const tailBlade = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, 0.045, 0.02), brakeLightMaterial);
    tailBlade.position.set(0, 0, -0.025);
    tailGroup.add(tailBlade);

    chassisGroup.add(tailGroup);
  });

  const revLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), reverseLightMaterial);
  revLight.position.set(0, height * 0.35, -length * 0.505);
  chassisGroup.add(revLight);

  // 7. Embossed Real-Life Automotive License Plate Bracket & Illuminating LEDs
  if (config.id !== 'formula_apex') {
    const plateGroup = new THREE.Group();
    plateGroup.position.set(0, height * 0.3, -length * 0.505);

    // Frame bracket
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.02), carbonMaterial);
    plateGroup.add(frame);

    // Stamped metal license plate face
    const plateFace = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.19), licensePlateMaterial);
    plateFace.position.set(0, 0, -0.012);
    plateFace.rotation.y = Math.PI;
    plateGroup.add(plateFace);

    // Twin White LED plate lamps
    [-0.14, 0.14].forEach(lx => {
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.014, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8 })
      );
      lamp.position.set(lx, 0.115, -0.01);
      plateGroup.add(lamp);
    });

    chassisGroup.add(plateGroup);
  }

  // 8. Beveled Hollow Exhaust Pipes with Burnt Titanium Tips
  const hasCustomExhaust = ['formula_apex', 'titan_trophy', 'hudson_hornet', 'gtr_r35', 'miata_na', 'dino_246gt', 'muscle_horizon', 'viper_drift'].includes(config.id);
  if (!hasCustomExhaust) {
    [-0.28, 0.28].forEach(xPos => {
      const pipeGroup = new THREE.Group();
      pipeGroup.position.set(xPos, height * 0.18, -length * 0.505);

      // Outer Titanium Beveled Sleeve
      const outerSleeveGeo = new THREE.CylinderGeometry(0.064, 0.064, 0.18, 16);
      outerSleeveGeo.rotateX(Math.PI / 2);
      const outerSleeve = new THREE.Mesh(outerSleeveGeo, burntTitaniumMaterial);
      pipeGroup.add(outerSleeve);

      // Inner Dark Hollow Bore
      const innerBoreGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.185, 16);
      innerBoreGeo.rotateX(Math.PI / 2);
      const innerBore = new THREE.Mesh(
        innerBoreGeo,
        new THREE.MeshBasicMaterial({ color: 0x050505 })
      );
      innerBore.position.z = -0.005;
      pipeGroup.add(innerBore);

      chassisGroup.add(pipeGroup);
    });
  }

  // 9. Aerodynamic Flush Door Handles & Billet Fuel Filler Flap
  if (config.id !== 'formula_apex' && config.id !== 'titan_trophy') {
    [-1, 1].forEach(side => {
      const handleRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, 0.038, 0.14),
        interiorMaterial
      );
      handleRecess.position.set(side * (width * 0.472), height * 0.54, 0);
      const handleGrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.024, 0.12),
        bodyMaterial
      );
      handleGrip.position.set(side * (width * 0.478), height * 0.54, 0);
      chassisGroup.add(handleRecess, handleGrip);
    });

    const fuelCapGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.015, 16);
    fuelCapGeo.rotateZ(Math.PI / 2);
    const fuelCap = new THREE.Mesh(fuelCapGeo, chromeMaterial);
    fuelCap.position.set(width * 0.475, height * 0.62, -length * 0.28);
    chassisGroup.add(fuelCap);
  }

  // 10. Aerodynamic Roof Vortex Generator Fins
  if (['apex_gt', 'viper_drift', 'shinobi_r34', 'cyber_phantom', 'gtr_r35'].includes(config.id)) {
    for (let f = -3; f <= 3; f++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 4), carbonMaterial);
      fin.rotation.x = Math.PI / 2;
      fin.position.set(f * 0.11, height * 0.945, -length * 0.15);
      chassisGroup.add(fin);
    }
  }

  // Real-time Headlight Spotlights
  const spotL = new THREE.SpotLight(0xfffbeb, 0, 120, Math.PI / 4.8, 0.4, 1.1);
  spotL.position.set(width * 0.36, height * 0.38, length * 0.5);
  const targetL = new THREE.Object3D();
  targetL.position.set(width * 0.3, 0, length * 0.5 + 40);
  rootGroup.add(targetL);
  spotL.target = targetL;

  const spotR = new THREE.SpotLight(0xfffbeb, 0, 120, Math.PI / 4.8, 0.4, 1.1);
  spotR.position.set(-width * 0.36, height * 0.38, length * 0.5);
  const targetR = new THREE.Object3D();
  targetR.position.set(-width * 0.3, 0, length * 0.5 + 40);
  rootGroup.add(targetR);
  spotR.target = targetR;

  rootGroup.add(spotL, spotR);

  // Realistic Backfire Flame Burst Mesh & Dynamic Combustion Light
  const flameGroup = new THREE.Group();
  const flameGeo = new THREE.ConeGeometry(0.12, 0.52, 8);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
  const exhaustFlameMesh = new THREE.Mesh(flameGeo, flameMat);
  exhaustFlameMesh.position.set(0.28, 0.18, -length * 0.58);
  flameGroup.add(exhaustFlameMesh);

  // Secondary dual tip flame cone
  const flame2 = new THREE.Mesh(flameGeo, flameMat);
  flame2.position.set(-0.28, 0.18, -length * 0.58);
  flameGroup.add(flame2);

  chassisGroup.add(flameGroup);

  const exhaustFlameLight = new THREE.PointLight(0xf97316, 0, 9, 2);
  exhaustFlameLight.position.set(0, 0.22, -length * 0.6);
  rootGroup.add(exhaustFlameLight);

  // Underglow Neon Glow
  const underglowHex = (upgrades.neonUnderglow && upgrades.neonUnderglow !== '#000000')
    ? upgrades.neonUnderglow
    : (upgrades.neonColor || '#06b6d4');
  const isNeonActive = upgrades.neonUnderglow !== '#000000';
  const underglowLight = new THREE.PointLight(underglowHex, isNeonActive ? 1.8 : 0, 4.5, 1.8);
  underglowLight.position.set(0, 0.08, 0);
  rootGroup.add(underglowLight);

  const underglowMeshGeo = new THREE.PlaneGeometry(width * 1.2, length * 0.9);
  underglowMeshGeo.rotateX(-Math.PI / 2);
  const underglowMesh = new THREE.Mesh(
    underglowMeshGeo,
    new THREE.MeshBasicMaterial({
      color: underglowHex,
      transparent: true,
      opacity: isNeonActive ? 0.45 : 0,
      blending: THREE.AdditiveBlending,
    })
  );
  underglowMesh.position.set(0, 0.02, 0);
  rootGroup.add(underglowMesh);

  // -------------------------------------------------------------
  // WHEEL ASSEMBLIES WITH SCULPTED ALLOY RIMS, DRILLED ROTORS & MONOBLOCK CALIPERS
  // -------------------------------------------------------------
  const wheelMeshes: THREE.Group[] = [];
  const rotorMeshes: THREE.Mesh[] = [];
  const caliperMeshes: THREE.Mesh[] = [];

  const halfWidth = width * 0.48;
  const halfLength = config.dimensions.wheelbase * 0.5;
  const wheelRadius = config.dimensions.wheelRadius;
  const wheelThickness = config.id === 'titan_trophy' ? 0.34 : 0.28;

  // Caliper color based on custom choice or brake upgrade
  const caliperColor = upgrades.caliperColor
    ? new THREE.Color(upgrades.caliperColor)
    : (upgrades.brakesStage === 2 ? 0xf59e0b : upgrades.brakesStage === 1 ? 0xef4444 : 0x71717a);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: caliperColor,
    metalness: 0.85,
    roughness: 0.15,
  });

  // High-Performance Radial Tire with directional tread & sipes
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    map: tireTextures.map,
    bumpMap: tireTextures.bumpMap,
    bumpScale: 0.05,
    roughness: upgrades.tireCompound === 'race_slicks' ? 0.45 : 0.88,
    metalness: 0.06,
  });

  // Machined Alloy Rim Material
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0xeeeeee,
    metalness: 0.96,
    roughness: 0.12,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    envMapIntensity: 2.8,
  });

  const rotorMat = new THREE.MeshStandardMaterial({
    map: rotorTexture,
    metalness: 0.95,
    roughness: 0.2,
    emissive: 0xef4444,
    emissiveIntensity: 0,
  });

  const wheelPositions = [
    new THREE.Vector3(halfWidth, wheelRadius, halfLength),   // FL
    new THREE.Vector3(-halfWidth, wheelRadius, halfLength),  // FR
    new THREE.Vector3(halfWidth, wheelRadius, -halfLength),  // RL
    new THREE.Vector3(-halfWidth, wheelRadius, -halfLength), // RR
  ];

  wheelPositions.forEach((pos, idx) => {
    const wheelAssembly = new THREE.Group();
    wheelAssembly.position.copy(pos);
    const isLeft = idx % 2 === 0;

    // Spin Sub-Group
    const spinGroup = new THREE.Group();
    wheelAssembly.add(spinGroup);

    // 1. High-Performance Tire Rubber
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 32);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.castShadow = true;
    spinGroup.add(tireMesh);

    // 1b. High-Detail Tire Sidewall with embossed competition lettering & compound stripe
    if (config.id !== 'hudson_hornet') {
      const sidewallMat = new THREE.MeshStandardMaterial({
        map: tireSidewallTex,
        roughness: 0.88,
        metalness: 0.05,
      });
      const sidewallGeo = new THREE.RingGeometry(wheelRadius * 0.74, wheelRadius * 0.99, 32);
      const sidewallMesh = new THREE.Mesh(sidewallGeo, sidewallMat);
      sidewallMesh.position.x = isLeft ? wheelThickness * 0.505 : -wheelThickness * 0.505;
      sidewallMesh.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
      spinGroup.add(sidewallMesh);
    }

    // 2. Machined Alloy Rim Outer Lip & Barrel
    const rimBarrelGeo = new THREE.CylinderGeometry(wheelRadius * 0.76, wheelRadius * 0.74, wheelThickness * 0.92, 24);
    rimBarrelGeo.rotateZ(Math.PI / 2);
    const rimBarrel = new THREE.Mesh(rimBarrelGeo, rimMat);
    spinGroup.add(rimBarrel);

    // 3. Sculpted 5-Split Twin Spokes (10 Aerodynamic Alloy Blades)
    const spokeCount = 10;
    const rimFaceX = isLeft ? wheelThickness * 0.38 : -wheelThickness * 0.38;
    const spokeGroup = new THREE.Group();
    spokeGroup.position.x = rimFaceX;

    for (let s = 0; s < spokeCount; s++) {
      const angle = (s / spokeCount) * Math.PI * 2;
      const spokeLength = wheelRadius * 0.55;
      const spokeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, spokeLength, 0.028),
        rimMat
      );
      spokeMesh.position.set(0, Math.sin(angle) * (spokeLength * 0.54), Math.cos(angle) * (spokeLength * 0.54));
      spokeMesh.rotation.x = -angle;
      spokeGroup.add(spokeMesh);
    }

    // Recessed Center Hub & Lug Nuts
    const hubCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 16), rimMat);
    hubCenter.rotateZ(Math.PI / 2);
    spokeGroup.add(hubCenter);

    // 5 Chrome Lug Nuts
    for (let l = 0; l < 5; l++) {
      const lAngle = (l / 5) * Math.PI * 2;
      const lugNut = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.016, 6), chromeMaterial);
      lugNut.rotateZ(Math.PI / 2);
      lugNut.position.set(0.015, Math.sin(lAngle) * 0.042, Math.cos(lAngle) * 0.042);
      spokeGroup.add(lugNut);
    }

    // Center Badge Cap
    const badgeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 16), carbonMaterial);
    badgeCap.rotateZ(Math.PI / 2);
    badgeCap.position.set(0.018, 0, 0);
    spokeGroup.add(badgeCap);

    spinGroup.add(spokeGroup);

    // Vintage Whitewall ring & Chrome dish hubcaps for Hudson Hornet
    if (config.id === 'hudson_hornet') {
      const whitewallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      const whitewallGeo = new THREE.RingGeometry(wheelRadius * 0.52, wheelRadius * 0.85, 24);
      const whitewall = new THREE.Mesh(whitewallGeo, whitewallMat);
      whitewall.position.x = isLeft ? wheelThickness * 0.46 : -wheelThickness * 0.46;
      whitewall.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
      spinGroup.add(whitewall);

      // Solid chrome dish hubcap
      const dishGeo = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, wheelThickness * 0.94, 20);
      dishGeo.rotateZ(Math.PI / 2);
      const dish = new THREE.Mesh(dishGeo, chromeMaterial);
      spinGroup.add(dish);
    }

    // 4. Cross-Drilled & Slotted Brake Rotor with 2-Piece Aluminum Floating Center Bell
    const rotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, 0.022, 24);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    spinGroup.add(rotor);
    rotorMeshes.push(rotor);

    // Billet Aluminum Center Hat Bell
    const bellGeo = new THREE.CylinderGeometry(wheelRadius * 0.32, wheelRadius * 0.32, 0.026, 20);
    bellGeo.rotateZ(Math.PI / 2);
    const bellMesh = new THREE.Mesh(bellGeo, carbonMaterial);
    spinGroup.add(bellMesh);

    // Floating Drive Bobbin Pins around bell perimeter
    for (let b = 0; b < 8; b++) {
      const bAngle = (b / 8) * Math.PI * 2;
      const bobbin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.028, 8), chromeMaterial);
      bobbin.rotateZ(Math.PI / 2);
      bobbin.position.set(0, Math.sin(bAngle) * (wheelRadius * 0.31), Math.cos(bAngle) * (wheelRadius * 0.31));
      spinGroup.add(bobbin);
    }

    // 5. Stationary 6-Piston Monoblock Brake Caliper with Chrome Plate & Bleed Screws
    const caliperGroup = new THREE.Group();
    const caliperMain = new THREE.Mesh(
      new THREE.BoxGeometry(wheelThickness * 0.45, wheelRadius * 0.38, wheelRadius * 0.28),
      caliperMat
    );
    caliperGroup.add(caliperMain);

    // Brushed Chrome Caliper Faceplate Badge
    const badgePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, wheelRadius * 0.18, wheelRadius * 0.22),
      chromeMaterial
    );
    badgePlate.position.set(isLeft ? wheelThickness * 0.23 : -wheelThickness * 0.23, 0, 0);
    caliperGroup.add(badgePlate);

    // Silver Bleed Screws
    [-0.07, 0.07].forEach(bx => {
      const bleedScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.018, 6), chromeMaterial);
      bleedScrew.position.set(0, wheelRadius * 0.2, bx);
      caliperGroup.add(bleedScrew);
    });

    // Caliper mounting position (clamping upper disc quadrant)
    caliperGroup.position.set(isLeft ? -0.05 : 0.05, wheelRadius * 0.36, 0);
    wheelAssembly.add(caliperGroup);
    caliperMeshes.push(caliperMain);

    // 6. Coilover Racing Suspension: Chrome Damper Shaft, Powdercoated Coiled Spring & Knuckle
    const coiloverGroup = new THREE.Group();
    coiloverGroup.position.set(
      pos.x + (isLeft ? -0.12 : 0.12),
      pos.y + wheelRadius * 0.35,
      pos.z
    );

    // Polished chrome damper shock shaft
    const shockShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, wheelRadius * 0.9, 10),
      chromeMaterial
    );
    coiloverGroup.add(shockShaft);

    // High-performance coiled racing spring (powdercoated bright yellow front, red rear)
    const springMat = new THREE.MeshStandardMaterial({
      color: idx < 2 ? 0xfacc15 : 0xef4444,
      metalness: 0.7,
      roughness: 0.2,
    });
    const coilCount = 6;
    for (let c = 0; c < coilCount; c++) {
      const coilRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.046, 0.011, 8, 16),
        springMat
      );
      coilRing.rotateX(Math.PI / 2);
      coilRing.position.y = -wheelRadius * 0.32 + (c / coilCount) * (wheelRadius * 0.65);
      coiloverGroup.add(coilRing);
      suspensionCoils.push(coilRing);
    }

    // Top billet strut mount hat & lower wishbone knuckle
    const topHat = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 12), carbonMaterial);
    topHat.position.y = wheelRadius * 0.42;
    const lowerKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), carbonMaterial);
    lowerKnuckle.position.y = -wheelRadius * 0.38;
    coiloverGroup.add(topHat, lowerKnuckle);

    rootGroup.add(coiloverGroup);

    rootGroup.add(wheelAssembly);
    wheelMeshes.push(wheelAssembly);
  });

  return {
    rootGroup,
    chassisGroup,
    wheelMeshes,
    brakeLightMaterial,
    headlightMaterial,
    reverseLightMaterial,
    bodyMaterial,
    headlightBeams: [spotL, spotR],
    exhaustFlameMesh,
    exhaustFlameLight,
    activeSpoiler: spoilerGroup,
    underglowLight,
    underglowMesh,
    rotorMeshes,
    caliperMeshes,
    contactShadowMesh,
    glassMaterial,
    carbonMaterial,
    chromeMaterial,
    steeringWheelGroup: activeSteeringWheelGroup,
    wiperGroup: activeWiperGroup,
    suspensionCoils,
  };
}
