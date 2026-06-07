"use client";

/**
 * SceneS5 — Transformation
 *
 * ─── Narrative ───────────────────────────────────────────────────────────────
 *
 * S4 left two weak, unnamed signals: Trust (Website+Brand) and Efficiency
 * (Automation+AI). Growth had begun awakening in response. S5 transforms
 * those relationships into named, measurable outcomes and shows Growth
 * evolving continuously as each outcome strengthens.
 *
 * Phase 1 (progress 0.00–0.42): Automation+AI combine fully.
 *   Efficiency signal strengthens (arc closes: 270°→345°, strokeWidth grows).
 *   Label "Efficiency" wipes in. Metric "80%" wipes in.
 *   Three consequence bars draw for Efficiency outcomes.
 *   Growth beam extends, tick 3 reveals.
 *
 * Phase 2 (progress 0.40–0.85): Website+Brand combine fully.
 *   Trust signal strengthens (diamond fills, strokeWidth grows, scale to 1.0).
 *   Label "Trust" wipes in. Metric "3.4×" wipes in.
 *   Three consequence bars draw for Trust outcomes.
 *   Growth beam extends further, tick 4 reveals, flare intensifies.
 *
 * Phase 3 (progress 0.80–1.00): Cross-influence. Growth surge.
 *   A bridge line draws between Trust and Efficiency signals.
 *   A Results node materializes at the bridge midpoint (scale 0→1).
 *   Two dashed connectors draw upward to Growth.
 *   Growth beam reaches full height, flare reaches full brightness.
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 *
 * One full-viewport SVG layer owns all lines and bars:
 *   - Two inherited S4 connection lines (fade as pairs merge)
 *   - Six outcome measurement bars (stroke-dashoffset draw)
 *   - Cross-influence bridge (stroke-dashoffset draw)
 *   - Two Growth connectors (stroke-dashoffset draw)
 *
 * Ingredient wrappers (GSAP-owned x/y) move ingredients to merged positions.
 * Signal cluster divs (absolutely positioned) hold the diamond + arc SVGs.
 * Growth has its own dedicated SVG with animatable beam, flare, and ticks.
 *
 * ─── "No opacity-fade storytelling" ─────────────────────────────────────────
 *
 * Every appearance uses a primary geometric mechanism:
 *   Text labels → clip-path inset wipe (left-to-right)
 *   Outcome bars → stroke-dashoffset draw
 *   Trust signal → scale increase + strokeWidth increase + diamond fill reveal
 *   Efficiency signal → arc closing (dashoffset) + strokeWidth increase
 *   Growth beam → y1 attribute animation (beam extends upward)
 *   Results node → scale 0→1 (grows from nothing)
 *   Inherited lines → opacity fade (appropriate: gap closed, bridge no longer needed)
 *
 * ─── Scrub rule ──────────────────────────────────────────────────────────────
 *
 * All GSAP tweens: ease:"none". All reversible. No React state in scroll loop.
 * No time-based sequences. Scroll position is the only clock.
 */

