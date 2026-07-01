import React from "react";

export default function StatCard({ label, value, unit, icon: Icon, trend, trendLabel, glowClass, accentColor }) {
  const isPositive = trend >= 0;
  return (
    <div className={`relative rounded-xl border border-border bg-card p-5 overflow-hidden ${glowClass || ""}`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10" style={{ background: accentColor || "#06b6d4" }} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight font-mono">{value}</span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
      {trendLabel && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{trend}%
          </span>
          <span className="text-xs text-muted-foreground">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}