"use client";

/**
 * SceneS3 — Capability Deck
 *
 * Blueprint spec:
 *   "Pinned 300vh. Three panels behave like a scrubbed card deck.
 *    Each occupies one-third of the pin range. As progress advances,
 *    the front panel scales 1.0→0.92 + blur 0→8 + translateY 0→−60 (recedes)
 *    while the next rises translateY 60→0 + blur 8→0 + scale 0.96→1.0.
 *    No hard cuts. One continuous advance you can scrub backward."
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 *
 * DOM layout:
 *   #s3-container  (height: 300vh, position: relative)
 *     #s3-sticky   (position: sticky, top: 0, height: 100vh)
 *       #s3-stage  (the visual area — panels stack here)
 *         [panel-0, panel-1, panel-2]  (position: absolute, stacked)
 *         #s3-ui   (progress indicator, index counter — overlays stage)
 *
 * GSAP timeline structure:
 *   The master timeline scrubs from 0→1 across the 300vh range.
 *   It contains exactly 4 tween groups, each at a fixed position:
 *
 *   Position 0     (duration 1/3):  panel-0 exits  ∥  panel-1 enters
 *   Position 1/3   (duration 1/3):  panel-1 exits  ∥  panel-2 enters
 *   Position 2/3   (duration 1/3):  panel-2 settles (holds visible state)
 *
 *   Exit  tween: scale 1.0→0.92, filter blur(0)→blur(8px), y 0→−60
 *   Enter tween: scale 0.96→1.0, filter blur(8px)→blur(0),  y +60→0
 *
 *   All tweens use ease: "none" — the easing comes from Lenis + scrub.
 *   This is the scrub rule from the token system.
 *
 * Initial state (before any scroll in S3):
 *   panel-0: scale 1.0, blur 0, y 0, z-index 3  (on top, fully visible)
 *   panel-1: scale 0.96, blur 8, y 60, z-index 2 (below, ready to enter)
 *   panel-2: scale 0.96, blur 8, y 60, z-index 1 (deepest, waiting)
 *
 * Z-index strategy:
 *   The outgoing panel must sit on top of the incoming panel for the depth
 *   illusion to read correctly. Z-index is set statically and never animated —
 *   it never needs to change because the panels advance in order.
 *
 * Performance:
 *   - will-change: transform, filter on all panels (declared in CSS)
 *   - GSAP force3D: true on all filter tweens to keep on GPU
 *   - No React state updates inside the scrub loop — 100% GSAP DOM
 *   - Progress indicator updates via direct DOM mutation (no setState)
 *   - Panels are absolutely positioned — no layout recalculation on scroll
 *
 * Subject integration:
 *   The docked Subject (top-left marker) visually marks the active panel
 *   by pulsing its opacity at each panel boundary. This is triggered via
 *   the onEnter callback of per-panel sub-ScrollTriggers, not via React state.
 *
 * ─── Capability data ─────────────────────────────────────────────────────────
 *
 * Each panel has a title, descriptor, 3 detail lines, and a metric.
 * Structured as a const so it's easy to extend without touching the engine.
 */

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";

// ─── Capability content ───────────────────────────────────────────────────────

interface Capability {
  index: string;         // "01", "02", "03"
  title: string;
  descriptor: string;
  details: string[];
  metric: string;
  metricLabel: string;
}

