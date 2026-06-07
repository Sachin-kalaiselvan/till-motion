"use client";

/**
 * SceneS5 — Transformation
 *
 * "Projects generate outcomes. Metrics emerge from the systems themselves."
 *
 * S4 showed four independent projects. S5 shows each one producing real,
 * measurable results. One by one, the project modules emit their outcomes.
 * Growth reacts to each metric as it appears — it's being fed by real results.
 *
 * By S5 end: all four outcomes visible. A central "engine mark" appears,
 * and four dashed lines connect each outcome to it. The moment of narrative
 * clarity: "Different Industries. Same Engine."
 *
 * ─── Timeline ────────────────────────────────────────────────────────────────
 *
 * PIN_VH = 2.0 (200vh). All ease:"none". Fully reversible.
 *
 * Phase 1 (0.00–0.26): Smart Packaging emits "+40% RFQ Conversion"
 * Phase 2 (0.24–0.52): Sierra Aerospace emits "3.4× Qualified RFQs"
 * Phase 3 (0.50–0.76): JKP Padmalaya emits "+212% Booking"
 * Phase 4 (0.74–0.90): Threxa emits "15+ Hours Saved Weekly"
 * Phase 5 (0.86–1.0):  Engine mark materializes + 4 connectors draw
 *                       Growth surges to full
 *
 * ─── Emission mechanic ───────────────────────────────────────────────────────
 *
 * Each project module:
 *   1. Brightens (scale + stroke) as it prepares to emit
 *   2. A thin leader line extends from the card toward the outcome zone
 *   3. Metric value wipes in via clip-path (left-to-right, no opacity fade)
 *   4. Metric label wipes in below
 *   5. A measurement bar draws via stroke-dashoffset
 *
 * ─── Growth awakening ────────────────────────────────────────────────────────
 *
 * Growth beam extends continuously across the entire scene (span 0→1).
 * After each metric appears, a tick mark reveals on the beam.
 * Flare brightens in 4 steps. At S5 end: fully awake.
 *
 * ─── No-fade rule ────────────────────────────────────────────────────────────
 *
 * All reveals: clip-path wipes (text) + stroke-dashoffset (bars/lines).
 * Scale change on project cards: transformation, not opacity.
 * Growth beam: attribute animation (y1 extends).
 */

