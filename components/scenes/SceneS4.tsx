"use client";

/**
 * SceneS4 — Relationship Formation
 *
 * ─── Concept ─────────────────────────────────────────────────────────────────
 *
 * "Most businesses have disconnected ingredients. Website. Automation.
 *  AI. Brand. Growth. They exist independently."
 *
 * Five geometric ingredient tokens float with autonomous orbital motion in
 * an over-wide field (280vw). Vertical scroll drives a horizontal translateX
 * of the field, so the user pans through the ingredient world.
 *
 * As the pan progresses, three things happen:
 *   1. Orbital amplitude damps (ingredients stop wandering, begin settling)
 *   2. SVG connection lines draw between affinity pairs (stroke-dashoffset → 0)
 *   3. Ingredients converge toward pre-pair cluster positions
 *
 * At the end of S4, all connections are drawn. The ingredients are near their
 * pairs. The assembly has not begun — that is S5's job.
 *
 * ─── DOM Architecture ────────────────────────────────────────────────────────
 *
 * Two-layer motion strategy to avoid property conflicts:
 *
 *   #s4-field        (translateX driven by GSAP ← scroll)
 *     #s4-lines      (SVG layer, absolute, dashoffset driven by GSAP)
 *     .token-orbit   (CSS @keyframes orbit — looping autonomously)
 *       .token-shape (pure presentational — shape SVG)
 *       .token-label (name + descriptor)
 *
 * GSAP never touches the orbit transforms. CSS never touches field position.
 * The orbit amplitude is modulated via a CSS custom property --amp that GSAP
 * interpolates from 1→0. @keyframes use calc(var(--amp) * N px) so the
 * amplitude shrinks as --amp approaches 0.
 *
 * ─── Timeline structure ──────────────────────────────────────────────────────
 *
 * Total scroll budget: PIN_VH = 2.8 (280vh).
 * The master GSAP scrub timeline has three concurrent tracks:
 *
 * Track A — Field pan: translateX 0 → -(FIELD_W - 100vw) across full range
 * Track B — Orbit damping: CSS --amp 1→0 between progress 0.0 and 0.70
 * Track C — Ingredient convergence: each ingredient lerps toward its cluster
 *           position between progress 0.40 and 1.0
 * Track D — Connection line draw: dashoffset totalLen→0 for each line
 *           Line 1 (Automation↔AI):   progress 0.35→0.65
 *           Line 2 (Website↔Brand):   progress 0.50→0.80
 *           Line 3 (Growth↔center):   progress 0.65→0.90 (partial — dotted)
 *
 * All tracks use ease:"none" — the scrub is the easing.
 *
 * ─── Ingredient free-state positions ─────────────────────────────────────────
 *
 * Each ingredient has a "home" position relative to its column in the field.
 * The field is divided into 5 columns (each 56vw wide).
 * Ingredients are offset vertically so they don't sit on a line.
 *
 *  Col 0 (Website):     x=~10%,  y=~45vh    (slightly behind, left)
 *  Col 1 (Brand):       x=~28%,  y=~35vh    (center-ish, high)
 *  Col 2 (Automation):  x=~48%,  y=~55vh    (center, low)
 *  Col 3 (AI):          x=~62%,  y=~40vh    (right-center)
 *  Col 4 (Growth):      x=~80%,  y=~30vh    (far right, high — output)
 *
 * Cluster targets (where they converge at S4 end):
 *  Website + Brand → both move toward x=20%, y=50vh
 *  Automation + AI → both move toward x=60%, y=50vh
 *  Growth stays at x=80%, y=35vh (it doesn't pair yet)
 *
 * ─── Scrub rule reminder ─────────────────────────────────────────────────────
 *
 * All GSAP tweens in this scene use ease:"none".
 * The smoothing comes from Lenis + SCRUB_SMOOTHING (1.2s lag).
 */

