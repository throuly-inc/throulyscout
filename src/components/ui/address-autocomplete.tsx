import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export type PlaceDetails = {
  placeId?: string;
  formattedAddress: string;
  street: string;
  city: string;
  state: string;
  stateLong: string;
  zip: string;
  country: string;
  lat: number | null;
  lng: number | null;
};

type Prediction = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
};

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: PlaceDetails) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  /** Use formattedAddress instead of typed text on selection (default true) */
  useFormattedOnSelect?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address...",
  id,
  className,
  disabled,
  useFormattedOnSelect = true,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipNextSearchRef = useRef(false);

  // Click outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounced search
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 3) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("throulyscout-places-autocomplete", {
          body: { action: "search", input: value, sessionToken: sessionTokenRef.current },
        });
        if (error) throw error;
        const preds: Prediction[] = data?.predictions || [];
        setPredictions(preds);
        setOpen(preds.length > 0);
        setHighlight(0);
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  const choose = useCallback(
    async (p: Prediction) => {
      setOpen(false);
      skipNextSearchRef.current = true;
      onChange(useFormattedOnSelect ? p.text : value);
      try {
        const { data, error } = await supabase.functions.invoke("throulyscout-places-autocomplete", {
          body: { action: "details", placeId: p.placeId, sessionToken: sessionTokenRef.current },
        });
        if (error) throw error;
        const place = data as PlaceDetails;
        if (useFormattedOnSelect && place?.formattedAddress) {
          skipNextSearchRef.current = true;
          onChange(place.formattedAddress);
        }
        onSelect?.(place);
      } catch {
        // fallback: use prediction text only
      } finally {
        // refresh session token after a selection (Google billing)
        sessionTokenRef.current = crypto.randomUUID();
      }
    },
    [onChange, onSelect, useFormattedOnSelect, value]
  );

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          autoComplete="off"
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || predictions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, predictions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(predictions[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>
      {open && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          <ul className="max-h-72 overflow-y-auto py-1">
            {predictions.map((p, i) => (
              <li
                key={p.placeId}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(p);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "px-3 py-2 cursor-pointer flex items-start gap-2 text-sm",
                  i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.mainText || p.text}</div>
                  {p.secondaryText && (
                    <div className="text-xs text-muted-foreground truncate">{p.secondaryText}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border bg-muted/30">
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}
