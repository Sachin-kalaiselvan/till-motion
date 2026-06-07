"use client";

/**
 * useVelocitySkew
 *
 * Maps scroll velocity to a skewY transform on the target element.
 * Creates the physical "mass and momentum" feel described in Signature Interaction #3.
 *
 * Mechanic:
 *   - Read Lenis velocity on each tick
 *   - Map velocity → skewY degrees (clamped to ±maxSkew)
 *   - Apply via Framer Motion's useSpring so it springs back to 0 on scroll stop
 *
 * Usage:
 *   const { ref, skewY } = useVelocitySkew();
 *   <motion.div ref={ref} style={{ skewY }}>...</motion.div>
 *
 * Why spring:
 *   A raw skew tracks velocity instantly and looks jittery.
 *   Spring gives it settling behavior — fast scroll skews, stopping slowly
 *   un-skews back to 0, which reads as "mass."
 *
 * Performance:
 *   Framer Motion's useSpring drives CSS directly via a MotionValue,
 *   so there are zero React re-renders. 60fps.
 */

import { useEffect, useRef } from "react";
import { useSpring, useMotionValue, type MotionValue } from "framer-motion";
import { velocitySkewDefaults } from "@/lib/motion";
import { useLenisScroll } from "./useLenisScroll";

export interface UseVelocitySkewOptions {
  /** Max skewY in degrees. Default: 4 */
  maxSkew?: number;
  /** Higher = less sensitive to velocity. Default: 500 */
  sensitivity?: number;
  /** Spring stiffness. Default from tokens */
  stiffness?: number;
  /** Spring damping. Default from tokens */
  damping?: number;
  /** Spring mass. Default from tokens */
  mass?: number;
  /** Set false to disable the effect (e.g. prefers-reduced-motion) */
  enabled?: boolean;
}

export function useVelocitySkew(options: UseVelocitySkewOptions = {}) {
  const {
    maxSkew = velocitySkewDefaults.maxSkew,
    sensitivity = velocitySkewDefaults.sensitivity,
    stiffness = velocitySkewDefaults.spring.stiffness,
    damping = velocitySkewDefaults.spring.damping,
    mass = velocitySkewDefaults.spring.mass,
    enabled = true,
  } = options;

  const rawSkew = useMotionValue(0);

  const skewY = useSpring(rawSkew, {
    stiffness,
    damping,
    mass,
  }) as MotionValue<number>;

  const ref = useRef<HTMLElement>(null);

  // Subscribe to Lenis velocity via onScroll callback (no re-renders)
  useLenisScroll({
    onScroll: ({ velocity }) => {
      if (!enabled) return;

      // velocity is px/frame — clamp to maxSkew degrees
      const rawDeg = -(velocity / sensitivity) * maxSkew;
      const clamped = Math.max(-maxSkew, Math.min(maxSkew, rawDeg));
      rawSkew.set(clamped);
    },
  });

  // Respect prefers-reduced-motion: disable the effect entirely
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      rawSkew.set(0);
    }
  }, [rawSkew]);

  return { ref, skewY };
}