import React, { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_VH = 2.0;

// ─── Position system (percentage of viewport) ─────────────────────────────────

const PCT = {
  // S4 cluster end positions — where ingredients START in S5
  automation: { x: 0.60, y: 0.38 },
  ai:         { x: 0.68, y: 0.52 },
  website:    { x: 0.24, y: 0.36 },
  brand:      { x: 0.34, y: 0.50 },
  growth:     { x: 0.50, y: 0.13 },

  // S5 combined target positions
  autoMerged:  { x: 0.62, y: 0.44 },
  aiMerged:    { x: 0.62, y: 0.44 },
  webMerged:   { x: 0.27, y: 0.44 },
  brandMerged: { x: 0.36, y: 0.44 },

  // Signal cluster centers (where Trust diamond + Efficiency arc appear)
  trustCenter: { x: 0.32, y: 0.62 },
  effCenter:   { x: 0.62, y: 0.62 },

  // Results node at cross-influence bridge midpoint
  resultsNode: { x: 0.47, y: 0.50 },
};

// ─── Outcome bar definitions ──────────────────────────────────────────────────
// Positions as percentage of viewport; widths as percentage of viewport width.

const TRUST_BARS = [
  { id: "bar-t-0", label: "Higher Conversion",    x: 0.22, y: 0.72, w: 0.13 },
  { id: "bar-t-1", label: "Brand Recall",          x: 0.22, y: 0.78, w: 0.09 },
  { id: "bar-t-2", label: "Customer Confidence",   x: 0.22, y: 0.84, w: 0.16 },
];

const EFF_BARS = [
  { id: "bar-e-0", label: "Hours Saved",           x: 0.55, y: 0.72, w: 0.12 },
  { id: "bar-e-1", label: "Response Time",          x: 0.55, y: 0.78, w: 0.08 },
  { id: "bar-e-2", label: "Operational Load",       x: 0.55, y: 0.84, w: 0.14 },
];

// ─── Growth SVG constants ─────────────────────────────────────────────────────
// These values are in the Growth SVG coordinate space (viewBox: 60×140).

const GROWTH_SVG = {
  cx: 30,           // horizontal center
  beamBase: 128,    // y2 — base of beam (fixed)
  beamApex: 20,     // y1 when fully extended
  beamY1_S4: 47,    // y1 at S4 end state (75% extended) = 128 - 0.75*(128-20)
  flareR: 6,        // flare circle radius
  flareCY: 18,      // flare circle center y
  tickPositions: [112, 92, 68, 40],  // y positions for 4 ticks (bottom→top)
};

// ─── Efficiency arc constants ─────────────────────────────────────────────────
const ARC_R = 22;
const ARC_C = 2 * Math.PI * ARC_R;          // ≈138.23
const ARC_DASHOFFSET_S4  = ARC_C * 90  / 360; // 270° drawn → offset = 34.56
const ARC_DASHOFFSET_S5  = ARC_C * 15  / 360; // 345° drawn → offset = 5.76

// ─── Component ────────────────────────────────────────────────────────────────

export function SceneS5() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);

  // Ingredient wrapper refs (GSAP x/y)
  const ingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Signal cluster refs
  const trustClusterRef = useRef<HTMLDivElement>(null);
  const effClusterRef   = useRef<HTMLDivElement>(null);

  // Trust signal SVG elements
  const trustDiamondRef = useRef<SVGPathElement>(null);
  const trustFillRef    = useRef<SVGRectElement>(null);
  const trustLabelRef   = useRef<HTMLDivElement>(null);
  const trustMetricRef  = useRef<HTMLDivElement>(null);

  // Efficiency signal SVG elements
  const effArcRef    = useRef<SVGCircleElement>(null);
  const effLabelRef  = useRef<HTMLDivElement>(null);
  const effMetricRef = useRef<HTMLDivElement>(null);

  // Outcome bar refs (SVG paths)
  const trustBarRefs = useRef<(SVGLineElement | null)[]>([null, null, null]);
  const effBarRefs   = useRef<(SVGLineElement | null)[]>([null, null, null]);

  // Outcome label refs (HTML divs for clip-path)
  const trustLabelOutcomeRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const effLabelOutcomeRefs   = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  // Connection line refs (SVG paths)
  const lineAutoAIRef    = useRef<SVGPathElement>(null);
  const lineWebBrandRef  = useRef<SVGPathElement>(null);
  const lineBridgeRef    = useRef<SVGPathElement>(null);
  const lineTrustGRef    = useRef<SVGPathElement>(null);
  const lineEffGRef      = useRef<SVGPathElement>(null);

  // Growth SVG element refs
  const growthWrapRef  = useRef<HTMLDivElement>(null);
  const growthBeamRef  = useRef<SVGLineElement>(null);
  const growthFlareRef = useRef<SVGCircleElement>(null);
  const growthTickRefs = useRef<(SVGLineElement | null)[]>([null, null, null, null]);

  // Results node refs
  const resultsNodeRef = useRef<HTMLDivElement>(null);
  const resultsTextRef = useRef<HTMLDivElement>(null);

  // Progress UI
  const progressRef = useRef<HTMLDivElement>(null);
  const phaseRef    = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGSAP();

    const container = containerRef.current;
    const svg       = svgRef.current;
    if (!container || !svg) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Helper: percent → pixels
    const px = (pct: { x: number; y: number }) => ({
      x: pct.x * vw,
      y: pct.y * vh,
    });

    // ── SVG dimensions ────────────────────────────────────────────────────
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);

    // ── Set ingredient starting positions (S4 cluster end) ────────────────
    const setIng = (id: string, pct: { x: number; y: number }, scale = 1.0) => {
      const el = ingRefs.current[id];
      if (el) gsap.set(el, { x: pct.x * vw, y: pct.y * vh, scale, willChange: "transform" });
    };
    setIng("automation", PCT.automation, 1.02);
    setIng("ai",         PCT.ai,         0.97);
    setIng("website",    PCT.website,    0.95);
    setIng("brand",      PCT.brand,      1.00);
    setIng("growth",     PCT.growth,     1.08);

    // ── S4 inheritance: set signal states to S4 end values ────────────────
    // Trust cluster: opacity 0.15, scale 0.7, diamond outline only
    if (trustClusterRef.current) gsap.set(trustClusterRef.current, { scale: 0.7, opacity: 0.15 });
    if (trustDiamondRef.current) gsap.set(trustDiamondRef.current, { attr: { "stroke-width": 0.75 } });
    if (trustFillRef.current)    gsap.set(trustFillRef.current,    { clipPath: "inset(100%)" });
    if (trustLabelRef.current)   gsap.set(trustLabelRef.current,   { clipPath: "inset(0% 100% 0% 0%)" });
    if (trustMetricRef.current)  gsap.set(trustMetricRef.current,  { clipPath: "inset(100% 0% 0% 0%)" });

    // Efficiency cluster: opacity 0.15, scale 0.7, arc at 270°
    if (effClusterRef.current) gsap.set(effClusterRef.current, { scale: 0.7, opacity: 0.15 });
    if (effArcRef.current) {
      gsap.set(effArcRef.current, {
        strokeDasharray: ARC_C,
        strokeDashoffset: ARC_DASHOFFSET_S4,
        attr: { "stroke-width": 1 },
      });
    }
    if (effLabelRef.current)   gsap.set(effLabelRef.current,   { clipPath: "inset(0% 100% 0% 0%)" });
    if (effMetricRef.current)  gsap.set(effMetricRef.current,  { clipPath: "inset(100% 0% 0% 0%)" });

    // Growth: inherit S4 end state (beam 75%, flare 0.30, ticks 2/4)
    if (growthBeamRef.current)  gsap.set(growthBeamRef.current,  { attr: { y1: GROWTH_SVG.beamY1_S4 } });
    if (growthFlareRef.current) gsap.set(growthFlareRef.current, { scale: 0.6, transformOrigin: "center", opacity: 0.30 });
    growthTickRefs.current.forEach((el, i) => {
      if (el) gsap.set(el, { opacity: i < 2 ? 0.55 : 0 });
    });

    // Outcome bars and labels: hidden initially
    [...trustBarRefs.current, ...effBarRefs.current].forEach((el) => {
      if (el) gsap.set(el, { strokeDashoffset: (el.getTotalLength?.() ?? 120) });
    });
    [...trustLabelOutcomeRefs.current, ...effLabelOutcomeRefs.current].forEach((el) => {
      if (el) gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" });
    });

    // Results node: hidden
    if (resultsNodeRef.current) gsap.set(resultsNodeRef.current, { scale: 0, transformOrigin: "center" });
    if (resultsTextRef.current) gsap.set(resultsTextRef.current, { clipPath: "inset(0% 100% 0% 0%)" });

    // ── Build SVG paths for inherited connection lines ─────────────────────
    const buildCubic = (
      from: { x: number; y: number },
      to:   { x: number; y: number },
      arcFactor = 0.14
    ) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = (-dy / len) * len * arcFactor;
      const ny = ( dx / len) * len * arcFactor;
      return `M ${from.x} ${from.y} C ${from.x + dx * 0.35 + nx} ${from.y + dy * 0.35 + ny}, ${from.x + dx * 0.65 - nx} ${from.y + dy * 0.65 - ny}, ${to.x} ${to.y}`;
    };

    // Inherited S4 lines (start drawn, fade as pairs merge)
    const initLine = (el: SVGPathElement | null, d: string, opacity = 0.35) => {
      if (!el) return 0;
      el.setAttribute("d", d);
      const len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: 0, opacity });
      return len;
    };

    initLine(lineAutoAIRef.current,
      buildCubic(px(PCT.automation), px(PCT.ai), 0.10));
    initLine(lineWebBrandRef.current,
      buildCubic(px(PCT.website), px(PCT.brand), 0.10));

    // Cross-influence bridge: Trust ↔ Efficiency, arcs upward
    const trustC = px(PCT.trustCenter);
    const effC   = px(PCT.effCenter);
    const bridgeMid = { x: (trustC.x + effC.x) / 2, y: trustC.y - vh * 0.10 };
    const bridgeD = `M ${trustC.x} ${trustC.y} Q ${bridgeMid.x} ${bridgeMid.y} ${effC.x} ${effC.y}`;
    const bridgeLen = (() => {
      if (!lineBridgeRef.current) return 300;
      lineBridgeRef.current.setAttribute("d", bridgeD);
      return lineBridgeRef.current.getTotalLength();
    })();
    gsap.set(lineBridgeRef.current, { strokeDasharray: bridgeLen, strokeDashoffset: bridgeLen, opacity: 0 });

    // Growth connectors: Trust/Efficiency → Growth (draw upward)
    const growthC = px(PCT.growth);
    const resultsC = px(PCT.resultsNode);

    const initGrowthLine = (el: SVGPathElement | null, fromPct: { x: number; y: number }) => {
      if (!el) return;
      const from = px(fromPct);
      const d = buildCubic(from, growthC, 0.08);
      el.setAttribute("d", d);
      const len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    };
    initGrowthLine(lineTrustGRef.current, PCT.trustCenter);
    initGrowthLine(lineEffGRef.current,   PCT.effCenter);

    // Outcome bars: set dashoffset = their pixel length
    const initBar = (el: SVGLineElement | null) => {
      if (!el) return;
      const len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    };
    [...trustBarRefs.current, ...effBarRefs.current].forEach(initBar);

    // ── Master scrub timeline ──────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // ── Growth awakening — spans the ENTIRE scene ──────────────────────────
    // Beam extends from y1=47 to y1=20 across full 200vh
    tl.to(growthBeamRef.current, { attr: { y1: GROWTH_SVG.beamApex }, duration: 1.0 }, 0);

    // Flare: scale 0.6→1.0 + opacity 0.30→1.0
    tl.to(growthFlareRef.current, { scale: 1.0, opacity: 1.0, transformOrigin: "center", duration: 1.0 }, 0);

    // Tick 3 reveals at phase 1 midpoint
    tl.to(growthTickRefs.current[2], { opacity: 0.55, duration: 0.08 }, 0.22);

    // Tick 4 reveals at phase 2 midpoint
    tl.to(growthTickRefs.current[3], { opacity: 0.55, duration: 0.08 }, 0.65);

    // ── Phase 1: Automation + AI combine ──────────────────────────────────

    // AI converges to Automation center
    const aiStart   = px(PCT.ai);
    const aiMerged  = px(PCT.aiMerged);
    tl.fromTo(ingRefs.current["ai"]!,
      { x: aiStart.x,   y: aiStart.y },
      { x: aiMerged.x,  y: aiMerged.y, duration: 0.33 },
      0.02
    );
    // Automation micro-adjustment
    const autoStart  = px(PCT.automation);
    const autoMerged = px(PCT.autoMerged);
    tl.fromTo(ingRefs.current["automation"]!,
      { x: autoStart.x,   y: autoStart.y },
      { x: autoMerged.x,  y: autoMerged.y, duration: 0.28 },
      0.04
    );

    // Inherited Automation↔AI line fades as gap closes
    tl.to(lineAutoAIRef.current, { opacity: 0, duration: 0.22 }, 0.04);

    // Efficiency signal strengthens (primary: arc closes + strokeWidth + scale)
    tl.to(effClusterRef.current, { scale: 1.0, opacity: 0.85, duration: 0.18 }, 0.24);
    tl.to(effArcRef.current, {
      strokeDashoffset: ARC_DASHOFFSET_S5,
      attr: { "stroke-width": 1.75 },
      duration: 0.18,
    }, 0.22);

    // Efficiency label wipes in (left-to-right clip)
    tl.to(effLabelRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.09 }, 0.32);

    // Efficiency metric wipes in (bottom-to-top clip)
    tl.to(effMetricRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08 }, 0.34);

    // Efficiency outcome bars draw (stroke-dashoffset → 0)
    effBarRefs.current.forEach((el, i) => {
      if (el) tl.to(el, { strokeDashoffset: 0, duration: 0.07 }, 0.35 + i * 0.025);
    });

    // Efficiency outcome labels wipe (left-to-right)
    effLabelOutcomeRefs.current.forEach((el, i) => {
      if (el) tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.07 }, 0.34 + i * 0.025);
    });

    // ── Phase 2: Website + Brand combine ──────────────────────────────────

    const webStart    = px(PCT.website);
    const webMerged   = px(PCT.webMerged);
    const brandStart  = px(PCT.brand);
    const brandMerged = px(PCT.brandMerged);

    tl.fromTo(ingRefs.current["website"]!,
      { x: webStart.x,   y: webStart.y },
      { x: webMerged.x,  y: webMerged.y, duration: 0.33 },
      0.42
    );
    tl.fromTo(ingRefs.current["brand"]!,
      { x: brandStart.x,   y: brandStart.y },
      { x: brandMerged.x,  y: brandMerged.y, duration: 0.33 },
      0.42
    );

    // Inherited Website↔Brand line fades
    tl.to(lineWebBrandRef.current, { opacity: 0, duration: 0.22 }, 0.44);

    // Trust signal strengthens (primary: scale + strokeWidth + diamond fill)
    tl.to(trustClusterRef.current, { scale: 1.0, opacity: 0.85, duration: 0.18 }, 0.60);
    tl.to(trustDiamondRef.current, { attr: { "stroke-width": 1.75 }, duration: 0.18 }, 0.58);
    // Diamond interior fill reveals via clip-path (transformation, not fade)
    tl.to(trustFillRef.current, { clipPath: "inset(15%)", duration: 0.16 }, 0.62);

    // Trust label wipes in
    tl.to(trustLabelRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.09 }, 0.70);

    // Trust metric wipes in
    tl.to(trustMetricRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08 }, 0.72);

    // Trust outcome bars draw
    trustBarRefs.current.forEach((el, i) => {
      if (el) tl.to(el, { strokeDashoffset: 0, duration: 0.07 }, 0.73 + i * 0.025);
    });

    // Trust outcome labels wipe
    trustLabelOutcomeRefs.current.forEach((el, i) => {
      if (el) tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.07 }, 0.72 + i * 0.025);
    });

    // ── Phase 3: Cross-influence + Growth surge ────────────────────────────

    // Bridge line draws between Trust and Efficiency
    tl.to(lineBridgeRef.current, { opacity: 0.50, duration: 0.03 }, 0.81);
    tl.to(lineBridgeRef.current, { strokeDashoffset: 0, duration: 0.11 }, 0.81);

    // Results node grows from scale 0 (transformation, not fade)
    tl.to(resultsNodeRef.current, { scale: 1, duration: 0.08 }, 0.89);

    // Results text wipes in
    tl.to(resultsTextRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.07 }, 0.91);

    // Growth connectors draw upward from signals to Growth
    tl.to(lineTrustGRef.current, { opacity: 0.30, duration: 0.02 }, 0.83);
    tl.to(lineTrustGRef.current, { strokeDashoffset: 0, duration: 0.12 }, 0.83);
    tl.to(lineEffGRef.current,   { opacity: 0.30, duration: 0.02 }, 0.85);
    tl.to(lineEffGRef.current,   { strokeDashoffset: 0, duration: 0.12 }, 0.85);

    // Dummy tween to hold timeline at exactly 1.0
    tl.to({}, { duration: 0.04 }, 0.96);

    // ── Attach ScrollTrigger ──────────────────────────────────────────────
    ScrollTrigger.create({
      trigger:   container,
      start:     "top top",
      end:       `+=${PIN_VH * 100}%`,
      scrub:     SCRUB_SMOOTHING,
      animation: tl,
      onUpdate: (self) => {
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${self.progress})`;
        }
        if (phaseRef.current) {
          const p = self.progress;
          let phase = "Inherited";
          if (p > 0.05) phase = "Efficiency forming";
          if (p > 0.40) phase = "Trust forming";
          if (p > 0.80) phase = "Leverage";
          phaseRef.current.textContent = phase;
        }
      },
    });

    // Resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === container) st.kill();
      });
      tl.kill();
      Object.values(ingRefs.current).forEach((el) => {
        if (el) gsap.set(el, { willChange: "auto" });
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: `${PIN_VH * 100}vh`, position: "relative" }}
    >
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* ── Full-viewport SVG layer ── */}
        <svg
          ref={svgRef}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }}
        >
          {/* Inherited S4 connection lines */}
          <path ref={lineAutoAIRef}   fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.75} strokeLinecap="round" />
          <path ref={lineWebBrandRef} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.75} strokeLinecap="round" />

          {/* Cross-influence bridge */}
          <path ref={lineBridgeRef} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.0} strokeLinecap="round" />

          {/* Growth connectors */}
          <path ref={lineTrustGRef} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.5} strokeLinecap="round" strokeDasharray="4 5" />
          <path ref={lineEffGRef}   fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.5} strokeLinecap="round" strokeDasharray="4 5" />

          {/* Outcome measurement bars — Trust (left cluster) */}
          {TRUST_BARS.map((bar, i) => (
            <line
              key={bar.id}
              ref={(el) => { trustBarRefs.current[i] = el; }}
              x1={`${bar.x * 100}%`}
              y1={`${bar.y * 100}%`}
              x2={`${(bar.x + bar.w) * 100}%`}
              y2={`${bar.y * 100}%`}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.75}
              strokeLinecap="round"
            />
          ))}

          {/* Outcome measurement bars — Efficiency (right cluster) */}
          {EFF_BARS.map((bar, i) => (
            <line
              key={bar.id}
              ref={(el) => { effBarRefs.current[i] = el; }}
              x1={`${bar.x * 100}%`}
              y1={`${bar.y * 100}%`}
              x2={`${(bar.x + bar.w) * 100}%`}
              y2={`${bar.y * 100}%`}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.75}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* ── Ingredient wrappers ── */}
        {(["automation", "ai", "website", "brand"] as const).map((id) => (
          <div
            key={id}
            ref={(el) => { ingRefs.current[id] = el; }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              zIndex: 5,
            }}
          >
            <IngredientShape id={id} />
            <IngLabel id={id} />
          </div>
        ))}

        {/* ── Growth element (special — has animatable beam/flare/ticks) ── */}
        <div
          ref={(el) => { ingRefs.current["growth"] = el; growthWrapRef.current = el; }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: "translate(-50%, -50%)",
            zIndex: 6,
          }}
        >
          <GrowthBeam
            beamRef={growthBeamRef}
            flareRef={growthFlareRef}
            tickRefs={growthTickRefs}
          />
          <IngLabel id="growth" />
        </div>

        {/* ── Efficiency signal cluster ── */}
        <div
          ref={effClusterRef}
          style={{
            position: "absolute",
            left: `${PCT.effCenter.x * 100}%`,
            top:  `${PCT.effCenter.y * 100}%`,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 8,
            pointerEvents: "none",
          }}
        >
          <EfficiencySignal arcRef={effArcRef} />
          <div
            ref={effLabelRef}
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.45,
              overflow: "hidden",
            }}
          >
            Efficiency
          </div>
          <div
            ref={effMetricRef}
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              overflow: "hidden",
            }}
          >
            80%
          </div>
        </div>

        {/* ── Trust signal cluster ── */}
        <div
          ref={trustClusterRef}
          style={{
            position: "absolute",
            left: `${PCT.trustCenter.x * 100}%`,
            top:  `${PCT.trustCenter.y * 100}%`,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 8,
            pointerEvents: "none",
          }}
        >
          <TrustSignal diamondRef={trustDiamondRef} fillRef={trustFillRef} />
          <div
            ref={trustLabelRef}
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.45,
              overflow: "hidden",
            }}
          >
            Trust
          </div>
          <div
            ref={trustMetricRef}
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              overflow: "hidden",
            }}
          >
            3.4×
          </div>
        </div>

        {/* ── Efficiency outcome labels ── */}
        {EFF_BARS.map((bar, i) => (
          <div
            key={`eff-label-${i}`}
            ref={(el) => { effLabelOutcomeRefs.current[i] = el; }}
            style={{
              position: "absolute",
              left: `${bar.x * 100}%`,
              top:  `calc(${bar.y * 100}% - 14px)`,
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              opacity: 0.40,
              whiteSpace: "nowrap",
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 7,
            }}
          >
            {bar.label}
          </div>
        ))}

        {/* ── Trust outcome labels ── */}
        {TRUST_BARS.map((bar, i) => (
          <div
            key={`trust-label-${i}`}
            ref={(el) => { trustLabelOutcomeRefs.current[i] = el; }}
            style={{
              position: "absolute",
              left: `${bar.x * 100}%`,
              top:  `calc(${bar.y * 100}% - 14px)`,
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              opacity: 0.40,
              whiteSpace: "nowrap",
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 7,
            }}
          >
            {bar.label}
          </div>
        ))}

        {/* ── Results node (cross-influence midpoint) ── */}
        <div
          ref={resultsNodeRef}
          style={{
            position: "absolute",
            left: `${PCT.resultsNode.x * 100}%`,
            top:  `${PCT.resultsNode.y * 100}%`,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {/* The compound symbol: diamond ◆ + arc overlapping = leverage */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
            style={{ overflow: "visible" }}>
            {/* Diamond (Trust) */}
            <path
              d="M 24 6 L 40 24 L 24 42 L 8 24 Z"
              fill="none"
              stroke="rgba(255,255,255,0.60)"
              strokeWidth={1}
            />
            {/* Arc (Efficiency) — nearly complete circle */}
            <circle
              cx="24" cy="24" r="14"
              fill="none"
              stroke="rgba(255,255,255,0.60)"
              strokeWidth={1.25}
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * 0.04}`}
              transform="rotate(-90, 24, 24)"
              strokeLinecap="round"
            />
            {/* Center mark */}
            <circle cx="24" cy="24" r="2.5" fill="rgba(255,255,255,0.55)" />
          </svg>

          {/* Results text + consequences */}
          <div
            ref={resultsTextRef}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              overflow: "hidden",
            }}
          >
            <span style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.35,
            }}>
              Leverage
            </span>
            <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.15)" }} />
            <span style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.10em",
              opacity: 0.45,
              whiteSpace: "nowrap",
            }}>
              Scale without burnout
            </span>
          </div>
        </div>

        {/* ── Scene label ── */}
        <div style={{
          position: "absolute",
          bottom: 40,
          left: 64,
          right: 64,
          zIndex: 20,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.25,
            }}>
              S5 · Transformation
            </span>
            <div style={{ width: 120, height: 1, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div
                ref={progressRef}
                style={{
                  height: "100%",
                  background: "rgba(255,255,255,0.4)",
                  transformOrigin: "left center",
                  transform: "scaleX(0)",
                }}
              />
            </div>
          </div>
          <span
            ref={phaseRef}
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.25,
            }}
          >
            Inherited
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── GrowthBeam ───────────────────────────────────────────────────────────────

