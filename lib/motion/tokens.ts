/**
 * TIL Motion Tokens
 * Single source of truth for every animation value on the site.
 * Nothing animates outside these tokens.
 */

// ─── Easing ──────────────────────────────────────────────────────────────────

/**
 * tilEase — the primary reveal/settle curve.
 * Fast attack, long exponential tail. Used on every Reveal, ClipReveal, and BlurFocus.
 * GSAP format: [x1, y1, x2, y2]
 */
export const tilEase = "cubic-bezier(0.16, 1, 0.3, 1)" as const;
export const tilEaseGSAP = "expo.out" as const;

/**
 * tilMorph — symmetric curve for state-to-state layout morphs.
 * Used on FLIP transitions, panel swaps, the Subject's dock/return.
 */
export const tilMorph = "cubic-bezier(0.65, 0, 0.35, 1)" as const;
export const tilMorphGSAP = "power2.inOut" as const;

/**
 * tilSpring — for pointer-driven elements only: magnetic buttons, tilt cards.
 * Never used on scroll reveals. Spring lives in Framer Motion config format.
 */
export const tilSpring = {
  type: "spring",
  stiffness: 120,
  damping: 18,
  mass: 1,
} as const;

/**
 * tilSpringSnappy — tighter spring for micro hover states.
 */
export const tilSpringSnappy = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 0.8,
} as const;

/**
 * SCRUB RULE: scroll-scrubbed tweens MUST use linear easing only.
 * The smoothing comes from Lenis + ScrollTrigger's scrub value.
 * Adding tilEase to a scrubbed tween double-eases → feels sluggish and wrong.
 */
export const tilScrub = "none" as const;
export const SCRUB_SMOOTHING = 1.2; // seconds of lag behind scroll position

// ─── Durations ────────────────────────────────────────────────────────────────

export const durations = {
  /** 120ms — hover color/border, cursor state changes */
  micro: 0.12,
  /** 240ms — reveals (translateY + opacity), button press feedback */
  short: 0.24,
  /** 480ms — layout morphs, panel swaps, scene crossfades, FLIP transitions */
  medium: 0.48,
} as const;

// CSS string versions for use in Tailwind/inline styles
export const durationsCss = {
  micro: "120ms",
  short: "240ms",
  medium: "480ms",
} as const;

// ─── Reveal defaults ──────────────────────────────────────────────────────────

export const revealDefaults = {
  /** translateY distance in px — keeps reveals tight and fast */
  distance: 24,
  /** Base stagger between sibling reveals */
  stagger: 0.08,
  /** Threshold: 10% of element must be in view before revealing */
  threshold: 0.1,
} as const;

// ─── Blur-Focus ───────────────────────────────────────────────────────────────

export const blurFocusDefaults = {
  /** Starting blur in px — large enough to read as "not focused" */
  blur: 8,
  /** Slight scale-up on arrival (settled state) to match the focus metaphor */
  scaleFrom: 1.02,
} as const;

// ─── Velocity Skew ────────────────────────────────────────────────────────────

export const velocitySkewDefaults = {
  /** Maximum skewY in degrees. Beyond ±4deg reads as broken, not physical */
  maxSkew: 4,
  /** Divisor: higher = less sensitive to velocity */
  sensitivity: 500,
  /** Spring config for skew return */
  spring: { stiffness: 100, damping: 20, mass: 0.5 },
} as const;

// ─── Parallax layers ──────────────────────────────────────────────────────────

/**
 * Five canonical depth planes.
 * rate: how fast the layer moves relative to scroll.
 *   < 1.0 = slower than scroll (background, recedes)
 *   = 1.0 = normal (content plane, locked to scroll)
 *   > 1.0 = faster than scroll (foreground, advances)
 *
 * blur: resting CSS filter blur (px). Increases with depth distance from content plane.
 * zIndex: stacking order
 */
export const parallaxLayers = {
  backgroundField: {
    rate: 0.85,
    blur: 2,
    zIndex: 0,
    name: "backgroundField",
  },
  contentPlane: {
    rate: 1.0,
    blur: 0,
    zIndex: 10,
    name: "contentPlane",
  },
  foregroundAccents: {
    rate: 1.15,
    blur: 0,
    zIndex: 20,
    name: "foregroundAccents",
  },
  pinnedSubject: {
    // pinnedSubject has its own GSAP timeline — rate is nominal
    rate: 1.0,
    blur: 0,
    zIndex: 30,
    name: "pinnedSubject",
  },
  fixedOverlay: {
    rate: 0, // fixed to viewport, no scroll movement
    blur: 0,
    zIndex: 50,
    name: "fixedOverlay",
  },
} as const;

export type ParallaxLayerKey = keyof typeof parallaxLayers;

// ─── Magnetic button ─────────────────────────────────────────────────────────

export const magneticDefaults = {
  /** Radius in px within which the magnet activates */
  radius: 80,
  /** Max displacement in px */
  maxDisplace: 8,
  /** Label lags this many px behind the button shell */
  labelLag: 8,
  /** Label lag timing offset in seconds */
  labelDelay: 0.06,
} as const;

// ─── Tilt Card ────────────────────────────────────────────────────────────────

export const tiltCardDefaults = {
  /** Max rotation in degrees on each axis */
  maxRotation: 6,
  /** Inner content parallax offset px — creates depth-on-hover */
  contentLag: 12,
  /** Perspective applied to the card container */
  perspective: 800,
} as const;
