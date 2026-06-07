"use client";

/**
 * useLenisScroll
 *
 * Returns live Lenis scroll data: position, velocity, direction, progress.
 * Updates on every Lenis tick via subscription — never polls window.scrollY.
 *
 * Usage:
 *   const { scrollY, velocity, direction, progress } = useLenisScroll();
 *
 * Performance: uses useRef for the raw values (no re-render on tick) and
 * only calls setState when a component needs reactive updates (opt-in via
 * the `reactive` option).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type Lenis from "lenis";
import { useLenisContext } from "@/providers/LenisProvider";

export interface LenisScrollState {
  /** Current scroll position in px */
  scrollY: number;
  /** Scroll velocity in px/frame — positive = scrolling down */
  velocity: number;
  /** 1 = scrolling down, -1 = scrolling up, 0 = stopped */
  direction: 1 | -1 | 0;
  /** 0→1 progress through the full document height */
  progress: number;
  /** The raw Lenis instance — for imperative use (lenis.scrollTo, etc.) */
  lenis: Lenis | null;
}

interface UseLenisScrollOptions {
  /**
   * If true, component will re-render on every Lenis tick.
   * Only enable if your component needs to display live scroll values.
   * For animation purposes, prefer refs (default behaviour).
   */
  reactive?: boolean;
  /**
   * Callback fired on each Lenis tick.
   * Ideal for driving canvas or direct DOM mutations without re-rendering.
   */
  onScroll?: (state: LenisScrollState) => void;
}

export function useLenisScroll(options: UseLenisScrollOptions = {}) {
  const { reactive = false, onScroll } = options;
  const { lenis } = useLenisContext();

  // Non-reactive ref — always current, zero re-renders
  const stateRef = useRef<LenisScrollState>({
    scrollY: 0,
    velocity: 0,
    direction: 0,
    progress: 0,
    lenis: null,
  });

  // Reactive state — only used when reactive: true
  const [reactiveState, setReactiveState] = useState<LenisScrollState>(
    stateRef.current
  );

  const handleScroll = useCallback(
    (lenisInstance: { scroll: number; velocity: number; direction: number; progress: number }) => {
      const next: LenisScrollState = {
        scrollY: lenisInstance.scroll,
        velocity: lenisInstance.velocity,
        direction: (lenisInstance.direction as 1 | -1 | 0) || 0,
        progress: lenisInstance.progress,
        lenis: lenis,
      };

      stateRef.current = next;
      onScroll?.(next);

      if (reactive) {
        setReactiveState(next);
      }
    },
    [lenis, onScroll, reactive]
  );

  useEffect(() => {
    if (!lenis) return;

    // Update the lenis ref immediately
    stateRef.current = { ...stateRef.current, lenis };

    lenis.on("scroll", handleScroll);
    return () => {
      lenis.off("scroll", handleScroll);
    };
  }, [lenis, handleScroll]);

  return reactive ? reactiveState : stateRef.current;
}
