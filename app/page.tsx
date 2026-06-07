"use client";

import { LayoutGroup } from "framer-motion";
import { SubjectProvider } from "@/context/SubjectContext";
import { DockedSubject, AssembledSubject } from "@/components/scenes/Subject";
import { SceneS1 } from "@/components/scenes/SceneS1";
import { SceneS2 } from "@/components/scenes/SceneS2";
import { SceneS3 } from "@/components/scenes/SceneS3";
import { SceneS4 } from "@/components/scenes/SceneS4";
import { SceneS5 } from "@/components/scenes/SceneS5";
import { SceneS6 } from "@/components/scenes/SceneS6";
import { ParallaxLayer } from "@/components/motion";

export default function Page() {
  return (
    <SubjectProvider>
      <LayoutGroup id="til-page">
        <div style={{ background: "#080808", color: "#efefef", minHeight: "100vh" }}>

          <ParallaxLayer layer="fixedOverlay">
            {/* DockedSubject: renders during state=docked (S2–S5) */}
            <DockedSubject />
            {/* AssembledSubject: renders during state=assembled (S6 Phase 5) */}
            <AssembledSubject />
            <nav style={{
              position: "fixed", top: 0, left: 0, right: 0,
              padding: "20px 24px 20px 64px",
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              zIndex: 50, pointerEvents: "none",
            }}>
              <span style={{
                fontFamily: "monospace", fontSize: 10,
                letterSpacing: "0.16em", textTransform: "uppercase",
                opacity: 0.22, pointerEvents: "auto",
              }}>
                S1 · S2 · S3 · S4 · S5 · S6
              </span>
            </nav>
          </ParallaxLayer>

          <SceneS1 />
          <SceneS2 />
          <SceneS3 />
          <SceneS4 />
          <SceneS5 />
          <SceneS6 />

        </div>
      </LayoutGroup>
    </SubjectProvider>
  );
}
