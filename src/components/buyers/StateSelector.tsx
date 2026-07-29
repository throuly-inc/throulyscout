import { useState } from "react";
import { statesData, StateData } from "@/lib/states";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapPin, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateSelectorProps {
  selectedState: StateData | null;
  onSelectState: (state: StateData) => void;
}

export function StateSelector({ selectedState, onSelectState }: StateSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a state"
            className="w-full h-12 justify-between text-base font-normal"
          >
            <span className="flex items-center gap-2 min-w-0">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
              {selectedState ? (
                <span className="truncate">
                  {selectedState.name}{" "}
                  <span className="text-muted-foreground">({selectedState.abbreviation})</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Select a state...</span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 bg-popover z-[100]"
          align="start"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command>
            <CommandInput placeholder="Search state..." className="h-10" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No state found.</CommandEmpty>
              <CommandGroup>
                {statesData.map((state) => (
                  <CommandItem
                    key={state.abbreviation}
                    value={`${state.name} ${state.abbreviation}`}
                    onSelect={() => {
                      onSelectState(state);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedState?.abbreviation === state.abbreviation
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span className="font-medium">{state.name}</span>
                    <span className="ml-2 text-muted-foreground">({state.abbreviation})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedState && (
        <div className="glass-card p-4 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{selectedState.name}</h4>
              <p className="text-xs text-muted-foreground">Market Overview</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Property Tax</span>
              <p className="font-medium text-foreground">{selectedState.avgPropertyTax}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Median Price</span>
              <p className="font-medium text-foreground">${(selectedState.medianHomePrice / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mortgage Rate</span>
              <p className="font-medium text-foreground">{selectedState.avgMortgageRate}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Closing Costs</span>
              <p className="font-medium text-foreground">{selectedState.avgClosingCost}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
