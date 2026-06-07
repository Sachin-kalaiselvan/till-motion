"use client";

/**
 * SceneS6 — Assembly & Resolution
 *
 * ─── Narrative ───────────────────────────────────────────────────────────────
 *
 * The payoff. Everything that was separated, connected, and transformed
 * now assembles into a single Growth Engine.
 *
 * Five phases across 300vh:
 *
 *   Phase 1 — Attraction    (0.00–0.20)
 *     Gravity becomes visible. Everything begins moving toward the center.
 *     Growth descends. Trust and Efficiency shift upward. Ingredients dim.
 *     Cross-influence bridge brightens: it's no longer just a connection,
 *     it's becoming the structural axis of the system.
 *
 *   Phase 2 — Alignment     (0.20–0.40)
 *     Elements find their structural positions. Brand moves to center (nucleus).
 *     Automation crosses from right to center (ring). Website repositions right.
 *     Growth establishes itself as the organizing top element.
 *     New solid downward connectors draw: Growth now DIRECTS the pairs.
 *     The hierarchy has inverted.
 *
 *   Phase 3 — Synchronization (0.40–0.60)
 *     Trust and Efficiency signals are absorbed. Their meaning becomes
 *     structural — encoded in the geometry, no longer needing to announce
 *     themselves. The bridge fades. Assembly annotations appear where the
 *     signals were. The enclosure ring begins materializing.
 *
 *   Phase 4 — Assembly      (0.60–0.85)
 *     The Automation ring scales to fully envelope Brand. AI seats precisely
 *     inside. The enclosure ring completes. The assembled form is legible as
 *     a system. CTA separator and primary text emerge from the structure.
 *
 *   Phase 5 — Stabilization (0.85–1.00)
 *     The CTA button appears (scale 0→1). The assembled ring begins breathing
 *     (a post-arrival CSS animation — the only time-based element in S4–S6).
 *     The Subject returns via FLIP: docked (top-left) → assembled (center).
 *     The journey is complete.
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 *
 * Inherits S5 end state via gsap.set() at mount. No resets. No re-introductions.
 *
 * One full-viewport SVG layer:
 *   - S5 inherited lines (bridge + Growth connectors): start drawn, fade
 *   - New solid downward connectors from Growth to assembly pairs: draw Phase 2
 *   - Enclosure ring: draws Phases 3–4
 *
 * Five ingredient wrappers (GSAP-owned x/y, same as S5 pattern).
 * Trust + Efficiency signal clusters (re-created at S5 end state, fade in P3).
 * Growth element: beam fires fully in Phase 4.
 * Assembly annotations: appear in Phase 3 where signals were.
 * CTA block: emerges Phase 4–5.
 *
 * Subject return: useSubject().assemble() at progress 0.88 via onUpdate.
 * Uses ref-based callbacks to avoid stale closures in the scroll callback.
 *
 * ─── No-arbitrary-fades rule ─────────────────────────────────────────────────
 *
 * Trust/Efficiency fade in Phase 3: absorption — their meaning becomes geometry.
 * Bridge fades in Phase 3: no longer needed; the assembly IS the connection.
 * Old S5 dashed connectors fade in Phase 1: hierarchy inverted; replaced by solids.
 * Ingredient opacity to 0.12 in Phase 4: they're the structure now, not the story.
 * Each fade has a narrative reason. None are arbitrary.
 *
 * ─── Scrub rule ──────────────────────────────────────────────────────────────
 *
 * All GSAP tweens: ease:"none". Fully scrubbed. Fully reversible.
 * One post-arrival CSS animation (ring breathing) starts at progress >= 0.90.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";
import { MagneticButton } from "@/components/motion";
import { useSubject } from "@/context/SubjectContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_VH = 3.0;

// ─── S5 End-State Positions (where S6 begins) ─────────────────────────────────

const S5_END = {
  automation: { x: 0.62, y: 0.44 },
  ai:         { x: 0.62, y: 0.44 },
  website:    { x: 0.27, y: 0.44 },
  brand:      { x: 0.36, y: 0.44 },
  growth:     { x: 0.50, y: 0.13 },
  trust:      { x: 0.32, y: 0.62 },
  efficiency: { x: 0.62, y: 0.62 },
};

// ─── Assembly Target Positions ────────────────────────────────────────────────

const ASSEMBLY = {
  // Growth Engine center
  center:     { x: 0.50, y: 0.44 },

  // Brand: nucleus
  brand:      { x: 0.50, y: 0.44 },

  // Automation: same center as Brand (ring surrounds it)
  automation: { x: 0.50, y: 0.44 },

  // AI: inside ring, adjacent to Brand
  ai:         { x: 0.45, y: 0.43 },

  // Website: exterior right face, tangent to ring
  website:    { x: 0.63, y: 0.44 },

  // Growth: above assembly, the organizing top element
  growth:     { x: 0.50, y: 0.24 },

  // Signal midpoints during alignment (Phase 2)
  trustMid:      { x: 0.32, y: 0.55 },
  efficiencyMid: { x: 0.62, y: 0.55 },

  // Assembly annotation positions (Phase 3)
  trustAnnotation:      { x: 0.63, y: 0.54 },
  efficiencyAnnotation: { x: 0.44, y: 0.54 },

  // Engine enclosure ring: same center, radius expressed as a path in SVG
  // Computed at runtime from vw/vh

  // CTA position
  cta: { x: 0.50, y: 0.74 },
};

// ─── Growth SVG constants (same as S5) ───────────────────────────────────────

const GROWTH_SVG = {
  cx: 30, beamBase: 128, beamApex: 20,
  beamY1_S5end: 20,  // S5 ended with beam fully extended (apex)
  flareCY: 18, flareR: 6,
  tickPositions: [112, 92, 68, 40],
};

// ─── Arc constants (Efficiency signal, same as S5) ────────────────────────────

const ARC_R = 22;
const ARC_C = 2 * Math.PI * ARC_R;
const ARC_DASHOFFSET_S5_END = ARC_C * 15 / 360; // 345° drawn

// ─── Component ────────────────────────────────────────────────────────────────

export function SceneS6() {
  const { assemble, dock } = useSubject();

  // Stable refs to avoid stale closures in scroll callback
  const assembleRef     = useRef(assemble);
  const dockRef         = useRef(dock);
  const isAssembledRef  = useRef(false);

  useEffect(() => { assembleRef.current = assemble; }, [assemble]);
  useEffect(() => { dockRef.current = dock; }, [dock]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);

  // Ingredient wrapper refs (GSAP x/y)
  const ingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Signal cluster refs (S5 inherited, fade in Phase 3)
  const trustClusterRef = useRef<HTMLDivElement>(null);
  const effClusterRef   = useRef<HTMLDivElement>(null);

  // Growth element refs
  const growthBeamRef  = useRef<SVGLineElement>(null);
  const growthFlareRef = useRef<SVGCircleElement>(null);
  const growthTickRefs = useRef<(SVGLineElement | null)[]>([null, null, null, null]);

  // SVG line refs
  const lineOldTrustGRef   = useRef<SVGPathElement>(null);
  const lineOldEffGRef     = useRef<SVGPathElement>(null);
  const lineBridgeRef      = useRef<SVGPathElement>(null);
  const lineNewAutoRef     = useRef<SVGPathElement>(null);
  const lineNewWebRef      = useRef<SVGPathElement>(null);
  const enclosureRingRef   = useRef<SVGCircleElement>(null);

  // Assembly annotation refs (clip-path wipes)
  const trustAnnotRef    = useRef<HTMLDivElement>(null);
  const effAnnotRef      = useRef<HTMLDivElement>(null);

  // CTA refs
  const ctaSepRef    = useRef<SVGPathElement>(null);
  const ctaTextRef   = useRef<HTMLDivElement>(null);
  const ctaButtonRef = useRef<HTMLDivElement>(null);

  // Post-assembly ring ref for breathing class
  const ringWrapRef = useRef<SVGCircleElement>(null);

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
    const px = (pct: { x: number; y: number }) => ({ x: pct.x * vw, y: pct.y * vh });

    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);

    // ── Set ingredient starting positions (S5 end state) ─────────────────
    const setIng = (id: string, pct: { x: number; y: number }, scale = 1.0) => {
      const el = ingRefs.current[id];
      if (el) gsap.set(el, { x: pct.x * vw, y: pct.y * vh, scale, willChange: "transform" });
    };
    setIng("automation", S5_END.automation, 1.02);
    setIng("ai",         S5_END.ai,         0.97);
    setIng("website",    S5_END.website,    0.95);
    setIng("brand",      S5_END.brand,      1.00);
    setIng("growth",     S5_END.growth,     1.08);

    // ── Set signal clusters (S5 end state: opacity 0.85, scale 1.0) ──────
    gsap.set(trustClusterRef.current, { opacity: 0.85, scale: 1.0 });
    gsap.set(effClusterRef.current,   { opacity: 0.85, scale: 1.0 });

    // ── Set Growth SVG (S5 end: beam apex, flare full, all ticks) ────────
    gsap.set(growthBeamRef.current,  { attr: { y1: GROWTH_SVG.beamApex } });
    gsap.set(growthFlareRef.current, { opacity: 1.0, scale: 1.0, transformOrigin: "center" });
    growthTickRefs.current.forEach((el) => { if (el) gsap.set(el, { opacity: 0.55 }); });

    // ── Annotation elements: hidden initially ─────────────────────────────
    gsap.set([trustAnnotRef.current, effAnnotRef.current], { clipPath: "inset(0% 100% 0% 0%)" });

    // ── CTA elements: hidden initially ────────────────────────────────────
    if (ctaSepRef.current) {
      const sepLen = ctaSepRef.current.getTotalLength?.() ?? 80;
      gsap.set(ctaSepRef.current, { strokeDasharray: sepLen, strokeDashoffset: sepLen });
    }
    gsap.set(ctaTextRef.current, { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set(ctaButtonRef.current, { scale: 0, transformOrigin: "center" });

    // ── Build SVG paths (inherited + new) ────────────────────────────────
    const buildPath = (from: { x: number; y: number }, to: { x: number; y: number }, arcFactor = 0.10) => {
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = (-dy / len) * len * arcFactor;
      const ny = ( dx / len) * len * arcFactor;
      return `M ${from.x} ${from.y} C ${from.x+dx*0.35+nx} ${from.y+dy*0.35+ny}, ${from.x+dx*0.65-nx} ${from.y+dy*0.65-ny}, ${to.x} ${to.y}`;
    };

    const growthC = px(S5_END.growth);
    const trustC  = px(S5_END.trust);
    const effC    = px(S5_END.efficiency);
    const centerC = px(ASSEMBLY.center);
    const autoAssemblyC = px(ASSEMBLY.automation);
    const webAssemblyC  = px(ASSEMBLY.website);

    // Inherited S5 lines: start fully drawn
    const initDrawn = (el: SVGPathElement | null, from: { x: number; y: number }, to: { x: number; y: number }, opacity = 0.30) => {
      if (!el) return;
      el.setAttribute("d", buildPath(from, to, 0.08));
      const len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: 0, opacity });
    };
    initDrawn(lineOldTrustGRef.current, trustC, growthC);
    initDrawn(lineOldEffGRef.current,   effC,   growthC);
    // Bridge
    if (lineBridgeRef.current) {
      const mid = { x: (trustC.x + effC.x) / 2, y: trustC.y - vh * 0.10 };
      lineBridgeRef.current.setAttribute("d", `M ${trustC.x} ${trustC.y} Q ${mid.x} ${mid.y} ${effC.x} ${effC.y}`);
      const bLen = lineBridgeRef.current.getTotalLength();
      gsap.set(lineBridgeRef.current, { strokeDasharray: bLen, strokeDashoffset: 0, opacity: 0.50 });
    }

    // New solid downward connectors: hidden initially
    const initHidden = (el: SVGPathElement | null, from: { x: number; y: number }, to: { x: number; y: number }) => {
      if (!el) return;
      el.setAttribute("d", buildPath(from, to, 0.06));
      const len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    };
    // These draw FROM the Growth final position DOWN to each assembly cluster
    const growthFinalC = px(ASSEMBLY.growth);
    initHidden(lineNewAutoRef.current, growthFinalC, autoAssemblyC);
    initHidden(lineNewWebRef.current,  growthFinalC, webAssemblyC);

    // Enclosure ring: hidden, will draw via dashoffset
    const engineRingR = vh * 0.19;
    const engineRingC = 2 * Math.PI * engineRingR;
    gsap.set(enclosureRingRef.current, {
      strokeDasharray: engineRingC,
      strokeDashoffset: engineRingC,
      opacity: 0,
    });

    // CTA separator line path (set d attribute)
    if (ctaSepRef.current) {
      const cx = vw * ASSEMBLY.cta.x, cy = vh * ASSEMBLY.cta.y - 40;
      ctaSepRef.current.setAttribute("d", `M ${cx - 40} ${cy} L ${cx + 40} ${cy}`);
      const sLen = ctaSepRef.current.getTotalLength();
      gsap.set(ctaSepRef.current, { strokeDasharray: sLen, strokeDashoffset: sLen, opacity: 0 });
    }

    // ── Master scrub timeline ──────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // ── PHASE 1 — Attraction (0.00–0.20) ──────────────────────────────────

    // Growth descends toward assembly position
    tl.fromTo(ingRefs.current["growth"]!,
      { x: S5_END.growth.x * vw, y: S5_END.growth.y * vh },
      { x: ASSEMBLY.growth.x * vw, y: ASSEMBLY.growth.y * vh, duration: 0.18 }, 0);

    // Trust and Efficiency signals shift upward (attracted toward center)
    tl.to(trustClusterRef.current, { y: `${ASSEMBLY.trustMid.y * vh}px`, duration: 0.18 }, 0);
    tl.to(effClusterRef.current,   { y: `${ASSEMBLY.efficiencyMid.y * vh}px`, duration: 0.18 }, 0.01);

    // Ingredients dim (becoming secondary to the system)
    tl.to(Object.values(ingRefs.current).filter(Boolean),
      { opacity: 0.35, duration: 0.20 }, 0);

    // Old dashed S5 Growth connectors fade (hierarchy inverting: Growth now directs)
    tl.to([lineOldTrustGRef.current, lineOldEffGRef.current], { opacity: 0, duration: 0.14 }, 0);

    // Bridge line brightens briefly (the structural axis forming)
    tl.to(lineBridgeRef.current, { attr: { "stroke-width": 1.5 }, duration: 0.18 }, 0.02);

    // ── PHASE 2 — Alignment (0.20–0.40) ───────────────────────────────────

    // Brand moves to assembly center (nucleus)
    tl.fromTo(ingRefs.current["brand"]!,
      { x: S5_END.brand.x * vw,    y: S5_END.brand.y * vh },
      { x: ASSEMBLY.brand.x * vw,  y: ASSEMBLY.brand.y * vh, duration: 0.16 }, 0.22);

    // Automation moves from right to center (ring)
    tl.fromTo(ingRefs.current["automation"]!,
      { x: S5_END.automation.x * vw,   y: S5_END.automation.y * vh },
      { x: ASSEMBLY.automation.x * vw, y: ASSEMBLY.automation.y * vh, duration: 0.16 }, 0.22);

    // AI repositions inside ring
    tl.fromTo(ingRefs.current["ai"]!,
      { x: S5_END.ai.x * vw,   y: S5_END.ai.y * vh },
      { x: ASSEMBLY.ai.x * vw, y: ASSEMBLY.ai.y * vh, duration: 0.16 }, 0.24);

    // Website moves to exterior right position
    tl.fromTo(ingRefs.current["website"]!,
      { x: S5_END.website.x * vw,   y: S5_END.website.y * vh },
      { x: ASSEMBLY.website.x * vw, y: ASSEMBLY.website.y * vh, duration: 0.18 }, 0.24);

    // New solid downward connectors draw: Growth → assembly pairs
    tl.to(lineNewAutoRef.current, { opacity: 0.40, duration: 0.02 }, 0.30);
    tl.to(lineNewAutoRef.current, { strokeDashoffset: 0, duration: 0.09 }, 0.30);
    tl.to(lineNewWebRef.current,  { opacity: 0.40, duration: 0.02 }, 0.32);
    tl.to(lineNewWebRef.current,  { strokeDashoffset: 0, duration: 0.09 }, 0.32);

    // Trust and Efficiency continue moving (tracking their pair clusters)
    tl.to(trustClusterRef.current, { x: `${ASSEMBLY.brand.x * vw}px`, duration: 0.16 }, 0.24);
    tl.to(effClusterRef.current,   { x: `${ASSEMBLY.automation.x * vw}px`, duration: 0.16 }, 0.24);

    // Bridge continues brightening, then will fade in Phase 3
    tl.to(lineBridgeRef.current, { attr: { "stroke-width": 1.0 }, duration: 0.18 }, 0.22);

    // ── PHASE 3 — Synchronization (0.40–0.60) ─────────────────────────────

    // Trust and Efficiency signals absorbed (justified: meaning is now structural)
    tl.to(trustClusterRef.current, { opacity: 0, duration: 0.14 }, 0.42);
    tl.to(effClusterRef.current,   { opacity: 0, duration: 0.14 }, 0.44);

    // Bridge fades (no longer needed — assembly IS the connection)
    tl.to(lineBridgeRef.current, { opacity: 0, duration: 0.12 }, 0.42);

    // Assembly annotations appear where signals were
    tl.to(trustAnnotRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08 }, 0.53);
    tl.to(effAnnotRef.current,   { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08 }, 0.55);

    // Enclosure ring begins materializing
    tl.to(enclosureRingRef.current, { opacity: 0.22, duration: 0.04 }, 0.48);
    tl.to(enclosureRingRef.current, { strokeDashoffset: 0, duration: 0.30 }, 0.48); // spans into Phase 4

    // Ingredients dim further (they're the structure now)
    tl.to(Object.values(ingRefs.current).filter(Boolean),
      { opacity: 0.18, duration: 0.18 }, 0.42);

    // ── PHASE 4 — Assembly (0.60–0.85) ────────────────────────────────────

    // Automation ring scales up to fully envelop Brand
    tl.to(ingRefs.current["automation"]!, { scale: 1.18, duration: 0.18 }, 0.62);

    // Growth beam fires: strokeOpacity increases (it's now the organizing force)
    tl.to(growthBeamRef.current, { attr: { "stroke-width": 2.5, opacity: 1 }, duration: 0.16 }, 0.68);
    tl.to(growthFlareRef.current, { scale: 1.15, duration: 0.16 }, 0.68);

    // Enclosure ring completes (continues from Phase 3)
    // Ring opacity pulse at completion
    tl.to(enclosureRingRef.current, { opacity: 0.30, duration: 0.10 }, 0.75);

    // CTA separator line draws from center outward
    tl.to(ctaSepRef.current, { opacity: 0.30, duration: 0.03 }, 0.78);
    tl.to(ctaSepRef.current, { strokeDashoffset: 0, duration: 0.07 }, 0.78);

    // CTA primary text wipes in
    tl.to(ctaTextRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08 }, 0.82);

    // ── PHASE 5 — Stabilization (0.85–1.00) ──────────────────────────────

    // CTA button grows from nothing (transformation: scale 0→1, not fade)
    tl.to(ctaButtonRef.current, { scale: 1, duration: 0.07 }, 0.88);

    // Ingredient final opacity (ghostly structure)
    tl.to(Object.values(ingRefs.current).filter(Boolean),
      { opacity: 0.12, duration: 0.12 }, 0.85);

    // Dummy end tween
    tl.to({}, { duration: 0.04 }, 0.96);

    // ── ScrollTrigger ─────────────────────────────────────────────────────
    ScrollTrigger.create({
      trigger:   container,
      start:     "top top",
      end:       `+=${PIN_VH * 100}%`,
      scrub:     SCRUB_SMOOTHING,
      animation: tl,
      onUpdate: (self) => {
        // Progress bar
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${self.progress})`;
        }

        // Phase text
        if (phaseRef.current) {
          const p = self.progress;
          let phase = "Attraction";
          if (p > 0.22) phase = "Alignment";
          if (p > 0.42) phase = "Synchronization";
          if (p > 0.62) phase = "Assembly";
          if (p > 0.86) phase = "Resolved";
          phaseRef.current.textContent = phase;
        }

        // Subject FLIP: assemble at 0.88, revert to docked if scrolled back
        const shouldBeAssembled = self.progress >= 0.88;
        if (shouldBeAssembled !== isAssembledRef.current) {
          if (shouldBeAssembled) assembleRef.current();
          else dockRef.current();
          isAssembledRef.current = shouldBeAssembled;
        }

        // Post-arrival ring breathing: CSS class toggle at 0.90
        if (ringWrapRef.current) {
          ringWrapRef.current.classList.toggle("ring-breathing", self.progress >= 0.90);
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
      // Revert Subject to docked on unmount
      if (isAssembledRef.current) {
        dockRef.current();
        isAssembledRef.current = false;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: `${PIN_VH * 100}vh`, position: "relative" }}
    >
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* ── CSS for post-arrival ring breathing ── */}
        <S6Styles />

        {/* ── SVG layer ── */}
        <svg
          ref={svgRef}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }}
        >
          {/* S5 inherited lines */}
          <path ref={lineOldTrustGRef} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.5} strokeLinecap="round" strokeDasharray="4 5" />
          <path ref={lineOldEffGRef}   fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.5} strokeLinecap="round" strokeDasharray="4 5" />
          <path ref={lineBridgeRef}    fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={1.0} strokeLinecap="round" />

          {/* New solid downward connectors (Phase 2: Growth directs the pairs) */}
          <path ref={lineNewAutoRef} fill="none" stroke="rgba(255,255,255,0.50)" strokeWidth={0.75} strokeLinecap="round" />
          <path ref={lineNewWebRef}  fill="none" stroke="rgba(255,255,255,0.50)" strokeWidth={0.75} strokeLinecap="round" />

          {/* Growth Engine enclosure ring */}
          <circle
            ref={enclosureRingRef}
            cx={`${ASSEMBLY.center.x * 100}%`}
            cy={`${ASSEMBLY.center.y * 100}%`}
            r={`${19}vh`}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={0.75}
            strokeLinecap="round"
          />

          {/* Same circle for breathing class (same position, same ref exposed) */}
          {/* Note: we use the same ref for both dashoffset anim + breathing class */}

          {/* CTA separator line */}
          <path
            ref={ctaSepRef}
            fill="none"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth={0.5}
            strokeLinecap="round"
          />
        </svg>

        {/* ── Growth element ── */}
        <div
          ref={(el) => { ingRefs.current["growth"] = el; }}
          style={{
            position: "absolute", top: 0, left: 0,
            transform: "translate(-50%, -50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            zIndex: 7,
          }}
        >
          <GrowthBeam
            beamRef={growthBeamRef}
            flareRef={growthFlareRef}
            tickRefs={growthTickRefs}
            ringRef={ringWrapRef}
          />
          <IngLabel id="growth" />
        </div>

        {/* ── Other ingredient wrappers ── */}
        {(["automation", "ai", "website", "brand"] as const).map((id, i) => (
          <div
            key={id}
            ref={(el) => { ingRefs.current[id] = el; }}
            style={{
              position: "absolute", top: 0, left: 0,
              transform: "translate(-50%, -50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              zIndex: 5 - i,
            }}
          >
            <IngredientShape id={id} />
            <IngLabel id={id} />
          </div>
        ))}

        {/* ── Trust signal cluster (S5 inherited) ── */}
        <div
          ref={trustClusterRef}
          style={{
            position: "absolute",
            left: `${S5_END.trust.x * 100}%`,
            top:  `${S5_END.trust.y * 100}%`,
            transform: "translate(-50%, -50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            zIndex: 8, pointerEvents: "none",
          }}
        >
          <TrustSignalCompact />
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.45 }}>Trust</div>
          <div style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>3.4×</div>
        </div>

        {/* ── Efficiency signal cluster (S5 inherited) ── */}
        <div
          ref={effClusterRef}
          style={{
            position: "absolute",
            left: `${S5_END.efficiency.x * 100}%`,
            top:  `${S5_END.efficiency.y * 100}%`,
            transform: "translate(-50%, -50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            zIndex: 8, pointerEvents: "none",
          }}
        >
          <EfficiencySignalCompact />
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.45 }}>Efficiency</div>
          <div style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>80%</div>
        </div>

        {/* ── Assembly annotations (Phase 3) ── */}
        <div
          ref={trustAnnotRef}
          style={{
            position: "absolute",
            left: `${ASSEMBLY.trustAnnotation.x * 100}%`,
            top:  `${ASSEMBLY.trustAnnotation.y * 100}%`,
            transform: "translateX(-50%)",
            fontFamily: "monospace", fontSize: 8, letterSpacing: "0.16em",
            textTransform: "uppercase", opacity: 0.30,
            whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9,
            overflow: "hidden",
          }}
        >
          Trust · 3.4×
        </div>
        <div
          ref={effAnnotRef}
          style={{
            position: "absolute",
            left: `${ASSEMBLY.efficiencyAnnotation.x * 100}%`,
            top:  `${ASSEMBLY.efficiencyAnnotation.y * 100}%`,
            transform: "translateX(-50%)",
            fontFamily: "monospace", fontSize: 8, letterSpacing: "0.16em",
            textTransform: "uppercase", opacity: 0.30,
            whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9,
            overflow: "hidden",
          }}
        >
          Efficiency · 80%
        </div>

        {/* ── CTA block ── */}
        <div style={{
          position: "absolute",
          left: `${ASSEMBLY.cta.x * 100}%`,
          top:  `${ASSEMBLY.cta.y * 100}%`,
          transform: "translate(-50%, -50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          zIndex: 15, textAlign: "center",
        }}>
          <div
            ref={ctaTextRef}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              overflow: "hidden",
            }}
          >
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.35 }}>
              This is what we build.
            </p>
          </div>

          <div ref={ctaButtonRef} style={{ transformOrigin: "center" }}>
            <MagneticButton
              style={{
                padding: "15px 40px",
                background: "rgba(255,255,255,0.92)",
                color: "#080808",
                borderRadius: 5,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                fontFamily: "inherit",
              } as React.CSSProperties}
              onClick={() => window.open("https://cal.com/threxa/threxa-free-audit", "_blank")}
            >
              Let&apos;s build yours
            </MagneticButton>

            <p style={{
              marginTop: 12,
              fontFamily: "monospace", fontSize: 9,
              letterSpacing: "0.12em", textTransform: "uppercase",
              opacity: 0.25, textAlign: "center",
            }}>
              Free audit · No commitment
            </p>
          </div>
        </div>

        {/* ── Scene label ── */}
        <div style={{
          position: "absolute", bottom: 40, left: 64, right: 64,
          zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          pointerEvents: "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.25 }}>
              S6 · Assembly
            </span>
            <div style={{ width: 120, height: 1, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div
                ref={progressRef}
                style={{ height: "100%", background: "rgba(255,255,255,0.4)", transformOrigin: "left center", transform: "scaleX(0)" }}
              />
            </div>
          </div>
          <span ref={phaseRef} style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.25 }}>
            Attraction
          </span>
        </div>

      </div>
    </div>
  );
}

