"use client";

/**
 * SceneS4 — Relationship Formation
 *
 * "Different Industries. Same Engine."
 *
 * Four real client project modules float independently in a 280vw field.
 * Vertical scroll drives the horizontal pan. As the user explores the field,
 * connection lines draw between projects that share underlying systems:
 *   Smart Packaging ↔ Sierra Aerospace: both B2B, both improved RFQ pipelines
 *   JKP Padmalaya ↔ Threxa: hospitality + the automation platform that powers it
 *
 * The narrative: these four clients are in completely different industries.
 * But they share the same growth infrastructure.
 *
 * Motion architecture is identical to the abstract S4 — only the data changes.
 * The two-layer orbit system (GSAP position, CSS orbit animation) is preserved.
 * All ease:"none" scrub rules apply.
 */

import React, { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGSAP, SCRUB_SMOOTHING } from "@/lib/motion";
import { ProjectMark } from "./IngredientShapes";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_VH   = 2.8;
const FIELD_VW = 280;

// ─── Project definitions ──────────────────────────────────────────────────────

interface ProjectDef {
  id: string;
  name: string;
  industry: string;
  metric: string;
  metricLabel: string;
  homeX: number;   // % of field width
  homeY: number;   // % of viewport height
  clusterX: number;
  clusterY: number;
  depthScale: number;
  orbitClass: string;
}

const PROJECTS: ProjectDef[] = [
  {
    id: "smart-packaging",
    name: "Smart Packaging",
    industry: "Manufacturing · B2B",
    metric: "+40%",
    metricLabel: "RFQ Conversion",
    homeX: 9,   homeY: 44,
    clusterX: 18, clusterY: 48,
    depthScale: 0.96,
    orbitClass: "orbit-lemniscate",
  },
  {
    id: "jkp",
    name: "JKP Padmalaya",
    industry: "Hospitality · Tourism",
    metric: "+212%",
    metricLabel: "Booking Conv.",
    homeX: 30,  homeY: 33,
    clusterX: 24, clusterY: 52,
    depthScale: 1.00,
    orbitClass: "orbit-breathe",
  },
  {
    id: "sierra",
    name: "Sierra Aerospace",
    industry: "Aerospace · Enterprise",
    metric: "3.4×",
    metricLabel: "Qualified RFQs",
    homeX: 54,  homeY: 52,
    clusterX: 60, clusterY: 46,
    depthScale: 1.02,
    orbitClass: "orbit-spin",
  },
  {
    id: "threxa",
    name: "Threxa",
    industry: "Commerce · Automation",
    metric: "15+",
    metricLabel: "Hrs Saved / Week",
    homeX: 78,  homeY: 28,
    clusterX: 76, clusterY: 34,
    depthScale: 1.08,
    orbitClass: "orbit-rise",
  },
];

// ─── Connection line definitions ──────────────────────────────────────────────

interface ConnectionLine {
  id: string;
  fromId: string;
  toId: string;
  drawStart: number;
  drawEnd: number;
  partial: boolean;
  partialEnd?: number;
  label?: string;
}

