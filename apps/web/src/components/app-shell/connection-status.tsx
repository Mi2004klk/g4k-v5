import { useReverb } from "@/hooks/use-reverb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";

export function ConnectionStatus() {
  const { isConnected } = useReverb();

  if (isConnected) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-medium cursor-default shrink-0 transition-all shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="max-w-[100px] truncate">Offline</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Real-time connection lost — falling back to periodic refresh
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
