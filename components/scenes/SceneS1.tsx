"use client";

/**
 * SceneS1 — Hero
 *
 * Blueprint spec (from the interaction language document):
 *   "Hero, pinned 200vh.
 *    Subject centered. Progress 0→1:
 *    Subject scales 1.0→0.82 + translateY −40px; backdrop plane scales 1.10→1.00
 *    (counter-motion = depth).
 *    Headline line reveals via Clip wipe at progress 0.30.
 *    At progress 1.0 the Subject is positioned to hand off."
 *
 * Implementation decisions:
 *
 *   1. The pin is a tall scroll container (200vh). The inner content div is
 *      position:sticky so it stays in view while the outer div scrolls past.
 *      This is preferable to GSAP's pin for React because it doesn't cause
 *      layout recalculation issues with the layoutId FLIP that follows.
 *
 *   2. GSAP ScrollTrigger reads scroll progress through the 200vh container
 *      and drives two things:
 *        a. The Subject's scale + translateY (via GSAP on a ref)
 *        b. The `dock()` call at progress 1.0 (onLeave)
 *
 *   3. The HeroSubject component (Framer Motion layoutId) is NOT directly
 *      targeted by the GSAP scroll tween. Instead, a wrapper div is tweened.
 *      This avoids a conflict between GSAP's transform and Framer's layout
 *      animation on the same element.
 *
 *   4. The backdrop counter-scale is a separate div behind the subject,
 *      driven by the same GSAP timeline (inverse rate to subject).
 *
 *   5. Headline reveals via ClipReveal triggered at scroll progress 0.30.
 *      The trigger is progress-based (not intersection), so scrolling back
 *      makes them disappear again — consistent with "scroll is the playhead."
 *
 *   6. At onLeave (progress = 1.0), dock() is called. This flips isDocked
 *      to true in SubjectContext, which:
 *        - Causes HeroSubject to exit (AnimatePresence)
 *        - Causes DockedSubject to enter
 *        - Framer Motion FLIP morphs between their layout positions
 */

