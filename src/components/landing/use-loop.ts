"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drives looping landing-page animations: returns milliseconds elapsed in the current loop,
 * runs only while the element is on screen, and freezes on the final frame for reduced motion.
 */
export function useLoop(durationMs: number, tickMs = 100) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setElapsed(durationMs - 1);
      return;
    }

    let timer: number | null = null;
    let startedAt = 0;

    const start = () => {
      if (timer !== null) return;
      startedAt = Date.now() - elapsedRef.current;
      timer = window.setInterval(() => {
        const next = (Date.now() - startedAt) % durationMs;
        elapsedRef.current = next;
        setElapsed(next);
      }, tickMs);
    };
    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };

    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.2 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [durationMs, tickMs]);

  return { ref, elapsed };
}
