import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { CameraView, CarConfig, GraphicsQuality, InputState, Mission, MissionProgress, TimeOfDay, VehicleState, VisualTheme, VehicleUpgrades, DEFAULT_UPGRADES } from './types';
import { VehiclePhysics } from './physics';
import { CAR_PRESETS, Car3DView, createCar3D } from './cars';
import { WorldObject, createWorld } from './world';
import { EnvironmentManager } from './environment';
import { SpeedLines, RacingGuideLine, GuideMode } from './effects';
import { ParticleEmitter, SkidMarkManager } from './particles';
import { soundEngine } from './audio';
import { MISSIONS } from './missions';
import { RivalCarManager, RivalTierConfig } from './RivalAI';
import { TelemetryRecorder } from './telemetry';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: WorldObject;
  private environmentManager: EnvironmentManager;
  private speedLines: SpeedLines;
  private racingLine: RacingGuideLine;
  private physics: VehiclePhysics;
  private car3D: Car3DView;
  private skidMarks: SkidMarkManager;
  private particles: ParticleEmitter;
  public rivalManager: RivalCarManager;
  public telemetryRecorder: TelemetryRecorder = new TelemetryRecorder();

  // Active configurations
  private currentCarConfig: CarConfig;
  private currentCarColor: string;
  public cameraMode: CameraView = 'chase';
  public timeOfDay: TimeOfDay = 'day';
  public visualTheme: VisualTheme = 'photoreal';
  public graphicsQuality: GraphicsQuality = 'balanced';
  public carUpgrades: Record<string, VehicleUpgrades> = {};

  // Performance and FPS metrics
  public currentFps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private uiUpdateTimer: number = 0;
  private smokeTimer: number = 0;

  // Scratch vectors for zero-allocation game loop
  private readonly _forward = new THREE.Vector3();
  private readonly _camDir = new THREE.Vector3();
  private readonly _upVec = new THREE.Vector3(0, 1, 0);
  private readonly _targetCamPos = new THREE.Vector3();
  private readonly _targetLook = new THREE.Vector3();
  private readonly _tempWorldL = new THREE.Vector3();
  private readonly _tempWorldR = new THREE.Vector3();

  // State callbacks for React UI
  private onStateUpdate?: (state: VehicleState, mission: MissionProgress | null, fps?: number) => void;
  private onMissionFinished?: (progress: MissionProgress, mission: Mission) => void;
  private onCarSwitched?: (carId: string) => void;
  private onThemeSwitched?: (theme: VisualTheme) => void;

  // Mission management
  public activeMission: Mission | null = null;
  public missionProgress: MissionProgress | null = null;

  // Input state
  private inputState: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    shiftUp: false,
    shiftDown: false,
    boost: false,
  };

  // Camera damping variables
  private cameraPosition = new THREE.Vector3(0, 5, -10);
  private cameraLookTarget = new THREE.Vector3(0, 1, 0);
  private shakeOffset = new THREE.Vector3();

  // Per-camera 360 look-around angles (in radians)
  public chaseLookYaw: number = 0; // Relative horizontal angle around car
  public chaseLookPitch: number = 0; // Relative elevation
  public firstPersonLookYaw: number = 0; // 360 driver head look yaw inside cabin
  public firstPersonLookPitch: number = 0; // Driver head vertical pitch
  public hoodLookYaw: number = 0; // 360 cockpit look angle
  public hoodLookPitch: number = 0;
  public bumperLookYaw: number = 0;
  public bumperLookPitch: number = 0;
  public topDownLookYaw: number = 0;
  private lastDragTime: number = 0;

  // Dedicated 360 Free Orbit Camera state
  public orbitAzimuth: number = 0; // Horizontal orbit angle (radians)
  public orbitPolar: number = 0.36; // Vertical elevation angle (radians)
  public orbitDistance: number = 6.2; // Distance from vehicle center
  private isOrbitDragging: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // Real-Time Dynamic Vehicle Environment Reflection Probe
  private carCubeRenderTarget: THREE.WebGLCubeRenderTarget | null = null;
  private carCubeCamera: THREE.CubeCamera | null = null;
  private reflectionFrameCount: number = 0;
  private lastReflectionPos: THREE.Vector3 = new THREE.Vector3(-999, -999, -999);

  // Real-world dynamic simulation states
  private brakeRotorTemp: number = 40; // Ambient 40°C
  private wiperCycle: number = 0;

  // Animation frame loop
  private animId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(container: HTMLElement, initialCarId: string = 'apex_gt') {
    this.container = container;
    this.currentCarConfig = CAR_PRESETS[initialCarId] || CAR_PRESETS.apex_gt;
    this.currentCarColor = this.currentCarConfig.defaultColor;
    this.carUpgrades[this.currentCarConfig.id] = { ...DEFAULT_UPGRADES };

    // 1. Scene & Camera (Optimized clipping planes: 0.06 near for cockpit steering wheel, 2500 far for distant biomes)
    this.scene = new THREE.Scene();
    const w = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const h = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720);
    const aspect = h > 0 ? w / h : 16 / 9;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.06, 2500);

    // 2. High-Performance WebGL Renderer with Soft Cinematic Shadowing
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: false,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. World & Sky Environment
    this.world = createWorld(this.scene);
    this.environmentManager = new EnvironmentManager(this.renderer, this.scene);
    this.environmentManager.setEnvironment(this.timeOfDay, this.visualTheme);

    // 4. Vehicle Physics
    this.physics = new VehiclePhysics(this.currentCarConfig, this.carUpgrades[this.currentCarConfig.id]);

    // 5. Car 3D Visual Mesh
    this.car3D = createCar3D(this.currentCarConfig, this.currentCarColor, this.carUpgrades[this.currentCarConfig.id]);
    this.scene.add(this.car3D.rootGroup);

    // 5b. Real-Time Dynamic Car Reflection Probe (Optimized 128x128 cubemap for high FPS)
    this.carCubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
      generateMipmaps: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      colorSpace: THREE.SRGBColorSpace,
    });
    this.carCubeCamera = new THREE.CubeCamera(0.3, 300, this.carCubeRenderTarget);
    this.scene.add(this.carCubeCamera);
    this.applyReflectionMapToCar();

    // 6. Effects: Skidmarks, Smoke Particles, Speed Wind Lines, Dynamic Racing Guide Line
    this.skidMarks = new SkidMarkManager(this.scene);
    this.particles = new ParticleEmitter(this.scene);
    this.speedLines = new SpeedLines();
    this.scene.add(this.speedLines.group);

    this.racingLine = new RacingGuideLine();
    this.scene.add(this.racingLine.group);

    // 7. Computer / Rival AI Car
    this.rivalManager = new RivalCarManager(this.scene);
    this.rivalManager.onDefeatCallback = (tier, streak) => {
      if (this.onRivalDefeated) {
        this.onRivalDefeated(tier, streak);
      }
    };

    // Setup input listeners & window resize
    this.setupEventListeners();

    // Sound profile
    soundEngine.setSoundProfile(this.currentCarConfig.engineSoundType);
  }

  public onRivalDefeated?: (tier: RivalTierConfig, streak: number) => void;

  public setOnRivalDefeated(cb: (tier: RivalTierConfig, streak: number) => void) {
    this.onRivalDefeated = cb;
  }

  public teleportToRival() {
    this.physics.position.set(
      this.rivalManager.position.x - Math.sin(this.rivalManager.headingAngle) * 18,
      0.45,
      this.rivalManager.position.z - Math.cos(this.rivalManager.headingAngle) * 18
    );
    this.physics.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rivalManager.headingAngle);
    this.physics.velocity.set(0, 0, 0);
  }

  public advanceRivalTier() {
    this.rivalManager.advanceToNextRivalTier();
  }

  public setOnStateUpdate(cb: (state: VehicleState, mission: MissionProgress | null, fps?: number) => void) {
    this.onStateUpdate = cb;
  }

  public setOnMissionFinished(cb: (progress: MissionProgress, mission: Mission) => void) {
    this.onMissionFinished = cb;
  }

  public setOnCarSwitched(cb: (carId: string) => void) {
    this.onCarSwitched = cb;
  }

  public setOnThemeSwitched(cb: (theme: VisualTheme) => void) {
    this.onThemeSwitched = cb;
  }

  public switchCar(carId: string, colorHex?: string) {
    const config = CAR_PRESETS[carId];
    if (!config) return;

    this.currentCarConfig = config;
    if (colorHex) this.currentCarColor = colorHex;
    else this.currentCarColor = config.defaultColor;

    if (!this.carUpgrades[carId]) {
      this.carUpgrades[carId] = { ...DEFAULT_UPGRADES };
    }
    const currentUpgrade = this.carUpgrades[carId];

    // Remove old car mesh
    this.scene.remove(this.car3D.rootGroup);

    // Rebuild 3D model with upgrades applied
    this.car3D = createCar3D(this.currentCarConfig, this.currentCarColor, currentUpgrade);
    this.scene.add(this.car3D.rootGroup);
    this.applyReflectionMapToCar();

    // Update physics config & upgrades
    const currentPos = this.physics.position.clone();
    const currentRotY = new THREE.Euler().setFromQuaternion(this.physics.quaternion, 'YXZ').y;
    this.physics.setConfig(this.currentCarConfig);
    this.physics.setUpgrades(currentUpgrade);
    this.physics.reset([currentPos.x, currentPos.y, currentPos.z], currentRotY);

    // Update sound profile
    soundEngine.setSoundProfile(config.engineSoundType);

    if (this.onCarSwitched) {
      this.onCarSwitched(carId);
    }
  }

  public setUpgrades(carId: string, upgrades: VehicleUpgrades) {
    this.carUpgrades[carId] = upgrades;
    if (this.currentCarConfig.id === carId) {
      this.physics.setUpgrades(upgrades);
      this.scene.remove(this.car3D.rootGroup);
      this.car3D = createCar3D(this.currentCarConfig, this.currentCarColor, upgrades);
      this.scene.add(this.car3D.rootGroup);
      this.applyReflectionMapToCar();
    }
  }

  public setCarUpgrades(carId: string, upgrades: VehicleUpgrades) {
    this.setUpgrades(carId, upgrades);
  }

  public getUpgrades(carId: string): VehicleUpgrades {
    return this.carUpgrades[carId] || { ...DEFAULT_UPGRADES };
  }

  public setVisualTheme(theme: VisualTheme) {
    this.visualTheme = theme;
    this.world.setTheme(theme);
    this.environmentManager.setEnvironment(this.timeOfDay, theme);
    if (this.onThemeSwitched) {
      this.onThemeSwitched(theme);
    }
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    this.graphicsQuality = quality;
    this.particles.setQualityBudget(quality);

    // Safely dispose existing shadow render target to prevent WebGL dimension mismatch
    if (this.world.sunLight.shadow.map) {
      this.world.sunLight.shadow.map.dispose();
      this.world.sunLight.shadow.map = null as unknown as THREE.WebGLRenderTarget;
    }

    if (quality === 'performance') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      this.world.sunLight.castShadow = false;
      this.renderer.toneMappingExposure = 1.0;
    } else if (quality === 'balanced') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.world.sunLight.castShadow = true;
      this.world.sunLight.shadow.mapSize.set(2048, 2048);
      this.world.sunLight.shadow.radius = 2.0;
      this.renderer.toneMappingExposure = 1.10;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.world.sunLight.castShadow = true;
      this.world.sunLight.shadow.mapSize.set(2048, 2048);
      this.world.sunLight.shadow.radius = 2.8;
      this.world.sunLight.shadow.bias = -0.0002;
      this.renderer.toneMappingExposure = 1.16;
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  public cycleVisualTheme() {
    const themes: VisualTheme[] = ['photoreal', 'cyberpunk', 'tokyo_drift', 'desert_run', 'synthwave'];
    const nextIdx = (themes.indexOf(this.visualTheme) + 1) % themes.length;
    this.setVisualTheme(themes[nextIdx]);
  }

  public setCarColor(colorHex: string) {
    this.currentCarColor = colorHex;
    this.car3D.bodyMaterial.color.set(colorHex);
    this.car3D.underglowLight.color.set(colorHex);
    (this.car3D.underglowMesh.material as THREE.MeshBasicMaterial).color.set(colorHex);
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    this.world.setTimeOfDay(time);
    this.environmentManager.setEnvironment(time, this.visualTheme);
    if (time === 'night') {
      this.physics.headlightsOn = true;
    }
  }

  public cycleCamera() {
    const modes: CameraView[] = ['chase', 'firstPerson', 'hood', 'bumper', 'orbit360', 'topDown'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.setCameraMode(modes[nextIdx]);
  }

  public setCameraMode(mode: CameraView) {
    this.cameraMode = mode;
    if (mode === 'orbit360') {
      // Sync orbit azimuth behind car
      const carRotY = new THREE.Euler().setFromQuaternion(this.physics.quaternion, 'YXZ').y;
      this.orbitAzimuth = carRotY + Math.PI;
      this.orbitPolar = 0.35;
      this.orbitDistance = 6.2;
    }
  }

  public rotateCurrentCamera(deltaYaw: number, deltaPitch: number = 0) {
    switch (this.cameraMode) {
      case 'chase':
        this.chaseLookYaw += deltaYaw;
        this.chaseLookPitch = Math.max(-0.35, Math.min(0.65, this.chaseLookPitch + deltaPitch));
        break;
      case 'firstPerson':
        this.firstPersonLookYaw += deltaYaw;
        this.firstPersonLookPitch = Math.max(-0.6, Math.min(0.6, this.firstPersonLookPitch + deltaPitch));
        break;
      case 'hood':
        this.hoodLookYaw += deltaYaw;
        this.hoodLookPitch = Math.max(-0.45, Math.min(0.45, this.hoodLookPitch + deltaPitch));
        break;
      case 'bumper':
        this.bumperLookYaw += deltaYaw;
        this.bumperLookPitch = Math.max(-0.35, Math.min(0.35, this.bumperLookPitch + deltaPitch));
        break;
      case 'topDown':
        this.topDownLookYaw += deltaYaw;
        break;
      case 'orbit360':
        this.orbitAzimuth += deltaYaw;
        this.orbitPolar = Math.max(0.08, Math.min(1.48, this.orbitPolar + deltaPitch));
        break;
    }
  }

  public rotateOrbit(deltaAzimuth: number, deltaPolar: number = 0) {
    this.rotateCurrentCamera(deltaAzimuth, deltaPolar);
  }

  public recenterCurrentCamera() {
    this.chaseLookYaw = 0;
    this.chaseLookPitch = 0;
    this.firstPersonLookYaw = 0;
    this.firstPersonLookPitch = 0;
    this.hoodLookYaw = 0;
    this.hoodLookPitch = 0;
    this.bumperLookYaw = 0;
    this.bumperLookPitch = 0;
    this.topDownLookYaw = 0;
    if (this.cameraMode === 'orbit360') {
      const carRotY = new THREE.Euler().setFromQuaternion(this.physics.quaternion, 'YXZ').y;
      this.orbitAzimuth = carRotY + Math.PI;
      this.orbitPolar = 0.35;
      this.orbitDistance = 6.2;
    }
  }

  public lookBack() {
    switch (this.cameraMode) {
      case 'chase':
        this.chaseLookYaw = Math.PI;
        break;
      case 'firstPerson':
        this.firstPersonLookYaw = Math.PI;
        break;
      case 'hood':
        this.hoodLookYaw = Math.PI;
        break;
      case 'bumper':
        this.bumperLookYaw = Math.PI;
        break;
      case 'orbit360': {
        const carRotY = new THREE.Euler().setFromQuaternion(this.physics.quaternion, 'YXZ').y;
        this.orbitAzimuth = carRotY;
        break;
      }
    }
  }

  public setOrbitViewAngle(preset: 'front' | 'rear' | 'left' | 'right' | 'top') {
    const carRotY = new THREE.Euler().setFromQuaternion(this.physics.quaternion, 'YXZ').y;
    if (this.cameraMode !== 'orbit360') {
      switch (preset) {
        case 'rear':
          this.recenterCurrentCamera();
          break;
        case 'front':
          this.lookBack();
          break;
        case 'left':
          if (this.cameraMode === 'chase') this.chaseLookYaw = Math.PI * 0.5;
          else if (this.cameraMode === 'firstPerson') this.firstPersonLookYaw = -Math.PI * 0.5;
          else if (this.cameraMode === 'hood') this.hoodLookYaw = -Math.PI * 0.5;
          else if (this.cameraMode === 'bumper') this.bumperLookYaw = -Math.PI * 0.5;
          break;
        case 'right':
          if (this.cameraMode === 'chase') this.chaseLookYaw = -Math.PI * 0.5;
          else if (this.cameraMode === 'firstPerson') this.firstPersonLookYaw = Math.PI * 0.5;
          else if (this.cameraMode === 'hood') this.hoodLookYaw = Math.PI * 0.5;
          else if (this.cameraMode === 'bumper') this.bumperLookYaw = Math.PI * 0.5;
          break;
        case 'top':
          this.setCameraMode('topDown');
          break;
      }
      return;
    }

    switch (preset) {
      case 'rear':
        this.orbitAzimuth = carRotY + Math.PI;
        this.orbitPolar = 0.32;
        break;
      case 'front':
        this.orbitAzimuth = carRotY;
        this.orbitPolar = 0.28;
        break;
      case 'left':
        this.orbitAzimuth = carRotY + Math.PI * 0.5;
        this.orbitPolar = 0.32;
        break;
      case 'right':
        this.orbitAzimuth = carRotY - Math.PI * 0.5;
        this.orbitPolar = 0.32;
        break;
      case 'top':
        this.orbitAzimuth = carRotY + Math.PI;
        this.orbitPolar = 1.38;
        break;
    }
  }

  public toggleHeadlights() {
    this.physics.headlightsOn = !this.physics.headlightsOn;
  }

  public toggleTransmission() {
    this.physics.isAutomatic = !this.physics.isAutomatic;
  }

  public resetCar() {
    if (this.activeMission) {
      this.physics.reset(this.activeMission.startPosition, this.activeMission.startRotationY);
    } else {
      // Reset at current coordinate upright
      this.physics.reset([this.physics.position.x, 0.4, this.physics.position.z], 0);
    }
  }

  public teleportCar(x: number, z: number, rotationY: number = 0) {
    this.physics.reset([x, 0.45, z], rotationY);
  }

  public teleportToGarage() {
    // Teleport directly onto the central service bay lift inside the workshop, facing out toward the street
    this.physics.reset([45, 0.45, -42], Math.PI);
  }

  public startMission(missionId: string) {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission) return;

    this.activeMission = mission;
    this.missionProgress = {
      missionId: mission.id,
      status: 'active',
      currentCheckpoint: 0,
      timeElapsed: 0,
      score: 0,
      highestSpeed: 0,
      damageTaken: 0,
    };

    // Teleport car to start
    this.physics.reset(mission.startPosition, mission.startRotationY);
    this.physics.damage = 0;

    // Display checkpoints in world
    const points = mission.checkpoints.map(c => c.position);
    this.world.setCheckpoints(points, 0);

    // Automatically enable racing line for mission challenge
    this.racingLine.setEnabled(true);
  }

  public abandonMission() {
    this.activeMission = null;
    this.missionProgress = null;
    this.world.setCheckpoints([], 0);
    this.racingLine.clear();
  }

  public toggleRacingLine(): GuideMode {
    return this.racingLine.toggleMode();
  }

  public setRacingLineEnabled(enabled: boolean) {
    this.racingLine.setEnabled(enabled);
  }

  public isRacingLineEnabled(): boolean {
    return this.racingLine.enabled;
  }

  public getGuideMode(): GuideMode {
    return this.racingLine.mode;
  }

  public setGuideMode(mode: GuideMode) {
    this.racingLine.mode = mode;
    if (mode === 'off') {
      this.racingLine.clear();
    }
  }

  // Telemetry Recorder Accessors
  public getTelemetryData() {
    return this.telemetryRecorder.getPoints();
  }

  public getTelemetrySummary() {
    return this.telemetryRecorder.getSummary();
  }

  public setTelemetryPaused(paused: boolean) {
    this.telemetryRecorder.setPaused(paused);
  }

  public isTelemetryPaused(): boolean {
    return this.telemetryRecorder.isPaused;
  }

  public resetTelemetry() {
    this.telemetryRecorder.reset();
  }

  public exportTelemetryCsv(): string {
    return this.telemetryRecorder.exportCsv();
  }

  // External input feeding (from on-screen touch controls or gamepad)
  public setInput(input: Partial<InputState>) {
    Object.assign(this.inputState, input);
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('wheel', this.handleWheel, { passive: true });
    canvas.addEventListener('dblclick', this.handleDoubleClick);
  }

  private handlePointerDown = (e: PointerEvent) => {
    // Only capture left click (0) or right click (2) on game canvas
    if (e.button !== 0 && e.button !== 2) return;
    this.isOrbitDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.lastDragTime = performance.now();
    // NEVER automatically switch to orbit360 on click/drag!
    // The player's active camera stays selected, with its own 360 look-around!
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isOrbitDragging) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.lastDragTime = performance.now();

    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      switch (this.cameraMode) {
        case 'chase':
          // Smooth 360 orbit around car in chase view
          this.chaseLookYaw -= dx * 0.007;
          this.chaseLookPitch = Math.max(-0.35, Math.min(0.65, this.chaseLookPitch + dy * 0.005));
          break;
        case 'firstPerson':
          // Smooth 360 degree driver head look inside cockpit
          this.firstPersonLookYaw += dx * 0.007;
          this.firstPersonLookPitch = Math.max(-0.6, Math.min(0.6, this.firstPersonLookPitch - dy * 0.005));
          break;
        case 'hood':
          // 360 degree look from inside/above cockpit
          this.hoodLookYaw += dx * 0.007;
          this.hoodLookPitch = Math.max(-0.45, Math.min(0.45, this.hoodLookPitch - dy * 0.005));
          break;
        case 'bumper':
          // 360 look from front bumper
          this.bumperLookYaw += dx * 0.007;
          this.bumperLookPitch = Math.max(-0.35, Math.min(0.35, this.bumperLookPitch - dy * 0.005));
          break;
        case 'topDown':
          this.topDownLookYaw -= dx * 0.007;
          break;
        case 'orbit360':
          // Free orbital 360 inspector camera
          this.orbitAzimuth -= dx * 0.007;
          this.orbitPolar = Math.max(0.08, Math.min(1.48, this.orbitPolar + dy * 0.006));
          break;
      }
    }
  };

  private handlePointerUp = () => {
    this.isOrbitDragging = false;
  };

  private handleDoubleClick = () => {
    // Quick double click snaps camera look angle back to center
    this.recenterCurrentCamera();
  };

  private handleWheel = (e: WheelEvent) => {
    if (this.cameraMode === 'orbit360') {
      this.orbitDistance = Math.max(3.2, Math.min(16.0, this.orbitDistance + e.deltaY * 0.005));
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Don't intercept when user is typing in form inputs
    const targetTag = (e.target as HTMLElement)?.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

    // Resume Web Audio context on user key
    soundEngine.init();
    soundEngine.resume();

    switch (e.code) {
      case 'KeyW':
        this.inputState.forward = true;
        break;
      case 'ArrowUp':
        this.inputState.forward = true;
        e.preventDefault();
        break;
      case 'KeyS':
        this.inputState.backward = true;
        break;
      case 'ArrowDown':
        this.inputState.backward = true;
        e.preventDefault();
        break;
      case 'KeyA':
        this.inputState.left = true;
        break;
      case 'ArrowLeft':
        this.inputState.left = true;
        e.preventDefault();
        break;
      case 'KeyD':
        this.inputState.right = true;
        break;
      case 'ArrowRight':
        this.inputState.right = true;
        e.preventDefault();
        break;
      case 'Space':
        this.inputState.handbrake = true;
        e.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.boost = true;
        break;
      case 'KeyE':
        this.inputState.shiftUp = true;
        break;
      case 'KeyQ':
        this.inputState.shiftDown = true;
        break;
      case 'KeyC':
        this.cycleCamera();
        break;
      case 'KeyR':
        this.resetCar();
        break;
      case 'KeyL':
        this.toggleHeadlights();
        break;
      case 'KeyT':
        this.cycleTimeOfDay();
        break;
      case 'KeyV':
        // V key: Recenter camera view to forward center
        this.recenterCurrentCamera();
        break;
      case 'KeyB':
        // B key: Quick look back (rear-view mirror)
        this.lookBack();
        break;
      case 'KeyM':
        this.toggleTransmission();
        break;
      // Quick Vehicle Switchers: 1 to 9
      case 'Digit1':
        this.switchCar('apex_gt');
        break;
      case 'Digit2':
        this.switchCar('viper_drift');
        break;
      case 'Digit3':
        this.switchCar('rally_proto');
        break;
      case 'Digit4':
        this.switchCar('cyber_phantom');
        break;
      case 'Digit5':
        this.switchCar('muscle_horizon');
        break;
      case 'Digit6':
        this.switchCar('formula_apex');
        break;
      case 'Digit7':
        this.switchCar('venom_f5');
        break;
      case 'Digit8':
        this.switchCar('titan_trophy');
        break;
      case 'Digit9':
        this.switchCar('shinobi_r34');
        break;
      case 'Digit0':
        this.switchCar('hudson_hornet');
        break;
    }
  };

  private cycleTimeOfDay() {
    const times: TimeOfDay[] = ['day', 'sunset', 'night', 'dawn'];
    const nextIdx = (times.indexOf(this.timeOfDay) + 1) % times.length;
    this.setTimeOfDay(times[nextIdx]);
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
        this.inputState.forward = false;
        break;
      case 'ArrowUp':
        this.inputState.forward = false;
        e.preventDefault();
        break;
      case 'KeyS':
        this.inputState.backward = false;
        break;
      case 'ArrowDown':
        this.inputState.backward = false;
        e.preventDefault();
        break;
      case 'KeyA':
        this.inputState.left = false;
        break;
      case 'ArrowLeft':
        this.inputState.left = false;
        e.preventDefault();
        break;
      case 'KeyD':
        this.inputState.right = false;
        break;
      case 'ArrowRight':
        this.inputState.right = false;
        e.preventDefault();
        break;
      case 'Space':
        this.inputState.handbrake = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.boost = false;
        break;
      case 'KeyE':
        this.inputState.shiftUp = false;
        break;
      case 'KeyQ':
        this.inputState.shiftDown = false;
        break;
      case 'KeyB':
        // Release Look Back: recenter view
        this.recenterCurrentCamera();
        break;
    }
  };

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const h = this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720);
    if (h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
  };

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = 0;
    this.animId = requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;
    this.animId = requestAnimationFrame(this.loop);

    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return;
    }

    const elapsed = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const dt = Math.max(0.001, Math.min(elapsed, 0.05));

    try {
      // 1. Update Vehicle Physics
      this.physics.update(dt, this.inputState, this.world.colliders);

      // 1b. Update Rival Computer Car AI
      this.rivalManager.update(
        dt,
        this.physics.position,
        this.physics.speedKmh,
        this.physics.isDrifting,
        this.physics.driftScore
      );

      // 2. Sync 3D Car Model & Dynamic Lighting to Physics
      this.syncCarVisuals(dt);

      // 3. Update Camera Dynamics with G-Forces and high-speed shake
      this.updateCamera(dt);

      // 4. Update Skidmarks, Smoke, and Speed Lines
      this.updateEffects(dt);

      // 5. Update World animations (shimmering harbor water, checkpoint pulses, dynamic shadow tracking)
      this.world.update(currentTime / 1000, this.physics.position);

      // 6. Update Mission objectives
      this.updateMission(dt);

      // 6b. Dynamic Real-Time Environment Reflection Probe on Car Paint & Glass
      this.updateCarReflections();

      // 7. Render 3D Frame
      this.renderer.render(this.scene, this.camera);

      // 8. Sound engine update with correct parameter types
      soundEngine.update(
        this.physics.rpm,
        this.currentCarConfig.maxRpm,
        this.inputState.forward ? 1 : 0,
        this.physics.boost,
        Math.max(this.physics.wheelSlip[0], this.physics.isDrifting ? 0.8 : 0)
      );
    } catch (err) {
      console.error('Frame loop tick error caught:', err);
    }

    // FPS calculation
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.3) {
      this.currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // 60-Second Driving Performance Telemetry Logging
    const currentState = this.physics.getState();
    this.telemetryRecorder.update(dt, currentState);

    // State update to UI (Throttled to ~35Hz to eliminate React CPU thread congestion)
    this.uiUpdateTimer += dt;
    if (this.uiUpdateTimer >= 0.028) {
      this.uiUpdateTimer = 0;
      if (this.onStateUpdate) {
        currentState.rivalState = this.rivalManager.getRivalState();
        this.onStateUpdate(currentState, this.missionProgress, this.currentFps);
      }
    }
  };

  private syncCarVisuals(dt: number) {
    // Chassis translation & rotation
    this.car3D.rootGroup.position.copy(this.physics.position);
    this.car3D.rootGroup.quaternion.copy(this.physics.quaternion);

    // Pitch and roll dynamic body heave (weight transfer)
    const accel = this.physics.velocity.length();
    const isBraking = this.inputState.backward && accel > 2;
    const isThrottle = this.inputState.forward && accel > 0.5;

    let targetPitch = 0;
    if (isBraking) targetPitch = 0.045;
    else if (isThrottle) targetPitch = -0.035;

    // Roll on turn
    const targetRoll = -this.physics.steerAngle * (accel / 38) * 0.14;

    this.car3D.chassisGroup.rotation.x += (targetPitch - this.car3D.chassisGroup.rotation.x) * 9 * dt;
    this.car3D.chassisGroup.rotation.z += (targetRoll - this.car3D.chassisGroup.rotation.z) * 9 * dt;

    // Wheels: steering on front wheels, spinning on all wheels, suspension vertical translation
    for (let i = 0; i < 4; i++) {
      const wheel = this.car3D.wheelMeshes[i];
      const basePos = this.physics.wheelPositions[i];
      const suspY = basePos.y - (0.38 - this.physics.wheelSuspensionLengths[i]);

      wheel.position.set(basePos.x, suspY, basePos.z);

      // Steering & Camber on front wheels (Dynamic KPI, caster lean & negative camber)
      if (i < 2) {
        wheel.rotation.y = this.physics.steerAngle;
        const sign = i === 0 ? 1 : -1;
        const staticCamber = sign * -0.028; // -1.6 deg racing negative stance
        const dynamicCamber = -this.physics.steerAngle * 0.07;
        wheel.rotation.z = staticCamber + dynamicCamber;
      } else {
        const sign = i === 2 ? 1 : -1;
        wheel.rotation.z = sign * -0.018; // -1.0 deg rear axle camber
      }

      // Wheel spin
      const spinSubGroup = wheel.children[0];
      if (spinSubGroup) {
        spinSubGroup.rotation.x = this.physics.wheelRotations[i];
      }
    }

    // Brake lights & reverse lights
    const isBrakingOrReversing = this.inputState.backward || this.inputState.handbrake;
    const isReverse = this.physics.currentGear === -1;

    this.car3D.brakeLightMaterial.emissiveIntensity = isBrakingOrReversing ? 2.8 : 0.35;
    this.car3D.reverseLightMaterial.emissiveIntensity = isReverse ? 2.5 : 0.0;

    // Headlight spotlights
    const headlightsActive = this.physics.headlightsOn || this.timeOfDay === 'night';
    this.car3D.headlightMaterial.emissiveIntensity = headlightsActive ? 2.8 : 0.3;
    this.car3D.headlightBeams.forEach(b => {
      b.intensity = headlightsActive ? 4.5 : 0;
    });

    // Underglow dynamic glow
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'sunset';
    this.car3D.underglowLight.intensity = isNight ? (this.physics.isBoosting ? 3.5 : 2.0) : 0.6;
    (this.car3D.underglowMesh.material as THREE.MeshBasicMaterial).opacity = isNight ? 0.65 : 0.25;

    // Nitro Boost or Anti-Lag exhaust flame bursts & Dynamic combustion lighting
    const flameMat = this.car3D.exhaustFlameMesh.material as THREE.MeshBasicMaterial;
    if (this.physics.isBoosting || this.physics.isAntiLagPopping) {
      flameMat.opacity = this.physics.isBoosting ? 0.95 : 0.85;
      const flicker = 0.85 + Math.random() * 0.45;
      const lengthMult = this.physics.isBoosting ? 1.6 : 1.25;
      this.car3D.exhaustFlameMesh.scale.set(flicker, flicker, flicker * lengthMult);

      if (this.car3D.exhaustFlameLight) {
        this.car3D.exhaustFlameLight.intensity = (this.physics.isBoosting ? 7.0 : 4.5) * (0.8 + Math.random() * 0.4);
      }
    } else {
      flameMat.opacity = 0;
      if (this.car3D.exhaustFlameLight) {
        this.car3D.exhaustFlameLight.intensity = 0;
      }
    }

    // Active rear wing spoiler deployment on Apex GT
    if (this.car3D.activeSpoiler && this.currentCarConfig.id === 'apex_gt') {
      const speedKmh = this.physics.velocity.length() * 3.6;
      const targetSpoilerAngle = isBraking ? 0.48 : (speedKmh > 120 ? 0.24 : 0.05);
      this.car3D.activeSpoiler.rotation.x += (targetSpoilerAngle - this.car3D.activeSpoiler.rotation.x) * 10 * dt;
    }

    // Realistic Brake Rotor Thermodynamics & Thermal Color Glow
    const currentSpeed = this.physics.velocity.length();
    if (isBrakingOrReversing && currentSpeed > 3) {
      // Kinetic energy converted into disc friction heat
      const heatingRate = (currentSpeed / 22) * 220;
      this.brakeRotorTemp = Math.min(850, this.brakeRotorTemp + heatingRate * dt);
    }
    // Convective air cooling proportional to vehicle forward velocity
    const coolingRate = 22 + currentSpeed * 2.2;
    this.brakeRotorTemp = Math.max(40, this.brakeRotorTemp - coolingRate * dt);

    if (this.car3D.rotorMeshes && this.car3D.rotorMeshes.length > 0) {
      // Thermal radiation threshold: starts visible cherry red above 320°C, incandescent orange at 650°C+
      const tempFraction = Math.max(0, Math.min(1, (this.brakeRotorTemp - 320) / (750 - 320)));
      const emissiveIntensity = tempFraction * 2.8;
      const glowColor = tempFraction > 0.6 ? 0xf97316 : 0xdc2626;

      this.car3D.rotorMeshes.forEach(rotor => {
        const mat = rotor.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.emissive = mat.emissive || new THREE.Color(glowColor);
          mat.emissive.setHex(glowColor);
          mat.emissiveIntensity = emissiveIntensity;
        }
      });
    }

    // Real-Time Cockpit Steering Wheel Articulation
    if (this.car3D.steeringWheelGroup) {
      const targetWheelAngle = -this.physics.steerAngle * 2.4;
      this.car3D.steeringWheelGroup.rotation.z += (targetWheelAngle - this.car3D.steeringWheelGroup.rotation.z) * 14 * dt;
    }

    // Dynamic Articulated Windshield Wipers (operates in wet weather or at speed)
    if (this.car3D.wiperGroup) {
      this.wiperCycle += dt * 3.2;
      const wiperSweep = (Math.sin(this.wiperCycle) * 0.5 + 0.5) * 0.85;
      this.car3D.wiperGroup.children.forEach((child, i) => {
        if (i > 1) { // Skip fluid nozzles, animate arms
          child.rotation.z = -0.32 + wiperSweep;
        }
      });
    }

    // Suspension Coil Compression & Rebound on Weight Transfer
    if (this.car3D.suspensionCoils && this.car3D.suspensionCoils.length > 0) {
      // Longitudinal weight transfer (braking dives front, accel squats rear)
      const pitchSquat = accel * 0.008;
      this.car3D.suspensionCoils.forEach((coil, i) => {
        const isFront = i < this.car3D.suspensionCoils!.length / 2;
        const compression = isFront ? 1.0 - pitchSquat : 1.0 + pitchSquat;
        const clampedComp = Math.max(0.7, Math.min(1.3, compression));
        coil.scale.set(1.0, clampedComp, 1.0);
      });
    }

    // Realistic Contact Shadow grounding adjustment
    if (this.car3D.contactShadowMesh) {
      const heightAboveGround = Math.max(0, this.physics.position.y - 0.38);
      const shadowMat = this.car3D.contactShadowMesh.material as THREE.MeshBasicMaterial;
      if (shadowMat) {
        shadowMat.opacity = Math.max(0.0, 0.85 - heightAboveGround * 0.45);
        const expand = 1.0 + heightAboveGround * 0.18;
        this.car3D.contactShadowMesh.scale.set(expand, expand, expand);
      }
    }
  }

  private updateCamera(dt: number) {
    const carPos = this.physics.position;
    this._forward.set(0, 0, 1).applyQuaternion(this.physics.quaternion);
    const speed = this.physics.velocity.length();
    const speedKmh = speed * 3.6;

    // Dynamic camera shake at extreme speeds (> 180 km/h), nitro boost, or hard drift
    const isHighSpeed = speedKmh > 180;
    const isDriftShake = this.physics.isDrifting && speedKmh > 75;
    if (isHighSpeed || this.physics.isBoosting || isDriftShake) {
      const shakeAmt = (isHighSpeed ? ((speedKmh - 180) / 160) * 0.035 : 0) +
                       (this.physics.isBoosting ? 0.045 : 0) +
                       (isDriftShake ? 0.025 : 0);
      this.shakeOffset.set(
        (Math.random() - 0.5) * shakeAmt,
        (Math.random() - 0.5) * shakeAmt,
        (Math.random() - 0.5) * shakeAmt
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    switch (this.cameraMode) {
      case 'chase': {
        // Dynamic spring chase camera with G-force push/pull and 360 look-around
        const boostPull = this.physics.isBoosting ? 1.2 : 0;
        const followDist = 6.0 + (speedKmh / 280) * 2.6 + boostPull;
        const followHeight = 2.3 + (speedKmh / 280) * 0.7;

        // Auto-recenter gently when driving fast if player has not dragged recently
        if (!this.isOrbitDragging && speedKmh > 22 && performance.now() - this.lastDragTime > 2200) {
          this.chaseLookYaw *= Math.max(0, 1 - 2.5 * dt);
          this.chaseLookPitch *= Math.max(0, 1 - 3.0 * dt);
        }

        // Rotate camera direction by chaseLookYaw around car
        this._camDir.copy(this._forward).applyAxisAngle(this._upVec, this.chaseLookYaw);

        this._targetCamPos
          .copy(carPos)
          .addScaledVector(this._camDir, -followDist)
          .add(this.shakeOffset);
        this._targetCamPos.y += followHeight + this.chaseLookPitch * 3.5;

        // Dynamic lateral camera tilt during drifts
        if (this.physics.isDrifting) {
          const sideVector = this._tempWorldL.set(1, 0, 0).applyQuaternion(this.physics.quaternion);
          this._targetCamPos.addScaledVector(sideVector, -this.physics.driftAngle * 1.5);
        }

        // Position damping
        this.cameraPosition.lerp(this._targetCamPos, Math.min(1.0, 12 * dt));
        this.camera.position.copy(this.cameraPosition);

        // Look-ahead vector
        this._targetLook
          .copy(carPos)
          .addScaledVector(this._camDir, 4.5);
        this._targetLook.y += 0.8;

        this.cameraLookTarget.lerp(this._targetLook, Math.min(1.0, 16 * dt));
        this.camera.lookAt(this.cameraLookTarget);

        // Realistic G-Force banking camera roll during hard cornering & drifts
        const latG = -this.physics.steerAngle * Math.min(1.0, speedKmh / 140);
        const targetRoll = latG * 0.045;
        this.camera.rotation.z += (targetRoll - this.camera.rotation.z) * 8 * dt;

        // Dynamic speed FOV
        const boostFov = this.physics.isBoosting ? 8 : 0;
        const targetFov = 64 + (speedKmh / 300) * 20 + boostFov;
        this.camera.fov += (targetFov - this.camera.fov) * 6 * dt;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'firstPerson': {
        // True First-Person Driver Cockpit View inside vehicle cabin
        const isFormula = this.currentCarConfig?.id === 'formula_apex';
        const carH = this.currentCarConfig?.dimensions?.height || 1.18;
        const carL = this.currentCarConfig?.dimensions?.length || 4.55;

        // Auto recenter head look if driving fast and player has not dragged recently
        if (!this.isOrbitDragging && speedKmh > 25 && performance.now() - this.lastDragTime > 2500) {
          this.firstPersonLookYaw *= Math.max(0, 1 - 2.5 * dt);
          this.firstPersonLookPitch *= Math.max(0, 1 - 3.0 * dt);
        }

        // Driver eye position in local car space:
        // x: -0.32 (left hand drive driver seat, 0 for formula single seater)
        // y: carH * 0.70 (driver eye level, looking above steering wheel & gauges)
        // z: -carL * 0.035 (driver seat position, slightly behind steering wheel at +0.02)
        const driverX = isFormula ? 0 : -0.32;
        const driverY = carH * 0.70;
        const driverZ = -carL * 0.035;

        // Dynamic G-Force head movement:
        // Braking: head leans slightly forward; Acceleration/boost: head pulls back
        const accelG = this.physics.isBoosting ? -0.04 : (this.inputState.forward ? -0.015 : 0);
        const brakeG = (this.inputState.backward || this.inputState.handbrake) ? 0.035 : 0;
        const dynamicZ = driverZ + accelG + brakeG;

        const localHead = this._tempWorldL.set(driverX, driverY, dynamicZ);
        localHead.applyQuaternion(this.physics.quaternion);

        this._targetCamPos.copy(carPos).add(localHead).add(this.shakeOffset);
        this.camera.position.copy(this._targetCamPos);

        // Cockpit head look direction (Yaw & Pitch)
        this._camDir.copy(this._forward).applyAxisAngle(this._upVec, this.firstPersonLookYaw);

        this._targetLook.copy(this._targetCamPos).addScaledVector(this._camDir, 25);
        this._targetLook.y += Math.sin(this.firstPersonLookPitch) * 12 - 0.15;

        this.camera.lookAt(this._targetLook);

        // Realistic subtle driver head roll when cornering & drifting
        const headRoll = -this.physics.steerAngle * Math.min(1.0, speedKmh / 140) * 0.045;
        this.camera.rotation.z += (headRoll - this.camera.rotation.z) * 10 * dt;

        // Dynamic immersive cockpit FOV (80° wide angle base, increasing with speed & boost)
        const boostFov = this.physics.isBoosting ? 8 : 0;
        const targetFov = 80 + (speedKmh / 320) * 14 + boostFov;
        this.camera.fov += (targetFov - this.camera.fov) * 7 * dt;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'hood': {
        this._targetCamPos
          .copy(carPos)
          .addScaledVector(this._forward, 0.4)
          .add(this.shakeOffset);
        this._targetCamPos.y += (this.currentCarConfig?.dimensions?.height || 1.18) * 0.72;

        this.camera.position.copy(this._targetCamPos);

        // Auto recenter cockpit look if driving fast
        if (!this.isOrbitDragging && speedKmh > 30 && performance.now() - this.lastDragTime > 2500) {
          this.hoodLookYaw *= Math.max(0, 1 - 2.5 * dt);
          this.hoodLookPitch *= Math.max(0, 1 - 3.0 * dt);
        }

        this._camDir.copy(this._forward).applyAxisAngle(this._upVec, this.hoodLookYaw);
        this._targetLook
          .copy(this._targetCamPos)
          .addScaledVector(this._camDir, 30);
        this._targetLook.y += Math.sin(this.hoodLookPitch) * 15 - 0.2;

        this.camera.lookAt(this._targetLook);

        const targetFov = 75 + (speedKmh / 300) * 16;
        this.camera.fov += (targetFov - this.camera.fov) * 6 * dt;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'bumper': {
        this._targetCamPos
          .copy(carPos)
          .addScaledVector(this._forward, (this.currentCarConfig?.dimensions?.length || 4.55) * 0.52)
          .add(this.shakeOffset);
        this._targetCamPos.y += 0.45;

        this.camera.position.copy(this._targetCamPos);

        if (!this.isOrbitDragging && speedKmh > 30 && performance.now() - this.lastDragTime > 2500) {
          this.bumperLookYaw *= Math.max(0, 1 - 2.5 * dt);
          this.bumperLookPitch *= Math.max(0, 1 - 3.0 * dt);
        }

        this._camDir.copy(this._forward).applyAxisAngle(this._upVec, this.bumperLookYaw);
        this._targetLook
          .copy(this._targetCamPos)
          .addScaledVector(this._camDir, 25);
        this._targetLook.y += Math.sin(this.bumperLookPitch) * 10;

        this.camera.lookAt(this._targetLook);
        this.camera.fov = 80;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'orbit360': {
        // Dedicated 360 Free Orbit Inspector Camera
        const horizontalDist = this.orbitDistance * Math.cos(this.orbitPolar);
        const camY = carPos.y + 0.7 + this.orbitDistance * Math.sin(this.orbitPolar);
        const camX = carPos.x + horizontalDist * Math.sin(this.orbitAzimuth);
        const camZ = carPos.z + horizontalDist * Math.cos(this.orbitAzimuth);

        this._targetCamPos.set(camX, camY, camZ).add(this.shakeOffset);
        this.cameraPosition.lerp(this._targetCamPos, Math.min(1.0, 16 * dt));
        this.camera.position.copy(this.cameraPosition);

        this._targetLook.copy(carPos);
        this._targetLook.y += 0.7;
        this.cameraLookTarget.lerp(this._targetLook, Math.min(1.0, 20 * dt));
        this.camera.lookAt(this.cameraLookTarget);

        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'topDown': {
        const topRadius = 15;
        const topX = carPos.x + Math.sin(this.topDownLookYaw) * topRadius;
        const topZ = carPos.z - Math.cos(this.topDownLookYaw) * topRadius;
        this.camera.position.set(topX, carPos.y + 45, topZ);
        this.camera.lookAt(carPos);
        this.camera.fov = 50;
        this.camera.updateProjectionMatrix();
        break;
      }
    }
  }

  private updateEffects(dt: number) {
    const rearLeftIdx = 2;
    const rearRightIdx = 3;

    // Tire slip for skids and smoke
    const rearSlip = (this.physics.wheelSlip[rearLeftIdx] + this.physics.wheelSlip[rearRightIdx]) / 2;
    const isSkidding = rearSlip > 0.32 || this.inputState.handbrake;

    if (isSkidding && this.physics.wheelGrounded[rearLeftIdx]) {
      const rlWorld = this._tempWorldL.copy(this.physics.wheelPositions[rearLeftIdx]).applyQuaternion(this.physics.quaternion).add(this.physics.position);
      const rrWorld = this._tempWorldR.copy(this.physics.wheelPositions[rearRightIdx]).applyQuaternion(this.physics.quaternion).add(this.physics.position);

      this.skidMarks.addMark(rlWorld, rrWorld, Math.min(0.95, rearSlip * 0.85));

      // Smoke particles throttled to prevent GPU/CPU particle flooding
      this.smokeTimer += dt;
      if (this.smokeTimer >= 0.035) {
        this.smokeTimer = 0;
        this.particles.emitSmoke(rlWorld, this.physics.velocity);
        this.particles.emitSmoke(rrWorld, this.physics.velocity);
      }
    }

    this.particles.update(dt);
    this.skidMarks.update();

    // Speed warp line streaks
    const speedKmh = this.physics.velocity.length() * 3.6;
    this._forward.set(0, 0, 1).applyQuaternion(this.physics.quaternion);
    this.speedLines.update(dt, speedKmh, this.physics.position, this._forward);

    // Dynamic 3D Racing / Waypoint Guide Line & Continuous Opponent Pursuit Line
    const activeCheckpoints = this.activeMission?.checkpoints.map(c => c.position) || null;
    const currentCpIdx = this.missionProgress?.currentCheckpoint || 0;
    // Always supply rival position and waypoints so chaser line tracks opponent all the time
    const rivalPos = this.rivalManager?.position || null;
    const rivalWaypoints = this.rivalManager?.getWaypoints();

    this.racingLine.update(
      dt,
      this.physics.position,
      this._forward,
      speedKmh,
      activeCheckpoints,
      currentCpIdx,
      rivalPos,
      rivalWaypoints
    );
  }

  private updateMission(dt: number) {
    if (!this.activeMission || !this.missionProgress || this.missionProgress.status !== 'active') return;

    this.missionProgress.timeElapsed += dt;
    this.missionProgress.score = this.physics.driftScore;

    const speedKmh = this.physics.velocity.length() * 3.6;
    if (speedKmh > this.missionProgress.highestSpeed) {
      this.missionProgress.highestSpeed = Math.round(speedKmh);
    }
    this.missionProgress.damageTaken = this.physics.damage;

    // Check cargo damage condition
    if (this.activeMission.type === 'delivery' && this.physics.damage > 25) {
      this.missionProgress.status = 'failed';
      this.world.setCheckpoints([], 0);
      this.racingLine.clear();
      if (this.onMissionFinished) {
        this.onMissionFinished(this.missionProgress, this.activeMission);
      }
      return;
    }

    // Check time limit
    if (this.missionProgress.timeElapsed > this.activeMission.timeLimitSec) {
      this.missionProgress.status = 'failed';
      this.world.setCheckpoints([], 0);
      this.racingLine.clear();
      if (this.onMissionFinished) {
        this.onMissionFinished(this.missionProgress, this.activeMission);
      }
      return;
    }

    // Checkpoint contact detection
    const checkpoints = this.activeMission.checkpoints;
    const currentIdx = this.missionProgress.currentCheckpoint;
    if (currentIdx < checkpoints.length) {
      const cp = checkpoints[currentIdx];
      const cpVec = new THREE.Vector3(cp.position[0], cp.position[1], cp.position[2]);
      const dist = this.physics.position.distanceTo(cpVec);

      if (dist < cp.radius) {
        soundEngine.playCheckpointSound();
        this.missionProgress.currentCheckpoint++;

        // Update checkpoint visuals
        const remaining = checkpoints.map(c => c.position);
        this.world.setCheckpoints(remaining, this.missionProgress.currentCheckpoint);

        if (this.missionProgress.currentCheckpoint >= checkpoints.length) {
          this.completeMission();
        }
      }
    }
  }

  private completeMission() {
    if (!this.activeMission || !this.missionProgress) return;

    this.missionProgress.status = 'completed';

    let medal: 'gold' | 'silver' | 'bronze' = 'bronze';
    if (this.activeMission.type === 'time_attack' || this.activeMission.type === 'delivery' || this.activeMission.type === 'stunt_jump') {
      const t = this.missionProgress.timeElapsed;
      if (t <= this.activeMission.goldThreshold) medal = 'gold';
      else if (t <= this.activeMission.silverThreshold) medal = 'silver';
    } else if (this.activeMission.type === 'drift_challenge') {
      const score = this.missionProgress.score;
      if (score >= this.activeMission.goldThreshold) medal = 'gold';
      else if (score >= this.activeMission.silverThreshold) medal = 'silver';
    } else if (this.activeMission.type === 'speed_trap') {
      const speed = this.missionProgress.highestSpeed;
      if (speed >= this.activeMission.goldThreshold) medal = 'gold';
      else if (speed >= this.activeMission.silverThreshold) medal = 'silver';
    }

    this.missionProgress.medal = medal;

    this.world.setCheckpoints([], 0);
    this.racingLine.clear();

    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
    });

    if (this.onMissionFinished) {
      this.onMissionFinished(this.missionProgress, this.activeMission);
    }
  }

  private applyReflectionMapToCar() {
    if (!this.carCubeRenderTarget) return;
    const tex = this.carCubeRenderTarget.texture;
    if (this.car3D.bodyMaterial) {
      this.car3D.bodyMaterial.envMap = tex;
      this.car3D.bodyMaterial.needsUpdate = true;
    }
    if (this.car3D.glassMaterial) {
      this.car3D.glassMaterial.envMap = tex;
      this.car3D.glassMaterial.needsUpdate = true;
    }
    if (this.car3D.carbonMaterial) {
      this.car3D.carbonMaterial.envMap = tex;
      this.car3D.carbonMaterial.needsUpdate = true;
    }
    if (this.car3D.chromeMaterial) {
      this.car3D.chromeMaterial.envMap = tex;
      this.car3D.chromeMaterial.needsUpdate = true;
    }
  }

  private updateCarReflections() {
    if (!this.carCubeCamera || !this.carCubeRenderTarget) return;
    if (this.graphicsQuality === 'performance') return;

    this.reflectionFrameCount++;
    const interval = this.graphicsQuality === 'ultra' ? 8 : 16;
    if (this.reflectionFrameCount % interval !== 0) return;

    // Only re-render cube if vehicle has moved noticeably (saves up to 80% redundant renders when stopped or cruising slowly)
    const distMovedSq = this.physics.position.distanceToSquared(this.lastReflectionPos);
    if (distMovedSq < 1.0 && this.reflectionFrameCount % (interval * 4) !== 0) return;
    this.lastReflectionPos.copy(this.physics.position);

    this.carCubeCamera.position.copy(this.physics.position);
    this.carCubeCamera.position.y += 0.8;

    // Temporarily hide player vehicle so it doesn't reflect itself inside-out
    this.car3D.rootGroup.visible = false;
    this.carCubeCamera.update(this.renderer, this.scene);
    this.car3D.rootGroup.visible = true;
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    const canvas = this.renderer.domElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.handlePointerDown);
      canvas.removeEventListener('wheel', this.handleWheel);
      canvas.removeEventListener('dblclick', this.handleDoubleClick);
    }
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);

    if (this.carCubeRenderTarget) {
      this.carCubeRenderTarget.dispose();
      this.carCubeRenderTarget = null;
    }

    this.speedLines.dispose();
    this.racingLine.dispose();
    this.environmentManager.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
