import { FolderOpen, Sparkles } from "lucide-react";
import { motion } from "motion/react";

type Props = {
  error: string | null;
  busy: boolean;
  onOpen: () => void;
  onSample: () => void;
};

/** The first thing you see in the app when no project is open. */
export function Welcome({ error, busy, onOpen, onSample }: Props) {
  return (
    <div className="welcome">
      <motion.div
        className="welcome-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="welcome-mark">Weft</div>
        <p className="welcome-lede">
          A board for your research. It lives in a folder on your Mac, so you and your AI can both work on it.
        </p>
        <div className="welcome-actions">
          <button className="welcome-primary" disabled={busy} onClick={onOpen}>
            <FolderOpen />
            Open a project folder
          </button>
          <button className="welcome-secondary" disabled={busy} onClick={onSample}>
            <Sparkles />
            Try the sample
          </button>
        </div>
        <p className="welcome-hint">The sample goes in Documents/Weft. Any empty folder becomes a new project.</p>
        {error && <p className="welcome-error">{error}</p>}
      </motion.div>
    </div>
  );
}
