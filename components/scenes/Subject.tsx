"use client";

/**
 * Subject
 *
 * The persistent element that travels the entire page via Framer Motion layoutId.
 * Three visual states — all share SUBJECT_LAYOUT_ID. Only one renders at a time.
 *
 *   HeroSubject      state=hero      Large centered, S1 flow
 *   DockedSubject    state=docked    Small fixed top-left, S2–S5
 *   AssembledSubject state=assembled Medium fixed center, S6 Growth Engine
 *
 * The journey:
 *   S1 hero → [dock] → S2–S5 marker → [assemble] → S6 nucleus
 *
 * FLIP is handled by Framer Motion's layoutId across all three states.
 * All three live under the same LayoutGroup in page.tsx.
 */

import { motion, AnimatePresence } from "framer-motion";
import { SUBJECT_LAYOUT_ID, useSubject } from "@/context/SubjectContext";
import { layoutTransition } from "@/lib/motion/variants";
import { durations, tilEase } from "@/lib/motion/tokens";
import type { Easing } from "framer-motion";

// ─── Shared mark ─────────────────────────────────────────────────────────────

function SubjectMark({
  size, borderWidth, borderRadius, opacity = 1,
}: { size: number; borderWidth: number; borderRadius: number; opacity?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `${borderWidth}px solid currentColor`,
      borderRadius,
      transform: "rotate(45deg)",
      opacity,
      flexShrink: 0,
    }} />
  );
}

// ─── Hero (S1) ────────────────────────────────────────────────────────────────

export function HeroSubject() {
  const { state } = useSubject();
  const isHero = state === "hero";

  return (
    <AnimatePresence mode="wait">
      {isHero && (
        <motion.div
          key="hero-subject"
          layoutId={SUBJECT_LAYOUT_ID}
          layout
          layoutDependency={state}
          transition={layoutTransition}
          style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 24, cursor: "default" }}
          initial={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, scale: 0.94, filter: "blur(4px)", transition: { duration: durations.micro, ease: tilEase as Easing } }}
        >
          <SubjectMark size={64} borderWidth={1.5} borderRadius={4} />
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.35, y: 0 }}
            transition={{ duration: durations.short, ease: tilEase as Easing, delay: 0.3 }}
            style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }}
          >
            the ingredient list
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Docked (S2–S5) ───────────────────────────────────────────────────────────

export function DockedSubject() {
  const { state } = useSubject();
  const isDocked = state === "docked";

  return (
    <AnimatePresence>
      {isDocked && (
        <motion.div
          key="docked-subject"
          layoutId={SUBJECT_LAYOUT_ID}
          layout
          layoutDependency={state}
          transition={layoutTransition}
          style={{
            position: "fixed", top: 24, left: 24, zIndex: 60,
            display: "inline-flex", alignItems: "center", gap: 10, cursor: "default",
          }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: durations.micro, ease: tilEase as Easing } }}
        >
          <SubjectMark size={20} borderWidth={1} borderRadius={2} opacity={0.7} />
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ duration: durations.short, ease: tilEase as Easing, delay: durations.medium * 0.6 }}
            style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}
          >
            til
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Assembled (S6) ───────────────────────────────────────────────────────────

/**
 * AssembledSubject
 *
 * The Subject returns to center inside the Growth Engine.
 * Position: fixed at 44vh / 50vw — the center of the assembled structure.
 * Size: 36×36px — intermediate between docked (20) and hero (64).
 *
 * The FLIP from docked (top:24, left:24) to assembled (top:44%, left:50%)
 * creates the "journey completed" moment — the Subject has traveled the
 * entire page and come home to the engine it helped assemble.
 */
export function AssembledSubject() {
  const { state } = useSubject();
  const isAssembled = state === "assembled";

  return (
    <AnimatePresence>
      {isAssembled && (
        <motion.div
          key="assembled-subject"
          layoutId={SUBJECT_LAYOUT_ID}
          layout
          layoutDependency={state}
          transition={layoutTransition}
          style={{
            position: "fixed",
            top: "44vh",
            left: "50vw",
            transform: "translate(-50%, -50%)",
            zIndex: 60,
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            cursor: "default",
          }}
          exit={{
            opacity: 0, scale: 0.9,
            transition: { duration: durations.micro, ease: tilEase as Easing },
          }}
        >
          <SubjectMark size={36} borderWidth={1.25} borderRadius={3} opacity={0.9} />
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ duration: durations.short, ease: tilEase as Easing, delay: durations.medium * 0.8 }}
            style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap" }}
          >
            the ingredient list
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