const CONNECTION_LINES: ConnectionLine[] = [
  {
    id: "line-b2b",
    fromId: "smart-packaging",
    toId: "sierra",
    drawStart: 0.35,
    drawEnd: 0.65,
    partial: false,
    label: "B2B Infrastructure",
  },
  {
    id: "line-automation",
    fromId: "jkp",
    toId: "threxa",
    drawStart: 0.50,
    drawEnd: 0.80,
    partial: false,
    label: "Automation Layer",
  },
  {
    id: "line-engine",
    fromId: "threxa",
    toId: "threxa",
    drawStart: 0.65,
    drawEnd: 0.90,
    partial: true,
    partialEnd: 0.6,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SceneS4() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const fieldRef      = useRef<HTMLDivElement>(null);
  const svgRef        = useRef<SVGSVGElement>(null);
  const tokenWrapRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lineRefs      = useRef<Record<string, SVGPathElement | null>>({});
  const progressBarRef = useRef<HTMLDivElement>(null);
  const phaseTextRef   = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGSAP();

    const container = containerRef.current;
    const field     = fieldRef.current;
    const svg       = svgRef.current;
    if (!container || !field || !svg) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fieldW  = (FIELD_VW / 100) * vw;
    const maxPanX = -(fieldW - vw);

    svg.setAttribute("viewBox", `0 0 ${fieldW} ${vh}`);
    svg.style.width  = `${fieldW}px`;
    svg.style.height = `${vh}px`;

    // ── Set initial positions ─────────────────────────────────────────────
    PROJECTS.forEach((def) => {
      const wrap = tokenWrapRefs.current[def.id];
      if (!wrap) return;
      gsap.set(wrap, {
        x: (def.homeX / 100) * fieldW,
        y: (def.homeY / 100) * vh,
        scale: def.depthScale,
        willChange: "transform",
      });
    });

    // ── Build connection line SVG paths ───────────────────────────────────
    const lineData: Record<string, { length: number }> = {};

    const getCenter = (id: string) => {
      const def = PROJECTS.find((d) => d.id === id);
      if (!def) return { x: 0, y: 0 };
      return { x: (def.homeX / 100) * fieldW, y: (def.homeY / 100) * vh };
    };

    CONNECTION_LINES.forEach((line) => {
      const pathEl = lineRefs.current[line.id];
      if (!pathEl) return;

      if (line.id === "line-engine") {
        // Threxa → center of the field (toward the engine midpoint)
        const from = getCenter("threxa");
        const targetX = (0.45) * fieldW;
        const targetY = 0.50 * vh;
        const midX = (from.x + targetX) / 2;
        const midY = from.y - 50;
        pathEl.setAttribute("d", `M ${from.x} ${from.y} Q ${midX} ${midY} ${targetX} ${targetY}`);
      } else {
        const from = getCenter(line.fromId);
        const to   = getCenter(line.toId);
        const dx = to.x - from.x, dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = (-dy / len) * len * 0.16;
        const ny = ( dx / len) * len * 0.16;
        const c1x = from.x + dx * 0.33 + nx, c1y = from.y + dy * 0.33 + ny;
        const c2x = from.x + dx * 0.67 - nx, c2y = from.y + dy * 0.67 - ny;
        pathEl.setAttribute("d",
          `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`);
      }

      const length = pathEl.getTotalLength();
      lineData[line.id] = { length };
      gsap.set(pathEl, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 });
    });

    // ── Master timeline ───────────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // Track A: Field pan
    tl.fromTo(field, { x: 0 }, { x: maxPanX, duration: 1 }, 0);

    // Track B: Orbit damping (--amp: 1 → 0)
    PROJECTS.forEach((def) => {
      const wrap = tokenWrapRefs.current[def.id];
      if (!wrap) return;
      tl.fromTo(wrap,
        { "--amp": 1 } as gsap.TweenVars,
        { "--amp": 0, duration: 0.70 } as gsap.TweenVars,
        0);
    });

    // Track C: Convergence toward cluster positions
    PROJECTS.forEach((def) => {
      const wrap = tokenWrapRefs.current[def.id];
      if (!wrap) return;
      tl.fromTo(wrap,
        { x: (def.homeX / 100) * fieldW, y: (def.homeY / 100) * vh },
        { x: (def.clusterX / 100) * fieldW, y: (def.clusterY / 100) * vh, duration: 0.60 },
        0.40);
    });

    // Track D: Connection line drawing
    CONNECTION_LINES.forEach((line) => {
      const pathEl = lineRefs.current[line.id];
      const data   = lineData[line.id];
      if (!pathEl || !data) return;

      const dur = line.drawEnd - line.drawStart;
      tl.to(pathEl, { opacity: line.partial ? 0.25 : 0.50, duration: 0.03 }, line.drawStart);

      const targetOffset = line.partial ? data.length * (1 - (line.partialEnd ?? 0.6)) : 0;
      tl.fromTo(pathEl,
        { strokeDashoffset: data.length },
        { strokeDashoffset: targetOffset, duration: dur },
        line.drawStart);
    });

    // Track E: Connection labels + cluster labels
    const clusterLabels = field.querySelectorAll<HTMLElement>(".cluster-label");
    if (clusterLabels.length > 0) {
      tl.fromTo(Array.from(clusterLabels),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.15, stagger: 0.04 },
        0.76);
    }

    // ── ScrollTrigger ─────────────────────────────────────────────────────
    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: `+=${PIN_VH * 100}%`,
      scrub: SCRUB_SMOOTHING,
      animation: tl,
      onUpdate: (self) => {
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${self.progress})`;
        }
        if (phaseTextRef.current) {
          const p = self.progress;
          let phase = "Separate";
          if (p > 0.35) phase = "Connecting";
          if (p > 0.65) phase = "Converging";
          if (p > 0.88) phase = "Same Engine";
          phaseTextRef.current.textContent = phase;
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
      PROJECTS.forEach((def) => {
        const wrap = tokenWrapRefs.current[def.id];
        if (wrap) gsap.set(wrap, { willChange: "auto" });
      });
    };
  }, []);

  return (
    <div ref={containerRef}
      style={{ height: `${PIN_VH * 100}vh`, position: "relative", overflow: "hidden" }}>

      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* Scene label */}
        <div style={{
          position: "absolute", bottom: 40, left: 64, right: 64,
          zIndex: 20, display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", pointerEvents: "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{
              fontFamily: "var(--font-mono,'Courier New',monospace)",
              fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--text-muted)",
            }}>
              S4 · Relationship Formation
            </span>
            <p style={{
              fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
              fontSize: "clamp(11px,1.2vw,14px)", fontStyle: "italic",
              color: "var(--text-secondary)", opacity: 0.7, margin: 0,
            }}>
              Different Industries. Same Engine.
            </p>
            <div style={{ width: 120, height: 1, background: "var(--brass-20)", overflow: "hidden" }}>
              <div ref={progressBarRef} style={{
                height: "100%", background: "var(--brass)",
                transformOrigin: "left center", transform: "scaleX(0)",
              }} />
            </div>
          </div>
          <span ref={phaseTextRef} style={{
            fontFamily: "var(--font-mono,'Courier New',monospace)",
            fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            Separate
          </span>
        </div>

        {/* The horizontal field */}
        <div ref={fieldRef} style={{
          position: "absolute", top: 0, left: 0,
          width: `${FIELD_VW}vw`, height: "100vh", willChange: "transform",
        }}>
          {/* SVG connection lines */}
          <svg ref={svgRef} style={{
            position: "absolute", top: 0, left: 0,
            pointerEvents: "none", zIndex: 1, overflow: "visible",
          }}>
            {CONNECTION_LINES.map((line) => (
              <path
                key={line.id}
                ref={(el) => { lineRefs.current[line.id] = el; }}
                fill="none"
                stroke="rgba(196,154,60,0.60)"
                strokeWidth={line.partial ? 0.5 : 0.75}
                strokeLinecap="round"
                style={line.partial ? { strokeDasharray: "3 5" } : {}}
              />
            ))}
          </svg>

          {/* Project tokens */}
          {PROJECTS.map((def) => (
            <ProjectToken
              key={def.id}
              def={def}
              ref={(el) => { tokenWrapRefs.current[def.id] = el; }}
            />
          ))}

          {/* Connection relationship labels */}
          <ClusterLabel text="B2B Infrastructure" x={31} y={33} />
          <ClusterLabel text="Automation Layer"    x={54} y={22} />
        </div>
      </div>
    </div>
  );
}

// ─── ProjectToken ─────────────────────────────────────────────────────────────

const ProjectToken = React.forwardRef<HTMLDivElement, { def: ProjectDef }>(
  ({ def }, ref) => (
    <div
      ref={ref}
      style={{
        position: "absolute", top: 0, left: 0,
        ["--amp" as string]: "1",
        zIndex: Math.round(def.depthScale * 10),
      }}
    >
      <div
        className={`token-orbit ${def.orbitClass}`}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
      >
        {/* Project mark SVG */}
        <ProjectCard def={def} />

        {/* Name + industry label */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-display,'Playfair Display',Georgia,serif)",
            fontSize: "clamp(10px,1vw,13px)", fontWeight: 700,
            letterSpacing: "-0.01em", color: "var(--text-primary)", opacity: 0.80,
            whiteSpace: "nowrap",
          }}>
            {def.name}
          </div>
          <div style={{
            fontFamily: "var(--font-mono,'Courier New',monospace)",
            fontSize: 8, letterSpacing: "0.10em", textTransform: "uppercase",
            color: "var(--text-muted)", marginTop: 2,
          }}>
            {def.industry}
          </div>
        </div>
      </div>
    </div>
  )
);
ProjectToken.displayName = "ProjectToken";


// ─── ProjectMarkSVG ─────────────────────────────────────────────────────────
// Pure SVG marks for use inside <svg> elements (no React component nesting).
// Brass palette: rgba(196,154,60,X)

function ProjectMarkSVG({ id, cx, cy, size }: { id: string; cx: number; cy: number; size: number }) {
  const r = size / 2;
  const B = {
    main: "rgba(196,154,60,0.60)",
    mid:  "rgba(196,154,60,0.40)",
    fill: "rgba(196,154,60,0.08)",
    lite: "rgba(196,154,60,0.25)",
  };

  switch (id) {
    case "smart-packaging": {
      // Hexagon
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        return `${(cx + Math.cos(a) * r * 0.88).toFixed(1)},${(cy + Math.sin(a) * r * 0.88).toFixed(1)}`;
      }).join(" ");
      return (
        <g>
          <polygon points={pts} fill={B.fill} stroke={B.main} strokeWidth={0.9} />
          <line x1={cx - r * 0.4} y1={cy} x2={cx + r * 0.4} y2={cy} stroke={B.lite} strokeWidth={0.4} />
          <line x1={cx} y1={cy - r * 0.4} x2={cx} y2={cy + r * 0.4} stroke={B.lite} strokeWidth={0.4} />
          <circle cx={cx} cy={cy} r={2} fill={B.mid} />
        </g>
      );
    }
    case "jkp": {
      // 8-pointed star
      const pts = Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 0.88 : r * 0.40;
        return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`;
      }).join(" ");
      return (
        <g>
          <polygon points={pts} fill={B.fill} stroke={B.main} strokeWidth={0.9} />
          <circle cx={cx} cy={cy} r={3} fill={B.mid} />
        </g>
      );
    }
    case "sierra": {
      // Orbit arc
      const arcR = r * 0.82;
      const sx = cx, sy = cy - arcR;
      const ex = cx - arcR * 0.12, ey = cy + arcR * 0.99;
      return (
        <g>
          <path d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 1 1 ${ex} ${ey}`}
            stroke={B.main} strokeWidth={0.9} strokeLinecap="round" fill="none" />
          <circle cx={sx} cy={sy} r={3} fill={B.mid} />
          <circle cx={cx} cy={cy} r={5} fill="none" stroke={B.lite} strokeWidth={0.4} />
          <circle cx={cx} cy={cy} r={1.5} fill={B.mid} />
        </g>
      );
    }
    case "threxa": {
      // Workflow nodes
      const x1 = cx - r * 0.7, x2 = cx, x3 = cx + r * 0.7;
      const nr = 4.5;
      return (
        <g>
          <line x1={x1 + nr} y1={cy} x2={x2 - nr - 2} y2={cy} stroke={B.mid} strokeWidth={0.6} strokeLinecap="round" />
          <line x1={x2 + nr} y1={cy} x2={x3 - nr - 2} y2={cy} stroke={B.mid} strokeWidth={0.6} strokeLinecap="round" />
          <path d={`M ${x2 - nr - 3} ${cy - 2.5} L ${x2 - nr} ${cy} L ${x2 - nr - 3} ${cy + 2.5}`}
            stroke={B.mid} strokeWidth={0.6} strokeLinecap="round" fill="none" />
          <path d={`M ${x3 - nr - 3} ${cy - 2.5} L ${x3 - nr} ${cy} L ${x3 - nr - 3} ${cy + 2.5}`}
            stroke={B.mid} strokeWidth={0.6} strokeLinecap="round" fill="none" />
          <circle cx={x1} cy={cy} r={nr} fill={B.fill} stroke={B.main} strokeWidth={0.9} />
          <circle cx={x2} cy={cy} r={nr} fill={B.fill} stroke={B.main} strokeWidth={0.9} />
          <circle cx={x3} cy={cy} r={nr} fill={B.mid} />
          <circle cx={x1} cy={cy} r={1.5} fill={B.mid} />
          <circle cx={x2} cy={cy} r={1.5} fill={B.mid} />
        </g>
      );
    }
    default:
      return null;
  }
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

/**
 * ProjectCard
 * A small physical card-like SVG showing the project mark + hero metric.
 * The card surface is warm cream against the dark field — reads as a
 * real project file or client brief sitting on the workspace.
 */
function ProjectCard({ def }: { def: ProjectDef }) {
  const w = 76, h = 92;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      style={{ display: "block", overflow: "visible" }}>

      {/* Card surface — warm paper */}
      <rect x={1} y={1} width={w - 2} height={h - 2} rx={4}
        fill="rgba(240,232,210,0.07)"
        stroke="rgba(196,154,60,0.45)"
        strokeWidth={0.75} />

      {/* Subtle top accent line */}
      <line x1={8} y1={1} x2={w - 8} y2={1} stroke="rgba(196,154,60,0.60)" strokeWidth={1.5} />

      {/* Project mark — drawn directly as SVG paths using shapes inline */}
      <ProjectMarkSVG id={def.id} cx={w / 2} cy={29} size={32} />

      {/* Separator */}
      <line x1={8} y1={54} x2={w - 8} y2={54} stroke="rgba(196,154,60,0.20)" strokeWidth={0.5} />

      {/* Metric value — large, bold */}
      <text x={w / 2} y={70}
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize={16}
        fontWeight={700}
        fill="rgba(196,154,60,0.90)"
        letterSpacing="-0.03em">
        {def.metric}
      </text>

      {/* Metric label */}
      <text x={w / 2} y={83}
        textAnchor="middle"
        fontFamily="'Courier New', Courier, monospace"
        fontSize={6.5}
        letterSpacing="0.08em"
        fill="rgba(196,154,60,0.50)">
        {def.metricLabel.toUpperCase()}
      </text>
    </svg>
  );
}

// ─── Cluster label ────────────────────────────────────────────────────────────

function ClusterLabel({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <div className="cluster-label" style={{
      position: "absolute",
      left: `${x}%`, top: `${y}vh`,
      transform: "translateX(-50%)",
      fontFamily: "var(--font-mono,'Courier New',monospace)",
      fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
      color: "rgba(196,154,60,0.55)",
      whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5,
      opacity: 0,
    }}>
      {text}
    </div>
  );
}