function GrowthBeam({
  beamRef,
  flareRef,
  tickRefs,
}: {
  beamRef:  React.RefObject<SVGLineElement | null>;
  flareRef: React.RefObject<SVGCircleElement | null>;
  tickRefs: React.MutableRefObject<(SVGLineElement | null)[]>;
}) {
  const { cx, beamBase, flareCY, flareR, tickPositions } = GROWTH_SVG;
  return (
    <svg
      width={60}
      height={140}
      viewBox="0 0 60 140"
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Beam line — y1 is animated by GSAP (extends upward) */}
      <line
        ref={beamRef}
        x1={cx} y1={GROWTH_SVG.beamY1_S4}
        x2={cx} y2={beamBase}
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Acceleration ticks (bottom → top; ticks 0,1 start visible from S4) */}
      {tickPositions.map((ty, i) => (
        <line
          key={i}
          ref={(el) => { tickRefs.current[i] = el; }}
          x1={cx - 5} y1={ty}
          x2={cx + 5} y2={ty}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={0.75}
          strokeLinecap="round"
        />
      ))}
      {/* Flare — scale + opacity animated by GSAP */}
      <circle
        ref={flareRef}
        cx={cx}
        cy={flareCY}
        r={flareR}
        fill="none"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth={1.25}
      />
      {/* Inner flare dot */}
      <circle cx={cx} cy={flareCY} r={2} fill="rgba(255,255,255,0.65)" />
      {/* Outer bloom */}
      <circle cx={cx} cy={flareCY} r={flareR + 5} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
    </svg>
  );
}

