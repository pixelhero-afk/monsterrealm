/**
 * Monster Realms - Web Audio Procedural Soundtrack Engine
 * 
 * Provides zero-dependency, high-fidelity procedural music inspired by Nobuo Uematsu's
 * legendary Final Fantasy soundtracks (FF IV, VI, VII, IX):
 * 
 * 1. Final Fantasy Crystal Prelude ("The Prelude / Sanctuary"):
 *    Timeless cascading 16th-note harp arpeggios across 2 octaves in Cmaj9 - Am9 - Fmaj7 - Gsus4,
 *    warm ethereal synth string pads, and a peaceful floating flute melody.
 * 
 * 2. Final Fantasy Battle Theme ("Decisive Clash"):
 *    Driving 138 BPM galloping 16th-note bassline in D minor (D2-D2-D2-D2 F2-D2-G2-D2...),
 *    punchy acoustic drums (kick/snare/hihat), syncopated brass stabs, and heroic dual-lead synth.
 * 
 * 3. Final Fantasy Boss Battle Theme ("Those Who Fight Further"):
 *    High-octane 150 BPM boss battle in E minor with chromatic bass drive, aggressive drums,
 *    diminished brass chord hits, and soaring melody.
 * 
 * 4. Final Fantasy Victory Fanfare ("Fanfare of Triumph"):
 *    The iconic opening brass fanfare (Da-da-da-DAAA! Ab -> Bb -> C), snare roll,
 *    and joyful walking victory march.
 */

export type MusicTrackId = 'MENU' | 'BATTLE' | 'BOSS' | 'VICTORY' | 'NONE';

export interface MusicEngineState {
  track: MusicTrackId;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
}

