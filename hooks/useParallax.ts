"use client";

/**
 * useParallax
 *
 * Applies scroll-scrubbed translateY to a DOM element based on its
 * assigned depth layer rate. This is the global depth system from the blueprint.
 *
 * Usage:
 *   const ref = useParallax({ rate: parallaxLayers.backgroundField.rate });
 *   <div ref={ref}>...</div>
 *
 *   // Or use a named layer:
 *   const ref = useParallax({ layer: "backgroundField" });
 *
 * How it works:
 *   rate < 1.0 → element moves slower than scroll (recedes, background feel)
 *   rate = 1.0 → no movement (normal content plane)
 *   rate > 1.0 → element moves faster than scroll (advances, foreground feel)
 *
 *   The translateY delta = (rate - 1) * scrollRange
 *   This means a backgroundField (0.85) moves -45px over 300px of scroll,
 *   which reads as "further away."
 *
 * Performance:
 *   Uses GSAP's CSS transform, not React state. Zero re-renders. 60fps.
 *   The ScrollTrigger scrub smoothing (1.2s) is inherited from SCRUB_SMOOTHING token.
 */

import { useEffect, useRef } from "react";
import {
  gsap,
  ScrollTrigger,
  registerGSAP,
  parallaxLayers,
  SCRUB_SMOOTHING,
  tilScrub,
  type ParallaxLayerKey,
} from "@/lib/motion";

export interface UseParallaxOptions {
  /** Explicit rate (overrides layer if both provided) */
  rate?: number;
  /** Named layer from the depth system — sets rate automatically */
  layer?: ParallaxLayerKey;
  /**
   * Scroll range in px to map the parallax over.
   * Default: 400. Increase for taller elements, decrease for compact ones.
   */
  scrollRange?: number;
  /** ScrollTrigger start — default "top bottom" */
  start?: string;
  /** ScrollTrigger end — default "bottom top" */
  end?: string;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: UseParallaxOptions = {}
) {
  const { layer, scrollRange = 400, start = "top bottom", end = "bottom top" } =
    options;

  // Resolve rate: explicit > layer lookup > 1.0 (no effect)
  const rate =
    options.rate ??
    (layer ? parallaxLayers[layer].rate : 1.0);

  const ref = useRef<T>(null);

  useEffect(() => {
    // No-op for the content plane — avoids unnecessary ScrollTriggers
    if (rate === 1.0) return;

    registerGSAP();
    const el = ref.current;
    if (!el) return;

    // yDelta: how far the element translates over the full scroll range.
    // (rate - 1) * scrollRange
    //   rate 0.85 → -60px (slower, appears to recede)
    //   rate 1.15 → +60px (faster, appears to advance)
    const yDelta = (rate - 1) * scrollRange;

    const tween = gsap.fromTo(
      el,
      { y: -yDelta / 2 },   // start offset so the element is centered at entry
      {
        y: yDelta / 2,
        ease: tilScrub,
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: SCRUB_SMOOTHING,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [rate, scrollRange, start, end]);

  return ref;
}