// ─── GrowthBeam ───────────────────────────────────────────────────────────────

function GrowthBeam({
  beamRef, flareRef, tickRefs, ringRef,
}: {
  beamRef:  React.RefObject<SVGLineElement | null>;
  flareRef: React.RefObject<SVGCircleElement | null>;
  tickRefs: React.MutableRefObject<(SVGLineElement | null)[]>;
  ringRef:  React.RefObject<SVGCircleElement | null>;
}) {
  const { cx, beamBase, flareCY, flareR, tickPositions } = GROWTH_SVG;
  return (
    <svg width={60} height={140} viewBox="0 0 60 140" fill="none" style={{ display: "block", overflow: "visible" }}>
      <line
        ref={beamRef}
        x1={cx} y1={GROWTH_SVG.beamApex}
        x2={cx} y2={beamBase}
        stroke="rgba(255,255,255,0.75)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {tickPositions.map((ty, i) => (
        <line
          key={i}
          ref={(el) => { tickRefs.current[i] = el; }}
          x1={cx - 5} y1={ty} x2={cx + 5} y2={ty}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={0.75}
          strokeLinecap="round"
        />
      ))}
      <circle
        ref={flareRef}
        cx={cx} cy={flareCY} r={flareR}
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={1.25}
      />
      <circle cx={cx} cy={flareCY} r={2} fill="rgba(255,255,255,0.70)" />
      <circle
        ref={ringRef}
        cx={cx} cy={flareCY} r={flareR + 5}
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={0.5}
      />
    </svg>
  );
}

