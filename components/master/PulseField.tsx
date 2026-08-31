import type { PulseDomain, PulseSnapshot } from "@/core/contracts";

const lanes: Array<{ domain: PulseDomain; label: string; y: number }> = [
  { domain: "code", label: "CODE", y: 52 },
  { domain: "learning", label: "LEARNING", y: 102 },
  { domain: "work", label: "WORK", y: 152 },
  { domain: "career", label: "CAREER", y: 202 },
];

function hashOffset(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0;
  return ((Math.abs(hash) % 17) - 8) * 0.72;
}

function domainY(domain: PulseDomain) {
  return lanes.find((lane) => lane.domain === domain)?.y ?? 102;
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function PulseField({ pulse }: { pulse: PulseSnapshot }) {
  if (pulse.signals.length === 0) {
    return (
      <div className="pulse-zero" data-has-signals="false">
        <div className="pulse-zero-line" aria-hidden="true" />
        <div>
          <p>PULSE</p>
          <span>No public activity events are being projected yet. The field begins when real events exist.</span>
        </div>
      </div>
    );
  }

  const timestamps = pulse.signals.map((signal) => new Date(signal.occurredAt).getTime()).filter(Number.isFinite);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const range = Math.max(1, maxTime - minTime);
  const left = 120;
  const right = 970;

  return (
    <div className="pulse-live">
      <div className="pulse-live-copy">
        <p>PULSE</p>
        <span>Real public activity can move this field. Code, learning, work, and career remain different kinds of evidence.</span>
      </div>

      <svg
        className="pulse-field"
        viewBox="0 0 1000 236"
        role="img"
        aria-labelledby="pulse-field-title pulse-field-description"
      >
        <title id="pulse-field-title">Recent public activity over time</title>
        <desc id="pulse-field-description">Activity is separated into code, learning, work, and career lanes. Marker size is visual emphasis, not a skill or productivity score.</desc>

        {lanes.map((lane) => (
          <g key={lane.domain} className={`pulse-lane pulse-lane-${lane.domain}`}>
            <text x="8" y={lane.y + 4}>{lane.label}</text>
            <line x1={left} y1={lane.y} x2={right} y2={lane.y} />
          </g>
        ))}

        {pulse.signals.map((signal) => {
          const time = new Date(signal.occurredAt).getTime();
          const normalized = Number.isFinite(time) ? (time - minTime) / range : 1;
          const x = left + normalized * (right - left);
          const baseY = domainY(signal.domain);
          const y = baseY + hashOffset(signal.id);
          const radius = 2.2 + signal.intensity * 3.8;

          return (
            <g key={signal.id} className={`pulse-signal pulse-signal-${signal.domain}`}>
              <line x1={x} y1={baseY} x2={x} y2={y} />
              <circle cx={x} cy={y} r={radius} />
            </g>
          );
        })}

        <text className="pulse-time-label" x={left} y="230">
          {dateLabel(pulse.signals[0]?.occurredAt ?? pulse.generatedAt)}
        </text>
        <text className="pulse-time-label pulse-time-label-end" x={right} y="230">PRESENT</text>
      </svg>

      <ul className="pulse-accessible">
        {pulse.signals.slice(-8).reverse().map((signal) => (
          <li key={signal.id}>
            {dateLabel(signal.occurredAt)} — {signal.domain}{signal.label ? ` — ${signal.label}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
