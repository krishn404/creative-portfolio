"use client";
import { useState, useCallback } from "react";

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
}

export default function ClickSpark({
  sparkColor = "black",
  sparkSize = 12,
  sparkRadius = 40,
  sparkCount = 10,
  duration = 500,
  easing = "cubic-bezier(0.22,1,0.36,1)",
  extraScale = 1,
  children
}: {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: string;
  extraScale?: number;
  children: React.ReactNode;
}) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  const spawn = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const items = Array.from({ length: sparkCount }).map((_, i) => ({
      id: Date.now() + i,
      x,
      y,
      angle: (i / sparkCount) * Math.PI * 2
    }));

    setSparks(prev => [...prev, ...items]);

    setTimeout(() => {
      setSparks(prev => prev.filter(s => !items.includes(s)));
    }, duration);
  }, [sparkCount, duration]);

  return (
    <div className="relative w-full h-full" onClick={spawn}>
      {children}

      {sparks.map(s => {
        const dx = Math.cos(s.angle) * sparkRadius * extraScale;
        const dy = Math.sin(s.angle) * sparkRadius * extraScale;

        return (
          <span
            key={s.id}
            className="absolute pointer-events-none animate-sparkline"
            style={{
              left: s.x,
              top: s.y,
              width: sparkSize,
              height: 2,
              background: sparkColor,
              transformOrigin: "0% 50%",
              animationDuration: `${duration}ms`,
              animationTimingFunction: easing,
              "--dx": `${dx}px`,
              "--dy": `${dy}px`
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
