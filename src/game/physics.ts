import * as THREE from 'three';
import { CarConfig, InputState, VehicleState, VehicleUpgrades, DEFAULT_UPGRADES } from './types';
import { CAR_PRESETS } from './cars';
import { soundEngine } from './audio';

export interface WorldCollider {
  type: 'box' | 'ramp';
  box?: THREE.Box3;
  mesh?: THREE.Object3D;
  rampPlane?: THREE.Plane;
  rampBounds?: { minX: number; maxX: number; minZ: number; maxZ: number; height: number };
}

export class VehiclePhysics {
  // Rigid body state
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.4, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public angularVelocity: THREE.Vector3 = new THREE.Vector3();
  public quaternion: THREE.Quaternion = new THREE.Quaternion();

  // Suspension & wheel mounts relative to chassis center
  // 0: FL, 1: FR, 2: RL, 3: RR
  public wheelPositions: THREE.Vector3[] = [];
  public wheelRotations: number[] = [0, 0, 0, 0]; // spin angle (radians)
  public steerAngle: number = 0;
  public wheelGrounded: boolean[] = [false, false, false, false];
  public wheelSuspensionLengths: number[] = [0.38, 0.38, 0.38, 0.38];
  public wheelSlip: [number, number, number, number] = [0, 0, 0, 0];

  // Engine & Transmission
  public currentGear: number = 1; // -1 = R, 0 = N, 1..6
  public rpm: number = 900;
  public boost: number = 0;
  public isAutomatic: boolean = true;
  private shiftTimer: number = 0;

  // Nitro Boost & Rev Limiter
  public nitro: number = 100;
  public isBoosting: boolean = false;
  public isAntiLagPopping: boolean = false;
  private revLimiterBounce: number = 0;

  // Drift and scoring state
  public driftAngle: number = 0;
  public isDrifting: boolean = false;
  public driftScore: number = 0;
  public driftMultiplier: number = 1;
  private driftChainTimer: number = 0;

  // Vehicle configuration & state
  public config: CarConfig;
  public upgrades: VehicleUpgrades = DEFAULT_UPGRADES;
  public damage: number = 0;
  public headlightsOn: boolean = false;

  public get speedKmh(): number {
    return Math.round(this.velocity.length() * 3.6);
  }

  // Temp math vectors
  private forwardVec = new THREE.Vector3();
  private rightVec = new THREE.Vector3();
  private upVec = new THREE.Vector3();
  private tempVec = new THREE.Vector3();
  private tempVec2 = new THREE.Vector3();

  constructor(config: CarConfig, upgrades: VehicleUpgrades = DEFAULT_UPGRADES) {
    this.config = (config && config.dimensions) ? config : CAR_PRESETS.apex_gt;
    this.upgrades = upgrades;
    this.initWheelOffsets();
  }

  public setConfig(config: CarConfig) {
    this.config = (config && config.dimensions) ? config : CAR_PRESETS.apex_gt;
    this.initWheelOffsets();
    this.rpm = this.config.idleRpm;
  }

  public setUpgrades(upgrades: VehicleUpgrades) {
    this.upgrades = upgrades;
    this.initWheelOffsets();
  }

  private initWheelOffsets() {
    const halfWidth = this.config.dimensions.width * 0.48;
    const halfLength = this.config.dimensions.wheelbase * 0.5;
    const restY = 0.05;

    this.wheelPositions = [
      new THREE.Vector3(halfWidth, restY, halfLength),   // FL
      new THREE.Vector3(-halfWidth, restY, halfLength),  // FR
      new THREE.Vector3(halfWidth, restY, -halfLength),  // RL
      new THREE.Vector3(-halfWidth, restY, -halfLength), // RR
    ];
  }

  public reset(position: [number, number, number] = [0, 0.4, 0], rotationY: number = 0) {
    this.position.set(position[0], position[1], position[2]);
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
    this.steerAngle = 0;
    this.currentGear = 1;
    this.rpm = this.config.idleRpm;
    this.boost = 0;
    const maxN = 100 * (1 + this.upgrades.nitroStage * 0.5);
    this.nitro = maxN;
    this.isBoosting = false;
    this.wheelRotations = [0, 0, 0, 0];
    this.driftScore = 0;
    this.driftMultiplier = 1;
    this.isDrifting = false;
    this.driftAngle = 0;
  }