import React, { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_VH = 2.8;

// Field is wider than viewport — this creates the horizontal journey
// Expressed as a percentage of viewport width
const FIELD_VW = 280;

// ─── Ingredient definitions ───────────────────────────────────────────────────

interface IngredientDef {
  id: string;
  label: string;
  descriptor: string;
  // Position as % of field width (x) and % of viewport height (y)
  homeX: number; // % of field width
  homeY: number; // vh
  // Target position when clustering (S4 end)
  clusterX: number; // % of field width
  clusterY: number; // vh
  // Depth scale — simulates Z position
  depthScale: number;
  // Orbit animation CSS class applied to the orbit wrapper
  orbitClass: string;
}

const INGREDIENTS: IngredientDef[] = [
  {
    id: "website",
    label: "Website",
    descriptor: "The surface",
    homeX: 7,
    homeY: 42,
    clusterX: 17,
    clusterY: 48,
    depthScale: 0.95, // slightly behind
    orbitClass: "orbit-lemniscate",
  },
  {
    id: "brand",
    label: "Brand",
    descriptor: "The core",
    homeX: 24,
    homeY: 33,
    clusterX: 22,
    clusterY: 52,
    depthScale: 1.0, // neutral reference
    orbitClass: "orbit-breathe",
  },
  {
    id: "automation",
    label: "Automation",
    descriptor: "The process",
    homeX: 47,
    homeY: 54,
    clusterX: 55,
    clusterY: 48,
    depthScale: 1.02, // very slightly in front
    orbitClass: "orbit-spin",
  },
  {
    id: "ai",
    label: "AI",
    descriptor: "The intelligence",
    homeX: 63,
    homeY: 38,
    clusterX: 60,
    clusterY: 52,
    depthScale: 0.97, // slightly behind automation
    orbitClass: "orbit-drift",
  },
  {
    id: "growth",
    label: "Growth",
    descriptor: "The output",
    homeX: 79,
    homeY: 28,
    clusterX: 79,
    clusterY: 33,
    depthScale: 1.08, // furthest forward
    orbitClass: "orbit-rise",
  },
];

// ─── Connection line definitions ──────────────────────────────────────────────
// Each line is a cubic bezier between two ingredient home positions.
// The path is defined in field-percentage coordinates, then converted to SVG.

interface ConnectionLine {
  id: string;
  fromId: string;
  toId: string;
  // When this line draws: progress range [start, end]
  drawStart: number;
  drawEnd: number;
  // Is this a partial "hint" line (dotted, reaches only 60%)
  partial: boolean;
  partialEnd?: number; // fraction of path that actually draws
}

const CONNECTION_LINES: ConnectionLine[] = [
  {
    id: "line-automation-ai",
    fromId: "automation",
    toId: "ai",
    drawStart: 0.35,
    drawEnd: 0.65,
    partial: false,
  },
  {
    id: "line-website-brand",
    fromId: "website",
    toId: "brand",
    drawStart: 0.50,
    drawEnd: 0.80,
    partial: false,
  },
  {
    id: "line-growth-center",
    fromId: "growth",
    toId: "growth", // points toward center — special case handled separately
    drawStart: 0.65,
    drawEnd: 0.90,
    partial: true,
    partialEnd: 0.6,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SceneS4() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tokenWrapRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lineRefs = useRef<Record<string, SVGPathElement | null>>({});
  const progressBarRef = useRef<HTMLDivElement>(null);
  const phaseTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGSAP();

    const container = containerRef.current;
    const field = fieldRef.current;
    const svg = svgRef.current;
    if (!container || !field || !svg) return;

    // ── Compute field pixel dimensions ────────────────────────────────────
    // We need these to set the SVG viewBox and calculate line endpoints.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fieldW = (FIELD_VW / 100) * vw;
    const maxPanX = -(fieldW - vw);

    // Update SVG viewBox to match field dimensions
    svg.setAttribute("viewBox", `0 0 ${fieldW} ${vh}`);
    svg.style.width = `${fieldW}px`;
    svg.style.height = `${vh}px`;

    // ── Set initial ingredient positions via GSAP ──────────────────────────
    // We must set positions imperatively so GSAP owns the x/y state.
    // CSS positions the orbit-wrapper at 0,0 — GSAP places it at homeX/Y.
    INGREDIENTS.forEach((def) => {
      const wrap = tokenWrapRefs.current[def.id];
      if (!wrap) return;

      gsap.set(wrap, {
        x: (def.homeX / 100) * fieldW,
        y: (def.homeY / 100) * vh,
        scale: def.depthScale,
        willChange: "transform",
      });
    });

    // ── Compute SVG line endpoints and total path lengths ─────────────────
    // For each connection line, build the cubic bezier path string and measure it.
    const lineData: Record<string, {
      path: string;
      length: number;
    }> = {};

    const getIngredientCenter = (id: string) => {
      const def = INGREDIENTS.find((d) => d.id === id);
      if (!def) return { x: 0, y: 0 };
      return {
        x: (def.homeX / 100) * fieldW,
        y: (def.homeY / 100) * vh,
      };
    };

    CONNECTION_LINES.forEach((line) => {
      const pathEl = lineRefs.current[line.id];
      if (!pathEl) return;

      if (line.id === "line-growth-center") {
        // Growth → convergence center (a point between the two pairs)
        const from = getIngredientCenter("growth");
        // Target: midpoint between the two pair clusters
        const targetX = ((17 + 55) / 2 / 100) * fieldW;
        const targetY = 0.50 * vh;
        const midX = (from.x + targetX) / 2;
        const midY = from.y - 40; // arc upward
        const pathStr = `M ${from.x} ${from.y} Q ${midX} ${midY} ${targetX} ${targetY}`;
        pathEl.setAttribute("d", pathStr);
      } else {
        const from = getIngredientCenter(line.fromId);
        const to = getIngredientCenter(line.toId);
        // Cubic bezier with gentle arc — control points offset perpendicular to the line
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        // Perpendicular offset for the arc
        const nx = -dy / len * (len * 0.18);
        const ny = dx / len * (len * 0.18);
        const c1x = from.x + dx * 0.33 + nx;
        const c1y = from.y + dy * 0.33 + ny;
        const c2x = from.x + dx * 0.67 - nx;
        const c2y = from.y + dy * 0.67 - ny;
        const pathStr = `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
        pathEl.setAttribute("d", pathStr);
      }

      // Measure the path length for dashoffset animation
      const length = pathEl.getTotalLength();
      lineData[line.id] = {
        path: pathEl.getAttribute("d") || "",
        length,
      };

      // Set initial state: fully hidden (dashoffset = totalLength)
      gsap.set(pathEl, {
        strokeDasharray: length,
        strokeDashoffset: length,
        opacity: 0,
      });
    });

    // ── Master scrub timeline ──────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // ── Track A: Field pan ─────────────────────────────────────────────────
    // The field translates from x=0 to x=maxPanX across the full scroll range.
    // This is the horizontal journey — vertical scroll = horizontal movement.
    tl.fromTo(
      field,
      { x: 0 },
      { x: maxPanX, duration: 1 },
      0
    );

    // ── Track B: Orbit amplitude damping ──────────────────────────────────
    // Each orbit wrapper has a CSS custom property --amp that controls
    // how far the keyframe animation moves the token.
    // We animate it from 1 (full orbit) to 0 (stationary) via GSAP.
    INGREDIENTS.forEach((def) => {
      const wrap = tokenWrapRefs.current[def.id];
      if (!wrap) return;

      tl.fromTo(
        wrap,
        { "--amp": 1 } as gsap.TweenVars,
        { "--amp": 0, duration: 0.70 } as gsap.TweenVars,
        0 // starts at the beginning
      );
    });

    // ── Track C: Convergence — ingredients move toward cluster positions ───
    // Starts at progress 0.40, ends at 1.0 (duration = 0.60)
    INGREDIENTS.forEach((def) => {
      const wrap = tokenWrapRefs.current[def.id];
      if (!wrap) return;

      const fromX = (def.homeX / 100) * fieldW;
      const fromY = (def.homeY / 100) * vh;
      const toX = (def.clusterX / 100) * fieldW;
      const toY = (def.clusterY / 100) * vh;

      tl.fromTo(
        wrap,
        { x: fromX, y: fromY },
        { x: toX, y: toY, duration: 0.60 },
        0.40 // starts at 40% through the scroll range
      );
    });

    // ── Track D: Connection line drawing ──────────────────────────────────
    CONNECTION_LINES.forEach((line) => {
      const pathEl = lineRefs.current[line.id];
      const data = lineData[line.id];
      if (!pathEl || !data) return;

      const dur = line.drawEnd - line.drawStart;

      // Fade the line in as it starts drawing
      tl.to(
        pathEl,
        { opacity: line.partial ? 0.25 : 0.45, duration: 0.03 },
        line.drawStart
      );

      // Draw the line by animating dashoffset from totalLength to 0
      // For partial lines, only draw to partialEnd fraction of the path
      const targetOffset = line.partial
        ? data.length * (1 - (line.partialEnd ?? 0.6))
        : 0;

      tl.fromTo(
        pathEl,
        { strokeDashoffset: data.length },
        { strokeDashoffset: targetOffset, duration: dur },
        line.drawStart
      );
    });

    // ── Track E: Cluster label + connection strength glow ─────────────────
    // At progress 0.75+, show faint cluster label text
    // (done via opacity on the label group elements)
    const clusterLabels = field.querySelectorAll<HTMLElement>(".cluster-label");
    if (clusterLabels.length > 0) {
      tl.fromTo(
        Array.from(clusterLabels),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.15, stagger: 0.05 },
        0.78
      );
    }

    // ── Attach ScrollTrigger to the timeline ──────────────────────────────
    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: `+=${PIN_VH * 100}%`,
      scrub: SCRUB_SMOOTHING,
      animation: tl,
      onUpdate: (self) => {
        // Progress bar — direct DOM mutation
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${self.progress})`;
        }

        // Phase text — describes what's happening at each stage
        if (phaseTextRef.current) {
          let phase = "Independent";
          if (self.progress > 0.35) phase = "Connecting";
          if (self.progress > 0.65) phase = "Clustering";
          if (self.progress > 0.88) phase = "Ready";
          phaseTextRef.current.textContent = phase;
        }
      },
    });

    // ── Handle window resize ───────────────────────────────────────────────
    // On resize, we need to recalculate positions.
    // The cleanest approach: kill and re-init the ScrollTrigger.
    // We use a debounced flag rather than re-running the whole effect.
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === container) st.kill();
      });
      tl.kill();
      // Reset will-change
      INGREDIENTS.forEach((def) => {
        const wrap = tokenWrapRefs.current[def.id];
        if (wrap) gsap.set(wrap, { willChange: "auto" });
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="s4-container"
      style={{
        height: `${PIN_VH * 100}vh`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Sticky frame — stays in viewport ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── Section label (fixed top-right, not part of the field) ── */}
        <SceneLabel progressBarRef={progressBarRef} phaseTextRef={phaseTextRef} />

        {/* ── The field — wider than viewport, pans horizontally ── */}
        <div
          ref={fieldRef}
          id="s4-field"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${FIELD_VW}vw`,
            height: "100vh",
            willChange: "transform",
          }}
        >
          {/* ── CSS orbit animations ── */}
          <S4Styles />

          {/* ── SVG connection lines layer ── */}
          <svg
            ref={svgRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              zIndex: 1,
              overflow: "visible",
            }}
          >
            {CONNECTION_LINES.map((line) => (
              <path
                key={line.id}
                ref={(el) => { lineRefs.current[line.id] = el; }}
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={line.partial ? 0.5 : 0.75}
                strokeLinecap="round"
                strokeDasharray="none"
                strokeDashoffset="0"
                style={{
                  ...(line.partial
                    ? { strokeDasharray: "3 5" }
                    : {}),
                }}
              />
            ))}
          </svg>

          {/* ── Ingredient tokens ── */}
          {INGREDIENTS.map((def) => (
            <IngredientToken
              key={def.id}
              def={def}
              ref={(el) => { tokenWrapRefs.current[def.id] = el; }}
            />
          ))}

          {/* ── Cluster labels (appear at end of S4) ── */}
          <ClusterLabel
            text="Intelligent Workflow"
            x={57.5}
            y={62}
            fieldVw={FIELD_VW}
          />
          <ClusterLabel
            text="Conversion Surface"
            x={19.5}
            y={62}
            fieldVw={FIELD_VW}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Scene label ──────────────────────────────────────────────────────────────

function SceneLabel({
  progressBarRef,
  phaseTextRef,
}: {
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  phaseTextRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 64,
        right: 64,
        zIndex: 20,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        pointerEvents: "none",
      }}
    >
      {/* Left: scene ID */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.25,
          }}
        >
          S4 · Relationship Formation
        </span>
        {/* Progress bar */}
        <div
          style={{
            width: 120,
            height: 1,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            ref={progressBarRef}
            style={{
              height: "100%",
              background: "rgba(255,255,255,0.4)",
              transformOrigin: "left center",
              transform: "scaleX(0)",
            }}
          />
        </div>
      </div>

      {/* Right: current phase */}
      <span
        ref={phaseTextRef}
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.25,
        }}
      >
        Independent
      </span>
    </div>
  );
}

// ─── Ingredient token ─────────────────────────────────────────────────────────

/**
 * IngredientToken
 *
 * Two-layer structure:
 *   outer div (tokenWrapRefs target) — GSAP owns x, y, scale
 *   inner div (.orbit-{class})       — CSS @keyframes orbit
 *   inner SVG                        — the geometric shape
 *   label div                        — name + descriptor
 *
 * GSAP operates on the outer wrapper (position/scale).
 * CSS operates on the inner wrapper (orbital wiggle).
 * They never touch the same element.
 *
 * The --amp custom property on the outer wrapper is read by the inner
 * CSS animation via `calc(var(--amp, 1) * Xpx)`.
 */
const IngredientToken = React.forwardRef<HTMLDivElement, {
  def: IngredientDef;
}>(({ def }, ref) => {
  return (
    // Outer: GSAP-owned position
    <div
      ref={ref}
      id={`token-wrap-${def.id}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        // --amp is set to 1 initially; GSAP animates it to 0
        ["--amp" as string]: "1",
        zIndex: Math.round(def.depthScale * 10),
      }}
    >
      {/* Inner: CSS orbit animation */}
      <div
        className={`token-orbit ${def.orbitClass}`}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* The geometric shape */}
        <IngredientShape id={def.id} scale={def.depthScale} />

        {/* Label */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.55,
            }}
          >
            {def.label}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.08em",
              opacity: 0.25,
            }}
          >
            {def.descriptor}
          </span>
        </div>
      </div>
    </div>
  );
});

