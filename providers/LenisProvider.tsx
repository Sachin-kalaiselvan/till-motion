"use client";

/**
 * LenisProvider
 *
 * The single scroll authority for the entire site.
 * Responsibilities:
 *   1. Initialize Lenis with correct options.
 *   2. Drive Lenis via a GSAP ticker (not a raw RAF) so both systems
 *      share the same clock and never diverge.
 *   3. Call ScrollTrigger.update() on every Lenis tick — this is the
 *      critical bridge. Without it, all GSAP scrub animations freeze.
 *   4. Expose the Lenis instance via context so any child can read
 *      scroll position, velocity, or call lenis.scrollTo().
 *   5. Clean up on unmount.
 *
 * Architecture note:
 *   Lenis intercepts and re-emits scroll events with lerp smoothing.
 *   ScrollTrigger must read from Lenis, not from window.scrollY directly.
 *   The bridge is: Lenis.on("scroll", ScrollTrigger.update).
 *   We drive Lenis from GSAP's ticker instead of requestAnimationFrame
 *   so both systems tick in the same frame and there is zero skew.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGSAP } from "@/lib/motion";

// ─── Context ──────────────────────────────────────────────────────────────────

interface LenisContextValue {
  lenis: Lenis | null;
}

const LenisContext = createContext<LenisContextValue>({ lenis: null });

export function useLenisContext() {
  return useContext(LenisContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface LenisProviderProps {
  children: ReactNode;
  /**
   * lerp: linear interpolation amount per frame (0–1).
   * Lower = smoother, higher = snappier.
   * 0.1 is a good baseline for most scroll contexts.
   */
  lerp?: number;
  /**
   * smoothWheel: applies lerp smoothing to wheel events.
   * true on desktop (smooth), native on touch devices.
   */
  smoothWheel?: boolean;
  /** Lock scroll on mount for this many ms (used during entry animation) */
  lockMs?: number;
}

export function LenisProvider({
  children,
  lerp = 0.1,
  smoothWheel = true,
  lockMs = 0,
}: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Register GSAP plugins once
    registerGSAP();

    // Instantiate Lenis
    const lenis = new Lenis({
      lerp,
      smoothWheel,
      // Sync Lenis with GSAP's autoScroll scrollerProxy so
      // ScrollTrigger reads from Lenis instead of window.scrollY.
      // This is handled via the Lenis.on("scroll") bridge below.
    });

    lenisRef.current = lenis;

    // ── Bridge: every Lenis scroll tick → ScrollTrigger.update() ──────────
    // This is the most important line. Without it, GSAP ScrollTrigger reads
    // window.scrollY which Lenis has overridden, so scrub timelines freeze.
    lenis.on("scroll", ScrollTrigger.update);

    // ── Drive Lenis from GSAP's ticker (not raw RAF) ───────────────────────
    // GSAP's ticker runs at the display refresh rate and is the same clock
    // GSAP uses for all tweens. Driving Lenis from it ensures zero frame skew
    // between Lenis scroll position and GSAP animations.
    function onTick(time: number) {
      lenis.raf(time * 1000); // GSAP time is in seconds; Lenis expects ms
    }

    gsap.ticker.add(onTick);

    // Disable GSAP's default lag-smoothing so Lenis + GSAP stay in sync
    // on slow frames. Without this, a laggy frame can cause jitter.
    gsap.ticker.lagSmoothing(0);

    // ── Optional: lock scroll during entry animation ───────────────────────
    if (lockMs > 0) {
      lenis.stop();
      const timer = setTimeout(() => lenis.start(), lockMs);
      return () => {
        clearTimeout(timer);
        lenis.off("scroll", ScrollTrigger.update);
        gsap.ticker.remove(onTick);
        lenis.destroy();
        lenisRef.current = null;
      };
    }

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [lerp, smoothWheel, lockMs]);

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current }}>
      {children}
    </LenisContext.Provider>
  );
}