  public update(dt: number, input: InputState, colliders: WorldCollider[] = []) {
    const subStepDt = Math.min(dt, 0.033);

    // Coordinate axes in world space
    this.forwardVec.set(0, 0, 1).applyQuaternion(this.quaternion).normalize();
    this.rightVec.set(1, 0, 0).applyQuaternion(this.quaternion).normalize();
    this.upVec.set(0, 1, 0).applyQuaternion(this.quaternion).normalize();

    const speed = this.velocity.length();
    const speedKmh = speed * 3.6;

    // Upgrades calculation multipliers
    const massReduction =
      (this.upgrades.weightReduction === 2 ? 260 : this.upgrades.weightReduction === 1 ? 120 : 0) +
      (this.upgrades.driveChassis === 2 ? 80 : 0) +
      (this.upgrades.exhaustStage === 2 ? 30 : this.upgrades.exhaustStage === 1 ? 15 : 0) +
      (this.upgrades.engineSwap === 1 ? 40 : 0);
    const effectiveMass = Math.max(650, this.config.mass - massReduction);

    const engineTorqueMult = 1.0 + (
      this.upgrades.engineStage === 3 ? 0.55 :
      this.upgrades.engineStage === 2 ? 0.32 :
      this.upgrades.engineStage === 1 ? 0.15 : 0
    );

    const effectiveMaxRpm = this.upgrades.engineSwap === 3 ? 11000 :
      this.upgrades.engineSwap === 2 ? 8800 :
      this.upgrades.engineSwap === 1 ? 8500 : this.config.maxRpm;

    const maxNitroCapacity = 100 * (1 + this.upgrades.nitroStage * 0.5);
    const boostTorqueMult = this.isBoosting ? (1.45 + this.upgrades.nitroStage * 0.25) : 1.0;
    const brakeForceMult = 1.0 + (this.upgrades.brakesStage === 2 ? 0.65 : this.upgrades.brakesStage === 1 ? 0.28 : 0);

    // 1. Steering with Steering Improvement (FREE UPGRADE) & Speed Sensitivity
    const steerBonus = this.upgrades.steeringImprovement === 2 ? 8 : this.upgrades.steeringImprovement === 1 ? 4 : 0;
    const maxSteerRad = ((38 + steerBonus) * Math.PI) / 180;
    const highSpeedSteerRad = ((20 + steerBonus * 0.5) * Math.PI) / 180;
    const speedFactor = Math.min(1.0, speedKmh / 180);
    const currentMaxSteer = THREE.MathUtils.lerp(maxSteerRad, highSpeedSteerRad, speedFactor);
    const steerSpeed = 15.0 + (this.upgrades.steeringImprovement === 2 ? 6.0 : this.upgrades.steeringImprovement === 1 ? 3.0 : 0);

    let targetSteer = 0;
    if (input.left) targetSteer += currentMaxSteer;
    if (input.right) targetSteer -= currentMaxSteer;

    // Natural steering self-centering & high-speed stability
    if (Math.abs(targetSteer) < 0.001) {
      // Rapid return-to-center when driver releases steering input
      this.steerAngle += (0 - this.steerAngle) * Math.min(1.0, 18.0 * subStepDt);
    } else {
      this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, steerSpeed * subStepDt);
    }

    // 2. Transmission & Throttle/Braking & Reverse Transition
    let throttle = 0;
    let brake = 0;

    // Nitro Boost
    if (input.boost && this.nitro > 2 && (input.forward || speedKmh > 10)) {
      this.isBoosting = true;
      const drainRate = 22 / (1 + this.upgrades.nitroStage * 0.3);
      this.nitro = Math.max(0, this.nitro - drainRate * subStepDt);
    } else {
      this.isBoosting = false;
      const regenRate = 6 * (1 + this.upgrades.nitroStage * 0.4);
      this.nitro = Math.min(maxNitroCapacity, this.nitro + regenRate * subStepDt);
    }

    if (input.forward) {
      if (this.currentGear === -1) {
        if (this.isAutomatic && speedKmh < 4) {
          this.currentGear = 1;
          throttle = 1.0;
        } else {
          brake = 1.0;
        }
      } else {
        throttle = 1.0;
      }
    }

    if (input.backward) {
      if (this.currentGear > 0) {
        if (speedKmh > 4) {
          brake = 1.0;
        } else if (this.isAutomatic) {
          this.currentGear = -1;
          throttle = 1.0;
        } else {
          brake = 1.0;
        }
      } else {
        throttle = 1.0;
      }
    }

    // Transmission shift timing (PAID UPGRADE: transmission)
    const baseShiftDuration =
      this.upgrades.transmission === 3 ? 0.02 :
      this.upgrades.transmission === 2 ? 0.05 :
      this.upgrades.transmission === 1 ? 0.12 : 0.22;

