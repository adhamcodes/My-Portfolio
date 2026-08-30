"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

const flow = ["LESSON", "PRACTICE", "AUTOMATED CHECK", "MASTERY GATE", "SAVE PROGRESS", "NEXT DAY"];

export default function FoundryEngine({ compact = false }: { compact?: boolean }) {
  const [day, setDay] = useState(compact ? 45 : 90);
  const [phase, setPhase] = useState(3);
  const [pulse, setPulse] = useState(0);

  const dayCells = useMemo(() => Array.from({ length: compact ? 90 : 180 }, (_, index) => index + 1), [compact]);
  const visibleDay = compact ? Math.min(180, day * 2) : day;

  const runGate = () => {
    setPulse((value) => value + 1);
    window.dispatchEvent(new CustomEvent("aura:burst"));
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `FOUNDRY180 · MASTERY CHECK PREVIEW · DAY ${String(visibleDay).padStart(3, "0")}` }));
  };

  return (
    <div className={compact ? "foundry-engine foundry-compact" : "foundry-engine"}>
      <div className="foundry-engine-head">
        <div><span>FOUNDRY180 / INTERACTIVE MODEL</span><b>CURRENT BUILD</b></div>
        <div className="foundry-stats">
          <span><b>180</b>DAYS</span>
          <span><b>6</b>PHASES</span>
          <span><b>130</b>EXERCISES</span>
          <span><b>603</b>TESTS</span>
        </div>
      </div>

      <div className="foundry-console">
        <section className="foundry-day-matrix">
          <div className="foundry-label"><span>CURRICULUM MAP</span><b>DAY {String(visibleDay).padStart(3, "0")} / 180</b></div>
          <div className="foundry-days" aria-hidden="true">
            {dayCells.map((cell) => {
              const represented = compact ? cell * 2 : cell;
              return <i key={cell} className={represented === visibleDay ? "current" : represented < visibleDay ? "before" : ""} />;
            })}
          </div>
          <label className="foundry-day-control">
            <span>EXPLORE A DAY</span>
            <input type="range" min="1" max={compact ? 90 : 180} value={day} onChange={(event) => setDay(Number(event.target.value))} />
          </label>
        </section>

        <section className="foundry-phase-clusters">
          <div className="foundry-label"><span>LEARNING PHASES</span><b>06 TOTAL</b></div>
          <div className="phase-cluster-grid">
            {Array.from({ length: 6 }, (_, index) => index + 1).map((item) => (
              <button key={item} onClick={() => setPhase(item)} className={phase === item ? "active" : ""} data-cursor="signal">
                <span>PHASE</span><b>{String(item).padStart(2, "0")}</b><i />
              </button>
            ))}
          </div>
          <p>Six phases raise the difficulty gradually. Advancement is tied to work that can be checked, not simply to opening the next page.</p>
        </section>
      </div>

      <div className="foundry-flow">
        <div className="foundry-label"><span>HOW PROGRESSION WORKS</span><b>PRACTICE → PROVE → ADVANCE</b></div>
        <div className="foundry-flow-track">
          {flow.map((item, index) => (
            <motion.div
              key={item}
              className={index === 3 ? "gate" : ""}
              animate={pulse ? { boxShadow: ["0 0 0 rgba(255,185,90,0)", "0 0 34px rgba(255,185,90,.24)", "0 0 0 rgba(255,185,90,0)"] } : undefined}
              transition={{ duration: .82, delay: index * .05 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b>{index < flow.length - 1 && <i>→</i>}
            </motion.div>
          ))}
        </div>
        <div className="foundry-gate-row">
          <div><span>PHASE</span><b>{String(phase).padStart(2, "0")}</b></div>
          <div><span>SELECTED DAY</span><b>{String(visibleDay).padStart(3, "0")}</b></div>
          <div><span>RULE</span><b>PROVE → ADVANCE</b></div>
          <button onClick={runGate} data-cursor="signal">PREVIEW MASTERY CHECK ↗</button>
        </div>
        <small className="foundry-model-note">Interactive model — not live learner progress.</small>
      </div>
    </div>
  );
}
