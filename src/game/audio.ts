/**
 * Procedural Web Audio Engine for realistic car sound synthesis.
 * Generates engine harmonics, turbo spool, blow-off valve, tire skid screech,
 * gear shift impacts, and crash sounds with zero external audio assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Engine audio nodes
  private engineMasterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private distortionNode: WaveShaperNode | null = null;

  // Turbo audio nodes
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Tire screech nodes
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;

  // State tracking
  private prevThrottle: number = 0;
  private soundProfile: 'v10' | 'v8_muscle' | 'turbo_rally' | 'electric_hyper' | 'classic_v8' | 'formula_v10' | 'jdm_turbo' | 'hyper_v8' | 'v6_twin_turbo' | 'screaming_i4' | 'classic_v6_dino' = 'v10';

  constructor() {
    // Will initialize on first user interaction
  }

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupEngineNodes();
      this.setupTurboNodes();
      this.setupTireNodes();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundProfile(profile: 'v10' | 'v8_muscle' | 'turbo_rally' | 'electric_hyper' | 'classic_v8' | 'formula_v10' | 'jdm_turbo' | 'hyper_v8' | 'v6_twin_turbo' | 'screaming_i4' | 'classic_v6_dino') {
    this.soundProfile = profile;
  }

  private makeDistortionCurve(amount: number = 20) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupEngineNodes() {
    if (!this.ctx) return;

    this.engineMasterGain = this.ctx.createGain();
    this.engineMasterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(18);
    this.distortionNode.oversample = '2x';

    // Primary cylinders oscillator
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(65, this.ctx.currentTime);

    // Harmonic oscillator
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(130, this.ctx.currentTime);

    // Sub-bass thump
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(32, this.ctx.currentTime);

    // Routing
    this.osc1.connect(this.distortionNode);
    this.osc2.connect(this.distortionNode);
    this.subOsc.connect(this.engineFilter);

    this.distortionNode.connect(this.engineFilter);
    this.engineFilter.connect(this.engineMasterGain);
    this.engineMasterGain.connect(this.ctx.destination);

    this.osc1.start();
    this.osc2.start();
    this.subOsc.start();
  }

  private setupTurboNodes() {
    if (!this.ctx) return;

    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    const turboFilter = this.ctx.createBiquadFilter();
    turboFilter.type = 'bandpass';
    turboFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    turboFilter.Q.setValueAtTime(5.0, this.ctx.currentTime);

    this.turboOsc.connect(turboFilter);
    turboFilter.connect(this.turboGain);
    this.turboGain.connect(this.ctx.destination);

    this.turboOsc.start();
  }

  private setupTireNodes() {
    if (!this.ctx) return;

    // Generate 2 seconds of white/pink noise buffer for tires
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    noiseSource.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.ctx.destination);

    noiseSource.start();
    this.tireNoiseNode = noiseSource;
  }

  public update(rpm: number, maxRpm: number, throttle: number, boost: number, tireSlipAmount: number) {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;

    const t = this.ctx.currentTime;
    const rpmNorm = Math.min(Math.max((rpm - 800) / (maxRpm - 800), 0), 1);

    // Calculate base frequencies based on car sound profile
    let baseFreq = 40 + rpmNorm * 220;
    let harmonicMult = 2.0;

    if (this.soundProfile === 'v8_muscle') {
      baseFreq = 32 + rpmNorm * 180;
      harmonicMult = 1.8;
    } else if (this.soundProfile === 'turbo_rally') {
      baseFreq = 45 + rpmNorm * 260;
      harmonicMult = 2.2;
    } else if (this.soundProfile === 'classic_v8') {
      baseFreq = 26 + rpmNorm * 165;
      harmonicMult = 1.75;
    } else if (this.soundProfile === 'electric_hyper') {
      baseFreq = 80 + rpmNorm * 520;
      harmonicMult = 3.0;
    } else if (this.soundProfile === 'formula_v10') {
      baseFreq = 70 + rpmNorm * 480;
      harmonicMult = 3.5;
    } else if (this.soundProfile === 'jdm_turbo') {
      baseFreq = 42 + rpmNorm * 240;
      harmonicMult = 2.4;
    } else if (this.soundProfile === 'hyper_v8') {
      baseFreq = 36 + rpmNorm * 210;
      harmonicMult = 2.1;
    } else if (this.soundProfile === 'v6_twin_turbo') {
      baseFreq = 38 + rpmNorm * 230;
      harmonicMult = 2.35;
    } else if (this.soundProfile === 'screaming_i4') {
      baseFreq = 48 + rpmNorm * 280;
      harmonicMult = 2.5;
    } else if (this.soundProfile === 'classic_v6_dino') {
      baseFreq = 34 + rpmNorm * 250;
      harmonicMult = 2.25;
    }

    if (this.osc1 && this.osc2 && this.subOsc) {
      this.osc1.frequency.setTargetAtTime(baseFreq, t, 0.04);
      this.osc2.frequency.setTargetAtTime(baseFreq * harmonicMult, t, 0.04);
      this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.04);
    }

    // Engine filter opens up on throttle load and higher RPM
    if (this.engineFilter) {
      const targetCutoff = 350 + throttle * 1200 + rpmNorm * 2200;
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, t, 0.05);
    }

    // Engine volume
    if (this.engineMasterGain) {
      const targetVol = 0.12 + throttle * 0.18 + rpmNorm * 0.08;
      this.engineMasterGain.gain.setTargetAtTime(targetVol, t, 0.05);
    }

    // Turbo spool pitch & volume
    if (this.turboOsc && this.turboGain) {
      const turboPitch = 800 + boost * 3200 + rpmNorm * 800;
      this.turboOsc.frequency.setTargetAtTime(turboPitch, t, 0.08);
      const turboVol = Math.max(0, boost * 0.12 * (0.3 + throttle * 0.7));
      this.turboGain.gain.setTargetAtTime(turboVol, t, 0.08);
    }

    // Blow-off valve on throttle release
    if (this.prevThrottle > 0.6 && throttle < 0.2 && boost > 0.3) {
      this.triggerBlowOffValve();
    }
    this.prevThrottle = throttle;

    // Tire screeching
    if (this.tireGain && this.tireFilter) {
      // Slip threshold ~0.48 before tire starts screeching (only on intentional slides or hard handbrake)
      const slipFactor = Math.min(Math.max((tireSlipAmount - 0.48) / 0.65, 0), 1);
      const tireVol = slipFactor * 0.28;
      this.tireGain.gain.setTargetAtTime(tireVol, t, 0.04);

      // Pitch shifts slightly with slip severity
      const tireCenterFreq = 850 + slipFactor * 450;
      this.tireFilter.frequency.setTargetAtTime(tireCenterFreq, t, 0.04);
    }
  }

  public triggerBlowOffValve() {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(t);
    } catch {
      // safe fallback
    }
  }

  public playBackfire() {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const popCount = 1 + Math.floor(Math.random() * 3);
      for (let p = 0; p < popCount; p++) {
        const delay = p * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180 - Math.random() * 60, t + delay);
        osc.frequency.exponentialRampToValueAtTime(40, t + delay + 0.08);

        gain.gain.setValueAtTime(0.35, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.1);
      }
    } catch {
      // safe fallback
    }
  }

  public playCrash(intensity: number = 0.5) {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(Math.min(0.5, 0.2 + intensity * 0.3), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(t);
    } catch {
      // safe fallback
    }
  }

  public playCheckpointSound() {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880.0, t + 0.08); // A5

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    } catch {
      // safe fallback
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.engineMasterGain && this.ctx) {
      this.engineMasterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
