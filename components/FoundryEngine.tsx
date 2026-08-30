"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

const flow = ["LESSON", "PRACTICE", "CHECK", "MASTERY GATE", "SAVE", "NEXT DAY"];

export default function FoundryEngine({ compact = false }: { compact?: boolean }) {
  const [day, setDay] = useState(compact ? 45 : 90);
  const [phase, setPhase] = useState(3);
  const [pulse, setPulse] = useState(0);

  const marks = useMemo(() => Array.from({ length: compact ? 36 : 48 }, (_, index) => index), [compact]);
  const visibleDay = compact ? Math.min(180, day * 2) : day;
  const progress = ((visibleDay - 1) / 179) * 100;

  const runGate = () => {
    setPulse((value) => value + 1);
    window.dispatchEvent(new CustomEvent("aura:burst"));
    window.dispatchEvent(new CustomEvent("aura:signal", { detail: `FOUNDRY180 · MASTERY CHECK PREVIEW · DAY ${String(visibleDay).padStart(3, "0")}` }));
  };

  return (
    <div className={compact ? "foundry-engine foundry-compact foundry-editorial" : "foundry-engine foundry-editorial"}>
      <header className="foundry-engine-head">
        <div><span>FOUNDRY180 / INTERACTIVE MODEL</span><b>180 DAYS OF DELIBERATE PRACTICE</b></div>
        <div className="foundry-stats">
          <span><b>180</b>DAYS</span>
          <span><b>6</b>PHASES</span>
          <span><b>130</b>EXERCISES</span>
          <span><b>603</b>TESTS</span>
        </div>
      </header>

      <div className="foundry-atlas">
        <section className="foundry-day-stage">
          <div className="foundry-day-number"><span>SELECTED DAY</span><strong>{String(visibleDay).padStart(3, "0")}</strong><em>/ 180</em></div>
          <div className="foundry-ribbon" aria-hidden="true">
            {marks.map((mark) => <i key={mark} className={(mark / Math.max(marks.length - 1, 1)) * 100 <= progress ? "passed" : ""} />)}
            <motion.b animate={{ left: `${progress}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
          </div>
          <label className="foundry-day-control">
            <span>MOVE THROUGH THE CURRICULUM</span>
            <input type="range" min="1" max={compact ? 90 : 180} value={day} onChange={(event) => setDay(Number(event.target.value))} />
          </label>
          <p className="foundry-day-copy">The model is not a completion meter. It shows the shape of a curriculum where difficulty rises over time and advancement depends on work that can be checked.</p>
        </section>

        <section className="foundry-phase-stage">
          <div className="foundry-label"><span>SIX PHASES</span><b>SELECT ONE</b></div>
          <div className="foundry-phase-rail">
            {Array.from({ length: 6 }, (_, index) => index + 1).map((item) => (
              <button key={item} onClick={() => setPhase(item)} className={phase === item ? "active" : ""} data-cursor="signal">
                <span>0{item}</span><i /><b>PHASE</b>
              </button>
            ))}
          </div>
          <motion.div className="foundry-phase-focus" key={phase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span>PHASE {String(phase).padStart(2, "0")}</span>
            <b>Practice gets harder. Proof stays required.</b>
            <p>Six authored phases provide the larger rhythm; the learner still moves day by day through lessons, exercises, checks, and mastery gates.</p>
          </motion.div>
        </section>
      </div>

      <section className="foundry-loop-stage">
        <div className="foundry-label"><span>THE LEARNING LOOP</span><b>PRACTICE → PROVE → ADVANCE</b></div>
        <div className="foundry-loop-track">
          {flow.map((item, index) => (
            <motion.div
              key={item}
              className={index === 3 ? "gate" : ""}
              animate={pulse ? { y: [0, -4, 0], opacity: [1, .72, 1] } : undefined}
              transition={{ duration: .72, delay: index * .045 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b>{index < flow.length - 1 && <i>→</i>}
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="foundry-gate-row foundry-gate-editorial">
        <div><span>DAY</span><b>{String(visibleDay).padStart(3, "0")}</b></div>
        <div><span>PHASE</span><b>{String(phase).padStart(2, "0")}</b></div>
        <div><span>RULE</span><b>PROVE → ADVANCE</b></div>
        <button onClick={runGate} data-cursor="signal">PREVIEW MASTERY CHECK ↗</button>
        <small className="foundry-model-note">Interactive model — not live learner progress.</small>
      </footer>
    </div>
  );
}
