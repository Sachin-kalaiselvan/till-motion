/**
 * Framer Motion variants
 *
 * Central library of reusable variants built from TIL tokens.
 * Import these into components — never write raw animation values inline.
 *
 * Rule: if the motion is scroll-bound → GSAP.
 *       If it's pointer/state/mount/unmount → Framer Motion (here).
 */

import type { Variants, Transition, Easing } from "framer-motion";
import {
  tilEase,
  tilMorph,
  tilSpring,
  tilSpringSnappy,
  durations,
  revealDefaults,
  blurFocusDefaults,
} from "./tokens";

// ─── Shared transitions ───────────────────────────────────────────────────────

// Framer Motion accepts cubic-bezier strings directly as Easing type.
const tilEaseFM = tilEase as Easing;
const tilMorphFM = tilMorph as Easing;

export const easeTransition: Transition = {
  duration: durations.short,
  ease: tilEaseFM,
};

export const morphTransition: Transition = {
  duration: durations.medium,
  ease: tilMorphFM,
};

export const springTransition: Transition = tilSpring;
export const springSnappyTransition: Transition = tilSpringSnappy;

// ─── Reveal ───────────────────────────────────────────────────────────────────

/**
 * fadeReveal — opacity + translateY.
 * The standard Reveal primitive in Framer Motion form.
 * Use Intersection-Observer (whileInView) for one-shot scroll reveals.
 */
export const fadeReveal: Variants = {
  hidden: {
    opacity: 0,
    y: revealDefaults.distance,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: easeTransition,
  },
};

/**
 * fadeRevealContainer — stagger wrapper for lists of reveal children.
 */
export const fadeRevealContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: revealDefaults.stagger,
      delayChildren: 0,
    },
  },
};

/** Child variant — pair with fadeRevealContainer */
export const fadeRevealItem: Variants = {
  hidden: { opacity: 0, y: revealDefaults.distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: easeTransition,
  },
};

// ─── BlurFocus ────────────────────────────────────────────────────────────────

/**
 * blurFocus — blur 8px + scale 1.02 → sharp + scale 1.0.
 * Reserved for PRIMARY elements only (see blueprint: hierarchy rule).
 * Use sparingly — one or two elements per scene maximum.
 */
export const blurFocus: Variants = {
  hidden: {
    opacity: 0,
    filter: `blur(${blurFocusDefaults.blur}px)`,
    scale: blurFocusDefaults.scaleFrom,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: durations.medium,
      ease: tilEaseFM,
    },
  },
};

// ─── ClipReveal ───────────────────────────────────────────────────────────────

export const clipRevealUp: Variants = {
  hidden: { clipPath: "inset(100% 0% 0% 0%)" },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    transition: easeTransition,
  },
};

export const clipRevealDown: Variants = {
  hidden: { clipPath: "inset(0% 0% 100% 0%)" },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    transition: easeTransition,
  },
};

export const clipRevealLeft: Variants = {
  hidden: { clipPath: "inset(0% 100% 0% 0%)" },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    transition: easeTransition,
  },
};

export const clipRevealRight: Variants = {
  hidden: { clipPath: "inset(0% 0% 0% 100%)" },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    transition: easeTransition,
  },
};

// ─── Layout / FLIP ────────────────────────────────────────────────────────────

/**
 * layoutTransition — transition config for Framer Motion layout animations.
 * Used on any component with the `layout` prop (expand-in-place, Subject dock/return).
 */
export const layoutTransition: Transition = morphTransition;

// ─── Expand in place (Interaction #10) ───────────────────────────────────────

export const expandCard: Variants = {
  collapsed: {
    borderRadius: "12px",
    transition: morphTransition,
  },
  expanded: {
    borderRadius: "0px",
    transition: morphTransition,
  },
};

// ─── Presence (mount/unmount) ─────────────────────────────────────────────────

export const fadePresence: Variants = {
  initial: { opacity: 0, y: revealDefaults.distance },
  animate: {
    opacity: 1,
    y: 0,
    transition: easeTransition,
  },
  exit: {
    opacity: 0,
    y: -revealDefaults.distance / 2,
    transition: {
      duration: durations.micro,
      ease: tilMorphFM,
    },
  },
};

// ─── Magnetic button inner content ───────────────────────────────────────────

/**
 * magneticLabel — the label inside a MagneticButton lags behind the shell.
 * The shell position is driven imperatively; this handles the inner content spring.
 */
export const magneticLabel: Variants = {
  rest: { x: 0, y: 0 },
  hover: {
    // Actual x/y values are set imperatively. This variant just provides
    // the spring config so Framer knows how to animate between states.
    transition: {
      ...tilSpring,
      stiffness: 80,  // softer than the button shell for the lag effect
      damping: 15,
    },
  },
};
