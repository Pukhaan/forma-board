import { useInternalNode, ViewportPortal } from "@xyflow/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { HINT, pastHint, rememberPastHint } from "./hint";

type Props = {
  /** Which board this is (its folder), so the hint is remembered for it. */
  board: string;
  /** The project's node. */
  projectId: string;
  /** True while the board holds only its project. */
  bare: boolean;
};

/** How far under the project the line sits, in board units: two dots. */
const BELOW = 64;

/**
 * One quiet line under a new board's project, saying what to do. It fades
 * away the moment anything is added and never comes back for that board.
 * It takes no pointer. Nothing is drawn for any other board.
 */
export function EmptyHint({ board, projectId, bare }: Props) {
  const [phase, setPhase] = useState<"hint" | "past">(() => (bare && !pastHint(board) ? "hint" : "past"));
  // Something was added: past the hint for good (set while rendering, React's way to follow a prop).
  if (phase === "hint" && !bare) setPhase("past");
  useEffect(() => {
    if (phase === "past") rememberPastHint(board);
  }, [phase, board]);
  return <AnimatePresence>{phase === "hint" && <Line key="hint" projectId={projectId} />}</AnimatePresence>;
}

function Line({ projectId }: { projectId: string }) {
  const project = useInternalNode(projectId);
  const reduced = useReducedMotion();
  if (!project?.measured.height) return null;
  const { x, y } = project.internals.positionAbsolute;
  const w = project.measured.width ?? 0;
  return (
    <ViewportPortal>
      <motion.div
        className="empty-hint"
        style={{ left: x + w / 2, top: y + project.measured.height + BELOW }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.4 } }}
        exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.32 } }}
      >
        {HINT}
      </motion.div>
    </ViewportPortal>
  );
}
