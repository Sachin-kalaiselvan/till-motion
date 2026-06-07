"use client";

/**
 * SceneS6 — Assembly & Resolution
 *
 * "We don't build websites. We build complete business systems."
 *
 * The four project modules assemble into a single Growth Engine.
 * The user sees: different industries, one infrastructure.
 * The metrics prove it.
 *
 * Five phases, 300vh:
 *
 *   Phase 1 — Attraction    (0.00–0.20)
 *     All projects begin gravitating toward center. Growth descends.
 *
 *   Phase 2 — Alignment     (0.20–0.40)
 *     Projects find their structural positions around the engine core.
 *     Growth is now above, directing downward.
 *     Solid downward connectors draw from Growth to the clusters.
 *
 *   Phase 3 — Synchronization (0.40–0.60)
 *     The engine enclosure ring begins materializing.
 *     "Different Industries." annotation appears at engine center.
 *
 *   Phase 4 — Assembly      (0.60–0.85)
 *     The enclosure ring completes.
 *     Client result spec sheet appears below the engine.
 *
 *   Phase 5 — Stabilization (0.85–1.00)
 *     CTA emerges. Subject returns via FLIP.
 *     Ring begins breathing (post-arrival animation).
 */

import React, { useEffect, useRef, useCallback } from "react";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";
import { MagneticButton } from "@/components/motion";
import { useSubject } from "@/context/SubjectContext";
import { ProjectMark, GrowthBeam } from "./IngredientShapes";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_VH = 3.0;

// S5 end positions → S6 start
const S5_END = {
  "smart-packaging": { x: 0.18, y: 0.48 },
  "jkp":             { x: 0.24, y: 0.52 },
  "sierra":          { x: 0.60, y: 0.46 },
  "threxa":          { x: 0.76, y: 0.34 },
  growth:            { x: 0.50, y: 0.13 },
};

// Assembly target slots
const ASSEMBLY = {
  "smart-packaging": { x: 0.38, y: 0.46 },
  "jkp":             { x: 0.44, y: 0.43 },
  "sierra":          { x: 0.56, y: 0.43 },
  "threxa":          { x: 0.62, y: 0.46 },
  growth:            { x: 0.50, y: 0.24 },
  center:            { x: 0.50, y: 0.44 },
  cta:               { x: 0.50, y: 0.75 },
};

// Output tiles: the four real client metrics
const OUTPUT_TILES = [
  { metric: "3.4×",   label: "Qualified RFQs",     client: "Sierra Aerospace",          angle: "top"   },
  { metric: "+212%",  label: "Booking Conversion",  client: "JKP Padmalaya",             angle: "left"  },
  { metric: "+40%",   label: "RFQ Conversion",      client: "Smart Packaging",           angle: "right" },
  { metric: "15+",    label: "hrs saved weekly",     client: "Threxa",                   angle: "bot"   },
];

