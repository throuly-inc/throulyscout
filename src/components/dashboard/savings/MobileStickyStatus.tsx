import { useEffect, useRef, useState, type RefObject } from "react";
import { StatusBadge } from "./StatusBadge";
import type { SavingsStatus } from "@/hooks/useSavingsProjection";

interface Props {
  sentinelRef: RefObject<HTMLElement>;
  status: SavingsStatus;
  progressPct: number;
}

export function MobileStickyStatus({ sentinelRef, status, progressPct }: Props) {
  const [show, setShow] = useState(false);
  const observedRef = useRef<Element | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    observedRef.current = el;
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef]);

  return (
    <div
      className={`lg:hidden fixed left-0 right-0 top-14 z-40 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] border-b border-border bg-background/95 backdrop-blur overflow-hidden transition-all duration-200 ${
        show ? "opacity-100 max-h-16 py-2" : "opacity-0 max-h-0 py-0 border-transparent pointer-events-none"
      }`}
      aria-hidden={!show}
    >
      <div className="flex items-center justify-between gap-3">
        <StatusBadge status={status} />
        <span className="text-xs font-medium text-muted-foreground">
          {Math.round(progressPct)}% to goal
        </span>
      </div>
    </div>
  );
}
