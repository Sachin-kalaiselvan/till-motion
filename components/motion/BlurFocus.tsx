"use client";

/**
 * BlurFocus
 *
 * The blur-focus entrance: filter blur 8px + scale 1.02 → blur 0 + scale 1.0.
 * Reserved for PRIMARY elements only (one or two per scene, maximum).
 *
 * Blueprint rule:
 *   "Hierarchy is expressed through focus depth and motion priority.
 *    Primary elements get a blur-to-sharp entrance and the longest settle;
 *    secondary elements just fade."
 *
 * The blur-focus entrance signals "this is the most important thing here."
 * If you use it on everything, it signals nothing.
 *
 * Usage:
 *   <BlurFocus>
 *     <h1>The Subject</h1>
 *   </BlurFocus>
 *
 *   <BlurFocus delay={0.2} threshold={0.3}>
 *     <HeroGraphic />
 *   </BlurFocus>
 */

import { motion } from "framer-motion";
import { blurFocus } from "@/lib/motion/variants";
import { revealDefaults } from "@/lib/motion/tokens";

export interface BlurFocusProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export function BlurFocus({
  children,
  className,
  delay = 0,
  threshold = revealDefaults.threshold,
}: BlurFocusProps) {
  return (
    <motion.div
      className={className}
      variants={{
        ...blurFocus,
        visible: {
          ...blurFocus.visible,
          transition: {
            ...(blurFocus.visible as { transition?: object }).transition,
            delay,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
    >
      {children}
    </motion.div>
  );
}
