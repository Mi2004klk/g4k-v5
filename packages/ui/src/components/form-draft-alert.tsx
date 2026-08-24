import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { AppIcon } from "./icon/AppIcon";

export interface FormDraftAlertProps {
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
  title?: string;
  description?: string;
}

export function FormDraftAlert({ 
  onRestore, 
  onDiscard, 
  className = "mb-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900",
  title = "Draft Available",
  description = "You have an unsaved draft."
}: FormDraftAlertProps) {
  return (
    <Alert className={className}>
      <AlertTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm">
        <AppIcon name="history" size="sm" />
        {title}
      </AlertTitle>
      <AlertDescription className="text-blue-700/80 dark:text-blue-400 text-xs flex items-center justify-between mt-1">
        <span>{description}</span>
        <div className="space-x-2 shrink-0">
          <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={onRestore}>
            Restore
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40" 
            onClick={onDiscard}
          >
            Discard
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
