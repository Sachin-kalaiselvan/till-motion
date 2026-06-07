"use client";

/**
 * SceneS2 — Handoff
 *
 * Blueprint spec:
 *   "The pinned hero subject performs a FLIP from center into a smaller
 *    persistent position (e.g. docks to a corner or becomes a scroll-following
 *    marker). Continuity: same DOM element, layout morph, medium, tilMorph.
 *    This is the 'product' move — the thing doesn't disappear."
 *
 * What this scene does:
 *   1. The FLIP itself is owned by Framer Motion (layoutId on Subject + DockedSubject).
 *      SceneS2 is the visual *context* the Subject lands in — the content that
 *      appears in the Subject's wake after it docks.
 *
 *   2. S2's role is to:
 *      a. Provide a clear visual "handoff moment" — the transition between
 *         S1's full-screen hero and the rest of the page.
 *      b. Confirm the Subject has arrived by staging supporting content
 *         that enters *after* the FLIP settles (delay matches tilMorph duration).
 *      c. Provide a second scroll-depth layer so the Subject's position
 *         in the top-left feels purposeful — it's now a section marker.
 *
 * Layout:
 *   Two columns at desktop, single column at mobile.
 *   Left: a large structural number ("01") and a section label.
 *   Right: a descriptor paragraph + first CTA.
 *   Both reveal after a delay equal to the FLIP duration (0.48s),
 *   so content appears once the Subject is settled in the dock.
 *
 * Interaction:
 *   - VelocitySkewWrapper wraps the content column.
 *   - TiltCard on the CTA card.
 *   - MagneticButton on the primary CTA.
 *   - Parallax: section label drifts on backgroundField rate.
 *
 * Connection back to S1:
 *   If the user scrolls back up through S2 into S1, the DockedSubject
 *   needs to morph back to hero. This is handled by a ScrollTrigger onEnterBack
 *   on this scene's container, which calls undock().
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger, registerGSAP } from "@/lib/motion";
import { durations, tilEase, tilMorph } from "@/lib/motion/tokens";
import {
  Reveal,
  ClipReveal,
  MagneticButton,
  TiltCard,
  VelocitySkewWrapper,
  ParallaxLayer,
} from "@/components/motion";
import { useSubject } from "@/context/SubjectContext";
import type { Easing } from "framer-motion";

// ─── Timing ───────────────────────────────────────────────────────────────────

/**
 * HANDOFF_DELAY
 * How long to wait before S2 content reveals after the FLIP lands.
 * Set to the medium duration so content enters as the Subject settles.
 */
const HANDOFF_DELAY = durations.medium;

// ─── Component ───────────────────────────────────────────────────────────────

export function SceneS2() {
  const { undock } = useSubject();
  const containerRef = useRef<HTMLDivElement>(null);

  // When user scrolls back up into S1, restore Subject to hero
  useEffect(() => {
    registerGSAP();
    const container = containerRef.current;
    if (!container) return;

    const st = ScrollTrigger.create({
      trigger: container,
      start: "top bottom",
      onLeaveBack: () => {
        // User scrolled back above S2 → Subject should return to hero
        undock();
      },
    });

    return () => {
      st.kill();
    };
  }, [undock]);

  return (
    <section
      ref={containerRef}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "120px 64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Background depth layer — drifts slower than scroll ── */}
      <ParallaxLayer
        layer="backgroundField"
        scrollRange={180}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <BackdropAccent />
      </ParallaxLayer>

      {/* ── Main content ── */}
      <VelocitySkewWrapper style={{ width: "100%", position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {/* Left column — structural number + label */}
          <LeftColumn delay={HANDOFF_DELAY} />

          {/* Right column — descriptor + CTA */}
          <RightColumn delay={HANDOFF_DELAY + 0.08} />
        </div>
      </VelocitySkewWrapper>

      {/* ── Foreground accent — drifts faster ── */}
      <ParallaxLayer
        layer="foregroundAccents"
        scrollRange={120}
        style={{
          position: "absolute",
          top: 60,
          right: 80,
          pointerEvents: "none",
        }}
      >
        <ForegroundDot />
      </ParallaxLayer>
    </section>
  );
}

// ─── Left column ─────────────────────────────────────────────────────────────

function LeftColumn({ delay }: { delay: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* Section number — large structural type */}
      <ClipReveal direction="up" delay={delay}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(96px, 14vw, 180px)",
            fontWeight: 800,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            opacity: 0.06,
            display: "block",
            userSelect: "none",
          }}
        >
          01
        </span>
      </ClipReveal>

      {/* Section label */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Reveal delay={delay + 0.05}>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.35,
            }}
          >
            S2 · Handoff
          </p>
        </Reveal>

        <ClipReveal direction="up" delay={delay + 0.1}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            The subject<br />
            has landed.
          </h2>
        </ClipReveal>
      </div>

      {/* Horizontal rule — draws in */}
      <HorizontalRule delay={delay + 0.2} />
    </div>
  );
}

