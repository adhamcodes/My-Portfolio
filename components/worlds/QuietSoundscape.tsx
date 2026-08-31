"use client";

import { useEffect, useRef, useState } from "react";

type SoundId = "rain" | "ocean" | "brown";
type NoiseKind = "white" | "pink" | "brown";

type RunningLayer = {
  gain: GainNode;
  sources: AudioBufferSourceNode[];
  oscillators: OscillatorNode[];
};

const choices: Array<{ id: SoundId; label: string; note: string }> = [
  { id: "rain", label: "Rain", note: "filtered noise + a slowly moving patter" },
  { id: "ocean", label: "Ocean", note: "low brown noise with a long swell" },
  { id: "brown", label: "Brown", note: "deep continuous noise" },
];

function makeNoise(ctx: AudioContext, kind: NoiseKind) {
  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (kind === "white") {
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  } else if (kind === "brown") {
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + white * 0.02) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  return buffer;
}

function source(ctx: AudioContext, kind: NoiseKind) {
  const node = ctx.createBufferSource();
  node.buffer = makeNoise(ctx, kind);
  node.loop = true;
  return node;
}

function filter(ctx: AudioContext, type: BiquadFilterType, frequency: number, q?: number) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  if (q !== undefined) node.Q.value = q;
  return node;
}

function lfo(ctx: AudioContext, rate: number, depth: number, target: AudioParam, center: number) {
  const oscillator = ctx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = rate;
  const amount = ctx.createGain();
  amount.gain.value = depth;
  target.value = center;
  oscillator.connect(amount).connect(target);
  return oscillator;
}

function buildLayer(ctx: AudioContext, master: AudioNode, id: SoundId): RunningLayer {
  const layerGain = ctx.createGain();
  layerGain.gain.value = 0.0001;
  layerGain.connect(master);

  const sources: AudioBufferSourceNode[] = [];
  const oscillators: OscillatorNode[] = [];

  if (id === "brown") {
    const noise = source(ctx, "brown");
    const low = filter(ctx, "lowpass", 900, 0.35);
    noise.connect(low).connect(layerGain);
    sources.push(noise);
  }

  if (id === "ocean") {
    const noise = source(ctx, "brown");
    const low = filter(ctx, "lowpass", 620, 0.4);
    const swell = ctx.createGain();
    swell.gain.value = 0.5;
    noise.connect(low).connect(swell).connect(layerGain);
    sources.push(noise);
    oscillators.push(lfo(ctx, 0.08, 0.38, swell.gain, 0.5));
  }

  if (id === "rain") {
    const wash = source(ctx, "pink");
    const washHigh = filter(ctx, "highpass", 520);
    const washLow = filter(ctx, "lowpass", 7600);
    const washGain = ctx.createGain();
    washGain.gain.value = 0.62;
    wash.connect(washHigh).connect(washLow).connect(washGain).connect(layerGain);

    const patter = source(ctx, "white");
    const patterBand = filter(ctx, "bandpass", 2300, 0.7);
    const patterGain = ctx.createGain();
    patter.connect(patterBand).connect(patterGain).connect(layerGain);
    sources.push(wash, patter);
    oscillators.push(lfo(ctx, 0.75, 0.09, patterGain.gain, 0.13));
  }

  for (const item of sources) item.start();
  for (const item of oscillators) item.start();
  layerGain.gain.exponentialRampToValueAtTime(id === "brown" ? 0.12 : 0.16, ctx.currentTime + 0.7);

  return { gain: layerGain, sources, oscillators };
}

function stopLayer(ctx: AudioContext, layer: RunningLayer) {
  const now = ctx.currentTime;
  layer.gain.gain.cancelScheduledValues(now);
  layer.gain.gain.setValueAtTime(Math.max(layer.gain.gain.value, 0.0001), now);
  layer.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  window.setTimeout(() => {
    for (const item of layer.sources) {
      try { item.stop(); } catch { /* already stopped */ }
    }
    for (const item of layer.oscillators) {
      try { item.stop(); } catch { /* already stopped */ }
    }
    layer.gain.disconnect();
  }, 520);
}

export default function QuietSoundscape() {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const layersRef = useRef(new Map<SoundId, RunningLayer>());
  const [active, setActive] = useState<SoundId[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ensureAudio = async () => {
    if (!contextRef.current) {
      if (typeof AudioContext === "undefined") throw new Error("Web Audio is unavailable in this browser.");
      const ctx = new AudioContext();
      const master = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      master.gain.value = 0.72;
      limiter.threshold.value = -12;
      limiter.knee.value = 18;
      limiter.ratio.value = 4;
      master.connect(limiter).connect(ctx.destination);
      contextRef.current = ctx;
      masterRef.current = master;
    }

    if (contextRef.current.state === "suspended") await contextRef.current.resume();
    return { ctx: contextRef.current, master: masterRef.current as GainNode };
  };

  const toggle = async (id: SoundId) => {
    setError(null);
    try {
      const { ctx, master } = await ensureAudio();
      const existing = layersRef.current.get(id);
      if (existing) {
        layersRef.current.delete(id);
        stopLayer(ctx, existing);
        setActive(Array.from(layersRef.current.keys()));
        return;
      }

      layersRef.current.set(id, buildLayer(ctx, master, id));
      setActive(Array.from(layersRef.current.keys()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sound could not start on this device.");
    }
  };

  const clear = () => {
    const ctx = contextRef.current;
    if (!ctx) return;
    for (const layer of layersRef.current.values()) stopLayer(ctx, layer);
    layersRef.current.clear();
    setActive([]);
  };

  useEffect(() => () => {
    const ctx = contextRef.current;
    if (!ctx) return;
    for (const layer of layersRef.current.values()) {
      for (const item of layer.sources) {
        try { item.stop(); } catch { /* already stopped */ }
      }
      for (const item of layer.oscillators) {
        try { item.stop(); } catch { /* already stopped */ }
      }
    }
    void ctx.close();
  }, []);

  return (
    <div className="quiet-soundscape" data-active-count={active.length}>
      <div className="quiet-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="quiet-sound-copy">
        <p>INTRODUCE ONLY WHAT YOU WANT</p>
        <h2>Silence stays intact until you touch it.</h2>
        <span>These three layers are synthesized in this tab. No audio files are streamed.</span>
      </div>

      <div className="quiet-sound-choices" aria-label="Generated ambient layers">
        {choices.map((choice) => {
          const isActive = active.includes(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => void toggle(choice.id)}
            >
              <span>{choice.label}</span>
              <small>{choice.note}</small>
              <i aria-hidden="true">{isActive ? "−" : "+"}</i>
            </button>
          );
        })}
      </div>

      <div className="quiet-sound-state" aria-live="polite">
        <span>{active.length === 0 ? "Silence" : `${active.length} layer${active.length === 1 ? "" : "s"}`}</span>
        {active.length > 0 && <button type="button" onClick={clear}>Return to silence</button>}
      </div>

      {error && <p className="quiet-sound-error" role="alert">{error}</p>}
    </div>
  );
}
