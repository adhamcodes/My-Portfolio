import type { PulseDomain, PulseSignal, PulseSnapshot } from "@/core/contracts";

const lanes: Array<{ domain: PulseDomain; label: string; y: number }> = [
  { domain: "learning", label: "LEARNING", y: 58 },
  { domain: "work", label: "WORK", y: 116 },
  { domain: "career", label: "CAREER", y: 174 },
  { domain: "code", label: "CODE", y: 232 },
];

type PulseCluster = {
  id: string;
  domain: PulseDomain;
  occurredAt: string;
  intensity: number;
  count: number;
  label?: string;
};

function domainY(domain: PulseDomain) {
  return lanes.find((lane) => lane.domain === domain)?.y ?? 116;
}

function dayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function clusterSignals(signals: PulseSignal[]): PulseCluster[] {
  const grouped = new Map<string, PulseSignal[]>();
  for (const signal of signals) {
    const key = `${dayKey(signal.occurredAt)}:${signal.domain}:${signal.sourceId ?? "general"}`;
    grouped.set(key, [...(grouped.get(key) ?? []), signal]);
  }

  return Array.from(grouped.entries())
    .map(([id, group]) => {
      const ordered = [...group].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
      const last = ordered[ordered.length - 1];
      return {
        id,
        domain: last.domain,
        occurredAt: last.occurredAt,
        intensity: Math.max(...ordered.map((signal) => signal.intensity)),
        count: ordered.length,
        label: [...ordered].reverse().find((signal) => signal.label)?.label,
      };
    })
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export default function PulseField({ pulse }: { pulse: PulseSnapshot }) {
  const clusters = clusterSignals(pulse.signals);

  if (clusters.length === 0) {
    return (
      <div className="pulse-zero" data-has-signals="false">
        <span className="pulse-zero-axis" aria-hidden="true"><i /></span>
        <div>
          <p>PULSE / TIME</p>
          <span>The record is quiet here. Real learning, work, and career events will leave marks when they happen.</span>
        </div>
      </div>
    );
  }

  const visible = clusters.slice(-18);
  const timestamps = visible.map((signal) => new Date(signal.occurredAt).getTime()).filter(Number.isFinite);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const range = Math.max(1, maxTime - minTime);
  const left = 142;
  const right = 960;

  return (
    <div className="pulse-live">
      <div className="pulse-live-copy">
        <p>PULSE / TIME</p>
        <span>Activity becomes a trace of time, not a score. Repeated code events from the same source and day collapse into one mark; learning, work, and career remain separate evidence.</span>
      </div>

      <svg
        className="pulse-field"
        viewBox="0 0 1000 276"
        role="img"
        aria-labelledby="pulse-field-title pulse-field-description"
      >
        <title id="pulse-field-title">Curated public activity over time</title>
        <desc id="pulse-field-description">Public events are grouped by day, domain, and source so repeated technical activity does not masquerade as repeated achievement.</desc>

        <line className="pulse-time-axis" x1={left} y1="250" x2={right} y2="250" />
        {lanes.map((lane) => (
          <g key={lane.domain} className={`pulse-lane pulse-lane-${lane.domain}`}>
            <text x="8" y={lane.y + 4}>{lane.label}</text>
            <line x1={left} y1={lane.y} x2={right} y2={lane.y} />
          </g>
        ))}

        {visible.map((signal) => {
          const time = new Date(signal.occurredAt).getTime();
          const normalized = Number.isFinite(time) ? (time - minTime) / range : 1;
          const x = left + normalized * (right - left);
          const y = domainY(signal.domain);
          const radius = 2.7 + signal.intensity * 3.2 + Math.min(2.2, Math.log2(signal.count + 1) * .65);
          return (
            <g key={signal.id} className={`pulse-cluster pulse-cluster-${signal.domain}`}>
              <line x1={x} y1={y + 10} x2={x} y2="250" />
              <circle className="pulse-cluster-halo" cx={x} cy={y} r={radius * 2.6} />
              <circle className="pulse-cluster-core" cx={x} cy={y} r={radius} />
            </g>
          );
        })}

        <text className="pulse-time-label" x={left} y="271">{dateLabel(visible[0]?.occurredAt ?? pulse.generatedAt)}</text>
        <text className="pulse-time-label pulse-time-label-end" x={right} y="271">PRESENT</text>
      </svg>

      <ul className="pulse-accessible">
        {visible.slice(-8).reverse().map((signal) => (
          <li key={signal.id}>
            {dateLabel(signal.occurredAt)} — {signal.domain} — {signal.count} public event{signal.count === 1 ? "" : "s"}{signal.label ? ` — ${signal.label}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
