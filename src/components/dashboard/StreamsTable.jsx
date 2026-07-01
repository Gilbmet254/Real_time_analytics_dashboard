import React from "react";

const statusConfig = {
  active: { label: "Active", color: "bg-emerald-400", textColor: "text-emerald-400" },
  paused: { label: "Paused", color: "bg-amber-400", textColor: "text-amber-400" },
  error: { label: "Error", color: "bg-red-400", textColor: "text-red-400" },
  initializing: { label: "Init", color: "bg-blue-400", textColor: "text-blue-400" },
};

function formatNumber(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function StreamsTable({ streams }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">Active Streams</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{streams.length} pipelines registered</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Stream</th>
              <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Events/min</th>
              <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Total</th>
              <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Latency</th>
              <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Errors</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((stream) => {
              const st = statusConfig[stream.status] || statusConfig.active;
              return (
                <tr key={stream.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-sm font-medium">{stream.stream_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{stream.source} · {stream.schema_type}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${st.color}`} />
                      <span className={`text-xs font-medium ${st.textColor}`}>{st.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-sm">{formatNumber(stream.events_per_minute)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-sm hidden md:table-cell">{formatNumber(stream.total_events)}</td>
                  <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                    <span className={`font-mono text-sm ${stream.avg_latency_ms > 100 ? "text-red-400" : stream.avg_latency_ms > 50 ? "text-amber-400" : "text-emerald-400"}`}>
                      {stream.avg_latency_ms}ms
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                    <span className={`font-mono text-sm ${stream.error_rate > 1 ? "text-red-400" : stream.error_rate > 0.05 ? "text-amber-400" : "text-muted-foreground"}`}>
                      {stream.error_rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}