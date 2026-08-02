import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { usePrivacy } from "@/contexts/PrivacyContext";

export function PrivacyIndicator() {
  const { isPrivateMode, togglePrivateMode, isSignedIn } = usePrivacy();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
            isPrivateMode
              ? "border-accent bg-accent/25 text-accent-foreground shadow-[0_0_12px_rgba(91,91,214,0.35)] hover:bg-accent/35 hover:shadow-[0_0_18px_rgba(91,91,214,0.45)]"
              : "border-transparent bg-transparent text-foreground hover:bg-foreground/5",
            "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:border-accent",
          )}
          aria-label="Private Mode"
          aria-pressed={isPrivateMode}
        >
          <span
            className={cn("relative flex h-2 w-2 mr-0.5", isPrivateMode && "animate-pulse")}
            aria-hidden="true"
          >
            {isPrivateMode ? (
              <>
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </>
            ) : (
              <span className="rounded-full h-2 w-2 bg-muted-foreground" />
            )}
          </span>
          <Shield
            className={cn(
              "w-3.5 h-3.5",
              isPrivateMode ? "text-accent" : "text-muted-foreground",
              "group-data-[state=open]:text-accent-foreground",
            )}
          />
          <span className="hidden sm:inline">
            {isPrivateMode ? "Private Mode" : "Private Mode Off"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-medium">
            {isPrivateMode ? (
              <Shield className="w-4 h-4 text-accent" />
            ) : (
              <ShieldOff className="w-4 h-4 text-muted-foreground" />
            )}
            {isPrivateMode ? "You're browsing anonymously" : "Private Mode is off"}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {isPrivateMode
              ? "Nothing you do is tracked or saved. Activity, calculator inputs, and results stay in this session only and aren't linked to your account."
              : isSignedIn
                ? "Your activity and saved scenarios sync to your account so you can pick up where you left off."
                : "Standard session behavior. Turn on Private Mode to browse without any tracking for this session."}
          </p>

          <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className={cn("w-4 h-4", isPrivateMode ? "text-accent" : "text-muted-foreground")} />
              <span className="text-xs font-medium">Private Mode</span>
            </div>
            <Switch
              checked={isPrivateMode}
              onCheckedChange={togglePrivateMode}
              aria-label="Toggle Private Mode"
            />
          </div>

          {!isSignedIn && (
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Your choice lasts for this browser session. Sign in to have it remembered on your account.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