IngredientToken.displayName = "IngredientToken";

// ─── Ingredient shapes ────────────────────────────────────────────────────────

/**
 * IngredientShape
 * Renders the correct geometric form for each ingredient.
 * Shapes are purely visual — no animation state, no interaction.
 * They inherit the orbital motion from the parent.
 */
function IngredientShape({ id, scale }: { id: string; scale: number }) {
  // Size adjusted by depth scale so farther ingredients appear smaller
  const size = Math.round(64 * scale);

  switch (id) {
    case "website":
      return <WebsiteShape size={size} />;
    case "brand":
      return <BrandShape size={size} />;
    case "automation":
      return <AutomationShape size={size} />;
    case "ai":
      return <AIShape size={size} />;
    case "growth":
      return <GrowthShape size={size} />;
    default:
      return null;
  }
}

// ── Website: thin 16:9 rectangle with scanlines ───────────────────────────────

function WebsiteShape({ size }: { size: number }) {
  const w = size * 1.5;
  const h = size * 0.9;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Outer frame */}
      <rect
        x={0.75}
        y={0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={3}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1}
      />
      {/* Header bar */}
      <line
        x1={0.75}
        y1={h * 0.22}
        x2={w - 0.75}
        y2={h * 0.22}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={0.5}
      />
      {/* Scanlines */}
      {[0.38, 0.52, 0.66, 0.80].map((t, i) => (
        <line
          key={i}
          x1={w * 0.08}
          y1={h * t}
          x2={w * (0.08 + 0.28 + i * 0.06)}
          y2={h * t}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={0.5}
        />
      ))}
      {/* 3 nav dots in header */}
      {[0.10, 0.17, 0.24].map((t, i) => (
        <circle
          key={i}
          cx={w * t}
          cy={h * 0.11}
          r={1.5}
          fill="rgba(255,255,255,0.2)"
        />
      ))}
    </svg>
  );
}