import React, { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";
import { ProjectMark, GrowthBeam } from "./IngredientShapes";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_VH = 2.0;

// ─── S4 cluster end → S5 start positions ─────────────────────────────────────

const S4_END = {
  "smart-packaging": { x: 0.18, y: 0.48 },
  "jkp":             { x: 0.24, y: 0.52 },
  "sierra":          { x: 0.60, y: 0.46 },
  "threxa":          { x: 0.76, y: 0.34 },
  growth:            { x: 0.50, y: 0.13 },
};

// ─── Outcome zones ────────────────────────────────────────────────────────────

interface OutcomeDef {
  projectId:     string;
  metric:        string;
  metricLabel:   string;
  projectName:   string;
  zoneX:         number;  // % of viewport
  zoneY:         number;
  barW:          number;  // bar width as % of viewport
  timeStart:     number;  // timeline start
  timeEnd:       number;
  metricStart:   number;  // when metric text wipes in
  growthTick:    number;  // which tick reveals (0-3)
}

const OUTCOMES: OutcomeDef[] = [
  {
    projectId: "smart-packaging",
    metric: "+40%",
    metricLabel: "RFQ Conversion",
    projectName: "Smart Packaging Solutions",
    zoneX: 0.18, zoneY: 0.65,
    barW: 0.12,
    timeStart: 0.00, timeEnd: 0.26,
    metricStart: 0.16,
    growthTick: 2,
  },
  {
    projectId: "sierra",
    metric: "3.4×",
    metricLabel: "Qualified RFQs",
    projectName: "Sierra Aerospace",
    zoneX: 0.60, zoneY: 0.65,
    barW: 0.14,
    timeStart: 0.24, timeEnd: 0.52,
    metricStart: 0.40,
    growthTick: 3,
  },
  {
    projectId: "jkp",
    metric: "+212%",
    metricLabel: "Booking Conversion",
    projectName: "JKP Padmalaya",
    zoneX: 0.24, zoneY: 0.72,
    barW: 0.18,
    timeStart: 0.50, timeEnd: 0.76,
    metricStart: 0.64,
    growthTick: -1, // already shown
  },
  {
    projectId: "threxa",
    metric: "15+",
    metricLabel: "hours saved weekly",
    projectName: "Threxa",
    zoneX: 0.76, zoneY: 0.50,
    barW: 0.10,
    timeStart: 0.74, timeEnd: 0.90,
    metricStart: 0.82,
    growthTick: -1,
  },
];

// Growth SVG constants
const GROWTH_SVG = {
  cx: 30, beamBase: 128, beamApex: 20, beamY1_S4: 47,
  flareCY: 18, flareR: 6, tickPositions: [112, 92, 68, 40],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SceneS5() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const svgRef        = useRef<SVGSVGElement>(null);
  const ingRefs       = useRef<Record<string, HTMLDivElement | null>>({});
  const outcomeRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs       = useRef<(SVGLineElement | null)[]>([]);
  const leaderRefs    = useRef<(SVGPathElement | null)[]>([]);
  const engineMarkRef = useRef<HTMLDivElement>(null);
  const engineConnRefs = useRef<(SVGPathElement | null)[]>([]);
  const growthBeamRef  = useRef<SVGLineElement>(null);
  const growthFlareRef = useRef<SVGCircleElement>(null);
  const growthTickRefs = useRef<(SVGLineElement | null)[]>([null, null, null, null]);
  const progressRef   = useRef<HTMLDivElement>(null);
  const phaseRef      = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGSAP();
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);

    // ── Set S4 end state ──────────────────────────────────────────────────
    Object.entries(S4_END).forEach(([id, pct]) => {
      const el = ingRefs.current[id];
      if (el) {
        gsap.set(el, { x: pct.x * vw, y: pct.y * vh, willChange: "transform" });
      }
    });

    // Set Growth S4 end state
    gsap.set(growthBeamRef.current,  { attr: { y1: GROWTH_SVG.beamY1_S4 } });
    gsap.set(growthFlareRef.current, { scale: 0.6, transformOrigin: "center", opacity: 0.30 });
    growthTickRefs.current.forEach((el, i) => {
      if (el) gsap.set(el, { opacity: i < 2 ? 0.55 : 0 });
    });

    // ── Hide outcome zones and engine mark ────────────────────────────────
    outcomeRefs.current.forEach((el) => {
      if (!el) return;
      gsap.set(el, { opacity: 0 });
      const mv = el.querySelector<HTMLElement>(".metric-value");
      const ml = el.querySelector<HTMLElement>(".metric-label");
      const pn = el.querySelector<HTMLElement>(".project-name");
      if (mv) gsap.set(mv, { clipPath: "inset(0% 100% 0% 0%)" });
      if (ml) gsap.set(ml, { clipPath: "inset(0% 100% 0% 0%)" });
      if (pn) gsap.set(pn, { clipPath: "inset(0% 100% 0% 0%)" });
    });
    gsap.set(engineMarkRef.current, { scale: 0, transformOrigin: "center" });

    // ── Build SVG paths ───────────────────────────────────────────────────
    // Leader lines: from each project card to its outcome zone
    OUTCOMES.forEach((outcome, i) => {
      const pathEl = leaderRefs.current[i];
      if (!pathEl) return;
      const from = { x: S4_END[outcome.projectId as keyof typeof S4_END].x * vw,
                     y: S4_END[outcome.projectId as keyof typeof S4_END].y * vh };
      const to   = { x: outcome.zoneX * vw, y: outcome.zoneY * vh };
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const d = `M ${from.x} ${from.y} C ${from.x} ${from.y + 30}, ${to.x} ${to.y - 30}, ${to.x} ${to.y}`;
      pathEl.setAttribute("d", d);
      const pLen = pathEl.getTotalLength();
      gsap.set(pathEl, { strokeDasharray: pLen, strokeDashoffset: pLen, opacity: 0 });
    });

    // Outcome bars
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      const len = el.getTotalLength?.() ?? 100;
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    });

    // Engine connectors: lines from each outcome zone to center engine mark
    const engineCenter = { x: 0.50 * vw, y: 0.44 * vh };
    OUTCOMES.forEach((outcome, i) => {
      const pathEl = engineConnRefs.current[i];
      if (!pathEl) return;
      const from = { x: outcome.zoneX * vw, y: outcome.zoneY * vh };
      const d = `M ${from.x} ${from.y} Q ${(from.x + engineCenter.x) / 2} ${(from.y + engineCenter.y) / 2 - 20} ${engineCenter.x} ${engineCenter.y}`;
      pathEl.setAttribute("d", d);
      const pLen = pathEl.getTotalLength();
      gsap.set(pathEl, { strokeDasharray: pLen, strokeDashoffset: pLen, opacity: 0 });
    });

    // ── Master timeline ───────────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // Growth beam spans full scene
    tl.to(growthBeamRef.current, { attr: { y1: GROWTH_SVG.beamApex }, duration: 1.0 }, 0);
    tl.to(growthFlareRef.current, { scale: 1.0, opacity: 1.0, transformOrigin: "center", duration: 1.0 }, 0);

    // ── Per-outcome reveals ────────────────────────────────────────────────
    OUTCOMES.forEach((outcome, i) => {
      const zone   = outcomeRefs.current[i];
      const leader = leaderRefs.current[i];
      const bar    = barRefs.current[i];
      if (!zone) return;

      // Leader line draws
      if (leader) {
        tl.to(leader, { opacity: 0.35, duration: 0.02 }, outcome.timeStart + 0.02);
        tl.to(leader, { strokeDashoffset: 0, duration: outcome.metricStart - outcome.timeStart - 0.04 }, outcome.timeStart + 0.02);
      }

      // Zone fades into position
      tl.to(zone, { opacity: 1, duration: 0.06 }, outcome.metricStart - 0.04);

      // Metric value wipes in
      const mv = zone.querySelector<HTMLElement>(".metric-value");
      if (mv) tl.to(mv, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08 }, outcome.metricStart);

      // Metric label wipes in
      const ml = zone.querySelector<HTMLElement>(".metric-label");
      if (ml) tl.to(ml, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.07 }, outcome.metricStart + 0.06);

      // Project name wipes in
      const pn = zone.querySelector<HTMLElement>(".project-name");
      if (pn) tl.to(pn, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.06 }, outcome.metricStart + 0.10);

      // Measurement bar draws
      if (bar) tl.to(bar, { strokeDashoffset: 0, duration: 0.08 }, outcome.metricStart + 0.04);

      // Growth tick reveals
      if (outcome.growthTick >= 0 && outcome.growthTick < 4) {
        const tick = growthTickRefs.current[outcome.growthTick];
        if (tick) tl.to(tick, { opacity: 0.55, duration: 0.06 }, outcome.metricStart + 0.05);
      }
    });

    // ── Phase 5: Engine mark + connectors ──────────────────────────────────
    tl.to(engineMarkRef.current, { scale: 1, duration: 0.08 }, 0.87);

    engineConnRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.to(el, { opacity: 0.25, duration: 0.02 }, 0.87 + i * 0.025);
      tl.to(el, { strokeDashoffset: 0, duration: 0.10 }, 0.87 + i * 0.025);
    });

    // Dummy end
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
          let phase = "Inherited";
          if (p > 0.06) phase = "Generating";
          if (p > 0.52) phase = "Multiplying";
          if (p > 0.87) phase = "Assembled";
          phaseRef.current.textContent = phase;
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
    };
  }, []);

  const vwPct = (n: number) => `${n * 100}%`;
  const vhPct = (n: number) => `${n * 100}%`;

  return (
    <div ref={containerRef}
      style={{ height: `${PIN_VH * 100}vh`, position: "relative" }}>

      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* SVG layer: leader lines, bars, engine connectors */}
        <svg ref={svgRef} style={{
          position: "absolute", top: 0, left: 0,
          pointerEvents: "none", zIndex: 1, overflow: "visible",
        }}>
          {/* Leader lines from project cards to outcome zones */}
          {OUTCOMES.map((_, i) => (
            <path key={`leader-${i}`}
              ref={(el) => { leaderRefs.current[i] = el; }}
              fill="none"
              stroke="rgba(196,154,60,0.35)"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
          ))}

          {/* Outcome measurement bars */}
          {OUTCOMES.map((outcome, i) => (
            <line key={`bar-${i}`}
              ref={(el) => { barRefs.current[i] = el; }}
              x1={`${outcome.zoneX * 100}%`}
              y1={`${(outcome.zoneY + 0.10) * 100}%`}
              x2={`${(outcome.zoneX + outcome.barW) * 100}%`}
              y2={`${(outcome.zoneY + 0.10) * 100}%`}
              stroke="rgba(196,154,60,0.45)"
              strokeWidth={0.75}
              strokeLinecap="round"
            />
          ))}

          {/* Engine connectors: outcome zones → central engine mark */}
          {OUTCOMES.map((_, i) => (
            <path key={`conn-${i}`}
              ref={(el) => { engineConnRefs.current[i] = el; }}
              fill="none"
              stroke="rgba(196,154,60,0.40)"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
          ))}
        </svg>

        {/* Project card wrappers (positioned by GSAP) */}
        {Object.keys(S4_END).filter(id => id !== "growth").map((id) => (
          <div key={id}
            ref={(el) => { ingRefs.current[id] = el; }}
            style={{
              position: "absolute", top: 0, left: 0,
              transform: "translate(-50%,-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              zIndex: 5,
            }}
          >
            <S5ProjectCard projectId={id} />
          </div>
        ))}

        {/* Growth element */}
        <div ref={(el) => { ingRefs.current["growth"] = el; }}
          style={{
            position: "absolute", top: 0, left: 0,
            transform: "translate(-50%,-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            zIndex: 7,
          }}
        >
          <GrowthBeam
            beamRef={growthBeamRef}
            flareRef={growthFlareRef}
            tickRefs={growthTickRefs}
          />
          <div style={{
            fontFamily: "var(--font-mono,'Courier New',monospace)",
            fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--text-muted)", textAlign: "center",
          }}>Growth</div>
        </div>

        {/* Outcome zones */}
        {OUTCOMES.map((outcome, i) => (
          <div key={outcome.projectId}
            ref={(el) => { outcomeRefs.current[i] = el; }}
            style={{
              position: "absolute",
              left: vwPct(outcome.zoneX),
              top: vhPct(outcome.zoneY),
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              gap: 4, pointerEvents: "none", zIndex: 8,
            }}
          >
            <div className="project-name" style={{
              fontFamily: "var(--font-mono,'Courier New',monospace)",
              fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--text-muted)", overflow: "hidden",
            }}>
              {outcome.projectName}
            </div>

            <div className="metric-value" style={{
              fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
              fontSize: "clamp(32px, 4.5vw, 56px)",
              fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
              color: "var(--brass)", overflow: "hidden",
            }}>
              {outcome.metric}
            </div>

            <div className="metric-label" style={{
              fontFamily: "var(--font-mono,'Courier New',monospace)",
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--text-secondary)", opacity: 0.65, overflow: "hidden",
            }}>
              {outcome.metricLabel}
            </div>
          </div>
        ))}

        {/* Central Engine Mark — "Same Engine" moment */}
        <div ref={engineMarkRef}
          style={{
            position: "absolute",
            left: "50%", top: "44%",
            transform: "translate(-50%,-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            zIndex: 10, pointerEvents: "none",
          }}
        >
          {/* The engine mark — Subject-like diamond */}
          <div style={{
            width: 32, height: 32,
            border: "1.25px solid rgba(196,154,60,0.75)",
            background: "rgba(196,154,60,0.06)",
            borderRadius: 3,
            transform: "rotate(45deg)",
          }} />
          <div style={{
            fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
            fontSize: "clamp(11px,1.2vw,14px)", fontStyle: "italic",
            color: "var(--text-secondary)", opacity: 0.70,
            whiteSpace: "nowrap", textAlign: "center",
          }}>
            Different Industries.
          </div>
          <div style={{
            fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
            fontSize: "clamp(11px,1.2vw,14px)", fontStyle: "italic",
            color: "var(--brass)", opacity: 0.80,
            whiteSpace: "nowrap", textAlign: "center",
          }}>
            Same Engine.
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
              S5 · Transformation
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
            Inherited
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── S5ProjectCard ────────────────────────────────────────────────────────────