// ─── TrustSignal ─────────────────────────────────────────────────────────────

function TrustSignal({
  diamondRef,
  fillRef,
}: {
  diamondRef: React.RefObject<SVGPathElement | null>;
  fillRef:    React.RefObject<SVGRectElement | null>;
}) {
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" fill="none" style={{ overflow: "visible" }}>
      {/* Subtle interior fill — reveals via clip-path */}
      <rect
        ref={fillRef}
        x={8} y={8}
        width={40} height={40}
        fill="rgba(255,255,255,0.04)"
        transform="rotate(45, 28, 28)"
      />
      {/* Diamond outline — strokeWidth animated by GSAP */}
      <path
        ref={diamondRef}
        d="M 28 6 L 50 28 L 28 50 L 6 28 Z"
        stroke="rgba(255,255,255,0.70)"
        strokeWidth={0.75}
        fill="none"
      />
      {/* Center mark */}
      <circle cx={28} cy={28} r={2.5} fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

// ─── EfficiencySignal ─────────────────────────────────────────────────────────

function EfficiencySignal({ arcRef }: { arcRef: React.RefObject<SVGCircleElement | null> }) {
  const r = ARC_R;
  const size = (r + 10) * 2;
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ overflow: "visible" }}>
      {/* Ghost full circle — very faint reference ring */}
      <circle cx={center} cy={center} r={r}
        stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      {/* The closing arc — strokeDashoffset animated by GSAP */}
      <circle
        ref={arcRef}
        cx={center}
        cy={center}
        r={r}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={1}
        strokeLinecap="round"
        transform={`rotate(-90, ${center}, ${center})`}
      />
      {/* Small arrow head at arc end — visual language: "closing in" */}
      <circle cx={center} cy={center - r} r={2} fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

