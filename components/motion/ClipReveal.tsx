"use client";

/**
 * ClipReveal
 *
 * The clip-path wipe reveal primitive.
 * Text or elements are masked by clip-path: inset(100% → 0%) so they
 * appear to slide out from behind an invisible edge.
 *
 * Unlike Reveal (which fades + floats up), ClipReveal gives a precise
 * typographic "set" feel — as if text is being stamped onto the page.
 *
 * Blueprint rule:
 *   "Lines reveal via clip-path wipes rather than fades; long headlines
 *    animate line-by-line."
 *
 * Usage:
 *   // Single element — wipes upward
 *   <ClipReveal>
 *     <h2>Section Title</h2>
 *   </ClipReveal>
 *
 *   // Line-by-line headline — splits text by newline
 *   <ClipReveal splitLines>
 *     <p>Line one{"\n"}Line two{"\n"}Line three</p>
 *   </ClipReveal>
 *
 *   // Right-to-left wipe
 *   <ClipReveal direction="left">
 *     <span>→ Detail text</span>
 *   </ClipReveal>
 *
 * Implementation note:
 *   The wrapper must have overflow: hidden (applied automatically via className).
 *   If you add custom className, include overflow-hidden yourself.
 */

import React from "react";
import { motion } from "framer-motion";
import {
  clipRevealUp,
  clipRevealDown,
  clipRevealLeft,
  clipRevealRight,
} from "@/lib/motion/variants";
import { revealDefaults, durations } from "@/lib/motion/tokens";
import type { Variants } from "framer-motion";

export type ClipDirection = "up" | "down" | "left" | "right";

const variantMap: Record<ClipDirection, Variants> = {
  up: clipRevealUp,
  down: clipRevealDown,
  left: clipRevealLeft,
  right: clipRevealRight,
};

export interface ClipRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: ClipDirection;
  delay?: number;
  threshold?: number;
  /** Stagger interval in seconds when wrapping multiple children */
  stagger?: number;
}

export function ClipReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  threshold = revealDefaults.threshold,
  stagger,
}: ClipRevealProps) {
  const variants = variantMap[direction];

  // Multi-child: wrap each child in its own ClipReveal with stagger delay
  if (stagger && React.Children.count(children) > 1) {
    return (
      <div className={className}>
        {React.Children.map(children, (child, i) => (
          <div className="overflow-hidden">
            <motion.div
              variants={{
                ...variants,
                visible: {
                  ...variants.visible,
                  transition: {
                    ...(variants.visible as { transition?: object }).transition,
                    delay: delay + i * stagger,
                  },
                },
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: threshold }}
            >
              {child}
            </motion.div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        variants={{
          ...variants,
          visible: {
            ...variants.visible,
            transition: {
              ...(variants.visible as { transition?: object }).transition,
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
    </div>
  );
}

/**
 * LineByLineReveal
 *
 * Splits a string into lines and reveals each line with a ClipReveal
 * and stagger delay — the "typographic set" effect for large headlines.
 *
 * Usage:
 *   <LineByLineReveal
 *     lines={["Beyond the", "limits."]}
 *     className="text-7xl font-bold"
 *   />
 */
export interface LineByLineRevealProps {
  lines: string[];
  className?: string;
  lineClassName?: string;
  direction?: ClipDirection;
  delay?: number;
  staggerInterval?: number;
  style?: React.CSSProperties;
}

export function LineByLineReveal({
  lines,
  className = "",
  lineClassName = "",
  direction = "up",
  delay = 0,
  staggerInterval = revealDefaults.stagger,
  style,
}: LineByLineRevealProps) {
  const variants = variantMap[direction];

  return (
    <div className={className} style={style}>
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            className={lineClassName}
            variants={{
              ...variants,
              visible: {
                ...variants.visible,
                transition: {
                  ...(variants.visible as { transition?: object }).transition,
                  delay: delay + i * staggerInterval,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.01 }}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