const PROJECT_DATA: Record<string, { name: string; industry: string; metric: string; label: string }> = {
  "smart-packaging": { name: "Smart Packaging", industry: "Manufacturing · B2B", metric: "+40%", label: "RFQ Conv." },
  "jkp":             { name: "JKP Padmalaya",   industry: "Hospitality",          metric: "+212%", label: "Booking" },
  "sierra":          { name: "Sierra Aerospace", industry: "Aerospace · Enterprise", metric: "3.4×", label: "RFQs" },
  "threxa":          { name: "Threxa",           industry: "Commerce · Auto",       metric: "15+", label: "Hrs/Wk" },
};

function S5ProjectCard({ projectId }: { projectId: string }) {
  const data = PROJECT_DATA[projectId];
  if (!data) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative" }}>
        <ProjectMark id={projectId} size={44} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
          fontSize: "clamp(10px,1vw,12px)", fontWeight: 700,
          color: "var(--text-primary)", opacity: 0.70,
          whiteSpace: "nowrap",
        }}>
          {data.name}
        </div>
        <div style={{
          fontFamily: "var(--font-mono,'Courier New',monospace)",
          fontSize: 8, letterSpacing: "0.10em", textTransform: "uppercase",
          color: "var(--text-muted)", marginTop: 2,
        }}>
          {data.industry}
        </div>
      </div>
    </div>
  );
}
