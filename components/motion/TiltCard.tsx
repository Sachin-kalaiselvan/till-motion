"use client";

/**
 * TiltCard
 *
 * Signature Interaction #7: cards tilt toward the cursor on hover,
 * max 6deg on each axis; inner content lags 12px (depth-on-hover effect).
 *
 * Blueprint spec:
 *   "Card tilts max 6deg toward cursor (rotateX/rotateY),
 *    inner content lags 12px on a softer spring for depth."
 *
 * Usage:
 *   <TiltCard>
 *     <p>Card content</p>
 *   </TiltCard>
 *
 *   <TiltCard maxRotation={4} contentLag={8} perspective={1000}>
 *     <img src="..." />
 *     <p>Description</p>
 *   </TiltCard>
 *
 * How it works:
 *   1. On pointer move, compute normalized cursor offset within the card (-1→+1).
 *   2. Map to rotateX/rotateY (inverted so card tilts toward, not away from, cursor).
 *   3. Apply via useSpring for smooth tracking with settling.
 *   4. Inner content translates in the same direction as the tilt (lag),
 *      using a softer spring to appear "deeper" in the card.
 *
 * Performance: MotionValue-driven. Zero re-renders.
 */

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { tiltCardDefaults, tilSpring } from "@/lib/motion/tokens";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Max rotation in degrees (each axis). Default: 6 */
  maxRotation?: number;
  /** Inner content parallax offset in px. Default: 12 */
  contentLag?: number;
  /** CSS perspective value. Default: 800 */
  perspective?: number;
}

export function TiltCard({
  children,
  className = "",
  style,
  maxRotation = tiltCardDefaults.maxRotation,
  contentLag = tiltCardDefaults.contentLag,
  perspective = tiltCardDefaults.perspective,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Card rotation
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // Inner content translation (lag behind card tilt)
  const contentX = useMotionValue(0);
  const contentY = useMotionValue(0);

  // Card spring — tracks cursor closely
  const cardSpringConfig = { stiffness: 150, damping: 20, mass: 0.8 };
  const springRotateX = useSpring(rotateX, cardSpringConfig) as MotionValue<number>;
  const springRotateY = useSpring(rotateY, cardSpringConfig) as MotionValue<number>;

  // Content spring — softer = more lag = more depth
  const contentSpringConfig = { stiffness: 80, damping: 18, mass: 1 };
  const springContentX = useSpring(contentX, contentSpringConfig) as MotionValue<number>;
  const springContentY = useSpring(contentY, contentSpringConfig) as MotionValue<number>;

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // Normalized offset: -1 (top-left) to +1 (bottom-right)
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    // rotateX is inverted so card tilts toward cursor (positive normY → negative rotateX = tilts down toward bottom)
    rotateX.set(-normY * maxRotation);
    rotateY.set(normX * maxRotation);

    // Content moves in same direction as card face tilt (depth illusion)
    contentX.set(normX * contentLag);
    contentY.set(-normY * contentLag);
  }

  function handlePointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
    contentX.set(0);
    contentY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        perspective,
        transformStyle: "preserve-3d",
        rotateX: springRotateX,
        rotateY: springRotateY,
        ...style,
      }}
    >
      {/* Inner content shifts with a lag, creating the Z-depth feel */}
      <motion.div
        className="relative w-full h-full"
        style={{
          x: springContentX,
          y: springContentY,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
