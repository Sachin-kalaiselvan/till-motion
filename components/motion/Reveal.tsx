"use client";

/**
 * Reveal
 *
 * The canonical Reveal primitive: opacity 0→1 + translateY 24→0, short, tilEase.
 * Fires once when the element enters the viewport. Never replays.
 *
 * Usage:
 *   <Reveal>
 *     <p>This appears as it scrolls into view</p>
 *   </Reveal>
 *
 *   <Reveal delay={0.16} distance={40}>
 *     <h2>Delayed reveal with custom distance</h2>
 *   </Reveal>
 *
 *   // Staggered list — each child reveals with an 80ms offset
 *   <Reveal stagger>
 *     <span>Item 1</span>
 *     <span>Item 2</span>
 *     <span>Item 3</span>
 *   </Reveal>
 *
 * Design rules (from blueprint):
 *   - distance: 24px max — large slides read as decoration, not system
 *   - duration: short (240ms) — never slow this down for "dramatic" effect
 *   - once: true — replaying on scroll-back is a traditional agency tell
 */

import React from "react";
import { motion } from "framer-motion";
import {
  fadeReveal,
  fadeRevealContainer,
  fadeRevealItem,
} from "@/lib/motion/variants";
import { revealDefaults } from "@/lib/motion/tokens";

export interface RevealProps {
  children: React.ReactNode;
  /** Additional tailwind/class names on the wrapper */
  className?: string;
  /** Delay in seconds before the reveal starts */
  delay?: number;
  /** Override translateY distance (default: 24px) */
  distance?: number;
  /**
   * If true, treats direct children as stagger items.
   * Each child must be a valid motion target (div, span, p, etc.).
   */
  stagger?: boolean;
  /** Stagger interval in seconds — only used when stagger=true */
  staggerInterval?: number;
  /** Viewport threshold: fraction of element that must be visible */
  threshold?: number;
  /** HTML element to render as */
  as?: React.ElementType;
}

export function Reveal({
  children,
  className,
  delay = 0,
  distance = revealDefaults.distance,
  stagger = false,
  staggerInterval = revealDefaults.stagger,
  threshold = revealDefaults.threshold,
  as: Tag = "div",
}: RevealProps) {
  if (stagger) {
    return (
      <motion.div
        className={className}
        variants={{
          ...fadeRevealContainer,
          visible: {
            ...fadeRevealContainer.visible,
            transition: {
              staggerChildren: staggerInterval,
              delayChildren: delay,
            },
          },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: threshold }}
      >
        {React.Children.map(children, (child) => (
          <motion.div
            variants={{
              ...fadeRevealItem,
              hidden: { ...fadeRevealItem.hidden, y: distance },
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={{
        ...fadeReveal,
        hidden: { ...fadeReveal.hidden, y: distance },
        visible: {
          ...fadeReveal.visible,
          transition: {
            ...(fadeReveal.visible as { transition?: object }).transition,
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
