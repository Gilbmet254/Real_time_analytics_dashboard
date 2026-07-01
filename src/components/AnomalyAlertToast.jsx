import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const SEVERITY_STYLES = {
  critical: { border: "border-red-500/50", bg: "bg-red-500/10", icon: "text-red-400", dot: "bg-red-400" },
  high: { border: "border-orange-500/50", bg: "bg-orange-500/10", icon: "text-orange-400", dot: "bg-orange-400" },
  medium: { border: "border-amber-500/50", bg: "bg-amber-500/10", icon: "text-amber-400", dot: "bg-amber-400" },
  low: { border: "border-blue-500/50", bg: "bg-blue-500/10", icon: "text-blue-400", dot: "bg-blue-400" },
};

const SIMULATED_ANOMALIES = [
  { id: "s1", title: "Ingestion spike detected", stream: "user-clickstream", severity: "critical" },
  { id: "s2", title: "API latency SLA breach", stream: "api-access-logs", severity: "high" },
  { id: "s3", title: "Schema validation errors", stream: "iot-telemetry", severity: "medium" },
  { id: "s4", title: "Payment throughput dip", stream: "payment-events", severity: "high" },
  { id: "s5", title: "Session duplicate events", stream: "session-tracking", severity: "low" },
];

export default function AnomalyAlertToast() {
  const [alerts, setAlerts] = useState([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.35) return;
      const template = SIMULATED_ANOMALIES[counterRef.current % SIMULATED_ANOMALIES.length];
      counterRef.current++;
      const alert = { ...template, uid: `${Date.now()}-${Math.random()}` };
      setAlerts((prev) => [alert, ...prev].slice(0, 3));
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.uid !== alert.uid));
      }, 6000);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = (uid) => setAlerts((prev) => prev.filter((a) => a.uid !== uid));

  return (
    <div className="fixed bottom-5 right-5 z-[100] space-y-2 pointer-events-none w-80">
      <AnimatePresence>
        {alerts.map((alert) => {
          const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
          return (
            <motion.div
              key={alert.uid}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className={`pointer-events-auto rounded-xl border ${s.border} ${s.bg} backdrop-blur-sm p-4 shadow-2xl`}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <AlertTriangle className={`w-3 h-3 ${s.icon}`} />
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${s.icon}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs font-semibold truncate">{alert.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{alert.stream}</p>
                </div>
                <button
                  onClick={() => dismiss(alert.uid)}
                  className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}