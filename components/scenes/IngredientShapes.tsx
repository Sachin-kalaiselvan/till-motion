/**
 * IngredientShapes
 *
 * The five ingredient tokens redesigned from cold geometric forms
 * to warm, crafted physical objects.
 *
 * Visual direction:
 *   Before: Abstract geometric (hexagon, ring, polygon) — AI operating system
 *   After:  Material ingredient cards with brass borders and paper surfaces
 *
 * Each shape is an SVG that reads like a physical object:
 *   Website    — a layout card: structured viewport grid on warm paper
 *   Brand      — a seal medallion: radiant brass ring, identity mark
 *   Automation — a clockwork dial: precision ring with brass tick marks
 *   AI         — a constellation tile: organic node web on warm ground
 *   Growth     — an output beacon: ascending brass beam with amber apex
 *
 * All shapes use:
 *   --brass strokes:  rgba(196, 154, 60, 0.X) for primary structure
 *   --cream fills:    rgba(230, 218, 196, 0.X) for subtle interior warmth
 *   --card paper:     #F0E8D8 for light card surfaces (used in Website card)
 *
 * Connection line endpoints: the center of each shape's bounding box,
 * which matches the GSAP wrapper's transform-origin. No geometry changes
 * are needed in the GSAP timeline code.
 */

import React from "react";

// ─── Brass palette (matched to globals.css) ───────────────────────────────

const B = {
  heavy:   "rgba(196, 154, 60, 0.70)",
  main:    "rgba(196, 154, 60, 0.55)",
  mid:     "rgba(196, 154, 60, 0.40)",
  light:   "rgba(196, 154, 60, 0.22)",
  faint:   "rgba(196, 154, 60, 0.10)",
  fill:    "rgba(196, 154, 60, 0.06)",
};

// Warm cream for fills and light structural lines
const C = {
  soft:    "rgba(230, 218, 196, 0.45)",
  faint:   "rgba(230, 218, 196, 0.20)",
  ghost:   "rgba(230, 218, 196, 0.08)",
  text:    "rgba(196, 175, 138, 0.60)",
  textMid: "rgba(196, 175, 138, 0.40)",
};

// ─── Website — structured viewport card ──────────────────────────────────

export function WebsiteShape({ size = 64 }: { size?: number }) {
  const w = size * 1.5;
  const h = size * 0.9;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      style={{ display: "block", overflow: "visible" }}>

      {/* Outer card frame — warm brass border */}
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} rx={3}
        fill={B.faint}
        stroke={B.main} strokeWidth={1} />

      {/* Header bar */}
      <line x1={0.75} y1={h * 0.24} x2={w - 0.75} y2={h * 0.24}
        stroke={B.mid} strokeWidth={0.5} />

      {/* Three nav dots — warm brass */}
      {[0.10, 0.17, 0.24].map((t, i) => (
        <circle key={i} cx={w * t} cy={h * 0.12} r={1.6}
          fill={B.mid} />
      ))}

      {/* Content grid: two vertical column guides */}
      <line x1={w * 0.36} y1={h * 0.30} x2={w * 0.36} y2={h * 0.90}
        stroke={B.light} strokeWidth={0.4} />
      <line x1={w * 0.65} y1={h * 0.30} x2={w * 0.65} y2={h * 0.90}
        stroke={B.light} strokeWidth={0.4} />

      {/* Content lines — varying widths for visual rhythm */}
      {[0.40, 0.54, 0.68, 0.82].map((t, i) => (
        <line key={i}
          x1={w * 0.08} y1={h * t}
          x2={w * (0.08 + 0.22 + i * 0.07)} y2={h * t}
          stroke={C.faint} strokeWidth={0.5} />
      ))}
    </svg>
  );
}

// ─── Brand — seal medallion ───────────────────────────────────────────────

