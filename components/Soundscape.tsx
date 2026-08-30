"use client";

import { useEffect, useRef, useState } from "react";

export default function Soundscape() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => () => {
    nodesRef.current.forEach((node) => { try { node.stop(); } catch {} });
    ctxRef.current?.close();
  }, []);

  const toggle = async () => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      gain.connect(ctx.destination);
      const frequencies = [55, 82.41, 110];
      const oscs = frequencies.map((frequency, index) => {
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
      gain.gain.exponentialRampToValueAtTime(next ? 0.018 : 0.0001, ctxRef.current.currentTime + 0.8);
    }
  };

  return (
    <button className={on ? "sound-toggle sound-on" : "sound-toggle"} onClick={toggle} aria-pressed={on} data-cursor="signal">
      <span className="sound-bars"><i /><i /><i /><i /></span>
      {on ? "AURA AUDIO ON" : "AURA AUDIO OFF"}
    </button>
  );
}