// ── Brand: bold circle with breathing rings ───────────────────────────────────

function BrandShape({ size }: { size: number }) {
  const r = size / 2;
  return (
    <svg
      width={size + 24}
      height={size + 24}
      viewBox={`${-12} ${-12} ${size + 24} ${size + 24}`}
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Outer pulse ring */}
      <circle
        cx={r}
        cy={r}
        r={r + 8}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.75}
        strokeDasharray="2 4"
      />
      {/* Mid echo ring */}
      <circle
        cx={r}
        cy={r}
        r={r * 0.75}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.5}
      />
      {/* Main circle — heaviest stroke */}
      <circle
        cx={r}
        cy={r}
        r={r - 1}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={1.5}
      />
      {/* Nucleus dot */}
      <circle
        cx={r}
        cy={r}
        r={3.5}
        fill="rgba(255,255,255,0.4)"
      />
    </svg>
  );
}

// ── Automation: ring with tick marks and arc progress ────────────────────────

function AutomationShape({ size }: { size: number }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  // 8 tick marks at cardinal + intercardinal positions
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const inner = r - 8;
    const outer = r - 2;
    return {
      x1: cx + Math.cos(angle) * inner,
      y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * outer,
      y2: cy + Math.sin(angle) * outer,
    };
  });

  // Arc: top → right (progress indicator, ~90deg)
  const arcR = r - 1;
  const arcStartX = cx;
  const arcStartY = cy - arcR;
  const arcEndX = cx + arcR;
  const arcEndY = cy;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Inner echo ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.72}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={0.4}
      />
      {/* Main ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r - 1}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={1}
      />
      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
          strokeLinecap="round"
        />
      ))}
      {/* Arc progress indicator — heavier stroke, quarter circle */}
      <path
        d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY}`}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── AI: irregular polygon with neural dot cluster ─────────────────────────────

function AIShape({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  // 7 vertices with deliberate irregularity — not a regular polygon
  const radii = [0.92, 0.82, 0.95, 0.78, 0.90, 0.85, 0.93];
  const vertices = radii.map((r, i) => {
    const angle = (i / radii.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * r * (size / 2 - 4),
      y: cy + Math.sin(angle) * r * (size / 2 - 4),
    };
  });
  const polyPoints = vertices.map((v) => `${v.x},${v.y}`).join(" ");

  // Neural dots — small scattered cluster inside
  const dots = [
    { x: cx, y: cy - 4 },
    { x: cx + 9, y: cy + 6 },
    { x: cx - 8, y: cy + 7 },
    { x: cx + 3, y: cy + 16 },
    { x: cx - 4, y: cy + 16 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Main polygon */}
      <polygon
        points={polyPoints}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1}
        fill="none"
      />
      {/* Connection lines between dots */}
      {dots.slice(0, -1).map((d, i) => (
        <line
          key={i}
          x1={d.x}
          y1={d.y}
          x2={dots[i + 1].x}
          y2={dots[i + 1].y}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={0.4}
        />
      ))}
      <line
        x1={dots[0].x}
        y1={dots[0].y}
        x2={dots[2].x}
        y2={dots[2].y}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={0.4}
      />
      {/* Dots */}
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={i === 0 ? 2.5 : 1.5}
          fill={`rgba(255,255,255,${i === 0 ? 0.45 : 0.25})`}
        />
      ))}
    </svg>
  );
}

// ── Growth: upward chevron with velocity lines ────────────────────────────────

function GrowthShape({ size }: { size: number }) {
  const w = size * 0.85;
  const h = size * 0.75;
  const cx = w / 2;

  // Chevron: apex at top, two lower corners
  const apexX = cx;
  const apexY = 4;
  const leftX = 2;
  const leftY = h - 8;
  const rightX = w - 2;
  const rightY = h - 8;
  // Inner notch — makes it a chevron (not a solid triangle)
  const innerBottomY = h - 8;
  const innerApexY = h * 0.35;

  return (
    <svg
      width={w + 16}
      height={h + 28}
      viewBox={`${-8} ${-4} ${w + 16} ${h + 28}`}
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Chevron outline */}
      <path
        d={`M ${apexX} ${apexY} L ${rightX} ${rightY} L ${cx + 8} ${innerBottomY} L ${cx} ${innerApexY} L ${cx - 8} ${innerBottomY} L ${leftX} ${leftY} Z`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* Velocity lines below — three vertical bars */}
      {[-8, 0, 8].map((offset, i) => (
        <line
          key={i}
          x1={cx + offset}
          y1={h + 8}
          x2={cx + offset}
          y2={h + 18 + (i === 1 ? 4 : 0)}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={0.75}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

// ─── Cluster label ────────────────────────────────────────────────────────────

function ClusterLabel({
  text,
  x,
  y,
  fieldVw,
}: {
  text: string;
  x: number;
  y: number;
  fieldVw: number;
}) {
  return (
    <div
      className="cluster-label"
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}vh`,
        transform: "translateX(-50%)",
        fontFamily: "monospace",
        fontSize: 9,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        opacity: 0, // driven to 1 by GSAP
        color: "rgba(255,255,255,0.5)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {text}
    </div>
  );
}