export function BrandShape({ size = 64 }: { size?: number }) {
  const r = size / 2;
  const s = size + 24;
  const c = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none"
      style={{ display: "block", overflow: "visible" }}>

      {/* Outer pulse halo — very faint */}
      <circle cx={c} cy={c} r={r + 9}
        stroke={B.faint} strokeWidth={0.75} strokeDasharray="2 4" />

      {/* Mid echo ring */}
      <circle cx={c} cy={c} r={r * 0.72}
        fill={B.fill}
        stroke={B.light} strokeWidth={0.5} />

      {/* Main ring — heaviest stroke, the primary identity */}
      <circle cx={c} cy={c} r={r - 1}
        fill={C.ghost}
        stroke={B.heavy} strokeWidth={1.5} />

      {/* Radiant lines — broadcast signal */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const a = deg * Math.PI / 180;
        const inner = r + 0.5;
        const outer = r + 8;
        return (
          <line key={i}
            x1={c + Math.cos(a) * inner} y1={c + Math.sin(a) * inner}
            x2={c + Math.cos(a) * outer} y2={c + Math.sin(a) * outer}
            stroke={B.mid} strokeWidth={0.75} />
        );
      })}

      {/* Nucleus — the identity core */}
      <circle cx={c} cy={c} r={4}
        fill={B.main} />
    </svg>
  );
}

// ─── Automation — precision clockwork dial ────────────────────────────────

export function AutomationShape({ size = 64 }: { size?: number }) {
  const r = size / 2;
  const cx = r;
  const cy = r;

  // 8 precision tick marks
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const inner = r - 9;
    const outer = r - 2;
    return {
      x1: cx + Math.cos(a) * inner, y1: cy + Math.sin(a) * inner,
      x2: cx + Math.cos(a) * outer, y2: cy + Math.sin(a) * outer,
    };
  });

  const arcR = r - 1;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block", overflow: "visible" }}>

      {/* Inner dial face */}
      <circle cx={cx} cy={cy} r={r * 0.68}
        fill={B.fill}
        stroke={B.light} strokeWidth={0.4} />

      {/* Main ring */}
      <circle cx={cx} cy={cy} r={r - 1}
        fill={C.ghost}
        stroke={B.mid} strokeWidth={1} />

      {/* Precision ticks — brass */}
      {ticks.map((t, i) => (
        <line key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={B.main} strokeWidth={i % 2 === 0 ? 1.2 : 0.75}
          strokeLinecap="round" />
      ))}

      {/* Progress arc — the active quarter, heavier brass */}
      <path
        d={`M ${cx} ${cy - arcR} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`}
        stroke={B.heavy} strokeWidth={2} strokeLinecap="round" />

      {/* Center pivot */}
      <circle cx={cx} cy={cy} r={2.5} fill={B.mid} />
    </svg>
  );
}

// ─── AI — constellation tile ──────────────────────────────────────────────

export function AIShape({ size = 64 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;

  // Irregular organic vertices — warmly irregular, not mechanical
  const radii = [0.92, 0.80, 0.95, 0.76, 0.90, 0.83, 0.94];
  const verts = radii.map((r, i) => {
    const a = (i / radii.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(a) * r * (size / 2 - 5),
      y: cy + Math.sin(a) * r * (size / 2 - 5),
    };
  });
  const pts = verts.map((v) => `${v.x},${v.y}`).join(" ");

  // Neural node cluster — warm brass dots
  const nodes = [
    { x: cx,      y: cy - 5,  r: 2.8 },
    { x: cx + 10, y: cy + 7,  r: 2.0 },
    { x: cx - 9,  y: cy + 8,  r: 2.0 },
    { x: cx + 4,  y: cy + 17, r: 1.5 },
    { x: cx - 5,  y: cy + 17, r: 1.5 },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block", overflow: "visible" }}>

      {/* Outer polygon — organic, warm */}
      <polygon points={pts}
        fill={B.fill}
        stroke={B.mid} strokeWidth={1} />

      {/* Neural connections — warm, varied weight */}
      <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[1].x} y2={nodes[1].y}
        stroke={B.mid} strokeWidth={0.6} />
      <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[2].x} y2={nodes[2].y}
        stroke={B.mid} strokeWidth={0.6} />
      <line x1={nodes[1].x} y1={nodes[1].y} x2={nodes[3].x} y2={nodes[3].y}
        stroke={B.light} strokeWidth={0.4} />
      <line x1={nodes[2].x} y1={nodes[2].y} x2={nodes[4].x} y2={nodes[4].y}
        stroke={B.light} strokeWidth={0.4} />
      <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[4].x} y2={nodes[4].y}
        stroke={C.faint} strokeWidth={0.4} />

      {/* Nodes */}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r}
          fill={i === 0 ? B.main : B.mid} />
      ))}
    </svg>
  );
}

