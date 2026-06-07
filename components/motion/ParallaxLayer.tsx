"use client";

/**
 * ParallaxLayer
 *
 * Wraps children in one of the five canonical depth planes.
 * Applies the correct scroll rate and resting blur automatically.
 *
 * Blueprint spec (five planes):
 *   backgroundField    rate: 0.85  blur: 2px  zIndex: 0
 *   contentPlane       rate: 1.00  blur: 0px  zIndex: 10
 *   foregroundAccents  rate: 1.15  blur: 0px  zIndex: 20
 *   pinnedSubject      rate: 1.00  blur: 0px  zIndex: 30  (own GSAP timeline)
 *   fixedOverlay       rate: 0.00  blur: 0px  zIndex: 50  (position: fixed)
 *
 * Usage:
 *   <ParallaxLayer layer="backgroundField">
 *     <BackgroundTexture />
 *   </ParallaxLayer>
 *
 *   <ParallaxLayer layer="foregroundAccents">
 *     <FloatingDot />
 *   </ParallaxLayer>
 *
 *   // Fixed overlay (nav, cursor) — no parallax, fixed to viewport
 *   <ParallaxLayer layer="fixedOverlay">
 *     <NavBar />
 *   </ParallaxLayer>
 *
 * Note on pinnedSubject:
 *   This layer wrapper handles stacking and initial blur only.
 *   The actual pinning and scrub timeline must be created via
 *   createScrubTrigger() from @/lib/motion — the component has
 *   no way to know the pin length or scroll range.
 */

import type { ReactNode, CSSProperties } from "react";
import { useParallax } from "@/hooks";
import { parallaxLayers, type ParallaxLayerKey } from "@/lib/motion/tokens";

export interface ParallaxLayerProps {
  layer: ParallaxLayerKey;
  children: ReactNode;
  className?: string;
  /**
   * Override scrollRange for this specific layer instance.
   * Default is determined by useParallax (400px).
   */
  scrollRange?: number;
  /** Additional inline styles */
  style?: CSSProperties;
}

export function ParallaxLayer({
  layer,
  children,
  className = "",
  scrollRange,
  style,
}: ParallaxLayerProps) {
  const config = parallaxLayers[layer];

  // fixedOverlay is position:fixed and never participates in parallax
  const isFixed = layer === "fixedOverlay";

  const ref = useParallax<HTMLDivElement>(
    isFixed
      ? {} // no-op config
      : {
          layer,
          scrollRange,
        }
  );

  const baseStyles: CSSProperties = {
    position: isFixed ? "fixed" : "relative",
    zIndex: config.zIndex,
    // Apply resting blur for depth layers that have it (only backgroundField: 2px)
    filter: config.blur > 0 ? `blur(${config.blur}px)` : undefined,
    ...style,
  };

  return (
    <div ref={ref} className={className} style={baseStyles}>
      {children}
    </div>
  );
}
