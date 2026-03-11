/**
 * WanderScore Audio Engine v2
 *
 * Tone.js-based composition engine with cultural awareness,
 * intensity scaling, and environmental adaptation.
 *
 * Layers: Drums → Bass → Pad → Lead → Arp
 * Each layer reacts to culture, environment, and walking intensity.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Dynamic import — Tone.js cannot run server-side
let T: any = null;
async function loadTone() {
  if (!T) T = await import("tone");
  return T;
}

// ─── Types ───────────────────────────────────────────────
export type CultureType =
  | "western"
  | "eastAsian"
  | "latin"
  | "middleEastern"
  | "indian"
  | "african"
  | "urban";

export type EnvironmentType = "city" | "nature" | "water" | "night";
export type IntensityLevel = "ambient" | "walking" | "brisk" | "jogging" | "running";

export interface LocationData {
  speed: number;
  heading: number;
  lat: number;
  lng: number;
}

export interface MusicState {
  culture: CultureType;
  environment: EnvironmentType;
  intensity: IntensityLevel;
  bpm: number;
  playing: boolean;
  progressionName: string;
}

// ─── Musical Constants ───────────────────────────────────
const SCALES: Record<string, number[]> = {
  major:         [0, 2, 4, 5, 7, 9, 11],
  minor:         [0, 2, 3, 5, 7, 8, 10],
  pentatonic:    [0, 2, 4, 7, 9],
  minPentatonic: [0, 3, 5, 7, 10],
  harmonicMin:   [0, 2, 3, 5, 7, 8, 11],
  dorian:        [0, 2, 3, 5, 7, 9, 10],
  mixolydian:    [0, 2, 4, 5, 7, 9, 10],
  phrygian:      [0, 1, 3, 5, 7, 8, 10],
  japanese:      [0, 1, 5, 7, 8],
  bhairav:       [0, 1, 4, 5, 7, 8, 11],
  blues:         [0, 3, 5, 6, 7, 10],
};

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function midiToNote(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function scaleNote(root: number, scale: number[], degree: number): string {
  const oct = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  return midiToNote(root + scale[idx] + oct * 12);
}

// ─── Cultural Profiles ───────────────────────────────────
interface DrumPattern {
  kick: number[];
  snare: number[];
  hihat: number[];
  perc: number[];
}

interface CulturalProfile {
  name: string;
  scale: number[];
  root: number; // MIDI root note
  chords: number[][]; // Chord progression as scale degree triads
  drums: DrumPattern;
  bass: (number | null)[]; // 8 steps, scale degrees
  leadMotifs: (number | null)[][]; // Multiple 8-step motifs
  arp: (number | null)[]; // 16 steps, scale degrees
  padAttack: number;
  padRelease: number;
  reverbDecay: number;
  delayWet: number;
  leadSynthType: "fm" | "pluck" | "am" | "mono";
}

const PROFILES: Record<CultureType, CulturalProfile> = {
  western: {
    name: "Western Pop",
    scale: SCALES.major,
    root: 60,
    chords: [[0,2,4],[5,7,9],[3,5,7],[4,6,8]],
    drums: {
      kick:  [.9,0,0,0,0,0,0,0,.7,0,0,0,0,0,0,0],
      snare: [0,0,0,0,.8,0,0,0,0,0,0,0,.8,0,0,0],
      hihat: [.4,0,.5,0,.4,0,.5,0,.4,0,.5,0,.4,0,.5,0],
      perc:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
    bass: [0, null, null, null, 0, null, 4, null],
    leadMotifs: [
      [0,null,2,4,null,4,2,null],
      [4,2,null,0,null,null,null,null],
      [0,4,7,null,4,null,2,null],
    ],
    arp: [0,null,2,null,4,null,2,null,0,null,4,null,7,null,4,null],
    padAttack: 0.8, padRelease: 2.5, reverbDecay: 3, delayWet: 0.15,
    leadSynthType: "fm",
  },

  eastAsian: {
    name: "East Asian",
    scale: SCALES.pentatonic,
    root: 62, // D
    chords: [[0,2,4],[1,3,0],[2,4,1],[0,2,4]],
    drums: {
      kick:  [.6,0,0,0,0,0,0,0,.4,0,0,0,0,0,0,0],
      snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hihat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      perc:  [0,0,0,.4,0,0,0,0,0,0,.3,0,0,0,0,0],
    },
    bass: [0, null, null, null, null, null, null, null],
    leadMotifs: [
      [4,null,2,null,0,null,null,null],
      [0,null,2,4,null,2,null,null],
      [7,4,null,2,0,null,null,null],
    ],
    arp: [0,null,null,2,null,null,4,null,null,2,null,null,0,null,null,null],
    padAttack: 1.5, padRelease: 4, reverbDecay: 6, delayWet: 0.25,
    leadSynthType: "pluck",
  },

  latin: {
    name: "Latin Groove",
    scale: SCALES.mixolydian,
    root: 60,
    chords: [[0,2,4],[3,5,7],[4,6,8],[5,0,2]],
    drums: {
      kick:  [.9,0,0,.7,0,0,.8,0,.9,0,0,.7,0,0,.8,0],
      snare: [0,0,0,0,.8,0,0,0,0,0,0,0,.9,0,0,.3],
      hihat: [.4,.2,.4,.2,.4,.2,.4,.2,.4,.2,.4,.2,.4,.2,.4,.2],
      perc:  [0,.6,0,0,.6,0,.4,0,0,.6,0,0,.6,0,.4,0],
    },
    bass: [0, null, null, 0, 4, null, 0, null],
    leadMotifs: [
      [0,2,4,5,4,null,2,null],
      [7,null,5,null,4,2,0,null],
      [0,4,5,4,0,null,null,null],
    ],
    arp: [0,4,7,4,0,4,7,4,0,4,7,4,0,4,7,4],
    padAttack: 0.3, padRelease: 1.5, reverbDecay: 2, delayWet: 0.1,
    leadSynthType: "fm",
  },

  middleEastern: {
    name: "Middle Eastern",
    scale: SCALES.harmonicMin,
    root: 62, // D
    chords: [[0,2,4],[3,5,7],[4,6,8],[0,2,4]],
    drums: {
      kick:  [.9,0,0,.7,0,.6,0,0,.8,0,0,0,0,0,0,0],
      snare: [0,0,0,0,0,0,0,0,0,0,0,0,.8,0,0,0],
      hihat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      perc:  [0,0,.5,0,0,0,.5,0,0,0,.5,0,0,0,.5,0],
    },
    bass: [0, null, 0, null, null, 4, null, null],
    leadMotifs: [
      [0,1,null,4,null,5,4,null],
      [7,null,5,4,null,1,0,null],
      [0,null,4,5,7,null,5,null],
    ],
    arp: [0,null,4,null,7,null,8,null,7,null,4,null,0,null,null,null],
    padAttack: 1.0, padRelease: 3, reverbDecay: 4, delayWet: 0.2,
    leadSynthType: "fm",
  },

  indian: {
    name: "Indian Raga",
    scale: SCALES.bhairav,
    root: 60,
    chords: [[0,2,4],[3,5,7],[0,4,7],[3,5,0]],
    drums: {
      kick:  [.8,0,0,0,0,.6,0,0,.7,0,0,0,0,0,.5,0],
      snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hihat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      perc:  [0,0,.6,0,.5,0,0,.4,0,0,.6,0,.5,0,0,.7],
    },
    bass: [0, null, null, null, 4, null, null, null],
    leadMotifs: [
      [0,1,null,4,5,null,4,null],
      [7,null,5,4,null,1,0,null],
      [0,null,1,4,null,5,null,4],
    ],
    arp: [0,null,1,null,4,null,5,null,7,null,5,null,4,null,1,null],
    padAttack: 2.0, padRelease: 4, reverbDecay: 5, delayWet: 0.2,
    leadSynthType: "am",
  },

  african: {
    name: "African Groove",
    scale: SCALES.dorian,
    root: 60,
    chords: [[0,2,4],[3,5,7],[4,6,8],[1,3,5]],
    drums: {
      kick:  [.9,0,0,0,0,0,.8,0,0,0,.7,0,0,0,0,0],
      snare: [0,0,0,0,.8,0,0,0,0,.7,0,0,0,0,.6,0],
      hihat: [.5,0,.5,.5,0,.5,0,.5,.5,0,.5,0,.5,.5,0,.5],
      perc:  [0,.6,0,0,0,.5,0,0,.4,0,0,.6,0,0,.5,0],
    },
    bass: [0, null, 0, null, 4, null, 2, null],
    leadMotifs: [
      [0,2,4,null,7,4,2,null],
      [7,null,4,2,0,null,null,null],
      [0,4,7,9,7,4,0,null],
    ],
    arp: [0,2,4,7,9,7,4,2,0,2,4,7,9,7,4,2],
    padAttack: 0.3, padRelease: 1.5, reverbDecay: 2, delayWet: 0.08,
    leadSynthType: "pluck",
  },

  urban: {
    name: "Urban Beat",
    scale: SCALES.minPentatonic,
    root: 57, // A
    chords: [[0,2,4],[3,0,2],[1,3,0],[2,4,1]],
    drums: {
      kick:  [.9,0,0,0,0,0,.7,0,.9,0,0,0,0,0,0,0],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,.4],
      hihat: [.5,.3,.5,.3,.5,.3,.5,.3,.5,.3,.5,.3,.5,.3,.5,.3],
      perc:  [0,0,0,.3,0,0,.3,0,0,0,0,.3,0,0,.3,0],
    },
    bass: [0, null, 0, null, null, 0, null, null],
    leadMotifs: [
      [0,null,null,3,null,5,null,null],
      [7,null,5,null,3,null,0,null],
      [0,3,5,null,null,null,null,null],
    ],
    arp: [0,null,null,null,3,null,null,null,5,null,null,null,7,null,null,null],
    padAttack: 0.5, padRelease: 2, reverbDecay: 2.5, delayWet: 0.12,
    leadSynthType: "mono",
  },
};

// ─── Intensity Configuration ─────────────────────────────
interface IntensityConfig {
  bpmRange: [number, number];
  drumVol: number;
  bassVol: number;
  padVol: number;
  leadVol: number;
  arpVol: number;
  filterFreq: number; // pad filter cutoff
  drumsActive: boolean;
}

const INTENSITY: Record<IntensityLevel, IntensityConfig> = {
  ambient:  { bpmRange: [60,70],   drumVol: -Infinity, bassVol: -20, padVol: -10, leadVol: -18, arpVol: -16, filterFreq: 600,  drumsActive: false },
  walking:  { bpmRange: [75,95],   drumVol: -14, bassVol: -14, padVol: -10, leadVol: -14, arpVol: -16, filterFreq: 1200, drumsActive: true },
  brisk:    { bpmRange: [95,115],  drumVol: -10, bassVol: -10, padVol: -10, leadVol: -12, arpVol: -14, filterFreq: 2000, drumsActive: true },
  jogging:  { bpmRange: [115,135], drumVol: -6,  bassVol: -8,  padVol: -12, leadVol: -10, arpVol: -12, filterFreq: 3500, drumsActive: true },
  running:  { bpmRange: [135,165], drumVol: -4,  bassVol: -6,  padVol: -14, leadVol: -8,  arpVol: -10, filterFreq: 5000, drumsActive: true },
};

// ─── Environment Effects ─────────────────────────────────
interface EnvConfig {
  reverbMult: number;
  delayMult: number;
  filterOffset: number;
  padVolOffset: number;
}

const ENV_FX: Record<EnvironmentType, EnvConfig> = {
  city:   { reverbMult: 1.0, delayMult: 1.0, filterOffset: 0,     padVolOffset: 0 },
  nature: { reverbMult: 1.8, delayMult: 0.5, filterOffset: -400,  padVolOffset: 3 },
  water:  { reverbMult: 2.0, delayMult: 2.0, filterOffset: -200,  padVolOffset: 2 },
  night:  { reverbMult: 1.5, delayMult: 1.5, filterOffset: -600,  padVolOffset: 4 },
};

// ─── Speed → Intensity Mapping ──────────────────────────
function speedToIntensity(speedMs: number): IntensityLevel {
  const kph = speedMs * 3.6;
  if (kph < 1) return "ambient";
  if (kph < 5) return "walking";
  if (kph < 7.5) return "brisk";
  if (kph < 11) return "jogging";
  return "running";
}

function speedToBPM(speedMs: number, range: [number, number]): number {
  const kph = speedMs * 3.6;
  const t = Math.min(1, Math.max(0, kph / 14));
  return range[0] + t * (range[1] - range[0]);
}

// ─── Main Engine ─────────────────────────────────────────
export class AudioEngine {
  // Tone.js nodes (typed as any for dynamic import)
  private kick: any = null;
  private snare: any = null;
  private hihat: any = null;
  private perc: any = null;
  private bass: any = null;
  private pad: any = null;
  private lead: any = null;
  private arpSynth: any = null;

  // Gain nodes per layer
  private drumBus: any = null;
  private bassBus: any = null;
  private padBus: any = null;
  private leadBus: any = null;
  private arpBus: any = null;
  private masterBus: any = null;

  // Effects
  private reverb: any = null;
  private delay: any = null;
  private chorus: any = null;
  private compressor: any = null;
  private padFilter: any = null;

  // Analyser
  private analyser: any = null;

  // Sequences
  private kickSeq: any = null;
  private snareSeq: any = null;
  private hihatSeq: any = null;
  private percSeq: any = null;
  private bassSeq: any = null;
  private leadSeq: any = null;
  private arpSeq: any = null;
  private chordLoop: any = null;

  // State
  private _culture: CultureType = "western";
  private _environment: EnvironmentType = "city";
  private _intensity: IntensityLevel = "walking";
  private _bpm = 85;
  private _playing = false;
  private chordIndex = 0;
  private motifIndex = 0;

  // Public getters
  get culture() { return this._culture; }
  get environment() { return this._environment; }
  get intensity() { return this._intensity; }
  get bpm() { return this._bpm; }
  get playing() { return this._playing; }
  get mood() { return this._culture; }
  get currentBPM() { return this._bpm; }
  get progressionName() { return PROFILES[this._culture].name; }

  getState(): MusicState {
    return {
      culture: this._culture,
      environment: this._environment,
      intensity: this._intensity,
      bpm: this._bpm,
      playing: this._playing,
      progressionName: PROFILES[this._culture].name,
    };
  }

  // ── Start ──
  async start() {
    if (this._playing) return;
    const Tone = await loadTone();
    await Tone.start();

    this.createEffects(Tone);
    this.createInstruments(Tone);
    this.createSequences(Tone);

    // Fade in
    this.masterBus.gain.rampTo(0, 0);
    Tone.Transport.bpm.value = this._bpm;
    Tone.Transport.start();
    this.masterBus.gain.rampTo(0.85, 2);

    this._playing = true;
  }

  // ── Stop ──
  async stop() {
    if (!this._playing) return;
    const Tone = await loadTone();

    this.masterBus?.gain.rampTo(0, 1.5);

    setTimeout(() => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      this.disposeAll();
      this._playing = false;
    }, 2000);

    this._playing = false;
  }

  // ── Create Effects Chain ──
  private createEffects(Tone: any) {
    const profile = PROFILES[this._culture];
    const env = ENV_FX[this._environment];

    this.reverb = new Tone.Reverb({
      decay: profile.reverbDecay * env.reverbMult,
      wet: 0.3,
    }).toDestination();

    this.delay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.2,
      wet: profile.delayWet * env.delayMult,
    }).connect(this.reverb);

    this.chorus = new Tone.Chorus({
      frequency: 1.2,
      delayTime: 3,
      depth: 0.6,
      wet: 0.15,
    }).connect(this.delay);

    this.compressor = new Tone.Compressor({
      threshold: -18,
      ratio: 4,
      attack: 0.01,
      release: 0.2,
    }).connect(this.chorus);

    // Analyser for visualization
    this.analyser = new Tone.Analyser("fft", 128);
    this.compressor.connect(this.analyser);

    // Master gain
    this.masterBus = new Tone.Gain(0).connect(this.compressor);

    // Layer buses
    const ic = INTENSITY[this._intensity];
    this.drumBus = new Tone.Gain(0).connect(this.masterBus);
    this.drumBus.gain.value = Tone.dbToGain(ic.drumVol);

    this.bassBus = new Tone.Gain(0).connect(this.masterBus);
    this.bassBus.gain.value = Tone.dbToGain(ic.bassVol);

    this.padFilter = new Tone.Filter({
      type: "lowpass",
      frequency: ic.filterFreq + env.filterOffset,
      rolloff: -12,
      Q: 1,
    }).connect(this.masterBus);

    this.padBus = new Tone.Gain(0).connect(this.padFilter);
    this.padBus.gain.value = Tone.dbToGain(ic.padVol + env.padVolOffset);

    this.leadBus = new Tone.Gain(0).connect(this.masterBus);
    this.leadBus.gain.value = Tone.dbToGain(ic.leadVol);

    this.arpBus = new Tone.Gain(0).connect(this.masterBus);
    this.arpBus.gain.value = Tone.dbToGain(ic.arpVol);
  }

  // ── Create Instruments ──
  private createInstruments(Tone: any) {
    const profile = PROFILES[this._culture];

    // ── Drums ──
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.4 },
    }).connect(this.drumBus);

    this.snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    }).connect(this.drumBus);

    this.hihat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.drumBus);
    this.hihat.volume.value = -6;

    this.perc = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).connect(this.drumBus);
    this.perc.volume.value = -4;

    // ── Bass ──
    this.bass = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { Q: 3, type: "lowpass", rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.15,
        sustain: 0.3,
        release: 0.3,
        baseFrequency: 80,
        octaves: 2.5,
      },
    }).connect(this.bassBus);

    // ── Pad ──
    this.pad = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.5,
      oscillator: { type: "sine" },
      envelope: {
        attack: profile.padAttack,
        decay: 0.4,
        sustain: 0.7,
        release: profile.padRelease,
      },
      modulation: { type: "triangle" },
      modulationEnvelope: { attack: 0.5, decay: 0.1, sustain: 0.8, release: 0.5 },
    }).connect(this.padBus);
    this.pad.maxPolyphony = 8;

    // ── Lead ──
    this.lead = this.createLeadSynth(Tone, profile.leadSynthType);
    this.lead.connect(this.leadBus);

    // ── Arp ──
    this.arpSynth = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 3000,
      resonance: 0.92,
    }).connect(this.arpBus);
  }

  private createLeadSynth(Tone: any, type: string): any {
    switch (type) {
      case "pluck":
        return new Tone.PluckSynth({
          attackNoise: 2,
          dampening: 4000,
          resonance: 0.95,
        });
      case "am":
        return new Tone.AMSynth({
          harmonicity: 3,
          oscillator: { type: "sine" },
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 1 },
          modulation: { type: "square" },
          modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0.5, release: 0.3 },
        });
      case "mono":
        return new Tone.MonoSynth({
          oscillator: { type: "square" },
          filter: { Q: 2, type: "lowpass", rolloff: -12 },
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2 },
          filterEnvelope: {
            attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.2,
            baseFrequency: 200, octaves: 3,
          },
        });
      default: // "fm"
        return new Tone.FMSynth({
          harmonicity: 3,
          modulationIndex: 8,
          oscillator: { type: "sine" },
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.6 },
          modulation: { type: "triangle" },
          modulationEnvelope: { attack: 0.1, decay: 0.05, sustain: 0.4, release: 0.3 },
        });
    }
  }

  // ── Create Sequences ──
  private createSequences(Tone: any) {
    const profile = PROFILES[this._culture];

    // Drums (16th notes)
    this.kickSeq = new Tone.Sequence((time: number, vel: number) => {
      if (vel > 0) this.kick?.triggerAttackRelease("C1", "8n", time, vel);
    }, profile.drums.kick, "16n").start(0);

    this.snareSeq = new Tone.Sequence((time: number, vel: number) => {
      if (vel > 0) this.snare?.triggerAttackRelease("8n", time, vel);
    }, profile.drums.snare, "16n").start(0);

    this.hihatSeq = new Tone.Sequence((time: number, vel: number) => {
      if (vel > 0) this.hihat?.triggerAttackRelease("32n", time, vel * 0.5);
    }, profile.drums.hihat, "16n").start(0);

    this.percSeq = new Tone.Sequence((time: number, vel: number) => {
      if (vel > 0) this.perc?.triggerAttackRelease("G3", "16n", time, vel);
    }, profile.drums.perc, "16n").start(0);

    // Bass (8th notes)
    this.bassSeq = new Tone.Sequence((time: number, deg: number | null) => {
      if (deg === null || !this.bass) return;
      const chord = profile.chords[this.chordIndex % profile.chords.length];
      const rootDeg = chord[0];
      const note = scaleNote(profile.root - 12, profile.scale, rootDeg + deg);
      this.bass.triggerAttackRelease(note, "8n", time, 0.8);
    }, profile.bass, "8n").start(0);

    // Lead melody (8th notes, cycles through motifs)
    this.leadSeq = new Tone.Sequence((time: number, deg: number | null) => {
      if (deg === null || !this.lead) return;
      const chord = profile.chords[this.chordIndex % profile.chords.length];
      const rootDeg = chord[0];
      const note = scaleNote(profile.root, profile.scale, rootDeg + deg);
      try {
        if (profile.leadSynthType === "pluck") {
          this.lead.triggerAttack(note, time);
        } else {
          this.lead.triggerAttackRelease(note, "8n", time, 0.6);
        }
      } catch { /* polyphony overflow */ }
    }, profile.leadMotifs[this.motifIndex % profile.leadMotifs.length], "8n").start("1m");

    // Arp (16th notes)
    this.arpSeq = new Tone.Sequence((time: number, deg: number | null) => {
      if (deg === null || !this.arpSynth) return;
      const chord = profile.chords[this.chordIndex % profile.chords.length];
      const rootDeg = chord[0];
      const note = scaleNote(profile.root + 12, profile.scale, rootDeg + deg);
      this.arpSynth.triggerAttack(note, time);
    }, profile.arp, "16n").start(0);

    // Chord change loop (every 2 measures)
    this.chordLoop = new Tone.Loop((time: number) => {
      const profile = PROFILES[this._culture];
      this.chordIndex = (this.chordIndex + 1) % profile.chords.length;

      // Update pad chord
      const chord = profile.chords[this.chordIndex];
      const notes = chord.map((deg) => scaleNote(profile.root, profile.scale, deg));
      try {
        this.pad?.releaseAll(time);
        this.pad?.triggerAttack(notes, time + 0.05, 0.5);
      } catch { /* polyphony overflow */ }

      // Cycle lead motif every 2 chord changes
      if (this.chordIndex % 2 === 0) {
        this.motifIndex = (this.motifIndex + 1) % profile.leadMotifs.length;
        if (this.leadSeq) {
          this.leadSeq.events = profile.leadMotifs[this.motifIndex];
        }
      }
    }, "2m").start(0);

    // Trigger initial pad chord
    const initChord = profile.chords[0];
    const initNotes = initChord.map((deg) => scaleNote(profile.root, profile.scale, deg));
    this.pad?.triggerAttack(initNotes, "+0.1", 0.5);
  }

  // ── Set Culture ──
  async setCulture(culture: CultureType) {
    if (culture === this._culture || !this._playing) {
      this._culture = culture;
      return;
    }
    this._culture = culture;
    await this.rebuildSequences();
  }

  // ── Set Environment ──
  async setEnvironment(env: EnvironmentType) {
    if (env === this._environment) return;
    this._environment = env;
    if (!this._playing) return;

    const Tone = await loadTone();
    const profile = PROFILES[this._culture];
    const envCfg = ENV_FX[env];
    const ic = INTENSITY[this._intensity];

    // Smooth transitions on effects
    if (this.reverb) {
      this.reverb.decay = profile.reverbDecay * envCfg.reverbMult;
    }
    if (this.delay) {
      this.delay.wet.rampTo(profile.delayWet * envCfg.delayMult, 2);
    }
    if (this.padFilter) {
      this.padFilter.frequency.rampTo(ic.filterFreq + envCfg.filterOffset, 2);
    }
    if (this.padBus) {
      this.padBus.gain.rampTo(Tone.dbToGain(ic.padVol + envCfg.padVolOffset), 2);
    }
  }

  // ── Set Intensity ──
  async setIntensity(level: IntensityLevel) {
    if (level === this._intensity || !this._playing) return;
    this._intensity = level;

    const Tone = await loadTone();
    const ic = INTENSITY[level];
    const env = ENV_FX[this._environment];
    const ramp = 1.5;

    this.drumBus?.gain.rampTo(Tone.dbToGain(ic.drumVol), ramp);
    this.bassBus?.gain.rampTo(Tone.dbToGain(ic.bassVol), ramp);
    this.padBus?.gain.rampTo(Tone.dbToGain(ic.padVol + env.padVolOffset), ramp);
    this.leadBus?.gain.rampTo(Tone.dbToGain(ic.leadVol), ramp);
    this.arpBus?.gain.rampTo(Tone.dbToGain(ic.arpVol), ramp);
    this.padFilter?.frequency.rampTo(ic.filterFreq + env.filterOffset, ramp);
  }

  // ── Update from Location ──
  updateFromLocation(data: LocationData) {
    if (!this._playing) return;

    const newIntensity = speedToIntensity(data.speed);
    if (newIntensity !== this._intensity) {
      this.setIntensity(newIntensity);
    }

    const ic = INTENSITY[newIntensity];
    const newBPM = Math.round(speedToBPM(data.speed, ic.bpmRange));
    if (Math.abs(newBPM - this._bpm) > 2) {
      this._bpm = newBPM;
      loadTone().then((Tone) => {
        Tone.Transport.bpm.rampTo(newBPM, 2);
      });
    }

    // Night auto-detect
    const hour = new Date().getHours();
    if ((hour >= 21 || hour < 5) && this._environment !== "night") {
      this.setEnvironment("night");
    }
  }

  // ── Get Analyser Data (for visualization) ──
  getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const values = this.analyser.getValue();
    // Convert Float32Array (dB) to Uint8Array (0-255)
    const result = new Uint8Array(values.length);
    for (let i = 0; i < values.length; i++) {
      const db = values[i] as number;
      result[i] = Math.max(0, Math.min(255, Math.round((db + 100) * 2.55)));
    }
    return result;
  }

  // ── Rebuild Sequences (on culture change) ──
  private async rebuildSequences() {
    const Tone = await loadTone();

    // Dispose old sequences
    this.kickSeq?.dispose();
    this.snareSeq?.dispose();
    this.hihatSeq?.dispose();
    this.percSeq?.dispose();
    this.bassSeq?.dispose();
    this.leadSeq?.dispose();
    this.arpSeq?.dispose();
    this.chordLoop?.dispose();

    // Dispose old instruments
    this.kick?.dispose();
    this.snare?.dispose();
    this.hihat?.dispose();
    this.perc?.dispose();
    this.bass?.dispose();
    this.pad?.dispose();
    this.lead?.dispose();
    this.arpSynth?.dispose();

    // Recreate
    this.chordIndex = 0;
    this.motifIndex = 0;
    this.createInstruments(Tone);
    this.createSequences(Tone);

    // Update effects for new culture
    const profile = PROFILES[this._culture];
    const envCfg = ENV_FX[this._environment];
    if (this.reverb) this.reverb.decay = profile.reverbDecay * envCfg.reverbMult;
    if (this.delay) this.delay.wet.rampTo(profile.delayWet * envCfg.delayMult, 1);
  }

  // ── Dispose ──
  private disposeAll() {
    const nodes = [
      this.kickSeq, this.snareSeq, this.hihatSeq, this.percSeq,
      this.bassSeq, this.leadSeq, this.arpSeq, this.chordLoop,
      this.kick, this.snare, this.hihat, this.perc,
      this.bass, this.pad, this.lead, this.arpSynth,
      this.drumBus, this.bassBus, this.padBus, this.leadBus, this.arpBus,
      this.masterBus, this.padFilter,
      this.reverb, this.delay, this.chorus, this.compressor, this.analyser,
    ];
    for (const node of nodes) {
      try { node?.dispose(); } catch { /* already disposed */ }
    }
  }
}
