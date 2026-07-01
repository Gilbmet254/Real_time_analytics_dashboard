import React, { useEffect, useState } from "react";

const MAX = 4500000;

export default function ThroughputGauge({ value }) {
  const [prev, setPrev] = useState(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = prev;
    const end = value;
    const startTime = performance.now();
    const duration = 800;
    let raf;

    const animate = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (p < 1) raf = requestAnimationFrame(animate);
      else setPrev(end);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const pct = Math.min(display / MAX, 1);
  const angle = -135 + pct * 270;
  const radius = 70;
  const cx = 90;
  const cy = 90;
  const arcPath = (startAngle, endAngle, r) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const sx = cx + r * Math.cos(toRad(startAngle));
    const sy = cy + r * Math.sin(toRad(startAngle));
    const ex = cx + r * Math.cos(toRad(endAngle));
    const ey = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };

  const needleX = cx + (radius - 12) * Math.cos(((angle) * Math.PI) / 180);
  const needleY = cy + (radius - 12) * Math.sin(((angle) * Math.PI) / 180);

  const color = pct > 0.85 ? "#ef4444" : pct > 0.65 ? "#f59e0b" : "#06b6d4";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">Total Throughput</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time events/min gauge</p>
      </div>
      <div className="flex flex-col items-center">
        <svg width="180" height="110" viewBox="0 0 180 110">
          <path d={arcPath(-135, 135, radius)} fill="none" stroke="hsl(220,14%,14%)" strokeWidth="12" strokeLinecap="round" />
          <path d={arcPath(-135, -135 + pct * 270, radius)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            style={{ transition: "stroke 0.4s ease" }} />
          <line x1={cx} y1={cy} x2={needleX} y2={needleY}
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: "x2 0.8s ease, y2 0.8s ease" }} />
          <circle cx={cx} cy={cy} r="5" fill={color} />
          <text x={cx} y={cy + 22} textAnchor="middle" fill="white" fontSize="14" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            {display >= 1000000 ? `${(display / 1000000).toFixed(2)}M` : `${(display / 1000).toFixed(0)}K`}
          </text>
          <text x={cx} y={cy + 34} textAnchor="middle" fill="hsl(215,15%,50%)" fontSize="7">
            events/min
          </text>
        </svg>
        <div className="flex justify-between w-full text-[10px] text-muted-foreground font-mono mt-1 px-2">
          <span>0</span>
          <span>2.25M</span>
          <span>4.5M</span>
        </div>
      </div>
    </div>
  );
}