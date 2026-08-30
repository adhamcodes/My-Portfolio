"use client";

import { useEffect, useRef, useState } from "react";
import type { AuraMode } from "@/data/site";

const frequencies: Record<AuraMode, number[]> = {
  pulse: [55, 82.41, 110],
  forge: [48.99, 73.42, 98],
  void: [41.2, 61.74, 82.41],
};

export default function Soundscape({ aura }: { aura: AuraMode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => () => {
    nodesRef.current.forEach((node) => { try { node.stop(); } catch {} });
    ctxRef.current?.close();
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || nodesRef.current.length === 0) return;
    const next = frequencies[aura];
    nodesRef.current.forEach((node, index) => {
      node.frequency.cancelScheduledValues(ctx.currentTime);
      node.frequency.exponentialRampToValueAtTime(next[index], ctx.currentTime + 1.2);
    });
  }, [aura]);

  const toggle = async () => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 420;
      filter.Q.value = 0.7;
      gain.gain.value = 0.0001;
      gain.connect(filter).connect(ctx.destination);
      const oscs = frequencies[aura].map((frequency, index) => {
        const osc = ctx.createOscillator();
        const localGain = ctx.createGain();
        osc.type = index === 1 ? "triangle" : "sine";
        osc.frequency.value = frequency;
        localGain.gain.value = index === 0 ? 0.34 : 0.12;
        osc.connect(localGain).connect(gain);
        osc.start();
        return osc;
      });
      ctxRef.current = ctx;
      gainRef.current = gain;
      nodesRef.current = oscs;
    }
    const next = !on;
    setOn(next);
    await ctxRef.current?.resume();
    const gain = gainRef.current;
    if (gain && ctxRef.current) {
      gain.gain.cancelScheduledValues(ctxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(next ? 0.016 : 0.0001, ctxRef.current.currentTime + 0.8);
    }
  };

  return (
    <button className={on ? "sound-toggle sound-on" : "sound-toggle"} onClick={toggle} aria-pressed={on} data-cursor="signal">
      <span className="sound-bars"><i /><i /><i /><i /></span>
      {on ? `AUDIO / ${aura.toUpperCase()}` : "AURA AUDIO OFF"}
    </button>
  );
}
