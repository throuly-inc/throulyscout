import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

/**
 * Interactive guided tour for /buyers (location step).
 *
 * Design goals:
 * - Advance ONLY after the user actually performs each action.
 * - Every exit path (Finish, Skip, Escape, backdrop click, route change, unmount)
 *   funnels through one endTour() function that fully removes the overlay and
 *   restores body styles. No path can leave the app in a stuck "black screen".
 */

const STORAGE_COMPLETED = "throuly.tour.completed";
const STORAGE_STEP = "throuly.tour.step";
const QUERY_FLAG = "tour";

type StepId = "state" | "income" | "continue";

type Step = {
  id: StepId;
  selector: string;
  title: string;
  hint: string;
  /** How the user advances. */
  advanceOn: "change" | "blur" | "click";
  /** Optional validator; false = show nudge and stay. */
  validate?: (el: HTMLElement) => { ok: boolean; nudge?: string };
};

const STEPS: Step[] = [
  {
    id: "state",
    selector: '[data-tour="state"] [role="combobox"]',
    title: "Pick your state",
    hint: "Your results are tuned to your state's taxes, insurance, and closing costs. Choose a state to continue.",
    advanceOn: "change",
  },
  {
    id: "income",
    selector: '[data-tour="income"] input',
    title: "Add your yearly income",
    hint: "Your gross (before-tax) yearly income. This stays private — we never sell or share it.",
    advanceOn: "blur",
    validate: (el) => {
      // Strip commas / $ so formatted MoneyInput values parse correctly.
      const raw = (el as HTMLInputElement).value.replace(/[^0-9.]/g, "");
      const v = Number(raw);
      if (!v || v <= 0) return { ok: false, nudge: "Enter your gross yearly income to continue." };
      if (v < 10000) return { ok: true, nudge: "That looks low — double-check it's yearly, not monthly." };
      return { ok: true };
    },
  },
  {
    id: "continue",
    selector: '[data-tour="continue"]',
    title: "See your estimate",
    hint: "You're all set. Tap Continue to see what you can afford — no account required.",
    advanceOn: "click",
  },
];

