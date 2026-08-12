import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@g4k/ui/components";

export function WidgetInfo({ summary }: { summary: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Widget info"
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none"
            onClick={(e) => {
              // Stop propagation so it doesn't trigger widget clicks
              e.stopPropagation();
            }}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed z-50">
          {summary}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
