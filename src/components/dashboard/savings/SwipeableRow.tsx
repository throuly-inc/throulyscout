import { useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  onDelete: () => void;
  revealed: boolean;
  onRevealChange: (v: boolean) => void;
  editMode?: boolean;
  ariaLabel?: string;
}

const REVEAL = 84;
const THRESHOLD = 40;

/**
 * Mobile swipe-to-reveal-delete row.
 * Falls back to a visible trash button when `editMode` is true (accessible fallback
 * for users who don't discover swipe gestures).
 */
export function SwipeableRow({
  children,
  onDelete,
  revealed,
  onRevealChange,
  editMode = false,
  ariaLabel = "Row",
}: Props) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const currentX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  const base = revealed ? -REVEAL : 0;
  const translate = dragging ? Math.min(0, Math.max(-REVEAL, base + dragX)) : base;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentX.current = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!dragging) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }
    currentX.current = dx;
    setDragX(dx);
  };
  const onPointerUp = () => {
    if (!dragging) {
      startX.current = null;
      startY.current = null;
      return;
    }
    const dx = currentX.current;
    const next = revealed ? dx > THRESHOLD : dx < -THRESHOLD;
    onRevealChange(revealed ? !next : next);
    setDragging(false);
    setDragX(0);
    startX.current = null;
    startY.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete action background */}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${ariaLabel}`}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive text-destructive-foreground"
        style={{ width: REVEAL }}
        tabIndex={revealed ? 0 : -1}
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <div
        className="relative bg-background touch-pan-y"
        style={{
          transform: `translateX(${translate}px)`,
          transition: dragging ? "none" : "transform 200ms ease-out",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">{children}</div>
          {editMode && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              aria-label={`Delete ${ariaLabel}`}
              className="shrink-0 min-h-[44px] min-w-[44px]"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
