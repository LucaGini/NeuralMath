/**
 * Zero-dependency satisfying micro-sound effects programmatically synthesized
 * on the fly using the browser's native Web Audio API. 
 * Requires no static MP3/WAV assets and plays with zero network latency.
 */
class SoundEffectsService {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      // Initialize AudioContext (supports all major modern browsers)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    // Resume context if suspended (common browser policy behavior)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays a sweet, satisfying dual-tone chime for a correct answer.
   */
  public playCorrect() {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Chime Note 1: G5 (783.99 Hz)
    this.playTone(ctx, 783.99, "sine", now, 0.15, 0.1);

    // Chime Note 2: C6 (1046.50 Hz) slightly staggered
    this.playTone(ctx, 1046.50, "sine", now + 0.08, 0.25, 0.1);
  }

  /**
   * Plays a gentle low-pitched sliding buzz for an incorrect answer.
   */
  public playIncorrect() {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.3;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Warm triangle wave for organic feel
    osc.type = "triangle";
    
    // Slide pitch downward: 220Hz (A3) down to 110Hz (A2)
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + duration);

    // Smooth envelope decay
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Plays a triumphant, sweeping major chord arpeggio for session completion.
   */
  public playTriumph() {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sweeping C Major arpeggio progression:
    // C4 (261.63Hz) -> E4 (329.63Hz) -> G4 (392.00Hz) -> C5 (523.25Hz) -> E5 (659.25Hz)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    const stagger = 0.08;

    notes.forEach((freq, idx) => {
      // Warm sine tones for pure bell sound
      this.playTone(ctx, freq, "sine", now + idx * stagger, 0.4, 0.08);
      
      // Layer a subtle secondary triangle oscillator for rich harmonic texture
      this.playTone(ctx, freq * 1.005, "triangle", now + idx * stagger, 0.3, 0.02);
    });
  }

  /**
   * Core helper to play a single synthesized tone with exponential volume decay.
   */
  private playTone(
    ctx: AudioContext,
    freq: number,
    type: OscillatorType,
    startTime: number,
    duration: number,
    volume: number
  ) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth ADSR decay envelope
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const SoundEffects = new SoundEffectsService();
