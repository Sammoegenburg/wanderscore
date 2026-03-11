/**
 * WanderScore Procedural Audio Engine
 *
 * Generates ambient, evolving music using Web Audio API.
 * Reacts to walking speed, location context, and time of day.
 */

// Musical constants (Hz)
const NOTE_FREQS: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
};

interface ChordProgression {
  name: string;
  chords: number[][];
  bassNotes: number[];
  arpNotes: number[][];
  mood: string;
}

const PROGRESSIONS: Record<string, ChordProgression> = {
  nature: {
    name: "Open Fields",
    mood: "peaceful",
    chords: [
      [NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.G4],
      [NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.C5],
      [NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.D5],
      [NOTE_FREQS.A4, NOTE_FREQS.C5, NOTE_FREQS.E5],
    ],
    bassNotes: [NOTE_FREQS.C3, NOTE_FREQS.F3, NOTE_FREQS.G3, NOTE_FREQS.A3],
    arpNotes: [
      [NOTE_FREQS.C5, NOTE_FREQS.E5, NOTE_FREQS.G5, NOTE_FREQS.E5],
      [NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.C5, NOTE_FREQS.A4],
      [NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.D5, NOTE_FREQS.B4],
      [NOTE_FREQS.A4, NOTE_FREQS.C5, NOTE_FREQS.E5, NOTE_FREQS.C5],
    ],
  },
  urban: {
    name: "City Pulse",
    mood: "energetic",
    chords: [
      [NOTE_FREQS.A4, NOTE_FREQS.C5, NOTE_FREQS.E5],
      [NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.C5],
      [NOTE_FREQS.D4, NOTE_FREQS.F4, NOTE_FREQS.A4],
      [NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.B4],
    ],
    bassNotes: [NOTE_FREQS.A3, NOTE_FREQS.F3, NOTE_FREQS.D3, NOTE_FREQS.E3],
    arpNotes: [
      [NOTE_FREQS.A4, NOTE_FREQS.C5, NOTE_FREQS.E5, NOTE_FREQS.A5],
      [NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.C5, NOTE_FREQS.F5],
      [NOTE_FREQS.D4, NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.D5],
      [NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.E5],
    ],
  },
  water: {
    name: "Flowing",
    mood: "dreamy",
    chords: [
      [NOTE_FREQS.C4, NOTE_FREQS.F4, NOTE_FREQS.G4],
      [NOTE_FREQS.D4, NOTE_FREQS.G4, NOTE_FREQS.A4],
      [NOTE_FREQS.E4, NOTE_FREQS.A4, NOTE_FREQS.B4],
      [NOTE_FREQS.F4, NOTE_FREQS.B4, NOTE_FREQS.C5],
    ],
    bassNotes: [NOTE_FREQS.C3, NOTE_FREQS.D3, NOTE_FREQS.E3, NOTE_FREQS.F3],
    arpNotes: [
      [NOTE_FREQS.G5, NOTE_FREQS.F5, NOTE_FREQS.C5, NOTE_FREQS.G4],
      [NOTE_FREQS.A5, NOTE_FREQS.G5, NOTE_FREQS.D5, NOTE_FREQS.A4],
      [NOTE_FREQS.B5, NOTE_FREQS.A5, NOTE_FREQS.E5, NOTE_FREQS.B4],
      [NOTE_FREQS.C5, NOTE_FREQS.B4, NOTE_FREQS.F4, NOTE_FREQS.C4],
    ],
  },
  night: {
    name: "Midnight",
    mood: "mysterious",
    chords: [
      [NOTE_FREQS.D4, NOTE_FREQS.F4, NOTE_FREQS.A4],
      [NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.G4],
      [NOTE_FREQS.B3, NOTE_FREQS.D4, NOTE_FREQS.F4],
      [NOTE_FREQS.A3, NOTE_FREQS.C4, NOTE_FREQS.E4],
    ],
    bassNotes: [NOTE_FREQS.D3, NOTE_FREQS.C3, NOTE_FREQS.B3 * 0.5, NOTE_FREQS.A3 * 0.5],
    arpNotes: [
      [NOTE_FREQS.D5, NOTE_FREQS.A4, NOTE_FREQS.F4, NOTE_FREQS.D4],
      [NOTE_FREQS.C5, NOTE_FREQS.G4, NOTE_FREQS.E4, NOTE_FREQS.C4],
      [NOTE_FREQS.D5, NOTE_FREQS.B4, NOTE_FREQS.F4, NOTE_FREQS.D4],
      [NOTE_FREQS.E5, NOTE_FREQS.C5, NOTE_FREQS.A4, NOTE_FREQS.E4],
    ],
  },
};

