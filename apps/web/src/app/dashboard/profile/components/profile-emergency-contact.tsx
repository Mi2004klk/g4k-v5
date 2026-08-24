"use client";

import { AppIcon } from "@g4k/ui/components";
import { Card, Button } from "@g4k/ui/components";

export function ProfileEmergencyContactSection() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="phone" className="text-rose-500 w-5 h-5" />
            Emergency Contact
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Who to contact in case of an emergency.</p>
        </div>
        
        <div className="pl-0 sm:pl-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-50 dark:bg-neutral-800/30 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Not Provided</h3>
              <p className="text-xs text-neutral-500">Please add an emergency contact to ensure your safety and well-being at work.</p>
            </div>
            <Button
              variant="outline"
              className="border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-5 h-10 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Add Emergency Contact
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
