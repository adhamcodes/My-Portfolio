"use client";

import { useEffect, useRef, useState } from "react";
import type { AuraMode } from "@/data/site";

const soundProfiles: Record<AuraMode, { frequencies: number[]; types: OscillatorType[]; filter: number; q: number; lfo: number; lfoDepth: number; gain: number }> = {
  pulse: { frequencies: [55, 82.41, 110], types: ["sine", "triangle", "sine"], filter: 480, q: .7, lfo: .12, lfoDepth: 42, gain: .016 },
  forge: { frequencies: [48.99, 73.42, 98], types: ["triangle", "sawtooth", "sine"], filter: 360, q: 1.4, lfo: .2, lfoDepth: 88, gain: .014 },
  void: { frequencies: [41.2, 61.74, 82.41], types: ["sine", "sine", "triangle"], filter: 220, q: .45, lfo: .045, lfoDepth: 24, gain: .008 },
};

export default function Soundscape({ aura }: { aura: AuraMode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => () => {
    nodesRef.current.forEach((node) => { try { node.stop(); } catch {} });
    try { lfoRef.current?.stop(); } catch {}
    ctxRef.current?.close();
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || nodesRef.current.length === 0) return;
    const profile = soundProfiles[aura];
    nodesRef.current.forEach((node, index) => {
      node.type = profile.types[index];
      node.frequency.cancelScheduledValues(ctx.currentTime);
      node.frequency.exponentialRampToValueAtTime(profile.frequencies[index], ctx.currentTime + 1.35);
    });
    if (filterRef.current) {
      filterRef.current.frequency.cancelScheduledValues(ctx.currentTime);
      filterRef.current.frequency.exponentialRampToValueAtTime(profile.filter, ctx.currentTime + 1.2);
      filterRef.current.Q.setTargetAtTime(profile.q, ctx.currentTime, .5);
    }
    if (lfoRef.current) lfoRef.current.frequency.setTargetAtTime(profile.lfo, ctx.currentTime, .45);
    if (lfoGainRef.current) lfoGainRef.current.gain.setTargetAtTime(profile.lfoDepth, ctx.currentTime, .45);
    if (on && gainRef.current) gainRef.current.gain.exponentialRampToValueAtTime(profile.gain, ctx.currentTime + .9);
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `AUDIO / ${aura.toUpperCase()} / PROFILE MORPHED` }));
  }, [aura, on]);

  const toggle = async () => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const profile = soundProfiles[aura];
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      filter.type = "lowpass";
      filter.frequency.value = profile.filter;
      filter.Q.value = profile.q;
      gain.gain.value = .0001;
      gain.connect(filter).connect(ctx.destination);
      lfo.type = "sine";
      lfo.frequency.value = profile.lfo;
      lfoGain.gain.value = profile.lfoDepth;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      const oscs = profile.frequencies.map((frequency, index) => {
        const osc = ctx.createOscillator();
        const localGain = ctx.createGain();
        osc.type = profile.types[index];
        osc.frequency.value = frequency;
        localGain.gain.value = index === 0 ? .34 : index === 1 ? .11 : .08;
        osc.connect(localGain).connect(gain);
        osc.start();
        return osc;
      });
      ctxRef.current = ctx;
      gainRef.current = gain;
      filterRef.current = filter;
      lfoRef.current = lfo;
      lfoGainRef.current = lfoGain;
      nodesRef.current = oscs;
    }
    const next = !on;
    setOn(next);
    await ctxRef.current?.resume();
    const gain = gainRef.current;
    if (gain && ctxRef.current) {
      gain.gain.cancelScheduledValues(ctxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(next ? soundProfiles[aura].gain : .0001, ctxRef.current.currentTime + .8);
    }
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: next ? `AUDIO / ${aura.toUpperCase()} / ONLINE` : "AUDIO / MUTED" }));
  };

  return (
    <button className={on ? "sound-toggle sound-on" : "sound-toggle"} onClick={toggle} aria-pressed={on} data-cursor="signal">
      <span className="sound-bars"><i /><i /><i /><i /></span>
      {on ? `AUDIO / ${aura.toUpperCase()}` : "AURA AUDIO OFF"}
    </button>
  );
}