// Growth SVG constants (S5 end: beam apex, flare full, all ticks)
const GROWTH_SVG = {
  cx: 30, beamBase: 128, beamApex: 20, beamY1_S5end: 20,
  flareCY: 18, flareR: 6, tickPositions: [112, 92, 68, 40],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SceneS6() {
  const { assemble, dock } = useSubject();
  const assembleRef    = useRef(assemble);
  const dockRef        = useRef(dock);
  const isAssembledRef = useRef(false);
  useEffect(() => { assembleRef.current = assemble; }, [assemble]);
  useEffect(() => { dockRef.current = dock; }, [dock]);

  const containerRef   = useRef<HTMLDivElement>(null);
  const svgRef         = useRef<SVGSVGElement>(null);
  const ingRefs        = useRef<Record<string, HTMLDivElement | null>>({});
  const growthBeamRef  = useRef<SVGLineElement>(null);
  const growthFlareRef = useRef<SVGCircleElement>(null);
  const growthTickRefs = useRef<(SVGLineElement | null)[]>([null, null, null, null]);
  const ringRef        = useRef<SVGCircleElement>(null);
  const lineNewAutoRef = useRef<SVGPathElement>(null);
  const lineNewWebRef  = useRef<SVGPathElement>(null);
  const engineLabelRef = useRef<HTMLDivElement>(null);
  const outputTileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaSepRef      = useRef<SVGPathElement>(null);
  const ctaBlockRef    = useRef<HTMLDivElement>(null);
  const ctaButtonRef   = useRef<HTMLDivElement>(null);
  const progressRef    = useRef<HTMLDivElement>(null);
  const phaseRef       = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGSAP();
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);

    // ── S5 end state ──────────────────────────────────────────────────────
    Object.entries(S5_END).forEach(([id, pct]) => {
      const el = ingRefs.current[id];
      if (el) gsap.set(el, { x: pct.x * vw, y: pct.y * vh, willChange: "transform" });
    });
    gsap.set(growthBeamRef.current,  { attr: { y1: GROWTH_SVG.beamY1_S5end } });
    gsap.set(growthFlareRef.current, { opacity: 1.0, scale: 1.0, transformOrigin: "center" });
    growthTickRefs.current.forEach((el) => { if (el) gsap.set(el, { opacity: 0.55 }); });

    // ── Hide output tiles and CTA ─────────────────────────────────────────
    outputTileRefs.current.forEach((el) => {
      if (el) gsap.set(el, { opacity: 0, scale: 0.8, transformOrigin: "center" });
    });
    gsap.set(engineLabelRef.current, { opacity: 0, y: 8 });
    gsap.set(ctaBlockRef.current,   { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set(ctaButtonRef.current,  { scale: 0, transformOrigin: "center" });

    // Enclosure ring
    const ringR = vh * 0.19;
    const ringC = 2 * Math.PI * ringR;
    gsap.set(ringRef.current, { strokeDasharray: ringC, strokeDashoffset: ringC, opacity: 0 });

    // CTA separator
    if (ctaSepRef.current) {
      const cx = vw * 0.50, cy = vh * ASSEMBLY.cta.y - 60;
      ctaSepRef.current.setAttribute("d", `M ${cx - 50} ${cy} L ${cx + 50} ${cy}`);
      const sl = ctaSepRef.current.getTotalLength();
      gsap.set(ctaSepRef.current, { strokeDasharray: sl, strokeDashoffset: sl, opacity: 0 });
    }

    // Build solid downward connectors (Growth → clusters)
    const buildPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const f = { x: from.x * vw, y: from.y * vh }, t = { x: to.x * vw, y: to.y * vh };
      const midY = (f.y + t.y) / 2;
      return `M ${f.x} ${f.y} C ${f.x} ${midY}, ${t.x} ${midY}, ${t.x} ${t.y}`;
    };
    const growthFinal = ASSEMBLY.growth;
    if (lineNewAutoRef.current) {
      lineNewAutoRef.current.setAttribute("d", buildPath(growthFinal, ASSEMBLY["smart-packaging"]));
      const len = lineNewAutoRef.current.getTotalLength();
      gsap.set(lineNewAutoRef.current, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    }
    if (lineNewWebRef.current) {
      lineNewWebRef.current.setAttribute("d", buildPath(growthFinal, ASSEMBLY.sierra));
      const len = lineNewWebRef.current.getTotalLength();
      gsap.set(lineNewWebRef.current, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    }

    // ── Master timeline ───────────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // ── Phase 1: Attraction ────────────────────────────────────────────────
    tl.fromTo(ingRefs.current["growth"]!,
      { x: S5_END.growth.x * vw, y: S5_END.growth.y * vh },
      { x: ASSEMBLY.growth.x * vw, y: ASSEMBLY.growth.y * vh, duration: 0.18 }, 0);

    Object.keys(S5_END).filter(id => id !== "growth").forEach((id) => {
      const el = ingRefs.current[id];
      if (el) tl.to(el, { opacity: 0.40, duration: 0.18 }, 0);
    });

    // ── Phase 2: Alignment ─────────────────────────────────────────────────
    Object.entries(ASSEMBLY).forEach(([id, slot]) => {
      if (id === "center" || id === "cta" || id === "growth") return;
      const el = ingRefs.current[id];
      const start = S5_END[id as keyof typeof S5_END];
      if (!el || !start) return;
      tl.fromTo(el,
        { x: start.x * vw, y: start.y * vh },
        { x: slot.x * vw,  y: slot.y * vh, duration: 0.16 },
        0.22);
    });

    tl.to(lineNewAutoRef.current, { opacity: 0.40, duration: 0.02 }, 0.30);
    tl.to(lineNewAutoRef.current, { strokeDashoffset: 0, duration: 0.09 }, 0.30);
    tl.to(lineNewWebRef.current,  { opacity: 0.40, duration: 0.02 }, 0.32);
    tl.to(lineNewWebRef.current,  { strokeDashoffset: 0, duration: 0.09 }, 0.32);

    // ── Phase 3: Synchronization ───────────────────────────────────────────
    tl.to(ringRef.current, { opacity: 0.22, duration: 0.04 }, 0.42);
    tl.to(ringRef.current, { strokeDashoffset: 0, duration: 0.32 }, 0.42);

    tl.to(engineLabelRef.current, { opacity: 1, y: 0, duration: 0.14 }, 0.52);

    // ── Phase 4: Assembly ──────────────────────────────────────────────────
    tl.to(growthBeamRef.current,  { attr: { "stroke-width": 2.5 }, duration: 0.16 }, 0.68);
    tl.to(growthFlareRef.current, { scale: 1.15, duration: 0.16 }, 0.68);
    tl.to(ringRef.current,        { opacity: 0.30, duration: 0.10 }, 0.76);

    // Output tiles materialize in sequence
    outputTileRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.to(el, { opacity: 1, scale: 1, duration: 0.07 }, 0.68 + i * 0.04);
    });

    // CTA separator draws
    tl.to(ctaSepRef.current, { opacity: 0.30, duration: 0.03 }, 0.78);
    tl.to(ctaSepRef.current, { strokeDashoffset: 0, duration: 0.07 }, 0.78);

    // CTA text block wipes in
    tl.to(ctaBlockRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.10 }, 0.82);

    // ── Phase 5: Stabilization ─────────────────────────────────────────────
    tl.to(ctaButtonRef.current, { scale: 1, duration: 0.07 }, 0.88);

    tl.to(Object.values(ingRefs.current).filter(Boolean),
      { opacity: 0.14, duration: 0.12 }, 0.86);

    tl.to({}, { duration: 0.04 }, 0.96);

    // ── ScrollTrigger ─────────────────────────────────────────────────────
    ScrollTrigger.create({
      trigger: container, start: "top top",
      end: `+=${PIN_VH * 100}%`,
      scrub: SCRUB_SMOOTHING, animation: tl,
      onUpdate: (self) => {
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${self.progress})`;
        }
        if (phaseRef.current) {
          const p = self.progress;
          let phase = "Attraction";
          if (p > 0.22) phase = "Alignment";
          if (p > 0.42) phase = "Synchronization";
          if (p > 0.62) phase = "Assembly";
          if (p > 0.86) phase = "Complete";
          phaseRef.current.textContent = phase;
        }
        const shouldBeAssembled = self.progress >= 0.88;
        if (shouldBeAssembled !== isAssembledRef.current) {
          if (shouldBeAssembled) assembleRef.current();
          else dockRef.current();
          isAssembledRef.current = shouldBeAssembled;
        }
        if (ringRef.current) {
          ringRef.current.classList.toggle("ring-breathing", self.progress >= 0.90);
        }
      },
    });

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
      if (isAssembledRef.current) { dockRef.current(); isAssembledRef.current = false; }
    };
  }, []);

  // Tile position offsets around the engine
  const tilePositions = {
    top:   { left: "50%", top: "22%",  transform: "translate(-50%,0)" },
    left:  { left: "22%", top: "44%",  transform: "translate(-50%,-50%)" },
    right: { left: "78%", top: "44%",  transform: "translate(-50%,-50%)" },
    bot:   { left: "50%", top: "64%",  transform: "translate(-50%,0)" },
  };

  return (
    <div ref={containerRef}
      style={{ height: `${PIN_VH * 100}vh`, position: "relative" }}>

      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* SVG layer */}
        <svg ref={svgRef} style={{
          position: "absolute", top: 0, left: 0,
          pointerEvents: "none", zIndex: 1, overflow: "visible",
        }}>
          <path ref={lineNewAutoRef} fill="none" stroke="rgba(196,154,60,0.50)" strokeWidth={0.75} strokeLinecap="round" />
          <path ref={lineNewWebRef}  fill="none" stroke="rgba(196,154,60,0.50)" strokeWidth={0.75} strokeLinecap="round" />
          <circle ref={ringRef}
            cx={`${ASSEMBLY.center.x * 100}%`}
            cy={`${ASSEMBLY.center.y * 100}%`}
            r="19vh"
            fill="none"
            stroke="rgba(196,154,60,0.28)"
            strokeWidth={0.75}
            strokeLinecap="round"
          />
          <path ref={ctaSepRef}
            fill="none" stroke="rgba(196,154,60,0.30)"
            strokeWidth={0.5} strokeLinecap="round" />
        </svg>

        {/* Growth element */}
        <div ref={(el) => { ingRefs.current["growth"] = el; }}
          style={{
            position: "absolute", top: 0, left: 0,
            transform: "translate(-50%,-50%)", zIndex: 7,
          }}
        >
          <GrowthBeam
            beamRef={growthBeamRef}
            flareRef={growthFlareRef}
            tickRefs={growthTickRefs}
            ringRef={{ current: null }}
          />
          <div style={{
            fontFamily: "var(--font-mono,'Courier New',monospace)",
            fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--text-muted)", textAlign: "center",
          }}>Growth</div>
        </div>

        {/* Four project card wrappers */}
        {(["smart-packaging","jkp","sierra","threxa"] as const).map((id, i) => (
          <div key={id}
            ref={(el) => { ingRefs.current[id] = el; }}
            style={{
              position: "absolute", top: 0, left: 0,
              transform: "translate(-50%,-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              zIndex: 5 - i,
            }}
          >
            <ProjectMark id={id} size={40} />
            <div style={{
              fontFamily: "var(--font-mono,'Courier New',monospace)",
              fontSize: 8, letterSpacing: "0.10em", textTransform: "uppercase",
              color: "var(--text-muted)", textAlign: "center", whiteSpace: "nowrap",
            }}>
              {id === "smart-packaging" ? "Smart Pkg" :
               id === "jkp" ? "JKP" :
               id === "sierra" ? "Sierra" : "Threxa"}
            </div>
          </div>
        ))}

        {/* Output tiles: four real client metrics around the engine */}
        {OUTPUT_TILES.map((tile, i) => {
          const pos = tilePositions[tile.angle as keyof typeof tilePositions];
          return (
            <div key={i}
              ref={(el) => { outputTileRefs.current[i] = el; }}
              style={{
                position: "absolute",
                ...pos,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                pointerEvents: "none", zIndex: 9,
              }}
            >
              <div style={{
                fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
                fontSize: "clamp(22px,3vw,36px)", fontWeight: 700,
                letterSpacing: "-0.04em", lineHeight: 1,
                color: "var(--brass)",
              }}>
                {tile.metric}
              </div>
              <div style={{
                fontFamily: "var(--font-mono,'Courier New',monospace)",
                fontSize: 9, letterSpacing: "0.10em", textTransform: "uppercase",
                color: "var(--text-secondary)", opacity: 0.60,
              }}>
                {tile.label}
              </div>
              <div style={{
                fontFamily: "var(--font-mono,'Courier New',monospace)",
                fontSize: 8, letterSpacing: "0.08em",
                color: "var(--text-muted)", opacity: 0.45,
              }}>
                {tile.client}
              </div>
            </div>
          );
        })}

        {/* Engine center label */}
        <div ref={engineLabelRef}
          style={{
            position: "absolute",
            left: `${ASSEMBLY.center.x * 100}%`,
            top:  `${ASSEMBLY.center.y * 100}%`,
            transform: "translate(-50%,-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            pointerEvents: "none", zIndex: 11, textAlign: "center",
          }}
        >
          <div style={{
            fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
            fontSize: "clamp(11px,1.2vw,14px)", fontStyle: "italic",
            color: "var(--text-secondary)", opacity: 0.65,
          }}>
            Different Industries.
          </div>
          <div style={{
            fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
            fontSize: "clamp(11px,1.2vw,14px)", fontStyle: "italic",
            color: "var(--brass)", opacity: 0.80,
          }}>
            Same Engine.
          </div>
        </div>

        {/* CTA — spec sheet format emerging from the engine */}
        <div style={{
          position: "absolute",
          left: `${ASSEMBLY.cta.x * 100}%`,
          top:  `${ASSEMBLY.cta.y * 100}%`,
          transform: "translate(-50%,-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          zIndex: 15, textAlign: "center",
        }}>
          {/* Client result rows — wipe in */}
          <div ref={ctaBlockRef}
            style={{
              display: "flex", flexDirection: "column",
              gap: 0, overflow: "hidden",
              borderTop: "1px solid rgba(196,154,60,0.20)",
              borderBottom: "1px solid rgba(196,154,60,0.20)",
              padding: "14px 0",
            }}
          >
            {[
              ["Smart Packaging Solutions", "+40% RFQ Conversion"],
              ["Sierra Aerospace",          "3.4× Qualified RFQs"],
              ["JKP Padmalaya",             "+212% Booking Conversion"],
              ["Threxa",                    "15+ Hours Saved Weekly"],
            ].map(([client, result], i) => (
              <div key={i} style={{
                display: "flex", gap: 40, alignItems: "baseline",
                padding: "6px 0",
                borderBottom: i < 3 ? "1px solid rgba(196,154,60,0.10)" : "none",
              }}>
                <span style={{
                  fontFamily: "var(--font-mono,'Courier New',monospace)",
                  fontSize: 9, letterSpacing: "0.08em",
                  color: "var(--text-muted)", whiteSpace: "nowrap",
                }}>
                  {client}
                </span>
                <span style={{
                  fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
                  fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em",
                  color: "var(--brass)", whiteSpace: "nowrap",
                }}>
                  {result}
                </span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div ref={ctaButtonRef} style={{ transformOrigin: "center" }}>
            <MagneticButton
              style={{
                padding: "14px 36px",
                background: "rgba(196,154,60,0.92)",
                color: "#1A1208",
                borderRadius: 5, fontSize: 14, fontWeight: 600,
                letterSpacing: "-0.01em", fontFamily: "inherit",
              } as React.CSSProperties}
              onClick={() => window.open("https://cal.com/threxa/threxa-free-audit", "_blank")}
            >
              Let&apos;s build yours →
            </MagneticButton>
            <p style={{
              marginTop: 10,
              fontFamily: "var(--font-mono,'Courier New',monospace)",
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--text-muted)", textAlign: "center",
            }}>
              Free audit · No commitment
            </p>
          </div>
        </div>

        {/* Scene label */}
        <div style={{
          position: "absolute", bottom: 40, left: 64, right: 64,
          zIndex: 20, display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", pointerEvents: "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{
              fontFamily: "var(--font-mono,'Courier New',monospace)",
              fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--text-muted)",
            }}>
              S6 · Assembly
            </span>
            <div style={{ width: 120, height: 1, background: "var(--brass-20)", overflow: "hidden" }}>
              <div ref={progressRef} style={{
                height: "100%", background: "var(--brass)",
                transformOrigin: "left center", transform: "scaleX(0)",
              }} />
            </div>
          </div>
          <span ref={phaseRef} style={{
            fontFamily: "var(--font-mono,'Courier New',monospace)",
            fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            Attraction
          </span>
        </div>

      </div>
    </div>
  );
}
