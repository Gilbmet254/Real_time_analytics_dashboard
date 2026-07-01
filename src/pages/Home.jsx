import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Clock, AlertTriangle, Layers } from "lucide-react";
import LiveChart from "@/components/dashboard/LiveChart";
import StreamsTable from "@/components/dashboard/StreamsTable";
import LatencyDistribution from "@/components/dashboard/LatencyDistribution";
import LiveEventFeed from "@/components/dashboard/LiveEventFeed";
import ThroughputGauge from "@/components/dashboard/ThroughputGauge";
import AnimatedCounter, { useAnimatedValue } from "@/components/dashboard/AnimatedCounter";

function StatCard({ label, value, unit, icon: Icon, trend, trendLabel, glowClass, accentColor, animated }) {
  const isPositive = trend >= 0;
  return (
    <div className={`relative rounded-xl border border-border bg-card p-5 overflow-hidden ${glowClass || ""}`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10" style={{ background: accentColor || "#06b6d4" }} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight font-mono">
          {animated ? <AnimatedCounter value={value} format={(v) => {
            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
            if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
            return String(v);
          }} /> : value}
        </span>
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

export default function Home() {
  const [streams, setStreams] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveEPM, setLiveEPM] = useState(0);
  const [liveLatency, setLiveLatency] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [s, a] = await Promise.all([
          base44.entities.EventStream.list(),
          base44.entities.Anomaly.filter({ status: "active" }),
        ]);
        setStreams(s);
        setAnomalies(a);
        const active = s.filter((x) => x.status === "active");
        const epm = active.reduce((sum, x) => sum + (x.events_per_minute || 0), 0);
        const lat = active.length ? Math.round(active.reduce((sum, x) => sum + (x.avg_latency_ms || 0), 0) / active.length) : 0;
        setLiveEPM(epm);
        setLiveLatency(lat);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Simulate live fluctuations
  useEffect(() => {
    if (!liveEPM) return;
    const interval = setInterval(() => {
      setLiveEPM((prev) => Math.max(1000000, Math.round(prev + (Math.random() - 0.47) * prev * 0.04)));
      setLiveLatency((prev) => Math.max(5, Math.round(prev + (Math.random() - 0.5) * 3)));
    }, 3000);
    return () => clearInterval(interval);
  }, [!!liveEPM]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalEvents = streams.reduce((sum, s) => sum + (s.total_events || 0), 0);
  const activeAnomalyCount = anomalies.length;

  return (
    <div className="p-4 lg:p-8 max-w-[1440px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time streaming analytics overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">All Systems Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Throughput" value={liveEPM} unit="events/min" icon={Zap} trend={12.4} trendLabel="vs last hour" glowClass="glow-cyan" accentColor="#06b6d4" animated />
        <StatCard label="Avg Latency" value={`${liveLatency}`} unit="ms" icon={Clock} trend={-8.2} trendLabel="vs last hour" glowClass="glow-green" accentColor="#22c55e" />
        <StatCard label="Total Records" value={totalEvents >= 1000000 ? `${(totalEvents / 1000000).toFixed(0)}M` : totalEvents.toLocaleString()} unit="processed" icon={Layers} trend={3.1} trendLabel="vs yesterday" />
        <StatCard label="Active Anomalies" value={String(activeAnomalyCount)} unit="detected" icon={AlertTriangle} trend={activeAnomalyCount > 2 ? 50 : -25} trendLabel="vs last hour" glowClass={activeAnomalyCount > 0 ? "glow-red" : ""} accentColor="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <LiveChart />
        </div>
        <ThroughputGauge value={liveEPM} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <LiveEventFeed />
        </div>
        <LatencyDistribution />
      </div>

      <StreamsTable streams={streams} />
    </div>
  );
}