// ─── Growth — ascending beacon ────────────────────────────────────────────

export function GrowthShape({ size = 64 }: { size?: number }) {
  const w = size * 0.85;
  const h = size * 0.75;
  const cx = w / 2;
  const innerApexY = h * 0.35;

  return (
    <svg width={w + 16} height={h + 32}
      viewBox={`${-8} ${-4} ${w + 16} ${h + 32}`} fill="none"
      style={{ display: "block", overflow: "visible" }}>

      {/* Chevron — brass */}
      <path
        d={`M ${cx} 4 L ${w - 2} ${h - 8} L ${cx + 8} ${h - 8} L ${cx} ${innerApexY} L ${cx - 8} ${h - 8} L 2 ${h - 8} Z`}
        fill={B.faint}
        stroke={B.main} strokeWidth={1} strokeLinejoin="round" />

      {/* Apex glow point */}
      <circle cx={cx} cy={4} r={3} fill="none" stroke={B.mid} strokeWidth={0.75} />
      <circle cx={cx} cy={4} r={1.5} fill={B.main} />

      {/* Velocity lines below — warm */}
      {[-8, 0, 8].map((offset, i) => (
        <line key={i}
          x1={cx + offset} y1={h + 8}
          x2={cx + offset} y2={h + 18 + (i === 1 ? 4 : 0)}
          stroke={B.mid} strokeWidth={0.75} strokeLinecap="round" />
      ))}

      {/* Acceleration marks */}
      {[h - 10, h * 0.68, h * 0.45, h * 0.25].map((ty, i) => (
        <line key={i}
          x1={cx - (5 - i)} y1={ty}
          x2={cx + (5 - i)} y2={ty}
          stroke={B.light} strokeWidth={0.5} strokeLinecap="round" />
      ))}
    </svg>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────

export function IngredientShape({ id, size }: { id: string; size?: number }) {
  switch (id) {
    case "website":    return <WebsiteShape size={size} />;
    case "brand":      return <BrandShape size={size} />;
    case "automation": return <AutomationShape size={size} />;
    case "ai":         return <AIShape size={size} />;
    case "growth":     return <GrowthShape size={size} />;
    default:           return null;
  }
}

// ─── Trust signal — warm brass seal ──────────────────────────────────────

export function TrustSignal({
  diamondRef,
  fillRef,
}: {
  diamondRef?: React.RefObject<SVGPathElement | null>;
  fillRef?: React.RefObject<SVGRectElement | null>;
}) {
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" fill="none"
      style={{ overflow: "visible" }}>
      {/* Interior fill — reveals via clip-path */}
      <rect ref={fillRef}
        x={8} y={8} width={40} height={40}
        fill={B.fill}
        transform="rotate(45,28,28)" />
      {/* Diamond seal */}
      <path ref={diamondRef}
        d="M 28 6 L 50 28 L 28 50 L 6 28 Z"
        stroke={B.main} strokeWidth={0.75} fill="none" />
      <circle cx={28} cy={28} r={2.5} fill={B.mid} />
    </svg>
  );
}

// ─── Efficiency signal — warm completion arc ──────────────────────────────

export function EfficiencySignal({
  arcRef,
}: {
  arcRef?: React.RefObject<SVGCircleElement | null>;
}) {
  const r = 22;
  const size = (r + 10) * 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * 90 / 360; // start at 270° drawn

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ overflow: "visible" }}>
      {/* Ghost reference ring */}
      <circle cx={center} cy={center} r={r}
        fill={B.fill}
        stroke={B.light} strokeWidth={0.5} />
      {/* The closing arc — brass */}
      <circle ref={arcRef}
        cx={center} cy={center} r={r}
        stroke={B.main} strokeWidth={1}
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${offset}`}
        transform={`rotate(-90, ${center}, ${center})`} />
      {/* Terminal mark */}
      <circle cx={center} cy={center - r} r={2}
        fill={B.mid} />
    </svg>
  );
}

// ─── Compact versions for S6 ──────────────────────────────────────────────

export function TrustSignalCompact() {
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" fill="none"
      style={{ overflow: "visible" }}>
      <rect x={6} y={6} width={32} height={32}
        fill={B.fill} transform="rotate(45,22,22)" />
      <path d="M 22 4 L 40 22 L 22 40 L 4 22 Z"
        stroke={B.heavy} strokeWidth={1.5} fill="none" />
      <circle cx={22} cy={22} r={2.5} fill={B.main} />
    </svg>
  );
}

export function EfficiencySignalCompact() {
  const r = 16; const c = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * 15 / 360;
  return (
    <svg width={c * 2} height={c * 2} viewBox={`0 0 ${c * 2} ${c * 2}`} fill="none"
      style={{ overflow: "visible" }}>
      <circle cx={c} cy={c} r={r} fill={B.fill} stroke={B.light} strokeWidth={0.5} />
      <circle cx={c} cy={c} r={r}
        stroke={B.heavy} strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90, ${c}, ${c})`} />
      <circle cx={c} cy={c} r={2.5} fill={B.main} />
    </svg>
  );
}

