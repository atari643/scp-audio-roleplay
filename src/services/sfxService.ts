/**
 * Web Audio API synthesizer for SCP Foundation sound effects and atmospheric audio.
 * Zero external audio files required! 100% procedural synthesis.
 */
class SfxService {
  private audioCtx: AudioContext | null = null;
  public enabled: boolean = true;
  public ambienceEnabled: boolean = false;

  // Background containment drone nodes
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneNoise: AudioBufferSourceNode | null = null;

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Toggle atmospheric deep containment drone (Site-19 background hum)
  public toggleContainmentAmbience(enable?: boolean): boolean {
    const targetState = enable !== undefined ? enable : !this.ambienceEnabled;
    this.ambienceEnabled = targetState;

    if (!targetState) {
      this.stopContainmentAmbience();
      return false;
    }

    this.startContainmentAmbience();
    return true;
  }

  private startContainmentAmbience(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    this.stopContainmentAmbience();

    try {
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(SfxService.AMBIENCE_LEVEL, ctx.currentTime + 3); // subtle fade in

      // 1. Deep Sub-drone (48Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(48, ctx.currentTime);

      // 2. Harmonic Drone (96Hz) with slow detune beating
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(96.4, ctx.currentTime);

      // 3. Ventilation lowpass pink noise
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(140, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.03, ctx.currentTime);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      noiseSource.start();

      this.droneOsc1 = osc1;
      this.droneOsc2 = osc2;
      this.droneNoise = noiseSource;
      this.droneGain = masterGain;
    } catch (e) {
      console.warn('Could not start containment drone:', e);
    }
  }

  /**
   * Niveau de l'ambiance quand personne ne parle. Défini une fois pour que l'atténuation
   * sache à quoi revenir.
   */
  private static readonly AMBIENCE_LEVEL = 0.045;
  /** Ce qu'il reste de l'ambiance sous la voix : présente, mais qui ne dispute plus rien. */
  private static readonly AMBIENCE_DUCKED = 0.014;

  /**
   * Efface l'ambiance sous la voix, la relève dans les silences.
   *
   * Le drone jouait à niveau constant, y compris sous la narration : les deux se disputaient
   * le même registre grave et l'ambiance mangeait les consonnes. En la baissant pendant la
   * parole et en la relevant dans les pauses de transition — qui existent désormais — on
   * obtient le contraste d'une vraie production audio : l'ambiance se remarque justement
   * parce qu'elle revient quand la voix s'arrête.
   *
   * La rampe est plus lente à la remontée qu'à la descente : une atténuation doit être
   * immédiate pour ne pas masquer le premier mot, un retour doit être imperceptible.
   */
  public duckAmbience(ducked: boolean): void {
    if (!this.droneGain || !this.audioCtx) return;
    const cible = ducked ? SfxService.AMBIENCE_DUCKED : SfxService.AMBIENCE_LEVEL;
    const duree = ducked ? 0.18 : 0.6;
    try {
      const maintenant = this.audioCtx.currentTime;
      this.droneGain.gain.cancelScheduledValues(maintenant);
      this.droneGain.gain.setValueAtTime(Math.max(0.0001, this.droneGain.gain.value), maintenant);
      this.droneGain.gain.exponentialRampToValueAtTime(cible, maintenant + duree);
    } catch {
      /* un contexte audio fermé ne doit jamais interrompre la lecture */
    }
  }

  private stopContainmentAmbience(): void {
    if (this.droneGain && this.audioCtx) {
      try {
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.audioCtx.currentTime);
        this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1);
        setTimeout(() => {
          this.droneOsc1?.stop();
          this.droneOsc2?.stop();
          this.droneNoise?.stop();
          this.droneOsc1 = null;
          this.droneOsc2 = null;
          this.droneNoise = null;
          this.droneGain = null;
        }, 1100);
      } catch {
        this.droneGain = null;
      }
    }
  }

  // Classic Classified Censor Redaction Beep (1000Hz pure tone)
  playCensorBeep(duration: number = 0.12): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.setValueAtTime(0.04, now + duration - 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Two-tone intercom chime (plays on [BEGIN LOG] / [END LOG])
  playIntercom(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.setValueAtTime(880, now + 0.12); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25 * 1.5, now);
    osc2.frequency.setValueAtTime(880 * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // Radio walkie-talkie static burst (on speaker turn change)
  playRadioStatic(duration: number = 0.08): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter noise to sound like a low-pass radio
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  }

  // High-tech terminal beep
  playTerminalBeep(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Biometric scanner rising sweep (used for hold-scan progress)
  playBiometricScan(duration: number = 2.6): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1900, now + duration);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.setValueAtTime(0.02, now + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Retro mechanical terminal keystroke click
  playKeyClick(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.02);

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  // Synaptic pulse blip for memetic scan
  playSynapticPulse(freq: number = 440): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.06);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Access granted chime (clean ascending 3-note)
  playAccessGranted(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.06, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  }

  // Containment breach alarm siren (falling two-tone klaxon)
  playBreachAlarm(duration: number = 1.5): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Two alternating tones
    for (let i = 0; i < Math.floor(duration / 0.3); i++) {
      const t = now + i * 0.3;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    }
  }

  // Boot sequence: disk whir + beep combo
  playBootSound(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // White noise "disk" burst
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2200;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    // Clean beep after
    const now = ctx.currentTime + 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const sfx = new SfxService();
