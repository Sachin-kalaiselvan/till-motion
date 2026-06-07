"use client";

/**
 * MagneticButton
 *
 * Signature Interaction #6: the button shell translates toward the cursor
 * within a defined radius; the label lags behind with a softer spring,
 * creating a layered depth effect.
 *
 * Blueprint spec:
 *   "Button translates toward the cursor within an 80px radius, max 8px,
 *    tilSpring; its label lags 8px / ~60ms behind the button shell."
 *
 * Usage:
 *   <MagneticButton>
 *     Get started
 *   </MagneticButton>
 *
 *   <MagneticButton radius={120} maxDisplace={12} className="btn-primary">
 *     <span>Custom content</span>
 *   </MagneticButton>
 *
 * How it works:
 *   1. Track pointer position relative to the button's center via onPointerMove.
 *   2. If distance < radius, compute displacement (distance / radius * maxDisplace).
 *   3. Apply to the button shell via Framer Motion useSpring (tilSpring).
 *   4. Apply a softer spring to the inner label for the lag effect.
 *   5. On pointer leave, both spring back to 0.
 *
 * Performance: entirely MotionValue-driven. Zero re-renders during hover.
 */

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { magneticDefaults, tilSpring } from "@/lib/motion/tokens";

export interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Activation radius in px */
  radius?: number;
  /** Max displacement in px */
  maxDisplace?: number;
  /** Spring config for the shell */
  springConfig?: typeof tilSpring;
  /** Called on click — pass through to whatever the button does */
  onClick?: () => void;
  /** ARIA label */
  "aria-label"?: string;
}

export function MagneticButton({
  children,
  className = "",
  style,
  radius = magneticDefaults.radius,
  maxDisplace = magneticDefaults.maxDisplace,
  springConfig = tilSpring,
  onClick,
  "aria-label": ariaLabel,
}: MagneticButtonProps) {
  const containerRef = useRef<HTMLButtonElement>(null);

  // Shell motion values
  const shellX = useMotionValue(0);
  const shellY = useMotionValue(0);

  // Label motion values — softer spring = lag behind the shell
  const labelX = useMotionValue(0);
  const labelY = useMotionValue(0);

  // Springs: shell tracks cursor, label tracks shell with lag
  const shellSpringX = useSpring(shellX, springConfig) as MotionValue<number>;
  const shellSpringY = useSpring(shellY, springConfig) as MotionValue<number>;

  const labelSpringConfig = {
    ...springConfig,
    stiffness: 80,  // softer
    damping: 15,
  };
  const labelSpringX = useSpring(labelX, labelSpringConfig) as MotionValue<number>;
  const labelSpringY = useSpring(labelY, labelSpringConfig) as MotionValue<number>;

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius) {
      const strength = (radius - distance) / radius;
      const dispX = dx * strength * (maxDisplace / radius) * radius / distance || 0;
      const dispY = dy * strength * (maxDisplace / radius) * radius / distance || 0;

      shellX.set(dispX);
      shellY.set(dispY);
      // Label lags by a fixed offset — always slightly behind
      labelX.set(dispX * 0.6);
      labelY.set(dispY * 0.6);
    }
  }

  function handlePointerLeave() {
    shellX.set(0);
    shellY.set(0);
    labelX.set(0);
    labelY.set(0);
  }

  return (
    <motion.button
      ref={containerRef}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        x: shellSpringX,
        y: shellSpringY,
        ...style,
      }}
      // Micro hover feedback (color/border) separate from magnetic displacement
      whileHover={{ scale: 1.0 }} // scale is intentionally neutral — handled by the magnetic pull
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
    >
      {/* Inner label with independent spring for lag effect */}
      <motion.span
        className="pointer-events-none"
        style={{
          x: labelSpringX,
          y: labelSpringY,
        }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
