import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause, Play, Bell, BellOff, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { base44 } from "@/api/base44Client";
import { useAnimatedValue } from "@/components/dashboard/AnimatedCounter";

function generateHistory(base, points = 30) {
  const arr = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v = Math.max(0, v + (Math.random() - 0.48) * v * 0.18);
    arr.push({ t: i, v: Math.round(v) });
  }
  return arr;
}

const MetricRow = ({ label, value, unit, highlight }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/50">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-sm font-semibold ${highlight || ""}`}>
      {value}<span className="text-muted-foreground text-xs font-normal ml-1">{unit}</span>
    </span>
  </div>
);

export default function StreamDetailDrawer({ stream, onClose, onUpdate }) {
  const [paused, setPaused] = useState(stream.status === "paused");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [threshold, setThreshold] = useState(stream.avg_latency_ms * 3 || 150);
  const [history, setHistory] = useState(() => generateHistory(stream.events_per_minute));
  const [liveRate, setLiveRate] = useState(stream.events_per_minute);
  const animatedRate = useAnimatedValue(liveRate);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setLiveRate((prev) => {
        const next = Math.max(0, prev + (Math.random() - 0.47) * prev * 0.12);
        setHistory((h) => [...h.slice(1), { t: h[h.length - 1].t + 1, v: Math.round(next) }]);
        return Math.round(next);
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [paused]);

  const handleTogglePause = async () => {
    const newStatus = paused ? "active" : "paused";
    await base44.entities.EventStream.update(stream.id, { status: newStatus });
    setPaused(!paused);
    onUpdate && onUpdate(stream.id, { status: newStatus });
  };

  const formatRate = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const trend = ((liveRate - stream.events_per_minute) / (stream.events_per_minute || 1)) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 h-screen w-full max-w-sm bg-card border-l border-border z-50 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-mono text-sm font-semibold">{stream.stream_name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{stream.source}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-secondary/40 border border-border p-4 text-center">
              <div className="text-2xl font-bold font-mono">{formatRate(animatedRate)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">events/min</div>
              <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleTogglePause}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  paused
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-400"
                }`}
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={() => setAlertEnabled((a) => !a)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  alertEnabled
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-400"
                    : "border-border text-muted-foreground"
                }`}
              >
                {alertEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                Alerts {alertEnabled ? "On" : "Off"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
              Live Rate History
            </h3>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="drawerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={["auto", "auto"]} hide />
                  <XAxis hide />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-card border border-border rounded px-2 py-1 text-xs font-mono">
                          {(payload[0].value / 1000).toFixed(1)}K/min
                        </div>
                      ) : null
                    }
                  />
                  <Area type="monotone" dataKey="v" stroke={paused ? "#f59e0b" : "#06b6d4"} strokeWidth={1.5} fill="url(#drawerGrad)" dot={false} animationDuration={300} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-2">Metrics</h3>
            <MetricRow label="Schema" value={stream.schema_type.toUpperCase()} />
            <MetricRow label="Avg Latency" value={stream.avg_latency_ms} unit="ms" highlight={stream.avg_latency_ms > 100 ? "text-red-400" : "text-emerald-400"} />
            <MetricRow label="Error Rate" value={stream.error_rate} unit="%" highlight={stream.error_rate > 1 ? "text-red-400" : ""} />
            <MetricRow label="Total Events" value={(stream.total_events / 1000000).toFixed(1)} unit="M" />
          </div>

          {alertEnabled && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <h3 className="text-xs font-semibold text-cyan-400 mb-3">Latency Alert Threshold</h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={500}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 accent-cyan-500"
                />
                <span className="font-mono text-sm font-semibold w-16 text-right">{threshold}ms</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Alert triggers when avg latency exceeds this value
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}