export function GuidedTour() {
  const location = useLocation();
  const onBuyers = location.pathname === "/buyers";

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [occupied, setOccupied] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1024,
    h: typeof window !== "undefined" ? window.innerHeight : 768,
  });
  const [nudge, setNudge] = useState<string | null>(null);

  const savedBodyOverflow = useRef<string>("");
  const endedRef = useRef(false);

  const endTour = useCallback((reason: "finish" | "skip" | "route" | "unmount" | "error") => {
    if (endedRef.current) return;
    endedRef.current = true;
    setActive(false);
    setStepIndex(0);
    setRect(null);
    setNudge(null);
    try {
      if (reason === "finish" || reason === "skip") {
        window.localStorage.setItem(STORAGE_COMPLETED, "1");
      }
      window.localStorage.removeItem(STORAGE_STEP);
    } catch {
      // ignore
    }
    // Restore body styles no matter what.
    document.body.style.overflow = savedBodyOverflow.current || "";
    document.body.style.pointerEvents = "";
    document.body.style.paddingRight = "";
  }, []);

  // Decide whether to start the tour when entering /buyers.
  useEffect(() => {
    if (!onBuyers) return;
    endedRef.current = false;

    const params = new URLSearchParams(location.search);
    const forced = params.get(QUERY_FLAG) === "1";
    let completed = false;
    let resumeStep = 0;
    try {
      completed = window.localStorage.getItem(STORAGE_COMPLETED) === "1";
      const s = Number(window.localStorage.getItem(STORAGE_STEP));
      if (Number.isFinite(s) && s > 0 && s < STEPS.length) resumeStep = s;
    } catch {
      // ignore
    }

    if (forced) {
      try {
        window.localStorage.removeItem(STORAGE_COMPLETED);
        window.localStorage.removeItem(STORAGE_STEP);
      } catch {
        // ignore
      }
      resumeStep = 0;
    } else if (completed) {
      return;
    }

    savedBodyOverflow.current = document.body.style.overflow;
    setStepIndex(resumeStep);
    const t = window.setTimeout(() => setActive(true), 450);
    return () => window.clearTimeout(t);
  }, [onBuyers, location.search]);

  // Teardown on route change away from /buyers, and on unmount.
  useEffect(() => {
    if (!onBuyers && active) endTour("route");
  }, [onBuyers, active, endTour]);

  useEffect(() => {
    return () => {
      if (active) endTour("unmount");
    };
  }, [active, endTour]);

  const step = STEPS[stepIndex];

  // Track the target element's rect (event-driven + rAF-coalesced mutations).
  useLayoutEffect(() => {
    if (!active || !step) return;
    let pending = 0;
    let observer: MutationObserver | null = null;
    let lastRectKey = "";
    let lastOccKey = "";

    const rectKey = (r: DOMRect | null) =>
      r ? `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}` : "";

    const measure = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        if (lastRectKey) {
          lastRectKey = "";
          lastOccKey = "";
          setRect(null);
          setOccupied(null);
        }
        return;
      }
      const tRect = el.getBoundingClientRect();
      const tKey = rectKey(tRect);
      if (tKey !== lastRectKey) {
        lastRectKey = tKey;
        setRect(tRect);
      }

      let occ = tRect;
      const poppers = document.querySelectorAll<HTMLElement>(
        '[data-radix-popper-content-wrapper], [role="listbox"], [role="dialog"][data-state="open"]',
      );
      poppers.forEach((p) => {
        if (p.getAttribute("aria-label") === step.title) return;
        const r = p.getBoundingClientRect();
        if (!r.width || !r.height) return;
        occ = new DOMRect(
          Math.min(occ.left, r.left),
          Math.min(occ.top, r.top),
          Math.max(occ.right, r.right) - Math.min(occ.left, r.left),
          Math.max(occ.bottom, r.bottom) - Math.min(occ.top, r.top),
        );
      });
      const oKey = rectKey(occ);
      if (oKey !== lastOccKey) {
        lastOccKey = oKey;
        setOccupied(occ);
      }

      const vv = window.visualViewport;
      const nw = vv?.width ?? window.innerWidth;
      const nh = vv?.height ?? window.innerHeight;
      setViewport((prev) => (prev.w === nw && prev.h === nh ? prev : { w: nw, h: nh }));
    };

    const schedule = () => {
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        pending = 0;
        measure();
      });
    };

    measure();
    observer = new MutationObserver(schedule);
    // childList-only + subtree is enough to catch popover open/close, and
    // avoids firing on every keystroke (attribute mutations).
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);

    return () => {
      if (pending) window.cancelAnimationFrame(pending);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, [active, step]);


  // Persist current step for resume.
  useEffect(() => {
    if (!active) return;
    try {
      window.localStorage.setItem(STORAGE_STEP, String(stepIndex));
    } catch {
      // ignore
    }
  }, [active, stepIndex]);

  const advance = useCallback(() => {
    setNudge(null);
    setStepIndex((i) => {
      if (i >= STEPS.length - 1) {
        endTour("finish");
        return i;
      }
      return i + 1;
    });
  }, [endTour]);

  // Wire up advance triggers on the current target.
  useEffect(() => {
    if (!active || !step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;

    const check = (): boolean => {
      if (!step.validate) return true;
      const res = step.validate(el);
      if (!res.ok) {
        setNudge(res.nudge || null);
        return false;
      }
      if (res.nudge) setNudge(res.nudge);
      return true;
    };

    const onChange = () => {
      // Small delay so React state settles before we read values.
      window.setTimeout(() => {
        if (check()) advance();
      }, 50);
    };
    const onBlur = () => {
      if (check()) advance();
    };
    const onClick = () => {
      // For the final "continue" step: mark complete on click.
      window.setTimeout(() => advance(), 0);
    };

    if (step.advanceOn === "change") {
      // Selects render as buttons that expose aria-expanded/aria-activedescendant;
      // watch for the value changing via a mutation observer on the button text,
      // and also listen to click-then-selection via a document-level listener.
      const mo = new MutationObserver(() => {
        // The trigger's text changes from placeholder to the state name.
        if ((el as HTMLElement).innerText && !/choose/i.test((el as HTMLElement).innerText)) {
          onChange();
        }
      });
      mo.observe(el, { childList: true, subtree: true, characterData: true });
      return () => mo.disconnect();
    }
    if (step.advanceOn === "blur") {
      el.addEventListener("blur", onBlur);
      el.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") onBlur();
      });
      return () => {
        el.removeEventListener("blur", onBlur);
      };
    }
    if (step.advanceOn === "click") {
      el.addEventListener("click", onClick);
      return () => el.removeEventListener("click", onClick);
    }
  }, [active, step, advance]);

  // Work-ahead: if the user has already filled the current step's field
  // (e.g. typed income before we highlighted it), silently advance instead of
  // fighting them. Poll on rect changes so this reacts to any input.
  useEffect(() => {
    if (!active || !step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    // Only auto-skip for steps that have a validator (state, income). The
    // final "continue" step still requires an explicit click.
    if (!step.validate) return;
    const res = step.validate(el);
    if (res.ok) {
      const t = window.setTimeout(() => advance(), 150);
      return () => window.clearTimeout(t);
    }
  }, [active, step, advance, rect]);


  // Escape key & backdrop click always tear down.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour("skip");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, endTour]);

  if (!active || !onBuyers || !step) return null;

  const pad = 8;
  const spot = rect
    ? {
        x: Math.max(0, rect.left - pad),
        y: Math.max(0, rect.top - pad),
        w: rect.width + pad * 2,
        h: rect.height + pad * 2,
      }
    : null;

  // Smart placement: pick a side around the *occupied* region (target + open
  // popover + on-screen keyboard) that fits the coach card without overlapping.
  const isPhone = viewport.w < 480;
  const CARD_W = Math.min(isPhone ? 260 : 280, viewport.w - 24);
  const CARD_H = 170;
  const GAP = 10;
  const MARGIN = 12;
  const occ = occupied || rect;

  const intersects = (
    a: { top: number; left: number; w: number; h: number },
    b: { top: number; left: number; right: number; bottom: number },
  ) =>
    a.left < b.right &&
    a.left + a.w > b.left &&
    a.top < b.bottom &&
    a.top + a.h > b.top;

  let cardStyle: React.CSSProperties;
  if (occ) {
    const spaces = {
      right: viewport.w - occ.right - GAP - MARGIN,
      left: occ.left - GAP - MARGIN,
      below: viewport.h - occ.bottom - GAP - MARGIN,
      above: occ.top - GAP - MARGIN,
    };
    const clampY = (y: number) =>
      Math.max(MARGIN, Math.min(viewport.h - CARD_H - MARGIN, y));
    const clampX = (x: number) =>
      Math.max(MARGIN, Math.min(viewport.w - CARD_W - MARGIN, x));

    // Priority: beside on wide screens; otherwise above (dropdowns open below),
    // then below, and finally dock to the half opposite the occupied region.
    type Placement = "right" | "left" | "above" | "below";
    const order: Placement[] =
      viewport.w >= 720
        ? ["right", "left", "above", "below"]
        : isPhone
          ? ["above", "below", "right", "left"]
          : ["above", "below", "right", "left"];

    let top = MARGIN;
    let left = MARGIN;
    let placed = false;
    for (const p of order) {
      if (p === "right" && spaces.right >= CARD_W) {
        top = clampY(occ.top);
        left = occ.right + GAP;
        placed = true;
        break;
      }
      if (p === "left" && spaces.left >= CARD_W) {
        top = clampY(occ.top);
        left = occ.left - GAP - CARD_W;
        placed = true;
        break;
      }
      if (p === "above" && spaces.above >= CARD_H) {
        top = occ.top - GAP - CARD_H;
        left = clampX(occ.left);
        placed = true;
        break;
      }
      if (p === "below" && spaces.below >= CARD_H) {
        top = occ.bottom + GAP;
        left = clampX(occ.left);
        placed = true;
        break;
      }
    }
    if (!placed) {
      // No side fully fits: dock to the viewport edge in the half with the
      // most room, then push off the occupied rect if we still overlap.
      const midY = occ.top + occ.height / 2;
      if (viewport.h - midY >= midY) {
        top = viewport.h - CARD_H - MARGIN;
      } else {
        top = MARGIN;
      }
      left = clampX(occ.left);
      const box = { top, left, w: CARD_W, h: CARD_H };
      const occBox = {
        top: occ.top,
        left: occ.left,
        right: occ.right,
        bottom: occ.bottom,
      };
      if (intersects(box, occBox)) {
        if (occBox.top >= CARD_H + GAP + MARGIN) {
          top = occBox.top - GAP - CARD_H;
        } else if (viewport.h - occBox.bottom >= CARD_H + GAP + MARGIN) {
          top = occBox.bottom + GAP;
        } else if (occBox.left >= CARD_W + GAP + MARGIN) {
          left = occBox.left - GAP - CARD_W;
          top = clampY(occ.top);
        } else if (viewport.w - occBox.right >= CARD_W + GAP + MARGIN) {
          left = occBox.right + GAP;
          top = clampY(occ.top);
        }
      }
    }

    cardStyle = {
      position: "fixed",
      top,
      left,
      width: CARD_W,
      zIndex: 10001,
      transition: "top 140ms ease, left 140ms ease",
    };
  } else {
    cardStyle = {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      width: CARD_W,
      zIndex: 10001,
    };
  }


  return createPortal(
    <div aria-live="polite" style={{ pointerEvents: "none" }}>
      {/* Subtle indigo highlight ring around the active target. No dim backdrop
          — the page stays fully bright and interactive. */}
      {spot && (
        <div
          style={{
            position: "fixed",
            top: spot.y,
            left: spot.x,
            width: spot.w,
            height: spot.h,
            borderRadius: 10,
            border: "2px solid #5b5bd6",
            boxShadow: "0 0 0 4px rgba(91,91,214,0.15)",
            pointerEvents: "none",
            zIndex: 10000,
            transition: "top 140ms ease, left 140ms ease, width 140ms ease, height 140ms ease",
          }}
        />
      )}


      {/* Coach card */}
      <div
        role="dialog"
        aria-label={step.title}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...cardStyle,
          pointerEvents: "auto",
          background: "#f7f4ee",
          color: "#0c0e1a",
          border: "1px solid rgba(91,91,214,0.15)",
          borderRadius: 14,
          padding: 12,
          boxShadow: "0 16px 32px rgba(12,14,26,0.22)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >

        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "0.95rem",
            marginBottom: 4,
          }}
        >
          {step.title}
        </div>
        <div style={{ fontSize: "0.82rem", lineHeight: 1.4, color: "#4a4d63" }}>{step.hint}</div>
        {nudge && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 8px",
              background: "rgba(91,91,214,0.08)",
              borderRadius: 8,
              fontSize: "0.78rem",
              color: "#0c0e1a",
            }}
          >
            {nudge}
          </div>
        )}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >

          <button
            type="button"
            onClick={() => endTour("skip")}
            className="hover:opacity-90 active:opacity-75 transition-opacity duration-150 inline-flex items-center justify-center"
            style={{
              background: "#0c0e1a",
              border: "none",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
              minWidth: 44,
              padding: "10px 16px",
              borderRadius: 999,
            }}
          >
            Skip tour
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === stepIndex ? "#5b5bd6" : "rgba(12,14,26,0.2)",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#4a4d63" }}>
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export { STORAGE_COMPLETED as TOUR_STORAGE_KEY, QUERY_FLAG as TOUR_QUERY_FLAG };
