"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SUBJECT_LAYOUT_ID, useSubject } from "@/context/SubjectContext";
import { layoutTransition } from "@/lib/motion/variants";
import { durations, tilEase } from "@/lib/motion/tokens";
import type { Easing } from "framer-motion";

// Brass palette matching IngredientShapes
const brass = "rgba(196, 154, 60, 0.75)";
const brassLight = "rgba(196, 154, 60, 0.40)";

/**
 * SubjectMark — warm brass diamond seal.
 * The persistent identity that travels the entire page.
 * Material: brass-bordered, warm — not cold tech geometry.
 */
function SubjectMark({ size, borderWidth, borderRadius, opacity = 1 }: {
  size: number; borderWidth: number; borderRadius: number; opacity?: number;
}) {
  return (
    <div style={{
      width: size, height: size,
      border: `${borderWidth}px solid ${brass}`,
      borderRadius,
      transform: "rotate(45deg)",
      opacity,
      flexShrink: 0,
      background: "rgba(196, 154, 60, 0.06)",
    }} />
  );
}

export function HeroSubject() {
  const { state } = useSubject();
  return (
    <AnimatePresence mode="wait">
      {state === "hero" && (
        <motion.div
          key="hero-subject"
          layoutId={SUBJECT_LAYOUT_ID}
          layout layoutDependency={state}
          transition={layoutTransition}
          style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 24, cursor: "default" }}
          initial={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, scale: 0.94, filter: "blur(4px)", transition: { duration: durations.micro, ease: tilEase as Easing } }}
        >
          <SubjectMark size={64} borderWidth={1.5} borderRadius={4} />
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.50, y: 0 }}
            transition={{ duration: durations.short, ease: tilEase as Easing, delay: 0.3 }}
            style={{ fontFamily: "var(--font-mono,'Courier New',monospace)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-secondary)" }}
          >
            the ingredient list
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DockedSubject() {
  const { state } = useSubject();
  return (
    <AnimatePresence>
      {state === "docked" && (
        <motion.div
          key="docked-subject"
          layoutId={SUBJECT_LAYOUT_ID}
          layout layoutDependency={state}
          transition={layoutTransition}
          style={{ position: "fixed", top: 24, left: 24, zIndex: 60, display: "inline-flex", alignItems: "center", gap: 10, cursor: "default" }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: durations.micro, ease: tilEase as Easing } }}
        >
          <SubjectMark size={20} borderWidth={1} borderRadius={2} opacity={0.7} />
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 0.45, x: 0 }}
            transition={{ duration: durations.short, ease: tilEase as Easing, delay: durations.medium * 0.6 }}
            style={{ fontFamily: "var(--font-mono,'Courier New',monospace)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap", color: "var(--text-secondary)" }}
          >
            til
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AssembledSubject() {
  const { state } = useSubject();
  return (
    <AnimatePresence>
      {state === "assembled" && (
        <motion.div
          key="assembled-subject"
          layoutId={SUBJECT_LAYOUT_ID}
          layout layoutDependency={state}
          transition={layoutTransition}
          style={{ position: "fixed", top: "44vh", left: "50vw", transform: "translate(-50%,-50%)", zIndex: 60, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "default" }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: durations.micro, ease: tilEase as Easing } }}
        >
          <SubjectMark size={36} borderWidth={1.25} borderRadius={3} opacity={0.9} />
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.55, y: 0 }}
            transition={{ duration: durations.short, ease: tilEase as Easing, delay: durations.medium * 0.8 }}
            style={{ fontFamily: "var(--font-mono,'Courier New',monospace)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap", color: "var(--text-secondary)" }}
          >
            the ingredient list
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