// ─── Compact signal shapes for S6 start ───────────────────────────────────────

function TrustSignalCompact() {
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" fill="none" style={{ overflow: "visible" }}>
      <rect x={6} y={6} width={32} height={32} fill="rgba(255,255,255,0.04)" transform="rotate(45,22,22)" />
      <path d="M 22 4 L 40 22 L 22 40 L 4 22 Z" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} fill="none" />
      <circle cx={22} cy={22} r={2.5} fill="rgba(255,255,255,0.50)" />
    </svg>
  );
}

function EfficiencySignalCompact() {
  const r = 16; const c = 28;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * 15 / 360; // 345° drawn
  return (
    <svg width={c * 2} height={c * 2} viewBox={`0 0 ${c * 2} ${c * 2}`} fill="none" style={{ overflow: "visible" }}>
      <circle cx={c} cy={c} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      <circle
        cx={c} cy={c} r={r}
        stroke="rgba(255,255,255,0.70)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform={`rotate(-90, ${c}, ${c})`}
      />
      <circle cx={c} cy={c} r={2.5} fill="rgba(255,255,255,0.50)" />
    </svg>
  );
}

// ─── Ingredient shape dispatcher ──────────────────────────────────────────────

function IngredientShape({ id }: { id: string }) {
  switch (id) {
    case "website":    return <WebsiteShape />;
    case "brand":      return <BrandShape />;
    case "automation": return <AutomationShape />;
    case "ai":         return <AIShape />;
    default:           return null;
  }
}