    // Manual shifting
    this.shiftTimer -= subStepDt;
    if (input.shiftUp && this.shiftTimer <= 0 && this.currentGear < this.config.gears.length) {
      if (this.currentGear === -1) this.currentGear = 1;
      else this.currentGear++;
      this.shiftTimer = baseShiftDuration;
      soundEngine.playBackfire();
    }
    if (input.shiftDown && this.shiftTimer <= 0 && this.currentGear > -1) {
      this.currentGear--;
      this.shiftTimer = baseShiftDuration;
      soundEngine.playBackfire();
    }

    // 3. Engine RPM, Rev Limiter Bounce, and Turbo
    const gearRatio = this.currentGear === -1 ? 3.4 : (this.config.gears[this.currentGear - 1] || 1.0);
    const finalRatio = this.config.finalDrive;
    const wheelRadius = this.config.dimensions.wheelRadius;

    const wheelRpm = (speed / (2 * Math.PI * wheelRadius)) * 60;
    const targetEngineRpm = Math.max(this.config.idleRpm, wheelRpm * gearRatio * finalRatio);

    if (throttle > 0) {
      this.rpm += (targetEngineRpm - this.rpm) * 12 * subStepDt;
      this.rpm = Math.min(effectiveMaxRpm, Math.max(this.config.idleRpm, this.rpm + throttle * 4800 * subStepDt));

      if (this.rpm >= effectiveMaxRpm * 0.98) {
        this.revLimiterBounce = (this.revLimiterBounce + subStepDt * 35) % (Math.PI * 2);
        this.rpm += Math.sin(this.revLimiterBounce) * 180;
        if (Math.random() > 0.75) soundEngine.playBackfire();
      }
    } else {
      this.rpm += (this.config.idleRpm - this.rpm) * 6 * subStepDt;
    }

    // Automatic transmission shift points
    if (this.isAutomatic && this.shiftTimer <= 0) {
      if (this.currentGear > 0 && this.rpm > effectiveMaxRpm * 0.9 && this.currentGear < this.config.gears.length) {
        this.currentGear++;
        this.rpm *= 0.72;
        this.shiftTimer = baseShiftDuration;
        soundEngine.playBackfire();
      } else if (this.currentGear > 1 && this.rpm < 2300 && speedKmh < 160) {
        this.currentGear--;
        this.rpm *= 1.25;
        this.shiftTimer = baseShiftDuration;
      }
    }

    // Turbo spooling & Anti-Lag System (ALS)
    const maxBoost =
      this.upgrades.turboStage === 3 ? 2.2 :
      this.upgrades.turboStage === 2 ? 1.5 :
      this.upgrades.turboStage === 1 ? 0.9 : 0.45;

    const spoolSpeed =
      this.upgrades.turboStage === 3 ? 5.2 :
      this.upgrades.turboStage === 2 ? 3.8 :
      this.upgrades.turboStage === 1 ? 2.6 : 1.8;

    const minAntiLagBoost = this.upgrades.turboStage === 3 ? 0.45 : 0; // Stage 3 ALS holds residual boost
    if (throttle > 0.3 && (this.rpm > 2400 || this.isBoosting)) {
      this.boost = Math.min(maxBoost, this.boost + (this.isBoosting ? spoolSpeed * 1.5 : spoolSpeed) * subStepDt);
      this.isAntiLagPopping = false;
    } else {
      this.boost = Math.max(minAntiLagBoost, this.boost - (this.upgrades.turboStage === 3 ? 1.8 : 3.8) * subStepDt);
      const hasAntiLagOrExhaust = this.upgrades.turboStage >= 2 || (this.upgrades.exhaustStage !== undefined && this.upgrades.exhaustStage >= 1);
      this.isAntiLagPopping = Boolean(hasAntiLagOrExhaust && this.rpm > 3400 && Math.random() < 0.38);
    }

    // 4. Raycast 4-Wheel Suspension with Dynamic Anti-Roll & Contact Physics
    let restSuspensionLen = 0.38;
    if (this.upgrades.suspensionStage === 1) restSuspensionLen = 0.34;
    else if (this.upgrades.suspensionStage === 2) restSuspensionLen = 0.30;
    else if (this.upgrades.suspensionStage === 3) restSuspensionLen = 0.27; // Slammed Stance

    const springK = 38000 * (1 + this.upgrades.suspensionStage * 0.15 + (this.upgrades.driveChassis ? 0.1 : 0));
    const damperC = 4800 * (1 + this.upgrades.suspensionStage * 0.15);
    const antiRollK = (7500 + (this.upgrades.driveChassis === 2 ? 3500 : this.upgrades.driveChassis === 1 ? 1800 : 0)) * (1 + this.upgrades.suspensionStage * 0.2);

