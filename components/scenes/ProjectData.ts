/**
 * ProjectData
 *
 * Single source of truth for the four real TIL projects used in S4–S6.
 * Replaces the abstract ingredient system (Website, Brand, Automation, AI, Growth)
 * with real business outcomes from real clients.
 *
 * Narrative: "Different Industries. Same Engine."
 *
 * Field positions (homeX/homeY) are % of the 280vw S4 field.
 * Cluster positions converge to form two affinity pairs:
 *   Left pair:  Smart Packaging + JKP Padmalaya  → Conversion Engine
 *   Right pair: Sierra Aerospace + Threxa         → Operations Engine
 *
 * The Growth beacon remains as the output signal above all projects.
 */

export interface Project {
  id:                  string;
  name:                string;
  shortName:           string;
  industry:            string;
  url?:                string;
  primaryMetric:       string;  // e.g. "+212%"
  primaryLabel:        string;  // e.g. "Booking Conversion"
  secondaryMetric:     string;  // e.g. "4.9/5"
  secondaryLabel:      string;  // e.g. "Guest Rating"
  outcomeLabels:       [string, string, string]; // three consequence bars
  orbitClass:          string;  // CSS orbit class
  depthScale:          number;  // Z-depth simulation
  // S4 field positions
  homeX:               number;  // % of field width
  homeY:               number;  // % of viewport height
  clusterX:            number;  // % of field width (S4 end)
  clusterY:            number;  // % of viewport height (S4 end)
  // S5 starting positions (viewport %)
  s5StartX:            number;
  s5StartY:            number;
  // S5 merged positions
  s5MergedX:           number;
  s5MergedY:           number;
  // S6 assembly slot positions (viewport %)
  s6AssemblyX:         number;
  s6AssemblyY:         number;
}

export const PROJECTS: Project[] = [
  {
    id:                "sps",
    name:              "Smart Packaging Solutions",
    shortName:         "Smart Packaging",
    industry:          "Manufacturing · B2B",
    url:               "smartpackagingsolutions.in",
    primaryMetric:     "+40%",
    primaryLabel:      "RFQ Conversion",
    secondaryMetric:   "2.5×",
    secondaryLabel:    "Organic Traffic",
    outcomeLabels:     ["Higher lead quality", "More direct RFQs", "Reduced acquisition cost"],
    orbitClass:        "orbit-lemniscate",
    depthScale:        0.95,
    // S4 — left zone of the field
    homeX: 7,   homeY: 42,
    clusterX: 16, clusterY: 47,
    // S5 — left cluster (pairs with JKP)
    s5StartX: 0.22, s5StartY: 0.38,
    s5MergedX: 0.26, s5MergedY: 0.44,
    // S6 — exterior right face (the surface clients touch)
    s6AssemblyX: 0.63, s6AssemblyY: 0.44,
  },
  {
    id:                "jkp",
    name:              "JKP Padmalaya",
    shortName:         "JKP Padmalaya",
    industry:          "Hospitality · Tourism",
    url:               undefined,
    primaryMetric:     "+212%",
    primaryLabel:      "Booking Conversion",
    secondaryMetric:   "4.9/5",
    secondaryLabel:    "Guest Rating",
    outcomeLabels:     ["More direct bookings", "Higher RevPAR", "Stronger repeat stays"],
    orbitClass:        "orbit-breathe",
    depthScale:        1.0,
    // S4 — center-left zone
    homeX: 24,  homeY: 32,
    clusterX: 22, clusterY: 52,
    // S5 — left cluster (pairs with SPS)
    s5StartX: 0.32, s5StartY: 0.50,
    s5MergedX: 0.34, s5MergedY: 0.44,
    // S6 — nested interior (customer intelligence layer)
    s6AssemblyX: 0.44, s6AssemblyY: 0.43,
  },
  {
    id:                "sierra",
    name:              "Sierra Aerospace",
    shortName:         "Sierra Aerospace",
    industry:          "Aerospace · Enterprise",
    url:               "sierraaerospace.in",
    primaryMetric:     "3.4×",
    primaryLabel:      "Qualified RFQs",
    secondaryMetric:   "11",
    secondaryLabel:    "Countries Reached",
    outcomeLabels:     ["Qualified enterprise leads", "Global market reach", "Faster sales cycles"],
    orbitClass:        "orbit-drift",
    depthScale:        1.02,
    // S4 — center-right zone
    homeX: 47,  homeY: 54,
    clusterX: 57, clusterY: 46,
    // S5 — right cluster (pairs with Threxa)
    s5StartX: 0.58, s5StartY: 0.36,
    s5MergedX: 0.61, s5MergedY: 0.44,
    // S6 — nucleus (the enterprise core)
    s6AssemblyX: 0.50, s6AssemblyY: 0.44,
  },
  {
    id:                "threxa",
    name:              "Threxa",
    shortName:         "Threxa",
    industry:          "Commerce Automation",
    url:               "threxa.theingredientlist.co",
    primaryMetric:     "15+",
    primaryLabel:      "Hours Saved Weekly",
    secondaryMetric:   "2×",
    secondaryLabel:    "Faster Processing",
    outcomeLabels:     ["Automated operations", "Faster response time", "Reduced manual load"],
    orbitClass:        "orbit-spin",
    depthScale:        1.02,
    // S4 — right zone
    homeX: 65,  homeY: 38,
    clusterX: 62, clusterY: 51,
    // S5 — right cluster (pairs with Sierra)
    s5StartX: 0.68, s5StartY: 0.52,
    s5MergedX: 0.62, s5MergedY: 0.44,
    // S6 — process ring (automation wraps around nucleus)
    s6AssemblyX: 0.50, s6AssemblyY: 0.44,
  },
];

