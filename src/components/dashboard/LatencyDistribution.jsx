import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const data = [
  { bucket: "<5ms", count: 1240, color: "#06b6d4" },
  { bucket: "5-10ms", count: 2180, color: "#06b6d4" },
  { bucket: "10-25ms", count: 3420, color: "#22c55e" },
  { bucket: "25-50ms", count: 1890, color: "#22c55e" },
  { bucket: "50-100ms", count: 620, color: "#f59e0b" },
  { bucket: "100-250ms", count: 180, color: "#f59e0b" },
  { bucket: "250-500ms", count: 42, color: "#ef4444" },
  { bucket: ">500ms", count: 8, color: "#ef4444" },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{payload[0].payload.bucket}</p>
      <p className="text-sm font-mono font-semibold">{payload[0].value.toLocaleString()} queries</p>
    </div>
  );
};

export default function LatencyDistribution() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Query Latency Distribution</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Last 24h — P50: 18ms / P99: 156ms</p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,12%)" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fill: "hsl(215,15%,50%)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215,15%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}