    // Gravity: Firm, realistic downward pull with aerodynamic downforce to prevent floating
    const isAnyWheelGrounded = this.wheelGrounded.some(g => g);
    const gravityY = isAnyWheelGrounded ? -16.5 : -28.0;
    let totalForce = new THREE.Vector3(0, gravityY * effectiveMass, 0);
    let totalTorque = new THREE.Vector3(0, 0, 0);

    // Aerodynamic downforce proportional to speed squared
    const speedForward = Math.max(0, this.velocity.dot(this.forwardVec));
    const downforce = (speedForward * speedForward) * 0.85;
    totalForce.y -= downforce;

    // Drivetrain Swap & Differential Handling
    const effectiveDrivetrain = (this.upgrades.drivetrainType && this.upgrades.drivetrainType !== 'stock')
      ? this.upgrades.drivetrainType.toUpperCase()
      : this.config.driveType;

    const isRWD = effectiveDrivetrain === 'RWD';
    const isAWD = effectiveDrivetrain === 'AWD';
    const isFWD = effectiveDrivetrain === 'FWD';

    // Acceleration power factor with Engine Stage, Engine Swap, Turbo, Exhaust, Transmission and Nitro boost
    const transmissionTorqueBoost =
      this.upgrades.transmission === 3 ? 1.25 :
      this.upgrades.transmission === 2 ? 1.16 :
      this.upgrades.transmission === 1 ? 1.08 : 1.0;

    const engineSwapMult =
      this.upgrades.engineSwap === 3 ? 1.75 :
      this.upgrades.engineSwap === 2 ? 1.42 :
      this.upgrades.engineSwap === 1 ? 1.20 : 1.0;

    const turboPowerBoost = 1.0 + (this.upgrades.turboStage * 0.18);
    const exhaustPowerBoost = this.upgrades.exhaustStage === 2 ? 1.15 : this.upgrades.exhaustStage === 1 ? 1.07 : 1.0;

    const enginePowerFactor = (this.rpm / effectiveMaxRpm) * (1.0 + this.boost * 0.45) * engineTorqueMult * boostTorqueMult * transmissionTorqueBoost * engineSwapMult * turboPowerBoost * exhaustPowerBoost;
    const driveForcePerWheel = (effectiveMass * 9.5 * enginePowerFactor * throttle) / (isAWD ? 4 : 2);

    let groundedCount = 0;
    let maxSlip = 0;
    const compressions: number[] = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      const isFront = i < 2;
      const isDriven = isAWD || (isRWD ? !isFront : isFront);

      const mountWorld = this.wheelPositions[i].clone().applyQuaternion(this.quaternion).add(this.position);

      let contactY = 0;
      let contactNormal = new THREE.Vector3(0, 1, 0);

      // Check ramp & ground colliders
      for (const col of colliders) {
        if (col.type === 'ramp' && col.rampBounds) {
          const b = col.rampBounds;
          if (mountWorld.x >= b.minX && mountWorld.x <= b.maxX && mountWorld.z >= b.minZ && mountWorld.z <= b.maxZ) {
            let rampH = 0;
            if (col.rampPlane && Math.abs(col.rampPlane.normal.y) > 0.05) {
              // Exact plane height: n.x*x + n.y*y + n.z*z + constant = 0 => y = -(n.x*x + n.z*z + constant)/n.y
              const py = -(col.rampPlane.normal.x * mountWorld.x + col.rampPlane.normal.z * mountWorld.z + col.rampPlane.constant) / col.rampPlane.normal.y;
              rampH = Math.max(0, Math.min(b.height, py));
            } else {
              const progress = Math.max(0, Math.min(1.0, (mountWorld.z - b.minZ) / Math.max(0.1, b.maxZ - b.minZ)));
              rampH = progress * b.height;
            }
            if (rampH > contactY) {
              contactY = rampH;
              if (col.rampPlane) contactNormal.copy(col.rampPlane.normal);
            }
          }
        }
      }

      const distToGround = mountWorld.y - contactY;
      const isContact = distToGround <= restSuspensionLen + this.config.dimensions.wheelRadius;

      this.wheelGrounded[i] = isContact;

