import React, { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function generateDataPoint(index, prev) {
  const base = prev ? prev.value : 2800000;
  const variation = (Math.random() - 0.48) * 200000;
  const value = Math.max(1500000, Math.min(4000000, base + variation));
  const sec = index % 60;
  return {
    time: `${String(Math.floor(index / 60) % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
    value: Math.round(value),
  };
}

function generateInitial() {
  const points = [];
  for (let i = 0; i < 40; i++) {
    points.push(generateDataPoint(i, points[i - 1]));
  }
  return points;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{payload[0].payload.time}</p>
      <p className="text-sm font-mono font-semibold text-cyan-400">
        {(payload[0].value / 1000000).toFixed(2)}M <span className="text-muted-foreground font-normal">events/min</span>
      </p>
    </div>
  );
};

export default function LiveChart() {
  const [data, setData] = useState(generateInitial);
  const counterRef = useRef(40);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newPoint = generateDataPoint(counterRef.current, prev[prev.length - 1]);
        counterRef.current += 1;
        return [...prev.slice(1), newPoint];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Ingestion Rate</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Live events per minute across all streams</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">LIVE</span>
        </div>
      </div>
      <div className="h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ingestionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,12%)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "hsl(215,15%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} interval={7} />
            <YAxis tick={{ fill: "hsl(215,15%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} domain={["auto", "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fill="url(#ingestionGrad)" dot={false} animationDuration={300} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}