function IngLabel({ id }: { id: string }) {
  const labels: Record<string, string> = { website: "Website", brand: "Brand", automation: "Automation", ai: "AI", growth: "Growth" };
  return (
    <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.25, textAlign: "center", whiteSpace: "nowrap" }}>
      {labels[id] ?? id}
    </div>
  );
}

// ─── Shape components (identical to S4/S5 for visual continuity) ──────────────

function WebsiteShape() {
  const w = 96, h = 58;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: "block" }}>
      <rect x={0.75} y={0.75} width={w-1.5} height={h-1.5} rx={3} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      <line x1={0.75} y1={h*0.22} x2={w-0.75} y2={h*0.22} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />
      {[0.40,0.54,0.68,0.82].map((t,i) => (<line key={i} x1={w*0.08} y1={h*t} x2={w*(0.08+0.28+i*0.05)} y2={h*t} stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />))}
      <line x1={w*0.36} y1={h*0.30} x2={w*0.36} y2={h*0.96} stroke="rgba(255,255,255,0.10)" strokeWidth={0.4} />
      <line x1={w*0.64} y1={h*0.30} x2={w*0.64} y2={h*0.96} stroke="rgba(255,255,255,0.10)" strokeWidth={0.4} />
      {[0.10,0.17,0.24].map((t,i) => (<circle key={i} cx={w*t} cy={h*0.11} r={1.5} fill="rgba(255,255,255,0.2)" />))}
    </svg>
  );
}