// ─── Growth beam for S5/S6 ────────────────────────────────────────────────

export function GrowthBeam({
  beamRef,
  flareRef,
  tickRefs,
  ringRef,
}: {
  beamRef:  React.RefObject<SVGLineElement | null>;
  flareRef: React.RefObject<SVGCircleElement | null>;
  tickRefs: React.MutableRefObject<(SVGLineElement | null)[]>;
  ringRef?: React.RefObject<SVGCircleElement | null>;
}) {
  const cx = 30, beamBase = 128, flareCY = 18, flareR = 6;
  const tickPositions = [112, 92, 68, 40];
  const beamY1_S4 = 47;
  return (
    <svg width={60} height={140} viewBox="0 0 60 140" fill="none"
      style={{ display: "block", overflow: "visible" }}>
      {/* Beam */}
      <line ref={beamRef}
        x1={cx} y1={beamY1_S4} x2={cx} y2={beamBase}
        stroke={B.heavy} strokeWidth={1.5} strokeLinecap="round" />
      {/* Acceleration ticks */}
      {tickPositions.map((ty, i) => (
        <line key={i} ref={(el) => { tickRefs.current[i] = el; }}
          x1={cx - 5} y1={ty} x2={cx + 5} y2={ty}
          stroke={B.mid} strokeWidth={0.75} strokeLinecap="round" />
      ))}
      {/* Flare */}
      <circle ref={flareRef}
        cx={cx} cy={flareCY} r={flareR}
        fill="none" stroke={B.heavy} strokeWidth={1.25} />
      <circle cx={cx} cy={flareCY} r={2} fill={B.main} />
      {/* Outer bloom */}
      <circle ref={ringRef}
        cx={cx} cy={flareCY} r={flareR + 5}
        fill="none" stroke={B.light} strokeWidth={0.5} />
    </svg>
  );
}

// ─── Real Project Marks ────────────────────────────────────────────────────────
// Four client project tokens replacing abstract geometric ingredients.
// Each mark communicates the project's domain at a glance.

