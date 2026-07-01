import React, { useEffect, useRef, useState } from "react";

export function useAnimatedValue(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef(null);

  useEffect(() => {
    const start = prev.current;
    const end = target;
    const startTime = performance.now();

    cancelAnimationFrame(raf.current);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else prev.current = end;
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

export default function AnimatedCounter({ value, format }) {
  const animated = useAnimatedValue(value);
  return <>{format ? format(animated) : animated.toLocaleString()}</>;
}