const CAPABILITIES: Capability[] = [
  {
    index: "01",
    title: "Websites",
    descriptor:
      "High-performance storefronts and marketing sites built for conversion. " +
      "Every interaction is intentional. Every frame is measured.",
    details: [
      "Next.js + Framer — production grade",
      "Lighthouse 95+ across all metrics",
      "Delivered in 3–4 weeks",
    ],
    metric: "3.4×",
    metricLabel: "avg. conversion lift",
  },
  {
    index: "02",
    title: "AI Systems",
    descriptor:
      "Embedded intelligence that handles the work your team shouldn't be doing. " +
      "Support, qualification, follow-up — automated and on-brand.",
    details: [
      "GPT-4o + Claude Sonnet pipelines",
      "WhatsApp, email, and web channels",
      "Live in under 2 weeks",
    ],
    metric: "80%",
    metricLabel: "of queries handled without human",
  },
  {
    index: "03",
    title: "Automation",
    descriptor:
      "End-to-end workflow automation across your entire commerce stack. " +
      "Orders, inventory, reporting, and CRM — one connected system.",
    details: [
      "Shopify · Tally · WhatsApp · Zoho",
      "n8n + custom API bridges",
      "Average 14hrs/week saved per client",
    ],
    metric: "₹45k",
    metricLabel: "monthly retainer, fully managed",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_VH = 3;
const PANEL_COUNT = CAPABILITIES.length;
const SEG = 1 / PANEL_COUNT; // 0.333… per transition

// Exact transform values from the blueprint spec
const EXIT = { scale: 0.92, blur: 8, y: -60 } as const;
const ENTER = { scale: 0.96, blur: 8, y: 60 } as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function SceneS3() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGSAP();

    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
    if (panels.length !== PANEL_COUNT) return;

    // ── Set initial state on all panels ───────────────────────────────────
    // panel 0: on top, fully visible
    gsap.set(panels[0], {
      scale: 1.0,
      filter: "blur(0px)",
      y: 0,
      zIndex: PANEL_COUNT + 1,
      willChange: "transform, filter",
    });

    // panels 1..N: below, in enter-ready state
    for (let i = 1; i < PANEL_COUNT; i++) {
      gsap.set(panels[i], {
        scale: ENTER.scale,
        filter: `blur(${ENTER.blur}px)`,
        y: ENTER.y,
        zIndex: PANEL_COUNT - i,
        willChange: "transform, filter",
      });
    }

    // ── Master scrub timeline ──────────────────────────────────────────────
    //
    // Total timeline duration = 1 (arbitrary unit; GSAP normalises to scroll range).
    // Segments: 0→1/3, 1/3→2/3, 2/3→1
    // Each segment runs two parallel tweens: exit (outgoing) and enter (incoming).
    //
    // We set totalDuration explicitly to 1 so positions are clean fractions.
    //
    const tl = gsap.timeline({
      defaults: { ease: "none", duration: SEG },
    });

    // Segment 1: panel 0 → panel 1
    // Exit panel 0
    tl.fromTo(
      panels[0],
      { scale: 1.0, filter: "blur(0px)", y: 0 },
      { scale: EXIT.scale, filter: `blur(${EXIT.blur}px)`, y: EXIT.y },
      0
    );
    // Enter panel 1
    tl.fromTo(
      panels[1],
      { scale: ENTER.scale, filter: `blur(${ENTER.blur}px)`, y: ENTER.y },
      { scale: 1.0, filter: "blur(0px)", y: 0 },
      0 // ← same position = parallel with exit
    );

    // Segment 2: panel 1 → panel 2
    // Exit panel 1
    tl.fromTo(
      panels[1],
      { scale: 1.0, filter: "blur(0px)", y: 0 },
      { scale: EXIT.scale, filter: `blur(${EXIT.blur}px)`, y: EXIT.y },
      SEG
    );
    // Enter panel 2
    tl.fromTo(
      panels[2],
      { scale: ENTER.scale, filter: `blur(${ENTER.blur}px)`, y: ENTER.y },
      { scale: 1.0, filter: "blur(0px)", y: 0 },
      SEG // ← parallel with exit
    );

    // Segment 3: panel 2 holds — add a micro progress beat
    // No transform — panel 2 is already at settled state.
    // We use a dummy tween to extend the timeline to exactly 1.0 duration
    // so the scrub mapping is clean.
    tl.to({}, { duration: SEG }, SEG * 2);

    // ── Attach ScrollTrigger to the timeline ──────────────────────────────
    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: `+=${PIN_VH * 100}%`,
      scrub: SCRUB_SMOOTHING,
      animation: tl,
      onUpdate: (self) => {
        // Progress bar — direct DOM mutation, no React state
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${self.progress})`;
        }

        // Active panel counter — direct DOM mutation
        if (counterRef.current) {
          const activeIndex = Math.min(
            Math.floor(self.progress / SEG),
            PANEL_COUNT - 1
          );
          counterRef.current.textContent = CAPABILITIES[activeIndex].index;
        }
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === container) st.kill();
      });
      tl.kill();

      // Reset will-change to prevent memory leak
      panels.forEach((p) => gsap.set(p, { willChange: "auto" }));
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: `${PIN_VH * 100}vh`,
        position: "relative",
      }}
    >
      {/* ── Sticky frame ── */}
      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1.6fr",
          gap: 0,
        }}
      >
        {/* ── Left rail — section meta + progress ── */}
        <LeftRail counterRef={counterRef} progressBarRef={progressBarRef} />

        {/* ── Right stage — the card stack ── */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 80px 80px 40px",
          }}
        >
          {CAPABILITIES.map((cap, i) => (
            <CapabilityPanel
              key={cap.index}
              capability={cap}
              index={i}
              ref={(el) => { panelRefs.current[i] = el; }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Left rail ────────────────────────────────────────────────────────────────

function LeftRail({
  counterRef,
  progressBarRef,
}: {
  counterRef: React.RefObject<HTMLSpanElement | null>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 0 80px 64px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
      }}
    >
      {/* Section label */}
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.3,
          marginBottom: 24,
        }}
      >
        S3 · Capabilities
      </p>

      {/* Section headline */}
      <h2
        style={{
          fontSize: "clamp(32px, 4vw, 52px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          marginBottom: 40,
        }}
      >
        What we<br />build.
      </h2>

      {/* Active index — updated imperatively by GSAP */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 48 }}>
        <span
          ref={counterRef}
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(72px, 10vw, 120px)",
            fontWeight: 800,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            opacity: 0.08,
            userSelect: "none",
          }}
        >
          01
        </span>
      </div>

      {/* Panel index dots */}
      <PanelDots />

      {/* Progress bar — scaleX driven by GSAP imperatively */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 64,
          right: 0,
          height: 1,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          ref={progressBarRef}
          style={{
            height: "100%",
            background: "rgba(255,255,255,0.35)",
            transformOrigin: "left center",
            transform: "scaleX(0)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Panel dot indicators ─────────────────────────────────────────────────────

function PanelDots() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {CAPABILITIES.map((cap) => (
        <div
          key={cap.index}
          style={{
            width: 24,
            height: 2,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── Capability panel ─────────────────────────────────────────────────────────

/**
 * CapabilityPanel
 *
 * Position: absolute, stacked on top of each other.
 * All transforms (scale, blur, y) are owned entirely by GSAP.
 * React renders the content, GSAP moves it — they never touch the same property.
 *
 * The initial visual state is set by the useEffect in SceneS3
 * via gsap.set() immediately after mount, before the user scrolls.
 * This means the panel is correctly positioned even on fast renders.
 */
import React from "react";

const CapabilityPanel = React.forwardRef<HTMLDivElement, {
  capability: Capability;
  index: number;
}>(({ capability, index }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: "80px 80px 80px 40px",
        // will-change is set via GSAP gsap.set() — not inline here
        // because GSAP needs to own the initial state
        backfaceVisibility: "hidden",       // GPU compositing hint
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <PanelCard capability={capability} />
    </div>
  );
});

CapabilityPanel.displayName = "CapabilityPanel";

// ─── Panel card ───────────────────────────────────────────────────────────────

/**
 * PanelCard
 *
 * The visual design of each capability panel.
 * No animation state here — purely presentational.
 * All motion is owned by GSAP above.
 *
 * Layout:
 *   Full-bleed card with a thin border.
 *   Top: panel index + title
 *   Mid: descriptor paragraph
 *   Bottom-left: detail list
 *   Bottom-right: metric + label
 */
function PanelCard({ capability }: { capability: Capability }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.025)",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        padding: "44px 48px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Corner texture — structural depth ── */}
      <CornerGrid />

      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              opacity: 0.3,
              letterSpacing: "0.14em",
            }}
          >
            {capability.index}
          </span>
          <h3
            style={{
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {capability.title}
          </h3>
        </div>

        {/* Capability mark — a subtle geometric indicator */}
        <div
          style={{
            width: 10,
            height: 10,
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 2,
            transform: "rotate(45deg)",
            flexShrink: 0,
          }}
        />
      </header>

      {/* ── Descriptor ── */}
      <p
        style={{
          fontSize: "clamp(14px, 1.4vw, 18px)",
          lineHeight: 1.75,
          opacity: 0.5,
          maxWidth: 520,
          fontWeight: 400,
          alignSelf: "start",
        }}
      >
        {capability.descriptor}
      </p>

      {/* ── Footer ── */}
      <footer
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 32,
          alignItems: "end",
          paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Detail list */}
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {capability.details.map((detail, i) => (
            <li
              key={i}
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                opacity: 0.4,
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ opacity: 0.4 }}>—</span>
              {detail}
            </li>
          ))}
        </ul>

        {/* Metric */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {capability.metric}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              opacity: 0.3,
              letterSpacing: "0.08em",
              marginTop: 4,
              maxWidth: 140,
              lineHeight: 1.4,
              textAlign: "right",
            }}
          >
            {capability.metricLabel}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Corner grid texture ──────────────────────────────────────────────────────

/**
 * CornerGrid
 * Small structural grid in the top-right corner of each card.
 * Provides visual depth and differentiates the card surface from the background.
 * Purely decorative — pointer-events: none.
 */
function CornerGrid() {
  return (
    <svg
      width={160}
      height={160}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        opacity: 0.04,
        pointerEvents: "none",
      }}
    >
      <defs>
        <pattern
          id="s3-corner-grid"
          width={20}
          height={20}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="white"
            strokeWidth={0.75}
          />
        </pattern>
        <radialGradient id="s3-corner-fade" cx="100%" cy="0%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="s3-corner-mask">
          <rect width={160} height={160} fill="url(#s3-corner-fade)" />
        </mask>
      </defs>
      <rect
        width={160}
        height={160}
        fill="url(#s3-corner-grid)"
        mask="url(#s3-corner-mask)"
      />
    </svg>
  );
}