export type MoodType = "nature" | "urban" | "water" | "night";

export interface LocationData {
  speed: number; // m/s
  heading: number; // degrees
  lat: number;
  lng: number;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Pad layer
  private padOscs: OscillatorNode[] = [];
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;

  // Bass layer
  private bassOsc: OscillatorNode | null = null;
  private bassGain: GainNode | null = null;

  // Arpeggiator
  private arpOsc: OscillatorNode | null = null;
  private arpGain: GainNode | null = null;
  private arpIntervalId: ReturnType<typeof setInterval> | null = null;
  private arpIndex = 0;

  // Noise (wind)
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  // Reverb
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // Musical state
  private currentMood: MoodType = "nature";
  private chordIndex = 0;
  private bpm = 72;
  private chordChangeInterval: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;

  get playing() {
    return this.isPlaying;
  }

  get mood() {
    return this.currentMood;
  }

  get currentBPM() {
    return this.bpm;
  }

  get progressionName() {
    return PROGRESSIONS[this.currentMood].name;
  }

  async start() {
    if (this.isPlaying) return;

    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Fade in
    this.masterGain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 2);

    this.createReverb();
    this.createPad();
    this.createBass();
    this.createArp();
    this.createNoise();
    this.startChordProgression();

    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Fade out
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);

    setTimeout(() => {
      this.cleanup();
    }, 2000);

    this.isPlaying = false;
  }

  private cleanup() {
    if (this.chordChangeInterval) clearInterval(this.chordChangeInterval);
    if (this.arpIntervalId) clearInterval(this.arpIntervalId);

    this.padOscs.forEach((o) => { try { o.stop(); } catch {} });
    try { this.bassOsc?.stop(); } catch {}
    try { this.arpOsc?.stop(); } catch {}
    try { this.noiseSource?.stop(); } catch {}
    try { this.ctx?.close(); } catch {}

    this.padOscs = [];
    this.bassOsc = null;
    this.arpOsc = null;
    this.noiseSource = null;
    this.ctx = null;
  }

  setMood(mood: MoodType) {
    if (mood === this.currentMood) return;
    this.currentMood = mood;
    this.chordIndex = 0;
    this.transitionToChord(0);
  }

  updateFromLocation(data: LocationData) {
    // Speed → BPM mapping (walking ~1.4m/s → ~80bpm, running ~3m/s → ~140bpm)
    const speed = data.speed || 0;
    const newBPM = Math.max(60, Math.min(160, 60 + speed * 30));
    this.setBPM(newBPM);

    // Speed → filter (faster = brighter)
    if (this.padFilter && this.ctx) {
      const freq = 400 + speed * 600;
      this.padFilter.frequency.linearRampToValueAtTime(
        Math.min(freq, 4000),
        this.ctx.currentTime + 0.5
      );
    }

    // Speed → noise (faster = more wind)
    if (this.noiseGain && this.ctx) {
      const vol = Math.min(0.08, speed * 0.02);
      this.noiseGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.3);
    }

    // Time of day → mood (auto-select if not manually set)
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 5) {
      this.setMood("night");
    }
  }

  setBPM(newBPM: number) {
    this.bpm = Math.round(newBPM);
    // Restart arp with new timing
    if (this.arpIntervalId) {
      clearInterval(this.arpIntervalId);
      this.startArpSequencer();
    }
  }

  getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // ── Reverb ──
  private createReverb() {
    if (!this.ctx) return;
    this.convolver = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.3;

    // Generate simple impulse response
    const rate = this.ctx.sampleRate;
    const length = rate * 2.5;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channel = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    this.convolver.buffer = impulse;
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain!);
  }

  // ── Pad ──
  private createPad() {
    if (!this.ctx || !this.masterGain) return;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.value = 800;
    this.padFilter.Q.value = 1;

    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.15;

    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.masterGain);
    if (this.convolver) this.padGain.connect(this.convolver);

    const prog = PROGRESSIONS[this.currentMood];
    const chord = prog.chords[0];

    chord.forEach((freq, i) => {
      if (!this.ctx || !this.padFilter) return;
      // Three detuned oscillators per note for warmth
      for (let d = -1; d <= 1; d++) {
        const osc = this.ctx.createOscillator();
        osc.type = i === 0 ? "sawtooth" : "triangle";
        osc.frequency.value = freq + d * 1.5;
        osc.connect(this.padFilter);
        osc.start();
        this.padOscs.push(osc);
      }
    });
  }

  // ── Bass ──
  private createBass() {
    if (!this.ctx || !this.masterGain) return;

    this.bassGain = this.ctx.createGain();
    this.bassGain.gain.value = 0.12;

    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 200;

    this.bassOsc = this.ctx.createOscillator();
    this.bassOsc.type = "sine";
    this.bassOsc.frequency.value = PROGRESSIONS[this.currentMood].bassNotes[0];

    this.bassOsc.connect(bassFilter);
    bassFilter.connect(this.bassGain);
    this.bassGain.connect(this.masterGain);
    this.bassOsc.start();
  }

  // ── Arp ──
  private createArp() {
    if (!this.ctx || !this.masterGain) return;

    this.arpGain = this.ctx.createGain();
    this.arpGain.gain.value = 0.06;

    this.arpOsc = this.ctx.createOscillator();
    this.arpOsc.type = "sine";
    this.arpOsc.frequency.value = 0;

    const arpFilter = this.ctx.createBiquadFilter();
    arpFilter.type = "bandpass";
    arpFilter.frequency.value = 2000;
    arpFilter.Q.value = 2;

    this.arpOsc.connect(arpFilter);
    arpFilter.connect(this.arpGain);
    this.arpGain.connect(this.masterGain);
    if (this.convolver) this.arpGain.connect(this.convolver);
    this.arpOsc.start();

    this.startArpSequencer();
  }

  private startArpSequencer() {
    const interval = (60 / this.bpm) * 250; // 16th notes
    this.arpIntervalId = setInterval(() => {
      if (!this.ctx || !this.arpOsc || !this.arpGain) return;

      const prog = PROGRESSIONS[this.currentMood];
      const notes = prog.arpNotes[this.chordIndex];
      const freq = notes[this.arpIndex % notes.length];

      this.arpOsc.frequency.linearRampToValueAtTime(
        freq,
        this.ctx.currentTime + 0.02
      );

      // Pluck envelope
      this.arpGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.arpGain.gain.exponentialRampToValueAtTime(
        0.01,
        this.ctx.currentTime + interval / 1000 * 0.8
      );

      this.arpIndex++;
    }, interval);
  }

  // ── Noise (wind) ──
  private createNoise() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.value = 1200;
    this.noiseFilter.Q.value = 0.5;

    // LFO for wind variation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 600;
    lfo.connect(lfoGain);
    lfoGain.connect(this.noiseFilter.frequency);
    lfo.start();

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0.03;

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseSource.start();
  }

  // ── Chord progression ──
  private startChordProgression() {
    const beatsPerChord = 4;
    const interval = (60 / this.bpm) * beatsPerChord * 1000;

    this.chordChangeInterval = setInterval(() => {
      const prog = PROGRESSIONS[this.currentMood];
      this.chordIndex = (this.chordIndex + 1) % prog.chords.length;
      this.transitionToChord(this.chordIndex);
    }, interval);
  }

  private transitionToChord(index: number) {
    if (!this.ctx) return;

    const prog = PROGRESSIONS[this.currentMood];
    const chord = prog.chords[index];
    const bass = prog.bassNotes[index];
    const t = this.ctx.currentTime + 0.3;

    // Transition pad oscillators
    let oscIdx = 0;
    chord.forEach((freq) => {
      for (let d = -1; d <= 1; d++) {
        if (this.padOscs[oscIdx]) {
          this.padOscs[oscIdx].frequency.linearRampToValueAtTime(
            freq + d * 1.5,
            t
          );
        }
        oscIdx++;
      }
    });

    // Transition bass
    if (this.bassOsc) {
      this.bassOsc.frequency.linearRampToValueAtTime(bass, t);
    }
  }
}