/** Smart Packaging Solutions — hexagonal precision (manufacturing/industrial) */
export function SmartPackagingMark({ size = 48 }: { size?: number }) {
  const r = size * 0.40;
  const cx = size / 2, cy = size / 2;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block" }}>
      <polygon points={pts} fill={B.fill} stroke={B.main} strokeWidth={1} />
      <line x1={cx - r * 0.45} y1={cy} x2={cx + r * 0.45} y2={cy}
        stroke={B.light} strokeWidth={0.5} />
      <line x1={cx} y1={cy - r * 0.45} x2={cx} y2={cy + r * 0.45}
        stroke={B.light} strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={2.5} fill={B.mid} />
    </svg>
  );
}

/** JKP Padmalaya — 8-pointed star (hospitality warmth, discovery) */
export function JKPMark({ size = 48 }: { size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r1 = size * 0.40, r2 = size * 0.18;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block" }}>
      <polygon points={pts} fill={B.fill} stroke={B.main} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={3.5} fill={B.main} />
    </svg>
  );
}

/** Sierra Aerospace — orbit arc with bearing mark (reach, aerospace) */
export function SierraMark({ size = 48 }: { size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const arcStartX = cx, arcStartY = cy - r;
  const arcEndX = cx - r * 0.12, arcEndY = cy + r * 0.99;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block" }}>
      {/* Orbit path — almost complete circle */}
      <path
        d={`M ${arcStartX} ${arcStartY} A ${r} ${r} 0 1 1 ${arcEndX} ${arcEndY}`}
        stroke={B.main} strokeWidth={1} strokeLinecap="round" />
      {/* Orbit body */}
      <circle cx={arcStartX} cy={arcStartY} r={3.5} fill={B.main} />
      {/* Bearing center */}
      <circle cx={cx} cy={cy} r={6} fill="none" stroke={B.light} strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={2} fill={B.mid} />
    </svg>
  );
}

/** Threxa — workflow chain (automation, process flow) */
export function ThrexaMark({ size = 48 }: { size?: number }) {
  const cy = size / 2;
  const x1 = size * 0.16, x2 = size * 0.50, x3 = size * 0.84;
  const nr = 5.5; // node radius
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      style={{ display: "block" }}>
      {/* Connection lines */}
      <line x1={x1 + nr} y1={cy} x2={x2 - nr - 2} y2={cy}
        stroke={B.mid} strokeWidth={0.75} strokeLinecap="round" />
      <line x1={x2 + nr} y1={cy} x2={x3 - nr - 2} y2={cy}
        stroke={B.mid} strokeWidth={0.75} strokeLinecap="round" />
      {/* Arrow tips */}
      <path d={`M ${x2 - nr - 4} ${cy - 3} L ${x2 - nr - 1} ${cy} L ${x2 - nr - 4} ${cy + 3}`}
        stroke={B.mid} strokeWidth={0.75} strokeLinecap="round" fill="none" />
      <path d={`M ${x3 - nr - 4} ${cy - 3} L ${x3 - nr - 1} ${cy} L ${x3 - nr - 4} ${cy + 3}`}
        stroke={B.mid} strokeWidth={0.75} strokeLinecap="round" fill="none" />
      {/* Nodes */}
      <circle cx={x1} cy={cy} r={nr} fill={B.fill} stroke={B.main} strokeWidth={1} />
      <circle cx={x2} cy={cy} r={nr} fill={B.fill} stroke={B.main} strokeWidth={1} />
      {/* Final node filled — represents completion */}
      <circle cx={x3} cy={cy} r={nr} fill={B.mid} />
      <circle cx={x1} cy={cy} r={2} fill={B.mid} />
      <circle cx={x2} cy={cy} r={2} fill={B.mid} />
    </svg>
  );
}

/** Project mark dispatcher */
export function ProjectMark({ id, size }: { id: string; size?: number }) {
  switch (id) {
    case "smart-packaging": return <SmartPackagingMark size={size} />;
    case "jkp":             return <JKPMark size={size} />;
    case "sierra":          return <SierraMark size={size} />;
    case "threxa":          return <ThrexaMark size={size} />;
    default:                return <SmartPackagingMark size={size} />;
  }
}