// ─── Right column ─────────────────────────────────────────────────────────────

function RightColumn({ delay }: { delay: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* Descriptor paragraph */}
      <Reveal delay={delay}>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.7,
            opacity: 0.55,
            maxWidth: 420,
            fontWeight: 400,
          }}
        >
          One persistent element. Scaled down. Repositioned.
          The same object — never destroyed, never re-created.
          This is what continuity feels like.
        </p>
      </Reveal>

      {/* Detail list — staggered */}
      <Reveal stagger staggerInterval={0.07} delay={delay + 0.1}>
        <DetailItem label="layoutId" value="til-subject" />
        <DetailItem label="transition" value="tilMorph · 480ms" />
        <DetailItem label="FLIP" value="Framer Motion layout" />
        <DetailItem label="trigger" value="ScrollTrigger onLeave" />
      </Reveal>

      {/* CTA card — TiltCard wrapping a MagneticButton */}
      <Reveal delay={delay + 0.24}>
        <CTACard />
      </Reveal>
    </div>
  );
}

// ─── Detail item ─────────────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "baseline",
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "monospace",
      }}
    >
      <span style={{ fontSize: 10, opacity: 0.35, letterSpacing: "0.1em", minWidth: 80 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, opacity: 0.7 }}>
        {value}
      </span>
    </div>
  );
}

// ─── CTA card ─────────────────────────────────────────────────────────────────

function CTACard() {
  return (
    <TiltCard
      style={{
        padding: "32px",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        maxWidth: 380,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: 0.35,
          }}
        >
          Next scene
        </p>
        <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>
          Scroll further to see the capability deck — the Subject now
          tracks every section boundary.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <MagneticButton
          style={{
            padding: "12px 28px",
            background: "rgba(255,255,255,0.9)",
            color: "#080808",
            borderRadius: 5,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          } as React.CSSProperties}
        >
          Continue
        </MagneticButton>
        <MagneticButton
          style={{
            padding: "12px 20px",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.6)",
            borderRadius: 5,
            fontSize: 13,
            fontWeight: 500,
          } as React.CSSProperties}
        >
          Learn more
        </MagneticButton>
      </div>
    </TiltCard>
  );
}

// ─── Horizontal rule draw ─────────────────────────────────────────────────────

function HorizontalRule({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ scaleX: 0, originX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{
        duration: durations.medium,
        ease: tilMorph as Easing,
        delay,
      }}
      style={{
        height: 1,
        background: "rgba(255,255,255,0.12)",
        transformOrigin: "left center",
        maxWidth: 280,
      }}
    />
  );
}

// ─── Backdrop accent ──────────────────────────────────────────────────────────

/**
 * BackdropAccent
 * Large structural text or geometric form in the background.
 * Provides the depth field that the parallax needs to read against.
 */
function BackdropAccent() {
  return (
    <div
      style={{
        position: "absolute",
        right: "-5%",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "clamp(200px, 30vw, 400px)",
        fontWeight: 900,
        letterSpacing: "-0.08em",
        opacity: 0.025,
        userSelect: "none",
        pointerEvents: "none",
        lineHeight: 1,
        fontFamily: "monospace",
      }}
    >
      S2
    </div>
  );
}

// ─── Foreground dot ───────────────────────────────────────────────────────────

function ForegroundDot() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: durations.short,
        ease: tilEase as Easing,
        delay: HANDOFF_DELAY + 0.3,
      }}
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "currentColor",
        opacity: 0.2,
      }}
    />
  );
}