// Frequency helper: MIDI note number (60 = Middle C) to Frequency in Hz
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private currentTrack: MusicTrackId = 'NONE';
  private isMuted: boolean = false;
  private volume: number = 0.70;
  private isPlaying: boolean = false;

  private schedulerTimer: number | null = null;
  private nextNoteTime: number = 0;
  private tempo: number = 138; // BPM

  private listeners: Set<(state: MusicEngineState) => void> = new Set();
  private userInteractionBound: boolean = false;

  constructor() {
    // Load saved preferences from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('monster_realms_music_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
        const savedVol = localStorage.getItem('monster_realms_music_volume');
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed;
          }
        }
      } catch {
        // Ignore storage exceptions
      }

      // Proactively unlock AudioContext on user interaction anywhere on the window
      this.bindUserInteractionUnlock();
    }
  }

  private bindUserInteractionUnlock(): void {
    if (this.userInteractionBound || typeof window === 'undefined') return;
    this.userInteractionBound = true;

    const unlockHandler = () => {
      this.ensureContextResumed();
    };

    window.addEventListener('click', unlockHandler, { capture: true, passive: true });
    window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { capture: true, passive: true });
  }

  /**
   * Initializes or returns the active AudioContext, ensuring nodes and gain graphs exist.
   */
  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;

      this.ctx = new AudioCtxClass();

      // Master output node
      this.masterGain = this.ctx.createGain();
      const initialGain = (this.isMuted || !this.isPlaying) ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dedicated music channel node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(1, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Pre-compute 2 seconds of high-entropy white noise for instant drum synthesis
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      return this.ctx;
    } catch (err) {
      console.warn('[MusicEngine] Web Audio context initialization failed:', err);
      return null;
    }
  }

  /**
   * Resumes AudioContext safely within user gesture events.
   */
  public ensureContextResumed(): void {
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.notifyListeners();
      }).catch(() => {});
    }
  }

  public subscribe(cb: (state: MusicEngineState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(): void {
    const st = this.getState();
    this.listeners.forEach((cb) => cb(st));
  }

  public getState(): MusicEngineState {
    return {
      track: this.currentTrack,
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
    };
  }

  /**
   * Smoothly and reliably applies the calculated master gain.
   * Cancels all previous automation safely from 0 and sets target value without AudioParam collisions.
   */
  private applyGain(): void {
    if (!this.masterGain || !this.ctx) return;
    const target = (this.isMuted || !this.isPlaying) ? 0 : this.volume;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(0);
      this.masterGain.gain.setValueAtTime(target, now);
    } catch {
      try {
        this.masterGain.gain.cancelScheduledValues(0);
        this.masterGain.gain.value = target;
      } catch {}
    }
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    try {
      localStorage.setItem('monster_realms_music_volume', clamped.toString());
    } catch {}

    this.applyGain();
    this.notifyListeners();
  }

  /**
   * Primary Action: Toggles music ON / OFF directly.
   * - If music is currently ON and playing: turns music OFF (stops scheduler, sets gain to 0, updates UI).
   * - If music is currently OFF: turns music ON (starts active track, un-mutes, updates UI).
   * Guarantees 100% reliable state transitions on repeated clicks without ever getting stuck.
   */
  public toggleMusic(): boolean {
    this.ensureContextResumed();

    // Check if music is currently active and audible
    const isActive = this.isPlaying && !this.isMuted && this.volume > 0 && this.currentTrack !== 'NONE';

    if (isActive) {
      // Turn OFF
      this.stopPlayback();
      this.isMuted = true;
      try {
        localStorage.setItem('monster_realms_music_muted', 'true');
      } catch {}
      this.applyGain();
      this.notifyListeners();
      return false;
    } else {
      // Turn ON
      this.isMuted = false;
      if (this.volume <= 0.01) {
        this.volume = 0.7;
        try {
          localStorage.setItem('monster_realms_music_volume', '0.7');
        } catch {}
      }
      try {
        localStorage.setItem('monster_realms_music_muted', 'false');
      } catch {}
      const target: MusicTrackId = (this.currentTrack && this.currentTrack !== 'NONE') ? this.currentTrack : 'MENU';
      this.playTrack(target, true);
      return true;
    }
  }

  /**
   * Toggles mute on/off. If unmuting while stopped, automatically starts the track.
   */
  public toggleMute(): boolean {
    this.ensureContextResumed();
    this.isMuted = !this.isMuted;

    try {
      localStorage.setItem('monster_realms_music_muted', this.isMuted ? 'true' : 'false');
    } catch {}

    this.applyGain();

    // If user unmuted and nothing was playing, start Menu Prelude
    if (!this.isMuted && (!this.isPlaying || this.currentTrack === 'NONE')) {
      const target: MusicTrackId = (this.currentTrack && this.currentTrack !== 'NONE') ? this.currentTrack : 'MENU';
      this.playTrack(target, true);
    } else {
      this.notifyListeners();
    }

    return this.isMuted;
  }

  /**
   * Plays a specific Final Fantasy track. Automatically resumes audio context and un-mutes if desired.
   */
  public playTrack(trackId: MusicTrackId, forceUnmute: boolean = false): void {
    this.ensureContextResumed();

    if (forceUnmute && this.isMuted) {
      this.isMuted = false;
      try {
        localStorage.setItem('monster_realms_music_muted', 'false');
      } catch {}
    }

    if (trackId === 'NONE') {
      this.stopPlayback();
      this.currentTrack = 'NONE';
      this.applyGain();
      this.notifyListeners();
      return;
    }

    // If requested track is already actively playing and unmuted, do not restart loop
    if (this.currentTrack === trackId && this.isPlaying && !this.isMuted) {
      this.applyGain();
      this.notifyListeners();
      return;
    }

    // Stop previous scheduler before starting new one
    this.stopPlayback();
    this.currentTrack = trackId;
    this.isPlaying = true;
    this.applyGain();

    if (trackId === 'BATTLE') {
      this.tempo = 138; // FF Classic combat tempo
      this.startBattleTrack();
    } else if (trackId === 'BOSS') {
      this.tempo = 150; // Intense boss combat tempo
      this.startBossTrack();
    } else if (trackId === 'VICTORY') {
      this.tempo = 120; // Celebratory fanfare tempo
      this.startVictoryTrack();
    } else if (trackId === 'MENU') {
      this.tempo = 86; // Tranquil prelude tempo
      this.startMenuTrack();
    }

    this.notifyListeners();
  }

  /**
   * Pauses / stops playback cleanly.
   */
  public stopPlayback(): void {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.isPlaying = false;
    this.nextNoteTime = 0;
  }

  /**
   * Helper: Plays an instant 4-note Final Fantasy crystal chime test sound
   * to immediately confirm Web Audio is working on user's speakers.
   */
  public playTestChime(): void {
    this.ensureContextResumed();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chimeNotes = [72, 76, 79, 84]; // C5, E5, G5, C6 (Crystal arpeggio)
    chimeNotes.forEach((midi, idx) => {
      this.playHarpNote(midi, now + idx * 0.09, 0.8, 0.85);
    });
  }

  // =========================================================================
  // SYNTHESIS VOICES & INSTRUMENTS (Inspired by classic Super Famicom / PS1 chips)
  // =========================================================================

  /**
   * Heroic Lead Voice (Sawtooth + Detuned Square with Lowpass Filter Envelope & Subtle Vibrato)
   */
  private playLeadNote(midi: number, time: number, duration: number, velocity: number = 0.5): void {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const safeTime = Math.max(time, now);
      const freq = midiToFreq(midi);

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, safeTime);
      osc2.frequency.setValueAtTime(freq * 1.004, safeTime); // Rich chorused detune

      // Musical vibrato LFO
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, safeTime);
      lfoGain.gain.setValueAtTime(freq * 0.012, safeTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.2, safeTime);
      filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 5.5, 9500), safeTime + Math.min(0.04, duration * 0.3));
      filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 2.6, 7500), safeTime + duration);

      const env = this.ctx.createGain();
      const peak = 0.20 * velocity;
      const attackEnd = safeTime + Math.min(0.02, duration * 0.2);
      const decayEnd = safeTime + Math.min(0.08, duration * 0.6);
      env.gain.setValueAtTime(0.0001, safeTime);
      env.gain.linearRampToValueAtTime(peak, attackEnd);
      if (decayEnd > attackEnd) {
        env.gain.exponentialRampToValueAtTime(peak * 0.7, decayEnd);
      }
      env.gain.exponentialRampToValueAtTime(0.0001, safeTime + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(env);
      env.connect(this.musicGain);

      lfo.start(safeTime);
      osc1.start(safeTime);
      osc2.start(safeTime);
      lfo.stop(safeTime + duration + 0.05);
      osc1.stop(safeTime + duration + 0.05);
      osc2.stop(safeTime + duration + 0.05);
    } catch {}
  }

  /**
   * Final Fantasy Signature Galloping Bassline (Sawtooth + Sub-Octave Triangle)
   */
  private playBassNote(midi: number, time: number, duration: number, velocity: number = 0.6): void {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const safeTime = Math.max(time, now);
      const freq = midiToFreq(midi);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, safeTime);

      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(freq * 0.5, safeTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, safeTime);
      filter.frequency.exponentialRampToValueAtTime(320, safeTime + duration);

      const env = this.ctx.createGain();
      const peak = 0.25 * velocity;
      env.gain.setValueAtTime(0.0001, safeTime);
      env.gain.linearRampToValueAtTime(peak, safeTime + Math.min(0.01, duration * 0.1));
      env.gain.exponentialRampToValueAtTime(peak * 0.55, safeTime + duration * 0.6);
      env.gain.exponentialRampToValueAtTime(0.0001, safeTime + duration);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(env);
      env.connect(this.musicGain);

      osc.start(safeTime);
      subOsc.start(safeTime);
      osc.stop(safeTime + duration + 0.03);
      subOsc.stop(safeTime + duration + 0.03);
    } catch {}
  }

  /**
   * Warm String / Synth Pad Chord Tone
   */
  private playPadNote(midi: number, time: number, duration: number, velocity: number = 0.35): void {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const safeTime = Math.max(time, now);
      const freq = midiToFreq(midi);

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, safeTime);
      osc2.frequency.setValueAtTime(freq * 1.002, safeTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, safeTime);

      const env = this.ctx.createGain();
      const peak = 0.12 * velocity;
      const attackEnd = safeTime + Math.min(0.15, duration * 0.25);
      env.gain.setValueAtTime(0.0001, safeTime);
      env.gain.linearRampToValueAtTime(peak, attackEnd);
      env.gain.exponentialRampToValueAtTime(0.0001, safeTime + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(env);
      env.connect(this.musicGain);

      osc1.start(safeTime);
      osc2.start(safeTime);
      osc1.stop(safeTime + duration + 0.05);
      osc2.stop(safeTime + duration + 0.05);
    } catch {}
  }

  /**
   * Final Fantasy Crystal Harp / Bell Voice (for Prelude Arpeggios)
   */
  private playHarpNote(midi: number, time: number, duration: number, velocity: number = 0.5): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const safeTime = Math.max(time, now);
    const freq = midiToFreq(midi);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, safeTime);

    const shimmerOsc = this.ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(freq * 2.0, safeTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, safeTime);
    filter.frequency.exponentialRampToValueAtTime(500, safeTime + duration);

    const env = this.ctx.createGain();
    const peak = 0.18 * velocity;
    env.gain.setValueAtTime(0.0001, safeTime);
    env.gain.linearRampToValueAtTime(peak, safeTime + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, safeTime + duration);

    osc.connect(filter);
    shimmerOsc.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);

    osc.start(safeTime);
    shimmerOsc.start(safeTime);
    osc.stop(safeTime + duration + 0.05);
    shimmerOsc.stop(safeTime + duration + 0.05);
  }

  /**
   * Synthesized Drum: Kick
   */
  private playKick(time: number, velocity: number = 0.8): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const safeTime = Math.max(time, now);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, safeTime);
    osc.frequency.exponentialRampToValueAtTime(40, safeTime + 0.08);

    const env = this.ctx.createGain();
    const peak = 0.32 * velocity;
    env.gain.setValueAtTime(peak, safeTime);
    env.gain.exponentialRampToValueAtTime(0.001, safeTime + 0.16);

    osc.connect(env);
    env.connect(this.musicGain);

    osc.start(safeTime);
    osc.stop(safeTime + 0.18);
  }

  /**
   * Synthesized Drum: Snare
   */
  private playSnare(time: number, velocity: number = 0.7): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const safeTime = Math.max(time, now);

    // Noise crack
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, safeTime);

    const noiseEnv = this.ctx.createGain();
    noiseEnv.gain.setValueAtTime(0.20 * velocity, safeTime);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, safeTime + 0.14);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseEnv);
    noiseEnv.connect(this.musicGain);

    // Tonal snap
    const toneOsc = this.ctx.createOscillator();
    toneOsc.type = 'triangle';
    toneOsc.frequency.setValueAtTime(185, safeTime);
    toneOsc.frequency.exponentialRampToValueAtTime(75, safeTime + 0.08);

    const toneEnv = this.ctx.createGain();
    toneEnv.gain.setValueAtTime(0.18 * velocity, safeTime);
    toneEnv.gain.exponentialRampToValueAtTime(0.001, safeTime + 0.1);

    toneOsc.connect(toneEnv);
    toneEnv.connect(this.musicGain);

    whiteNoise.start(safeTime);
    toneOsc.start(safeTime);
    whiteNoise.stop(safeTime + 0.15);
    toneOsc.stop(safeTime + 0.15);
  }

  /**
   * Synthesized Drum: Hi-Hat
   */
  private playHiHat(time: number, open: boolean = false, velocity: number = 0.4): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const safeTime = Math.max(time, now);

    const dur = open ? 0.22 : 0.045;
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8200, safeTime);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.09 * velocity, safeTime);
    env.gain.exponentialRampToValueAtTime(0.001, safeTime + dur);

    whiteNoise.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);

    whiteNoise.start(safeTime);
    whiteNoise.stop(safeTime + dur + 0.01);
  }

  // =========================================================================
  // 1. FINAL FANTASY BATTLE THEME: "Decisive Clash" (FF IV / VI / VII style)
  // =========================================================================

  private startBattleTrack(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.nextNoteTime = now + 0.05;
    const secondsPerBeat = 60 / this.tempo;
    const secondsPer16th = secondsPerBeat / 4;

    const TOTAL_16TH_STEPS = 128;
    let currentStep = 0;

    // Classic FF Galloping Bassline in D Minor (38 = D2, 41 = F2, 43 = G2, 45 = A2)
    const bassPatterns: number[] = [
      // Bars 1-2 (Dm)
      38, 38, 38, 38, 41, 38, 43, 38, 38, 38, 38, 38, 45, 43, 41, 40,
      38, 38, 38, 38, 41, 38, 43, 38, 38, 38, 38, 38, 45, 43, 41, 40,
      // Bar 3 (Bb)
      34, 34, 34, 34, 38, 34, 41, 34, 34, 34, 34, 34, 41, 38, 36, 34,
      // Bar 4 (C)
      36, 36, 36, 36, 40, 36, 43, 36, 36, 36, 36, 36, 43, 40, 38, 36,
      // Bar 5 (Dm)
      38, 38, 38, 38, 41, 38, 43, 38, 38, 38, 38, 38, 45, 43, 41, 40,
      // Bar 6 (Dm -> F)
      38, 38, 38, 38, 41, 38, 43, 38, 41, 41, 41, 41, 45, 41, 48, 41,
      // Bar 7 (Gm)
      31, 31, 31, 31, 34, 31, 38, 31, 31, 31, 31, 31, 38, 34, 33, 31,
      // Bar 8 (A7 cadence)
      33, 33, 33, 33, 37, 33, 40, 33, 45, 45, 43, 41, 40, 41, 43, 45,
    ];

    // Brass & Pad chord stabs
    const chordStabs: Array<{ step: number; notes: number[]; duration: number; vel: number }> = [
      { step: 0, notes: [62, 65, 69], duration: 0.35, vel: 0.8 },
      { step: 6, notes: [62, 65, 69], duration: 0.25, vel: 0.7 },
      { step: 10, notes: [60, 65, 69], duration: 0.3, vel: 0.75 },
      { step: 16, notes: [62, 65, 69], duration: 0.35, vel: 0.8 },
      { step: 22, notes: [62, 65, 69], duration: 0.25, vel: 0.7 },
      { step: 28, notes: [64, 67, 71], duration: 0.3, vel: 0.75 },
      { step: 32, notes: [58, 62, 65], duration: 0.4, vel: 0.8 },
      { step: 38, notes: [58, 62, 65], duration: 0.25, vel: 0.7 },
      { step: 48, notes: [60, 64, 67], duration: 0.4, vel: 0.8 },
      { step: 54, notes: [60, 64, 67], duration: 0.25, vel: 0.7 },
      { step: 64, notes: [62, 65, 69], duration: 0.35, vel: 0.8 },
      { step: 70, notes: [62, 65, 69], duration: 0.25, vel: 0.7 },
      { step: 80, notes: [65, 69, 72], duration: 0.35, vel: 0.8 },
      { step: 86, notes: [65, 69, 72], duration: 0.25, vel: 0.7 },
      { step: 96, notes: [55, 62, 67], duration: 0.35, vel: 0.8 },
      { step: 102, notes: [55, 62, 67], duration: 0.25, vel: 0.7 },
      { step: 112, notes: [57, 64, 67, 69], duration: 0.4, vel: 0.85 },
      { step: 120, notes: [57, 64, 67, 69], duration: 0.4, vel: 0.85 },
    ];

    // Nobuo Uematsu heroic battle lead melody
    const battleMelody: Array<{ step: number; note: number; duration: number; vel: number }> = [
      { step: 0, note: 74, duration: 0.35, vel: 0.9 },
      { step: 3, note: 72, duration: 0.18, vel: 0.8 },
      { step: 4, note: 74, duration: 0.35, vel: 0.9 },
      { step: 8, note: 77, duration: 0.55, vel: 0.95 },
      { step: 12, note: 76, duration: 0.35, vel: 0.85 },
      { step: 16, note: 74, duration: 0.35, vel: 0.9 },
      { step: 20, note: 72, duration: 0.35, vel: 0.85 },
      { step: 24, note: 69, duration: 0.65, vel: 0.9 },
      // Phrase 2
      { step: 32, note: 70, duration: 0.35, vel: 0.9 },
      { step: 36, note: 72, duration: 0.35, vel: 0.85 },
      { step: 40, note: 74, duration: 0.4, vel: 0.9 },
      { step: 44, note: 76, duration: 0.35, vel: 0.85 },
      { step: 48, note: 77, duration: 0.5, vel: 0.95 },
      { step: 52, note: 79, duration: 0.35, vel: 0.9 },
      { step: 56, note: 81, duration: 0.85, vel: 1.0 },
      // Phrase 3
      { step: 64, note: 86, duration: 0.5, vel: 1.0 },
      { step: 68, note: 84, duration: 0.35, vel: 0.9 },
      { step: 72, note: 81, duration: 0.45, vel: 0.95 },
      { step: 76, note: 77, duration: 0.35, vel: 0.9 },
      { step: 80, note: 79, duration: 0.45, vel: 0.9 },
      { step: 84, note: 81, duration: 0.35, vel: 0.9 },
      { step: 88, note: 76, duration: 0.7, vel: 0.85 },
      // Phrase 4
      { step: 96, note: 74, duration: 0.35, vel: 0.85 },
      { step: 100, note: 72, duration: 0.35, vel: 0.85 },
      { step: 104, note: 70, duration: 0.4, vel: 0.9 },
      { step: 108, note: 69, duration: 0.35, vel: 0.85 },
      { step: 112, note: 73, duration: 0.7, vel: 0.95 },
      { step: 120, note: 74, duration: 0.7, vel: 1.0 },
    ];

    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.currentTrack !== 'BATTLE') return;

      const currentTime = this.ctx.currentTime;
      if (this.nextNoteTime < currentTime) {
        this.nextNoteTime = currentTime + 0.02;
      }

      const lookahead = 0.14;
      while (this.nextNoteTime < currentTime + lookahead) {
        const time = this.nextNoteTime;
        const step = currentStep % TOTAL_16TH_STEPS;

        // 1. Bassline (16th-note gallop)
        const bassMidi = bassPatterns[step] || 38;
        this.playBassNote(bassMidi, time, secondsPer16th * 0.92, 0.78);

        // 2. Drums
        if (step % 16 === 0 || step % 16 === 8 || step % 16 === 6 || step % 16 === 14) {
          this.playKick(time, step % 8 === 0 ? 0.95 : 0.65);
        }
        if (step % 16 === 4 || step % 16 === 12) {
          this.playSnare(time, 0.88);
        }
        const isOpenHat = step % 8 === 4;
        this.playHiHat(time, isOpenHat, step % 2 === 0 ? 0.45 : 0.25);

        // 3. Chord stabs
        const chord = chordStabs.find((c) => c.step === step);
        if (chord) {
          chord.notes.forEach((m) => {
            this.playPadNote(m, time, chord.duration, chord.vel * 0.85);
          });
        }

        // 4. Heroic Lead Melody
        const mel = battleMelody.find((m) => m.step === step);
        if (mel) {
          this.playLeadNote(mel.note, time, mel.duration, mel.vel);
          this.playLeadNote(mel.note - 12, time, mel.duration, mel.vel * 0.45); // Octave depth
        }

        this.nextNoteTime += secondsPer16th;
        currentStep++;
      }
    }, 25);
  }

  // =========================================================================
  // 2. FINAL FANTASY BOSS THEME: "Those Who Fight Further" (High-octane Boss Fight)
  // =========================================================================

  private startBossTrack(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.nextNoteTime = now + 0.05;
    const secondsPerBeat = 60 / this.tempo;
    const secondsPer16th = secondsPerBeat / 4;

    const TOTAL_16TH_STEPS = 64; // 4-bar intense boss loop in E Minor
    let currentStep = 0;

    // Driving aggressive bass riff in E Minor (40 = E2, 43 = G2, 45 = A2, 46 = Bb2)
    const bossBass = [
      40, 40, 52, 40, 43, 40, 45, 46, 45, 43, 40, 43, 40, 38, 40, 43,
      40, 40, 52, 40, 43, 40, 45, 46, 45, 43, 40, 43, 47, 46, 45, 43,
      36, 36, 48, 36, 40, 36, 43, 45, 38, 38, 50, 38, 42, 38, 45, 47,
      40, 40, 52, 40, 43, 40, 45, 47, 46, 45, 43, 40, 43, 45, 46, 47,
    ];

    // Dramatic brass hits
    const bossChords = [
      { step: 0, notes: [64, 67, 71], dur: 0.3 },
      { step: 6, notes: [64, 67, 70], dur: 0.25 }, // Edim tension
      { step: 16, notes: [64, 67, 71], dur: 0.3 },
      { step: 26, notes: [65, 69, 72], dur: 0.25 },
      { step: 32, notes: [60, 64, 67], dur: 0.35 },
      { step: 40, notes: [62, 66, 69], dur: 0.35 },
      { step: 48, notes: [64, 67, 71], dur: 0.4 },
      { step: 56, notes: [65, 69, 71, 74], dur: 0.4 },
    ];

    // Flying boss melody
    const bossMelody = [
      { step: 0, note: 76, dur: 0.35, vel: 1.0 },
      { step: 4, note: 79, dur: 0.35, vel: 0.95 },
      { step: 8, note: 83, dur: 0.6, vel: 1.0 },
      { step: 14, note: 82, dur: 0.35, vel: 0.9 },
      { step: 16, note: 83, dur: 0.5, vel: 1.0 },
      { step: 22, note: 79, dur: 0.35, vel: 0.9 },
      { step: 26, note: 76, dur: 0.7, vel: 0.95 },
      // Climbing chromatic phrase
      { step: 32, note: 72, dur: 0.3, vel: 0.95 },
      { step: 36, note: 74, dur: 0.3, vel: 0.95 },
      { step: 40, note: 76, dur: 0.35, vel: 1.0 },
      { step: 44, note: 78, dur: 0.35, vel: 1.0 },
      { step: 48, note: 79, dur: 0.4, vel: 1.0 },
      { step: 52, note: 81, dur: 0.4, vel: 1.0 },
      { step: 56, note: 83, dur: 0.8, vel: 1.0 },
    ];

    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.currentTrack !== 'BOSS') return;

      const currentTime = this.ctx.currentTime;
      if (this.nextNoteTime < currentTime) {
        this.nextNoteTime = currentTime + 0.02;
      }

      const lookahead = 0.14;
      while (this.nextNoteTime < currentTime + lookahead) {
        const time = this.nextNoteTime;
        const step = currentStep % TOTAL_16TH_STEPS;

        // 1. Bassline
        const bassMidi = bossBass[step] || 40;
        this.playBassNote(bassMidi, time, secondsPer16th * 0.9, 0.85);

        // 2. High-intensity drums
        if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
          this.playKick(time, 0.95);
        }
        if (step % 8 === 4) {
          this.playSnare(time, 0.92);
        }
        this.playHiHat(time, step % 4 === 2, 0.45);

        // 3. Chords
        const ch = bossChords.find((c) => c.step === step);
        if (ch) {
          ch.notes.forEach((m) => {
            this.playPadNote(m, time, ch.dur, 0.85);
          });
        }

        // 4. Melody
        const mel = bossMelody.find((m) => m.step === step);
        if (mel) {
          this.playLeadNote(mel.note, time, mel.dur, mel.vel);
          this.playLeadNote(mel.note - 5, time, mel.dur, mel.vel * 0.5); // 4th/5th harmony
        }

        this.nextNoteTime += secondsPer16th;
        currentStep++;
      }
    }, 25);
  }

  // =========================================================================
  // 3. FINAL FANTASY VICTORY FANFARE: "Fanfare of Triumph"
  // =========================================================================

  private startVictoryTrack(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.nextNoteTime = now + 0.05;
    const secondsPerBeat = 60 / this.tempo;
    const secondsPer16th = secondsPerBeat / 4;

    interface FanfareNote {
      step: number;
      midi: number;
      duration: number;
      vel: number;
      isSnare?: boolean;
    }

    const fanfareSequence: FanfareNote[] = [
      // Opening triplet rhythm: da-da-da-DAAA!
      { step: 0, midi: 72, duration: 0.16, vel: 0.98 },  // C5
      { step: 2, midi: 72, duration: 0.16, vel: 0.98 },  // C5
      { step: 4, midi: 72, duration: 0.16, vel: 0.98 },  // C5
      { step: 6, midi: 72, duration: 0.65, vel: 1.0 },   // C5 (held)
      { step: 10, midi: 68, duration: 0.45, vel: 0.95 }, // Ab4
      { step: 13, midi: 70, duration: 0.45, vel: 0.95 }, // Bb4
      { step: 16, midi: 72, duration: 1.2, vel: 1.0 },   // C5!
      // Snare roll
      { step: 18, midi: 0, duration: 0.1, vel: 0.6, isSnare: true },
      { step: 20, midi: 0, duration: 0.1, vel: 0.7, isSnare: true },
      { step: 22, midi: 0, duration: 0.1, vel: 0.8, isSnare: true },
      // Second phrase
      { step: 24, midi: 70, duration: 0.28, vel: 0.9 },  // Bb4
      { step: 27, midi: 72, duration: 0.28, vel: 0.9 },  // C5
      { step: 30, midi: 70, duration: 0.45, vel: 0.9 },  // Bb4
      { step: 34, midi: 68, duration: 0.8, vel: 0.95 },  // Ab4
      // Triumphant Grand Cadence
      { step: 40, midi: 72, duration: 0.16, vel: 0.98 }, // C5
      { step: 42, midi: 72, duration: 0.16, vel: 0.98 }, // C5
      { step: 44, midi: 72, duration: 0.16, vel: 0.98 }, // C5
      { step: 46, midi: 72, duration: 0.65, vel: 1.0 },  // C5
      { step: 50, midi: 68, duration: 0.45, vel: 0.95 }, // Ab4
      { step: 53, midi: 70, duration: 0.45, vel: 0.95 }, // Bb4
      { step: 56, midi: 72, duration: 2.2, vel: 1.0 },   // C5
    ];

    const cadenceChords = [
      { step: 6, notes: [60, 64, 67] },
      { step: 10, notes: [56, 60, 63] },
      { step: 13, notes: [58, 62, 65] },
      { step: 16, notes: [60, 64, 67, 72] },
      { step: 50, notes: [56, 60, 63] },
      { step: 53, notes: [58, 62, 65] },
      { step: 56, notes: [60, 64, 67, 72, 76] },
    ];

    // Cheerful walking victory march bassline loop
    const victoryBass = [
      48, 52, 55, 57, 58, 57, 55, 52,
      48, 52, 55, 57, 58, 57, 55, 52,
      53, 57, 60, 62, 60, 57, 55, 53,
      48, 52, 55, 57, 58, 57, 55, 52,
    ];

    const loopMelody = [
      { beat: 0, note: 72, dur: 0.4 },
      { beat: 1, note: 76, dur: 0.4 },
      { beat: 2, note: 79, dur: 0.6 },
      { beat: 3.5, note: 84, dur: 0.8 },
      { beat: 5, note: 83, dur: 0.4 },
      { beat: 6, note: 79, dur: 0.4 },
      { beat: 7, note: 76, dur: 0.7 },
    ];

    let currentStep = 0;
    const LOOP_START_STEP = 68;
    const LOOP_LENGTH_STEPS = 64;

    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.currentTrack !== 'VICTORY') return;

      const currentTime = this.ctx.currentTime;
      if (this.nextNoteTime < currentTime) {
        this.nextNoteTime = currentTime + 0.02;
      }

      const lookahead = 0.14;
      while (this.nextNoteTime < currentTime + lookahead) {
        const time = this.nextNoteTime;

        if (currentStep < LOOP_START_STEP) {
          const fn = fanfareSequence.find((n) => n.step === currentStep);
          if (fn) {
            if (fn.isSnare) {
              this.playSnare(time, fn.vel);
            } else if (fn.midi > 0) {
              this.playLeadNote(fn.midi, time, fn.duration, fn.vel);
              this.playLeadNote(fn.midi - 12, time, fn.duration, fn.vel * 0.45);
            }
          }

          const chord = cadenceChords.find((c) => c.step === currentStep);
          if (chord) {
            chord.notes.forEach((m) => {
              this.playPadNote(m, time, 0.8, 0.75);
            });
            this.playKick(time, 0.9);
          }
        } else {
          // Walking victory march
          const loopStep = (currentStep - LOOP_START_STEP) % LOOP_LENGTH_STEPS;
          const beat = loopStep / 4;

          if (loopStep % 4 === 0) {
            const bassIdx = Math.floor(loopStep / 2) % victoryBass.length;
            this.playBassNote(victoryBass[bassIdx], time, secondsPerBeat * 0.8, 0.72);
            this.playKick(time, 0.75);
          }

          if (loopStep % 8 === 4) {
            this.playSnare(time, 0.72);
          }
          if (loopStep % 2 === 0) {
            this.playHiHat(time, false, 0.35);
          }

          const m = loopMelody.find((n) => Math.abs(n.beat - beat) < 0.05);
          if (m) {
            this.playHarpNote(m.note, time, m.dur, 0.75);
            this.playLeadNote(m.note, time, m.dur, 0.6);
          }
        }

        this.nextNoteTime += secondsPer16th;
        currentStep++;
      }
    }, 25);
  }

  // =========================================================================
  // 4. FINAL FANTASY PRELUDE: "Sanctuary / Crystal Theme" (Menu & Hub Theme)
  // =========================================================================

  private startMenuTrack(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.nextNoteTime = now + 0.05;
    const secondsPerBeat = 60 / this.tempo;
    const secondsPer16th = secondsPerBeat / 4;

    // Iconic 8-measure Final Fantasy Prelude harmonic progression:
    // Cmaj9 -> Am9 -> Fmaj7 -> Gsus4/G7 -> Em7 -> Am7 -> Dm9 -> G7sus4
    const chordsData = [
      {
        root: 36, // C2
        padNotes: [48, 55, 60, 64, 71], // C3, G3, C4, E4, B4
        arpeggioNotes: [48, 52, 55, 59, 60, 64, 67, 71, 72, 76, 79, 83, 79, 76, 72, 71],
      },
      {
        root: 33, // A1
        padNotes: [45, 52, 57, 60, 67], // A2, E3, A3, C4, G4
        arpeggioNotes: [45, 48, 52, 55, 57, 60, 64, 67, 69, 72, 76, 79, 76, 72, 69, 67],
      },
      {
        root: 29, // F1
        padNotes: [41, 48, 53, 57, 64], // F2, C3, F3, A3, E4
        arpeggioNotes: [41, 45, 48, 52, 53, 57, 60, 64, 65, 69, 72, 76, 72, 69, 65, 64],
      },
      {
        root: 31, // G1
        padNotes: [43, 50, 55, 60, 65], // G2, D3, G3, C4, F4
        arpeggioNotes: [43, 47, 50, 53, 55, 59, 62, 65, 67, 71, 74, 77, 74, 71, 67, 65],
      },
      {
        root: 28, // E1
        padNotes: [40, 47, 52, 55, 62], // E2, B2, E3, G3, D4
        arpeggioNotes: [40, 43, 47, 50, 52, 55, 59, 62, 64, 67, 71, 74, 71, 67, 64, 62],
      },
      {
        root: 33, // A1
        padNotes: [45, 52, 57, 60, 67],
        arpeggioNotes: [45, 48, 52, 55, 57, 60, 64, 67, 69, 72, 76, 79, 76, 72, 69, 67],
      },
      {
        root: 38, // D2
        padNotes: [41, 50, 57, 60, 64], // D3, A3, C4, E4
        arpeggioNotes: [38, 41, 45, 48, 50, 53, 57, 60, 62, 65, 69, 72, 69, 65, 62, 60],
      },
      {
        root: 31, // G1
        padNotes: [43, 50, 55, 62, 67],
        arpeggioNotes: [43, 47, 50, 55, 59, 62, 67, 71, 74, 79, 83, 86, 83, 79, 74, 71],
      },
    ];

    // Gentle ethereal flute motif
    const fluteMelody: Array<{ bar: number; beat: number; note: number; dur: number }> = [
      { bar: 0, beat: 1.5, note: 76, dur: 2.2 },
      { bar: 1, beat: 0.5, note: 79, dur: 2.0 },
      { bar: 1, beat: 2.5, note: 76, dur: 1.4 },
      { bar: 2, beat: 1.0, note: 72, dur: 2.5 },
      { bar: 3, beat: 0.5, note: 74, dur: 1.5 },
      { bar: 3, beat: 2.0, note: 71, dur: 2.0 },
      { bar: 4, beat: 1.0, note: 71, dur: 2.5 },
      { bar: 5, beat: 0.5, note: 72, dur: 1.5 },
      { bar: 5, beat: 2.0, note: 74, dur: 1.8 },
      { bar: 6, beat: 0.5, note: 76, dur: 2.5 },
      { bar: 7, beat: 0.0, note: 74, dur: 3.0 },
    ];

    let currentStep = 0;
    const STEPS_PER_MEASURE = 16;
    const TOTAL_MEASURES = chordsData.length;
    const TOTAL_STEPS = TOTAL_MEASURES * STEPS_PER_MEASURE;

    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || this.currentTrack !== 'MENU') return;

      const currentTime = this.ctx.currentTime;
      if (this.nextNoteTime < currentTime) {
        this.nextNoteTime = currentTime + 0.02;
      }

      const lookahead = 0.15;
      while (this.nextNoteTime < currentTime + lookahead) {
        const time = this.nextNoteTime;
        const step = currentStep % TOTAL_STEPS;
        const bar = Math.floor(step / STEPS_PER_MEASURE);
        const stepInBar = step % STEPS_PER_MEASURE;
        const currentChord = chordsData[bar];

        // 1. Sustained Pad Chords and Acoustic Bass on downbeat of measure
        if (stepInBar === 0) {
          const chordDuration = secondsPerBeat * 4;
          this.playBassNote(currentChord.root, time, chordDuration * 0.95, 0.42);
          currentChord.padNotes.forEach((midi) => {
            this.playPadNote(midi, time, chordDuration * 0.95, 0.28);
          });
        }

        // 2. Cascading Crystal Harp Arpeggio note on every 16th
        const harpNote = currentChord.arpeggioNotes[stepInBar];
        if (harpNote) {
          const wave = 0.45 + 0.25 * Math.sin((stepInBar / STEPS_PER_MEASURE) * Math.PI);
          this.playHarpNote(harpNote, time, secondsPer16th * 2.8, wave);
        }

        // 3. Floating peaceful flute note
        const beat = stepInBar / 4;
        const flute = fluteMelody.find((f) => f.bar === bar && Math.abs(f.beat - beat) < 0.1);
        if (flute) {
          this.playLeadNote(flute.note, time, flute.dur * secondsPerBeat, 0.35);
        }

        this.nextNoteTime += secondsPer16th;
        currentStep++;
      }
    }, 25);
  }
}

// Global Singleton Instance
export const musicEngine = new MusicEngine();
