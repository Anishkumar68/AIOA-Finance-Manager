import { useMemo } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function LineChart({
  series,
  lines,
  height = 120,
}: {
  series: { x: string; [k: string]: number | string }[];
  lines: { key: string; label: string; colorClass: string }[];
  height?: number;
}) {
  const width = 640;
  const padding = 8;

  const keys = lines.map((l) => l.key);
  const values = useMemo(() => {
    const all: number[] = [];
    for (const p of series) for (const k of keys) all.push(Number(p[k] ?? 0));
    return all.filter((v) => Number.isFinite(v));
  }, [series, keys.join(",")]);

  const minV = values.length ? Math.min(...values) : 0;
  const maxV = values.length ? Math.max(...values) : 1;
  const span = maxV - minV || 1;

  function xFor(i: number) {
    if (series.length <= 1) return padding;
    return padding + (i / (series.length - 1)) * (width - padding * 2);
  }
  function yFor(v: number) {
    const t = (v - minV) / span;
    return padding + (1 - clamp(t, 0, 1)) * (height - padding * 2);
  }

  function pathForKey(key: string) {
    let d = "";
    series.forEach((p, i) => {
      const v = Number(p[key] ?? 0);
      const x = xFor(i);
      const y = yFor(v);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return d;
  }

  const lastLabel = series.length ? String(series[series.length - 1].x) : "";

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[120px] w-full">
        <path d={`M ${padding} ${height - padding} L ${width - padding} ${height - padding}`} className="stroke-surface-border" strokeWidth="1" fill="none" />
        {lines.map((l) => (
          <path key={l.key} d={pathForKey(l.key)} className={l.colorClass} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      {lastLabel ? <div className="mt-1 text-[11px] text-text-faint">Latest: {lastLabel}</div> : null}
    </div>
  );
}

export function DonutChart({
  items,
  size = 140,
}: {
  items: { label: string; value: number }[];
  size?: number;
}) {
  const total = items.reduce((s, it) => s + (Number.isFinite(it.value) ? it.value : 0), 0);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const palette = [
    "stroke-brand",
    "stroke-brand-muted",
    "stroke-emerald-400/70",
    "stroke-amber-300/70",
    "stroke-sky-400/70",
    "stroke-fuchsia-400/70",
    "stroke-rose-400/70",
    "stroke-lime-300/70",
  ];

  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-surface-border" strokeWidth={stroke} fill="none" />
        {items
          .filter((x) => x.value > 0)
          .slice(0, palette.length)
          .map((it, idx) => {
            const frac = total > 0 ? it.value / total : 0;
            const dash = frac * c;
            const el = (
              <circle
                key={it.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                className={palette[idx]}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += dash;
            return el;
          })}
        <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} className="fill-surface-card" />
        <text x="50%" y="48%" textAnchor="middle" className="fill-text-primary" fontSize="14" fontWeight="600">
          {total.toFixed(0)}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-text-faint" fontSize="10">
          total
        </text>
      </svg>

      <div className="min-w-[200px] flex-1 space-y-1.5 text-sm">
        {items
          .filter((x) => x.value > 0)
          .slice(0, palette.length)
          .map((it, idx) => {
            const pct = total > 0 ? (it.value / total) * 100 : 0;
            return (
              <div key={it.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 rounded-full ${palette[idx].replace("stroke-", "bg-")}`} />
                  <span className="truncate text-text-secondary">{it.label}</span>
                </div>
                <div className="tabular-nums text-text-muted">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export function BarList({ items }: { items: { label: string; value: number; right?: string }[] }) {
  const maxV = Math.max(1, ...items.map((x) => (Number.isFinite(x.value) ? x.value : 0)));
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const pct = clamp((it.value / maxV) * 100, 0, 100);
        return (
          <div key={it.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="truncate text-text-secondary">{it.label}</div>
              <div className="shrink-0 tabular-nums text-text-muted">{it.right ?? it.value.toFixed(0)}</div>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5">
              <div className="h-2 rounded-full bg-white/20" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

