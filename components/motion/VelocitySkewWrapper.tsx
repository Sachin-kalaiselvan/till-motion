"use client";

/**
 * VelocitySkewWrapper
 *
 * Applies scroll velocity → skewY transform to its children.
 * Wrap an entire content column (or individual sections) with this
 * to get the "mass and momentum" physical feel from Signature Interaction #3.
 *
 * Blueprint spec:
 *   "Whole content plane skews skewY ±4deg proportional to scroll velocity,
 *    springs to 0 on stop."
 *
 * Usage:
 *   // Wrap your main content column
 *   <VelocitySkewWrapper>
 *     <main>...</main>
 *   </VelocitySkewWrapper>
 *
 *   // Lighter skew for a specific section
 *   <VelocitySkewWrapper maxSkew={2}>
 *     <Section />
 *   </VelocitySkewWrapper>
 */

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useVelocitySkew } from "@/hooks";

export interface VelocitySkewWrapperProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxSkew?: number;
  sensitivity?: number;
}

export function VelocitySkewWrapper({
  children,
  className = "",
  style,
  maxSkew,
  sensitivity,
}: VelocitySkewWrapperProps) {
  const { skewY } = useVelocitySkew({ maxSkew, sensitivity });

  return (
    <motion.div
      className={className}
      style={{ skewY, ...style }}
    >
      {children}
    </motion.div>
  );
}
