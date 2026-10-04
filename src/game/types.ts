export type GraphicsQuality = 'performance' | 'balanced' | 'ultra';

export interface DriverProfile {
  id: string;
  callsign: string;
  email?: string;
  avatar: 'helmet' | 'hornet' | 'legend' | 'turbo' | 'viper' | 'rebel';
  level: number;
  xp: number;
  nextLevelXp: number;
  cash: number; // In-game currency for upgrades
  licenseClass: 'Class C (Rookie)' | 'Class B (Street)' | 'Class A (Pro)' | 'Class S (Apex Legend)';
  stats: {
    totalDistanceKm: number;
    topSpeedKmh: number;
    highestDriftScore: number;
    missionsCompleted: number;
    tasksCompleted?: number;
    goldMedals: number;
    favoriteCar: string;
  };
  isGuest: boolean;
  createdAt: string;
}

export type TimeOfDay = 'day' | 'sunset' | 'night' | 'dawn';

export type VisualTheme = 'photoreal' | 'cyberpunk' | 'tokyo_drift' | 'desert_run' | 'synthwave';

export type CameraView = 'chase' | 'firstPerson' | 'orbit360' | 'hood' | 'bumper' | 'topDown';

export type TransmissionMode = 'auto' | 'manual';

export type TireCompound = 'stock' | 'sport' | 'race_slicks' | 'drift_pro';

export type DrivetrainSwap = 'stock' | 'rwd' | 'awd' | 'fwd';

export interface VehicleUpgrades {
  // FREE COMPLIMENTARY WORKSHOP UPGRADES:
  steeringImprovement: 0 | 1 | 2; // 0: Stock, 1: Quick-Ratio Sport, 2: Pro Drift Angle (FREE)
  driveChassis: 0 | 1 | 2; // 0: Stock, 1: Strut Tower Bracing, 2: Lightweight Tubular Chassis (FREE)
  suspensionStage: 0 | 1 | 2 | 3; // 0: Stock, 1: Sport Coilovers, 2: Track Spec, 3: Slammed Stance (FREE)

  // PAID PERFORMANCE UPGRADES (Require In-Game Cash):
  transmission: 0 | 1 | 2 | 3; // 0: Stock H-Pattern, 1: Sport Close-Ratio ($3,800), 2: Race Sequential Dogbox ($8,500), 3: Dual-Clutch Race Paddle ($14,000)
  drivetrainType: DrivetrainSwap; // 'stock' | 'rwd' (Pro Drift RWD) | 'awd' (Race ATTESA AWD) | 'fwd' (Touge FWD)
  turboStage: 0 | 1 | 2 | 3; // 0: Stock NA, 1: Fast-Spool Single Turbo, 2: High-Boost Twin-Turbo, 3: Pro Anti-Lag ALS Big Turbo
  engineSwap: 0 | 1 | 2 | 3; // 0: Factory Engine, 1: 2.0L Turbo High-Cam, 2: 3.8L Twin-Turbo VR38, 3: 6.5L Quad-Cam V12 Crate
  exhaustStage: 0 | 1 | 2; // 0: Factory Exhaust, 1: Titanium Sport Cat-Back, 2: Straight-Pipe Anti-Lag Flame Spitters
  engineStage: 0 | 1 | 2 | 3; // 0: Stock ECU, 1: Street ECU (+15%), 2: Stage 2 Remap (+32%), 3: Race Spec Forged (+55%)
  tireCompound: TireCompound;
  nitroStage: 0 | 1 | 2; // 0: Stock (100%), 1: Dual Bottle (150%), 2: Pro Drag (200%)
  brakesStage: 0 | 1 | 2; // 0: Stock, 1: Slotted Steel (+25%), 2: Carbon Ceramic (+60%)
  weightReduction: 0 | 1 | 2; // 0: Stock, 1: Carbon Panels (-120kg), 2: Race Stripped (-260kg)
  neonColor: string; // Underglow custom hex
  neonUnderglow?: string; // Underglow alias
  carbonParts?: boolean;
  caliperColor?: string;
}

export const DEFAULT_UPGRADES: VehicleUpgrades = {
  steeringImprovement: 0,
  driveChassis: 0,
  suspensionStage: 0,
  transmission: 0,
  drivetrainType: 'stock',
  turboStage: 0,
  engineSwap: 0,
  exhaustStage: 0,
  engineStage: 0,
  tireCompound: 'stock',
  nitroStage: 0,
  brakesStage: 0,
  weightReduction: 0,
  neonColor: '#06b6d4',
  neonUnderglow: '#000000',
  carbonParts: false,
  caliperColor: '#dc2626',
};

