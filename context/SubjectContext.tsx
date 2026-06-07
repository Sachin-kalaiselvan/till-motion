"use client";

/**
 * SubjectContext
 *
 * Owns the Subject's journey across the entire page.
 * Three-state machine: hero → docked → assembled
 *
 *   hero      — S1: large, centered, in-flow
 *   docked    — S2–S5: small fixed marker, top-left
 *   assembled — S6: medium mark, fixed center, within the Growth Engine
 *
 * assemble() is called at S6 Phase 5. dock() is called when scrolling back
 * through S6 below the assembly threshold.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export const SUBJECT_LAYOUT_ID = "til-subject";

export type SubjectState = "hero" | "docked" | "assembled";

interface SubjectContextValue {
  state:      SubjectState;
  isDocked:   boolean;
  isAssembled: boolean;
  dock:       () => void;
  undock:     () => void;
  assemble:   () => void;
}

const SubjectContext = createContext<SubjectContextValue | null>(null);

export function SubjectProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubjectState>("hero");

  const dock     = useCallback(() => setState("docked"),    []);
  const undock   = useCallback(() => setState("hero"),      []);
  const assemble = useCallback(() => setState("assembled"), []);

  return (
    <SubjectContext.Provider value={{
      state,
      isDocked:    state === "docked",
      isAssembled: state === "assembled",
      dock,
      undock,
      assemble,
    }}>
      {children}
    </SubjectContext.Provider>
  );
}

export function useSubject() {
  const ctx = useContext(SubjectContext);
  if (!ctx) throw new Error("useSubject must be used inside <SubjectProvider>");
  return ctx;
}
