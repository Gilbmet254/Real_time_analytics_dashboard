import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Zap, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import moment from "moment";
import QueryEditor from "@/components/explorer/QueryEditor";
import VolumeHeatmap from "@/components/dashboard/VolumeHeatmap";

const statusColors = {
  completed: "text-emerald-400",
  failed: "text-red-400",
  running: "text-blue-400",
  queued: "text-muted-foreground",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{payload[0].payload.name || payload[0].payload.dataset}</p>
      <p className="text-sm font-mono font-semibold">{payload[0].value}</p>
    </div>
  );
};

export default function Explorer() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datasetFilter, setDatasetFilter] = useState("all");

  useEffect(() => {
    base44.entities.QueryLog.list("-created_date").then((q) => {
      setQueries(q);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const datasets = [...new Set(queries.map((q) => q.dataset))];
  const filtered = datasetFilter === "all" ? queries : queries.filter((q) => q.dataset === datasetFilter);

  const completedQueries = queries.filter((q) => q.status === "completed");
  const avgLatency = completedQueries.length
    ? Math.round(completedQueries.reduce((s, q) => s + (q.latency_ms || 0), 0) / completedQueries.length)
    : 0;
  const cacheHitRate = completedQueries.length
    ? Math.round((completedQueries.filter((q) => q.cache_hit).length / completedQueries.length) * 100)
    : 0;
  const totalRowsScanned = queries.reduce((s, q) => s + (q.rows_scanned || 0), 0);

  const latencyByDataset = datasets.map((d) => {
    const dq = completedQueries.filter((q) => q.dataset === d);
    const avg = dq.length ? Math.round(dq.reduce((s, q) => s + (q.latency_ms || 0), 0) / dq.length) : 0;
    return { dataset: d, latency: avg };
  }).sort((a, b) => b.latency - a.latency);

  const cacheData = [
    { name: "Cache Hit", value: completedQueries.filter((q) => q.cache_hit).length, color: "#06b6d4" },
    { name: "Cache Miss", value: completedQueries.filter((q) => !q.cache_hit).length, color: "#1e293b" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[1440px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Analytics Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">Write queries and explore dataset performance</p>
        </div>
        <Select value={datasetFilter} onValueChange={setDatasetFilter}>
          <SelectTrigger className="w-52 h-9 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Datasets</SelectItem>
            {datasets.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interactive query builder */}
      <div className="mb-6">
        <QueryEditor />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Avg Latency</p>
          <p className="text-2xl font-bold font-mono">{avgLatency}<span className="text-xs font-normal text-muted-foreground ml-1">ms</span></p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cache Hit Rate</p>
          <p className="text-2xl font-bold font-mono">{cacheHitRate}<span className="text-xs font-normal text-muted-foreground ml-1">%</span></p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Queries</p>
          <p className="text-2xl font-bold font-mono">{queries.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Rows Scanned</p>
          <p className="text-2xl font-bold font-mono">{totalRowsScanned >= 1000000 ? `${(totalRowsScanned / 1000000).toFixed(0)}M` : totalRowsScanned.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-1">Latency by Dataset</h3>
          <p className="text-xs text-muted-foreground mb-4">Average query latency per dataset (ms)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyByDataset} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,12%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(215,15%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dataset" tick={{ fill: "hsl(215,15%,50%)", fontSize: 9 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="latency" radius={[0, 4, 4, 0]}>
                  {latencyByDataset.map((entry, i) => (
                    <Cell key={i} fill={entry.latency > 100 ? "#ef4444" : entry.latency > 50 ? "#f59e0b" : "#06b6d4"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-1">Cache Performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Hit vs miss ratio</p>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cacheData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {cacheData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-xs text-muted-foreground">Hits ({cacheHitRate}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="text-xs text-muted-foreground">Misses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Heatmap */}
      <div className="mb-6">
        <VolumeHeatmap />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Query History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Recent analytical queries</p>
        </div>
        <div className="divide-y divide-border/50">
          {filtered.map((query) => (
            <div key={query.id} className="px-5 py-4 hover:bg-secondary/20 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono text-cyan-300/80 block truncate">{query.query_text}</code>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{query.dataset}</span>
                    <span className="text-xs text-muted-foreground">{moment(query.executed_at || query.created_date).fromNow()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {query.cache_hit && (
                    <div className="flex items-center gap-1 text-cyan-400">
                      <Zap className="w-3 h-3" />
                      <span className="text-[10px] font-semibold uppercase">Cached</span>
                    </div>
                  )}
                  <div className="text-right">
                    <p className={`font-mono text-sm font-semibold ${query.latency_ms > 100 ? "text-red-400" : query.latency_ms > 50 ? "text-amber-400" : "text-emerald-400"}`}>
                      {query.latency_ms}ms
                    </p>
                    <p className="text-[10px] text-muted-foreground">{(query.rows_scanned || 0).toLocaleString()} rows</p>
                  </div>
                  <div className={`${statusColors[query.status] || "text-muted-foreground"}`}>
                    {query.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}