// ─── IngLabel ─────────────────────────────────────────────────────────────────

const ING_LABELS: Record<string, string> = {
  website:    "Website",
  brand:      "Brand",
  automation: "Automation",
  ai:         "AI",
  growth:     "Growth",
};

function IngLabel({ id }: { id: string }) {
  return (
    <div style={{
      fontFamily: "monospace",
      fontSize: 9,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      opacity: 0.35,
      textAlign: "center",
      whiteSpace: "nowrap",
    }}>
      {ING_LABELS[id] ?? id}
    </div>
  );
}

// ─── Shape components ─────────────────────────────────────────────────────────

function IngredientShape({ id }: { id: string }) {
  switch (id) {
    case "website":    return <WebsiteShape />;
    case "brand":      return <BrandShape />;
    case "automation": return <AutomationShape />;
    case "ai":         return <AIShape />;
    default:           return null;
  }
}

function WebsiteShape() {
  const w = 96; const h = 58;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: "block" }}>
      <rect x={0.75} y={0.75} width={w-1.5} height={h-1.5} rx={3}
        stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <line x1={0.75} y1={h*0.22} x2={w-0.75} y2={h*0.22}
        stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />
      {[0.40,0.54,0.68,0.82].map((t,i) => (
        <line key={i} x1={w*0.08} y1={h*t} x2={w*(0.08+0.28+i*0.05)} y2={h*t}
          stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
      ))}
      <line x1={w*0.36} y1={h*0.30} x2={w*0.36} y2={h*0.96}
        stroke="rgba(255,255,255,0.10)" strokeWidth={0.4} />
      <line x1={w*0.64} y1={h*0.30} x2={w*0.64} y2={h*0.96}
        stroke="rgba(255,255,255,0.10)" strokeWidth={0.4} />
      {[0.10,0.17,0.24].map((t,i) => (
        <circle key={i} cx={w*t} cy={h*0.11} r={1.5} fill="rgba(255,255,255,0.2)" />
      ))}
    </svg>
  );
}

