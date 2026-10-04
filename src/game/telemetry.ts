import { TelemetryPoint, VehicleState } from './types';

/**
 * 60-Second High-Precision Driving Telemetry Recorder
 * Samples vehicle metrics (Speed, Throttle, RPM, Gear, Brake, Boost)
 * maintaining a rolling 60-second time series window for performance analysis.
 */
export class TelemetryRecorder {
  private points: {
    time: number;
    speedKmh: number;
    throttle: number;
    rpm: number;
    gear: number;
    brake: number;
    boostBar: number;
  }[] = [];

  private readonly maxDuration: number = 60.0; // 60 seconds history
  private readonly sampleInterval: number = 0.1; // 100ms sample interval (10 Hz)
  private sampleTimer: number = 0;
  private totalTime: number = 0;
  public isPaused: boolean = false;

  constructor() {
    this.reset();
  }

  public reset() {
    this.points = [];
    this.sampleTimer = 0;
    this.totalTime = 0;
    this.isPaused = false;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public update(dt: number, state: VehicleState) {
    if (this.isPaused) return;

    this.sampleTimer += dt;
    this.totalTime += dt;

    if (this.sampleTimer >= this.sampleInterval) {
      this.sampleTimer %= this.sampleInterval;

      // Throttle and brake are 0..1 in physics state, convert to 0..100%
      const throttlePct = Math.min(100, Math.max(0, Math.round(state.throttle * 100)));
      const brakePct = Math.min(100, Math.max(0, Math.round(state.brake * 100)));
      const roundedSpeed = Math.round(state.speedKmh * 10) / 10;
      const roundedRpm = Math.round(state.rpm);

      this.points.push({
        time: this.totalTime,
        speedKmh: roundedSpeed,
        throttle: throttlePct,
        rpm: roundedRpm,
        gear: state.gear,
        brake: brakePct,
        boostBar: Math.round((state.boostPressure || 0) * 100) / 100,
      });

      // Evict points older than 60 seconds
      const cutoffTime = this.totalTime - this.maxDuration;
      while (this.points.length > 2 && this.points[0].time < cutoffTime) {
        this.points.shift();
      }
    }
  }

  /**
   * Returns telemetry points with relative time formatted from -60s to 0s (now).
   */
  public getPoints(): TelemetryPoint[] {
    const now = this.totalTime;
    return this.points.map((pt) => ({
      ...pt,
      relativeTime: Math.round((pt.time - now) * 10) / 10,
    }));
  }

  /**
   * Computes statistical driving performance metrics over the active 60s window.
   */
  public getSummary() {
    if (this.points.length === 0) {
      return {
        maxSpeed: 0,
        avgSpeed: 0,
        peakRpm: 0,
        avgThrottle: 0,
        fullThrottlePct: 0,
        hardBrakingPct: 0,
        recordedSeconds: 0,
        sampleCount: 0,
      };
    }

    let maxSpeed = 0;
    let sumSpeed = 0;
    let peakRpm = 0;
    let sumThrottle = 0;
    let fullThrottleCount = 0;
    let hardBrakeCount = 0;

    for (let i = 0; i < this.points.length; i++) {
      const pt = this.points[i];
      if (pt.speedKmh > maxSpeed) maxSpeed = pt.speedKmh;
      sumSpeed += pt.speedKmh;

      if (pt.rpm > peakRpm) peakRpm = pt.rpm;
      sumThrottle += pt.throttle;

      if (pt.throttle >= 90) fullThrottleCount++;
      if (pt.brake >= 60) hardBrakeCount++;
    }

    const n = this.points.length;
    const duration =
      n > 1
        ? Math.min(this.maxDuration, Math.round((this.points[n - 1].time - this.points[0].time) * 10) / 10)
        : 0;

    return {
      maxSpeed: Math.round(maxSpeed),
      avgSpeed: Math.round(sumSpeed / n),
      peakRpm: Math.round(peakRpm),
      avgThrottle: Math.round(sumThrottle / n),
      fullThrottlePct: Math.round((fullThrottleCount / n) * 100),
      hardBrakingPct: Math.round((hardBrakeCount / n) * 100),
      recordedSeconds: duration,
      sampleCount: n,
    };
  }

  /**
   * Export telemetry data as CSV string.
   */
  public exportCsv(): string {
    const pts = this.getPoints();
    const headers = 'TimeOffset_s,Speed_kmh,Throttle_pct,RPM,Gear,Brake_pct,Boost_bar\n';
    const rows = pts
      .map(
        (p) =>
          `${p.relativeTime},${p.speedKmh},${p.throttle},${p.rpm},${p.gear},${p.brake},${p.boostBar}`
      )
      .join('\n');
    return headers + rows;
  }
}