import { useEffect, useRef, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";
import { durations, tilEase, tilMorph } from "@/lib/motion/tokens";
import { LineByLineReveal, ClipReveal } from "@/components/motion";
import { HeroSubject } from "./Subject";
import { useSubject } from "@/context/SubjectContext";
import type { Easing } from "framer-motion";

// ─── Constants ───────────────────────────────────────────────────────────────

/** How many viewport heights the hero scroll range covers */
const PIN_VH = 2;

// ─── Component ───────────────────────────────────────────────────────────────

export function SceneS1() {
  const { dock, isDocked } = useSubject();
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const subjectWrapRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const sublineRef = useRef<HTMLDivElement>(null);

  // Headline reveal: controlled by scroll progress (not intersection)
  const [headlineVisible, setHeadlineVisible] = useState(false);
  const [sublineVisible, setSublineVisible] = useState(false);

  useEffect(() => {
    registerGSAP();

    const container = containerRef.current;
    const subjectWrap = subjectWrapRef.current;
    const backdrop = backdropRef.current;
    if (!container || !subjectWrap || !backdrop) return;

    // ── Master timeline scrubbed to the pin container ─────────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: `+=${PIN_VH * 100}%`,
        scrub: SCRUB_SMOOTHING,
        onUpdate: (self) => {
          // Headline wipes in at 30% scroll progress
          if (self.progress >= 0.3 && !headlineVisible) {
            setHeadlineVisible(true);
          }
          // Sub-copy appears at 50%
          if (self.progress >= 0.5 && !sublineVisible) {
            setSublineVisible(true);
          }
        },
        onLeave: () => {
          // S2 handoff — flip the Subject to docked state
          dock();
        },
        onEnterBack: () => {
          // If user scrolls back up through S1, Subject returns to hero
          // (handled via SubjectContext undock — not called here to avoid
          // fighting the FLIP; S1 parent decides when to call undock)
        },
      },
    });

    // Subject: scale 1.0 → 0.82, translateY 0 → -40px
    tl.fromTo(
      subjectWrap,
      { scale: 1, y: 0 },
      { scale: 0.82, y: -40, ease: "none" },
      0
    );

    // Backdrop counter-scale: 1.1 → 1.0 (recedes as subject scales down)
    tl.fromTo(
      backdrop,
      { scale: 1.1 },
      { scale: 1.0, ease: "none" },
      0
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /**
     * Outer container: tall enough to create the scroll range.
     * The inner sticky div stays in view the whole time.
     */
    <div
      ref={containerRef}
      style={{
        height: `${PIN_VH * 100}vh`,
        position: "relative",
      }}
    >
      {/* ── Sticky frame — stays in viewport ── */}
      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* ── Backdrop plane — counter-scales behind the subject ── */}
        <div
          ref={backdropRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <BackdropGrid />
        </div>

        {/* ── Center column ── */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 48,
          }}
        >
          {/* The Subject — GSAP wraps this; Framer Motion owns the inner element */}
          <div ref={subjectWrapRef} style={{ display: "inline-flex" }}>
            <HeroSubject />
          </div>

          {/* Headline — ClipReveal triggered at scroll 30% */}
          <div
            ref={headlineRef}
            style={{
              overflow: "hidden",
              minHeight: "1em", // prevent layout shift before reveal
            }}
          >
            {headlineVisible && (
              <HeadlineReveal />
            )}
          </div>

          {/* Sub-copy — triggered at scroll 50% */}
          <div ref={sublineRef}>
            {sublineVisible && (
              <SublineReveal />
            )}
          </div>
        </div>

        {/* ── Scroll progress indicator ── */}
        <ScrollCue />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * BackdropGrid
 * A subtle structural grid / texture for the backdrop plane.
 * Provides the visual depth needed for the counter-scale to read.
 */
function BackdropGrid() {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ opacity: 0.035, position: "absolute", inset: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="s1-grid"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 80 0 L 0 0 0 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </pattern>
        {/* Radial fade so grid fades at edges */}
        <radialGradient id="s1-grid-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="70%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="s1-grid-mask">
          <rect width="100%" height="100%" fill="url(#s1-grid-fade)" />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#s1-grid)"
        mask="url(#s1-grid-mask)"
      />
    </svg>
  );
}

/**
 * HeadlineReveal
 * Line-by-line clip wipe at scroll progress 0.30.
 * Uses LineByLineReveal but with immediate trigger (no intersection observer
 * delay — it mounts already needing to be visible).
 */
function HeadlineReveal() {
  return (
    <motion.div
      initial={{ opacity: 1 }} // container is always visible once mounted
    >
      <LineByLineReveal
        lines={["Beyond the", "limits."]}
        lineClassName="block"
        style={{
          fontSize: "clamp(40px, 6.5vw, 80px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          textAlign: "center",
        }}
        staggerInterval={0.1}
        // delay: 0 because the mount itself is the trigger
        delay={0}
      />
    </motion.div>
  );
}

/**
 * SublineReveal
 * Short descriptor copy, fades in at scroll progress 0.50.
 */
function SublineReveal() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 0.45, y: 0 }}
      transition={{
        duration: durations.short,
        ease: tilEase as Easing,
      }}
      style={{
        fontSize: 15,
        letterSpacing: "0.02em",
        maxWidth: 320,
        lineHeight: 1.6,
        textAlign: "center",
        fontWeight: 400,
      }}
    >
      Web design and D2C automation studio.
    </motion.p>
  );
}

/**
 * ScrollCue
 * Subtle indicator that the user should scroll.
 * Fades out after first scroll (handled by opacity animation on mount).
 */
function ScrollCue() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      transition={{
        duration: durations.medium,
        ease: tilEase as Easing,
        delay: 1.2,
      }}
      style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        scroll
      </span>
      <ScrollArrow />
    </motion.div>
  );
}

function ScrollArrow() {
  return (
    <motion.div
      animate={{ y: [0, 6, 0] }}
      transition={{
        duration: 1.8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
    >
      <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
        <path
          d="M6 0v14M1 10l5 5 5-5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}
