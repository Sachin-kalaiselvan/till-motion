/**
 * GSAP utilities
 * Import this module once, at the top of the Lenis provider.
 * It handles plugin registration and exports factory functions for
 * the most-used ScrollTrigger patterns so scenes stay DRY.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  tilEaseGSAP,
  tilMorphGSAP,
  tilScrub,
  SCRUB_SMOOTHING,
  durations,
  revealDefaults,
} from "./tokens";

// ─── Plugin registration ──────────────────────────────────────────────────────
// Safe to call multiple times — GSAP deduplicates registrations.
export function registerGSAP() {
  if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
}

// ─── ScrollTrigger ↔ Lenis bridge ────────────────────────────────────────────
/**
 * Call this once inside the Lenis RAF loop.
 * This is the critical wiring: without it, ScrollTrigger's internal
 * scroll position never updates and all scrub animations are frozen.
 */
export function updateScrollTrigger() {
  ScrollTrigger.update();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert duration tokens to GSAP seconds (they already are, but explicit) */
export const gsapDurations = durations;

// ─── ScrollTrigger factory functions ─────────────────────────────────────────

/**
 * createScrubTrigger
 * Factory for a scroll-scrubbed timeline attached to a pin container.
 *
 * @param trigger   — DOM element or selector that defines the scroll range
 * @param pinned    — element to pin (usually same as trigger)
 * @param pinLength — number of viewport heights to pin for (e.g. 2 = 200vh)
 * @param onUpdate  — called with progress 0→1 on every tick (use to drive your tween)
 *
 * Returns the ScrollTrigger instance so the caller can kill() it on cleanup.
 */
export function createScrubTrigger({
  trigger,
  pinned,
  pinLength = 2,
  onUpdate,
}: {
  trigger: Element | string;
  pinned?: Element | string | null;
  pinLength?: number;
  onUpdate?: (progress: number) => void;
}) {
  return ScrollTrigger.create({
    trigger,
    pin: pinned ?? true,
    start: "top top",
    end: `+=${pinLength * 100}%`,
    scrub: SCRUB_SMOOTHING,
    onUpdate: (self) => onUpdate?.(self.progress),
  });
}

/**
 * createRevealTrigger
 * One-shot reveal: fires once when element enters viewport, never replays.
 */
export function createRevealTrigger({
  trigger,
  animation,
  start = `top ${Math.round((1 - revealDefaults.threshold) * 100)}%`,
}: {
  trigger: Element | string;
  animation: gsap.core.Tween | gsap.core.Timeline;
  start?: string;
}) {
  return ScrollTrigger.create({
    trigger,
    start,
    once: true,
    onEnter: () => animation.play(),
  });
}

/**
 * buildRevealTween
 * The canonical Reveal primitive as a GSAP tween (paused, ready to trigger).
 * opacity: 0→1, translateY: distance→0, tilEase, short duration.
 */
export function buildRevealTween(
  target: Element | string | Element[],
  options?: {
    distance?: number;
    duration?: number;
    stagger?: number;
    delay?: number;
  }
) {
  const {
    distance = revealDefaults.distance,
    duration = durations.short,
    stagger = revealDefaults.stagger,
    delay = 0,
  } = options ?? {};

  return gsap.fromTo(
    target,
    { opacity: 0, y: distance },
    {
      opacity: 1,
      y: 0,
      duration,
      ease: tilEaseGSAP,
      stagger,
      delay,
      paused: true,
    }
  );
}

/**
 * buildClipRevealTween
 * ClipReveal primitive: clip-path inset 100%→0%, short, tilEase.
 * Wrap your target in a container with overflow:hidden for this to work.
 */
export function buildClipRevealTween(
  target: Element | string | Element[],
  options?: {
    direction?: "up" | "right" | "down" | "left";
    duration?: number;
    stagger?: number;
  }
) {
  const { direction = "up", duration = durations.short, stagger = revealDefaults.stagger } =
    options ?? {};

  const fromClip: Record<string, string> = {
    up: "inset(100% 0% 0% 0%)",
    down: "inset(0% 0% 100% 0%)",
    left: "inset(0% 100% 0% 0%)",
    right: "inset(0% 0% 0% 100%)",
  };

  return gsap.fromTo(
    target,
    { clipPath: fromClip[direction] },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      duration,
      ease: tilEaseGSAP,
      stagger,
      paused: true,
    }
  );
}

/**
 * buildFlipMorph
 * Wraps GSAP's native FLIP-style position morph via pure transforms.
 * Used for the persistent Subject dock/return.
 *
 * Note: for React-managed DOM nodes, prefer Framer Motion's layoutId.
 * Use this for GSAP-owned non-React elements.
 */
export function buildFlipMorph(
  target: Element | string,
  toVars: gsap.TweenVars,
  duration = durations.medium
) {
  return gsap.to(target, {
    ...toVars,
    duration,
    ease: tilMorphGSAP,
    paused: true,
  });
}

/**
 * buildParallaxTween
 * Creates a scroll-scrubbed translateY tween for a single depth layer.
 * Must be called after ScrollTrigger is registered.
 *
 * @param rate   — layer rate from parallaxLayers token (e.g. 0.85)
 * @param range  — how many px of scroll to map over (default: 300)
 */
export function buildParallaxTween(
  target: Element | string,
  rate: number,
  scrollRange = 300
) {
  const yDelta = (rate - 1) * scrollRange; // negative = slower, positive = faster
  return gsap.to(target, {
    y: yDelta,
    ease: tilScrub,
    scrollTrigger: {
      trigger: target,
      start: "top bottom",
      end: "bottom top",
      scrub: SCRUB_SMOOTHING,
    },
  });
}

// ─── RAF ticker ───────────────────────────────────────────────────────────────
// Export GSAP's ticker so the Lenis provider can add its update callback
// without importing gsap directly.
export { gsap, ScrollTrigger };
