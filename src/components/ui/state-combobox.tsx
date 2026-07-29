import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { statesData } from "@/lib/states";

interface StateComboboxProps {
  value?: string;
  onChange: (name: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
}

/**
 * Searchable state selector. Type the beginning of a state name OR its two-letter
 * abbreviation (e.g. "NC", "tx") to filter. Arrow keys + Enter select, Escape closes.
 */
export function StateCombobox({
  value,
  onChange,
  className,
  placeholder = "Choose a state...",
  id,
}: StateComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = statesData.find((s) => s.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 bg-card"
        align="start"
        sideOffset={4}
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command
          filter={(itemValue, search) => {
            const q = search.toLowerCase().trim();
            if (!q) return 1;
            // itemValue encodes "name|abbr" so we can match either.
            const [name = "", abbr = ""] = itemValue.split("|");
            const n = name.toLowerCase();
            const a = abbr.toLowerCase();
            if (n.startsWith(q) || a === q || a.startsWith(q)) return 1;
            if (n.includes(q)) return 0.6;
            return 0;
          }}
        >
          <CommandInput placeholder="Search state or abbreviation..." />
          <CommandList className="max-h-[260px]">
            <CommandEmpty>No matching state</CommandEmpty>
            <CommandGroup>
              {statesData.map((s) => (
                <CommandItem
                  key={s.abbreviation}
                  value={`${s.name}|${s.abbreviation}`}
                  onSelect={() => {
                    onChange(s.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected?.abbreviation === s.abbreviation ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {s.name}
                  <span className="ml-auto text-xs text-muted-foreground">{s.abbreviation}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