export interface CarConfig {
  id: string;
  name: string;
  category: string;
  topSpeedKmh: number;
  acceleration: number; // 0-100 km/h in sec
  handling: number; // 1-10
  mass: number; // kg
  driveType: 'RWD' | 'AWD' | 'FWD';
  engineSoundType: 'v10' | 'v8_muscle' | 'turbo_rally' | 'electric_hyper' | 'classic_v8' | 'formula_v10' | 'jdm_turbo' | 'hyper_v8' | 'v6_twin_turbo' | 'screaming_i4' | 'classic_v6_dino';
  colors: string[];
  defaultColor: string;
  description: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    wheelRadius: number;
  };
  gears: number[];
  finalDrive: number;
  maxRpm: number;
  idleRpm: number;
}

export interface RivalState {
  id: string;
  name: string;
  carName: string;
  difficulty: 'Rookie' | 'Street' | 'Pro' | 'Legend';
  speedKmh: number;
  position: [number, number, number];
  distanceToPlayer: number;
  isPlayerAhead: boolean;
  battleProgress: number; // 0 to 100 (%)
  battleScore: number;
  targetScore: number;
  status: 'racing' | 'leading' | 'trailing' | 'overtaking' | 'defeated';
  tier: number;
  rewardCash: number;
  rewardXp: number;
  streak: number;
  lastEventText?: string;
}

export interface TelemetryPoint {
  time: number; // Elapsed recording time in seconds
  relativeTime: number; // Offset from current time in seconds (-60s to 0s)
  speedKmh: number;
  throttle: number; // 0 to 100%
  rpm: number;
  gear: number;
  brake: number; // 0 to 100%
  boostBar: number;
}

export interface VehicleState {
  speedKmh: number;
  speedMph: number;
  rpm: number;
  gear: number;
  isNeutral: boolean;
  isReverse: boolean;
  throttle: number;
  brake: number;
  handbrake: boolean;
  steerAngle: number;
  driftAngle: number;
  isDrifting: boolean;
  driftScore: number;
  driftMultiplier: number;
  boostPressure: number; // 0 to 1.8 bar
  nitro: number; // 0 to 100%
  maxNitro: number;
  isBoosting: boolean;
  damage: number; // 0 to 100%
  wheelSlip: [number, number, number, number]; // FL, FR, RL, RR
  suspensionCompression: [number, number, number, number];
  headlightsOn: boolean;
  isAirborne: boolean;
  isNearGarage: boolean;
  carPosition: [number, number, number];
  carRotationY: number;
  rivalState?: RivalState | null;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  shiftUp: boolean;
  shiftDown: boolean;
  boost: boolean;
}

export interface Checkpoint {
  id: number;
  position: [number, number, number];
  radius: number;
  direction?: [number, number, number];
}

export interface UpgradeRequirement {
  category: string;
  key: keyof VehicleUpgrades;
  minStage: number;
  label: string;
  isFree: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  rewardCash: number;
  rewardXp: number;
  completed: boolean;
  progress: number;
  target: number;
  unit: string;
  type: 'visit_garage' | 'free_upgrade' | 'paid_upgrade' | 'speed_run' | 'drift_combo' | 'stunt_jump';
}

export interface Mission {
  id: string;
  title: string;
  type: 'time_attack' | 'drift_challenge' | 'delivery' | 'speed_trap' | 'stunt_jump';
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  timeLimitSec: number;
  targetScore?: number;
  targetSpeedKmh?: number;
  checkpoints: Checkpoint[];
  startPosition: [number, number, number];
  startRotationY: number;
  requiredUpgrade?: UpgradeRequirement;
  cashReward: {
    gold: number;
    silver: number;
    bronze: number;
  };
  rewards: {
    gold: string;
    silver: string;
    bronze: string;
  };
  goldThreshold: number;
  silverThreshold: number;
  bronzeThreshold: number;
}

export interface MissionProgress {
  missionId: string;
  status: 'idle' | 'active' | 'completed' | 'failed';
  currentCheckpoint: number;
  timeElapsed: number;
  score: number;
  highestSpeed: number;
  damageTaken: number;
  medal?: 'gold' | 'silver' | 'bronze' | null;
}
