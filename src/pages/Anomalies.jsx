import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle2, Eye, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";

const severityConfig = {
  critical: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", dot: "bg-red-400", label: "Critical" },
  high: { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", dot: "bg-orange-400", label: "High" },
  medium: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400", label: "Medium" },
  low: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", dot: "bg-blue-400", label: "Low" },
};

const statusConfig = {
  active: { icon: AlertTriangle, color: "text-red-400", label: "Active" },
  acknowledged: { icon: Eye, color: "text-amber-400", label: "Acknowledged" },
  resolved: { icon: CheckCircle2, color: "text-emerald-400", label: "Resolved" },
  dismissed: { icon: X, color: "text-muted-foreground", label: "Dismissed" },
};

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.entities.Anomaly.list("-created_date").then((a) => {
      setAnomalies(a);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    await base44.entities.Anomaly.update(id, { status: newStatus });
    setAnomalies((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = filter === "all" ? anomalies : anomalies.filter((a) => a.status === filter);
  const activeCritical = anomalies.filter((a) => a.status === "active" && a.severity === "critical").length;
  const activeHigh = anomalies.filter((a) => a.status === "active" && a.severity === "high").length;

  return (
    <div className="p-4 lg:p-8 max-w-[1440px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Anomaly Detection</h1>
          <p className="text-sm text-muted-foreground mt-1">Automated detection and alerting</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCritical > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-400/10 border border-red-400/20">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-medium text-red-400">{activeCritical} Critical</span>
            </div>
          )}
          {activeHigh > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-400/10 border border-orange-400/20">
              <span className="text-xs font-medium text-orange-400">{activeHigh} High</span>
            </div>
          )}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 h-9 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium">No anomalies found</p>
            <p className="text-xs text-muted-foreground mt-1">All systems operating within normal parameters</p>
          </div>
        )}
        {filtered.map((anomaly) => {
          const sev = severityConfig[anomaly.severity] || severityConfig.medium;
          const stat = statusConfig[anomaly.status] || statusConfig.active;
          const StatIcon = stat.icon;
          const deviation = anomaly.expected_value
            ? Math.round(((anomaly.actual_value - anomaly.expected_value) / anomaly.expected_value) * 100)
            : null;

          return (
            <div key={anomaly.id} className={`rounded-xl border ${sev.bg} p-5 transition-all hover:border-opacity-50`}>
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-2 h-2 rounded-full ${sev.dot} ${anomaly.status === "active" ? "animate-pulse" : ""}`} />
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${sev.color}`}>{sev.label}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{anomaly.stream_name}</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{anomaly.title}</h3>
                  {anomaly.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{anomaly.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {moment(anomaly.detected_at || anomaly.created_date).fromNow()}
                    </div>
                    {deviation !== null && (
                      <div className="text-xs font-mono">
                        <span className="text-muted-foreground">Deviation: </span>
                        <span className={deviation > 0 ? "text-red-400" : "text-amber-400"}>
                          {deviation > 0 ? "+" : ""}{deviation}%
                        </span>
                      </div>
                    )}
                    <div className="text-xs font-mono">
                      <span className="text-muted-foreground">Metric: </span>
                      <span>{anomaly.metric_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${stat.color}`}>
                    <StatIcon className="w-3 h-3" />
                    <span className="text-xs font-medium">{stat.label}</span>
                  </div>
                  {anomaly.status === "active" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-border" onClick={() => handleStatusChange(anomaly.id, "acknowledged")}>
                      Acknowledge
                    </Button>
                  )}
                  {(anomaly.status === "active" || anomaly.status === "acknowledged") && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-border" onClick={() => handleStatusChange(anomaly.id, "resolved")}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}