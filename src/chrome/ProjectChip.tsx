import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  root?: string;
  onSwitch: () => void;
  onClose: () => void;
};

/** The open project's name, top left beside the window buttons, with a small menu. */
export function ProjectChip({ name, root, onSwitch, onClose }: Props) {
  const [open, setOpen] = useState(false);
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

  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="project-chip" ref={ref}>
      <button className="project-chip-button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {name}
        <ChevronDown />
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
            {root && (
              <button role="menuitem" onClick={pick(() => revealItemInDir(root).catch(() => {}))}>
                Show in Finder
              </button>
            )}
            {root && (
              <button role="menuitem" onClick={pick(onSwitch)}>
                Open another folder…
              </button>
            )}
            {root && (
              <button role="menuitem" onClick={pick(onClose)}>
                Close project
              </button>
            )}
            {!root && <span className="project-menu-note">Saved in this browser. Open the Mac app to work in a folder.</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
