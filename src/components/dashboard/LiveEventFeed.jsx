import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

const STREAM_NAMES = [
  "user-clickstream",
  "payment-events",
  "iot-telemetry",
  "api-access-logs",
  "session-tracking",
];

const STREAM_COLORS = {
  "user-clickstream": "text-cyan-400",
  "payment-events": "text-emerald-400",
  "iot-telemetry": "text-purple-400",
  "api-access-logs": "text-amber-400",
  "session-tracking": "text-blue-400",
};

const STREAM_ICONS = {
  "user-clickstream": "CLK",
  "payment-events": "PAY",
  "iot-telemetry": "IOT",
  "api-access-logs": "API",
  "session-tracking": "SES",
};

const EVENT_TEMPLATES = {
  "user-clickstream": () => ({
    event: "page_view",
    user_id: `u_${Math.floor(Math.random() * 999999).toString(36)}`,
    page: ["/home", "/product/42", "/checkout", "/search?q=widget", "/dashboard"][Math.floor(Math.random() * 5)],
    region: ["us-east", "eu-west", "ap-south", "us-west"][Math.floor(Math.random() * 4)],
  }),
  "payment-events": () => ({
    event: ["payment.completed", "payment.failed", "refund.initiated"][Math.floor(Math.random() * 3)],
    amount: (Math.random() * 500 + 0.99).toFixed(2),
    currency: ["USD", "EUR", "GBP"][Math.floor(Math.random() * 3)],
    tx_id: `tx_${Date.now().toString(36)}`,
  }),
  "iot-telemetry": () => ({
    device_id: `dev-${Math.floor(Math.random() * 9000 + 1000)}`,
    temp: (Math.random() * 40 + 20).toFixed(1),
    humidity: Math.floor(Math.random() * 60 + 30),
    status: Math.random() > 0.95 ? "alert" : "ok",
  }),
  "api-access-logs": () => ({
    method: ["GET", "POST", "PUT", "DELETE"][Math.floor(Math.random() * 4)],
    path: ["/api/v2/users", "/api/v2/events", "/api/v1/health", "/api/v2/streams"][Math.floor(Math.random() * 4)],
    status: [200, 200, 200, 201, 400, 404, 500][Math.floor(Math.random() * 7)],
    latency_ms: Math.floor(Math.random() * 120 + 2),
  }),
  "session-tracking": () => ({
    session_id: `sess_${Math.random().toString(36).slice(2, 10)}`,
    event: ["session.start", "session.heartbeat", "session.end"][Math.floor(Math.random() * 3)],
    platform: ["ios", "android", "web"][Math.floor(Math.random() * 3)],
    duration_s: Math.floor(Math.random() * 600),
  }),
};

function generateEvent() {
  const stream = STREAM_NAMES[Math.floor(Math.random() * STREAM_NAMES.length)];
  const payload = EVENT_TEMPLATES[stream]();
  return {
    id: `${Date.now()}-${Math.random()}`,
    stream,
    payload,
    ts: new Date().toISOString().split("T")[1].slice(0, 12),
    latency: Math.floor(Math.random() * 30 + 2),
  };
}

export default function LiveEventFeed() {
  const [events, setEvents] = useState(() => Array.from({ length: 8 }, generateEvent));
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(800);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      setEvents((prev) => [generateEvent(), ...prev].slice(0, 50));
    }, rate);
    return () => clearInterval(interval);
  }, [rate]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[420px]">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">Live Event Feed</span>
          {!paused && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="bg-secondary border border-border rounded-md text-xs px-2 py-1 text-muted-foreground focus:outline-none"
          >
            <option value={400}>Fast (400ms)</option>
            <option value={800}>Normal (800ms)</option>
            <option value={1600}>Slow (1600ms)</option>
          </select>
          <button
            onClick={() => setPaused((p) => !p)}
            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
              paused
                ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 font-mono text-xs">
        <AnimatePresence initial={false}>
          {events.map((ev) => {
            const col = STREAM_COLORS[ev.stream] || "text-muted-foreground";
            const tag = STREAM_ICONS[ev.stream] || "EVT";
            const isError =
              ev.payload.status >= 500 ||
              ev.payload.event?.includes("failed") ||
              ev.payload.status === "alert";
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 px-4 py-2 border-b border-border/30 hover:bg-secondary/20 transition-colors"
              >
                <span className="text-muted-foreground/50 shrink-0 tabular-nums w-[90px]">{ev.ts}</span>
                <span className={`shrink-0 font-semibold w-[30px] ${col}`}>{tag}</span>
                <span className={`flex-1 truncate ${isError ? "text-red-400" : "text-foreground/80"}`}>
                  {JSON.stringify(ev.payload)}
                </span>
                <span className={`shrink-0 tabular-nums ${ev.latency > 20 ? "text-amber-400" : "text-muted-foreground/50"}`}>
                  {ev.latency}ms
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}