function BrandShape() {
  const r = 32, s = r * 2 + 24, c = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ display: "block" }}>
      <circle cx={c} cy={c} r={r+8} stroke="rgba(255,255,255,0.06)" strokeWidth={0.75} strokeDasharray="2 4" />
      <circle cx={c} cy={c} r={r*0.72} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
      <circle cx={c} cy={c} r={r-1} stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />
      {[0,45,90,135,180,225,270,315].map((deg,i) => {
        const a = deg * Math.PI / 180;
        return (<line key={i} x1={c+Math.cos(a)*(r+1)} y1={c+Math.sin(a)*(r+1)} x2={c+Math.cos(a)*(r+8)} y2={c+Math.sin(a)*(r+8)} stroke="rgba(255,255,255,0.25)" strokeWidth={0.75} />);
      })}
      <circle cx={c} cy={c} r={3.5} fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

function AutomationShape() {
  const r = 32, cx = r, cy = r;
  const ticks = Array.from({length: 8}, (_, i) => {
    const a = (i/8)*Math.PI*2 - Math.PI/2;
    return { x1: cx+Math.cos(a)*(r-8), y1: cy+Math.sin(a)*(r-8), x2: cx+Math.cos(a)*(r-2), y2: cy+Math.sin(a)*(r-2) };
  });
  return (
    <svg width={r*2} height={r*2} viewBox={`0 0 ${r*2} ${r*2}`} fill="none" style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r*0.72} stroke="rgba(255,255,255,0.15)" strokeWidth={0.4} />
      <circle cx={cx} cy={cy} r={r-1} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      {ticks.map((t,i) => (<line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeLinecap="round" />))}
      <path d={`M ${cx} ${cy-(r-1)} A ${r-1} ${r-1} 0 0 1 ${cx+(r-1)} ${cy}`} stroke="rgba(255,255,255,0.65)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function AIShape() {
  const s = 64, cx = s/2, cy = s/2;
  const radii = [0.92,0.82,0.95,0.78,0.90,0.85,0.93];
  const verts = radii.map((r,i) => { const a=(i/radii.length)*Math.PI*2-Math.PI/2; return {x:cx+Math.cos(a)*r*(s/2-4),y:cy+Math.sin(a)*r*(s/2-4)}; });
  const pts = verts.map(v=>`${v.x},${v.y}`).join(" ");
  const dots = [{x:cx,y:cy-4},{x:cx+9,y:cy+6},{x:cx-8,y:cy+7},{x:cx+3,y:cy+16},{x:cx-4,y:cy+16}];
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" style={{ display: "block" }}>
      <polygon points={pts} stroke="rgba(255,255,255,0.55)" strokeWidth={1} fill="none" />
      {dots.slice(0,-1).map((d,i) => (<line key={i} x1={d.x} y1={d.y} x2={dots[i+1].x} y2={dots[i+1].y} stroke="rgba(255,255,255,0.18)" strokeWidth={0.4} />))}
      {dots.map((d,i) => (<circle key={i} cx={d.x} cy={d.y} r={i===0?2.5:1.5} fill={`rgba(255,255,255,${i===0?0.45:0.25})`} />))}
    </svg>
  );
}

// ─── Post-assembly CSS ────────────────────────────────────────────────────────

function S6Styles() {
  return (
    <style>{`
      @keyframes ring-breathe {
        0%, 100% { opacity: 0.22; }
        50%       { opacity: 0.35; }
      }
      .ring-breathing {
        animation: ring-breathe 3.5s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .ring-breathing { animation: none; }
      }
    `}</style>
  );
}
