import React, { useMemo } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateHeatmapData() {
  return DAYS.map((day) =>
    HOURS.map((hour) => {
      const isWeekday = day !== "Sun" && day !== "Sat";
      const isPeakHour = hour >= 9 && hour <= 18;
      const base = isWeekday ? (isPeakHour ? 850 : 320) : (isPeakHour ? 420 : 140);
      return Math.max(0, Math.round(base + (Math.random() - 0.5) * base * 0.6));
    })
  );
}

function getColor(value, max) {
  const pct = value / max;
  if (pct === 0) return "hsl(220,14%,10%)";
  if (pct < 0.2) return "hsl(190,80%,15%)";
  if (pct < 0.4) return "hsl(190,80%,22%)";
  if (pct < 0.6) return "hsl(190,85%,30%)";
  if (pct < 0.8) return "hsl(190,90%,38%)";
  return "hsl(190,95%,50%)";
}

export default function VolumeHeatmap() {
  const data = useMemo(generateHeatmapData, []);
  const max = useMemo(() => Math.max(...data.flat()), [data]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Event Volume Heatmap</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Events/min by day × hour (K)</p>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }}>
          <div className="flex gap-1 mb-1 ml-8">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                {h % 4 === 0 ? `${h}h` : ""}
              </div>
            ))}
          </div>
          {data.map((row, di) => (
            <div key={di} className="flex items-center gap-1 mb-1">
              <div className="w-7 text-[10px] text-muted-foreground text-right shrink-0">{DAYS[di]}</div>
              {row.map((val, hi) => (
                <div
                  key={hi}
                  className="flex-1 rounded-sm cursor-default transition-all hover:ring-1 hover:ring-white/20 group relative"
                  style={{ height: 18, backgroundColor: getColor(val, max) }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-card border border-border rounded text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-lg">
                    {DAYS[di]} {hi}:00 — {(val / 1000).toFixed(1)}K ev/m
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-muted-foreground">Low</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9, 1].map((p) => (
              <div key={p} className="w-5 h-3 rounded-sm" style={{ backgroundColor: getColor(p * max, max) }} />
            ))}
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}