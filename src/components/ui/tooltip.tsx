import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);
  return isTouch;
}

type TooltipCtx = {
  isTouch: boolean;
  open: boolean;
  setOpen: (o: boolean) => void;
  contentId: string;
};
const TooltipInternalCtx = React.createContext<TooltipCtx | null>(null);

const Tooltip: React.FC<React.ComponentProps<typeof TooltipPrimitive.Root>> = ({
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}) => {
  const isTouch = useIsTouchDevice();
  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(!!defaultOpen);
  const open = isControlled ? !!openProp : uncontrolledOpen;
  const contentId = React.useId();

  const setOpen = React.useCallback(
    (o: boolean) => {
      if (!isControlled) setUncontrolledOpen(o);
      onOpenChange?.(o);
    },
    [isControlled, onOpenChange],
  );

  // Close on outside tap/click when touch + open. Use a tick delay so the
  // same tap that opens the tooltip doesn't immediately close it.
  React.useEffect(() => {
    if (!isTouch || !open) return;
    let armed = false;
    const arm = () => { armed = true; };
    const handler = (e: Event) => {
      if (!armed) return;
      const target = e.target as Element | null;
      if (!target) return;
      if (target.closest(`[data-tooltip-id="${contentId}"]`)) return;
      setOpen(false);
    };
    const t = window.setTimeout(arm, 0);
    document.addEventListener("pointerdown", handler, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", handler, true);
    };
  }, [isTouch, open, contentId, setOpen]);

  const ctx = React.useMemo(
    () => ({ isTouch, open, setOpen, contentId }),
    [isTouch, open, setOpen, contentId],
  );

  return (
    <TooltipInternalCtx.Provider value={ctx}>
      <TooltipPrimitive.Root
        {...props}
        delayDuration={isTouch ? 0 : props.delayDuration}
        disableHoverableContent={isTouch ? true : props.disableHoverableContent}
        open={isTouch ? open : openProp}
        defaultOpen={isTouch ? undefined : defaultOpen}
        onOpenChange={isTouch ? undefined : onOpenChange}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipInternalCtx.Provider>
  );
};

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onClick, onPointerDown, onPointerUp, ...props }, ref) => {
  const ctx = React.useContext(TooltipInternalCtx);
  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (ctx?.isTouch && e.pointerType !== "mouse") {
      // Toggle tooltip and prevent the browser from synthesizing a click
      // event that would activate the parent/associated element.
      e.preventDefault();
      e.stopPropagation();
      ctx.setOpen(!ctx.open);
    }
    onPointerUp?.(e);
  };
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (ctx?.isTouch && e.pointerType !== "mouse") {
      // Pre-emptively stop propagation so the touch doesn't reach sliders,
      // checkboxes, or other interactive parents.
      e.stopPropagation();
    }
    onPointerDown?.(e);
  };
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ctx?.isTouch) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClick?.(e);
  };
  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      data-tooltip-id={ctx?.contentId}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...props}
    />
  );
});
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const ctx = React.useContext(TooltipInternalCtx);
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      data-tooltip-id={ctx?.contentId}
      onPointerDownOutside={(e) => {
        // We handle outside taps ourselves on touch
        if (ctx?.isTouch) e.preventDefault();
        props.onPointerDownOutside?.(e);
      }}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