function BrandShape() {
  const r = 32; const s = r * 2 + 24; const c = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ display: "block" }}>
      <circle cx={c} cy={c} r={r+8} stroke="rgba(255,255,255,0.06)" strokeWidth={0.75} strokeDasharray="2 4" />
      <circle cx={c} cy={c} r={r*0.72} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
      <circle cx={c} cy={c} r={r-1} stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />
      {[0,45,90,135,180,225,270,315].map((deg,i) => {
        const a = deg * Math.PI / 180;
        return (
          <line key={i}
            x1={c + Math.cos(a) * (r+1)} y1={c + Math.sin(a) * (r+1)}
            x2={c + Math.cos(a) * (r+8)} y2={c + Math.sin(a) * (r+8)}
            stroke="rgba(255,255,255,0.25)" strokeWidth={0.75} />
        );
      })}
      <circle cx={c} cy={c} r={3.5} fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

function AutomationShape() {
  const r = 32; const cx = r; const cy = r;
  const ticks = Array.from({length: 8}, (_, i) => {
    const a = (i/8)*Math.PI*2 - Math.PI/2;
    return { x1: cx+Math.cos(a)*(r-8), y1: cy+Math.sin(a)*(r-8), x2: cx+Math.cos(a)*(r-2), y2: cy+Math.sin(a)*(r-2) };
  });
  return (
    <svg width={r*2} height={r*2} viewBox={`0 0 ${r*2} ${r*2}`} fill="none" style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r*0.72} stroke="rgba(255,255,255,0.15)" strokeWidth={0.4} />
      <circle cx={cx} cy={cy} r={r-1}    stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      {ticks.map((t,i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeLinecap="round" />
      ))}
      <path d={`M ${cx} ${cy-(r-1)} A ${r-1} ${r-1} 0 0 1 ${cx+(r-1)} ${cy}`}
        stroke="rgba(255,255,255,0.65)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function AIShape() {
  const s = 64; const cx = s/2; const cy = s/2;
  const radii = [0.92,0.82,0.95,0.78,0.90,0.85,0.93];
  const verts = radii.map((r,i) => {
    const a = (i/radii.length)*Math.PI*2 - Math.PI/2;
    return { x: cx+Math.cos(a)*r*(s/2-4), y: cy+Math.sin(a)*r*(s/2-4) };
  });
  const pts = verts.map(v => `${v.x},${v.y}`).join(" ");
  const dots = [{x:cx,y:cy-4},{x:cx+9,y:cy+6},{x:cx-8,y:cy+7},{x:cx+3,y:cy+16},{x:cx-4,y:cy+16}];
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ display: "block" }}>
      <polygon points={pts} stroke="rgba(255,255,255,0.55)" strokeWidth={1} fill="none" />
      {dots.slice(0,-1).map((d,i) => (
        <line key={i} x1={d.x} y1={d.y} x2={dots[i+1].x} y2={dots[i+1].y}
          stroke="rgba(255,255,255,0.18)" strokeWidth={0.4} />
      ))}
      {dots.map((d,i) => (
        <circle key={i} cx={d.x} cy={d.y} r={i===0?2.5:1.5}
          fill={`rgba(255,255,255,${i===0?0.45:0.25})`} />
      ))}
    </svg>
  );
}
