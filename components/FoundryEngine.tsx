"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";

const flow = ["AUTHORED CURRICULUM", "EXERCISE", "AUTOMATED CHECK", "MASTERY GATE", "LOCAL STATE", "NEXT DAY"];

export default function FoundryEngine({ compact = false }: { compact?: boolean }) {
  const [day, setDay] = useState(73);
  const [phase, setPhase] = useState(3);
  const [pulse, setPulse] = useState(0);

  const dayCells = useMemo(() => Array.from({ length: compact ? 90 : 180 }, (_, index) => index + 1), [compact]);
  const visibleDay = compact ? Math.min(180, day * 2) : day;

  const runGate = () => {
    setPulse((value) => value + 1);
    window.dispatchEvent(new CustomEvent("aura:burst"));
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `FOUNDRY / DAY ${String(visibleDay).padStart(3, "0")} / MASTERY GATE PROBED` }));
  };

  return (
    <div className={compact ? "foundry-engine foundry-compact" : "foundry-engine"}>
      <div className="foundry-engine-head">
        <div><span>FOUNDRY180 / INTERACTIVE SYSTEM MODEL</span><b>ACTIVE OBSESSION</b></div>
        <div className="foundry-stats">
          <span><b>180</b>DAYS</span>
          <span><b>6</b>PHASES</span>
          <span><b>130+</b>EXERCISES</span>
          <span><b>600+</b>CURRENT AUDIT CHECKS</span>
        </div>
      </div>

      <div className="foundry-console">
        <section className="foundry-day-matrix">
          <div className="foundry-label"><span>DAY MATRIX / AUTHORED CURRICULUM</span><b>{String(visibleDay).padStart(3, "0")} / 180</b></div>
          <div className="foundry-days" aria-hidden="true">
            {dayCells.map((cell) => {
              const represented = compact ? cell * 2 : cell;
              const state = represented === visibleDay ? "current" : represented < visibleDay ? "passed" : "";
              return <i key={cell} className={state} />;
            })}
          </div>
          <label className="foundry-day-control">
            <span>INSPECT DAY SIGNAL</span>
            <input type="range" min="1" max={compact ? 90 : 180} value={day} onChange={(event) => setDay(Number(event.target.value))} />
          </label>
        </section>

        <section className="foundry-phase-clusters">
          <div className="foundry-label"><span>PHASE CLUSTERS</span><b>06 TOTAL</b></div>
          <div className="phase-cluster-grid">
            {Array.from({ length: 6 }, (_, index) => index + 1).map((item) => (
              <button key={item} onClick={() => setPhase(item)} className={phase === item ? "active" : ""} data-cursor="signal">
                <span>PHASE</span><b>{String(item).padStart(2, "0")}</b><i />
              </button>
            ))}
          </div>
          <p>Phase selection exposes the structure without pretending future proof already exists. The curriculum is authored; progression is gated by work.</p>
        </section>
      </div>

      <div className="foundry-flow">
        <div className="foundry-label"><span>MASTERY LOOP / SYSTEM CONTRACT</span><b>PROBEABLE</b></div>
        <div className="foundry-flow-track">
          {flow.map((item, index) => (
            <motion.div
              key={item}
              className={index === 3 ? "gate" : ""}
              animate={pulse ? { boxShadow: ["0 0 0 rgba(255,185,90,0)", "0 0 32px rgba(255,185,90,.26)", "0 0 0 rgba(255,185,90,0)"] } : undefined}
              transition={{ duration: .8, delay: index * .055 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b>{index < flow.length - 1 && <i>→</i>}
            </motion.div>
          ))}
        </div>
        <div className="foundry-gate-row">
          <div><span>SELECTED PHASE</span><b>{String(phase).padStart(2, "0")}</b></div>
          <div><span>DAY SIGNAL</span><b>{String(visibleDay).padStart(3, "0")}</b></div>
          <div><span>PROGRESSION RULE</span><b>PROVE → ADVANCE</b></div>
          <button onClick={runGate} data-cursor="signal">PROBE MASTERY GATE ↗</button>
        </div>
      </div>
    </div>
  );
}
