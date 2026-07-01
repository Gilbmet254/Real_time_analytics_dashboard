import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, Loader2, CheckCircle2, Pause } from "lucide-react";
import StreamDetailDrawer from "@/components/pipeline/StreamDetailDrawer";

const statusIcons = {
  active: CheckCircle2,
  paused: Pause,
  error: AlertCircle,
  initializing: Loader2,
};
const statusColors = {
  active: "text-emerald-400",
  paused: "text-amber-400",
  error: "text-red-400",
  initializing: "text-blue-400",
};
const statusBg = {
  active: "bg-emerald-400/10 border-emerald-400/20",
  paused: "bg-amber-400/10 border-amber-400/20",
  error: "bg-red-400/10 border-red-400/20",
  initializing: "bg-blue-400/10 border-blue-400/20",
};

function generateStreamHistory(base) {
  const points = [];
  for (let i = 0; i < 20; i++) {
    const variation = (Math.random() - 0.45) * base * 0.3;
    points.push({ t: i, v: Math.max(0, Math.round(base + variation)) });
  }
  return points;
}

function formatNumber(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

const MiniTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded px-2 py-1 shadow-xl">
      <p className="text-xs font-mono">{formatNumber(payload[0].value)}</p>
    </div>
  );
};

function StreamCard({ stream, onClick }) {
  const Icon = statusIcons[stream.status] || CheckCircle2;
  const color = statusColors[stream.status] || "text-muted-foreground";
  const bg = statusBg[stream.status] || "";
  const chartColor = stream.status === "error" ? "#ef4444" : stream.status === "paused" ? "#f59e0b" : "#06b6d4";
  const history = useRef(generateStreamHistory(stream.events_per_minute)).current;
  const [liveHistory, setLiveHistory] = useState(history);

  useEffect(() => {
    if (stream.status !== "active") return;
    const interval = setInterval(() => {
      setLiveHistory((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(0, last.v + (Math.random() - 0.47) * last.v * 0.12);
        return [...prev.slice(1), { t: last.t + 1, v: Math.round(next) }];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [stream.status]);

  return (
    <div
      className={`rounded-xl border ${bg} p-5 cursor-pointer hover:brightness-110 transition-all`}
      onClick={() => onClick(stream)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-mono text-sm font-semibold">{stream.stream_name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{stream.source} · {stream.schema_type.toUpperCase()}</p>
        </div>
        <div className={`flex items-center gap-1.5 ${color}`}>
          <Icon className={`w-3.5 h-3.5 ${stream.status === "initializing" ? "animate-spin" : ""}`} />
          <span className="text-xs font-medium capitalize">{stream.status}</span>
        </div>
      </div>

      <div className="h-20 mb-4 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={liveHistory}>
            <defs>
              <linearGradient id={`grad-${stream.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<MiniTooltip />} />
            <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} fill={`url(#grad-${stream.id})`} dot={false} animationDuration={400} isAnimationActive />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Rate</p>
          <p className="font-mono text-sm font-semibold">{formatNumber(stream.events_per_minute)}/m</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Latency</p>
          <p className={`font-mono text-sm font-semibold ${stream.avg_latency_ms > 100 ? "text-red-400" : stream.avg_latency_ms > 50 ? "text-amber-400" : ""}`}>
            {stream.avg_latency_ms}ms
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Errors</p>
          <p className={`font-mono text-sm font-semibold ${stream.error_rate > 1 ? "text-red-400" : ""}`}>{stream.error_rate}%</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-right">Click to inspect →</p>
    </div>
  );
}

export default function Pipeline() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.EventStream.list().then((s) => {
      setStreams(s);
      setLoading(false);
    });
  }, []);

  const handleUpdate = (id, changes) => {
    setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)));
    setSelected((prev) => prev?.id === id ? { ...prev, ...changes } : prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const active = streams.filter((s) => s.status === "active").length;
  const errored = streams.filter((s) => s.status === "error").length;
  const paused = streams.filter((s) => s.status === "paused").length;

  return (
    <div className="p-4 lg:p-8 max-w-[1440px]">
      <div className="mb-8">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Pipeline Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">Click any stream to inspect and control it</p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">{active} Active</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-400/20 bg-red-400/10">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs font-medium text-red-400">{errored} Error</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/10">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-400">{paused} Paused</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {streams.map((stream) => (
          <StreamCard key={stream.id} stream={stream} onClick={setSelected} />
        ))}
      </div>

      {selected && (
        <StreamDetailDrawer
          stream={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}