import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * MoneyInput — dollar-amount input with live thousands separators.
 *
 * Contract:
 * - `value` may be a number, a raw digit string, or an already-formatted string
 *   (e.g. "1,250,000" or "$1,250"). Anything non-digit is stripped internally.
 * - `onChange(raw)` fires with the RAW digit string ("1250000"), never the
 *   formatted display value. Downstream `Number(raw)` keeps working unchanged.
 * - Cursor position is preserved when commas are inserted while typing.
 * - `$` prefix is rendered inside the field; users don't type it. Pasting a
 *   value with `$` or commas parses cleanly.
 * - Only digits are accepted. Non-numeric keystrokes are dropped silently.
 * - Mobile numeric keypad via `inputMode="numeric"`.
 *
 * Drop-in replacement for the pattern:
 *   <div className="relative">
 *     <span className="absolute left-4 ...">$</span>
 *     <Input type="number" value={x} onChange={e => setX(e.target.value)} />
 *   </div>
 */
export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "inputMode"> {
  value: string | number | null | undefined;
  onChange: (rawDigits: string) => void;
  /** Show the "$" prefix inside the field. Defaults to true. */
  showDollarSign?: boolean;
  /** Optional suffix rendered on the right (e.g. "/month"). */
  suffix?: React.ReactNode;
}

function toDigits(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.replace(/[^0-9]/g, "");
}

function formatWithCommas(digits: string): string {
  if (!digits) return "";
  // Strip leading zeros while keeping a lone "0".
  const trimmed = digits.replace(/^0+(?=\d)/, "");
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Count digits in `str` up to (but not including) `caret`. */
function digitsBefore(str: string, caret: number): number {
  let n = 0;
  for (let i = 0; i < Math.min(caret, str.length); i++) {
    if (str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) n++;
  }
  return n;
}

/** Given a formatted string and a target digit count, return the caret index. */
function caretForDigitCount(formatted: string, targetDigits: number): number {
  if (targetDigits <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted.charCodeAt(i) >= 48 && formatted.charCodeAt(i) <= 57) {
      seen++;
      if (seen === targetDigits) return i + 1;
    }
  }
  return formatted.length;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, showDollarSign = true, suffix, className, onPaste, ...rest },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLInputElement | null>(null);
  const setRefs = (el: HTMLInputElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  };

  // The raw digit string is the source of truth. Formatting is a pure function of it.
  const rawDigits = toDigits(value);
  const display = formatWithCommas(rawDigits);

  // Restore caret after each re-format.
  const pendingCaretDigits = React.useRef<number | null>(null);
  React.useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el || pendingCaretDigits.current === null) return;
    const pos = caretForDigitCount(display, pendingCaretDigits.current);
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      // ignore (some input types don't support selection APIs)
    }
    pendingCaretDigits.current = null;
  }, [display]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const nextRaw = el.value;
    const caret = el.selectionStart ?? nextRaw.length;
    // How many digits were before the caret in the user's typed string?
    const digitsBeforeCaret = digitsBefore(nextRaw, caret);
    pendingCaretDigits.current = digitsBeforeCaret;
    onChange(toDigits(nextRaw));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow control keys, navigation, deletion, copy/paste, etc.
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.key.length !== 1 // arrows, backspace, tab, etc. have longer names
    ) {
      return;
    }
    // Silently drop any non-digit character.
    if (e.key < "0" || e.key > "9") {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      {showDollarSign && (
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base"
          aria-hidden="true"
        >
          $
        </span>
      )}
      <Input
        {...rest}
        ref={setRefs}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={(e) => {
          onPaste?.(e);
          // No special handling needed — onChange will normalize the pasted text.
        }}
        className={cn(showDollarSign && "pl-8", suffix && "pr-16", className)}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {suffix}
        </span>
      )}
    </div>
  );
});
