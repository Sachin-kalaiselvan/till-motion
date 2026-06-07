"use client";

/**
 * useScrollProgress
 *
 * Maps a DOM element's scroll range to a 0→1 progress value via GSAP ScrollTrigger.
 * The ref must be attached to the trigger element.
 *
 * Usage:
 *   const { ref, progress } = useScrollProgress({ start: "top center", end: "bottom center" });
 *   // progress.current is always 0→1, read imperatively in RAF loops
 *
 * Returns:
 *   ref       — attach to the trigger element
 *   progress  — MotionValue<number> (0→1) — use in Framer Motion or read .get()
 *   gsapST    — the raw ScrollTrigger instance (for scrub timelines)
 *
 * Integration note:
 *   This hook creates a GSAP ScrollTrigger. Since Lenis drives ScrollTrigger.update()
 *   on every tick, the progress value is always current relative to Lenis position.
 */

import { useEffect, useRef } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { ScrollTrigger, registerGSAP } from "@/lib/motion";

export interface UseScrollProgressOptions {
  /** ScrollTrigger start string — default "top bottom" */
  start?: string;
  /** ScrollTrigger end string — default "bottom top" */
  end?: string;
  /** Scrub smoothing in seconds. 0 = instant (for logic), >0 = smoothed (for motion) */
  scrub?: number | boolean;
  /**
   * onProgress callback — called on every tick with the current 0→1 progress.
   * Prefer this over subscribing to the MotionValue in tight loops.
   */
  onProgress?: (progress: number) => void;
}

export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollProgressOptions = {}
) {
  const {
    start = "top bottom",
    end = "bottom top",
    scrub = 1.2,
    onProgress,
  } = options;

  const ref = useRef<T>(null);
  const progress = useMotionValue(0);
  const stRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    registerGSAP();
    const el = ref.current;
    if (!el) return;

    stRef.current = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      scrub,
      onUpdate: (self) => {
        progress.set(self.progress);
        onProgress?.(self.progress);
      },
    });

    return () => {
      stRef.current?.kill();
      stRef.current = null;
    };
  }, [start, end, scrub, onProgress, progress]);

  return {
    ref,
    progress,
    gsapST: stRef,
  } as {
    ref: React.RefObject<T | null>;
    progress: MotionValue<number>;
    gsapST: React.RefObject<ScrollTrigger | null>;
  };
}