      if (isContact) {
        groundedCount++;
        const compression = Math.max(0, (restSuspensionLen + this.config.dimensions.wheelRadius) - distToGround);
        compressions[i] = compression;
        this.wheelSuspensionLengths[i] = restSuspensionLen - compression;

        const wheelVel = this.getVelocityAtPoint(mountWorld);
        const normalVel = wheelVel.dot(contactNormal);

        // Spring + Damper Normal Force
        const fSpring = compression * springK;
        const fDamper = -normalVel * damperC;

        // CRITICAL ANTI-FLYING FIX: Clamp normal force per wheel so suspension can NEVER catapult car upward!
        const maxNormalForcePerWheel = effectiveMass * 9.81 * 0.75;
        const normalForce = Math.min(Math.max(0, fSpring + fDamper), maxNormalForcePerWheel);

        const springForceVec = contactNormal.clone().multiplyScalar(normalForce);
        totalForce.add(springForceVec);

        const leverArm = mountWorld.clone().sub(this.position);
        // Realistic clamped suspension pitch & roll moments (prevents excessive wheelie/nose-dive flips)
        const pitchTorque = Math.max(-2500, Math.min(2500, leverArm.z * normalForce));
        const rollTorque = Math.max(-2500, Math.min(2500, -leverArm.x * normalForce));
        totalTorque.x += pitchTorque;
        totalTorque.z += rollTorque;

        // Wheel forward & lateral directions
        let wheelForward = this.forwardVec.clone();
        let wheelRight = this.rightVec.clone();

        if (isFront) {
          wheelForward.applyAxisAngle(this.upVec, this.steerAngle);
          wheelRight.applyAxisAngle(this.upVec, this.steerAngle);
        }

        const vLongitudinal = wheelVel.dot(wheelForward);
        const vLateral = wheelVel.dot(wheelRight);

    // Tire Friction & Compound
        let compoundMult = 1.0;
        if (this.upgrades.tireCompound === 'sport') compoundMult = 1.25;
        else if (this.upgrades.tireCompound === 'race_slicks') compoundMult = 1.55;
        else if (this.upgrades.tireCompound === 'drift_pro') compoundMult = 0.92;

        const chassisGripMult = this.upgrades.driveChassis === 2 ? 1.15 : this.upgrades.driveChassis === 1 ? 1.08 : 1.0;
        // Strong rear axle lateral stability prevents involuntary spin-outs
        const axleGripMult = isFront ? 1.45 : 2.10;
        let tireFrictionCoeff = axleGripMult * (this.config.handling / 7.5) * compoundMult * chassisGripMult;

        // Handbrake cuts rear traction for deliberate drift initiation
        if (input.handbrake && !isFront) {
          tireFrictionCoeff *= 0.32;
        }

        // Longitudinal Drive / Brake force
        let fLong = 0;
        if (isDriven && throttle > 0) {
          const dirSign = this.currentGear === -1 ? -1 : 1;
          fLong = driveForcePerWheel * dirSign;
        }
        if (brake > 0) {
          fLong -= Math.sign(vLongitudinal) * Math.min(Math.abs(vLongitudinal) * 1900 * brakeForceMult, normalForce * 0.98);
        }
        if (input.handbrake && !isFront) {
          fLong -= Math.sign(vLongitudinal) * normalForce * 0.85;
        }

        // Lateral Cornering Force with realistic cornering stiffness
        const lateralSlip = Math.atan2(vLateral, Math.max(0.5, Math.abs(vLongitudinal)));
        const maxLateralForce = normalForce * tireFrictionCoeff;
        const corneringStiffness = isFront ? 6.5 : 8.5;
        const fLat = -Math.sign(lateralSlip) * Math.min(Math.abs(lateralSlip) * normalForce * corneringStiffness, maxLateralForce);

        const slipMag = Math.sqrt(lateralSlip * lateralSlip) + (input.handbrake && !isFront ? 0.9 : 0);
        this.wheelSlip[i] = slipMag;
        if (slipMag > maxSlip) maxSlip = slipMag;

        // Drive & lateral force MUST be planar along the ground
        const driveForward = wheelForward.clone();
        driveForward.y = 0;
        if (driveForward.lengthSq() > 0.001) driveForward.normalize();

        const driveRight = wheelRight.clone();
        driveRight.y = 0;
        if (driveRight.lengthSq() > 0.001) driveRight.normalize();

        const fLatVec = driveRight.clone().multiplyScalar(fLat);
        // Scrub compensation: front steering does not harshly brake the car
        if (isFront) {
          const forwardComp = fLatVec.dot(this.forwardVec);
          if (forwardComp < 0) {
            fLatVec.addScaledVector(this.forwardVec, -forwardComp * 0.6);
          }
        }

        const tireForce = driveForward.clone().multiplyScalar(fLong).add(fLatVec);
        totalForce.add(tireForce);

        // Vector 3D torque about center of mass: tau = r x F
        const wheelTorque = leverArm.clone().cross(tireForce);
        totalTorque.y += wheelTorque.y;
        totalTorque.x += Math.max(-1000, Math.min(1000, wheelTorque.x * 0.35));
        totalTorque.z += Math.max(-1000, Math.min(1000, wheelTorque.z * 0.35));

        // Spin wheels based on wheel speed
        const spinDelta = (vLongitudinal / wheelRadius) * subStepDt;
        this.wheelRotations[i] = (this.wheelRotations[i] + spinDelta) % (Math.PI * 2);
      } else {
        this.wheelSuspensionLengths[i] = restSuspensionLen;
        this.wheelSlip[i] = 0;
      }
    }

    // 5. Anti-Roll Bar Coupling (Front & Rear) - ROLL MOMENT ONLY (DO NOT ADD LINEAR FORCE.Y!)
    const halfTrackWidth = this.config.dimensions.width * 0.45;
    if (this.wheelGrounded[0] && this.wheelGrounded[1]) {
      const antiRollDiffFront = compressions[0] - compressions[1];
      const antiRollTorqueFront = antiRollDiffFront * antiRollK * halfTrackWidth;
      totalTorque.z += Math.max(-2000, Math.min(2000, antiRollTorqueFront));
    }
    if (this.wheelGrounded[2] && this.wheelGrounded[3]) {
      const antiRollDiffRear = compressions[2] - compressions[3];
      const antiRollTorqueRear = antiRollDiffRear * antiRollK * halfTrackWidth;
      totalTorque.z += Math.max(-2000, Math.min(2000, antiRollTorqueRear));
    }

    // 6. Aerodynamic Downforce & Air Drag
    const dragCoeff = 0.38;
    const frontalArea = 2.1;
    const airDensity = 1.225;
    const dragForceMag = 0.5 * airDensity * dragCoeff * frontalArea * speed * speed;
    const dragForce = this.velocity.clone().normalize().multiplyScalar(-dragForceMag);
    totalForce.add(dragForce);

    // Downforce scales quadratically with speed - keeps car glued to road!
    const downforceCoeff = (1.5 + (this.upgrades.carbonParts ? 0.5 : 0)) * (this.config.handling / 8.0);
    const downforceMag = 0.5 * airDensity * downforceCoeff * frontalArea * speed * speed;
    totalForce.add(new THREE.Vector3(0, -downforceMag, 0));

    // CRITICAL ANTI-FLYING FIX: Extra airborne gravity stabilization
    if (groundedCount === 0) {
      totalForce.y -= 18.0 * effectiveMass; // Pull airborne vehicle firmly down
      if (this.position.y > 2.0) {
        this.velocity.y -= 25.0 * subStepDt;
      }
    }

    // CRITICAL CHASSIS LEVELING & ANTI-FLIP SYSTEM (ALWAYS ACTIVE)
    // Prevents car from pitching up 90 degrees or standing vertically on curbs/obstacles
    const curEuler = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');
    totalTorque.x -= curEuler.x * 32000;
    totalTorque.z -= curEuler.z * 32000;

    // 7. Numerical Integration (Semi-Implicit Euler)
    const acceleration = totalForce.clone().divideScalar(effectiveMass);
    this.velocity.add(acceleration.clone().multiplyScalar(subStepDt));

    // CRITICAL ANTI-FLYING FIX: Hard clamp upward vertical velocity so car never launches skyward
    if (this.velocity.y > 1.6) {
      this.velocity.y = 1.6;
    }
    // High altitude safety recovery: If car leaves the ground, actively pull down to earth
    if (this.position.y > 1.8) {
      this.velocity.y = Math.min(this.velocity.y, -4.5);
    }
    if (this.position.y > 3.0) {
      this.position.y = 3.0;
      this.velocity.y = -9.0;
    }

    // Ground friction when completely stopped
    if (throttle === 0 && brake === 0 && speed < 0.6 && groundedCount >= 3) {
      this.velocity.multiplyScalar(0.7);
    }

    this.position.add(this.velocity.clone().multiplyScalar(subStepDt));

    // Angular Acceleration
    const inertia = effectiveMass * 1.8;
    // Clamp yaw torque to prevent extreme rotational spikes
    totalTorque.y = Math.max(-18000, Math.min(18000, totalTorque.y));
    const angularAccel = totalTorque.clone().divideScalar(inertia);
    this.angularVelocity.add(angularAccel.clone().multiplyScalar(subStepDt));

    // Angular damping on pitch (X), roll (Z), and yaw (Y)
    this.angularVelocity.x *= 0.72;
    this.angularVelocity.z *= 0.72;
    this.angularVelocity.y *= 0.88;

    // Active yaw stabilization:
    // When the driver is not holding a steering input, cleanly align the car with travel direction
    if (!input.handbrake && speedKmh > 8 && groundedCount >= 2) {
      const velHeading = Math.atan2(this.velocity.x, this.velocity.z);
      const carEuler = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');
      let angleDiff = velHeading - carEuler.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // When steering is neutral/released, quickly damp residual yaw and align with travel heading
      if (!input.left && !input.right && Math.abs(this.steerAngle) < 0.06) {
        this.angularVelocity.y += angleDiff * 8.0 * subStepDt;
        this.angularVelocity.y *= 0.82;
      }
    }

    // Hard clamp angular velocity on pitch, roll, and yaw (prevents endless spinning)
    this.angularVelocity.x = Math.max(-1.5, Math.min(1.5, this.angularVelocity.x));
    this.angularVelocity.z = Math.max(-1.5, Math.min(1.5, this.angularVelocity.z));
    this.angularVelocity.y = Math.max(-2.6, Math.min(2.6, this.angularVelocity.y));

    // In-Air Stunt Jump Controls
    if (groundedCount === 0) {
      if (input.forward) this.angularVelocity.x -= 2.0 * subStepDt;
      if (input.backward) this.angularVelocity.x += 2.0 * subStepDt;
      if (input.left) this.angularVelocity.z -= 2.0 * subStepDt;
      if (input.right) this.angularVelocity.z += 2.0 * subStepDt;
    }

    const deltaRot = new THREE.Quaternion().setFromAxisAngle(
      this.angularVelocity.clone().normalize(),
      this.angularVelocity.length() * subStepDt
    );
    if (this.angularVelocity.length() > 0.0001) {
      this.quaternion.multiply(deltaRot).normalize();
    }

    // ABSOLUTE ANTI-FLIP SAFETY ENFORCEMENT:
    // Enforce maximum pitch (+/- 18 degrees = 0.31 rad) and roll (+/- 15 degrees = 0.26 rad)
    // This makes it 100% mathematically impossible for the car to flip on its nose/tail or stand vertically!
    const postEuler = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');
    const MAX_PITCH_RAD = 0.31;
    const MAX_ROLL_RAD = 0.26;
    if (Math.abs(postEuler.x) > MAX_PITCH_RAD || Math.abs(postEuler.z) > MAX_ROLL_RAD) {
      postEuler.x = Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, postEuler.x));
      postEuler.z = Math.max(-MAX_ROLL_RAD, Math.min(MAX_ROLL_RAD, postEuler.z));
      this.quaternion.setFromEuler(postEuler);
    }

    // 8. Ground & Obstacle Collisions
    this.resolveCollisions(colliders);

    // 9. Realistic Drift Angle & Drift Score Calculation (Only drifts when intentionally triggered)
    const localVel = this.velocity.clone().applyQuaternion(this.quaternion.clone().invert());
    if (speedKmh > 22) {
      this.driftAngle = Math.atan2(Math.abs(localVel.x), Math.max(1.0, Math.abs(localVel.z))) * (180 / Math.PI);
      const isDeliberateSlide = input.handbrake || (this.driftAngle > 14 && Math.abs(localVel.x) > 4.2 && maxSlip > 0.45);
      if (isDeliberateSlide) {
        this.isDrifting = true;
        this.driftChainTimer = 1.0;
        const driftCompoundMult = this.upgrades.tireCompound === 'drift_pro' ? 2.5 : 1.0;
        const earned = Math.round(this.driftAngle * (speedKmh / 20) * subStepDt * 30 * driftCompoundMult);
        this.driftScore += earned * this.driftMultiplier;
        this.driftMultiplier = Math.min(8.0, this.driftMultiplier + 0.01);
      } else {
        this.fadeDrift(subStepDt * 2.5);
      }
    } else {
      this.fadeDrift(subStepDt * 3.5);
      this.driftAngle = 0;
    }

    // 10. Update Audio
    soundEngine.update(this.rpm, this.config.maxRpm, throttle, this.boost, maxSlip);
  }

  private fadeDrift(dt: number) {
    this.driftChainTimer -= dt;
    if (this.driftChainTimer <= 0) {
      this.isDrifting = false;
      this.driftMultiplier = 1;
    }
  }

  private getVelocityAtPoint(worldPoint: THREE.Vector3): THREE.Vector3 {
    const r = worldPoint.clone().sub(this.position);
    const angularLinearVel = this.angularVelocity.clone().cross(r);
    return this.velocity.clone().add(angularLinearVel);
  }

  private resolveCollisions(colliders: WorldCollider[]) {
    // Floor clamp - zero out downward velocity without bouncy catapult
    if (this.position.y < 0.36) {
      this.position.y = 0.36;
      if (this.velocity.y < 0) this.velocity.y = 0;
    }

    // World bounding boundary (Expanded Mega-World)
    const boundary = 1450;
    if (Math.abs(this.position.x) > boundary) {
      this.position.x = Math.sign(this.position.x) * boundary;
      this.velocity.x = -this.velocity.x * 0.5;
    }
    if (Math.abs(this.position.z) > boundary) {
      this.position.z = Math.sign(this.position.z) * boundary;
      this.velocity.z = -this.velocity.z * 0.5;
    }

    // Box colliders (buildings, barriers, containers)
    const carRadius = this.config.dimensions.width * 0.55;
    const carLength = this.config.dimensions.length * 0.5;

    for (const col of colliders) {
      if (col.type === 'box' && col.box) {
        const b = col.box;
        const closestX = Math.max(b.min.x, Math.min(this.position.x, b.max.x));
        const closestZ = Math.max(b.min.z, Math.min(this.position.z, b.max.z));

        const diffX = this.position.x - closestX;
        const diffZ = this.position.z - closestZ;
        const distSq = diffX * diffX + diffZ * diffZ;

        if (distSq < carRadius * carRadius && this.position.y < b.max.y) {
          const impactSpeed = this.velocity.length();
          const overlapX = carRadius - Math.abs(diffX);
          const overlapZ = carLength - Math.abs(diffZ);

          const diff = this.position.clone().sub(b.getCenter(new THREE.Vector3()));
          if (overlapX < overlapZ) {
            const pushDir = diff.x > 0 ? 1 : -1;
            this.position.x += pushDir * (overlapX + 0.05);
            this.velocity.x = -this.velocity.x * 0.35;
          } else {
            const pushDir = diff.z > 0 ? 1 : -1;
            this.position.z += pushDir * (overlapZ + 0.05);
            this.velocity.z = -this.velocity.z * 0.35;
          }

          // Colliding with obstacles or barriers must never launch the car upward or flip it!
          this.velocity.y = Math.min(0, this.velocity.y);
          this.angularVelocity.x = 0;
          this.angularVelocity.z = 0;
          if (this.position.y > 0.45) {
            this.position.y = 0.42;
          }

          // Immediately level the chassis so car never wedges or stands upright against walls
          const collEuler = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');
          collEuler.x *= 0.2;
          collEuler.z *= 0.2;
          this.quaternion.setFromEuler(collEuler);

          if (impactSpeed > 4) {
            soundEngine.playCrash(Math.min(1.0, impactSpeed / 24));
            this.damage = Math.min(100, this.damage + Math.round(impactSpeed * 0.5));
          }
        }
      }
    }
  }

  public teleportTo(position: THREE.Vector3, rotY: number = 0): void {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    this.steerAngle = 0;
    this.currentGear = 1;
    this.rpm = this.config.idleRpm;
  }

  public getState(): VehicleState {
    const speed = this.velocity.length();
    const speedKmh = Math.round(speed * 3.6);
    const speedMph = Math.round(speedKmh * 0.621371);
    const maxN = Math.round(100 * (1 + this.upgrades.nitroStage * 0.5));

    // Garage Workshop is located at [45, -42] with forecourt and interior [25..65, -58..-28]
    const garagePos = new THREE.Vector3(45, 0, -42);
    const distToGarage = this.position.distanceTo(garagePos);
    const isInsideGarageZone =
      this.position.x >= 25 && this.position.x <= 65 &&
      this.position.z >= -58 && this.position.z <= -26;
    const isNearGarage = distToGarage < 20.0 || isInsideGarageZone;

    const euler = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');

    return {
      speedKmh,
      speedMph,
      rpm: Math.round(this.rpm),
      gear: this.currentGear,
      isNeutral: this.currentGear === 0,
      isReverse: this.currentGear === -1,
      throttle: this.rpm / this.config.maxRpm,
      brake: 0,
      handbrake: false,
      steerAngle: this.steerAngle,
      driftAngle: Math.round(this.driftAngle),
      isDrifting: this.isDrifting,
      driftScore: Math.round(this.driftScore),
      driftMultiplier: Math.round(this.driftMultiplier * 10) / 10,
      boostPressure: Math.round(this.boost * 10) / 10,
      nitro: Math.round(this.nitro),
      maxNitro: maxN,
      isBoosting: this.isBoosting,
      damage: Math.min(100, Math.round(this.damage)),
      wheelSlip: [...this.wheelSlip],
      suspensionCompression: this.wheelSuspensionLengths.map(l => Math.max(0, 0.38 - l)) as [number, number, number, number],
      headlightsOn: this.headlightsOn,
      isAirborne: !this.wheelGrounded.some(g => g),
      isNearGarage,
      carPosition: [this.position.x, this.position.y, this.position.z],
      carRotationY: euler.y,
    };
  }
}
