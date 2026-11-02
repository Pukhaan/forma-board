import { Hand, ImagePlus, MousePointer2, Scan, StickyNote } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export type Tool = "select" | "hand";

type NewImage = { src: string; w: number; h: number; title: string };

type Props = {
  tool: Tool;
  onTool: (t: Tool) => void;
  onNote: () => void;
  onImages: (files: NewImage[]) => void;
  onFit: () => void;
};

function readImage(file: File): Promise<NewImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => resolve({ src, w: img.naturalWidth, h: img.naturalHeight, title: file.name.replace(/\.[^.]+$/, "") });
      img.onerror = () => reject(new Error("Not an image"));
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function typing(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  return !!el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA");
}

/** One small bar for the few things you do on the board. Each tool has a single-key shortcut. */
export function Toolbar({ tool, onTool, onNote, onImages, onFit }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "v") onTool("select");
      else if (k === "h") onTool("hand");
      else if (k === "n") onNote();
      else if (k === "i") fileInput.current?.click();
      else if (k === "f") onFit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTool, onNote, onFit]);

  return (
    <div className="toolbar chrome" role="toolbar" aria-label="Board tools">
      <ToolButton label="Select" keyHint="V" active={tool === "select"} onClick={() => onTool("select")}>
        <MousePointer2 />
      </ToolButton>
      <ToolButton label="Move around" keyHint="H" active={tool === "hand"} onClick={() => onTool("hand")}>
        <Hand />
      </ToolButton>
      <span className="toolbar-rule" />
      <ToolButton label="Note" keyHint="N" onClick={onNote}>
        <StickyNote />
      </ToolButton>
      <ToolButton label="Image" keyHint="I" onClick={() => fileInput.current?.click()}>
        <ImagePlus />
      </ToolButton>
      <span className="toolbar-rule" />
      <ToolButton label="Fit everything" keyHint="F" onClick={onFit}>
        <Scan />
      </ToolButton>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = "";
          const read = await Promise.allSettled(files.map(readImage));
          const ok = read.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
          if (ok.length) onImages(ok);
        }}
      />
    </div>
  );
}

function ToolButton(props: { label: string; keyHint: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className="tool"
      data-active={props.active || undefined}
      aria-label={props.label}
      aria-pressed={props.active}
      title={`${props.label}  ${props.keyHint}`}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
