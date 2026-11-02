import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { inApp, recentProjects } from "../app/projects";
import { useFullscreen } from "../app/useFullscreen";
import { folderName } from "../store/folder";

type Props = {
  name: string;
  root?: string;
  onSwitch: () => void;
  onOpen: (root: string) => void;
  onClose: () => void;
};

/** A folder as people read it: the home folder as ~. */
const shortPath = (root: string) => root.replace(/^\/Users\/[^/]+/, "~");

/** Forma's mark, small: the five dots that gather into a plus. */
function Mark() {
  return (
    <svg className="project-chip-mark" viewBox="0 0 16 16" aria-hidden>
      <rect width="16" height="16" rx="4.5" />
      {[
        [8, 8],
        [8, 4.6],
        [8, 11.4],
        [4.6, 8],
        [11.4, 8],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.35" />
      ))}
    </svg>
  );
}

/**
 * The open project, top left: a pill like the rest of the chrome, beside the
 * window buttons (in the corner when full screen). Its menu shows where the
 * project lives, the recent ones to switch to, and what you can do with it.
 */
export function ProjectChip({ name, root, onSwitch, onOpen, onClose }: Props) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  // The corner is free when full screen, and in a browser (no window buttons).
  const corner = useFullscreen() || !inApp;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setRecent(recentProjects().filter((r) => r !== root));
    setOpen((o) => !o);
  };
  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="project-chip" data-full={corner || undefined} ref={ref}>
      <button className="project-chip-button chrome" aria-expanded={open} onClick={toggle}>
        <Mark />
        <span className="project-chip-name">{name}</span>
        <ChevronDown aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="project-menu chrome"
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
          >
            <div className="project-menu-head">
              <span className="project-menu-name">{name}</span>
              <span className="project-menu-path">{root ? shortPath(root) : "Saved in this browser"}</span>
            </div>
            {recent.length > 0 && (
              <div className="project-menu-group">
                <span className="project-menu-label">Recent</span>
                {recent.map((r) => (
                  <button key={r} role="menuitem" title={r} onClick={pick(() => onOpen(r))}>
                    {folderName(r)}
                  </button>
                ))}
              </div>
            )}
            {root ? (
              <div className="project-menu-group">
                <button role="menuitem" onClick={pick(onSwitch)}>
                  Open another folder…
                </button>
                <button role="menuitem" onClick={pick(() => revealItemInDir(root).catch(() => {}))}>
                  Show in Finder
                </button>
                <button role="menuitem" onClick={pick(onClose)}>
                  Close project
                </button>
              </div>
            ) : (
              <span className="project-menu-note">Open the Mac app to work in a folder.</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