// Growth beacon — unchanged structurally, now represents aggregate output
export const GROWTH_TOKEN = {
  id:         "growth",
  name:       "Growth",
  descriptor: "The engine output",
  orbitClass: "orbit-rise",
  depthScale: 1.08,
  homeX:      81,
  homeY:      26,
  clusterX:   81,
  clusterY:   30,
  s5StartX:   0.50,
  s5StartY:   0.13,
  s6AssemblyX: 0.50,
  s6AssemblyY: 0.13,
};

// ─── S4 connection lines ────────────────────────────────────────────────────
// "Connection lines represent flow of leads, bookings, RFQs, automations."
// Left pair: SPS ↔ JKP  (both conversion-focused businesses)
// Right pair: Sierra ↔ Threxa (both B2B operations-focused)
// Growth hint: partial dotted line pointing toward output

export interface S4ConnectionLine {
  id:        string;
  fromId:    string;
  toId:      string;
  label:     string;         // what flows between them
  drawStart: number;
  drawEnd:   number;
  partial:   boolean;
  partialEnd?: number;
}

export const S4_CONNECTIONS: S4ConnectionLine[] = [
  {
    id:        "line-sps-jkp",
    fromId:    "sps",
    toId:      "jkp",
    label:     "Conversion flow",
    drawStart: 0.40,
    drawEnd:   0.70,
    partial:   false,
  },
  {
    id:        "line-sierra-threxa",
    fromId:    "sierra",
    toId:      "threxa",
    label:     "Operations flow",
    drawStart: 0.50,
    drawEnd:   0.80,
    partial:   false,
  },
  {
    id:        "line-growth-hint",
    fromId:    "growth",
    toId:      "growth",  // points toward center
    label:     "Output signal",
    drawStart: 0.65,
    drawEnd:   0.90,
    partial:   true,
    partialEnd: 0.6,
  },
];

// ─── S5 outcome definitions ─────────────────────────────────────────────────
// Left pair (SPS + JKP) → Conversion Engine signal
// Right pair (Sierra + Threxa) → Operations Engine signal

export const S5_CONVERSION = {
  // Which projects combined to form this signal
  projects:    ["sps", "jkp"],
  signalLabel: "Conversion Engine",
  metric:      "+212%",
  metricLabel: "booking conversion",
  bars: [
    { id: "bar-c-0", label: "Higher RFQ Rate",      x: 0.18, y: 0.72, w: 0.14 },
    { id: "bar-c-1", label: "Direct Bookings",       x: 0.18, y: 0.78, w: 0.10 },
    { id: "bar-c-2", label: "Lower Acquisition Cost",x: 0.18, y: 0.84, w: 0.17 },
  ],
  signalCenter: { x: 0.30, y: 0.62 },
};

export const S5_OPERATIONS = {
  projects:    ["sierra", "threxa"],
  signalLabel: "Operations Engine",
  metric:      "3.4×",
  metricLabel: "qualified RFQs",
  bars: [
    { id: "bar-o-0", label: "Qualified Leads",       x: 0.55, y: 0.72, w: 0.12 },
    { id: "bar-o-1", label: "Faster Processing",     x: 0.55, y: 0.78, w: 0.08 },
    { id: "bar-o-2", label: "Automated Operations",  x: 0.55, y: 0.84, w: 0.14 },
  ],
  signalCenter: { x: 0.62, y: 0.62 },
};

// ─── S6 output tile definitions ─────────────────────────────────────────────
// Positioned around the assembled Growth Engine perimeter

export const S6_OUTPUT_TILES = [
  {
    id:      "tile-sierra",
    metric:  "3.4×",
    label:   "Qualified RFQs",
    project: "Sierra Aerospace",
    // Position relative to assembly center (left/right of center)
    side:    "top-right" as const,
  },
  {
    id:      "tile-sps",
    metric:  "+40%",
    label:   "RFQ Conversion",
    project: "Smart Packaging",
    side:    "right" as const,
  },
  {
    id:      "tile-threxa",
    metric:  "15+",
    label:   "Hrs Saved Weekly",
    project: "Threxa",
    side:    "left" as const,
  },
];

export const S6_SPEC_ROWS = [
  { label: "RFQ Conversion",     value: "+40%",  project: "Smart Packaging" },
  { label: "Booking Conversion", value: "+212%", project: "JKP Padmalaya" },
  { label: "Qualified RFQs",     value: "3.4×",  project: "Sierra Aerospace" },
  { label: "Hours Saved Weekly", value: "15+",   project: "Threxa" },
];