// ─── CSS orbit animations ─────────────────────────────────────────────────────

/**
 * S4Styles
 *
 * CSS @keyframes for each ingredient's orbital personality.
 * Each animation uses calc(var(--amp, 1) * Xpx) so GSAP can
 * damp the amplitude by animating --amp from 1→0.
 *
 * When --amp reaches 0, the ingredient stops moving.
 *
 * CRITICAL: these animations apply to .token-orbit children
 * of the outer GSAP-owned wrapper. They animate translate()
 * on the inner wrapper — GSAP animates x/y on the outer wrapper.
 * These are separate DOM nodes targeting separate CSS properties.
 *
 * Animation personalities:
 *   lemniscate — Website: slow figure-8 horizontal path
 *   breathe    — Brand:   scale pulse, stays in place
 *   spin       — Automation: slow clockwise self-rotation
 *   drift      — AI:     organic bezier drift (approximated with keyframes)
 *   rise       — Growth: slow upward drift that loops
 */
function S4Styles() {
  return (
    <style>{`
      /* ── Lemniscate (Website) ── */
      @keyframes lemniscate {
        0%   { transform: translate(calc(var(--amp, 1) * 0px),   calc(var(--amp, 1) * 0px)); }
        25%  { transform: translate(calc(var(--amp, 1) * 28px),  calc(var(--amp, 1) * -10px)); }
        50%  { transform: translate(calc(var(--amp, 1) * 0px),   calc(var(--amp, 1) * 0px)); }
        75%  { transform: translate(calc(var(--amp, 1) * -28px), calc(var(--amp, 1) * 10px)); }
        100% { transform: translate(calc(var(--amp, 1) * 0px),   calc(var(--amp, 1) * 0px)); }
      }
      .orbit-lemniscate {
        animation: lemniscate 9s ease-in-out infinite;
        transform-origin: center center;
      }

      /* ── Breathe (Brand) — stays centered, scale only ── */
      @keyframes breathe {
        0%,100% { transform: scale(calc(1 + var(--amp, 1) * 0.0)); }
        50%     { transform: scale(calc(1 + var(--amp, 1) * 0.06)); }
      }
      .orbit-breathe {
        animation: breathe 4s ease-in-out infinite;
        transform-origin: center center;
      }

      /* ── Spin (Automation) — clockwise self-rotation with orbital drift ── */
      @keyframes spin-orbit {
        0%   { transform: translate(calc(var(--amp, 1) * 0px),    calc(var(--amp, 1) * 0px))    rotate(0deg); }
        25%  { transform: translate(calc(var(--amp, 1) * 14px),   calc(var(--amp, 1) * -8px))   rotate(90deg); }
        50%  { transform: translate(calc(var(--amp, 1) * 0px),    calc(var(--amp, 1) * 0px))    rotate(180deg); }
        75%  { transform: translate(calc(var(--amp, 1) * -14px),  calc(var(--amp, 1) * 8px))    rotate(270deg); }
        100% { transform: translate(calc(var(--amp, 1) * 0px),    calc(var(--amp, 1) * 0px))    rotate(360deg); }
      }
      .orbit-spin {
        animation: spin-orbit 12s linear infinite;
        transform-origin: center center;
      }

      /* ── Drift (AI) — irregular organic movement ── */
      @keyframes drift {
        0%   { transform: translate(calc(var(--amp, 1) * 0px),   calc(var(--amp, 1) * 0px)); }
        20%  { transform: translate(calc(var(--amp, 1) * 16px),  calc(var(--amp, 1) * -14px)); }
        45%  { transform: translate(calc(var(--amp, 1) * -10px), calc(var(--amp, 1) * 18px)); }
        70%  { transform: translate(calc(var(--amp, 1) * 20px),  calc(var(--amp, 1) * 8px)); }
        85%  { transform: translate(calc(var(--amp, 1) * -16px), calc(var(--amp, 1) * -6px)); }
        100% { transform: translate(calc(var(--amp, 1) * 0px),   calc(var(--amp, 1) * 0px)); }
      }
      .orbit-drift {
        animation: drift 10s ease-in-out infinite;
        transform-origin: center center;
      }

      /* ── Rise (Growth) — slow upward drift that loops ── */
      @keyframes rise {
        0%   { transform: translate(calc(var(--amp, 1) * 0px),   calc(var(--amp, 1) * 0px)); }
        40%  { transform: translate(calc(var(--amp, 1) * 6px),   calc(var(--amp, 1) * -20px)); }
        60%  { transform: translate(calc(var(--amp, 1) * -4px),  calc(var(--amp, 1) * -18px)); }
        100% { transform: translate(calc(var(--amp, 1) * 0px),   calc(var(--amp, 1) * 0px)); }
      }
      .orbit-rise {
        animation: rise 5s ease-in-out infinite;
        transform-origin: center bottom;
      }

      /* ── Hover brightening ── */
      #s4-field .token-orbit:hover .ingredient-shape {
        filter: brightness(1.6);
        transition: filter 120ms ease;
      }
    `}</style>
  );
}
