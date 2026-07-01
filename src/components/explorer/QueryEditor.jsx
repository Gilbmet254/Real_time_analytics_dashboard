import React, { useState, useRef } from "react";
import { Play, Loader2, CheckCircle2, XCircle, Clock, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const EXAMPLE_QUERIES = [
  `SELECT region, count(*) AS views, count(DISTINCT user_id) AS unique_users
FROM user_clickstream
WHERE timestamp > now() - interval '1h'
GROUP BY region
ORDER BY views DESC`,
  `SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
       percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99
FROM api_access_logs
WHERE timestamp > now() - interval '6h'`,
  `SELECT date_trunc('minute', timestamp) AS minute,
       sum(amount) AS volume,
       count(*) AS tx_count
FROM payment_events
WHERE status = 'completed'
GROUP BY minute ORDER BY minute DESC LIMIT 30`,
  `SELECT device_id, avg(temperature) AS avg_temp, max(temperature) AS max_temp
FROM iot_telemetry
WHERE temperature > 70
GROUP BY device_id
HAVING max(temperature) > 85
ORDER BY max_temp DESC`,
];

function simulateResult(sql) {
  const lower = sql.toLowerCase();
  const latency = lower.includes("percentile") ? Math.floor(Math.random() * 80 + 40)
    : lower.includes("join") ? Math.floor(Math.random() * 200 + 80)
    : Math.floor(Math.random() * 50 + 5);
  const rowsScanned = Math.floor(Math.random() * 40000000 + 500000);
  const rowsReturned = Math.floor(Math.random() * 200 + 2);
  const cacheHit = Math.random() > 0.6;
  const success = Math.random() > 0.08;

  const columns = lower.includes("region") ? ["region", "views", "unique_users"]
    : lower.includes("p95") ? ["p95", "p99"]
    : lower.includes("minute") ? ["minute", "volume", "tx_count"]
    : lower.includes("device") ? ["device_id", "avg_temp", "max_temp"]
    : ["col_1", "col_2", "col_3"];

  const rows = Array.from({ length: Math.min(rowsReturned, 8) }, (_, i) => {
    const row = {};
    columns.forEach((col) => {
      if (col.includes("region")) row[col] = ["us-east", "eu-west", "ap-south", "us-west"][i % 4];
      else if (col.includes("views") || col.includes("count")) row[col] = Math.floor(Math.random() * 500000 + 1000).toLocaleString();
      else if (col.includes("unique")) row[col] = Math.floor(Math.random() * 100000 + 500).toLocaleString();
      else if (col.includes("p9")) row[col] = `${Math.floor(Math.random() * 200 + 20)}ms`;
      else if (col.includes("minute")) row[col] = `2025-01-15 ${String(14 - i).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;
      else if (col.includes("volume")) row[col] = `$${(Math.random() * 50000 + 1000).toFixed(2)}`;
      else if (col.includes("temp")) row[col] = `${(Math.random() * 40 + 60).toFixed(1)}°C`;
      else if (col.includes("device")) row[col] = `dev-${1000 + i * 137}`;
      else row[col] = `val_${Math.floor(Math.random() * 1000)}`;
    });
    return row;
  });

  return { latency, rowsScanned, rowsReturned, cacheHit, success, columns, rows };
}

export default function QueryEditor() {
  const [sql, setSql] = useState(EXAMPLE_QUERIES[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleRun = async () => {
    if (!sql.trim()) return;
    setRunning(true);
    setResult(null);
    setProgress(0);

    const res = simulateResult(sql);
    const steps = [10, 25, 45, 70, 88, 100];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, res.latency * 0.12));
      setProgress(step);
    }

    setResult(res);
    setRunning(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">Query Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-secondary border border-border rounded text-xs px-2 py-1 text-muted-foreground focus:outline-none"
            onChange={(e) => setSql(EXAMPLE_QUERIES[Number(e.target.value)])}
          >
            <option value={0}>Clickstream regions</option>
            <option value={1}>API latency percentiles</option>
            <option value={2}>Payment volume by minute</option>
            <option value={3}>IoT high-temp devices</option>
          </select>
        </div>
      </div>

      <div className="p-4">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          className="w-full h-36 bg-[hsl(220,20%,5%)] border border-border rounded-lg px-4 py-3 font-mono text-xs text-cyan-200/80 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/40 leading-relaxed"
          spellCheck={false}
        />

        <div className="flex items-center gap-3 mt-3">
          <Button
            onClick={handleRun}
            disabled={running || !sql.trim()}
            className="h-8 px-4 text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-1.5"
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {running ? "Executing..." : "Run Query"}
          </Button>
          {running && (
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="px-5 py-3 flex items-center gap-4 bg-secondary/30 text-xs flex-wrap">
              {result.success ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Query completed
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-400 font-medium">
                  <XCircle className="w-3.5 h-3.5" /> Query failed
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" /> {result.latency}ms
              </span>
              <span className="text-muted-foreground">{result.rowsScanned.toLocaleString()} rows scanned</span>
              <span className="text-muted-foreground">{result.rowsReturned.toLocaleString()} returned</span>
              {result.cacheHit && (
                <span className="flex items-center gap-1 text-cyan-400 font-medium">
                  <Zap className="w-3 h-3" /> Cache hit
                </span>
              )}
            </div>

            {result.success && result.rows.length > 0 && (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      {result.columns.map((col) => (
                        <th key={col} className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-secondary/20"} hover:bg-secondary/40`}>
                        {result.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-cyan-200/70 whitespace-nowrap">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!result.success && (
              <div className="px-5 py-3 text-xs text-red-400 font-mono">
                ERROR: Execution failed — schema mismatch or timeout. Check stream availability.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}