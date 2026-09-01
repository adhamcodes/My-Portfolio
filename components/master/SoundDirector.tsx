"use client";

import { useEffect, useRef, useState } from "react";

type SoundPreference = "off" | "on";
type WebAudioState = {
  context: AudioContext;
  master: GainNode;
};

const STORAGE_KEY = "adham:site-sound";

function readPreference(): SoundPreference {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

function writePreference(value: SoundPreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Preference persistence is optional. Sound still works for this session.
  }
}

function makeAudio(): WebAudioState {
  const context = new AudioContext();
  const master = context.createGain();
  // Sound is opt-in and event-driven. This level is intentionally audible but
  // still far below soundtrack territory.
  master.gain.value = 0.14;
  master.connect(context.destination);
  return { context, master };
}

function quietScene() {
  return document.documentElement.dataset.sceneWorld === "quiet" || window.location.pathname === "/work/quiet";
}

function tone(audio: WebAudioState, options: {
  frequency: number;
  endFrequency?: number;
  duration: number;
  gain: number;
  delay?: number;
  type?: OscillatorType;
}) {
  const { context, master } = audio;
  const start = context.currentTime + (options.delay ?? 0);
  const end = start + options.duration;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.frequency, start);
  if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain), start + Math.min(0.035, options.duration * 0.18));
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(envelope).connect(master);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function noise(audio: WebAudioState, options: {
  duration: number;
  gain: number;
  frequency: number;
  type: BiquadFilterType;
  delay?: number;
}) {
  const { context, master } = audio;
  const start = context.currentTime + (options.delay ?? 0);
  const frameCount = Math.max(1, Math.floor(context.sampleRate * options.duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;

  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.value = options.frequency;
  filter.Q.value = 0.72;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(options.gain, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + options.duration);

  source.connect(filter).connect(envelope).connect(master);
  source.start(start);
  source.stop(start + options.duration + 0.02);
}

function playIndex(audio: WebAudioState) {
  tone(audio, { frequency: 132, endFrequency: 116, duration: 0.78, gain: 0.18, type: "sine" });
  tone(audio, { frequency: 198, endFrequency: 174, duration: 0.62, gain: 0.08, delay: 0.045, type: "triangle" });
}

function playBoundary(audio: WebAudioState) {
  noise(audio, { duration: 0.13, gain: 0.15, frequency: 2100, type: "bandpass" });
  tone(audio, { frequency: 104, endFrequency: 91, duration: 0.28, gain: 0.08, delay: 0.035, type: "sine" });
}

function playHistory(audio: WebAudioState) {
  tone(audio, { frequency: 86, endFrequency: 69, duration: 1.16, gain: 0.105, type: "sine" });
  noise(audio, { duration: 0.72, gain: 0.042, frequency: 520, type: "lowpass", delay: 0.1 });
}

function playPresent(audio: WebAudioState) {
  tone(audio, { frequency: 112, endFrequency: 124, duration: .9, gain: .085, type: "sine" });
  tone(audio, { frequency: 168, endFrequency: 186, duration: .72, gain: .045, delay: .08, type: "triangle" });
}

export default function SoundDirector() {
  const [preference, setPreference] = useState<SoundPreference>("off");
  const audioRef = useRef<WebAudioState | null>(null);
  const enabledRef = useRef(false);
  const indexPlayed = useRef(false);
  const historyPlayed = useRef(false);
  const presentPlayed = useRef(false);

  const ensureAudio = async () => {
    if (!audioRef.current) audioRef.current = makeAudio();
    if (audioRef.current.context.state === "suspended") await audioRef.current.context.resume();
    return audioRef.current;
  };

  const publish = (next: SoundPreference) => {
    enabledRef.current = next === "on";
    document.documentElement.dataset.soundMode = next;
    window.dispatchEvent(new CustomEvent("adham:sound", { detail: { mode: next } }));
  };

  useEffect(() => {
    const stored = readPreference();
    setPreference(stored);
    publish(stored);

    if (stored !== "on") return;

    const prime = () => {
      void ensureAudio().catch(() => {
        setPreference("off");
        writePreference("off");
        publish("off");
      });
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
    window.addEventListener("pointerdown", prime, { once: true, passive: true });
    window.addEventListener("keydown", prime, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, []);

  useEffect(() => {
    const onIndex = (event: Event) => {
      const open = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
      if (!open || indexPlayed.current || !enabledRef.current || quietScene()) return;
      const audio = audioRef.current;
      if (!audio || audio.context.state !== "running") return;
      indexPlayed.current = true;
      playIndex(audio);
    };

    const onTravel = (event: Event) => {
      const detail = (event as CustomEvent<{ phase?: string; world?: string }>).detail;
      if (detail?.phase !== "depart" || !enabledRef.current || quietScene()) return;
      const audio = audioRef.current;
      if (!audio || audio.context.state !== "running") return;
      if (detail.world === "zeroupload") playBoundary(audio);
    };

    const onChapter = (event: Event) => {
      const chapter = (event as CustomEvent<string>).detail;
      if (!enabledRef.current || quietScene()) return;
      const audio = audioRef.current;
      if (!audio || audio.context.state !== "running") return;

      if (chapter === "history" && !historyPlayed.current) {
        historyPlayed.current = true;
        playHistory(audio);
      }
      if (chapter === "present" && !presentPlayed.current) {
        presentPlayed.current = true;
        playPresent(audio);
      }
    };

    window.addEventListener("adham:index", onIndex);
    window.addEventListener("adham:travel", onTravel);
    window.addEventListener("adham:chapter", onChapter);
    return () => {
      window.removeEventListener("adham:index", onIndex);
      window.removeEventListener("adham:travel", onTravel);
      window.removeEventListener("adham:chapter", onChapter);
    };
  }, []);

  useEffect(() => () => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) void audio.context.close();
  }, []);

  const toggle = async () => {
    const next: SoundPreference = preference === "on" ? "off" : "on";

    if (next === "off") {
      setPreference("off");
      writePreference("off");
      publish("off");
      const audio = audioRef.current;
      if (audio?.context.state === "running") void audio.context.suspend();
      return;
    }

    try {
      await ensureAudio();
      setPreference("on");
      writePreference("on");
      publish("on");
    } catch {
      setPreference("off");
      writePreference("off");
      publish("off");
    }
  };

  return (
    <button
      type="button"
      className="sound-control"
      aria-pressed={preference === "on"}
      aria-label={`Site sound ${preference}. ${preference === "on" ? "Turn site sound off" : "Turn site sound on"}`}
      onClick={() => void toggle()}
    >
      <span aria-hidden="true" className="sound-control-mark"><i /><i /><i /></span>
      SOUND {preference.toUpperCase()}
    </button>
  );
}
